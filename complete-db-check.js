import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

const tables = ['branches', 'menu_categories', 'menu_items', 'staff_members', 'orders', 'customers', 'profiles'];

async function runCheck() {
    console.log('--- DEEP DB CHECK START ---');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`TABLE: ${table.padEnd(15)} | ERROR: ${error.message}`);
        } else {
            console.log(`TABLE: ${table.padEnd(15)} | COUNT: ${count}`);
        }
    }
    console.log('--- DEEP DB CHECK END ---');
}

runCheck();
