import { useState, useCallback, useRef, useEffect } from 'react';
import { branchInfo } from '../data/branchInfo';
import { parseAdvancedNLP, applyTypoCorrection } from '../utils/advancedNLP';
import { detectIntent } from '../utils/intentDetection';
import { translations } from '../data/translations';
import { submitOrder } from '../services/orderService';
import { fetchDynamicMenu } from '../services/menuService';
import { supabase } from '../lib/supabase';

const INITIAL_STATE = {
    step: 'INIT',
    language: null, // 'en' or 'ar'
    menu: null,     // DYNAMIC MENU DATA
    selectedMeal: null, // 'Breakfast', 'Lunch', 'Dinner', 'High Tea'
    selectedCuisine: null, // 'Fast Food', 'Desi', 'General' (General implies unfiltered or default)
    currentCategory: null,
    currentItem: null,
    cart: [],
    itemOffset: 0,
    allCategoryItems: [],
    pendingIntents: [],
    currentIntent: null
};

export function useBotEngine() {
    const [messages, setMessages] = useState([]);
    const [botState, setBotState] = useState(INITIAL_STATE);
    const [isTyping, setIsTyping] = useState(false);
    const hasInitialized = useRef(false);

    const addMessage = useCallback((text, sender = 'bot', type = 'text', options = null) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            sender,
            type,
            options,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const simulateTyping = (callback, delay = 300) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const handleUserMessage = (text) => {
        addMessage(text, 'user');
        simulateTyping(() => processInput(text));
    };

    const processSequentially = (intents, currentCart, currentLang, collectedMsgs = []) => {
        const t = translations[currentLang || 'en'];

        if (intents.length === 0) {
            if (collectedMsgs.length > 0) {
                addMessage(collectedMsgs.join('\n'), 'bot');
            }
            setTimeout(() => showOrderSummary(currentCart, currentLang), 500);
            return;
        }

        const nextIntent = intents[0];
        const remaining = intents.slice(1);
        const { menu } = botState;

        if (nextIntent.type === 'CATEGORY') {
            if (collectedMsgs.length > 0) {
                addMessage(collectedMsgs.join('\n'), 'bot');
            }

            const categoryId = nextIntent.data.id;

            // VERIFY category exists in loaded menu (Avoid hardcoded false positives)
            const exists = menu?.categories.find(c => c.id === categoryId);
            if (!exists) {
                // If it doesn't exist in loaded menu, recurse to next intent
                processSequentially(remaining, currentCart, currentLang, collectedMsgs);
                return;
            }



            let items = (menu?.items || {})[categoryId] || [];

            // FILTER ITEMS STRICTLY
            items = items.filter(item => {
                const { selectedMeal, selectedCuisine } = botState;

                // UNIVERSAL FILTER FIX:
                // If we are in 'General' mode (Custom Menus), SHOW EVERYTHING in this category
                if (selectedMeal === 'General') return true;

                if (!selectedMeal) return true; // Fallback

                const strictMealMatch = item.available_meals && item.available_meals.includes(selectedMeal);
                if (!strictMealMatch) return false;

                if (selectedMeal === 'Breakfast' || selectedMeal === 'High Tea') return true;

                const strictCuisineMatch = item.cuisine_type === selectedCuisine || item.cuisine_type === 'General' || !item.cuisine_type;
                return strictCuisineMatch;
            });


            if (items.length === 0) {
                // Skip empty category found via intent (unlikely if we filtered categories, but possible via direct text)
                // collectedMsgs.push("No items in this category for your selection."); 
                // actually better to just return or show message
                addMessage(currentLang === 'ar' ? "عذراً، لا توجد عناصر متاحة" : "Sorry, no items available here.", 'bot');
                return;
            }

            const allItems = items.map(item => ({ ...item, catId: categoryId }));

            // Get category title from dynamic menu
            const categoryObj = menu?.categories.find(c => c.id === categoryId);
            const catTitle = currentLang === 'ar' ? categoryObj?.title.ar : categoryObj?.title.en;

            setBotState(prev => ({
                ...prev,
                step: 'ITEMS_LIST',
                currentCategory: categoryId,
                itemOffset: 0,
                allCategoryItems: allItems,
                pendingIntents: remaining,
                currentIntent: nextIntent
            }));

            const hasQty = !!nextIntent.qty;
            const qty = nextIntent.qty || 1;

            let prompt = "";
            // Keep specialized phrasing for common categories if they exist
            if (categoryId.toLowerCase().includes('wrap')) {
                prompt = hasQty ? t.nlp_qty_wraps.replace('{qty}', qty) : t.nlp_browse_wraps;
            } else {
                const basePrompt = hasQty ? t.nlp_qty_category : t.nlp_browse_category;
                prompt = basePrompt.replace('{name}', catTitle || 'Category');
                if (hasQty) {
                    prompt = prompt.replace('{qty}', qty);
                }
            }

            addMessage(prompt, 'bot');

            setTimeout(() => {
                const itemsToShow = allItems.slice(0, 2);
                const buttons = itemsToShow.map(item => ({
                    id: `item_${item.id}`,
                    label: currentLang === 'ar' ? item.name.ar : item.name.en
                }));
                if (allItems.length > 2) buttons.push({ id: 'more_items', label: t.more });
                addMessage('', 'bot', 'button', buttons);
            }, 200);
            return;
        }

        if (nextIntent.type === 'ITEM') {
            const item = nextIntent.data;
            const qty = nextIntent.qty || 1;
            const action = nextIntent.action || 'ADD';
            const preference = nextIntent.preference;

            // Logic for spicy: Look at category title instead of hardcoded ID
            const { menu } = botState;
            const categoryObj = menu?.categories.find(c => c.id === item.catId);
            const isBurgerCat = categoryObj?.title.en.toLowerCase().includes('burger');
            const needsSpicy = isBurgerCat;

            const itemName = currentLang === 'ar' ? item.name.ar : item.name.en;

            if (action === 'REMOVE') {
                const newCart = [...currentCart];
                let removedCount = 0;

                // Find items matching ID and preference (if provided)
                for (let j = newCart.length - 1; j >= 0; j--) {
                    const cartItem = newCart[j];
                    // Compare IDs (handle potential string/number mismatch if needed)
                    const idMatch = String(cartItem.id) === String(item.id);
                    const prefMatch = !preference || (cartItem.preference === preference);

                    if (idMatch && prefMatch) {
                        newCart.splice(j, 1);
                        removedCount++;
                        if (removedCount === qty) break;
                    }
                }

                if (removedCount > 0) {
                    const prefLabel = preference === 'spicy' ? t.spicy : (preference === 'non-spicy' ? t.non_spicy : '');
                    const prefStr = (preference && needsSpicy) ? ` (${prefLabel})` : '';
                    collectedMsgs.push(`${currentLang === 'ar' ? 'تم حذف' : 'Removed'} ${removedCount}x ${itemName}${prefStr}`);
                } else {
                    collectedMsgs.push(`${currentLang === 'ar' ? 'لم يتم العثور على' : 'Could not find'} ${itemName} ${currentLang === 'ar' ? 'في سلتك' : 'in your cart'}`);
                }

                setBotState(prev => ({ ...prev, cart: newCart, pendingIntents: remaining, currentIntent: null }));
                processSequentially(remaining, newCart, currentLang, collectedMsgs);
                return;
            }

            if (!needsSpicy || preference) {
                // FORCE FRESH LOOKUP: Use latest price/stock from botState.menu
                let freshItem = item;
                if (botState.menu && botState.menu.items) {
                    const allItems = Object.values(botState.menu.items).flat();
                    const found = allItems.find(i => String(i.id) === String(item.id));
                    if (found) freshItem = found;
                }

                const itemWithPreference = (preference && needsSpicy) ? { ...freshItem, preference } : freshItem;
                const newCart = [...currentCart];
                for (let i = 0; i < qty; i++) newCart.push(itemWithPreference);

                const prefLabel = preference === 'spicy' ? t.spicy : (preference === 'non-spicy' ? t.non_spicy : '');
                const prefStr = (preference && needsSpicy) ? ` (${prefLabel})` : '';
                collectedMsgs.push(`${t.added_to_cart} ${qty}x ${itemName}${prefStr} ${t.to_your_cart}`);

                setBotState(prev => ({ ...prev, cart: newCart, pendingIntents: remaining, currentIntent: null }));
                processSequentially(remaining, newCart, currentLang, collectedMsgs);
            } else {
                if (collectedMsgs.length > 0) {
                    addMessage(collectedMsgs.join('\n'), 'bot');
                }
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_SPICY',
                    // Use fresh item here too if possible, but less critical for just asking spicy
                    currentItem: { ...item, qty },
                    pendingIntents: remaining,
                    currentIntent: nextIntent
                }));
                addMessage(`${t.how_would_you_like} ${itemName}?`, 'bot', 'button', [
                    { id: 'spicy_yes', label: t.spicy },
                    { id: 'spicy_no', label: t.non_spicy }
                ]);
            }
            return;
        }
    };

    const getOrderSummaryText = (cartToSummarize, currentLang) => {
        const t = translations[currentLang || 'en'];

        // 1. Group by category, then by item ID + preference
        const { menu } = botState;
        const grouped = {};
        cartToSummarize.forEach(item => {
            const catId = item.catId || 'other';
            if (!grouped[catId]) {
                const category = menu?.categories.find(c => c.id === catId);
                grouped[catId] = {
                    title: category ? (currentLang === 'ar' ? category.title.ar : category.title.en) : (currentLang === 'ar' ? 'أصناف أخرى' : 'Other Items'),
                    items: {}
                };
            }

            const key = item.id + (item.preference ? `_${item.preference}` : '');
            if (!grouped[catId].items[key]) {
                grouped[catId].items[key] = { ...item, qty: 0 };
            }
            grouped[catId].items[key].qty += 1;
        });

        let total = 0;
        let receiptText = `${t.order_summary}\n────────────────\n`;
        let globalIndex = 1;

        Object.keys(grouped).forEach(catId => {
            const group = grouped[catId];
            receiptText += `*📦 ${group.title}*\n`;

            Object.values(group.items).forEach((item) => {
                const lineTotal = item.price * item.qty;
                total += lineTotal;
                const prefLabel = item.preference === 'spicy' || item.preference === 'Spicy' ? t.spicy : (item.preference === 'non-spicy' || item.preference === 'Non-Spicy' ? t.non_spicy : '');
                const prefStr = item.preference ? ` (${prefLabel})` : '';
                const name = currentLang === 'ar' ? item.name.ar : item.name.en;
                receiptText += `  ${globalIndex++}. ${name}${prefStr}\n  ${item.qty} x ${item.price} = ${lineTotal} SAR\n`;
            });
            receiptText += '\n';
        });

        receiptText += `────────────────\n*${t.total}: ${total} SAR*`;
        return receiptText;
    };

    const showOrderSummary = (cartToSummarize, currentLang) => {
        const t = translations[currentLang || 'en'];
        if (cartToSummarize.length === 0) {
            addMessage(t.cart_empty, 'bot');
            return;
        }
        const summary = getOrderSummaryText(cartToSummarize, currentLang);
        addMessage(summary + `\n\n${t.order_completed}`, 'bot');
        setTimeout(() => {
            addMessage(t.add_more_prompt, 'bot', 'button', [
                { id: 'add_more', label: t.add_more },
                { id: 'cancel_order', label: t.cancel_order },
                { id: 'finish_order', label: t.finish_order }
            ]);
        }, 500);
        setBotState(prev => ({ ...prev, step: 'SUMMARY_MENU' }));
    };

    const processInput = (text) => {
        const {
            step, currentItem, cart, allCategoryItems, itemOffset,
            language, pendingIntents, currentIntent,
            currentItemToRemove, groupedRemovalItems, removeOffset
        } = botState;

        // 1. Normalizing Eastern Arabic digits (٠-٩) to Western Arabic digits (0-9)
        let normalizedInput = text;
        const easternDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
        easternDigits.forEach((regex, i) => {
            normalizedInput = normalizedInput.replace(regex, i);
        });

        // 2. Language Detection & Initialization (Prioritize for typo correction)
        let currentLang = language;
        if (!currentLang) {
            const isArabic = /[\u0600-\u06FF]/.test(text);
            currentLang = isArabic ? 'ar' : 'en';
            setBotState(prev => ({ ...prev, language: currentLang }));

            // If it's the very first message ever, show welcome and stop
            if (step === 'INIT') {
                const t = translations[currentLang];
                const welcomeMsg = t.welcome + branchInfo.branches.map((b, i) => `${i + 1}. ${b.name}\n   ${b.phone}`).join('\n\n') + t.choose_option;
                addMessage(welcomeMsg, 'bot', 'button', [{ id: 'order_text', label: t.order_text }, { id: 'order_voice', label: t.order_voice }]);
                return;
            }
        }

        // 3. APPLY GLOBAL TYPO CORRECTION (Critical for "compelte", "eniter", etc.)
        const standardizedInput = applyTypoCorrection(normalizedInput, currentLang);
        const cleanText = standardizedInput.trim();
        const t = translations[currentLang];

        // ============================================
        // 1. BUTTON & COMMAND HANDLING (PRIORITY)
        // ============================================

        if (cleanText === 'order_text' || cleanText === 'order_voice') {
            const isVoice = cleanText === 'order_voice';

            // Ensure menu is loaded
            if (!botState.menu) {
                // Fetch default (Riyadh) if no branch logic. 
                // In production, this should be properly waited or pre-loaded.
                fetchDynamicMenu(branchInfo.branches[0].id).then(dynamicMenu => {
                    setBotState(prev => ({ ...prev, menu: dynamicMenu }));

                    // RE-RUN LOGIC with loaded menu (Recursive call with same text to proceed)
                    processInput(cleanText);
                });
                return;
            }

            // SMART FLOW DETECTION:
            // Check if we actually have distinct meal times in the menu
            // We look at all items to see if they use 'available_meals'
            const allItems = Object.values(botState.menu.items || {}).flat();
            const allMeals = new Set();

            allItems.forEach(item => {
                if (item.available_meals && Array.isArray(item.available_meals)) {
                    item.available_meals.forEach(m => allMeals.add(m));
                }
            });

            // If we have standard meals like "Breakfast", "Lunch", etc. show them.
            // If we have NO meal times (custom menu), SKIP to categories.
            if (allMeals.size > 0) {
                // Generate Dynamic Meal Buttons
                const mealButtons = Array.from(allMeals).map(m => ({
                    id: `meal_${m.toLowerCase().replace(/\s+/g, '_')}`,
                    label: translations[currentLang][m.toLowerCase().replace(/\s+/g, '_')] || m // Fallback to raw English name
                }));

                // Add sorting or specific ordering if needed (e.g. Breakfast first)
                // For now, simple dynamic list

                addMessage(t.select_meal, 'bot', 'button', mealButtons);

                if (isVoice) {
                    setBotState(prev => ({ ...prev, step: 'MEAL_SELECTION', voiceTrigger: Date.now() }));
                } else {
                    setBotState(prev => ({ ...prev, step: 'MEAL_SELECTION' }));
                }
            } else {
                // AUTO-SKIP MEAL SELECTION -> Go Straight to Categories
                setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', selectedMeal: 'General', selectedCuisine: 'General' }));
                setTimeout(() => showCategories('General', 'General'), 500);
            }
            return;
        }

        if (step === 'MEAL_SELECTION') {
            const lowerText = cleanText.toLowerCase();
            let selectedMeal = null;

            // Dynamic matching against loaded meals
            const allItems = Object.values(botState.menu.items || {}).flat();
            const allMeals = new Set();
            allItems.forEach(item => {
                if (item.available_meals && Array.isArray(item.available_meals)) {
                    item.available_meals.forEach(m => allMeals.add(m));
                }
            });

            // Check if input matches any known meal
            for (const meal of allMeals) {
                if (lowerText.includes(meal.toLowerCase()) || cleanText === `meal_${meal.toLowerCase().replace(/\s+/g, '_')}`) {
                    selectedMeal = meal;
                    break;
                }
            }

            if (selectedMeal) {
                setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', selectedMeal, selectedCuisine: 'General' }));
                setTimeout(() => showCategories(selectedMeal, 'General'), 500);
            } else {
                addMessage(t.didnt_understand, 'bot');
            }
            return;
        }

        if (step === 'CUISINE_SELECTION') {
            const lowerText = cleanText.toLowerCase();
            let selectedCuisine = null;

            if (lowerText.includes('fast') || cleanText === 'cuisine_fast') selectedCuisine = 'Fast Food';
            else if (lowerText.includes('desi') || lowerText.includes('pakistani') || lowerText.includes('indian') || cleanText === 'cuisine_desi') selectedCuisine = 'Desi';

            if (selectedCuisine) {
                setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', selectedCuisine }));
                setTimeout(() => showCategories(botState.selectedMeal, selectedCuisine), 500);
            } else {
                addMessage(t.didnt_understand, 'bot');
            }
            return;
        }

        const normalizedText = cleanText.toLowerCase().replace(/\s+/g, ' ');

        // ============================================
        // 0. DYNAMIC PRIORITY NLP (Match against loaded categories)
        // ============================================
        if (botState.menu && botState.menu.categories) {
            const matchedCategory = botState.menu.categories.find(cat => {
                const enTitle = cat.title.en.toLowerCase();
                const arTitle = cat.title.ar ? cat.title.ar.toLowerCase() : '';

                // Check if user input *contains* the category name
                // e.g. "Show me chef specials" contains "chef specials"
                return normalizedText.includes(enTitle) || (arTitle && normalizedText.includes(arTitle));
            });

            if (matchedCategory) {
                // Treat as if user clicked the category button
                const catId = matchedCategory.id;
                const items = (botState.menu.items || {})[catId] || [];

                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: catId, itemOffset: 0, allCategoryItems: items }));
                const title = language === 'ar' ? matchedCategory.title.ar : matchedCategory.title.en;
                addMessage(`${t.here_are} ${title}:`, 'bot');
                setTimeout(() => {
                    const itemsToShow = items.slice(0, 2);
                    const buttons = itemsToShow.map(item => ({ id: `item_${item.id}`, label: language === 'ar' ? item.name.ar : item.name.en }));
                    if (items.length > 2) buttons.push({ id: 'more_items', label: t.more });
                    addMessage('', 'bot', 'button', buttons);
                }, 200);
                return;
            }
        }

        // Dynamic Category Handling (Button Click)
        if (normalizedText.startsWith('cat_')) {
            const catId = cleanText.replace('cat_', '');
            const { menu } = botState;
            const categoryObj = menu?.categories.find(c => c.id === catId);
            const allItems = (menu?.items || {})[catId] || [];

            if (categoryObj) {
                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: catId, itemOffset: 0, allCategoryItems: allItems }));
                const title = language === 'ar' ? categoryObj.title.ar : categoryObj.title.en;
                addMessage(`${t.here_are} ${title}:`, 'bot');
                setTimeout(() => {
                    const itemsToShow = allItems.slice(0, 2);
                    const buttons = itemsToShow.map(item => ({ id: `item_${item.id}`, label: language === 'ar' ? item.name.ar : item.name.en }));
                    if (allItems.length > 2) buttons.push({ id: 'more_items', label: t.more });
                    addMessage('', 'bot', 'button', buttons);
                }, 200);
                return;
            }
        }

        if (cleanText === 'more_items') {
            const newOffset = itemOffset + 2;
            setBotState(prev => ({ ...prev, itemOffset: newOffset }));
            const itemsToShow = allCategoryItems.slice(newOffset, newOffset + 2);
            const buttons = itemsToShow.map(item => ({ id: `item_${item.id}`, label: language === 'ar' ? item.name.ar : item.name.en }));
            if (allCategoryItems.length > newOffset + 2) buttons.push({ id: 'more_items', label: t.more });
            addMessage('', 'bot', 'button', buttons);
            return;
        }

        if (cleanText.startsWith('item_')) {
            const itemId = cleanText.replace('item_', '');
            const selectedItem = allCategoryItems.find(item => item.id === itemId);
            if (selectedItem) {
                // OUT OF STOCK CHECK
                if (selectedItem.status === 'Out of Stock') {
                    const itemName = language === 'ar' ? selectedItem.name.ar : selectedItem.name.en;
                    const msg = language === 'ar'
                        ? `نعتذر بشدة، ${itemName} غير متوفر حالياً. يمكنك الطلب من باقي أصناف القائمة.`
                        : `We are very sorry, ${itemName} is currently out of stock. You can order from our other menu options.`;

                    addMessage(msg, 'bot');

                    // Show relevant categories again
                    setTimeout(() => {
                        showCategories(botState.selectedMeal, botState.selectedCuisine);
                    }, 500);
                    return;
                }

                const needsSpicy = selectedItem.catId === 'burgers';
                const itemName = language === 'ar' ? selectedItem.name.ar : selectedItem.name.en;
                const knownQty = (currentIntent?.type === 'CATEGORY' || currentIntent?.type === 'ITEM') ? currentIntent.qty : null;

                if (knownQty) {
                    if (needsSpicy) {
                        setBotState(prev => ({ ...prev, step: 'ITEM_SPICY', currentItem: { ...selectedItem, qty: knownQty } }));
                        addMessage(`${t.how_would_you_like} ${itemName}?`, 'bot', 'button', [{ id: 'spicy_yes', label: t.spicy }, { id: 'spicy_no', label: t.non_spicy }]);
                    } else {
                        const newCart = [...cart];
                        for (let i = 0; i < knownQty; i++) newCart.push(selectedItem);
                        const statusMsg = `${t.added_to_cart} ${knownQty}x ${itemName} ${t.to_your_cart}`;
                        setBotState(prev => ({ ...prev, cart: newCart, currentItem: null, currentIntent: null }));
                        setTimeout(() => processSequentially(pendingIntents, newCart, language, [statusMsg]), 500);
                    }
                } else if (needsSpicy) {
                    setBotState(prev => ({ ...prev, step: 'ITEM_QTY', currentItem: selectedItem }));
                    addMessage(`${t.how_many} ${itemName} ${language === 'ar' ? '؟' : 'would you like?'}`, 'bot', 'button', [{ id: 'qty_1', label: '1' }, { id: 'qty_2', label: '2' }, { id: 'qty_3', label: '3' }, { id: 'qty_4', label: '4' }, { id: 'qty_more', label: t.more }]);
                } else {
                    setBotState(prev => ({ ...prev, step: 'ITEM_QTY', currentItem: selectedItem }));
                    addMessage(`${t.how_many} ${itemName} ${language === 'ar' ? '؟' : 'would you like?'} ${t.type_qty || ''}`, 'bot');
                }
            }
            return;
        }

        if (cleanText.startsWith('qty_') && !cleanText.startsWith('qty_remove_')) {
            if (cleanText === 'qty_more') {
                setBotState(prev => ({ ...prev, step: 'ITEM_QTY_MANUAL' }));
                addMessage(t.type_qty_manual, 'bot');
                return;
            }
            if (!currentItem) return; // Safety check
            const qty = parseInt(cleanText.replace('qty_', ''));
            const needsSpicy = currentItem.catId === 'burgers';
            const itemName = currentLang === 'ar' ? currentItem.name.ar : currentItem.name.en;
            if (needsSpicy) {
                setBotState(prev => ({ ...prev, step: 'ITEM_SPICY', currentItem: { ...currentItem, qty } }));
                addMessage(`${t.how_would_you_like} ${itemName}?`, 'bot', 'button', [{ id: 'spicy_yes', label: t.spicy }, { id: 'spicy_no', label: t.non_spicy }]);
            } else {
                const newCart = [...cart];
                for (let i = 0; i < qty; i++) newCart.push(currentItem);
                const statusMsg = `${t.added_to_cart} ${qty}x ${itemName} ${t.to_your_cart}`;
                setBotState(prev => ({ ...prev, cart: newCart, step: 'ITEMS_LIST' }));
                setTimeout(() => processSequentially(pendingIntents, newCart, currentLang, [statusMsg]), 500);
            }
            return;
        }

        if (step === 'ITEM_SPICY') {
            if (cleanText === 'spicy_yes' || cleanText === 'spicy_no') {
                const preference = cleanText === 'spicy_yes' ? 'spicy' : 'non-spicy';
                const itemWithPref = { ...currentItem, preference };
                const qty = currentItem.qty || 1;
                const newCart = [...cart];
                for (let i = 0; i < qty; i++) newCart.push(itemWithPref);
                const prefLabel = preference === 'spicy' ? t.spicy : t.non_spicy;
                const itemName = language === 'ar' ? currentItem.name.ar : currentItem.name.en;
                const statusMsg = `${t.added_to_cart} ${qty}x ${itemName} (${prefLabel}) ${t.to_your_cart}`;
                setBotState(prev => ({ ...prev, cart: newCart, currentItem: null, currentIntent: null }));
                setTimeout(() => processSequentially(pendingIntents, newCart, language, [statusMsg]), 500);
                return;
            }

            // 2. Handle Split Preferences (e.g., "1 spicy and 2 non-spicy")
            // Apply typo correction FIRST to catch "spidy", "spisi", etc.
            const correctedTextForSplit = applyTypoCorrection(cleanText, language);
            const splitRegex = /(\d+)\s*(spicy|regular|non-spicy|non\s*spicy|non|normal|mild|regular|حار|عادي|سبايسي|بدون)/gi;
            const matches = [...correctedTextForSplit.matchAll(splitRegex)];

            if (matches.length > 0) {
                let totalAdded = 0;
                let summaryParts = [];
                const newCart = [...cart];

                matches.forEach(match => {
                    const qty = parseInt(match[1]);
                    const prefRaw = match[2].toLowerCase();
                    let preference = 'non-spicy';

                    // Correctly classify preference
                    const isSpicyWord = prefRaw.includes('spicy') || prefRaw.includes('حار') || prefRaw.includes('hot') || prefRaw.includes('سبايسي');
                    const isNegated = prefRaw.includes('non') || prefRaw.includes('بدون') || prefRaw.includes('regular') || prefRaw.includes('normal') || prefRaw.includes('عادي');

                    if (isSpicyWord && !isNegated) {
                        preference = 'spicy';
                    }

                    if (qty > 0) {
                        const itemWithPref = { ...currentItem, preference };
                        for (let i = 0; i < qty; i++) newCart.push(itemWithPref);
                        totalAdded += qty;
                        const prefLabel = preference === 'spicy' ? t.spicy : t.non_spicy;
                        summaryParts.push(`${qty}x ${prefLabel}`);
                    }
                });
                if (totalAdded > 0) {
                    const itemName = language === 'ar' ? currentItem.name.ar : currentItem.name.en;
                    const statusMsg = `${t.added_to_cart} ${itemName}: ${summaryParts.join(', ')}`;
                    setBotState(prev => ({ ...prev, cart: newCart, currentItem: null, currentIntent: null, step: 'ITEMS_LIST' }));
                    setTimeout(() => processSequentially(pendingIntents, newCart, language, [statusMsg]), 500);
                    return;
                }
            }
        }

        if (cleanText === 'add_more') {
            // Trigger the smart ordering flow instead of hardcoded meal selection
            processInput('order_text');
            return;
        }

        if (cleanText === 'finish_order') {
            if (cart.length === 0) {
                addMessage(t.cart_empty, 'bot');
                return;
            }
            const summary = getOrderSummaryText(cart, language);
            addMessage(summary, 'bot');
            setTimeout(() => {
                addMessage(t.choose_payment, 'bot', 'button', [{ id: 'pay_cash', label: t.cash }, { id: 'pay_online', label: t.online }]);
            }, 500);
            setBotState(prev => ({ ...prev, step: 'PAYMENT' }));
            return;
        }

        if (cleanText === 'pay_cash' || cleanText === 'pay_online') {
            const paymentMethod = cleanText === 'pay_cash' ? t.cash_on_delivery : t.online;
            const summary = getOrderSummaryText(cart, language);

            // Phase 1 Integration: Persist to Supabase
            submitOrder({ phone: '0591234567', name: 'WhatsApp Demo User' }, cart, language);

            addMessage(`*${t.order_confirmed}*\n\n${summary}\n\n${t.payment_method}: ${paymentMethod}\n\n${t.thank_you}`, 'bot');
            setTimeout(() => addMessage(t.new_order_prompt, 'bot', 'button', [{ id: 'new_order', label: t.new_order }]), 300);
            setBotState(prev => ({ ...prev, step: 'COMPLETE', cart: [] }));
            return;
        }

        if (cleanText === 'new_order') {
            setBotState(prev => ({
                ...INITIAL_STATE,
                menu: prev.menu,
                language: prev.language
            }));
            addMessage(t.choose_option, 'bot', 'button', [{ id: 'order_text', label: t.order_text }, { id: 'order_voice', label: t.order_voice }]);
            return;
        }

        if (cleanText === 'cancel_order') {
            addMessage(t.cancel_menu, 'bot', 'button', [{ id: 'cancel_go_back', label: t.go_back }, { id: 'cancel_all', label: t.cancel_all }, { id: 'cancel_item', label: t.cancel_item }]);
            setBotState(prev => ({ ...prev, step: 'CANCEL_MENU' }));
            return;
        }

        if (cleanText === 'cancel_all') {
            addMessage(t.cancel_success, 'bot');
            setTimeout(() => addMessage(t.new_order_prompt, 'bot', 'button', [{ id: 'new_order', label: t.new_order }]), 300);
            setBotState(prev => ({ ...prev, step: 'INIT', cart: [] }));
            return;
        }

        if (cleanText === 'cancel_item') {
            if (cart.length === 0) {
                addMessage(t.cart_empty, 'bot');
                return;
            }
            // Group items for removal menu
            const groupedForRemoval = [];
            cart.forEach(item => {
                const key = item.id + (item.preference ? `_${item.preference}` : '');
                const existing = groupedForRemoval.find(g => g.key === key);
                if (existing) {
                    existing.qty += 1;
                } else {
                    groupedForRemoval.push({ key, ...item, qty: 1 });
                }
            });

            setBotState(prev => ({ ...prev, step: 'REMOVE_ITEM', removeOffset: 0, groupedRemovalItems: groupedForRemoval }));

            addMessage(t.select_remove, 'bot');
            setTimeout(() => {
                const itemsToShow = groupedForRemoval.slice(0, 2);
                const buttons = itemsToShow.map(item => {
                    const name = currentLang === 'ar' ? item.name.ar : item.name.en;
                    const pref = item.preference ? ` (${currentLang === 'ar' ? (item.preference === 'spicy' ? t.spicy : t.non_spicy) : item.preference})` : '';
                    return { id: `remove_item_group_${item.key}`, label: `${t.remove} ${name}${pref}` };
                });

                if (groupedForRemoval.length > 2) {
                    buttons.push({ id: 'remove_more', label: t.more });
                } else {
                    buttons.push({ id: 'cancel_go_back', label: t.go_back });
                }
                addMessage('', 'bot', 'button', buttons);
            }, 200);
            return;
        }

        if (cleanText === 'remove_more') {
            if (!groupedRemovalItems) return;
            const newOffset = (removeOffset || 0) + 2;
            const hasMore = groupedRemovalItems.length > newOffset + 2;

            setBotState(prev => ({ ...prev, removeOffset: newOffset }));

            const itemsToShow = groupedRemovalItems.slice(newOffset, newOffset + 2);
            const buttons = itemsToShow.map(item => {
                const name = currentLang === 'ar' ? item.name.ar : item.name.en;
                const pref = item.preference ? ` (${currentLang === 'ar' ? (item.preference === 'spicy' ? t.spicy : t.non_spicy) : item.preference})` : '';
                return { id: `remove_item_group_${item.key}`, label: `${t.remove} ${name}${pref}` };
            });

            if (hasMore) {
                buttons.push({ id: 'remove_more', label: t.more });
            } else {
                buttons.push({ id: 'cancel_go_back', label: t.go_back });
            }
            addMessage('', 'bot', 'button', buttons);
            return;
        }

        if (cleanText.startsWith('remove_item_group_')) {
            if (!groupedRemovalItems) return;
            const key = cleanText.replace('remove_item_group_', '');
            const selectedGroup = groupedRemovalItems.find(g => g.key === key);
            if (selectedGroup) {
                setBotState(prev => ({ ...prev, step: 'ITEM_REMOVE_QTY', currentItemToRemove: selectedGroup }));
                const name = currentLang === 'ar' ? selectedGroup.name.ar : selectedGroup.name.en;
                const prefStr = selectedGroup.preference ? ` (${currentLang === 'ar' ? (selectedGroup.preference === 'spicy' ? t.spicy : t.non_spicy) : selectedGroup.preference})` : '';
                const prompt = (currentLang === 'ar' ? 'كم عدد {name}{pref} التي تريد حذفها؟ (المتوفر: {max})' : 'How many {name}{pref} would you like to remove? (Available: {max})')
                    .replace('{name}', name)
                    .replace('{pref}', prefStr)
                    .replace('{max}', selectedGroup.qty);

                const buttons = [];
                // WHATSAPP COMPLIANCE: 3 buttons max
                const maxButtons = 3;
                if (selectedGroup.qty <= maxButtons) {
                    for (let i = 1; i <= selectedGroup.qty; i++) {
                        buttons.push({ id: `qty_remove_${i}`, label: `${i}` });
                    }
                } else {
                    // Show [1, 2, All] if qty > 3
                    buttons.push({ id: `qty_remove_1`, label: '1' });
                    buttons.push({ id: `qty_remove_2`, label: '2' });
                    buttons.push({ id: `qty_remove_all`, label: currentLang === 'ar' ? 'الكل' : 'All' });
                }

                addMessage(prompt, 'bot', buttons.length > 0 ? 'button' : 'text', buttons);
            }
            return;
        }

        if (cleanText.startsWith('qty_remove_')) {
            if (!currentItemToRemove) return;
            let qtyToRemove = 0;
            if (cleanText === 'qty_remove_all') {
                qtyToRemove = currentItemToRemove.qty;
            } else {
                qtyToRemove = parseInt(cleanText.replace('qty_remove_', ''));
            }

            const newCart = [...cart];
            let removedCount = 0;
            for (let j = newCart.length - 1; j >= 0; j--) {
                const item = newCart[j];
                const key = item.id + (item.preference ? `_${item.preference}` : '');
                if (key === currentItemToRemove.key) {
                    newCart.splice(j, 1);
                    removedCount++;
                    if (removedCount === qtyToRemove) break;
                }
            }

            const name = currentLang === 'ar' ? currentItemToRemove.name.ar : currentItemToRemove.name.en;
            addMessage(`${currentLang === 'ar' ? 'تم حذف' : 'Removed'}: ${removedCount}x ${name}`, 'bot');

            if (newCart.length > 0) {
                const summary = getOrderSummaryText(newCart, currentLang);
                addMessage(`${t.remaining}:\n${summary}`, 'bot');
                setTimeout(() => {
                    addMessage(t.add_more_prompt, 'bot', 'button', [{ id: 'add_more', label: t.add_more }, { id: 'cancel_order', label: t.cancel_order }, { id: 'finish_order', label: t.finish_order }]);
                }, 500);
                setBotState(prev => ({ ...prev, step: 'SUMMARY_MENU', cart: newCart, currentItemToRemove: null, groupedRemovalItems: null }));
            } else {
                addMessage(t.cart_empty, 'bot');
                const categoryButtons = (botState.menu?.categories || []).map(cat => ({
                    id: `cat_${cat.id}`,
                    label: language === 'ar' ? cat.title.ar : cat.title.en
                }));
                setTimeout(() => {
                    addMessage(t.choose_category, 'bot');
                    addMessage(t.here_is_menu, 'bot', 'button', categoryButtons.slice(0, 3));
                }, 500);
                setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', cart: [], currentItemToRemove: null, groupedRemovalItems: null }));
            }
            return;
        }

        if (step === 'ITEM_REMOVE_QTY' && currentItemToRemove) {
            const qtyToRemove = parseInt(cleanText);
            if (!isNaN(qtyToRemove) && qtyToRemove > 0) {
                const newCart = [...cart];
                let removedCount = 0;
                for (let j = newCart.length - 1; j >= 0; j--) {
                    const item = newCart[j];
                    const key = item.id + (item.preference ? `_${item.preference}` : '');
                    if (key === currentItemToRemove.key) {
                        newCart.splice(j, 1);
                        removedCount++;
                        if (removedCount === qtyToRemove) break;
                    }
                }

                const name = currentLang === 'ar' ? currentItemToRemove.name.ar : currentItemToRemove.name.en;
                addMessage(`${currentLang === 'ar' ? 'تم حذف' : 'Removed'}: ${removedCount}x ${name}`, 'bot');

                if (newCart.length > 0) {
                    const summary = getOrderSummaryText(newCart, currentLang);
                    addMessage(`${t.remaining}:\n${summary}`, 'bot');
                    setTimeout(() => {
                        addMessage(t.add_more_prompt, 'bot', 'button', [{ id: 'add_more', label: t.add_more }, { id: 'cancel_order', label: t.cancel_order }, { id: 'finish_order', label: t.finish_order }]);
                    }, 500);
                    setBotState(prev => ({ ...prev, step: 'SUMMARY_MENU', cart: newCart, currentItemToRemove: null, groupedRemovalItems: null }));
                } else {
                    addMessage(t.cart_empty, 'bot');
                    setTimeout(() => {
                        addMessage(t.choose_category, 'bot');
                        addMessage(t.here_is_menu, 'bot', 'button', [{ id: 'cat_burgers_meals', label: t.burgers_meals }, { id: 'cat_sandwiches_wraps', label: t.sandwiches_wraps }, { id: 'cat_snacks_sides', label: t.snacks_sides }]);
                    }, 500);
                    setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', cart: [], currentItemToRemove: null, groupedRemovalItems: null }));
                }
            } else {
                addMessage(currentLang === 'ar' ? 'يرجى إدخال كمية صالحة' : 'Please enter a valid quantity', 'bot');
            }
            return;
        }

        if (cleanText === 'cancel_go_back') {
            const categoryButtons = (botState.menu?.categories || []).map(cat => ({
                id: `cat_${cat.id}`,
                label: language === 'ar' ? cat.title.ar : cat.title.en
            }));
            addMessage(t.here_is_menu, 'bot', 'button', categoryButtons.slice(0, 3));
            setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION' }));
            return;
        }

        // ============================================
        // 2. STATE-BASED TEXT HANDLING (SECOND PRIORITY)
        // ============================================

        if (step === 'ITEM_QTY' && currentItem) {
            const qty = parseInt(cleanText);
            if (!isNaN(qty) && qty > 0) {
                const needsSpicy = currentItem.catId === 'burgers';
                const itemName = language === 'ar' ? currentItem.name.ar : currentItem.name.en;
                if (needsSpicy) {
                    setBotState(prev => ({ ...prev, step: 'ITEM_SPICY', currentItem: { ...currentItem, qty } }));
                    addMessage(`${t.how_would_you_like} ${itemName}?`, 'bot', 'button', [{ id: 'spicy_yes', label: t.spicy }, { id: 'spicy_no', label: t.non_spicy }]);
                } else {
                    const newCart = [...cart];
                    for (let i = 0; i < qty; i++) newCart.push(currentItem);
                    const statusMsg = `${t.added_to_cart} ${qty}x ${itemName} ${t.to_your_cart}`;
                    setBotState(prev => ({ ...prev, cart: newCart, step: 'ITEMS_LIST', currentItem: null }));
                    setTimeout(() => processSequentially(pendingIntents, newCart, language, [statusMsg]), 500);
                }
            } else {
                addMessage(language === 'ar' ? 'يرجى إدخال كمية صالحة' : 'Please enter a valid quantity', 'bot');
            }
            return;
        }

        if (step === 'ITEM_QTY_MANUAL' && currentItem) {
            const qty = parseInt(cleanText);
            if (!isNaN(qty) && qty > 0) {
                const needsSpicy = currentItem.catId === 'burgers';
                const itemName = language === 'ar' ? currentItem.name.ar : currentItem.name.en;
                if (needsSpicy) {
                    setBotState(prev => ({ ...prev, step: 'ITEM_SPICY', currentItem: { ...currentItem, qty } }));
                    addMessage(`${t.how_would_you_like} ${itemName}?`, 'bot', 'button', [{ id: 'spicy_yes', label: t.spicy }, { id: 'spicy_no', label: t.non_spicy }]);
                } else {
                    const newCart = [...cart];
                    for (let i = 0; i < qty; i++) newCart.push(currentItem);
                    const statusMsg = `${t.added_to_cart} ${qty}x ${itemName} ${t.to_your_cart}`;
                    setBotState(prev => ({ ...prev, cart: newCart, step: 'ITEMS_LIST', currentItem: null }));
                    setTimeout(() => processSequentially(pendingIntents, newCart, language, [statusMsg]), 500);
                }
            } else {
                addMessage(language === 'ar' ? 'يرجى إدخال كمية صالحة' : 'Please enter a valid quantity', 'bot');
            }
            return;
        }

        // ============================================
        // 3. NATURAL LANGUAGE PROCESSING (FALLBACK)
        // ============================================

        if (/^[a-z]+_[a-z0-9_]+$/i.test(cleanText) || cleanText.startsWith('qty_')) {
            addMessage(t.didnt_understand, 'bot');
            addMessage(t.use_buttons, 'bot');
            return;
        }

        const explicitIntent = detectIntent(standardizedInput, currentLang, botState.menu);
        if (explicitIntent) {
            if (explicitIntent.intent === 'BROWSE_ALL_CATEGORIES') {
                addMessage('/Menu Image.jpeg', 'bot', 'image');

                const categoryButtons = (botState.menu?.categories || []).map(cat => ({
                    id: `cat_${cat.id}`,
                    label: language === 'ar' ? cat.title.ar : cat.title.en
                }));

                setTimeout(() => addMessage(t.here_is_menu, 'bot', 'button', categoryButtons.slice(0, 3)), 500);
                return;
            }
            if (explicitIntent.intent === 'FINISH_ORDER' && cart.length > 0) {
                const summary = getOrderSummaryText(cart, currentLang);
                addMessage(summary, 'bot');
                setTimeout(() => {
                    addMessage(t.choose_payment, 'bot', 'button', [{ id: 'pay_cash', label: t.cash }, { id: 'pay_online', label: t.online }]);
                }, 500);
                setBotState(prev => ({ ...prev, step: 'PAYMENT' }));
                return;
            }
            if (explicitIntent.intent === 'CANCEL_ORDER') {
                addMessage(t.cancel_menu, 'bot', 'button', [{ id: 'cancel_go_back', label: t.go_back }, { id: 'cancel_all', label: t.cancel_all }, { id: 'cancel_item', label: t.cancel_item }]);
                setBotState(prev => ({ ...prev, step: 'CANCEL_MENU' }));
                return;
            }
        }

        const nlpIntents = parseAdvancedNLP(standardizedInput, currentLang, botState.menu);
        if (nlpIntents.length > 0) {
            const combinedIntents = [...nlpIntents, ...pendingIntents];
            processSequentially(combinedIntents, cart, language);
            return;
        }

        // ============================================
        // SMART FALLBACK SEARCH (Last Resort)
        // ============================================
        // If NLP failed, check if they typed a specific item name directly
        if (botState.menu && botState.menu.items) {
            const allItems = Object.values(botState.menu.items).flat();
            // Fuzzy match: check if item name contains the user text
            const foundItem = allItems.find(item => {
                const enName = item.name.en.toLowerCase();
                const arName = item.name.ar ? item.name.ar.toLowerCase() : '';
                return enName.includes(normalizedText) || (arName && arName.includes(normalizedText));
            });

            if (foundItem) {
                const itemName = language === 'ar' ? foundItem.name.ar : foundItem.name.en;

                // OUT OF STOCK CHECK (Smart Search)
                if (foundItem.status === 'Out of Stock') {
                    const msg = language === 'ar'
                        ? `نعتذر بشدة، ${itemName} غير متوفر حالياً. يمكنك الطلب من باقي أصناف القائمة.`
                        : `We are very sorry, ${itemName} is currently out of stock. You can order from our other menu options.`;

                    addMessage(msg, 'bot');

                    // Show relevant categories again
                    setTimeout(() => {
                        showCategories(botState.selectedMeal, botState.selectedCuisine);
                    }, 500);
                    return;
                }

                setBotState(prev => ({ ...prev, step: 'ITEM_QTY', currentItem: foundItem }));
                addMessage(language === 'ar'
                    ? `نعم، لدينا ${itemName}! كم تريد أن تطلب؟`
                    : `Yes, we have ${itemName}! How many would you like?`,
                    'bot');
                return;
            }
        }

        // Truly unmatched - Polite Response
        const apologizeMsg = language === 'ar'
            ? `عذراً، "${cleanText}" غير موجود في القائمة اليوم.`
            : `Sorry, "${cleanText}" is not on our menu today.`;

        addMessage(apologizeMsg, 'bot');

        // Show relevant categories as helpful suggestion
        setTimeout(() => {
            showCategories(botState.selectedMeal, botState.selectedCuisine);
        }, 500);
    };

    // --- Dynamic Menu Sync Logic ---
    const refreshMenu = useCallback(async () => {
        const dynamicMenu = await fetchDynamicMenu();
        if (dynamicMenu) {
            setBotState(prev => ({ ...prev, menu: dynamicMenu }));
            return dynamicMenu;
        }
    }, []);

    useEffect(() => {
        refreshMenu();

        // Real-time Subscriptions for Menu Updates
        const itemsChannel = supabase
            .channel('menu-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => refreshMenu())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => refreshMenu())
            .subscribe();

        return () => {
            supabase.removeChannel(itemsChannel);
        };
    }, [refreshMenu]);

    const showCategories = (meal, cuisine) => {
        const { menu, language } = botState;
        if (!menu) return;

        console.log('🔍 showCategories called with:', { meal, cuisine });
        console.log('📋 Total categories:', menu.categories.length);
        console.log('📦 Items map keys:', Object.keys(menu.items || {}));

        const validCategories = menu.categories.filter(cat => {
            const items = (menu.items && menu.items[cat.id]) ? menu.items[cat.id] : [];
            console.log(`\n🔎 Checking category: ${cat.title.en} (${items.length} items)`);

            if (items.length > 0) {
                const firstItem = items[0];
                console.log('  📝 First item fields:', {
                    name: firstItem.name.en,
                    available_meals: firstItem.available_meals,
                    cuisine_type: firstItem.cuisine_type
                });
            }

            // Check if any item in this category fits the criteria
            const hasMatchingItems = items.some(item => {
                // BUG FIX: If meal is General, don't check available_meals
                if (meal === 'General') return true;

                const strictMealMatch = item.available_meals && item.available_meals.includes(meal);
                if (!strictMealMatch) return false;

                // Cuisine Check (Only for Lunch/Dinner)
                if (meal === 'Breakfast' || meal === 'High Tea') {
                    return true;
                }

                // Rule 2 & 3: Lunch/Dinner
                const strictCuisineMatch = item.cuisine_type === cuisine || item.cuisine_type === 'General' || !item.cuisine_type;
                return strictCuisineMatch;
            });

            console.log(`  ✅ Has matching items: ${hasMatchingItems}`);
            return hasMatchingItems;
        });

        console.log(`\n📊 Valid categories found: ${validCategories.length}`);

        if (validCategories.length === 0) {
            const t = translations[language || 'en'];
            addMessage(language === 'ar' ? "عذراً، لا توجد عناصر متاحة لهذا الاختيار." : "Sorry, no items available for this selection.", 'bot');
            return;
        }

        const buttons = validCategories.map(cat => ({
            id: `cat_${cat.id}`,
            label: language === 'ar' ? cat.title.ar : cat.title.en
        }));

        const t = translations[language || 'en'];
        addMessage(t.choose_category, 'bot', 'button', buttons);
    };

    if (!hasInitialized.current) { hasInitialized.current = true; }

    return {
        messages,
        isTyping,
        sendMessage: handleUserMessage,
        language: botState.language,
        voiceTrigger: botState.voiceTrigger,
        menuLoading: !botState.menu
    };
}
