// Complete Database Inspector - Shows ALL tables, columns, and data
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function inspectCompleteDatabase() {
    console.log('🔍 COMPLETE DATABASE INSPECTION\n');
    console.log('='.repeat(80) + '\n');

    const tables = [
        'branches',
        'branch_settings',
        'menu_categories',
        'menu_items',
        'staff_members',
        'staff_attendance',
        'staff_kpi_history',
        'staff_documents',
        'customers',
        'orders',
        'profiles'
    ];

    for (const tableName of tables) {
        console.log('━'.repeat(80));
        console.log(`📊 TABLE: ${tableName.toUpperCase()}`);
        console.log('━'.repeat(80));

        try {
            // Fetch all data from the table
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(100); // Limit to 100 rows per table

            if (error) {
                console.log(`❌ Error: ${error.message}\n`);
                continue;
            }

            if (!data || data.length === 0) {
                console.log('⚠️  Table is empty\n');
                continue;
            }

            // Get column names from first row
            const columns = Object.keys(data[0]);

            console.log(`\n📋 COLUMNS (${columns.length}):`);
            console.log(columns.map(col => `  • ${col}`).join('\n'));

            console.log(`\n📦 DATA (${data.length} rows):\n`);

            // Display data in a readable format
            data.forEach((row, index) => {
                console.log(`Row ${index + 1}:`);
                columns.forEach(col => {
                    let value = row[col];

                    // Format different data types
                    if (value === null) {
                        value = 'NULL';
                    } else if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    } else if (typeof value === 'string' && value.length > 100) {
                        value = value.substring(0, 100) + '...';
                    }

                    console.log(`  ${col}: ${value}`);
                });
                console.log('');
            });

        } catch (error) {
            console.log(`❌ Unexpected error: ${error.message}\n`);
        }
    }

    console.log('='.repeat(80));
    console.log('✅ Database inspection complete!\n');
}

inspectCompleteDatabase();
