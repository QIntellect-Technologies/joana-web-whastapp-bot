
const testPhrases = [
    "cat_snacks_sides",
    "Snacks & Sides",
    "snacks and sides",
    "SNACKS AND SIDES",
    "snacks   and   sides",
    "Burgers & Meals",
    "burgers and meals"
];

console.log("🚀 Verifying Text Normalization Logic...");

testPhrases.forEach(text => {
    const cleanText = text.trim();
    const normalizedText = cleanText.toLowerCase().replace(/\s+/g, ' ');

    let match = "NONE";

    // Logic copied from useBotEngine.js
    const isSnacksSides = normalizedText === 'cat_snacks_sides' ||
        normalizedText === 'snacks & sides' ||
        normalizedText === 'snacks and sides';

    const isBurgersMeals = normalizedText === 'cat_burgers_meals' ||
        normalizedText === 'burgers & meals' ||
        normalizedText === 'burgers and meals';

    if (isSnacksSides) match = "Snacks & Sides";
    if (isBurgersMeals) match = "Burgers & Meals";

    console.log(`"${text}" -> "${normalizedText}" -> MATCH: ${match}`);
});
