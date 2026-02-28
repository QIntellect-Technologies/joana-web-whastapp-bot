import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: 'Whatsapp Bot/restaurant-bot-web/.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkPermissions() {
    console.log('🛡️  PERMISSION DIAGNOSIS START\n');

    // 1. Test Menu Item Update
    console.log('1. Testing Menu Item UPDATE...');
    const { data: menuData } = await supabase.from('menu_items').select('id').limit(1);
    if (menuData && menuData.length > 0) {
        const id = menuData[0].id;
        const { error: updateError } = await supabase
            .from('menu_items')
            .update({ price: 99.99 }) // Dummy update
            .eq('id', id);

        if (updateError) console.log(`   ❌ FAILED: ${updateError.message}`);
        else console.log('   ✅ SUCCESS: Menu Item Updated');
    } else {
        console.log('   ⚠️ Skipping (No items found)');
    }

    // 2. Test Customer Delete
    console.log('\n2. Testing Customer DELETE...');
    // Try to delete a non-existent customer to check policy (should fail policy before "row not found" if strict)
    // Or insert dummy then delete
    const { data: cust, error: insertErr } = await supabase.from('customers').insert({
        name: 'Delete Test',
        phone: '000000000'
    }).select();

    if (insertErr) {
        console.log(`   ❌ Insert FAILED: ${insertErr.message}`);
    } else {
        const custId = cust[0].id;
        const { error: deleteError } = await supabase.from('customers').delete().eq('id', custId);
        if (deleteError) console.log(`   ❌ Delete FAILED: ${deleteError.message}`);
        else console.log('   ✅ SUCCESS: Customer Deleted');
    }

    console.log('\n🛡️  DIAGNOSIS COMPLETE');
}

checkPermissions();
