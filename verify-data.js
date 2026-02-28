// Comprehensive database verification
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function verifyData() {
    console.log('🔍 Comprehensive Database Verification\n');
    console.log('='.repeat(50) + '\n');

    try {
        // Test 1: Branches
        console.log('📍 Checking Branches...');
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .select('*');

        if (branchError) {
            console.error('❌ Error:', branchError.message);
        } else {
            console.log(`✅ Found ${branches?.length || 0} branches`);
            branches?.forEach(b => console.log(`   - ${b.name} (${b.status})`));
        }
        console.log('');

        // Test 2: Categories
        console.log('📂 Checking Menu Categories...');
        const { data: categories, error: catError } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order');

        if (catError) {
            console.error('❌ Error:', catError.message);
        } else {
            console.log(`✅ Found ${categories?.length || 0} categories`);
            categories?.forEach(c => console.log(`   ${c.display_order}. ${c.name_en} (${c.name_ar})`));
        }
        console.log('');

        // Test 3: Menu Items
        console.log('🍔 Checking Menu Items...');
        const { data: items, error: itemError } = await supabase
            .from('menu_items')
            .select('*, menu_categories(name_en)');

        if (itemError) {
            console.error('❌ Error:', itemError.message);
        } else {
            console.log(`✅ Found ${items?.length || 0} total menu items`);

            // Group by category
            const byCategory = {};
            items?.forEach(item => {
                const cat = item.menu_categories?.name_en || 'Unknown';
                if (!byCategory[cat]) byCategory[cat] = 0;
                byCategory[cat]++;
            });

            Object.entries(byCategory).forEach(([cat, count]) => {
                console.log(`   - ${cat}: ${count} items`);
            });
        }
        console.log('');

        // Test 4: Menu Items per Branch
        if (branches && branches.length > 0) {
            console.log('🏢 Checking Menu Items per Branch...');
            for (const branch of branches) {
                const { data: branchItems } = await supabase
                    .from('menu_items')
                    .select('id')
                    .eq('branch_id', branch.id);

                console.log(`   - ${branch.name}: ${branchItems?.length || 0} items`);
            }
        }
        console.log('');

        console.log('='.repeat(50));
        console.log('🎉 Verification Complete!\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

verifyData();
