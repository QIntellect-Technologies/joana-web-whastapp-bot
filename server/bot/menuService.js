const { supabase } = require('../lib/supabase');

const RIYADH_BRANCH_ID = '550e8400-e29b-41d4-a716-446655440001';

async function fetchDynamicMenu() {
    try {
        console.log('🔄 Fetching LIVE menu from database...');

        const { data: categoriesData, error: catError } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (catError) throw catError;

        const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('branch_id', RIYADH_BRANCH_ID);

        if (itemsError) throw itemsError;

        const categoryMap = {};
        (categoriesData || []).forEach(cat => {
            categoryMap[cat.id] = cat;
        });

        const categories = (categoriesData || []).map(cat => ({
            id: cat.id,
            title: {
                en: cat.name_en,
                ar: cat.name_ar || cat.name_en
            },
            description: {
                en: cat.description || `Delicious ${cat.name_en} options`,
                ar: cat.description_ar || `خيارات ${cat.name_ar || cat.name_en} لذيذة`
            }
        }));

        const itemsMap = {};
        categories.forEach(cat => {
            itemsMap[cat.id] = [];
        });

        (itemsData || []).forEach(item => {
            if (item.category_id && itemsMap[item.category_id]) {
                itemsMap[item.category_id].push({
                    id: item.id,
                    catId: item.category_id,
                    name: {
                        en: item.name_en,
                        ar: item.name_ar || item.name_en
                    },
                    price: item.price,
                    status: item.status || 'Available'
                });
            }
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

module.exports = { fetchDynamicMenu };
