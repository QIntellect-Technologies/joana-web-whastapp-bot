const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const outputDir = path.join(__dirname, 'test_menus');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Helper to create excel file
function createMenuFile(filename, data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Menu");

    const filePath = path.join(outputDir, filename);
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Created ${filename}`);
}

// 1. Italian Pizzeria
const pizzaMenu = [
    { Category: "Starters", "Item Name (EN)": "Garlic Bread", "Item Name (AR)": "خبز بالثوم", Price: 15, Availability: "Available" },
    { Category: "Starters", "Item Name (EN)": "Mozzarella Sticks", "Item Name (AR)": "أصابع موزاريلا", Price: 20, Availability: "Available" },
    { Category: "Pizza Red", "Item Name (EN)": "Margherita", "Item Name (AR)": "مارغريتا", Price: 40, Availability: "Available" },
    { Category: "Pizza Red", "Item Name (EN)": "Pepperoni", "Item Name (AR)": "بيبروني", Price: 50, Availability: "Available" },
    { Category: "Pizza White", "Item Name (EN)": "Truffle Mushroom", "Item Name (AR)": "فطر بالكمأة", Price: 60, Availability: "Available" },
    { Category: "Pizza White", "Item Name (EN)": "Four Cheese", "Item Name (AR)": "أربعة أجبان", Price: 55, Availability: "Available" },
    { Category: "Dessert", "Item Name (EN)": "Tiramisu", "Item Name (AR)": "تيراميسو", Price: 30, Availability: "Available" }
];

// 2. Ramadan Special
const ramadanMenu = [
    { Category: "Iftar Deals", "Item Name (EN)": "Family Box", "Item Name (AR)": "صندوق العائلة", Price: 150, Availability: "Available" },
    { Category: "Iftar Deals", "Item Name (EN)": "Individual Meal", "Item Name (AR)": "وجبة فردية", Price: 45, Availability: "Available" },
    { Category: "Suhoor Specials", "Item Name (EN)": "Foul & Tamis", "Item Name (AR)": "فول وتميس", Price: 20, Availability: "Available" },
    { Category: "Suhoor Specials", "Item Name (EN)": "Mixed Grill", "Item Name (AR)": "مشويات مشكلة", Price: 80, Availability: "Available" },
    { Category: "Beverages", "Item Name (EN)": "Vimto", "Item Name (AR)": "فيمتو", Price: 10, Availability: "Available" },
    { Category: "Beverages", "Item Name (EN)": "Laban", "Item Name (AR)": "لبن", Price: 5, Availability: "Available" }
];

// 3. Coffee Shop
const coffeeMenu = [
    { Category: "Hot Coffee", "Item Name (EN)": "Espresso", "Item Name (AR)": "إسبريسو", Price: 12, Availability: "Available" },
    { Category: "Hot Coffee", "Item Name (EN)": "Latte", "Item Name (AR)": "لاتيه", Price: 18, Availability: "Available" },
    { Category: "Cold Brews", "Item Name (EN)": "Iced Spanish Latte", "Item Name (AR)": "سبانيش لاتيه مثلج", Price: 22, Availability: "Available" },
    { Category: "Cold Brews", "Item Name (EN)": "Cold Brew", "Item Name (AR)": "قهوة باردة", Price: 20, Availability: "Available" },
    { Category: "Pastries", "Item Name (EN)": "Croissant", "Item Name (AR)": "كرواسون", Price: 15, Availability: "Available" },
    { Category: "Pastries", "Item Name (EN)": "Brownie", "Item Name (AR)": "براوني", Price: 18, Availability: "Available" }
];

// 4. Sushi Bar
const sushiMenu = [
    { Category: "Nigiri", "Item Name (EN)": "Salmon Nigiri", "Item Name (AR)": "نيجيري سلمون", Price: 25, Availability: "Available" },
    { Category: "Nigiri", "Item Name (EN)": "Tuna Nigiri", "Item Name (AR)": "نيجيري تونا", Price: 28, Availability: "Available" },
    { Category: "Maki Rolls", "Item Name (EN)": "California Roll", "Item Name (AR)": "كاليفورنيا رول", Price: 45, Availability: "Available" },
    { Category: "Maki Rolls", "Item Name (EN)": "Spicy Tuna Roll", "Item Name (AR)": "تونا رول حار", Price: 50, Availability: "Available" },
    { Category: "Platters", "Item Name (EN)": "Party Platter (40pc)", "Item Name (AR)": "طبق حفلات", Price: 250, Availability: "Available" }
];

// 5. Healthy Diet
const dietMenu = [
    { Category: "Keto", "Item Name (EN)": "Keto Burger (No Bun)", "Item Name (AR)": "برجر كيتو", Price: 40, Availability: "Available" },
    { Category: "Keto", "Item Name (EN)": "Steak Salad", "Item Name (AR)": "سلطة ستيك", Price: 55, Availability: "Available" },
    { Category: "Vegan", "Item Name (EN)": "Quinoa Bowl", "Item Name (AR)": "وعاء كينوا", Price: 35, Availability: "Available" },
    { Category: "Vegan", "Item Name (EN)": "Falafel Wrap", "Item Name (AR)": "راب فلافل", Price: 25, Availability: "Available" },
    { Category: "Protein Shakes", "Item Name (EN)": "Chocolate Whey", "Item Name (AR)": "واي بروتين شوكولاتة", Price: 30, Availability: "Available" }
];

console.log("Generating 5 Test Menu Files...");
createMenuFile('1_italian_pizzeria.xlsx', pizzaMenu);
createMenuFile('2_ramadan_special.xlsx', ramadanMenu);
createMenuFile('3_coffee_shop.xlsx', coffeeMenu);
createMenuFile('4_sushi_bar.xlsx', sushiMenu);
createMenuFile('5_healthy_diet.xlsx', dietMenu);
console.log("\nDone! Files found in ./test_menus folder.");
