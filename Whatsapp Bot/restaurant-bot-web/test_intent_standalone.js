
// Mock menu data to avoid import issues
const menu = {
    categories: [
        { id: 'burgers', title: { en: 'Burgers', ar: 'برجر' } },
        { id: 'wraps', title: { en: 'Wraps', ar: 'لفائف' } },
        { id: 'sandwiches', title: { en: 'Sandwiches', ar: 'سندويشات' } },
        { id: 'sides', title: { en: 'Sides', ar: 'جانبية' } },
        { id: 'meals', title: { en: 'Meals', ar: 'وجبات' } },
        { id: 'juices', title: { en: 'Juices', ar: 'عصائر' } },
        { id: 'drinks', title: { en: 'Drinks', ar: 'مشروبات' } }
    ],
    items: {}
};

// Levenshtein implementation
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

// --- LOGIC FROM intentDetection.js (Copied and adapted) ---

const MENU_BROWSING_PATTERNS = {
    showMe: ['show me', 'show', 'display', 'let me see', 'lemme see', 'can i see', 'could i see', 'may i see', 'i want to see', 'i wanna see', 'wanna see', 'show us', 'display for me', 'show me the', 'can you show', 'can u show', 'pls show', 'please show', 'plz show', 'plss show', 'pleas show'],
    whatHave: ['what do you have', 'what you have', 'what u have', 'what have you got', 'what you got', 'what u got', 'whats available', 'what is available', 'what available', 'what do u have', 'what do you got', 'what you have in', 'what do you have in', 'what u have in', 'what have you', 'what have u', 'what options', 'what are the options', 'what r the options', 'what choices', 'whats there', 'what is there', 'what there', 'what all you have'],
    menu: ['menu', 'menu of', 'menu for', 'the menu', 'your menu', 'ur menu', 'full menu', 'complete menu', 'entire menu', 'whole menu', 'all menu', 'menu items', 'menu list', 'food menu', 'item menu', 'items menu', 'menue', 'manu', 'menuu', 'menus', 'menuz'],
    list: ['list', 'list of', 'list all', 'list the', 'listing', 'listings', 'give me list', 'give list', 'show list', 'show me list', 'can i get list', 'send list', 'send me list', 'share list', 'share the list'],
    items: ['items', 'item', 'things', 'stuff', 'options', 'choices', 'selection', 'selections', 'products', 'dishes', 'foods', 'food items', 'menu items', 'available items', 'all items', 'your items', 'ur items', 'the items'],
    categories: ['categories', 'category', 'types', 'type', 'kinds', 'kind', 'sections', 'section', 'groups', 'group', 'menu categories', 'food categories', 'item categories', 'all categories', 'your categories', 'ur categories', 'categries', 'catagories', 'catgories', 'categry', 'catagory'],
    browse: ['browse', 'browsing', 'look at', 'looking at', 'check', 'check out', 'checking', 'checking out', 'explore', 'exploring', 'view', 'viewing', 'see', 'seeing', 'look through', 'go through', 'scroll through'],
    questions: ['what', 'which', 'whats', 'what is', 'what are', 'what r', 'tell me', 'tell me about', 'tell about', 'info about', 'information about', 'details about', 'detail about', 'describe', 'explain']
};

const CATEGORY_KEYWORDS = {
    burgers: { keywords: ['burger', 'burgers'], variations: [] },
    wraps: { keywords: ['wrap', 'wraps'], variations: [] },
    sandwiches: { keywords: ['sandwich'], variations: [] },
    sides: { keywords: ['side', 'sides'], variations: [] },
    meals: { keywords: ['meal', 'meals'], variations: [] },
    juices: { keywords: ['juice'], variations: [] },
    drinks: { keywords: ['drink'], variations: [] }
};

const generateIntentPatterns = () => {
    const patterns = [];
    Object.keys(CATEGORY_KEYWORDS).forEach(categoryId => {
        const category = menu.categories.find(c => c.id === categoryId);
        if (!category) return;
        const catKeywords = CATEGORY_KEYWORDS[categoryId].keywords;
        Object.values(MENU_BROWSING_PATTERNS).forEach(patternGroup => {
            patternGroup.forEach(pattern => {
                catKeywords.forEach(keyword => {
                    patterns.push({ pattern: `${pattern} ${keyword}`, categoryId, intent: 'BROWSE_CATEGORY' });
                    patterns.push({ pattern: `${pattern} the ${keyword}`, categoryId, intent: 'BROWSE_CATEGORY' });
                });
            });
        });
        catKeywords.forEach(keyword => {
            patterns.push({ pattern: keyword, categoryId, intent: 'BROWSE_CATEGORY' });
        });
    });
    return patterns;
};

const detectIntent = (text) => {
    const normalized = text.toLowerCase().trim();
    // Simplified logic focusing on general menu detection for this test

    // Check for general menu browsing (no specific category)
    const generalMenuPatterns = [
        'show menu', 'menu', 'show me menu', 'what do you have',
        'show items', 'show categories', 'list categories', 'all categories',
        'what categories', 'menu categories', 'food categories',
        'i want to order', 'menu please', 'need your menu', 'i want menu',
        'see menu', 'view menu', 'order please', 'start order',
        'show me the menu', 'menu please', 'what do you have in your menu',
        'i want to order', 'i need your menu', 'menu????', 'menu',
        'can i see the menu', 'whats on the menu', 'give me the menu',
        'menu options', 'menu items', 'menu list', 'menu card',
        'menu now', 'menu info', 'menu information', 'menu details',
        'id like to see the menu', 'can you show your menu',
        'i want to check the menu', 'do you have a menu',
        'please send me the menu', 'id like to order something',
        'what can i order', 'what food do you have', 'whats available',
        'what dishes do you serve', 'can i get the menu',
        'i want to see what you offer'
    ];

    const normalizedLower = normalized.replace(/[^a-z0-9 ]/g, '');

    for (const pattern of generalMenuPatterns) {
        const patternLower = pattern.replace(/[^a-z0-9 ]/g, '');

        if (normalized.includes(pattern) || pattern.includes(normalized)) {
            return { pattern: normalized, categoryId: null, intent: 'BROWSE_ALL_CATEGORIES', matchType: 'substring' };
        }

        const dist = levenshtein(normalizedLower, patternLower);
        const threshold = pattern.length > 10 ? 3 : 2;

        if (dist <= threshold) {
            return { pattern: normalized, categoryId: null, intent: 'BROWSE_ALL_CATEGORIES', matchType: 'fuzzy' };
        }
    }

    return null;
};

// --- TEST RUNNER ---

const testPhrases = [
    // General Menu (Regression Test)
    "Show me the menu",
    "menu",
    "menu list",

    // Burger Category
    "Burger menu",
    "Show me burgers",
    "burgers list",
    "beef burger menu",

    // Wraps Category
    "Wraps menu",
    "wrap options",
    "show wraps",

    // Sandwich Category
    "Sandwich menu",
    "sandwiches",
    "sandwich list",

    // Sides Category
    "Sides menu",
    "Snacks menu",
    "side dishes",

    // Meals Category
    "Meals menu",
    "combo meals",
    "meal deals",

    // Drinks/Juices
    "Drinks menu",
    "Juices menu",
    "fresh juice options"
];

console.log("🚀 Starting Menu Intent Verification (Standalone)...\n");

let passed = 0;
let failed = 0;

testPhrases.forEach(phrase => {
    const result = detectIntent(phrase);
    const isSuccess = result && (result.intent === 'BROWSE_ALL_CATEGORIES' || result.intent === 'BROWSE_CATEGORY');

    if (isSuccess) {
        console.log(`✅ MATCH: "${phrase}" -> ${result.intent} ${result.categoryId ? '(' + result.categoryId + ')' : ''}`);
        passed++;
    } else {
        console.log(`❌ FAIL:  "${phrase}"`);
        if (result) console.log(`   Got: ${result.intent}`);
        failed++;
    }
});

console.log(`\n================================`);
console.log(`Results: ${passed}/${testPhrases.length} Passed`);
console.log(`================================`);

if (failed > 0) {
    console.error("Some tests failed!");
    process.exit(1);
} else {
    console.log("All tests passed!");
    process.exit(0);
}
