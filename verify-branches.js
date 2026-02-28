import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function verify() {
    console.log('--- DB VERIFICATION START ---');
    const { data, error } = await supabase.from('branches').select('*');
    if (error) {
        console.error('ERROR:', error.message);
    } else {
        console.log('BRANCH_COUNT:', data.length);
        data.forEach(b => console.log('BRANCH:', b.id, b.name));
    }
    console.log('--- DB VERIFICATION END ---');
}

verify();
