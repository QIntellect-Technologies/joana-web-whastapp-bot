import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkSchema() {
    console.log('🔍 SCHEMA INSPECTION: menu_categories\n');

    // Attempt to fetch one record to see structure
    const { data, error } = await supabase.from('menu_categories').select('*').limit(1);

    if (error) {
        console.error('❌ Fetch failed:', error.message);
        if (error.hint) console.log('   Hint:', error.hint);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found record. Columns:');
        Object.keys(data[0]).forEach(key => console.log(`   - ${key}: ${typeof data[0][key]}`));
    } else {
        console.log('⚠️ No records found, but query succeeded. Table exists.');
        // Try inserting to see what columns fail or just check known columns
        // We can't easily DESCRIBE via client, so we rely on the Select *
    }
}

checkSchema();
