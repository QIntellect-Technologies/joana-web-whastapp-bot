import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function cleanup() {
    console.log('--- DB TOTAL WIPE START ---');

    const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (deleteError) {
        console.error('Error deleting orders:', deleteError.message);
    } else {
        console.log('Successfully wiped ALL orders.');
    }

    console.log('--- DB TOTAL WIPE END ---');
}

cleanup();
