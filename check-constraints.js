import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function check() {
    console.log('--- FOREIGN KEY CHECK START ---');
    // Using rpc or a raw query view would be better, but we don't have rpc for this easily.
    // Let's try to query information_schema if we have permissions?
    // Often Anon key doesn't have read for information_schema.
    // Alternative: Try simple selects without nesting to confirm tables exist.

    const tables = ['staff_members', 'staff_attendance', 'staff_kpi_history', 'staff_documents'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`Table ${t}: ${error ? 'ERROR: ' + error.message : count + ' rows'}`);
    }

    // Try a simple join to test if PostgREST sees the FK
    const { data, error } = await supabase
        .from('staff_members')
        .select('id, staff_attendance(id)')
        .limit(1);

    if (error) {
        console.error('JOIN ERROR:', error.message);
        console.error('DETAILS:', error.details);
    } else {
        console.log('JOIN SUCCESSFUL!');
    }
    console.log('--- FOREIGN KEY CHECK END ---');
}

check();
