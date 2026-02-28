import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export interface ExcelMenuItem {
    category: string;
    subcategory?: string;
    name_en: string;
    name_ar: string;
    price: number;
    description?: string;
    image_url?: string;
    available_meals?: string[];
    cuisine_type?: string;
}

export const ExcelUploadService = {
    /**
     * Parse Excel File into JSON
     */
    async parseFile(file: File): Promise<ExcelMenuItem[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (rows.length < 2) throw new Error('File is empty or has too few rows.');

                    // --- COLUMN-WISE VOTER ENGINE ---
                    const keywords = {
                        category: ['category', 'categories', 'cat', 'section', 'group', 'type', 'dept', 'classification', 'menu', 'submenu', 'الفئة', 'التصنيف', 'القسم', 'نوع', 'مجموعة'],
                        subcategory: ['subcategory', 'sub category', 'sub-category', 'subcat', 'فئة فرعية', 'تصنيف فرعي'],
                        name_en: ['name_en', 'name', 'item name', 'english name', 'item', 'title', 'product', 'صنف', 'الاسم', 'اسم الصنف', 'الاسم بالانجليزية'],
                        name_ar: ['name_ar', 'arabic name', 'arabic', 'الاسم بالعربية', 'الاسم العربي', 'عربي'],
                        price: ['price', 'sar', 'cost', 'amount', 'rate', 'value', 'price_sar', 'السعر', 'القيمة', 'التكلفة'],
                        meal: ['meal', 'meals', 'availability', 'serving', 'time', 'timing', 'الوجبة', 'أوقات', 'مواعيد'],
                        cuisine: ['cuisine', 'type', 'food type', 'kitchen', 'style', 'نوع الأكل', 'مطبخ']
                    };

                    const colScores: Record<string, { index: number, score: number }> = {
                        category: { index: -1, score: -1 },
                        subcategory: { index: -1, score: -1 },
                        name_en: { index: -1, score: -1 },
                        name_ar: { index: -1, score: -1 },
                        price: { index: -1, score: -1 },
                        meal: { index: -1, score: -1 },
                        cuisine: { index: -1, score: -1 }
                    };

                    // Analyze first 50 rows to vote on columns
                    const maxCols = Math.max(...rows.slice(0, 50).map(r => r?.length || 0));
                    for (let c = 0; c < maxCols; c++) {
                        let potentialHeaderInThisCol: string | null = null;
                        let scoreInThisCol: Record<string, number> = { category: 0, subcategory: 0, name_en: 0, name_ar: 0, price: 0, meal: 0, cuisine: 0 };

                        for (let r = 0; r < Math.min(rows.length, 50); r++) {
                            const cell = rows[r]?.[c];
                            if (!cell) continue;
                            const str = cell.toString().toLowerCase().trim();

                            // Vote based on keywords
                            for (const [key, kwList] of Object.entries(keywords)) {
                                if (kwList.some(kw => str === kw || (str.length > 2 && str.includes(kw)))) {
                                    scoreInThisCol[key] += 10; // High weight for keyword match
                                }
                            }

                            // Vote based on data patterns
                            if (typeof cell === 'number' || (str.match(/^\d+(\.\d+)?$/))) scoreInThisCol.price += 1;
                            if (str.match(/[\u0600-\u06FF]/)) scoreInThisCol.name_ar += 2;
                            if (str.includes('breakfast') || str.includes('lunch') || str.includes('dinner')) scoreInThisCol.meal += 5;
                            if (str.includes('fast') || str.includes('food') || str.includes('desi') || str.includes('indian')) scoreInThisCol.cuisine += 5;
                        }

                        // Update winner for this field
                        for (const key of Object.keys(colScores)) {
                            if (scoreInThisCol[key] > colScores[key].score) {
                                colScores[key] = { index: c, score: scoreInThisCol[key] };
                            }
                        }
                    }

                    // Validation: Must have at least name and price
                    if (colScores.name_en.index === -1 || colScores.price.index === -1) {
                        throw new Error('Column Detection Failed. Please ensure your Excel has "Name" and "Price" columns.');
                    }

                    // Fallback for Category if not found via keywords
                    if (colScores.category.score <= 0) {
                        // Pick first column that isn't name_en, price, or name_ar
                        for (let c = 0; c < maxCols; c++) {
                            if (c !== colScores.name_en.index && c !== colScores.price.index && c !== colScores.name_ar.index) {
                                colScores.category.index = c;
                                break;
                            }
                        }
                    }

                    // Debug: Log subcategory detection
                    console.log('🔍 Subcategory column detection:');
                    console.log('  - Index:', colScores.subcategory.index);
                    console.log('  - Score:', colScores.subcategory.score);

                    // Debug Confirmation for User
                    const debugMsg = `I found these columns in your Excel:
- Category: Column ${colScores.category.index + 1}
- Subcategory: ${colScores.subcategory.index !== -1 ? 'Column ' + (colScores.subcategory.index + 1) : 'Not Found'}
- Name (EN): Column ${colScores.name_en.index + 1}
- Price: Column ${colScores.price.index + 1}
- Meal Time: ${colScores.meal.index !== -1 ? 'Column ' + (colScores.meal.index + 1) : 'Not Found (Defaulting to All)'}
- Cuisine: ${colScores.cuisine.index !== -1 ? 'Column ' + (colScores.cuisine.index + 1) : 'Not Found (Defaulting to General)'}

Upload this data?`;

                    if (!window.confirm(debugMsg)) {
                        throw new Error('Upload cancelled by user.');
                    }

                    // --- EXTRACTION ---
                    const cleanPrice = (val: any): number => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        const cleaned = val.toString().replace(/[^0-9.]/g, '');
                        return parseFloat(cleaned) || 0;
                    };

                    const cleanMeals = (val: any): string[] => {
                        if (!val) return ['Lunch', 'Dinner']; // Default
                        const str = val.toString();
                        // Comma separated
                        return str.split(/[,&]/).map((s: string) => {
                            const clean = s.trim().toLowerCase();
                            if (clean.includes('breakfast') || clean.includes('morning')) return 'Breakfast';
                            if (clean.includes('lunch')) return 'Lunch';
                            if (clean.includes('dinner')) return 'Dinner';
                            if (clean.includes('high') || clean.includes('tea')) return 'High Tea';
                            return '';
                        }).filter(Boolean);
                    };

                    const cleanCuisine = (val: any): string => {
                        if (!val) return 'General';
                        const str = val.toString().toLowerCase();
                        if (str.includes('fast')) return 'Fast Food';
                        if (str.includes('desi') || str.includes('pakistani') || str.includes('indian')) return 'Desi';
                        return 'General';
                    };

                    const result: ExcelMenuItem[] = [];
                    // Start from row 1 (assuming row 0 is header, but our voter is row-agnostic so it handles both)
                    // We skip rows that look like headers
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;

                        const nameEn = row[colScores.name_en.index];
                        if (!nameEn || nameEn.toString().trim() === '') continue;

                        // Skip the header row itself by checking if it contains the word "name" or "price"
                        const cellStr = nameEn.toString().toLowerCase();
                        if (keywords.name_en.includes(cellStr) || keywords.price.includes(row[colScores.price.index]?.toString().toLowerCase())) continue;

                        const subcategoryValue = colScores.subcategory.index !== -1 ? (row[colScores.subcategory.index] || '').toString().trim() : undefined;
                        console.log(`📝 Row ${i}: "${nameEn.toString().trim()}" → Subcategory: "${subcategoryValue}"`);

                        result.push({
                            category: (row[colScores.category.index] || 'General').toString().trim(),
                            subcategory: subcategoryValue,
                            name_en: nameEn.toString().trim(),
                            name_ar: colScores.name_ar.index !== -1 ? (row[colScores.name_ar.index] || '').toString().trim() : '',
                            price: cleanPrice(row[colScores.price.index]),
                            description: '',
                            image_url: '',
                            available_meals: colScores.meal.index !== -1 ? cleanMeals(row[colScores.meal.index]) : ['Lunch', 'Dinner'],
                            cuisine_type: colScores.cuisine.index !== -1 ? cleanCuisine(row[colScores.cuisine.index]) : 'General'
                        });
                    }

                    if (result.length === 0) throw new Error('No menu items extracted.');
                    resolve(result);
                } catch (err: any) {
                    reject(new Error(err.message || 'Excel Parsing Error.'));
                }
            };
            reader.onerror = () => reject(new Error('File reading error.'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Upload Mapped Data to Supabase
     */
    async uploadToDatabase(items: ExcelMenuItem[], branchId: string) {
        try {
            const rawCategories = Array.from(new Set(items.map(i => i.category)));
            const categoryMap: Record<string, string> = {};

            // 1. Process Categories
            for (const catName of rawCategories) {
                // Defensive check: ilike for robustness
                const { data: existing } = await supabase
                    .from('menu_categories')
                    .select('id, name_en')
                    .ilike('name_en', catName.trim())
                    .maybeSingle();

                if (existing) {
                    categoryMap[catName] = existing.id;
                } else {
                    const { data: created, error: createErr } = await supabase
                        .from('menu_categories')
                        .insert([{ name_en: catName, is_active: true }])
                        .select()
                        .single();

                    if (createErr) throw createErr;
                    categoryMap[catName] = created.id;
                }
            }

            // 2. Prepare and Insert Items
            const itemsToInsert = items.map(item => ({
                branch_id: branchId,
                category_id: categoryMap[item.category],
                subcategory: item.subcategory,
                name_en: item.name_en,
                name_ar: item.name_ar,
                description: item.description,
                price: item.price,
                image_url: item.image_url,
                stock: 100,
                status: 'Available',
                available_meals: item.available_meals,
                cuisine_type: item.cuisine_type
            }));

            const { error: insertError } = await supabase
                .from('menu_items')
                .insert(itemsToInsert);

            if (insertError) throw insertError;

            return { success: true, count: itemsToInsert.length, categories: rawCategories };
        } catch (error: any) {
            console.error('Upload Error:', error);
            throw new Error(error.message || 'Database Sync Failed.');
        }
    }
};
