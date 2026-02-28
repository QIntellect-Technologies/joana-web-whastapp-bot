import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgfbxpmzdiktsicdjtno.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5mPO3YezPMbX3UBMIzSHJA_zPF6FD2F';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createSuperAdmin() {
    const email = 'superadmin@foodbot.com';
    const password = 'superadmin';

    console.log(`[Script] Creating Superadmin: ${email}`);

    // 1. Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('[Script] Sign Up Error:', signUpError.message);
    } else {
        console.log('[Script] Sign Up Success:', signUpData.user?.id);
    }

    // 2. Upsert Profile
    // Need user ID. If signup failed (likely "already registered"), we try to sign in to get ID.
    let userId = signUpData.user?.id;

    if (!userId) {
        console.log('[Script] User already exists? Attempting login to get ID...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            console.error('[Script] FATAL: Could not sign in either:', signInError.message);
            return;
        }
        userId = signInData.user?.id;
    }

    if (userId) {
        console.log(`[Script] Upserting Profile for ID: ${userId}`);
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: email,
            role: 'Main Admin', // Ensure this matches UserRole.MAIN_ADMIN enum string
            full_name: 'Global Super Admin',
            updated_at: new Date().toISOString()
        });

        if (profileError) {
            console.error('[Script] Profile Update Failed:', profileError);
        } else {
            console.log('[Script] SUCCESS: Superadmin profile configured.');
        }
    }
}

createSuperAdmin();
