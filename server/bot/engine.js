const { parseAdvancedNLP } = require('../utils/advancedNLP');
const { translations } = require('../data/translations');
const { fetchDynamicMenu } = require('./menuService');

const sessions = {};

function getSession(from) {
    if (!sessions[from]) {
        sessions[from] = {
            step: 'welcome',
            cart: [],
            language: 'en',
            lastMenu: null
        };
    }
    return sessions[from];
}

async function processMessage(from, text) {
    const session = getSession(from);
    const menu = await fetchDynamicMenu();
    const t = translations[session.language];
    const lowerText = text.toLowerCase().trim();

    console.log(`🤖 Processing for ${from}: "${text}"`);

    // 1. Handle Greetings
    if (/^(hi|hello|hey|hola|start|مرحبا|سلام)$/i.test(lowerText)) {
        session.step = 'welcome';
        return [
            {
                type: 'button',
                body: "👋 Welcome to JOANA Fast Food! 🍔\n\nExperience the future of dining. Please select a branch to explore our AI-curated menu and place your order directly from our website.",
                buttons: [
                    { id: 'branch_1', title: 'Downtown Riyadh' },
                    { id: 'branch_2', title: 'Jeddah Corniche' },
                    { id: 'branch_3', title: 'Dammam Seafront' }
                ]
            }
        ];
    }

    // 2. Handle Branch Selections
    if (lowerText === 'branch_1') {
        return [
            "📍 *Downtown Riyadh*\nGreat choice! You can view the menu and order here:\nhttps://joana-web-whastapp-bot-production.up.railway.app/?branch_id=550e8400-e29b-41d4-a716-446655440001",
            "Feel free to ask me if you want to order something specific via chat too! 🍟"
        ];
    }
    if (lowerText === 'branch_2') {
        return [
            "📍 *Jeddah Corniche*\nExcellent! Explore our Jeddah menu here:\nhttps://joana-web-whastapp-bot-production.up.railway.app/?branch_id=550e8400-e29b-41d4-a716-446655440002",
            "I'm here if you need help with your order! 🥤"
        ];
    }
    if (lowerText === 'branch_3') {
        return [
            "📍 *Dammam Seafront*\nWonderful! Check out our Dammam branch here:\nhttps://joana-web-whastapp-bot-production.up.railway.app/?branch_id=550e8400-e29b-41d4-a716-446655440003",
            "Let me know if you'd like to see our specials! 🍦"
        ];
    }

    // 3. NLP Fallback for Ordering
    const intents = parseAdvancedNLP(text, session.language, menu);
    if (intents.length > 0) {
        let replies = [];
        for (const intent of intents) {
            if (intent.type === 'ITEM') {
                const item = intent.data;
                const qty = intent.qty || 1;
                session.cart.push({ ...item, qty });
                replies.push(`✅ Added ${qty}x ${item.name[session.language]} to your cart.`);
            }
        }

        if (session.cart.length > 0) {
            const total = session.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
            replies.push(`🛒 *Your Cart:* \n${session.cart.map(i => `• ${i.qty}x ${i.name[session.language]}`).join('\n')}\n\n💰 *Total:* ${total.toFixed(2)} SR\n\nYou can complete your order on our website for any branch! 🌐`);
        }
        return replies;
    }

    // Default Fallback
    return [
        "I'm sorry, I didn't quite catch that. 😅\n\nType *'hi'* to see our branches, or try saying something like *'2 chicken burgers'* to see what I can do!",
        {
            type: 'button',
            body: "Would you like to see our branches again?",
            buttons: [
                { id: 'branch_1', title: 'Downtown Riyadh' },
                { id: 'branch_2', title: 'Jeddah Corniche' },
                { id: 'branch_3', title: 'Dammam Seafront' }
            ]
        }
    ];
}

module.exports = {
    processMessage,
    getSession
};
