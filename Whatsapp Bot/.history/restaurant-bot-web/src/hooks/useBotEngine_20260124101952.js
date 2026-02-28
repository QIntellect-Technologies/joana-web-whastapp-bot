import { useState, useCallback, useRef } from 'react';
import { menu } from '../data/menu';
import { branchInfo } from '../data/branchInfo';
import { parseAdvancedNLP } from '../utils/advancedNLP';
import { detectIntent } from '../utils/intentDetection';

const INITIAL_STATE = {
    step: 'INIT',
    currentCategory: null,
    currentItem: null,
    cart: [],
    itemOffset: 0,
    allCategoryItems: []
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


    const processInput = (text) => {
        const { step, currentItem, cart, allCategoryItems, itemOffset } = botState;

        // Handle generic menu requests (menu, show menu, what do you have, etc.) FIRST
        const menuRegex = new RegExp(
            [
                'menu',
                'show me the menu',
                'menu please',
                'what do you have( in your menu)?',
                'i want to order',
                'i need your menu',
                'menu\\?+',
                "what's on the menu",
                'see the menu',
                'see menu',
                'can i see the menu',
                'can i get the menu',
                'display menu',
                'give me the menu',
                'menu options',
                'menu items',
                'menu list',
                'menu card',
                'menu now',
                'menu info',
                'menu information',
                'menu details',
                "i'd like to see the menu",
                'can you show your menu',
                'i want to check the menu',
                'do you have a menu',
                'please send me the menu',
                "i'd like to order something",
                'what can i order',
                'what food do you have',
                "what's available",
                'what dishes do you serve',
                'i want to see what you offer',
                'i want to see the menu',
                'can i order',
                'can i see what you have',
                'can i see your menu',
                'let me see the menu',
                'show menu',
                'order now',
                'order food',
                'order something',
                'order from menu',
                'can i order food',
                'can i order now',
                'can i order something',
                'can i order from menu',
                'i want food',
                'i want to eat',
                'i want to see food',
                'food menu',
                'food options',
                'food list',
                'food card',
                'food details',
                'food information',
                'food items',
                'food choices',
                'food selection',
                'food available',
                'food you have',
                'food you serve',
                'food you offer',
                'food to order',
                'food to eat',
                'food to choose',
                'food to pick',
                'food to select',
                'food to see',
                'food to view',
                'food to check',
                'food to browse',
                'food to look at',
                'food to get',
                'food to buy',
                'food to try',
                'food to taste',
                'food to enjoy',
                'food to have',
                'food to order now',
                'food to order from menu',
                'food to order something',
                'food to order food',
                'food to order menu',
                'food to order list',
                'food to order card',
                'food to order details',
                'food to order information',
                'food to order items',
                'food to order choices',
                'food to order selection',
                'food to order available',
                'food to order you have',
                'food to order you serve',
                'food to order you offer',
                'food to order to order',
                'food to order to eat',
                'food to order to choose',
                'food to order to pick',
                'food to order to select',
                'food to order to see',
                'food to order to view',
                'food to order to check',
                'food to order to browse',
                'food to order to look at',
                'food to order to get',
                'food to order to buy',
                'food to order to try',
                'food to order to taste',
                'food to order to enjoy',
                'food to order to have',
            ].join('|'),
            'i'
        );
        if (
            menuRegex.test(text.trim()) ||
            text.trim().toLowerCase() === 'menu' ||
            text.trim().toLowerCase() === 'order_text' ||
            text.trim().toLowerCase() === 'order_voice'
        ) {
            // Show menu image first (assuming you have a menu image in public/menu.jpg)
            addMessage('', 'bot', 'image', [{ url: '/menu.jpg', alt: 'Menu' }]);
            setTimeout(() => {
                addMessage('Here is our menu', 'bot');
                setTimeout(() => {
                    addMessage('', 'bot', 'button', [
                        { id: 'cat_burgers_meals', label: 'Burgers & Meals' },
                        { id: 'cat_sandwiches_wraps', label: 'Sandwiches & Wraps' },
                        { id: 'cat_snacks_sides', label: 'Snacks & Sides' }
                    ]);
                }, 200);
            }, 200);
            setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', itemOffset: 0 }));
            return;
        }

        // Process NLP intents (after menu check)
        const nlpIntents = parseAdvancedNLP(text, 'en');
        if (nlpIntents.length > 0) {
            const firstIntent = nlpIntents[0];
            // ...existing code...



        if (text === 'cat_burgers_meals' || text === 'cat_sandwiches_wraps' || text === 'cat_snacks_sides') {
            let categoryIds = [];

            if (text === 'cat_burgers_meals') {
                categoryIds = ['burgers', 'meals'];
            } else if (text === 'cat_sandwiches_wraps') {
                categoryIds = ['sandwiches', 'wraps'];
            } else if (text === 'cat_snacks_sides') {
                categoryIds = ['sides', 'drinks', 'juices'];
            }

            let allItems = [];
            categoryIds.forEach(catId => {
                const items = menu.items[catId] || [];
                items.forEach(item => {
                    allItems.push({ ...item, catId });
                });
            });

            setBotState(prev => ({
                ...prev,
                step: 'ITEMS_LIST',
                currentCategory: text,
                itemOffset: 0,
                allCategoryItems: allItems
            }));

            addMessage('Choose an item, then type the quantity you want (e.g., 12).', 'bot');

            setTimeout(() => {
                const itemsToShow = allItems.slice(0, 2);
                const buttons = itemsToShow.map(item => ({
                    id: `item_${item.id}`,
                    label: item.name.en
                }));

                if (allItems.length > 2) {
                    buttons.push({ id: 'more_items', label: 'More' });
                }

                addMessage('', 'bot', 'button', buttons);
            }, 200);
            return;
        }

        if (text === 'more_items') {
            const newOffset = itemOffset + 2;
            setBotState(prev => ({ ...prev, itemOffset: newOffset }));

            const itemsToShow = allCategoryItems.slice(newOffset, newOffset + 2);
            const buttons = itemsToShow.map(item => ({
                id: `item_${item.id}`,
                label: item.name.en
            }));

            if (allCategoryItems.length > newOffset + 2) {
                buttons.push({ id: 'more_items', label: 'More' });
            }

            addMessage('', 'bot', 'button', buttons);
            return;
        }

        if (text.startsWith('item_')) {
            const itemId = text.replace('item_', '');
            const selectedItem = allCategoryItems.find(item => item.id === itemId);

            if (selectedItem) {
                const needsSpicyPreference = selectedItem.catId === 'burgers' || selectedItem.catId === 'wraps';

                if (needsSpicyPreference) {
                    setBotState(prev => ({
                        ...prev,
                        step: 'ITEM_SPICY',
                        currentItem: selectedItem
                    }));

                    addMessage(`How would you like your ${selectedItem.name.en}?`, 'bot', 'button', [
                        { id: 'spicy_yes', label: 'Spicy' },
                        { id: 'spicy_no', label: 'Non-Spicy' }
                    ]);
                } else {
                    setBotState(prev => ({
                        ...prev,
                        step: 'ITEM_QTY',
                        currentItem: selectedItem
                    }));

                    addMessage(`How many ${selectedItem.name.en} would you like? Type the quantity (e.g., 1, 2, 3...)`, 'bot');
                }
            }
            return;
        }

        if (text === 'spicy_yes' || text === 'spicy_no') {
            const preference = text === 'spicy_yes' ? 'Spicy' : 'Non-Spicy';

            setBotState(prev => ({
                ...prev,
                step: 'ITEM_QTY',
                currentItem: { ...currentItem, preference }
            }));

            addMessage(`How many ${currentItem.name.en} (${preference}) would you like? Type the quantity (e.g., 1, 2, 3...)`, 'bot');
            return;
        }

        // Handle preference buttons (new flow)
        if (text === 'pref_spicy' || text === 'pref_nonspicy') {
            const preference = text === 'pref_spicy' ? 'spicy' : 'non-spicy';
            const itemWithPref = { ...currentItem, preference };

            // If we already have qty, add to cart
            if (currentItem.qty) {
                for (let i = 0; i < currentItem.qty; i++) {
                    cart.push(itemWithPref);
                }

                setBotState(prev => ({ ...prev, cart: [...cart], step: 'ITEMS_LIST' }));

                addMessage(`Added ${currentItem.qty}x ${currentItem.name.en} (${preference}) to your cart`, 'bot');

                setTimeout(() => {
                    addMessage('Would you like to add more items?', 'bot', 'button', [
                        { id: 'add_more', label: 'Add More' },
                        { id: 'finish_order', label: 'Finish Order' }
                    ]);
                }, 200);
            } else {
                // Ask for quantity
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_QTY',
                    currentItem: itemWithPref
                }));

                addMessage(`How many ${currentItem.name.en} (${preference}) would you like?`, 'bot', 'button', [
                    { id: 'qty_1', label: '1' },
                    { id: 'qty_2', label: '2' },
                    { id: 'qty_3', label: '3' },
                    { id: 'qty_more', label: 'More' }
                ]);
            }
            return;
        }

        // Handle quantity buttons
        if (text === 'qty_1' || text === 'qty_2' || text === 'qty_3') {
            const qty = parseInt(text.replace('qty_', ''));

            for (let i = 0; i < qty; i++) {
                cart.push(currentItem);
            }

            setBotState(prev => ({ ...prev, cart: [...cart], step: 'ITEMS_LIST' }));

            const itemName = currentItem.preference ? `${currentItem.name.en} (${currentItem.preference})` : currentItem.name.en;
            addMessage(`Added ${qty}x ${itemName} to your cart`, 'bot');

            setTimeout(() => {
                addMessage('Would you like to add more items?', 'bot', 'button', [
                    { id: 'add_more', label: 'Add More' },
                    { id: 'finish_order', label: 'Finish Order' }
                ]);
            }, 200);
            return;
        }

        // Handle "More" quantity button
        if (text === 'qty_more') {
            setBotState(prev => ({ ...prev, step: 'ITEM_QTY_MANUAL' }));
            addMessage('Type the quantity you want (e.g., 5, 10, 20...)', 'bot');
            return;
        }

        // Handle manual quantity input
        if (step === 'ITEM_QTY_MANUAL' && currentItem) {
            const qty = parseInt(text);

            if (!isNaN(qty) && qty > 0) {
                for (let i = 0; i < qty; i++) {
                    cart.push(currentItem);
                }

                setBotState(prev => ({ ...prev, cart: [...cart], step: 'ITEMS_LIST' }));

                const itemName = currentItem.preference ? `${currentItem.name.en} (${currentItem.preference})` : currentItem.name.en;
                addMessage(`Added ${qty}x ${itemName} to your cart`, 'bot');

                setTimeout(() => {
                    addMessage('Would you like to add more items?', 'bot', 'button', [
                        { id: 'add_more', label: 'Add More' },
                        { id: 'finish_order', label: 'Finish Order' }
                    ]);
                }, 200);
            } else {
                addMessage('Please enter a valid quantity (e.g., 1, 2, 3...)', 'bot');
            }
            return;
        }

        if (step === 'ITEM_QTY' && currentItem) {
            const qty = parseInt(text);

            if (!isNaN(qty) && qty > 0) {
                for (let i = 0; i < qty; i++) {
                    cart.push(currentItem);
                }

                setBotState(prev => ({
                    ...prev,
                    cart: [...cart],
                    step: 'ITEMS_LIST'
                }));

                const itemName = currentItem.preference ? `${currentItem.name.en} (${currentItem.preference})` : currentItem.name.en;
                addMessage(`Added ${qty}x ${itemName} to your cart`, 'bot');

                setTimeout(() => {
                    addMessage('Would you like to add more items?', 'bot', 'button', [
                        { id: 'add_more', label: 'Add More' },
                        { id: 'finish_order', label: 'Finish Order' }
                    ]);
                }, 200);
            } else {
                addMessage('Please enter a valid quantity (e.g., 1, 2, 3...)', 'bot');
            }
            return;
        }

        if (text === 'add_more') {
            addMessage('Please choose a category:', 'bot');
            setTimeout(() => {
                addMessage('Here is our menu', 'bot', 'button', [
                    { id: 'cat_burgers_meals', label: 'Burgers & Meals' },
                    { id: 'cat_sandwiches_wraps', label: 'Sandwiches & Wraps' },
                    { id: 'cat_snacks_sides', label: 'Snacks & Sides' }
                ]);
            }, 200);
            setBotState(prev => ({ ...prev, step: 'CATEGORY_SELECTION', itemOffset: 0 }));
            return;
        }

        // Check for finish order / total bill variants
        const lowerText = text.toLowerCase();
        if (text === 'finish_order' ||
            lowerText.includes('finish') ||
            lowerText.includes('checkout') ||
            lowerText.includes('total') ||
            lowerText.includes('bill')) {
            if (cart.length === 0) {
                addMessage('Your cart is empty. Please add items first.', 'bot');
                return;
            }

            const grouped = {};
            cart.forEach(item => {
                const key = item.id;
                if (!grouped[key]) {
                    grouped[key] = { ...item, qty: 0 };
                }
                grouped[key].qty += 1;
            });

            let total = 0;
            let receiptText = 'Order Summary:\n\n';

            Object.values(grouped).forEach((item, index) => {
                const lineTotal = item.price * item.qty;
                total += lineTotal;
                receiptText += `${index + 1}. ${item.name.en} x${item.qty} - ${lineTotal} SAR\n`;
            });

            receiptText += `\nTotal: ${total} SAR`;

            addMessage(receiptText, 'bot');

            setTimeout(() => {
                addMessage('Choose payment method:', 'bot', 'button', [
                    { id: 'pay_cash', label: 'Cash' },
                    { id: 'pay_online', label: 'Online Payment' }
                ]);
            }, 200);

            setBotState(prev => ({ ...prev, step: 'PAYMENT' }));
            return;
        }

        if (text === 'pay_cash' || text === 'pay_online') {
            const paymentMethod = text === 'pay_cash' ? 'Cash on Delivery' : 'Online Payment';

            addMessage(`Order Confirmed\n\nPayment Method: ${paymentMethod}\n\nThank you for your order`, 'bot');

            setTimeout(() => {
                addMessage('Would you like to place another order?', 'bot', 'button', [
                    { id: 'new_order', label: 'New Order' }
                ]);
            }, 300);

            setBotState(prev => ({ ...prev, step: 'COMPLETE', cart: [] }));
            return;
        }

        if (text === 'new_order') {
            setBotState(INITIAL_STATE);
            addMessage('Please choose an option:', 'bot', 'button', [
                { id: 'order_text', label: 'Order via Text' },
                { id: 'order_voice', label: 'Order via Voice' }
            ]);
            return;
        }



        // Fallback to old intent detection for menu browsing
        const intent = detectIntent(text);
        if (intent) {
            if (intent.intent === 'BROWSE_CATEGORY' && intent.categoryId) {
                let categoryButton = '';
                if (intent.categoryId === 'burgers' || intent.categoryId === 'meals') {
                    categoryButton = 'cat_burgers_meals';
                } else if (intent.categoryId === 'sandwiches' || intent.categoryId === 'wraps') {
                    categoryButton = 'cat_sandwiches_wraps';
                } else if (intent.categoryId === 'sides' || intent.categoryId === 'drinks' || intent.categoryId === 'juices') {
                    categoryButton = 'cat_snacks_sides';
                }

                if (categoryButton) {
                    processInput(categoryButton);
                    return;
                }
            } else if (intent.intent === 'BROWSE_ALL_CATEGORIES') {
                addMessage('Please choose a category:', 'bot');
                setTimeout(() => {
                    addMessage('Here is our menu', 'bot', 'button', [
                        { id: 'cat_burgers_meals', label: 'Burgers & Meals' },
                        { id: 'cat_sandwiches_wraps', label: 'Sandwiches & Wraps' },
                        { id: 'cat_snacks_sides', label: 'Snacks & Sides' }
                    ]);
                }, 200);
                return;
            }
        }

        addMessage("I didn't understand that.", 'bot');
        if (text.match(/\d+/)) {
            addMessage("It looks like you're trying to order, but I couldn't recognize the item name. Please check the spelling or choose from the menu.", 'bot');
        } else {
            addMessage("Please use the buttons or type naturally (e.g., '2 burgers', '3 coffee').", 'bot');
        }
    };

    if (!hasInitialized.current) {
        hasInitialized.current = true;
        setTimeout(() => {
            if (messages.length === 0) {
                const welcomeMsg = `Welcome to JOANA Fast Food\n\nBranches:\n\n` +
                    branchInfo.branches.map((b, i) =>
                        `${i + 1}. ${b.name}\n   ${b.phone}`
                    ).join('\n\n') +
                    `\n\nPlease choose an option:`;

                addMessage(welcomeMsg, 'bot', 'button', [
                    { id: 'order_text', label: 'Order via Text' },
                    { id: 'order_voice', label: 'Order via Voice' }
                ]);
            }
        }, 500);
    }

    return { messages, isTyping, sendMessage: handleUserMessage };

    }