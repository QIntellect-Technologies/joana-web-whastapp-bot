
import { parseAdvancedNLP } from './src/utils/advancedNLP.js';
import { menu } from './src/data/menu.js';

console.log("🚀 Testing NLP Direct Input...");

const inputs = [
    "3 spicy chicken burger",
    "2 non-spicy beef burger",
    "4 zinger burger",
    "spicy tortilla",
    "chicken burger"
];

inputs.forEach(text => {
    const intents = parseAdvancedNLP(text, 'en');
    if (intents.length > 0) {
        const i = intents[0];
        console.log(`\nInput: "${text}"`);
        console.log(`   -> Item: ${i.data?.name?.en}`);
        console.log(`   -> Qty: ${i.qty}`);
        console.log(`   -> Pref: ${i.preference}`);
    } else {
        console.log(`\nInput: "${text}" -> NO MATCH`);
    }
});
