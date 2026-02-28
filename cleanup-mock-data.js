import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const MOCK_NAMES = [
    'Karim Abdul', 'Layla Hassan', 'Mona Lisa', 'Omar Khalid', 'Aisha Mohammed',
    'Fahad Ali', 'Maryam Saeed', 'Reem Sultan', 'David Wilson', 'John Smith',
    'Tariq Fahad', 'Omar Youssef', 'Saad Majed', 'Layla Ibrahim', 'Huda Nasser',
    'Khalid Mansour', 'Sarah Ahmed', 'Noura Khalid', 'Abdullah Rahman',
    'Mohammed Al-Salem', 'Ahmed Hassan', 'Amal Khaled', 'Fatima Ali', 'Faisal Al-Otaibi'
];

async function cleanupMockDataAggressive() {
    console.log('🚀 STARTING AGGRESSIVE MOCK DATA PURGE...\n');

    try {
        // 1. First, wipe ALL orders linked to ANY of these names (cascading)
        console.log('📦 Finding mock customers everywhere...');

        const [{ data: custInC }, { data: custInP }] = await Promise.all([
            supabase.from('customers').select('id, name').in('name', MOCK_NAMES),
            supabase.from('profiles').select('id, name').in('name', MOCK_NAMES)
        ]);

        const allMockIds = Array.from(new Set([
            ...(custInC || []).map(c => c.id),
            ...(custInP || []).map(p => p.id)
        ]));

        if (allMockIds.length === 0) {
            console.log('✨ No mock users found in database.');
            return;
        }

        console.log(`🔍 Found ${allMockIds.length} unique mock IDs.`);

        // 2. Delete from orders (Very important)
        console.log('🗑️ Deleting all orders from these users...');
        await supabase.from('orders').delete().in('customer_id', allMockIds);

        // 3. Delete from customers
        console.log('🗑️ Deleting from customers table...');
        await supabase.from('customers').delete().in('id', allMockIds);

        // 4. Delete from profiles
        console.log('🗑️ Deleting from profiles table...');
        await supabase.from('profiles').delete().in('id', allMockIds);

        // 5. Clean up "Guest" orders if necessary (keep the very recent ones?)
        // Let's keep them so the user doesn't think the whole kitchen monitor is empty,
        // but the orders with NULL customer_id will show up as "Guest".

        console.log('\n✅ AGGRESSIVE PURGE COMPLETE!');
        console.log('👉 Please REFRESH your browser tab now.');

    } catch (error) {
        console.error('❌ Purge failed:', error.message);
    }
}

cleanupMockDataAggressive();
