const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('DATA:', JSON.stringify(data, null, 2));
    }
}

test();
