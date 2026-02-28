
import { detectIntent } from './src/utils/intentDetection.js';

const testPhrases = [
    "Show me the menu",
    "Menu please",
    "What do you have in your menu?",
    "I want to order",
    "I need your menu",
    "Menu????",
    "Menu",
    "Can I see the menu?",
    "What’s on the menu?",
    "Give me the menu",
    "Menu options",
    "Menu items",
    "Menu list",
    "Menu card",
    "Menu now",
    "Menu info",
    "Menu information",
    "Menu details",
    "I’d like to see the menu",
    "Can you show your menu?",
    "I want to check the menu",
    "Do you have a menu?",
    "Please send me the menu",
    "I’d like to order something",
    "What can I order?",
    "What food do you have?",
    "What’s available?",
    "What dishes do you serve?",
    "Can I get the menu?",
    "I want to see what you offer"
];

console.log("🚀 Starting Menu Intent Verification...\n");

let passed = 0;
let failed = 0;

testPhrases.forEach(phrase => {
    const result = detectIntent(phrase);
    const isSuccess = result && result.intent === 'BROWSE_ALL_CATEGORIES';

    if (isSuccess) {
        console.log(`✅ MATCH: "${phrase}"`);
        passed++;
    } else {
        console.log(`❌ FAIL:  "${phrase}"`);
        console.log(`   Result:`, result);
        failed++;
    }
});

console.log(`\n================================`);
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log(`================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
