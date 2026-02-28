import { supabase } from '../lib/supabase';

const RIYADH_BRANCH_ID = '550e8400-e29b-41d4-a716-446655440001';

/**
 * Fetches the complete menu dynamically from Supabase
 * Joins menu_items with menu_categories to get category names
 */
export async function fetchDynamicMenu() {
    try {
        console.log('🔄 Fetching LIVE menu from database...');

        // 1. Fetch categories
        const { data: categoriesData, error: catError } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (catError) {
            console.error('❌ Categories fetch error:', catError);
            throw catError;
        }

        // 2. Fetch menu items
        const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('branch_id', RIYADH_BRANCH_ID);
        // We removed .eq('status', 'Available') to allow the bot to handle Out of Stock items with a polite message.

        if (itemsError) {
            console.error('❌ Menu items fetch error:', itemsError);
            throw itemsError;
        }

        console.log(`✅ Fetched ${categoriesData?.length || 0} categories and ${itemsData?.length || 0} menu items`);

        // 3. Create category map for lookup
        const categoryMap = {};
        (categoriesData || []).forEach(cat => {
            categoryMap[cat.id] = cat;
        });

        // 4. Transform categories to bot format
        const categories = (categoriesData || []).map(cat => ({
            id: cat.id,
            title: {
                en: cat.name_en,
                ar: cat.name_ar || cat.name_en
            },
            description: {
                en: cat.description || `Delicious ${cat.name_en} options`,
                ar: cat.description_ar || `خيارات ${cat.name_ar || cat.name_en} لذيذة`
            },
            image: cat.image_url || getCategoryImage(cat.name_en)
        }));

        // 5. Initialize items map
        const itemsMap = {};
        categories.forEach(cat => {
            itemsMap[cat.id] = [];
        });

        // 6. Populate items grouped by category_id
        (itemsData || []).forEach(item => {
            if (item.category_id && itemsMap[item.category_id]) {
                itemsMap[item.category_id].push({
                    id: item.id,
                    catId: item.category_id,
                    subcategory: item.subcategory,
                    name: {
                        en: item.name_en,
                        ar: item.name_ar || item.name_en
                    },
                    price: item.price,
                    image: item.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
                    available_meals: item.available_meals || [], // CRITICAL: Add this field
                    cuisine_type: item.cuisine_type || 'General', // CRITICAL: Add this field
                    status: item.status || 'Available'
                });
            }
        });

        // 7. Log results
        console.log('📊 Menu structure:', {
            categories: categories.map(c => c.title.en),
            itemCounts: Object.entries(itemsMap).map(([catId, items]) => {
                const cat = categoryMap[catId];
                return `${cat?.name_en || catId}: ${items.length}`;
            })
        });

        return {
            categories,
            items: itemsMap
        };

    } catch (error) {
        console.error('❌ Dynamic Menu Fetch Failed:', error);
        return null;
    }
}

// Helper function for category images
function getCategoryImage(categoryName) {
    const imageMap = {
        'Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
        'Lunch': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        'Dinner': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
        'High Tea': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'
    };
    return imageMap[categoryName] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80';
}
