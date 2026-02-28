import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkCurrentState() {
    console.log('🔍 DATABASE CURRENT STATE CHECK\n');

    // 1. Check Customers
    const { data: customers } = await supabase.from('customers').select('id, name, phone');
    console.log(`👥 Total Customers in DB: ${customers?.length || 0}`);
    customers?.forEach(c => console.log(`   - ${c.name} (${c.phone || 'no phone'})`));

    // 2. Check Orders
    const { data: orders } = await supabase.from('orders').select('id, customer_id, total, status').order('created_at', { ascending: false }).limit(5);
    console.log(`\n📦 Last 5 Orders:`);
    orders?.forEach(o => console.log(`   - ID: ${o.id.slice(0, 8)} | CustomerID: ${o.customer_id || 'NULL (Guest)'} | Status: ${o.status}`));

    // 3. Check RLS Policies (Heuristic)
    console.log('\n🛡️ Checking Permissions (Attempting to insert dummy customer)...');
    const { error: insertError } = await supabase.from('customers').insert({ name: 'RLS TEST', phone: '0000000000' });
    if (insertError) {
        console.log(`❌ PERMISSION DENIED: ${insertError.message}`);
        console.log('   (This is why the bot can\'t create users!)');
    } else {
        console.log('✅ PERMISSION GRANTED: Can insert into customers.');
        // Cleanup test
        await supabase.from('customers').delete().eq('name', 'RLS TEST');
    }
}

checkCurrentState();
