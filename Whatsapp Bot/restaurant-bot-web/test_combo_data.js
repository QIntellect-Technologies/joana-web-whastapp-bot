
import { menu } from './src/data/menu.js';

console.log("🚀 verifying Combo Data Logic...");

const testCombo = (name, categoryIds) => {
    console.log(`\nTesting ${name}: [${categoryIds.join(', ')}]`);
    let allItems = [];

    categoryIds.forEach(catId => {
        const items = menu.items[catId] || [];
        console.log(`   - Category '${catId}': found ${items.length} items.`);
        items.forEach(item => {
            allItems.push({ ...item, catId });
        });
    });

    console.log(`   => Total items accumulated: ${allItems.length}`);
    return allItems.length;
};

// Test 1: Burgers & Meals
testCombo("Burgers & Meals", ['burgers', 'meals']);

// Test 2: Snacks & Sides
testCombo("Snacks & Sides", ['sides', 'drinks', 'juices']);

// Debugging specific category keys
console.log("\nAvailable keys in menu.items:", Object.keys(menu.items));
