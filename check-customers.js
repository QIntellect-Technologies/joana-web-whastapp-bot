// Check specifically for customers table
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkCustomers() {
    console.log('🔍 Checking CUSTOMERS table...\n');

    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*');

        if (error) {
            console.log('❌ ERROR:', error.message);
            console.log('\n⚠️  The CUSTOMERS table does NOT exist in your database!');
            console.log('\n📝 TO FIX: Run the customers_orders_migration.sql script in Supabase SQL Editor');
            return;
        }

        if (!data || data.length === 0) {
            console.log('⚠️  CUSTOMERS table exists but is EMPTY');
            console.log('\n📝 TO FIX: Run the customers_orders_migration.sql script to populate data');
            return;
        }

        console.log(`✅ CUSTOMERS table found with ${data.length} rows\n`);
        console.log('Columns:', Object.keys(data[0]).join(', '));
        console.log('\nSample data:');
        data.slice(0, 3).forEach((customer, i) => {
            console.log(`\n${i + 1}. ${customer.name} (${customer.email})`);
            console.log(`   Total Orders: ${customer.total_orders}`);
            console.log(`   Total Spent: ${customer.total_spent} SAR`);
        });

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

checkCustomers();
