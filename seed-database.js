// Seed script to populate Supabase database
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Insert Branches
        console.log('📍 Inserting branches...');
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .insert([
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    name: 'Downtown Riyadh',
                    address: 'King Fahd Road, Riyadh, KSA',
                    manager: 'Ahmed Al-Saud',
                    contact: '+966 11 456 7890',
                    status: 'Active'
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    name: 'Jeddah Corniche',
                    address: 'North Corniche, Jeddah, KSA',
                    manager: 'Sara Khalid',
                    contact: '+966 12 654 3210',
                    status: 'Active'
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440003',
                    name: 'Dammam Seafront',
                    address: 'King Abdullah Park, Dammam, KSA',
                    manager: 'Omar F',
                    contact: '+966 13 333 4444',
                    status: 'Inactive'
                }
            ])
            .select();

        if (branchError) throw branchError;
        console.log(`✅ Inserted ${branches?.length || 0} branches\n`);

        // 2. Insert Menu Categories
        console.log('📂 Inserting menu categories...');
        const { data: categories, error: catError } = await supabase
            .from('menu_categories')
            .insert([
                { id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Burgers', name_ar: 'برجر', display_order: 1 },
                { id: 'c10e8400-e29b-41d4-a716-446655440002', name_en: 'Wraps', name_ar: 'تورتيلا', display_order: 2 },
                { id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Sandwiches', name_ar: 'ساندويتش', display_order: 3 },
                { id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Sides', name_ar: 'جوانب', display_order: 4 },
                { id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Meals', name_ar: 'وجبات', display_order: 5 },
                { id: 'c10e8400-e29b-41d4-a716-446655440006', name_en: 'Juices', name_ar: 'عصائر', display_order: 6 },
                { id: 'c10e8400-e29b-41d4-a716-446655440007', name_en: 'Drinks', name_ar: 'مشروبات', display_order: 7 }
            ])
            .select();

        if (catError) throw catError;
        console.log(`✅ Inserted ${categories?.length || 0} categories\n`);

        // 3. Insert Menu Items for all branches
        console.log('🍔 Inserting menu items...');

        const menuItems = [
            // Burgers
            { category_id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Chicken Burger', name_ar: 'برجر دجاج', price: 9.5, stock: 15, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Beef Burger', name_ar: 'برجر لحم', price: 9.5, stock: 20, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Regular Zinger Burger', name_ar: 'برجر زنجر عادي', price: 13.5, stock: 20, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Spicy Zinger Burger', name_ar: 'برجر زنجر حار', price: 11.5, stock: 12, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440001', name_en: 'Crispy Burger', name_ar: 'برجر كرسبي', price: 14, stock: 8, min_stock_threshold: 5 },
            // Wraps
            { category_id: 'c10e8400-e29b-41d4-a716-446655440002', name_en: 'Spicy Tortilla Zinger', name_ar: 'تورتيلا زنجر حار', price: 12.5, stock: 18, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440002', name_en: 'Regular Tortilla Zinger', name_ar: 'تورتيلا زنجر عادي', price: 14.5, stock: 15, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440002', name_en: 'Tortilla Chicken Jumbo', name_ar: 'تورتيلا دجاج جامبو', price: 15, stock: 25, min_stock_threshold: 5 },
            // Sandwiches
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Kibdah Sandwich', name_ar: 'ساندويتش كبدة', price: 4.75, stock: 30, min_stock_threshold: 10 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Egg Sandwich', name_ar: 'ساندويتش بيض', price: 3.75, stock: 40, min_stock_threshold: 10 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Shakshouka Sandwich', name_ar: 'ساندويتش شكشوكة', price: 3.75, stock: 20, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Chicken Sandwich', name_ar: 'ساندويتش دجاج', price: 4.75, stock: 15, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Kabab Chicken Jumbo', name_ar: 'كباب دجاج جامبو', price: 14.5, stock: 10, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Kudu Chicken Sandwich', name_ar: 'ساندويتش دجاج كودو', price: 16.5, stock: 5, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Falafel Sandwich', name_ar: 'ساندويتش فلافل', price: 4.75, stock: 50, min_stock_threshold: 10 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440003', name_en: 'Hot Dog Jumbo', name_ar: 'هوت دوج جامبو', price: 8.5, stock: 12, min_stock_threshold: 5 },
            // Sides
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Popcorn', name_ar: 'فشار', price: 6, stock: 100, min_stock_threshold: 20 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Sweet Potato', name_ar: 'بطاطس حلوة', price: 7.5, stock: 30, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Sweet Corn', name_ar: 'ذرة حلوة', price: 8, stock: 25, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'French Fries', name_ar: 'بطاطس مقلية', price: 8, stock: 150, min_stock_threshold: 30 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Potato Crispy', name_ar: 'بطاطس كرسبي', price: 8, stock: 40, min_stock_threshold: 10 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Corn Dog', name_ar: 'كورندوج', price: 8, stock: 15, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Chicken Nuggets (8 pcs)', name_ar: 'دجاج ناجتس ٨ قطع', price: 12, stock: 12, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Chicken Popcorn', name_ar: 'دجاج بوب كورن', price: 8.5, stock: 20, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440004', name_en: 'Onion Rings', name_ar: 'حلقات بصل', price: 8, stock: 30, min_stock_threshold: 5 },
            // Meals
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Chicken Burger Meal', name_ar: 'وجبة برجر دجاج', price: 14.5, stock: 10, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Beef Burger Meal', name_ar: 'وجبة برجر لحم', price: 14.5, stock: 8, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Crispy Burger Meal', name_ar: 'وجبة برجر كرسبي', price: 19.5, stock: 5, min_stock_threshold: 3 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Tortilla Chicken Meal', name_ar: 'وجبة تورتيلا دجاج', price: 15.5, stock: 12, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Kabab Chicken Meal', name_ar: 'وجبة كباب دجاج', price: 19.5, stock: 6, min_stock_threshold: 3 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Hot Dog Meal', name_ar: 'وجبة هوت دوج', price: 13.5, stock: 15, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Spicy Zinger Burger Meal', name_ar: 'وجبة برجر زنجر حار', price: 16.5, stock: 10, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Regular Zinger Burger Meal', name_ar: 'وجبة برجر زنجر عادي', price: 18.5, stock: 12, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Spicy Tortilla Zinger Meal', name_ar: 'وجبة تورتيلا زنجر حار', price: 17.5, stock: 8, min_stock_threshold: 3 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Regular Tortilla Zinger Meal', name_ar: 'وجبة تورتيلا زنجر عادي', price: 19.5, stock: 5, min_stock_threshold: 3 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Spicy Chicken Barosted', name_ar: 'دجاج باروستد حار', price: 19.5, stock: 10, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440005', name_en: 'Chicken Nuggets Meal', name_ar: 'وجبة دجاج ناجتس', price: 17.5, stock: 12, min_stock_threshold: 5 },
            // Juices
            { category_id: 'c10e8400-e29b-41d4-a716-446655440006', name_en: 'Rabia Juice', name_ar: 'عصير ربيع', price: 2.5, stock: 60, min_stock_threshold: 10 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440006', name_en: 'Fresh Orange Juice', name_ar: 'عصير برتقال طازج', price: 10, stock: 20, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440006', name_en: 'Slash Juice', name_ar: 'عصير سلاش', price: 6, stock: 30, min_stock_threshold: 5 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440006', name_en: 'Cocktail Juice', name_ar: 'عصير كوكتيل', price: 6, stock: 25, min_stock_threshold: 5 },
            // Drinks
            { category_id: 'c10e8400-e29b-41d4-a716-446655440007', name_en: 'Pepsi', name_ar: 'بيبسي', price: 2.5, stock: 100, min_stock_threshold: 20 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440007', name_en: 'Water', name_ar: 'ماء', price: 1.5, stock: 200, min_stock_threshold: 50 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440007', name_en: 'Tea', name_ar: 'شاي', price: 1.5, stock: 100, min_stock_threshold: 20 },
            { category_id: 'c10e8400-e29b-41d4-a716-446655440007', name_en: 'Coffee', name_ar: 'قهوة', price: 3, stock: 80, min_stock_threshold: 15 }
        ];

        // Insert for all 3 branches
        let totalInserted = 0;
        for (const branchId of ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003']) {
            const itemsForBranch = menuItems.map(item => ({
                ...item,
                branch_id: branchId,
                status: 'Available'
            }));

            const { data, error } = await supabase
                .from('menu_items')
                .insert(itemsForBranch)
                .select();

            if (error) throw error;
            totalInserted += data?.length || 0;
        }

        console.log(`✅ Inserted ${totalInserted} menu items across all branches\n`);
        console.log('🎉 Database seeding completed successfully!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
