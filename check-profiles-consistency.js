import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkProfiles() {
    console.log('--- PROFILE CHECK START ---');

    // 1. Check if any profiles exist
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error fetching profiles:', pError.message);
    } else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => console.log(` - ID: ${p.id}, Email: ${p.email}, Role: ${p.role}`));
    }

    // 2. Check if a specific "superadmin" email has a profile
    // We already know from LoginScreen.tsx the demo email is admin@foodboot.com
    const { data: adminProfile } = await supabase.from('profiles').select('*').eq('email', 'admin@foodboot.com').single();
    if (adminProfile) {
        console.log('\nAdmin profile exists in DB.');
    } else {
        console.log('\nAdmin profile MISSING from DB (Required for session persistence).');
    }

    console.log('--- PROFILE CHECK END ---');
}

checkProfiles();
