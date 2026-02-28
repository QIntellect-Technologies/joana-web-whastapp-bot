// Test script to verify Supabase connection
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        // Test 1: Check if we can connect
        console.log('\n✅ Test 1: Basic Connection');
        const { data, error } = await supabase.from('branches').select('count');

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return;
        }

        console.log('✅ Successfully connected to Supabase!');

        // Test 2: Fetch branches
        console.log('\n✅ Test 2: Fetching Branches');
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .select('*');

        if (branchError) {
            console.error('❌ Error fetching branches:', branchError.message);
        } else {
            console.log(`✅ Found ${branches?.length || 0} branches`);
            branches?.forEach(b => console.log(`   - ${b.name}`));
        }

        // Test 3: Fetch menu categories
        console.log('\n✅ Test 3: Fetching Menu Categories');
        const { data: categories, error: catError } = await supabase
            .from('menu_categories')
            .select('*');

        if (catError) {
            console.error('❌ Error fetching categories:', catError.message);
        } else {
            console.log(`✅ Found ${categories?.length || 0} categories`);
            categories?.forEach(c => console.log(`   - ${c.name_en}`));
        }

        console.log('\n🎉 All tests passed! Supabase is ready to use.');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testConnection();
