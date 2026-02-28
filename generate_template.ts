import * as XLSX from 'xlsx';

const data = [
    // HEADERS
    ["Category", "Subcategory", "Item Name (EN)", "Item Name (AR)", "Price", "Available Meals", "Cuisine Type"],

    // ==========================================================================================
    // BREAKFAST → Continental, Desi, Arabic
    // ==========================================================================================
    ["Breakfast", "Continental", "Classic Pancakes", "بان كيك كلاسيك", 25, "Breakfast", "General"],
    ["Breakfast", "Continental", "Waffles with Honey", "وافل بالعسل", 28, "Breakfast", "General"],
    ["Breakfast", "Continental", "French Toast", "فرنش توست", 28, "Breakfast", "General"],
    ["Breakfast", "Continental", "English Breakfast Platter", "فطور إنجليزي متكامل", 55, "Breakfast", "General"],
    ["Breakfast", "Continental", "Cheese Omelette", "أومليت بالجبن", 22, "Breakfast", "General"],
    ["Breakfast", "Continental", "Spanish Omelette", "أومليت إسباني", 24, "Breakfast", "General"],
    ["Breakfast", "Continental", "Scrambled Eggs", "بيض مخفوق", 20, "Breakfast", "General"],
    ["Breakfast", "Continental", "Eggs Benedict", "بيض بينيديكت", 38, "Breakfast", "General"],
    ["Breakfast", "Continental", "Avocado Toast", "توست أفوكادو", 35, "Breakfast", "General"],
    ["Breakfast", "Continental", "Club Sandwich", "كلوب ساندويش", 24, "Breakfast", "General"],

    ["Breakfast", "Desi", "Halwa Puri Platter", "طبق حلوى بوري", 20, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Aloo Paratha", "باراتا بطاطس", 12, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Qeema Paratha", "باراتا لحم مفروم", 18, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Lachha Paratha", "باراتا مورقة", 5, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Nihari (Beef)", "نهاري لحم", 45, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Paya (Mutton)", "بايا لحم", 50, "Breakfast", "Desi"],
    ["Breakfast", "Desi", "Chana Masala", "حمص مسالا", 15, "Breakfast", "Desi"],

    ["Breakfast", "Arabic", "Shakshuka", "شكشوكة", 22, "Breakfast", "General"],
    ["Breakfast", "Arabic", "Foul Medames", "فول مدمس", 18, "Breakfast", "General"],
    ["Breakfast", "Arabic", "Falafel Plate", "طبق فلافل", 15, "Breakfast", "General"],
    ["Breakfast", "Arabic", "Labneh with Zatar", "لبنة بالزعتر", 18, "Breakfast", "General"],
    ["Breakfast", "Arabic", "Liver (Kabdah)", "كبدة غنم", 28, "Breakfast", "General"],

    // ==========================================================================================
    // LUNCH → Burgers, Wraps, Pizza, Pasta, Biryani, Karahi, BBQ, Naan, Chinese
    // ==========================================================================================
    ["Lunch", "Burgers", "Classic Beef Burger", "برجر لحم كلاسيك", 35, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Double Cheeseburger", "دبل تشيز برجر", 45, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Swiss Mushroom Burger", "برجر سويسري بالفطر", 42, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Signature Angus Burger", "برجر أنجوس فاخر", 55, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Crispy Chicken Zinger", "زينجر دجاج مقرمش", 32, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Grilled Chicken Burger", "برجر دجاج مشوي", 30, "Lunch", "Fast Food"],
    ["Lunch", "Burgers", "Fish Burger", "برجر سمك", 35, "Lunch", "Fast Food"],

    ["Lunch", "Wraps & Sandwiches", "Chicken Fajita Wrap", "راب دجاج فاهيتا", 28, "Lunch", "Fast Food"],
    ["Lunch", "Wraps & Sandwiches", "Spicy Zinger Wrap", "راب زينجر حار", 26, "Lunch", "Fast Food"],
    ["Lunch", "Wraps & Sandwiches", "Shawarma Wrap", "ساندويش شاورما", 15, "Lunch", "Fast Food"],
    ["Lunch", "Wraps & Sandwiches", "Philly Cheese Steak", "فيلي تشيز ستيك", 45, "Lunch", "Fast Food"],
    ["Lunch", "Wraps & Sandwiches", "Grilled Chicken Panini", "بانيني دجاج مشوي", 32, "Lunch", "Fast Food"],

    ["Lunch", "Pizza", "Margherita Pizza", "بيتزا مارغريتا", 40, "Lunch", "Fast Food"],
    ["Lunch", "Pizza", "Pepperoni Feast", "بيتزا بيبروني", 55, "Lunch", "Fast Food"],
    ["Lunch", "Pizza", "BBQ Chicken Pizza", "بيتزا دجاج باربيكيو", 52, "Lunch", "Fast Food"],
    ["Lunch", "Pizza", "Veggie Supreme", "بيتزا خضار", 45, "Lunch", "Fast Food"],

    ["Lunch", "Pasta", "Fettuccine Alfredo", "فيتوتشيني ألفريدو", 45, "Lunch", "Fast Food"],
    ["Lunch", "Pasta", "Spaghetti Bolognese", "سباغيتي بولونيز", 42, "Lunch", "Fast Food"],
    ["Lunch", "Pasta", "Lasagna", "لازانيا", 48, "Lunch", "Fast Food"],

    ["Lunch", "Fried Chicken", "Broast (4 Pieces)", "بروستد 4 قطع", 28, "Lunch", "Fast Food"],
    ["Lunch", "Fried Chicken", "Spicy Wings (6 Pieces)", "أجنحة حارة 6 قطع", 22, "Lunch", "Fast Food"],
    ["Lunch", "Fried Chicken", "Chicken Nuggets", "ناجت دجاج", 18, "Lunch", "Fast Food"],

    ["Lunch", "Biryani & Rice", "Chicken Biryani", "برياني دجاج", 35, "Lunch", "Desi"],
    ["Lunch", "Biryani & Rice", "Mutton Biryani", "برياني لحم ضأن", 55, "Lunch", "Desi"],
    ["Lunch", "Biryani & Rice", "Beef Pulao", "بلو لحم", 40, "Lunch", "Desi"],
    ["Lunch", "Biryani & Rice", "Zeera Rice", "أرز بالكمون", 15, "Lunch", "Desi"],

    ["Lunch", "Karahi & Curries", "Chicken Karahi (Half)", "كراهي دجاج نصف", 45, "Lunch", "Desi"],
    ["Lunch", "Karahi & Curries", "Chicken Karahi (Full)", "كراهي دجاج كامل", 80, "Lunch", "Desi"],
    ["Lunch", "Karahi & Curries", "Mutton Karahi (Half)", "كراهي لحم نصف", 70, "Lunch", "Desi"],
    ["Lunch", "Karahi & Curries", "Butter Chicken", "دجاج بالزبدة", 45, "Lunch", "Desi"],
    ["Lunch", "Karahi & Curries", "Daal Makhani", "دال مخاني", 28, "Lunch", "Desi"],
    ["Lunch", "Karahi & Curries", "Palak Paneer", "بالاك بانير", 32, "Lunch", "Desi"],

    ["Lunch", "BBQ", "Chicken Tikka Boti", "تكا دجاج", 35, "Lunch", "Desi"],
    ["Lunch", "BBQ", "Malai Boti", "ملاي بوتي", 38, "Lunch", "Desi"],
    ["Lunch", "BBQ", "Seekh Kabab (Beef)", "سيخ كباب لحم", 40, "Lunch", "Desi"],
    ["Lunch", "BBQ", "Mixed BBQ Platter", "مشويات مشكلة", 95, "Lunch", "Desi"],

    ["Lunch", "Breads", "Plain Naan", "خبز نان", 3, "Lunch", "Desi"],
    ["Lunch", "Breads", "Butter Naan", "نان بالزبدة", 5, "Lunch", "Desi"],
    ["Lunch", "Breads", "Garlic Naan", "نان بالثوم", 7, "Lunch", "Desi"],
    ["Lunch", "Breads", "Cheese Naan", "نان بالجبن", 12, "Lunch", "Desi"],

    ["Lunch", "Chinese", "Chicken Corn Soup", "شوربة ذرة بالدجاج", 18, "Lunch", "General"],
    ["Lunch", "Chinese", "Chicken Manchurian", "دجاج منشوريان", 40, "Lunch", "General"],
    ["Lunch", "Chinese", "Chicken Chow Mein", "تشاو مين دجاج", 35, "Lunch", "General"],
    ["Lunch", "Chinese", "Chicken Fried Rice", "أرز مقلي بالدجاج", 32, "Lunch", "General"],

    // ==========================================================================================
    // DINNER → Same subcategories as Lunch but with more variety
    // ==========================================================================================
    ["Dinner", "Burgers", "Classic Beef Burger", "برجر لحم كلاسيك", 35, "Dinner", "Fast Food"],
    ["Dinner", "Burgers", "Double Cheeseburger", "دبل تشيز برجر", 45, "Dinner", "Fast Food"],
    ["Dinner", "Burgers", "BBQ Bacon Burger", "برجر باربيكيو بيكون", 48, "Dinner", "Fast Food"],
    ["Dinner", "Burgers", "Signature Angus Burger", "برجر أنجوس فاخر", 55, "Dinner", "Fast Food"],
    ["Dinner", "Burgers", "Crispy Chicken Zinger", "زينجر دجاج مقرمش", 32, "Dinner", "Fast Food"],

    ["Dinner", "Wraps & Sandwiches", "Chicken Fajita Wrap", "راب دجاج فاهيتا", 28, "Dinner", "Fast Food"],
    ["Dinner", "Wraps & Sandwiches", "Spicy Zinger Wrap", "راب زينجر حار", 26, "Dinner", "Fast Food"],
    ["Dinner", "Wraps & Sandwiches", "Philly Cheese Steak", "فيلي تشيز ستيك", 45, "Dinner", "Fast Food"],

    ["Dinner", "Pizza", "Margherita Pizza", "بيتزا مارغريتا", 40, "Dinner", "Fast Food"],
    ["Dinner", "Pizza", "Pepperoni Feast", "بيتزا بيبروني", 55, "Dinner", "Fast Food"],
    ["Dinner", "Pizza", "BBQ Chicken Pizza", "بيتزا دجاج باربيكيو", 52, "Dinner", "Fast Food"],
    ["Dinner", "Pizza", "Hawaiian Pizza", "بيتزا هاواي", 50, "Dinner", "Fast Food"],

    ["Dinner", "Pasta", "Fettuccine Alfredo", "فيتوتشيني ألفريدو", 45, "Dinner", "Fast Food"],
    ["Dinner", "Pasta", "Spaghetti Bolognese", "سباغيتي بولونيز", 42, "Dinner", "Fast Food"],
    ["Dinner", "Pasta", "Lasagna", "لازانيا", 48, "Dinner", "Fast Food"],

    ["Dinner", "Steaks & Grills", "Ribeye Steak (300g)", "ستيك ريب آي", 120, "Dinner", "Fast Food"],
    ["Dinner", "Steaks & Grills", "T-Bone Steak", "تي بون ستيك", 110, "Dinner", "Fast Food"],
    ["Dinner", "Steaks & Grills", "Grilled Salmon", "سلمون مشوي", 85, "Dinner", "Fast Food"],
    ["Dinner", "Steaks & Grills", "Lamb Chops", "ريش غنم", 90, "Dinner", "Fast Food"],

    ["Dinner", "Fried Chicken", "Broast (8 Pieces)", "بروستد 8 قطع", 50, "Dinner", "Fast Food"],
    ["Dinner", "Fried Chicken", "Spicy Wings (12 Pieces)", "أجنحة حارة 12 قطعة", 40, "Dinner", "Fast Food"],
    ["Dinner", "Fried Chicken", "Chicken Strips", "ستربس دجاج", 25, "Dinner", "Fast Food"],

    ["Dinner", "Biryani & Rice", "Chicken Biryani Special", "برياني دجاج فاخر", 35, "Dinner", "Desi"],
    ["Dinner", "Biryani & Rice", "Mutton Biryani", "برياني لحم ضأن", 55, "Dinner", "Desi"],
    ["Dinner", "Biryani & Rice", "Beef Biryani", "برياني لحم بقر", 40, "Dinner", "Desi"],
    ["Dinner", "Biryani & Rice", "Chicken Pulao", "بلو دجاج", 30, "Dinner", "Desi"],

    ["Dinner", "Karahi & Curries", "Chicken Karahi (Half)", "كراهي دجاج نصف", 45, "Dinner", "Desi"],
    ["Dinner", "Karahi & Curries", "Chicken Karahi (Full)", "كراهي دجاج كامل", 80, "Dinner", "Desi"],
    ["Dinner", "Karahi & Curries", "Mutton Karahi (Full)", "كراهي لحم كامل", 130, "Dinner", "Desi"],
    ["Dinner", "Karahi & Curries", "Butter Chicken", "دجاج بالزبدة", 45, "Dinner", "Desi"],
    ["Dinner", "Karahi & Curries", "Daal Mash", "عدس ماش", 20, "Dinner", "Desi"],

    ["Dinner", "BBQ", "Chicken Tikka (Full)", "تكا دجاج كامل", 35, "Dinner", "Desi"],
    ["Dinner", "BBQ", "Malai Boti", "ملاي بوتي", 38, "Dinner", "Desi"],
    ["Dinner", "BBQ", "Chicken Behari Kabab", "كباب دجاج بيهاري", 38, "Dinner", "Desi"],
    ["Dinner", "BBQ", "Beef Seekh Kabab", "سيخ كباب لحم", 40, "Dinner", "Desi"],
    ["Dinner", "BBQ", "Mixed BBQ Platter (Large)", "مشويات مشكلة كبير", 160, "Dinner", "Desi"],

    ["Dinner", "Breads", "Plain Naan", "خبز نان", 3, "Dinner", "Desi"],
    ["Dinner", "Breads", "Butter Naan", "نان بالزبدة", 5, "Dinner", "Desi"],
    ["Dinner", "Breads", "Garlic Naan", "نان بالثوم", 7, "Dinner", "Desi"],
    ["Dinner", "Breads", "Cheese Naan", "نان بالجبن", 12, "Dinner", "Desi"],

    ["Dinner", "Chinese", "Hot & Sour Soup", "شوربة حامض وحار", 20, "Dinner", "General"],
    ["Dinner", "Chinese", "Chicken Manchurian", "دجاج منشوريان", 40, "Dinner", "General"],
    ["Dinner", "Chinese", "Kung Pao Chicken", "دجاج كونغ باو", 42, "Dinner", "General"],
    ["Dinner", "Chinese", "Chicken Chow Mein", "تشاو مين دجاج", 35, "Dinner", "General"],

    // ==========================================================================================
    // HIGH TEA → Snacks, Desserts, Beverages
    // ==========================================================================================
    ["High Tea", "Snacks", "Vegetable Samosa (2 pcs)", "سمبوسة خضار", 8, "High Tea", "Desi"],
    ["High Tea", "Snacks", "Beef Samosa (2 pcs)", "سمبوسة لحم", 10, "High Tea", "Desi"],
    ["High Tea", "Snacks", "Chicken Spring Rolls", "سبرينغ رول دجاج", 12, "High Tea", "General"],
    ["High Tea", "Snacks", "Pakora Mix", "باكورا مشكل", 15, "High Tea", "Desi"],
    ["High Tea", "Snacks", "Club Sandwich Platter", "طبق كلوب ساندويش", 35, "High Tea", "General"],
    ["High Tea", "Snacks", "Mini Sliders (3 pcs)", "ميني برجر", 30, "High Tea", "Fast Food"],
    ["High Tea", "Snacks", "French Fries", "بطاطس مقلية", 15, "High Tea", "Fast Food"],
    ["High Tea", "Snacks", "Cheesy Fries", "بطاطس بالجبن", 22, "High Tea", "Fast Food"],
    ["High Tea", "Snacks", "Mozzarella Sticks", "أصابع موزاريلا", 25, "High Tea", "General"],

    ["High Tea", "Desserts", "Gulab Jamun", "جلاب جامون", 15, "High Tea", "Desi"],
    ["High Tea", "Desserts", "Ras Malai", "راس ملاي", 18, "High Tea", "Desi"],
    ["High Tea", "Desserts", "Chocolate Brownie", "براوني", 20, "High Tea", "General"],
    ["High Tea", "Desserts", "Cheesecake", "تشيز كيك", 28, "High Tea", "General"],
    ["High Tea", "Desserts", "Kunafa", "كنافة", 30, "High Tea", "General"],

    ["High Tea", "Beverages", "Karak Tea", "شاي كرك", 5, "High Tea", "Desi"],
    ["High Tea", "Beverages", "Cappuccino", "كابتشينو", 18, "High Tea", "General"],
    ["High Tea", "Beverages", "Latte", "لاتيه", 20, "High Tea", "General"],
    ["High Tea", "Beverages", "Fresh Orange Juice", "عصير برتقال طازج", 18, "High Tea", "General"],
    ["High Tea", "Beverages", "Mint Lemonade", "ليمون بالنعناع", 15, "High Tea", "General"],
    ["High Tea", "Beverages", "Mango Shake", "ميلك شيك مانجو", 22, "High Tea", "General"]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

ws['!cols'] = [
    { wch: 12 },  // Category
    { wch: 20 },  // Subcategory
    { wch: 35 },  // Name EN
    { wch: 30 },  // Name AR
    { wch: 10 },  // Price
    { wch: 20 },  // Meals
    { wch: 15 }   // Cuisine
];

XLSX.utils.book_append_sheet(wb, ws, "Global Menu");
XLSX.writeFile(wb, "Global_Menu_Template.xlsx");

console.log(`✅ Global_Menu_Template.xlsx created with ${data.length - 1} items!`);
console.log(`📋 Main Categories: Breakfast, Lunch, Dinner, High Tea`);
console.log(`📂 Subcategories: Burgers, Pizza, Biryani, BBQ, etc.`);
