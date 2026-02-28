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

async function processMessage(from, text, name = 'Valued Customer') {
    // 1. Core Session & Menu Metadata
    const session = getSession(from);
    const menu = await fetchDynamicMenu();
    const lowerText = text.toLowerCase().trim();

    console.log(`🤖 Processing for ${from} (${name}): "${text}"`);

    // Helper to generate dynamic link with user data
    const getLink = (branchId) => {
        const baseUrl = "https://joana-web-whastapp-bot-production.up.railway.app/";
        const params = new URLSearchParams({
            branch_id: branchId,
            wa_name: name,
            wa_phone: from
        });
        return `${baseUrl}?${params.toString()}`;
    };

    // 2. Handle Interactive Button IDs directly (Fast-path)
    if (lowerText === 'branch_1') {
        return [
            `📍 *Downtown Riyadh*\nGreat choice, ${name}! You can view the menu and order here:\n${getLink('550e8400-e29b-41d4-a716-446655440001')}`,
            "Feel free to ask me if you want to order something specific via chat too! 🍟"
        ];
    }
    if (lowerText === 'branch_2') {
        return [
            `📍 *Jeddah Corniche*\nExcellent, ${name}! Explore our Jeddah menu here:\n${getLink('550e8400-e29b-41d4-a716-446655440002')}`,
            "I'm here if you need help with your order! 🥤"
        ];
    }
    if (lowerText === 'branch_3') {
        return [
            `📍 *Dammam Seafront*\nWonderful choice, ${name}! Check out our Dammam branch here:\n${getLink('550e8400-e29b-41d4-a716-446655440003')}`,
            "Let me know if you'd like to see our specials! 🍦"
        ];
    }

    // 3. AI Natural Language Processing (Groq)
    try {
        const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1;
        if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment");

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                {
                    role: "system",
                    content: `You are JOANA, a polite and professional AI assistant for JOANA restaurant. 
                    - Customer Name: ${name} (Address them by name if they greet you).
                    - Your task is to greet customers, explain how to order (via website links), and answer menu questions.
                    - STRICT RESTRICTION: Do not answer questions about recipes, medical advice, emergencies, or non-restaurant topics. 
                    - If asked about non-restaurant things, politely say you can only help with orders and food at JOANA.
                    - Keep responses friendly, warm, and very concise. 
                    - If the user says they are hungry or want to order, tell them they can select a branch below to see the menu.`
                },
                { role: "user", content: text }
            ],
            temperature: 0.5
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        const aiResponse = response.data.choices[0].message.content;

        // Determine if we should show branch buttons (for greetings or ordering intent)
        const showButtons = /hi|hello|hey|order|hungry|food|branch|start|menu|listen|excuse|how/i.test(text + " " + aiResponse);

        if (showButtons) {
            return [
                aiResponse,
                {
                    type: 'button',
                    body: "Please select a branch to explore our menu and order directly from our website:",
                    buttons: [
                        { id: 'branch_1', title: 'Downtown Riyadh' },
                        { id: 'branch_2', title: 'Jeddah Corniche' },
                        { id: 'branch_3', title: 'Dammam Seafront' }
                    ]
                }
            ];
        }

        return [aiResponse];

    } catch (error) {
        console.error("❌ Groq AI Error:", error.message);
        // Fallback to simple matching if AI fails
        return [
            `👋 Welcome to JOANA, ${name}! 🍔\nExperience the future of dining with our AI-curated menu of premium culinary delights.`,
            {
                type: 'button',
                body: "Please select a branch to explore our menu and order directly from our website:",
                buttons: [
                    { id: 'branch_1', title: 'Downtown Riyadh' },
                    { id: 'branch_2', title: 'Jeddah Corniche' },
                    { id: 'branch_3', title: 'Dammam Seafront' }
                ]
            }
        ];
    }
}

module.exports = {
    processMessage,
    getSession
};
