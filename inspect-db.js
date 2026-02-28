import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function inspect() {
    console.log('--- TABLE INSPECTION START ---');

    for (const table of ['orders']) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`ERROR (${table}):`, error.message);
        } else {
            console.log(`DATA (${table}):`, JSON.stringify(data[0], null, 2));
        }
    }

    console.log('--- TABLE INSPECTION END ---');
}

inspect();
