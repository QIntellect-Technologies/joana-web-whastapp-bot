import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkVoiceSchema() {
    console.log('🔍 SCHEMA INSPECTION: voice_text_orders\n');

    // Attempt to fetch one record to see structure
    const { data, error } = await supabase.from('voice_text_orders').select('*').limit(1);

    if (error) {
        console.error('❌ Fetch failed:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found record. Columns:');
        Object.keys(data[0]).forEach(key => console.log(`   - ${key}: ${typeof data[0][key]}`));
    } else {
        console.log('⚠️ No records found. Attempting to insert dummy to verify schema...');
        // Insert dummy with 'raw_transcript' to force error if missing
        const { error: insertErr } = await supabase.from('voice_text_orders').insert([{
            transcript: "test",
            raw_transcript: "test", // This should fail if missing
            is_voice: false,
            language: "en"
        }]);

        if (insertErr) {
            console.log('❌ Insert Error:', insertErr.message);
        } else {
            console.log('✅ Insert Succeeded (Column exists!)');
        }
    }
}

checkVoiceSchema();
