import xlsx from 'xlsx';
import fs from 'fs';

const BRANCH_FILE = "e:/Imran Projects/QIntellect Projects/Whatsapp Bot/Joana_Information/Branches.xlsx";
const MENU_FILE = "e:/Imran Projects/QIntellect Projects/Whatsapp Bot/Joana_Information/Menu (9).xlsx";
const OUTPUT_DIR = "e:/Imran Projects/QIntellect Projects/Whatsapp Bot/restaurant-bot-web/src/data";

// Helper to write file
const writeJS = (filename, content) => {
    fs.writeFileSync(`${OUTPUT_DIR}/${filename}`, content);
    console.log(`Generated ${filename}`);
};

// --- Process Branches ---
// Structure: [Sr No, Branch Name, Address, Phone, Icon]
const wbBranch = xlsx.readFile(BRANCH_FILE);
const branchData = xlsx.utils.sheet_to_json(wbBranch.Sheets[wbBranch.SheetNames[0]], { header: 1 });
branchData.shift(); // Remove Header Row

// Use the first valid branch
const row = branchData.find(r => r[1]); // Find first row with a branch name
const branchInfo = {
    name: "Joana's Restaurant", // Default main name, or specific branch
    branches: branchData.map(r => ({
        name: r[1],
        address: r[2],
        phone: r[3]
    })).filter(b => b.name),
    // For single view, pick the first one
    location: row ? row[2] : "Riyadh",
    phone: row ? String(row[3]) : "+966xxxxxxx",
    workingHours: "1:00 PM - 1:00 AM", // Hardcoded safely
    googleMapsLink: "https://maps.google.com" // Placeholder
};

const branchContent = `export const branchInfo = ${JSON.stringify(branchInfo, null, 2)};`;
writeJS('branchInfo.js', branchContent);


// --- Process Menu ---
// Structure: [Category, Name En, Name Ar, Price, Key]
const wbMenu = xlsx.readFile(MENU_FILE);
const menuData = xlsx.utils.sheet_to_json(wbMenu.Sheets[wbMenu.SheetNames[0]], { header: 1 });
menuData.shift(); // Remove Header Row

const categoriesMap = new Map();
const itemsMap = {};

// Use generic image provided
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";

menuData.forEach(row => {
    // Cols: 0=Category, 1=NameEn, 2=NameAr, 3=Price
    const catName = row[0];
    if (!catName) return;

    const catId = catName.toLowerCase().trim().replace(/\s+/g, '_').replace(/&/g, 'and');

    // Add Category
    if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, {
            id: catId,
            title: { en: catName, ar: catName }, // Using same name for AR unless we map it manually or have translation
            description: { en: "Select from our " + catName, ar: "اختر من " + catName },
            image: DEFAULT_IMAGE
        });
        itemsMap[catId] = [];
    }

    // Add Item
    // Image 1 showing: category, name_en, name_ar, price, key
    itemsMap[catId].push({
        id: row[4] ? String(row[4]) : (row[1] || "item").toLowerCase().replace(/\s+/g, '_'), // Use Key column (index 4) if available
        name: { en: row[1], ar: row[2] || row[1] },
        description: {
            en: row[1],
            ar: row[2] || row[1]
        },
        price: parseFloat(row[3]) || 0,
        image: DEFAULT_IMAGE
    });
});

const menu = {
    categories: Array.from(categoriesMap.values()),
    items: itemsMap
};

const menuContent = `export const menu = ${JSON.stringify(menu, null, 2)};`;
writeJS('menu.js', menuContent);

console.log("Conversion Complete.");
