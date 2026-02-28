// ============================================
// INTENT DETECTION SYSTEM
// Handles 1000+ variations of menu browsing questions
// ============================================

// Static menu import removed for dynamic database brain
// import { menu } from '../data/menu.js';

// ============================================
// COMPREHENSIVE INTENT PATTERNS
// ============================================

// Menu browsing intent patterns (show me, what do you have, etc.)
const MENU_BROWSING_PATTERNS = {
    // "Show me" variations
    showMe: [
        'show me', 'show', 'display', 'let me see', 'lemme see', 'can i see',
        'could i see', 'may i see', 'i want to see', 'i wanna see', 'wanna see',
        'show us', 'display for me', 'show me the', 'can you show', 'can u show',
        'pls show', 'please show', 'plz show', 'plss show', 'pleas show'
    ],

    // "What do you have" variations
    whatHave: [
        'what do you have', 'what you have', 'what u have', 'what have you got',
        'what you got', 'what u got', 'whats available', 'what is available',
        'what available', 'what do u have', 'what do you got', 'what you have in',
        'what do you have in', 'what u have in', 'what have you', 'what have u',
        'what options', 'what are the options', 'what r the options', 'what choices',
        'whats there', 'what is there', 'what there', 'what all you have'
    ],

    // "Menu" variations
    menu: [
        'menu', 'menu of', 'menu for', 'the menu', 'your menu', 'ur menu',
        'full menu', 'complete menu', 'entire menu', 'whole menu', 'all menu',
        'menu items', 'menu list', 'food menu', 'item menu', 'items menu',
        'menue', 'manu', 'menuu', 'menus', 'menuz'
    ],

    // "List" variations
    list: [
        'list', 'list of', 'list all', 'list the', 'listing', 'listings',
        'give me list', 'give list', 'show list', 'show me list', 'can i get list',
        'send list', 'send me list', 'share list', 'share the list'
    ],

    // "Items" variations
    items: [
        'items', 'item', 'things', 'stuff', 'options', 'choices', 'selection',
        'selections', 'products', 'dishes', 'foods', 'food items', 'menu items',
        'available items', 'all items', 'your items', 'ur items', 'the items'
    ],

    // "Categories" variations
    categories: [
        'categories', 'category', 'types', 'type', 'kinds', 'kind', 'sections',
        'section', 'groups', 'group', 'menu categories', 'food categories',
        'item categories', 'all categories', 'your categories', 'ur categories',
        'categries', 'catagories', 'catgories', 'categry', 'catagory'
    ],

    // "Browse" variations
    browse: [
        'browse', 'browsing', 'look at', 'looking at', 'check', 'check out',
        'checking', 'checking out', 'explore', 'exploring', 'view', 'viewing',
        'see', 'seeing', 'look through', 'go through', 'scroll through'
    ],

    // Question words
    questions: [
        'what', 'which', 'whats', 'what is', 'what are', 'what r',
        'tell me', 'tell me about', 'tell about', 'info about', 'information about',
        'details about', 'detail about', 'describe', 'explain'
    ],

    // Order Action variations
    cancel: [
        'cancel order', 'cancel my order', 'complete cancel order', 'entire cancel order',
        'cancel all', 'cancel everything', 'cancel complete order', 'cancel entire order',
        'i want to cancel', 'stop order', 'delete order', 'remove order', 'cancel'
    ],
    finish: [
        'finish order', 'finish my order', 'complete order', 'checkout', 'check out',
        'pay', 'payment', 'bill', 'receipt', 'done', 'finalise', 'finalize',
        'i am done', 'im done', 'end order', 'finish'
    ]
};

// Category-specific keywords and variations
const CATEGORY_KEYWORDS = {
    burgers: {
        keywords: [
            'burger', 'burgers', 'buger', 'bugger', 'burgr', 'burgar', 'burguer',
            'beef burger', 'chicken burger',
            'برجر', 'البرجر', 'برجرات', 'برقر'
        ],
        variations: [
            'in burgers', 'from burgers', 'burger section', 'burger category',
            'burger menu', 'burger items', 'burger options', 'burger choices',
            'burger selection', 'burger list', 'burger stuff', 'burger things'
        ]
    },

    wraps: {
        keywords: [
            'wrap', 'wraps', 'wrp', 'warp', 'wrapp', 'roll', 'rolls',
            'tortilla', 'tortila', 'tortillas',
            'لفائف', 'اللفائف', 'لفاف', 'رول'
        ],
        variations: [
            'in wraps', 'from wraps', 'wrap section', 'wrap category',
            'wrap menu', 'wrap items', 'wrap options', 'wrap choices',
            'wrap selection', 'wrap list', 'wrap stuff', 'wrap things'
        ]
    },

    sandwiches: {
        keywords: [
            'sandwich', 'sandwiches', 'sandwch', 'sandwhich', 'sandwitch',
            'sanwich', 'sandwic', 'sandwiche',
            'سندويش', 'السندويشات', 'سندويتش'
        ],
        variations: [
            'in sandwiches', 'from sandwiches', 'sandwich section', 'sandwich category',
            'sandwich menu', 'sandwich items', 'sandwich options', 'sandwich choices',
            'sandwich selection', 'sandwich list', 'sandwich stuff', 'sandwich things'
        ]
    },

    sides: {
        keywords: [
            'side', 'sides', 'snack', 'snacks', 'appetizer', 'appetizers',
            'starter', 'starters', 'side dish', 'side dishes', 'side items',
            'fries', 'nuggets', 'popcorn', 'corn', 'potato',
            'مقبلات', 'المقبلات', 'سناك', 'جانبية'
        ],
        variations: [
            'in sides', 'from sides', 'side section', 'side category',
            'side menu', 'side items', 'side options', 'side choices',
            'snack section', 'snack menu', 'snack items', 'appetizer menu'
        ]
    },

    meals: {
        keywords: [
            'meal', 'meals', 'meel', 'meeal', 'combo', 'combos',
            'meal deal', 'meal deals', 'full meal', 'complete meal',
            'وجبة', 'الوجبات', 'وجبات'
        ],
        variations: [
            'in meals', 'from meals', 'meal section', 'meal category',
            'meal menu', 'meal items', 'meal options', 'meal choices',
            'meal selection', 'meal list', 'combo menu', 'combo section'
        ]
    },

    juices: {
        keywords: [
            'juice', 'juices', 'juic', 'juce', 'juise', 'fresh juice',
            'fruit juice',
            'عصير', 'العصائر', 'عصائر', 'عصيرات'
        ],
        variations: [
            'in juices', 'from juices', 'juice section', 'juice category',
            'juice menu', 'juice items', 'juice options', 'juice choices',
            'juice selection', 'juice list', 'juice stuff', 'juice things'
        ]
    },

    drinks: {
        keywords: [
            'drink', 'drinks', 'beverage', 'beverages', 'soft drink',
            'cold drink', 'pepsi', 'water', 'tea', 'coffee',
            'مشروب', 'المشروبات', 'مشروبات'
        ],
        variations: [
            'in drinks', 'from drinks', 'drink section', 'drink category',
            'drink menu', 'drink items', 'drink options', 'drink choices',
            'beverage menu', 'beverage section', 'beverage items'
        ]
    }
};

// ============================================
// ARABIC PATTERNS (PARALLEL)
// ============================================

const MENU_BROWSING_PATTERNS_AR = {
    // "Show me" variations
    showMe: [
        'أرني', 'عرض', 'وريني', 'فرجني', 'شوف', 'ابغى اشوف', 'بدي شوف',

        'أريد رؤية', 'ممكن اشوف', 'تعرض لي', 'هات', 'عطني'
    ],

    // "What do you have" variations
    whatHave: [
        'ماذا لديكم', 'شنو عندكم', 'وش عندكم', 'ايش عندكم', 'شو عندكم',
        'ما هي الخيارات', 'وش فيه', 'ايش فيه', 'ماهي الاصناف', 'وش تبيعون'
    ],

    // "Menu" variations
    menu: [
        'قائمة', 'القائمة', 'منيو', 'المنيو', 'لائحة الطعام',
        'قائمة الطعام', 'الاصناف', 'الاكل', 'قائمة الاكل'
    ],

    // "List" variations
    list: [
        'ليسته', 'لستة', 'قائمه', 'لائحة', 'سجل'
    ],

    // "Items" variations
    items: [
        'اصناف', 'منتجات', 'اغراض', 'اشياء', 'وجبات', 'اكلات'
    ],

    // "Categories" variations
    categories: [
        'اقسام', 'تصنيفات', 'انواع', 'فئات', 'تشكيلة'
    ],

    // "Browse" variations
    browse: [
        'تصفح', 'استعراض', 'رؤية', 'مشاهدة', 'اطلاع'
    ],

    // Question words
    questions: [
        'ماهو', 'ما هي', 'وش', 'ايش', 'شنو', 'شو'
    ],

    // Order Action variations (Arabic)
    cancel: [
        'إلغاء الطلب', 'الغاء الطلب', 'إلغاء طلبي', 'الغاء طلبي', 'كنسل', 'إلغاء الكل',
        'الغاء الكل', 'إلغاء الطلب بالكامل', 'الغاء بالكامل', 'أريد الإلغاء', 'توقف',
        'حذف الطلب', 'إلغاء'
    ],
    finish: [
        'إنهاء الطلب', 'انهاء الطلب', 'إنهاء', 'انهاء', 'إتمام الطلب', 'حساب',
        'الحساب', 'الفاتورة', 'دفع', 'سداد', 'خلاص', 'خلصنا', 'تم الطلب'
    ]
};

const CATEGORY_KEYWORDS_AR = {
    burgers: {
        keywords: [
            'برجر', 'البرجر', 'برجرات', 'برقر', 'همبرجر', 'برجر لحم', 'برجر دجاج'
        ],
        variations: [
            'قسم البرجر', 'قائمة البرجر', 'انواع البرجر', 'اصناف البرجر',
            'وجبات البرجر', 'منيو البرجر'
        ]
    },

    wraps: {
        keywords: [
            'تورتيلا', 'تورتلا', 'لفائف', 'اللفائف', 'رول', 'سندويشات تورتيلا', 'راب'
        ],
        variations: [
            'قسم التورتيلا', 'قائمة التورتيلا', 'انواع التورتيلا', 'اصناف التورتيلا',
            'لفائف التورتيلا'
        ]
    },

    sandwiches: {
        keywords: [
            'سندويش', 'سندويتش', 'سندويشات', 'ساندويش', 'صاج', 'شطيرة'
        ],
        variations: [
            'قسم السندويشات', 'قائمة السندويشات', 'انواع السندويشات', 'سندويشات مشكلة'
        ]
    },

    sides: {
        keywords: [
            'مقبلات', 'المقبلات', 'سناك', 'وجبات خفيفة', 'بطاطس', 'ناجتس', 'بوب كورن'
        ],
        variations: [
            'قسم المقبلات', 'قائمة المقبلات', 'انواع المقبلات', 'اضافات', 'جانبية'
        ]
    },

    meals: {
        keywords: [
            'وجبة', 'وجبات', 'بوكس', 'كومبو', 'الوجبات'
        ],
        variations: [
            'قسم الوجبات', 'قائمة الوجبات', 'وجبات كاملة', 'وجبات التوفير'
        ]
    },

    juices: {
        keywords: [
            'عصير', 'عصائر', 'عصيرات', 'العصير', 'مشروبات طازجة'
        ],
        variations: [
            'قسم العصائر', 'قائمة العصائر', 'انواع العصائر', 'عصيرات طازجة'
        ]
    },

    drinks: {
        keywords: [
            'مشروب', 'مشروبات', 'ببسي', 'بيبسي', 'ماء', 'شاي', 'قهوة', 'مشروبات غازية'
        ],
        variations: [
            'قسم المشروبات', 'قائمة المشروبات', 'المشروبات الباردة', 'المشروبات الساخنة'
        ]
    }
};

// Generate all possible combinations
const generateIntentPatterns = (dynamicMenu, lang = 'en') => {
    const patterns = [];
    if (!dynamicMenu || !dynamicMenu.categories) return patterns;

    const isAr = lang === 'ar';
    const KEYWORDS_SOURCE = isAr ? CATEGORY_KEYWORDS_AR : CATEGORY_KEYWORDS;
    const PATTERNS_SOURCE = isAr ? MENU_BROWSING_PATTERNS_AR : MENU_BROWSING_PATTERNS;

    // For each category in the DYNAMIC menu
    dynamicMenu.categories.forEach(category => {
        const categoryId = category.id;
        const catNameEn = category.title.en.toLowerCase();
        const catNameAr = category.title.ar;

        // Start with hardcoded keywords if they match this category ID (legacy support for better NLP)
        let catKeywords = (KEYWORDS_SOURCE[categoryId]?.keywords || []);
        let catVariations = (KEYWORDS_SOURCE[categoryId]?.variations || []);

        // ALSO ADD DYNAMIC KEYWORDS FROM THE DB TITLE
        if (isAr) {
            if (!catKeywords.includes(catNameAr)) catKeywords.push(catNameAr);
        } else {
            if (!catKeywords.includes(catNameEn)) catKeywords.push(catNameEn);
            // Add plural version if it sounds right
            if (!catNameEn.endsWith('s') && !catKeywords.includes(catNameEn + 's')) catKeywords.push(catNameEn + 's');
        }

        // Generate patterns for each browsing intent
        Object.values(PATTERNS_SOURCE).forEach(patternGroup => {
            patternGroup.forEach(pattern => {
                // Pattern + category keyword
                catKeywords.forEach(keyword => {
                    patterns.push({
                        pattern: `${pattern} ${keyword}`,
                        categoryId,
                        intent: 'BROWSE_CATEGORY'
                    });

                    if (!isAr) {
                        patterns.push({
                            pattern: `${pattern} the ${keyword}`,
                            categoryId,
                            intent: 'BROWSE_CATEGORY'
                        });
                    }
                });

                // Pattern + category variation
                catVariations.forEach(variation => {
                    patterns.push({
                        pattern: `${pattern} ${variation}`,
                        categoryId,
                        intent: 'BROWSE_CATEGORY'
                    });
                });
            });
        });

        // Direct category mentions
        catKeywords.forEach(keyword => {
            patterns.push({
                pattern: keyword,
                categoryId,
                intent: 'BROWSE_CATEGORY'
            });
        });
    });

    return patterns;
};

// Levenshtein distance for fuzzy matching
const levenshtein = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Detect intent from user input
export const detectIntent = (text, lang = 'en', dynamicMenu) => {
    const normalized = text.toLowerCase().trim();
    const isAr = lang === 'ar';

    console.log(`🔍 Detecting intent for: ${text} (${lang}) | Dynamic: ${!!dynamicMenu}`);

    // Generate all patterns for current language using DYNAMIC menu
    const patterns = generateIntentPatterns(dynamicMenu, lang);

    // Check for exact matches first
    for (const pattern of patterns) {
        if (normalized === pattern.pattern ||
            normalized.includes(pattern.pattern)) {
            console.log('✅ Intent detected:', pattern);
            return pattern;
        }
    }

    // Check for specific Order Actions (Cancel/Finish)
    const PATTERNS_SOURCE = isAr ? MENU_BROWSING_PATTERNS_AR : MENU_BROWSING_PATTERNS;

    for (const cancelPattern of PATTERNS_SOURCE.cancel) {
        if (normalized.includes(cancelPattern)) {
            return { pattern: cancelPattern, intent: 'CANCEL_ORDER' };
        }
    }

    for (const finishPattern of PATTERNS_SOURCE.finish) {
        if (normalized.includes(finishPattern)) {
            return { pattern: finishPattern, intent: 'FINISH_ORDER' };
        }
    }

    // Fuzzy matching for category keywords (PRIORITY: Specific categories first)
    const KEYWORDS_SOURCE = isAr ? CATEGORY_KEYWORDS_AR : CATEGORY_KEYWORDS;

    for (const [categoryId, data] of Object.entries(KEYWORDS_SOURCE)) {
        for (const keyword of data.keywords) {
            if (normalized.includes(keyword) || keyword.includes(normalized)) {
                // Check if it's a browsing intent
                const hasBrowsingIntent = Object.values(PATTERNS_SOURCE)
                    .flat()
                    .some(pattern => normalized.includes(pattern));

                if (hasBrowsingIntent || normalized.split(' ').length <= 3) {
                    console.log('✅ Fuzzy match - Category:', categoryId);
                    return {
                        pattern: normalized,
                        categoryId,
                        intent: 'BROWSE_CATEGORY'
                    };
                }
            }
        }
    }

    // Check for general menu browsing (Fallback: if no specific category found)
    let generalMenuPatterns = [];

    if (isAr) {
        generalMenuPatterns = [
            'عرض القائمة', 'القائمة', 'المنيو', 'منيو', 'قائمة الطعام',
            'وش عندكم', 'ايش عندكم', 'ماذا لديكم', 'وريني الاكل',
            'ابغى اطلب', 'طلب جديد', 'قائمة الاسعار', 'اصناف الاكل',
            'ماهي الاصناف', 'بدي شوف المنيو', 'عرض الاصناف', 'وش تبيعون',
            'وريني المنيو', 'وين المنيو', 'شنو عندكم', 'شو عندكم', 'فيه منيو'
        ];
    } else {
        generalMenuPatterns = [
            'show menu', 'menu', 'show me menu', 'what do you have',
            'show items', 'show categories', 'list categories', 'all categories',
            'what categories', 'menu categories', 'food categories',
            'i want to order', 'menu please', 'need your menu', 'i want menu',
            'see menu', 'view menu', 'order please', 'start order',
            'show me the menu', 'menu please', 'what do you have in your menu',
            'i want to order', 'i need your menu', 'menu????', 'menu',
            'can i see the menu', 'whats on the menu', 'give me the menu',
            'menu options', 'menu items', 'menu list', 'menu card',
            'menu now', 'menu info', 'menu information', 'menu details',
            'id like to see the menu', 'can you show your menu',
            'i want to check the menu', 'do you have a menu',
            'please send me the menu', 'id like to order something',
            'what can i order', 'what food do you have', 'whats available',
            'what dishes do you serve', 'can i get the menu',
            'i want to see what you offer'
        ];
    }

    // Clean up text for matching (No Arabic punctuation allowed)
    // \u061F is Arabic Question Mark
    const normalizedLower = normalized.replace(/[^a-z0-9\u0600-\u06FF\s]/g, '').replace(/\s+/g, ' ').trim();

    for (const pattern of generalMenuPatterns) {
        const patternLower = pattern.replace(/[^a-z0-9\u0600-\u06FF\s]/g, '').replace(/\s+/g, ' ').trim();

        // Exact or Substring match
        if (normalizedLower === patternLower ||
            normalizedLower.includes(patternLower) ||
            patternLower.includes(normalizedLower)) {
            console.log('✅ General menu browsing detected (match)');
            return {
                pattern: normalized,
                categoryId: null,
                intent: 'BROWSE_ALL_CATEGORIES'
            };
        }

        // Fuzzy match using Levenshtein
        const dist = levenshtein(normalizedLower, patternLower);
        // Allow distance of 2 for short phrases, 3 for longer ones
        // Arabic words are often shorter, so using 1/3 length as threshold
        const threshold = Math.max(2, Math.floor(patternLower.length / 3));

        if (dist <= threshold) {
            console.log('✅ General menu browsing detected (fuzzy match)');
            return {
                pattern: normalized,
                categoryId: null,
                intent: 'BROWSE_ALL_CATEGORIES'
            };
        }
    }

    console.log('❌ No intent detected');
    return null;
};

// Export patterns for testing
export const getPatternCount = () => {
    return generateIntentPatterns().length;
};

console.log(`📊 Total intent patterns generated: ${getPatternCount()}`);
