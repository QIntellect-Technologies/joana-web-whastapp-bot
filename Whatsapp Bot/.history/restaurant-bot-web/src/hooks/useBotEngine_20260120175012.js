import { useState, useCallback, useEffect, useRef } from 'react';
import { menu } from '../data/menu';
import { branchInfo } from '../data/branchInfo';
import { translations } from '../data/translations';

const INITIAL_STATE = {
    language: null, // 'en' | 'ar'
    step: 'INIT',
    currentCategory: null,
    currentItem: null,
    cart: [],
    itemQueue: [], // Queue for multi-item orders
    pendingResolution: null // { qty: 3, catId: 'drinks' } - For resolving "3 drinks"
};

export function useBotEngine() {
    const [messages, setMessages] = useState([]);
    const [botState, setBotState] = useState(INITIAL_STATE);
    const [isTyping, setIsTyping] = useState(false);
    const hasInitialized = useRef(false);

    const addMessage = useCallback((text, sender = 'bot', type = 'text', options = null, image = null) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            sender,
            type,
            options,
            image,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const simulateTyping = (callback, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const regexMatch = (input, keyword) => input.toLowerCase().includes(keyword.toLowerCase());

    // --- HELPER: Levenshtein Distance for Fuzzy Matching ---
    const levenshtein = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    // --- HELPER: Parse Arabic Numerals ---
    const parseArabicNumbers = (str) => {
        return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    };

    // --- HELPER: Robust Item Search ---
    const findBestMatchItem = (text, lang) => {
        let bestMatch = null;
        let minDist = Infinity;
        const threshold = 3; // Approx 3 typos allowed

        // Flatten items
        const allItems = [];
        Object.keys(menu.items).forEach(cat => {
            menu.items[cat].forEach(item => allItems.push({ ...item, catId: cat }));
        });

        allItems.forEach(item => {
            // Check against English and Arabic names
            const nameEn = item.name.en.toLowerCase();
            const nameAr = item.name.ar;
            const search = text.toLowerCase();

            // Direct inclusion (fast path)
            if (nameEn.includes(search) || nameAr.includes(search)) {
                if (!bestMatch || search.length > bestMatch.matchedLen) {
                    bestMatch = { item, score: 0, matchedLen: search.length }; // Exact substring match wins
                    minDist = 0;
                }
            }
            // Fuzzy match if no exact match found yet or distance is better
            else if (minDist > 0) { // Only check fuzzy if we don't have a solid inclusion match
                const distEn = levenshtein(search, nameEn);
                // Normalize distance by length to handle short vs long words
                if (distEn <= threshold && distEn < minDist) {
                    minDist = distEn;
                    bestMatch = { item, score: distEn };
                }
            }
        });
        return bestMatch ? bestMatch.item : null;
    };

    // --- HELPER: Robust Category Search ---
    const findBestMatchCategory = (text, lang) => {
        const search = text.toLowerCase();
        let match = menu.categories.find(c => search.includes(c.title.en.toLowerCase()) || text.includes(c.title.ar));

        if (!match) {
            // Fuzzy
            let min = Infinity;
            menu.categories.forEach(c => {
                const d = levenshtein(search, c.title.en.toLowerCase());
                if (d < 3 && d < min) {
                    min = d;
                    match = c;
                }
            });
        }
        return match;
    };

    // --- HELPER: Word to Number Converter ---
    const textToNumber = (text) => {
        const smallNumbers = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'single': 1, 'double': 2, 'triple': 3,
            'واحد': 1, 'واحدة': 1, 'اثنين': 2, 'اثنان': 2, 'ثلاثة': 3, 'ثلاث': 3,
            'أربعة': 4, 'اربعة': 4, 'خمسة': 5, 'خمس': 5
        };

        const lower = text.toLowerCase().trim();
        if (smallNumbers[lower]) return smallNumbers[lower];

        const parsed = parseInt(text);
        return isNaN(parsed) ? null : parsed;
    };

    // --- HELPER: Natural Language Parser with Enhanced Matching ---
    const parseNaturalLanguageOrder = (text, lang) => {
        const cleanText = parseArabicNumbers(text).toLowerCase();

        // Enhanced pattern to match: "2 coffees", "add one burger", "give me 3 drinks"
        // Patterns: [quantity] [optional: "of"|"for"|"add"|"give me"] [item/category]
        const numberPattern = "\\d+|one|two|three|four|five|six|seven|eight|nine|ten|single|double|triple|واحد|واحدة|اثنين|اثنان|ثلاثة|ثلاث|أربعة|اربعة|خمسة|خمس";
        
        // More flexible pattern to capture quantity + item/category
        const intentRegex = new RegExp(`(${numberPattern})\\s+(?:of\\s+|for\\s+|add\\s+|give\\s+me\\s+)?([a-zA-Z\\s\\u0600-\\u06FF]+?)(?=\\s*(?:\\d|and|&|,|\\+|$|\\?))`, 'gi');

        const detectedIntents = [];
        let match;

        while ((match = intentRegex.exec(cleanText)) !== null) {
            const qtyRaw = match[1];
            const qty = textToNumber(qtyRaw) || 1;
            const rawText = match[2].trim();

            if (!rawText || rawText === 'and' || rawText === 'of' || rawText === 'for') continue;

            if (!lang) lang = 'en';

            // 1. Try Specific Item (highest priority)
            const item = findBestMatchItem(rawText, lang);
            if (item) {
                detectedIntents.push({ type: 'ITEM', data: item, qty });
                continue;
            }

            // 2. Try Category
            const cat = findBestMatchCategory(rawText, lang);
            if (cat) {
                detectedIntents.push({ type: 'CATEGORY', data: cat, qty });
            }
        }

        // Fallback: If regex matched nothing, try simple category search
        if (detectedIntents.length === 0) {
            const cat = findBestMatchCategory(cleanText, lang);
            if (cat) {
                detectedIntents.push({ type: 'CATEGORY', data: cat, qty: 0 });
            }
        }

        return detectedIntents;
    };

    const handleUserMessage = (text) => {
        addMessage(text, 'user');
        simulateTyping(() => {
            try {
                processInput(text);
            } catch (err) {
                console.error("Bot Engine Error:", err);
                addMessage("⚠️ Sorry, I encountered an error processing that. Let's go back to the menu.", 'bot');
                showCategories(botState.language || 'en');
            }
        });
    };

    // --- HELPER: Process Next Item in Queue ---
    // Returns true if an item was processed, false if queue empty
    const processNextQueueItem = (queue, t, lang, previousItemName = null) => {
        // Clear pending resolution just in case
        setBotState(prev => ({ ...prev, pendingResolution: null }));

        if (queue.length === 0) return false;
        const nextIntent = queue[0];
        const remainingQueue = queue.slice(1);

        // CASE 1: SPECIFIC ITEM (e.g. "3 Zinger")
        if (nextIntent.type === 'ITEM') {
            const nextItem = nextIntent.data;

            // Transitional Message?
            if (previousItemName) {
                const msg = t.nextStep.replace('{prev}', previousItemName).replace('{category}', nextItem.name[lang]);
                addMessage(msg, 'bot');
            }

            const preferenceWhitelist = ['1', '2', '5', '25', '26', '27'];
            const needsPref = preferenceWhitelist.includes(nextItem.id);

            if (needsPref) {
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_PREF',
                    currentItem: { ...nextItem, qty: nextIntent.qty },
                    itemQueue: remainingQueue
                }));
                addMessage(`${t.confirmAdd} ${nextItem.name[lang]} x${nextIntent.qty}`, 'bot');
                setTimeout(() => {
                    addMessage(t.choosePref, 'bot', 'button', [
                        { id: 'pref_spicy', label: t.spicy },
                        { id: 'pref_normal', label: t.nonSpicy }
                    ]);
                }, 500);
            } else {
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_CONFIRM',
                    currentItem: { ...nextItem, qty: nextIntent.qty },
                    itemQueue: remainingQueue
                }));
                addMessage(`${t.confirmAdd}\n*${nextItem.name[lang]}* x${nextIntent.qty}`, 'bot', 'button', [
                    { id: 'confirm_yes', label: t.yes },
                    { id: 'confirm_no', label: t.no }
                ]);
            }
        }

        // CASE 2: CATEGORY INTENT (e.g. "3 Drinks")
        if (nextIntent.type === 'CATEGORY') {
            const category = nextIntent.data;
            const qty = nextIntent.qty;

            // Set state to resolving this category
            setBotState(prev => ({
                ...prev,
                step: 'ITEMS_LIST',
                currentCategory: category.id,
                pendingResolution: { qty, catId: category.id }, // STORE INTENT
                itemQueue: remainingQueue
            }));

            // Conversational Prompt as BUTTON MESSAGE (User request: "button type not text")
            let promptText = "";
            if (previousItemName) {
                promptText = t.nextStep.replace('{prev}', previousItemName).replace('{category}', category.title[lang]);
            } else {
                promptText = t.stepPrompt.replace('{category}', category.title[lang]);
            }

            // We add a dummy or cancel button to make it a "Button Type" message
            addMessage(promptText, 'bot', 'button', [
                { id: 'cancel_queue', label: t.cancelOrder }
            ]);

            // Show items for selection (Accelerated)
            const items = menu.items[category.id] || [];
            items.forEach((item, index) => {
                setTimeout(() => {
                    addMessage(
                        `*${item.name[language]}*\n💰 ${item.price}`,
                        'bot',
                        'image',
                        [{ id: `add_${item.id}`, label: '➕ Add' }],
                        item.image
                    );
                }, index * 150 + 200); // reduced delay (was 200+400)
            });
        }

        return true;
    }

    // --- HELPER: Show Items for a Category ---
    const showItemsForCategory = (catId, lang, t, delay = 0) => {
        setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: catId }));
        const category = menu.categories.find(c => c.id === catId);

        setTimeout(() => {
            addMessage(`*${category.title[lang]}*`, 'bot');
            const items = menu.items[catId] || [];

            items.forEach((item, index) => {
                setTimeout(() => {
                    // Add Number Prefix for Numeric Selection
                    addMessage(
                        `*${index + 1}. ${item.name[lang]}*\n💰 ${item.price}`,
                        'bot',
                        'image',
                        [{ id: `add_${item.id}`, label: '➕ Add' }],
                        item.image
                    );
                }, index * 150 + 200);
            });

            setTimeout(() => {
                addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
            }, items.length * 150 + 300);
        }, delay);
    };

    // --- HELPER: Initiate Item Add Logic ---
    const initiateItemAdd = (selectedItem, t, lang) => {
        const preferenceWhitelist = ['1', '2', '5', '25', '26', '27'];
        const nextStep = preferenceWhitelist.includes(selectedItem.id) ? 'ITEM_PREF' : 'ITEM_QTY';

        setBotState(prev => ({
            ...prev,
            step: nextStep,
            currentItem: { ...selectedItem, qty: 1 }
        }));

        if (nextStep === 'ITEM_PREF') {
            addMessage(t.choosePref, 'bot', 'button', [
                { id: 'pref_spicy', label: t.spicy },
                { id: 'pref_normal', label: t.nonSpicy }
            ]);
        } else {
            addMessage(t.howMany, 'bot', 'button', [
                { id: 'qty_1', label: '1' },
                { id: 'qty_2', label: '2' },
                { id: 'qty_3', label: '3' },
                { id: 'qty_4', label: '4' },
                { id: 'type_qty', label: t.typeQuantity }
            ]);
        }
    };

    const processInput = (text) => {
        // ... (rest of processInput as previously defined)
        const { step, language, currentCategory, currentItem, cart, itemQueue, pendingResolution } = botState;
        const t = translations[language] || translations['en'];

        // --- NUMBER SELECTION HANDLER ---
        // If user types "1", "2" etc. and we are in a list view, select that item.
        // We check this BEFORE Global NLP (which looks for "2 drinks" qty) 
        // BUT we must be careful. "2" could be Qty or Selection.
        // Context is key:
        // If in CATEGORIES -> "1" is selection.
        // If in ITEMS_LIST -> "1" is selection (Select item 1 to add it).
        // If in ITEM_QTY -> "1" is Qty.

        // Helper to check if input is single number
        const isSingleNumber = /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/i.test(text);

        if (isSingleNumber && (step === 'CATEGORIES' || step === 'BRANCHES_LIST' || step === 'ITEMS_LIST')) {
            const num = textToNumber(text); // Use our helper
            if (num > 0) {
                const index = num - 1;

                // Handle Category Selection by Number
                if (step === 'CATEGORIES') {
                    if (menu.categories[index]) {
                        const catId = menu.categories[index].id;
                        // Trigger selection logic
                        showItemsForCategory(catId, language, t);
                        return;
                    }
                }

                // Handle Branch Selection by Number
                if (step === 'BRANCHES_LIST') {
                    if (branchInfo.branches[index]) {
                        const b = branchInfo.branches[index];
                        setBotState(prev => ({ ...prev, step: 'BRANCH_DETAIL' }));
                        const detailText = `📍 *${b.name}*\n🏠 ${b.address}\n📞 ${b.phone}`;
                        addMessage(detailText, 'bot', 'button', [
                            { id: 'call_now', label: `${t.call} (${b.phone})` },
                            { id: 'back_home', label: t.back },
                            { id: 'btn_menu', label: t.menu }
                        ]);
                        return;
                    }
                }

                // Handle Item Selection by Number (in Items List)
                if (step === 'ITEMS_LIST') {
                    const items = menu.items[currentCategory] || [];
                    if (items[index]) {
                        const selectedItem = items[index];
                        // Trigger Add Item Logic (Reuse logic below or extract)
                        // We will just let the flow continue to "selectedItem" check logic but we need to set it.
                        // Actually, let's manually trigger the item logic here to avoid state duplication issues
                        initiateItemAdd(selectedItem, t, language);
                        return;
                    }
                }
            }
        }

        // --- GLOBAL NAVIGATION HANDLERS ---
        // Catch-all for menu/branches buttons regardless of current step (unless typing QTY)
        if (step !== 'QTY_INPUT' && step !== 'ITEM_QTY') {
            if (text === 'btn_menu' || regexMatch(text, 'menu') || text === t.menu) {
                showCategories(language);
                return;
            }
            if (text === 'btn_branches' || regexMatch(text, 'branch') || text === t.branches) {
                setBotState(prev => ({ ...prev, step: 'BRANCHES_LIST' }));
                const branchButtons = branchInfo.branches.map(b => ({ id: `br_${b.id}`, label: b.name }));
                addMessage(t.selectBranch, 'bot', 'button', branchButtons);
                return;
            }
        }

        // --- GLOBAL: CHECK FOR NATURAL LANGUAGE ORDER (e.g. "2 drinks", "add burger") ---
        // We check this BEFORE specific step logic (except QTY input) to allow "Add X" anywhere
        if (step !== 'QTY_INPUT' && step !== 'ITEM_QTY' && step !== 'ITEM_PREF' && step !== 'ITEM_CONFIRM' && step !== 'LANGUAGE') {
            const nlpIntents = parseNaturalLanguageOrder(text, language);
            if (nlpIntents.length > 0) {
                // Filter out empty category matches (qty 0) unless it's the ONLY match?
                // Actually parseNaturalLanguageOrder returns Qty 0 for simple category matches.
                // We only want to hijack if there is a detected QTY > 0 or specific ITEM.

                const hasActionableIntent = nlpIntents.some(i => i.type === 'ITEM' || (i.type === 'CATEGORY' && i.qty > 0));

                if (hasActionableIntent) {
                    const first = nlpIntents[0];
                    const rest = nlpIntents.slice(1);
                    setBotState(prev => ({ ...prev, itemQueue: rest }));
                    processNextQueueItem([first, ...rest], t, language);
                    return;
                }
            }
        }

        // --- HELPER: Ask Confirmation ---
        const askConfirmation = (qty, t, lang) => {
            const finalQty = qty > 0 ? qty : 1;
            const updatedItem = { ...currentItem, qty: finalQty };

            setBotState(prev => ({ ...prev, step: 'ITEM_CONFIRM', currentItem: updatedItem }));

            addMessage(`${t.confirmAdd}\n*${updatedItem.name[lang]}* x${finalQty} ${updatedItem.selectedPref ? `(${updatedItem.selectedPref})` : ''}`, 'bot', 'button', [
                { id: 'confirm_yes', label: t.yes },
                { id: 'confirm_no', label: t.no }
            ]);
        }

        // Helper: Show Receipt
        const showReceipt = (currentCart, lang, payMethod) => {
            // Generate Receipt Logic
            const grouped = {};
            currentCart.forEach(item => {
                const key = `${item.id}_${item.selectedPref || ''}`;
                if (!grouped[key]) {
                    grouped[key] = { ...item, qty: 0 };
                }
                grouped[key].qty += 1;
            });

            let receiptText = `${t.orderSummary}:\n\n`;
            let total = 0;
            let index = 1;

            Object.values(grouped).forEach(g => {
                const lineTotal = g.price * g.qty;
                total += lineTotal;
                const prefText = g.selectedPref ? `(${g.selectedPref})` : '';

                receiptText += `${index}. ${g.name[lang]} ${prefText} x${g.qty} - ${lineTotal}\n`;
                index++;
            });

            receiptText += `\n💰 ${t.total}: ${total}\n💳 ${payMethod}`;

            addMessage(receiptText, 'bot', 'button', [
                { id: 'do_confirm', label: t.confirmOrderButton },
                { id: 'do_cancel', label: t.cancelOrder }
            ]);
        }

        // Global Reset
        if (regexMatch(text, 'hi') || regexMatch(text, 'start') || regexMatch(text, 'restart')) {
            setBotState({ ...INITIAL_STATE, step: 'LANGUAGE' });
            addMessage(translations.en.welcome, 'bot', 'button', [
                { id: 'lang_en', label: 'English' },
                { id: 'lang_ar', label: 'العربية' }
            ]);
            return;
        }

        if (step === 'LANGUAGE') {
            let lang = null;
            if (regexMatch(text, 'english') || text === 'lang_en') lang = 'en';
            if (regexMatch(text, 'arabic') || text.includes('العربية') || text === 'lang_ar') lang = 'ar';

            if (lang) {
                const nextT = translations[lang];
                setBotState(prev => ({ ...prev, language: lang, step: 'HOME' }));
                addMessage(nextT.selectedLang, 'bot');
                setTimeout(() => {
                    addMessage(nextT.mainMenu, 'bot', 'button', [
                        { id: 'btn_branches', label: nextT.branches },
                        { id: 'btn_menu', label: nextT.menu }
                    ]);
                }, 500);
            } else {
                addMessage("Please select a valid language.", 'bot');
            }
            return;
        }

        if (!language) return;

        // Home
        if (step === 'HOME') {
            // Note: NLP and Category naming are handled by Global NLP check above.
            // This block handles other Home-specific logic if any.
        }

        // Branch List
        if (step === 'BRANCHES_LIST') {
            const branchId = text.replace('br_', '');
            const branch = branchInfo.branches.find(b => b.id === branchId || b.name === text);

            if (branch) {
                setBotState(prev => ({ ...prev, step: 'BRANCH_DETAIL' }));
                const detailText = `📍 *${branch.name}*\n🏠 ${branch.address}\n📞 ${branch.phone}`;
                addMessage(detailText, 'bot', 'button', [
                    { id: 'call_now', label: `${t.call} (${branch.phone})` },
                    { id: 'back_home', label: t.back },
                    { id: 'btn_menu', label: t.menu }
                ]);
                return;
            }
        }

        if (text === 'back_home' || text === t.back) {
            setBotState(prev => ({ ...prev, step: 'HOME' }));
            addMessage(t.mainMenu, 'bot', 'button', [
                { id: 'btn_branches', label: t.branches },
                { id: 'btn_menu', label: t.menu }
            ]);
            return;
        }

        if (step === 'BRANCH_DETAIL') {
            if (text === 'call_now') {
                addMessage("📞 Ringing...", 'bot');
                return;
            }
        }

        // Categories Selection
        if (step === 'CATEGORIES') {
            const category = menu.categories.find(c => c.title[language] === text || c.id === text);
            if (category) {
                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: category.id }));
                addMessage(`*${category.title[language]}*`, 'bot');

                // Show items
                const items = menu.items[category.id] || [];
                items.forEach((item, index) => {
                    setTimeout(() => {
                        addMessage(
                            `*${item.name[language]}*\n💰 ${item.price}`,
                            'bot',
                            'image',
                            [{ id: `add_${item.id}`, label: '➕ Add' }],
                            item.image
                        );
                    }, index * 200);
                });

                setTimeout(() => {
                    addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
                }, items.length * 200 + 400);
                return;
            }
            if (text === 'back_cats' || text === t.back) {
                setBotState(prev => ({ ...prev, step: 'HOME' }));
                addMessage(t.mainMenu, 'bot', 'button', [
                    { id: 'btn_branches', label: t.branches },
                    { id: 'btn_menu', label: t.menu }
                ]);
                return;
            }

            // Handle Smart Category Search in CATEGORIES step
            const matchingCat = menu.categories.find(c =>
                text.toLowerCase().includes(c.title.en.toLowerCase()) ||
                text.includes(c.title.ar)
            );
            if (matchingCat) {
                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: matchingCat.id }));
                addMessage(`*${matchingCat.title[language]}*`, 'bot');
                const items = menu.items[matchingCat.id] || [];
                items.forEach((item, index) => {
                    setTimeout(() => {
                        addMessage(
                            `*${item.name[language]}*\n💰 ${item.price}`,
                            'bot',
                            'image',
                            [{ id: `add_${item.id}`, label: '➕ Add' }],
                            item.image
                        );
                    }, index * 200);
                });
                setTimeout(() => {
                    addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
                }, items.length * 200 + 400);
                return;
            }
        }

        // Item Selection & Fallback Handling
        if (['CATEGORIES', 'ITEMS_LIST', 'HOME', 'BRANCH_DETAIL', 'BRANCHES_LIST'].includes(step) || step.includes('MENU')) {
            // Primarily handle button clicks "add_ID" here
            // Text search is ALREADY handled by Global NLP at the top of processInput
            if (text.startsWith('add_')) {
                const itemId = text.replace('add_', '');
                let selectedItem = null;
                Object.keys(menu.items).forEach(catId => {
                    if (selectedItem) return;
                    const match = menu.items[catId].find(i => i.id === itemId);
                    if (match) selectedItem = match;
                });

                if (selectedItem) {
                    // IF we are resolving a category (e.g. from "2 drinks")
                    if (pendingResolution) {
                        const selectedQty = pendingResolution.qty;
                        const preferenceWhitelist = ['1', '2', '5', '25', '26', '27'];
                        const needsPref = preferenceWhitelist.includes(selectedItem.id);

                        if (needsPref) {
                            setBotState(prev => ({
                                ...prev,
                                step: 'ITEM_PREF',
                                currentItem: { ...selectedItem, qty: selectedQty },
                                pendingResolution: null
                            }));
                            addMessage(t.choosePref, 'bot', 'button', [
                                { id: 'pref_spicy', label: t.spicy },
                                { id: 'pref_normal', label: t.nonSpicy }
                            ]);
                        } else {
                            setBotState(prev => ({
                                ...prev,
                                step: 'ITEM_CONFIRM',
                                currentItem: { ...selectedItem, qty: selectedQty },
                                pendingResolution: null
                            }));
                            addMessage(`${t.confirmAdd}\n*${selectedItem.name[language]}* x${selectedQty}`, 'bot', 'button', [
                                { id: 'confirm_yes', label: t.yes },
                                { id: 'confirm_no', label: t.no }
                            ]);
                        }
                    } else {
                        // Standard Add via UI
                        initiateItemAdd(selectedItem, t, language);
                    }
                    return;
                }
            }
        }

        if (step === 'ITEMS_LIST') {
            if (text === 'back_cats') {
                showCategories(language);
                return;
            }
        }

        // Item Pref
        if (step === 'ITEM_PREF') {
            const pref = (regexMatch(text, 'spicy') || text === t.spicy) ? t.spicy : t.nonSpicy;
            const updatedItem = { ...currentItem, selectedPref: pref || t.nonSpicy };

            if (updatedItem.qty && updatedItem.qty > 1) {
                askConfirmation(updatedItem.qty, t, language);
            } else {
                // Ask Quantity
                setBotState(prev => ({ ...prev, step: 'ITEM_QTY', currentItem: updatedItem }));
                addMessage(t.howMany, 'bot', 'button', [
                    { id: 'qty_1', label: '1' },
                    { id: 'qty_2', label: '2' },
                    { id: 'qty_3', label: '3' },
                    { id: 'qty_4', label: '4' },
                    { id: 'type_qty', label: t.typeQuantity }
                ]);
            }
            return;
        }

        // Quantity Selection
        if (step === 'ITEM_QTY') {
            if (text === 'type_qty' || text === t.typeQuantity) {
                setBotState(prev => ({ ...prev, step: 'QTY_INPUT' }));
                addMessage(t.enterQuantity, 'bot');
                return;
            }

            let qty = 1;
            if (text.startsWith('qty_')) {
                qty = parseInt(text.replace('qty_', ''));
            } else {
                const cleanText = parseArabicNumbers(text);
                const parsed = parseInt(cleanText);
                if (!isNaN(parsed) && parsed > 0) qty = parsed;
            }

            askConfirmation(qty, t, language);
            return;
        }

        if (step === 'QTY_INPUT') {
            const cleanText = parseArabicNumbers(text);
            const qty = parseInt(cleanText);
            if (!isNaN(qty) && qty > 0) {
                askConfirmation(qty, t, language);
            } else {
                addMessage("Please enter a valid number (e.g., 1, 2, 5).", 'bot');
            }
            return;
        }

        // Confirm Add (Actual logic)
        if (step === 'ITEM_CONFIRM') {
            if (text === 'confirm_yes' || text === t.yes || regexMatch(text, 'yes')) {
                const finalQty = currentItem.qty;
                const newItems = Array(finalQty).fill(currentItem);
                const newCart = [...cart, ...newItems]; // Actual Addition

                const total = newCart.reduce((acc, i) => acc + i.price, 0);

                // CHECK QUEUE
                const hasMore = itemQueue.length > 0;

                setBotState(prev => ({
                    ...prev,
                    cart: newCart,
                    step: hasMore ? 'QUEUE_PROCESSING' : 'CART_DECISION',
                    currentItem: null
                }));

                // Running Cart Summary
                const grouped = {};
                newCart.forEach(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    if (!grouped[key]) grouped[key] = { ...item, qty: 0 };
                    grouped[key].qty += 1;
                });

                let cartListStr = "";
                Object.values(grouped).forEach(g => {
                    const prefText = g.selectedPref ? `(${g.selectedPref})` : '';
                    cartListStr += `- ${g.qty}x ${g.name[language]} ${prefText}\n`;
                });

                const currentItemDetail = `${finalQty}x ${currentItem.name[language]} ${currentItem.selectedPref ? `(${currentItem.selectedPref})` : ''} - ${(currentItem.price * finalQty).toFixed(2)}`;

                const msg = language === 'en'
                    ? `✅ *Added to your order:*\n${currentItemDetail}\n\n${t.currentCart}\n${cartListStr}\n💰 *Current Total:* ${total.toFixed(2)}`
                    : `✅ *تمت الإضافة للطلب:*\n${currentItemDetail}\n\n${t.currentCart}\n${cartListStr}\n💰 *الإجمالي الحالي:* ${total.toFixed(2)}`;

                addMessage(msg, 'bot');

                if (hasMore) {
                    setTimeout(() => {
                        processNextQueueItem(itemQueue, t, language, currentItem.name[language]);
                    }, 1000);
                } else {
                    setTimeout(() => {
                        addMessage(t.orderMore, 'bot', 'button', [
                            { id: 'order_more', label: t.yesOrderMore },
                            { id: 'finish_order', label: t.finishOrder }
                        ]);
                    }, 800);
                }
                return;
            }
            if (text === 'confirm_no' || text === t.no) {
                const hasMore = itemQueue.length > 0;
                addMessage(t.itemCancelled, 'bot');
                if (hasMore) {
                    setTimeout(() => {
                        processNextQueueItem(itemQueue, t, language);
                    }, 800);
                } else {
                    setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentItem: null }));
                    showCategories(language);
                }
                return;
            }
        }

        if (step === 'QUEUE_PROCESSING') {
            // Should be handled by timeout
        }

        // Cart Decision
        if (step === 'CART_DECISION') {
            if (text === 'order_more' || regexMatch(text, 'more')) {
                showCategories(language);
                return;
            }
            if (text === 'finish_order' || regexMatch(text, 'finish') || regexMatch(text, 'confirm')) {
                setBotState(prev => ({ ...prev, step: 'PAYMENT_METHOD' }));
                addMessage(t.paymentMethod, 'bot', 'button', [
                    { id: 'pay_cash', label: t.cash },
                    { id: 'pay_online', label: t.online }
                ]);
                return;
            }
        }

        // Payment Method
        if (step === 'PAYMENT_METHOD') {
            let method = null;
            if (regexMatch(text, 'cash') || text === 'pay_cash') method = t.cash;
            if (regexMatch(text, 'online') || text === 'pay_online') method = t.online;

            if (method) {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY', paymentMethod: method }));
                showReceipt(cart, language, method);
                return;
            }
            addMessage("Please select Cash or Online.", 'bot');
            return;
        }

        // ORDER SUMMARY / MODIFY
        if (step === 'ORDER_SUMMARY') {
            if (text === 'do_confirm' || regexMatch(text, 'confirm')) {
                addMessage(`${t.receiptHeader}\n\n${t.thankYou}\n\nTerminating Session...`, 'bot');
                setBotState(prev => ({ ...INITIAL_STATE, step: 'INIT' }));
                return;
            }
            // "Cancel / Modify" Clicked
            if (text === 'do_cancel' || regexMatch(text, 'cancel') || regexMatch(text, 'modify')) {
                setBotState(prev => ({ ...prev, step: 'MODIFY_DECISION' }));
                addMessage(t.cancelConfirmation, 'bot', 'button', [
                    { id: 'cancel_all', label: t.cancelAll },
                    { id: 'cancel_item', label: t.cancelItem },
                    { id: 'keep_order', label: t.keepOrder }
                ]);
                return;
            }
        }

        // Modify Decision (Cancel All vs One)
        if (step === 'MODIFY_DECISION') {
            if (text === 'cancel_all') {
                setBotState(prev => ({ ...prev, step: 'CANCEL_CONFIRM_ALL' }));
                addMessage("⚠️ Are you sure you want to cancel everything?", 'bot', 'button', [
                    { id: 'yes_cancel_all', label: t.confirmCancel },
                    { id: 'no_keep', label: t.keepOrder }
                ]);
                return;
            }
            if (text === 'cancel_item') {
                if (cart.length === 0) {
                    addMessage(t.emptyCart, 'bot');
                    setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                    showReceipt(cart, language, botState.paymentMethod);
                    return;
                }

                // List UNIQUE items to remove
                const uniqueItems = [];
                const seen = new Set();
                cart.forEach(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueItems.push({ ...item, key });
                    }
                });

                setBotState(prev => ({ ...prev, step: 'REMOVE_ITEM_SELECT' }));
                addMessage(t.selectRemove, 'bot', 'button',
                    uniqueItems.map(i => ({
                        id: `rem_${i.key}`,
                        label: `❌ ${i.name[language]} ${i.selectedPref ? `(${i.selectedPref})` : ''}`
                    }))
                );
                return;
            }
            if (text === 'keep_order' || text === 'no_keep') {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                showReceipt(cart, language, botState.paymentMethod);
                return;
            }
        }

        // Cancel All Confirmation
        if (step === 'CANCEL_CONFIRM_ALL') {
            if (text === 'yes_cancel_all') {
                setBotState(prev => ({ ...prev, step: 'CANCEL_EXIT', cart: [] }));
                addMessage(t.cancelled, 'bot');
                return;
            }
            if (text === 'no_keep') {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                showReceipt(cart, language, botState.paymentMethod);
                return;
            }
        }

        // Remove Specific Item
        if (step === 'REMOVE_ITEM_SELECT') {
            if (text.startsWith('rem_')) {
                const keyToRemove = text.replace('rem_', '');

                const newCart = cart.filter(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    return key !== keyToRemove;
                });

                setBotState(prev => ({ ...prev, cart: newCart, step: 'ORDER_SUMMARY' }));
                addMessage(t.itemRemoved, 'bot');
                setTimeout(() => {
                    if (newCart.length === 0) {
                        addMessage(t.emptyCart, 'bot');
                        showCategories(language);
                    } else {
                        showReceipt(newCart, language, botState.paymentMethod);
                    }
                }, 800);
                return;
            }
        }

        // Contextual Error Handler
        const handleUnknownInput = (currentStep, lang) => {
            const t = translations[lang] || translations['en'];

            if (currentStep === 'HOME') {
                addMessage(t.helpHome, 'bot');
                setTimeout(() => {
                    addMessage(t.mainMenu, 'bot', 'button', [
                        { id: 'btn_branches', label: t.branches },
                        { id: 'btn_menu', label: t.menu }
                    ]);
                }, 800);
                return;
            }

            if (currentStep === 'BRANCHES_LIST') {
                addMessage(t.helpBranch, 'bot');
                return;
            }

            if (currentStep === 'CATEGORIES' || currentStep === 'ITEMS_LIST') {
                addMessage(t.helpMenu, 'bot');
                return;
            }

            if (currentStep === 'ITEM_QTY' || currentStep === 'QTY_INPUT') {
                addMessage(t.helpItem, 'bot');
                return;
            }

            if (currentStep === 'CART_DECISION') {
                addMessage(t.helpDecision, 'bot');
                setTimeout(() => {
                    addMessage(t.orderMore, 'bot', 'button', [
                        { id: 'order_more', label: t.yesOrderMore },
                        { id: 'finish_order', label: t.finishOrder }
                    ]);
                }, 800);
                return;
            }

            if (currentStep === 'PAYMENT_METHOD') {
                addMessage(t.helpPayment, 'bot');
                return;
            }

            addMessage(t.unknownCommand, 'bot');
        }

        handleUnknownInput(step, language);
    };

    const showCategories = (lang) => {
        setBotState(prev => ({ ...prev, step: 'CATEGORIES' }));
        const t = translations[lang];
        // Number the categories for selection logic
        addMessage(t.chooseOption, 'bot', 'button', menu.categories.map((c, i) => ({
            id: c.id,
            label: `${i + 1}. ${c.title[lang]}`
        })));
    }

    // Init
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            setTimeout(() => {
                if (messages.length === 0) {
                    addMessage(translations.en.welcome, 'bot', 'button', [
                        { id: 'lang_en', label: 'English' },
                        { id: 'lang_ar', label: 'العربية' }
                    ]);
                    setBotState(prev => ({ ...prev, step: 'LANGUAGE' }));
                }
            }, 1000);
        }
    }, [addMessage, messages.length]);

    return { messages, isTyping, sendMessage: handleUserMessage };
}
