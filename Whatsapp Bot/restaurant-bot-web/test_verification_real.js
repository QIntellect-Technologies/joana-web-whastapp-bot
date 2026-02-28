
import { detectIntent } from './src/utils/intentDetection.js';

const testPhrases = [
    // General Menu
    { phrase: "Menu", expected: "BROWSE_ALL_CATEGORIES" },

    // Sandwiches (Typo Check)
    { phrase: "Sandwich menu", expected: "BROWSE_CATEGORY", catId: "sandwiches" },
    { phrase: "Sandwitch menu", expected: "BROWSE_CATEGORY", catId: "sandwiches" }, // Typo 't'
    { phrase: "Sandwiche menu", expected: "BROWSE_CATEGORY", catId: "sandwiches" }, // Typo 'e'
    { phrase: "i want to order Sandwiche", expected: "BROWSE_CATEGORY", catId: "sandwiches" },

    // Sides / Snacks
    { phrase: "Sides menu", expected: "BROWSE_CATEGORY", catId: "sides" },
    { phrase: "Snacks menu", expected: "BROWSE_CATEGORY", catId: "sides" },
    { phrase: "i want to order from snacks", expected: "BROWSE_CATEGORY", catId: "sides" },

    // Other Categories
    { phrase: "Burger menu", expected: "BROWSE_CATEGORY", catId: "burgers" },
    { phrase: "Wraps menu", expected: "BROWSE_CATEGORY", catId: "wraps" }
];

console.log("🚀 Starting Refined Intent Verification...\n");

let passed = 0;
let failed = 0;

testPhrases.forEach(test => {
    const result = detectIntent(test.phrase);

    let isSuccess = false;
    if (result && result.intent === test.expected) {
        if (test.catId) {
            if (result.categoryId === test.catId) isSuccess = true;
        } else {
            isSuccess = true;
        }
    }

    if (isSuccess) {
        console.log(`✅ PASS: "${test.phrase}" -> ${result.intent} ${result.categoryId || ''}`);
        passed++;
    } else {
        console.log(`❌ FAIL: "${test.phrase}"`);
        console.log(`   Expected: ${test.expected} ${test.catId || ''}`);
        console.log(`   Got:      ${result ? result.intent : 'null'} ${result ? result.categoryId : ''}`);
        failed++;
    }
});

console.log(`\n================================`);
console.log(`Results: ${passed}/${testPhrases.length} Passed`);
console.log(`================================`);

process.exit(failed > 0 ? 1 : 0);
