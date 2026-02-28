import { createClient } from '@supabase/supabase-js';

// DEBUGGING: Log environment variables to check what Vite is loading
console.log('--- SUPABASE DEBUGGING ---');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '(exists)' : '(missing)');
console.log('--------------------------');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).ENV?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).ENV?.VITE_SUPABASE_ANON_KEY || '';


if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
