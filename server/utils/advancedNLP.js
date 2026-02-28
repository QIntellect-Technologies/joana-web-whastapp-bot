// ============================================
// ADVANCED NLP PARSER FOR RESTAURANT BOT (Node.js version)
// ============================================

const TYPO_CORRECTIONS = {
    'burger': 'burger', 'burgers': 'burger', 'brgr': 'burger', 'brger': 'burger',
    'buger': 'burger', 'bugger': 'burger', 'burge': 'burger', 'burgr': 'burger',
    'burgar': 'burger', 'burgur': 'burger', 'berger': 'burger', 'burgir': 'burger',
    'burgrr': 'burger', 'burgeer': 'burger', 'burgerr': 'burger', 'burguer': 'burger',
    'burgre': 'burger', 'burgger': 'burger', 'burgerz': 'burger', 'burgars': 'burger',
    'burgurs': 'burger', 'burder': 'burger', 'birger': 'burger', 'borger': 'burger',
    'burrgerr': 'burger', 'burrrrger': 'burger', 'burgere': 'burger', 'brgrs': 'burger',
    'burg': 'burger', 'borgar': 'burger', 'burgi': 'burger', 'borger': 'burger',
    'girl': 'burger', 'grill': 'burger', 'grille': 'burger', 'super': 'spicy', 'supper': 'spicy',
    'super girl': 'spicy burger', 'super girl 3': '3 spicy burger',
    'broasted': 'barosted', 'brost': 'barosted', 'barosted': 'barosted', 'brostid': 'barosted',

    'chicken': 'chicken', 'chickens': 'chicken', 'chick': 'chicken', 'chicke': 'chicken',
    'chiken': 'chicken', 'chickin': 'chicken', 'chikn': 'chicken', 'chcken': 'chicken',
    'chickn': 'chicken', 'chikken': 'chicken', 'chicen': 'chicken', 'chiken': 'chicken',
    'chickenn': 'chicken', 'chckn': 'chicken', 'chkn': 'chicken', 'chcikn': 'chicken',
    'chckin': 'chicken', 'chikeen': 'chicken', 'chickeen': 'chicken', 'chikin': 'chicken',
    'chichin': 'chicken', 'cheken': 'chicken', 'chekin': 'chicken', 'chiken': 'chicken',
    'chikken': 'chicken', 'cicken': 'chicken', 'chicekn': 'chicken',

    'beef': 'beef', 'beefs': 'beef', 'befe': 'beef', 'beefe': 'beef',
    'bef': 'beef', 'beaf': 'beef', 'beeff': 'beef', 'beif': 'beef',
    'beff': 'beef', 'beov': 'beef', 'beefz': 'beef', 'beeffe': 'beef',
    'bif': 'beef', 'beife': 'beef', 'beffy': 'beef', 'befo': 'beef',

    'coffee': 'coffee', 'coffees': 'coffee', 'coffe': 'coffee', 'cofee': 'coffee',
    'cofffee': 'coffee', 'coffie': 'coffee', 'coffi': 'coffee', 'coffy': 'coffee',
    'coffey': 'coffee', 'cofffe': 'coffee', 'cofe': 'coffee', 'coffie': 'coffee',
    'coffeee': 'coffee', 'coofee': 'coffee', 'coffie': 'coffee', 'koffee': 'coffee',
    'kofee': 'coffee', 'koffe': 'coffee', 'cofey': 'coffee', 'coffey': 'coffee',
    'cofi': 'coffee', 'coffy': 'coffee', 'coffe': 'coffee', 'cofe': 'coffee',
    'cafe': 'coffee', 'caffe': 'coffee', 'caffé': 'coffee', 'kofie': 'coffee',
    'copy': 'coffee', 'copi': 'coffee', 'coppy': 'coffee', 'cough': 'coffee', 'cofy': 'coffee',

    'water': 'water', 'waters': 'water', 'watr': 'water', 'wter': 'water',
    'what': 'water', 'what a': 'water', 'waiter': 'water', 'watere': 'water',
    'watter': 'water', 'watere': 'water', 'wateer': 'water', 'waterr': 'water',

    'wrap': 'wrap', 'wraps': 'wrap', 'wrp': 'wrap', 'warp': 'wrap', 'wrapp': 'wrap',
    'tortilla': 'tortilla', 'tortillas': 'tortilla', 'torta': 'tortilla', 'turtle': 'tortilla',
    'tortila': 'tortilla', 'the tail': 'tortilla', 'tortela': 'tortilla',

    'sandwich': 'sandwich', 'sandwiches': 'sandwich', 'sandwch': 'sandwich',
    'sandwhich': 'sandwich', 'sandwitch': 'sandwich', 'sanwich': 'sandwich',
    'sandwic': 'sandwich', 'sandwih': 'sandwich', 'sandwish': 'sandwich',
    'sandwch': 'sandwich', 'sandwichh': 'sandwich', 'sandw': 'sandwich',

    'juice': 'juice', 'juices': 'juice', 'juic': 'juice', 'juce': 'juice',
    'juise': 'juice', 'juis': 'juice', 'jucie': 'juice', 'juicee': 'juice',
    'juuce': 'juice', 'juce': 'juice', 'juiz': 'juice',

    'pepsi': 'pepsi', 'pepsis': 'pepsi', 'pepsy': 'pepsi', 'bepsy': 'pepsi', 'bessi': 'pepsi',
    'pepci': 'pepsi', 'pepsii': 'pepsi', 'pepsie': 'pepsi', 'pepzie': 'pepsi',
    'peps': 'pepsi',

    'zinger': 'zinger', 'zingers': 'zinger', 'singer': 'zinger', 'finger': 'zinger',
    'ginger': 'zinger', 'zenger': 'zinger', 'senger': 'zinger',
    'kabab': 'kabab', 'kebab': 'kabab', 'kabat': 'kabab', 'kappa': 'kabab', 'kaba': 'kabab',

    'nuggets': 'nuggets', 'nugget': 'nuggets', 'nugit': 'nuggets', 'markets': 'nuggets',
    'meal': 'meal', 'meals': 'meal', 'meel': 'meal', 'meeal': 'meal',
    'meale': 'meal', 'mealz': 'meal',

    'rice': 'rice', 'ric': 'rice', 'rise': 'rice', 'reice': 'rice',

    'potato': 'potato', 'potatoes': 'potato', 'poteto': 'potato',
    'potatto': 'potato', 'potatoe': 'potato',

    'spicy': 'spicy', 'spicies': 'spicy', 'spici': 'spicy', 'spicey': 'spicy',
    'spiccy': 'spicy', 'spicie': 'spicy', 'spicee': 'spicy', 'spicyy': 'spicy',
    'spicii': 'spicy', 'spcy': 'spicy', 'spici': 'spicy', 'spicey': 'spicy',
    'spidy': 'spicy', 'spisi': 'spicy', 'spyc': 'spicy', 'spye': 'spicy',
    'spid': 'spicy', 'spic': 'spicy', 'super': 'spicy', 'supper': 'spicy',

    'regular': 'regular', 'regulars': 'regular', 'reguler': 'regular', 'regulr': 'regular',
    'regulaar': 'regular', 'regullar': 'regular', 'regu': 'regular', 'reg': 'regular',
    'normal': 'regular', 'normel': 'regular', 'norml': 'regular', 'mild': 'regular',
    'non-spicy': 'non-spicy', 'nonspicy': 'non-spicy', 'non spicy': 'non-spicy',
    'no spicy': 'non-spicy', 'no spice': 'non-spicy', 'not spicy': 'non-spicy',
    'non': 'non-spicy', 'none': 'non-spicy',
    'adn': 'and', 'nd': 'and', 'amp': 'and',

    'complete': 'complete', 'comeplte': 'complete', 'compelte': 'complete',
    'complet': 'complete', 'compleet': 'complete', 'complt': 'complete',
    'cometple': 'complete', 'complette': 'complete', 'completly': 'complete',
    'entire': 'entire', 'eniter': 'entire', 'entir': 'entire', 'entier': 'entire',
    'entirely': 'entire', 'enetir': 'entire',
    'finish': 'finish', 'finis': 'finish', 'finishh': 'finish', 'finsh': 'finish',
    'finese': 'finish', 'finishe': 'finish',
    'cancel': 'cancel', 'cancl': 'cancel', 'cancell': 'cancel', 'cancle': 'cancel',
    'canel': 'cancel', 'cancal': 'cancel', 'canc': 'cancel',
    'order': 'order', 'ordr': 'order', 'ordere': 'order', 'odr': 'order',
    'done': 'done', 'don': 'done', 'doen': 'done', 'dun': 'done',

    'remove': 'remove', 'delete': 'remove', 'del': 'remove', 'subtract': 'remove',
    'minus': 'remove', 'remve': 'remove', 'remov': 'remove', 'rmv': 'remove',
};

const TYPO_CORRECTIONS_AR = {
    'برغر': 'برجر', 'برقر': 'برجر', 'همبرجر': 'برجر', 'برجار': 'برجر', 'برجرر': 'برجر',
    'بورجر': 'برجر', 'بورغر': 'برجر', 'برورجر': 'برجر', 'برغرات': 'برجر',
    'دحاج': 'دجاج', 'دجااج': 'دجاج', 'دجاح': 'دجاج', 'فراخ': 'دجاج', 'الدجاج': 'دجاج',
    'دجاش': 'دجاج',
    'لحمة': 'لحم', 'الحم': 'لحم', 'لحمه': 'لحم', 'اللحم': 'لحم',
    'زنقر': 'زنجر', 'زنجير': 'زنجر', 'زينجر': 'زنجر', 'زنجار': 'زنجر',
    'حار': 'حار', 'سبايسي': 'حار', 'فلفل': 'حار', 'شطة': 'حار', 'حراق': 'حار',
    'شطه': 'حار', 'سبايسى': 'حار', 'حارر': 'حار', 'حر': 'حار', 'حار جدا': 'حار',
    'عادي': 'عادي', 'بدون': 'عادي', 'بارد': 'عادي', 'رجلر': 'عادي', 'عادى': 'عادي',
    'طبيعي': 'عادي', 'نورمال': 'عادي', 'بدون حار': 'عادي', 'عاديه': 'عادي',
    'انها': 'انهاء', 'الغ': 'الغاء',
    'الحسا': 'الحساب', 'الفاتوره': 'الفاتورة',
    'خلصنا': 'انهاء',
    'حذف': 'remove', 'ازالة': 'remove', 'إزالة': 'remove', 'كنسل': 'remove',
    'نقص': 'remove', 'شيل': 'remove', 'شيلة': 'remove', 'اريد حذف': 'remove',
    'ببسي': 'pepsi', 'ابسي': 'pepsi', 'بيسي': 'pepsi', 'بيبسى': 'pepsi', 'ببصي': 'pepsi',
    'بروستد': 'barosted', 'بروست': 'barosted', 'بروستيد': 'barosted',
    'واجبه': 'meal', 'وجبه': 'meal', 'وجبات': 'meal',
    'زنجار': 'zinger', 'زنقر': 'zinger', 'زينجر': 'zinger',
    'مويه': 'ماء', 'موي': 'ماء', 'ميه': 'ماء', 'ما': 'ماء',
    'عسير': 'عصير', 'عصيرو': 'عصير',
    'تورتلا': 'تورتيلا', 'توتلا': 'تورتيلا', 'ترتلا': 'تورتيلا',
    'برجر': 'برجر', 'برغر': 'برجر', 'برقر': 'برجر', 'همبرجر': 'برجر',
};

const CATEGORY_ALIASES = {
    'burgers': ['burger', 'burgers', 'برجر', 'البرجر', 'برجرات', 'همبرجر'],
    'wraps': ['wrap', 'wraps', 'roll', 'rolls', 'لفائف', 'اللفائف', 'لفاف', 'تورتيلا', 'توتلا', 'ترتلا', 'راب'],
    'sandwiches': ['sandwich', 'sandwiches', 'سندويش', 'السندويشات', 'سندوتش', 'ساندوتش', 'شطيرة', 'صاج'],
    'sides': ['side', 'sides', 'snack', 'snacks', 'مقبلات', 'المقبلات', 'سناك', 'جانبية', 'اطباق جانبية', 'جانبيه', 'أطباق جانبية'],
    'meals': ['meal', 'meals', 'وجبة', 'الوجبات', 'وجبات', 'بوكس', 'كومبو'],
    'juices': ['juice', 'juices', 'عصير', 'العصائر', 'عصائر', 'عصيرات'],
    'drinks': ['drink', 'drinks', 'beverage', 'beverages', 'مشروب', 'المشروبات', 'مشروبات', 'ساخن', 'بارد', 'غازي']
};

const applyTypoCorrection = (text, lang = 'en') => {
    let corrected = text.toLowerCase();
    const corrections = lang === 'ar' ? TYPO_CORRECTIONS_AR : TYPO_CORRECTIONS;
    const sortedKeys = Object.keys(corrections).sort((a, b) => b.length - a.length);

    sortedKeys.forEach(typo => {
        const correct = corrections[typo];
        const regex = new RegExp(`(^|\\s)${typo}($|\\s)`, 'gi');
        corrected = corrected.replace(regex, (match, p1, p2) => `${p1}${correct}${p2}`);
    });

    return corrected.trim();
};

const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/(.)\1{2,}/g, '$1')
        .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
        .trim();
};

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

const textToNumber = (text) => {
    const numbers = {
        'one': 1, 'won': 1, 'on': 1, 'wall': 1,
        'two': 2, 'to': 2, 'too': 2, 'through': 2,
        'three': 3, 'tree': 3, 'free': 3, 'the': 3, 'they': 3,
        'four': 4, 'for': 4, 'floor': 4,
        'five': 5, 'hive': 5, 'fine': 5,
        'six': 6, 'sex': 6, 'sticks': 6,
        'seven': 7, 'heaven': 7,
        'eight': 8, 'ate': 8, 'it': 8,
        'nine': 9, 'line': 9,
        'ten': 10, 'then': 10, 'than': 10,
        'واحد': 1, 'واحدة': 1, 'اثنين': 2, 'اثنان': 2, 'ثلاثة': 3, 'ثلاث': 3,
        'أربعة': 4, 'اربعة': 4, 'خمسة': 5, 'خمس': 5,
        'حبة': 1, 'حبتين': 2
    };

    let lower = text.toLowerCase().trim();
    const easternDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    easternDigits.forEach((regex, i) => {
        lower = lower.replace(regex, i);
    });

    if (numbers[lower]) return numbers[lower];
    const parsed = parseInt(lower);
    return isNaN(parsed) ? null : parsed;
};

const buildItemIndex = (dynamicMenu) => {
    const index = [];
    if (!dynamicMenu || !dynamicMenu.items) return index;

    Object.keys(dynamicMenu.items).forEach(catId => {
        dynamicMenu.items[catId].forEach(item => {
            const variations = new Set();
            const nameEn = item.name.en.toLowerCase();
            const nameAr = item.name.ar;

            variations.add(nameEn);
            variations.add(nameAr);
            variations.add(normalizeText(nameEn));

            if (nameEn.endsWith('s')) variations.add(nameEn.slice(0, -1));
            else variations.add(nameEn + 's');

            const words = nameEn.split(' ');
            if (words.length > 1) {
                if (words[0].length > 3 && !['with', 'and', 'the'].includes(words[0])) {
                    variations.add(words[0]);
                }
            }

            index.push({
                item: { ...item, catId },
                catId,
                variations: Array.from(variations),
                nameLength: nameEn.split(' ').length
            });
        });
    });

    return index;
};

const buildCategoryIndex = (dynamicMenu) => {
    const index = [];
    if (!dynamicMenu || !dynamicMenu.categories) return index;

    dynamicMenu.categories.forEach(cat => {
        const variations = new Set();
        const titleEn = cat.title.en.toLowerCase();
        const titleAr = cat.title.ar;

        variations.add(titleEn);
        variations.add(titleAr);
        variations.add(normalizeText(titleEn));

        if (titleEn.endsWith('s')) variations.add(titleEn.slice(0, -1));
        else variations.add(titleEn + 's');

        if (CATEGORY_ALIASES[cat.id]) {
            CATEGORY_ALIASES[cat.id].forEach(alias => variations.add(alias));
        }

        index.push({
            category: cat,
            categoryId: cat.id,
            variations: Array.from(variations)
        });
    });

    return index;
};

const parseAdvancedNLP = (text, lang = 'en', dynamicMenu) => {
    try {
        let corrected = text.toLowerCase();
        if (lang === 'ar') {
            corrected = corrected.replace(/(\s|^)و(\d+)/g, '$1و $2');
            corrected = corrected.replace(/(\s|^)و([\u0600-\u06FF]+)/g, '$1و $2');
        } else {
            corrected = corrected.replace(/(\s|^)and(\d+)/gi, '$1and $2');
        }

        corrected = applyTypoCorrection(corrected, lang);

        let detectedPreference = null;
        if (/\b(non-spicy|nonspicy|non spicy|regular|normal|mild)\b/i.test(corrected)) {
            detectedPreference = 'non-spicy';
            corrected = corrected.replace(/\b(non-spicy|nonspicy|non spicy|regular|normal|mild)\b/gi, '').trim();
        } else if (/\b(spicy|spicey|spici|hot)\b/i.test(corrected)) {
            detectedPreference = 'spicy';
            corrected = corrected.replace(/\b(spicy|spicey|spici|hot)\b/gi, '').trim();
        }

        if (lang === 'ar') {
            if (/\b(عادي|بدون|بارد|رجلر)\b/.test(corrected)) {
                detectedPreference = 'non-spicy';
                corrected = corrected.replace(/\b(عادي|بدون|بارد|رجلر)\b/g, '').trim();
            } else if (/\b(حار|سبايسي|فلفل|شطة)\b/.test(corrected)) {
                detectedPreference = 'spicy';
                corrected = corrected.replace(/\b(حار|سبايسي|فلفل|شطة)\b/g, '').trim();
            }
        }

        const itemIndex = buildItemIndex(dynamicMenu);
        const categoryIndex = buildCategoryIndex(dynamicMenu);

        const tokens = corrected.split(/\s+/).filter(t => t.length > 0);
        const detectedIntents = [];
        let currentAction = 'ADD';
        let i = 0;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token === 'remove') { currentAction = 'REMOVE'; i++; continue; }
            if (token === 'add') { currentAction = 'ADD'; i++; continue; }
            if (/^(and|or|&|,|\+|و)$/i.test(token)) { i++; continue; }

            const qty = textToNumber(token);
            let bestMatch = null;
            let bestMatchType = null;
            let bestMatchLength = 0;

            const isOrder = (qty && qty > 0);
            const startOffset = isOrder ? i + 1 : i;

            for (let len = 4; len >= 1; len--) {
                if (startOffset + len > tokens.length) continue;
                const phrase = tokens.slice(startOffset, startOffset + len).join(' ');
                const phraseNorm = normalizeText(phrase);
                if (len > 1 && (/(\b(and|or|و|&|,|\+)\b)|(\d+)/i.test(phrase))) continue;

                let currentLenMatch = null;
                let currentLenMatchType = null;

                for (const entry of categoryIndex) {
                    for (const variation of entry.variations) {
                        const maxDist = variation.length > 6 ? 2 : 1;
                        if (variation === phraseNorm || (phraseNorm.length > 3 && levenshtein(phraseNorm, variation) <= maxDist)) {
                            currentLenMatch = entry.category;
                            currentLenMatchType = 'CATEGORY';
                            break;
                        }
                    }
                    if (currentLenMatch) break;
                }

                if (!currentLenMatch) {
                    for (const entry of itemIndex) {
                        for (const variation of entry.variations) {
                            const maxDist = variation.length > 6 ? 2 : 1;
                            if (variation === phraseNorm || (phraseNorm.length > 3 && levenshtein(phraseNorm, variation) <= maxDist)) {
                                currentLenMatch = entry.item;
                                currentLenMatchType = 'ITEM';
                                break;
                            }
                        }
                        if (currentLenMatchType === 'ITEM') break;
                    }
                }

                if (!currentLenMatch && phraseNorm.length > 4) {
                    for (const entry of itemIndex) {
                        for (const variation of entry.variations) {
                            if (variation.includes(phraseNorm)) {
                                currentLenMatch = entry.item;
                                currentLenMatchType = 'ITEM';
                                break;
                            }
                        }
                        if (currentLenMatch) break;
                    }
                }

                if (currentLenMatch) {
                    bestMatch = currentLenMatch;
                    bestMatchType = currentLenMatchType;
                    bestMatchLength = len;
                    break;
                }
            }

            if (bestMatch) {
                let finalQty = isOrder ? qty : null;
                const nextToken = tokens[i + bestMatchLength + (isOrder ? 1 : 0)];
                if (!finalQty && nextToken) {
                    const trailingQty = textToNumber(nextToken);
                    if (trailingQty) {
                        finalQty = trailingQty;
                        i++;
                    }
                }

                detectedIntents.push({
                    type: bestMatchType,
                    data: bestMatch,
                    qty: finalQty,
                    preference: detectedPreference,
                    action: currentAction
                });
                i += (isOrder ? bestMatchLength : bestMatchLength - 1);
            }
            i++;
        }
        return detectedIntents;
    } catch (error) {
        console.error('Error in advanced NLP parser:', error);
        return [];
    }
};

module.exports = {
    parseAdvancedNLP,
    applyTypoCorrection
};
