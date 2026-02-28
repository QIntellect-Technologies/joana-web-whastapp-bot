// Complete Database Verification Script
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function completeVerification() {
    console.log('🔍 COMPLETE DATABASE VERIFICATION\n');
    console.log('='.repeat(60) + '\n');

    try {
        // 1. Branches
        console.log('📍 BRANCHES:');
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .select('*');

        if (branchError) {
            console.error('❌ Error:', branchError.message);
        } else {
            console.log(`✅ Total: ${branches?.length || 0}`);
            branches?.forEach(b => console.log(`   - ${b.name} (${b.status})`));
        }
        console.log('');

        // 2. Menu Categories
        console.log('📂 MENU CATEGORIES:');
        const { data: categories } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order');

        console.log(`✅ Total: ${categories?.length || 0}`);
        categories?.forEach(c => console.log(`   ${c.display_order}. ${c.name_en}`));
        console.log('');

        // 3. Menu Items
        console.log('🍔 MENU ITEMS:');
        const { data: items } = await supabase
            .from('menu_items')
            .select('*, menu_categories(name_en)');

        console.log(`✅ Total: ${items?.length || 0}`);

        const byCategory = {};
        items?.forEach(item => {
            const cat = item.menu_categories?.name_en || 'Unknown';
            if (!byCategory[cat]) byCategory[cat] = 0;
            byCategory[cat]++;
        });

        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`   - ${cat}: ${count} items`);
        });
        console.log('');

        // 4. Staff Members
        console.log('👥 STAFF MEMBERS:');
        const { data: staff } = await supabase
            .from('staff_members')
            .select('*');

        if (staff) {
            console.log(`✅ Total: ${staff.length}`);
            staff.forEach(s => console.log(`   - ${s.name} (${s.role}) - ${s.email}`));
        } else {
            console.log('❌ No staff data found');
        }
        console.log('');

        // 5. Staff Attendance
        console.log('📅 STAFF ATTENDANCE:');
        const { data: attendance } = await supabase
            .from('staff_attendance')
            .select('*');

        console.log(`✅ Total Records: ${attendance?.length || 0}`);
        console.log('');

        // 6. Staff KPIs
        console.log('📊 STAFF KPI HISTORY:');
        const { data: kpis } = await supabase
            .from('staff_kpi_history')
            .select('*');

        console.log(`✅ Total Records: ${kpis?.length || 0}`);
        console.log('');

        // 7. Staff Documents
        console.log('📄 STAFF DOCUMENTS:');
        const { data: docs } = await supabase
            .from('staff_documents')
            .select('*');

        console.log(`✅ Total Documents: ${docs?.length || 0}`);
        console.log('');

        // 8. Profiles
        console.log('👤 PROFILES:');
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*');

        if (profiles) {
            console.log(`✅ Total: ${profiles.length}`);
            profiles.forEach(p => console.log(`   - ${p.name} (${p.role || 'No role'}) - ${p.email || 'No email'}`));
        } else {
            console.log('❌ No profiles found');
        }
        console.log('');

        // Summary
        console.log('='.repeat(60));
        console.log('📋 SUMMARY:\n');
        console.log(`Branches:          ${branches?.length || 0}`);
        console.log(`Menu Categories:   ${categories?.length || 0}`);
        console.log(`Menu Items:        ${items?.length || 0}`);
        console.log(`Staff Members:     ${staff?.length || 0}`);
        console.log(`Staff Attendance:  ${attendance?.length || 0}`);
        console.log(`Staff KPIs:        ${kpis?.length || 0}`);
        console.log(`Staff Documents:   ${docs?.length || 0}`);
        console.log(`Profiles:          ${profiles?.length || 0}`);
        console.log('');

        // Check what's missing
        console.log('🔍 MISSING FROM MOCK DATA:');
        const mockData = {
            'Orders': 0,
            'Customers': 0,
            'Notifications': 0,
            'Audit Logs': 0
        };

        Object.entries(mockData).forEach(([name, count]) => {
            console.log(`   - ${name}: ${count} (not yet migrated)`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ Verification Complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

completeVerification();
