import { useState, useCallback, useEffect, useRef } from 'react';
import { menu } from '../data/menu';
import { branchInfo } from '../data/branchInfo';
import { translations } from '../data/translations';

// --- HELPER: Advanced Text Normalization for Better Typo Handling ---
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/(.)\1{2,}/g, '$1') // Remove excessive repetitions ("wrapsssss" → "wraps")
        .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '') // Remove special chars
        .trim();
};

// --- HELPER: Determine if text is likely a category vs item ---
const isLikelyCategory = (text) => {
    const normalized = normalizeText(text);
    const len = normalized.length;
    
    // Short words (3-4 chars) are more likely items unless plural
    if (len <= 4 && !normalized.endsWith('s')) return false;
    
    // Words ending in 's' are more likely categories (plural)
    if (normalized.endsWith('s') && len >= 5) return true;
    
    // Check if it matches common category words
    const categoryKeywords = ['burger', 'wrap', 'sandwich', 'side', 'meal', 'juice', 'drink', 'snack', 'food'];
    const singularForm = normalized.endsWith('s') ? normalized.slice(0, -1) : normalized;
    
    return categoryKeywords.some(kw => singularForm.includes(kw) || kw.includes(singularForm));
};

// --- HELPER: Category aliases and synonyms for better matching ---
const getCategoryAliases = () => {
    return {
        'burgers': ['burger', 'burgers', 'برجر', 'البرجر'],
        'wraps': ['wrap', 'wraps', 'roll', 'rolls', 'لفائف', 'اللفائف', 'لفاف'],
        'sandwiches': ['sandwich', 'sandwiches', 'سندويش', 'السندويشات'],
        'sides': ['side', 'sides', 'snack', 'snacks', 'مقبلات', 'المقبلات', 'سناك'],
        'meals': ['meal', 'meals', 'وجبة', 'الوجبات', 'وجبات'],
        'juices': ['juice', 'juices', 'عصير', 'العصائر', 'عصائر'],
        'drinks': ['drink', 'drinks', 'beverage', 'beverages', 'مشروب', 'المشروبات', 'مشروبات']
    };
};

const INITIAL_STATE = {
    language: null, // 'en' | 'ar'
    step: 'INIT',
    currentCategory: null,
    currentItem: null,
    cart: [],
    itemQueue: [], // Queue for multi-item orders
    pendingResolution: null, // { qty: 3, catId: 'drinks' } - For resolving "3 drinks"
    categoryQueue: [], // Queue for categories when user orders multiple (e.g., "2 drinks and 2 wraps")
    completedCategories: [], // Track which categories have been completed
    originalRequest: null // Store original user request for reference
};

export function useBotEngine() {
    const [messages, setMessages] = useState([]);
    const [botState, setBotState] = useState(INITIAL_STATE);
    const [isTyping, setIsTyping] = useState(false);
    const hasInitialized = useRef(false);
    const lastProcessedMessage = useRef(null);
    const lastProcessedTime = useRef(0);

    const addMessage = useCallback((text, sender = 'bot', type = 'text', options = null, image = null) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            sender,
            type,
            options,
            image,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const simulateTyping = (callback, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const regexMatch = (input, keyword) => input.toLowerCase().includes(keyword.toLowerCase());

    // --- HELPER: Levenshtein Distance for Fuzzy Matching ---
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

    // --- HELPER: Parse Arabic Numerals ---
    const parseArabicNumbers = (str) => {
        return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    };

    // --- HELPER: Robust Item Search with Confidence Scoring ---
    const findBestMatchItem = (text, lang) => {
        let bestMatch = null;
        let bestScore = Infinity;
        
        // Normalize the search text
        const normalizedSearch = normalizeText(text);
        const rawSearch = text.toLowerCase();
        const searchLen = normalizedSearch.length;

        // Skip if search text is too short or likely a category
        if (searchLen < 2) return null;

        // Flatten items
        const allItems = [];
        Object.keys(menu.items).forEach(cat => {
            menu.items[cat].forEach(item => allItems.push({ ...item, catId: cat }));
        });

        allItems.forEach(item => {
            // Check against English and Arabic names
            const nameEn = item.name.en.toLowerCase();
            const normalizedNameEn = normalizeText(item.name.en);
            const nameAr = item.name.ar;
            const itemLen = normalizedNameEn.length;

            // 1. Direct exact match (perfect score)
            if (nameEn === rawSearch || nameEn === normalizedSearch) {
                bestMatch = item;
                bestScore = -10000; // Guaranteed best
                return;
            }

            // 2. Substring inclusion (very high priority)
            if (nameEn.includes(rawSearch) || nameAr.includes(text) ||
                normalizedNameEn.includes(normalizedSearch) || normalizedSearch.includes(normalizedNameEn)) {
                const score = -5000 + Math.abs(itemLen - searchLen) * 5; // Prefer similar lengths
                if (score < bestScore) {
                    bestMatch = item;
                    bestScore = score;
                }
                return;
            }
            
            // 3. Fuzzy match with comprehensive scoring
            let threshold;
            if (searchLen <= 4) threshold = 2;
            else if (searchLen <= 7) threshold = 3;
            else threshold = 5;

            const distEn = levenshtein(normalizedSearch, normalizedNameEn);
            const distRaw = levenshtein(rawSearch, nameEn);
            const dist = Math.min(distEn, distRaw);
            
            if (dist > threshold) return; // Too far, skip
            
            // Calculate comprehensive score
            let score = dist * 100; // Base score from distance
            
            // Prefix matching: stronger bonus for longer matching prefixes
            const maxPrefixLen = Math.min(4, Math.floor(searchLen * 0.7));
            let prefixMatchLen = 0;
            for (let i = 1; i <= maxPrefixLen; i++) {
                if (normalizedSearch.substring(0, i) === normalizedNameEn.substring(0, i)) {
                    prefixMatchLen = i;
                } else {
                    break;
                }
            }
            score -= prefixMatchLen * 60; // Strong bonus for each matching prefix char
            
            // Length similarity: penalize if lengths are very different
            const lenDiff = Math.abs(searchLen - itemLen);
            score += lenDiff * 15;
            
            // First character match bonus
            if (normalizedSearch[0] === normalizedNameEn[0]) {
                score -= 40;
            }
            
            // Word boundary bonus: if search matches start of item name
            if (normalizedNameEn.startsWith(normalizedSearch) || normalizedSearch.startsWith(normalizedNameEn)) {
                score -= 50;
            }
            
            if (score < bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        });
        
        // Only return if confidence is reasonable (score < 300)
        // This prevents very weak matches from being returned
        return (bestMatch && bestScore < 300) ? bestMatch : null;
    };

    // --- HELPER: Robust Category Search with Confidence Scoring ---
    const findBestMatchCategory = (text, lang) => {
        const search = text.toLowerCase().trim();
        const normalizedSearch = normalizeText(text);
        const searchLen = normalizedSearch.length;
        
        // Skip if search text is too short
        if (searchLen < 2) return null;
        
        // Detect if text is Arabic
        const isArabicText = /[\u0600-\u06FF]/.test(text);
        
        // Get category aliases for synonym matching
        const aliases = getCategoryAliases();
        
        // 1. Check aliases first for perfect matches
        for (const [catId, aliasList] of Object.entries(aliases)) {
            const category = menu.categories.find(c => c.id === catId);
            if (category && aliasList.some(alias => 
                alias === search || 
                alias === normalizedSearch ||
                search.includes(alias) || 
                alias.includes(search)
            )) {
                return category;
            }
        }
        
        // 2. Exact match (perfect score) - check both languages
        let match = menu.categories.find(c => 
            c.title.en.toLowerCase() === search || 
            c.title.ar === text ||
            normalizeText(c.title.en) === normalizedSearch ||
            c.title.ar.includes(text)
        );
        
        if (match) return match;
        
        // 2. Plural handling - remove trailing 's' and check again (English only)
        if (!isArabicText) {
            const singularSearch = search.endsWith('s') ? search.slice(0, -1) : search;
            const normalizedSingular = normalizedSearch.endsWith('s') ? normalizedSearch.slice(0, -1) : normalizedSearch;
            
            if (singularSearch !== search || normalizedSingular !== normalizedSearch) {
                // Check aliases with singular form
                for (const [catId, aliasList] of Object.entries(aliases)) {
                    const category = menu.categories.find(c => c.id === catId);
                    if (category && aliasList.some(alias => 
                        alias === singularSearch || 
                        alias === normalizedSingular ||
                        singularSearch.includes(alias) || 
                        alias.includes(singularSearch)
                    )) {
                        return category;
                    }
                }
                
                match = menu.categories.find(c => {
                    const catEn = c.title.en.toLowerCase();
                    const normalizedCat = normalizeText(c.title.en);
                    return catEn === singularSearch || catEn === singularSearch + 's' ||
                           normalizedCat === normalizedSingular || normalizedCat === normalizedSingular + 's';
                });
                if (match) return match;
            }
        }
        
        // 3. Partial match (substring) - check both languages
        match = menu.categories.find(c => {
            const catEn = c.title.en.toLowerCase();
            const normalizedCat = normalizeText(c.title.en);
            const catAr = c.title.ar;
            
            // English matching
            if (!isArabicText) {
                const singularSearch = search.endsWith('s') ? search.slice(0, -1) : search;
                if (catEn.includes(search) || search.includes(catEn) || 
                    catEn.includes(singularSearch) || singularSearch.includes(catEn) ||
                    normalizedCat.includes(normalizedSearch) || normalizedSearch.includes(normalizedCat)) {
                    return true;
                }
            }
            
            // Arabic matching
            if (catAr.includes(text) || text.includes(catAr)) {
                return true;
            }
            
            return false;
        });
        
        if (match) return match;
        
        // 4. Fuzzy match with comprehensive scoring - works for both languages
        let bestMatch = null;
        let bestScore = Infinity;
        // isArabicText already declared above
        
        menu.categories.forEach(c => {
            const catEn = c.title.en.toLowerCase();
            const catAr = c.title.ar;
            const normalizedCat = normalizeText(c.title.en);
            const catLen = normalizedCat.length;
            
            // More lenient thresholds for better recognition
            let threshold;
            if (searchLen <= 4) threshold = 3;      // Increased from 2
            else if (searchLen <= 6) threshold = 4; // Increased from 3
            else threshold = 6;                     // Increased from 5
            
            let dist;
            if (isArabicText) {
                // Arabic fuzzy matching
                dist = levenshtein(text, catAr);
            } else {
                // English fuzzy matching
                const d1 = levenshtein(search, catEn);
                const d2 = levenshtein(normalizedSearch, normalizedCat);
                dist = Math.min(d1, d2);
                
                // Also check against aliases
                const categoryAliases = Object.entries(aliases).find(([catId]) => catId === c.id)?.[1] || [];
                categoryAliases.forEach(alias => {
                    const aliasDist = levenshtein(normalizedSearch, normalizeText(alias));
                    dist = Math.min(dist, aliasDist);
                });
            }
            
            if (dist > threshold) return;
            
            // Calculate comprehensive score
            let score = dist * 100;
            
            if (!isArabicText) {
                // English-specific bonuses
                // Prefix matching bonus
                const maxPrefixLen = Math.min(4, Math.floor(searchLen * 0.7));
                let prefixMatchLen = 0;
                for (let i = 1; i <= maxPrefixLen; i++) {
                    if (normalizedSearch.substring(0, i) === normalizedCat.substring(0, i)) {
                        prefixMatchLen = i;
                    } else {
                        break;
                    }
                }
                score -= prefixMatchLen * 60;
                
                // Length similarity
                const lenDiff = Math.abs(searchLen - catLen);
                score += lenDiff * 10; // Reduced penalty from 15
                
                // First character match
                if (normalizedSearch[0] === normalizedCat[0]) {
                    score -= 40;
                }
                
                // Word boundary bonus
                if (normalizedCat.startsWith(normalizedSearch) || normalizedSearch.startsWith(normalizedCat)) {
                    score -= 50;
                }
                
                // Category heuristic bonus: if text looks like a category, boost category matches
                if (isLikelyCategory(text)) {
                    score -= 100; // Strong bonus for category-like words
                }
            }
            
            if (score < bestScore) {
                bestScore = score;
                bestMatch = c;
            }
        });
        
        // More lenient confidence threshold - increased from 250 to 400
        return (bestMatch && bestScore < 400) ? bestMatch : null;
    };

    // --- HELPER: Word to Number Converter ---
    const textToNumber = (text) => {
        const smallNumbers = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'single': 1, 'double': 2, 'triple': 3,
            // Common speech recognition errors
            'too': 2, 'to': 2, 'tree': 3, 'free': 3, 'for': 4, 'fore': 4,
            'ate': 8, 'won': 1, 'tu': 2, 'ton': 10,
            'واحد': 1, 'واحدة': 1, 'اثنين': 2, 'اثنان': 2, 'ثلاثة': 3, 'ثلاث': 3,
            'أربعة': 4, 'اربعة': 4, 'خمسة': 5, 'خمس': 5
        };

        const lower = text.toLowerCase().trim();
        if (smallNumbers[lower]) return smallNumbers[lower];

        const parsed = parseInt(text);
        return isNaN(parsed) ? null : parsed;
    };

    // --- HELPER: Natural Language Parser with Bilingual Support ---
    const parseNaturalLanguageOrder = (text, lang) => {
        try {
            const cleanText = parseArabicNumbers(text).toLowerCase();
            console.log('Parsing input:', text, '→', cleanText);

            // Stop words to filter out (command words, connectors, etc.)
            const stopWords = ['please', 'add', 'give', 'me', 'want', 'need', 'like', 'would', 'can', 'i', 'get', 'have', 'the', 'a', 'an', 'some', 'any', 'order', 'to', 'for', 'with', 'from', 'at', 'in', 'on', 'of', 'من', 'فضلك', 'أريد', 'أضف'];
        
        // Enhanced pattern to match both English and Arabic
        // English numbers + Arabic numbers pattern
        const numberPattern = "\\d+|one|two|three|four|five|six|seven|eight|nine|ten|single|double|triple|واحد|واحدة|اثنين|اثنان|ثلاثة|ثلاث|أربعة|اربعة|خمسة|خمس";
        
        // Pattern 1: Quantity + item/category ("2 burgers", "three coffee", "2 beef burgers")
        // More flexible pattern - matches number followed by words
        const intentRegex = new RegExp(`(${numberPattern})\\s+([a-zA-Z\\u0600-\\u06FF]+(?:[\\s-][a-zA-Z\\u0600-\\u06FF]+){0,3})`, 'gi');
        
        // Pattern 2: Item/category + quantity ("burger 2", "برجر ٢")
        // Enhanced to support both languages
        const itemQtyRegex = new RegExp(`([a-zA-Z\\u0600-\\u06FF]+(?:s{2,})?[a-zA-Z\\u0600-\\u06FF]*)\\s+(${numberPattern})`, 'gi');
        
        // Pattern 3: Item/category without quantity (e.g., "and wraps", "و برجر")
        // Enhanced to support both languages and Arabic conjunction "و"
        const noQtyRegex = /(?:and|&|,|\+|و)\s+([a-zA-Z\u0600-\u06FF]+(?:s{2,})?[a-zA-Z\u0600-\u06FF]*)\b/gi;

        const detectedIntents = [];
        let match;

        // First pass: Match items with quantities
        while ((match = intentRegex.exec(cleanText)) !== null) {
            const qtyRaw = match[1];
            const qty = textToNumber(qtyRaw) || 1;
            const rawText = match[2].trim();
            
            console.log('✅ Pattern 1 matched:', { qtyRaw, qty, rawText, fullMatch: match[0] });

            // Enhanced stop word filtering
            if (!rawText || stopWords.includes(rawText) || rawText === 'and' || rawText === 'of' || rawText === 'for') continue;
            
            // Skip if text is too short (likely not a real item/category)
            if (rawText.length < 3) continue;

            if (!lang) lang = 'en';

            let matched = false;
            
            // For multi-word text (e.g., "beef burger", "chicken wrap"), prioritize ITEM matching
            const isMultiWord = rawText.includes(' ');
            const likelyCategory = !isMultiWord && isLikelyCategory(rawText);

            // If multi-word, try ITEM first (e.g., "beef burger" should find "Beef Burger" item)
            if (isMultiWord) {
                const item = findBestMatchItem(rawText, lang);
                if (item) {
                    detectedIntents.push({ type: 'ITEM', data: item, qty });
                    matched = true;
                }
            }

            // If text looks like a category, try category first (only if not multi-word)
            if (!matched && likelyCategory) {
                const cat = findBestMatchCategory(rawText, lang);
                if (cat) {
                    detectedIntents.push({ type: 'CATEGORY', data: cat, qty });
                    matched = true;
                }
            }

            // Try to match as ITEM if not matched yet
            if (!matched) {
                const item = findBestMatchItem(rawText, lang);
                
                if (item) {
                    const nameEn = item.name.en.toLowerCase();
                    const normalizedName = normalizeText(item.name.en);
                    const normalizedSearch = normalizeText(rawText);
                    const search = rawText.toLowerCase();
                    
                    // If it's an exact match or substring match, definitely use item
                    if (nameEn === search || normalizedName === normalizedSearch ||
                        nameEn.includes(search) || search.includes(nameEn) ||
                        normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
                        detectedIntents.push({ type: 'ITEM', data: item, qty });
                        matched = true;
                    }
                    
                    // If fuzzy match distance is very small (≤2), likely an item
                    if (!matched) {
                        const dist1 = levenshtein(search, nameEn);
                        const dist2 = levenshtein(normalizedSearch, normalizedName);
                        const dist = Math.min(dist1, dist2);
                        
                        if (dist <= 2) {
                            detectedIntents.push({ type: 'ITEM', data: item, qty });
                            matched = true;
                        }
                    }
                }
            }

            // Try category if not matched yet and didn't already try
            if (!matched && !likelyCategory) {
                const cat = findBestMatchCategory(rawText, lang);
                if (cat) {
                    detectedIntents.push({ type: 'CATEGORY', data: cat, qty });
                    matched = true;
                }
            }
        }

        // Second pass: Catch "item quantity" format (e.g., "burger 2", "burer 2")
        itemQtyRegex.lastIndex = 0;
        while ((match = itemQtyRegex.exec(cleanText)) !== null) {
            const rawText = match[1].trim();
            const qtyRaw = match[2];
            const qty = textToNumber(qtyRaw) || 1;
            
            // Skip stop words and short text
            if (stopWords.includes(rawText) || rawText.length < 3) continue;
            
            // Normalize text for better matching
            const normalizedText = normalizeText(rawText);
            
            if (!normalizedText || normalizedText.length < 2) continue;
            if (!lang) lang = 'en';
            
            // Try to match as item first, then category
            const item = findBestMatchItem(rawText, lang);
            const cat = !item ? findBestMatchCategory(rawText, lang) : null;
            
            // Check if already detected by comparing actual matched items/categories
            const alreadyDetected = detectedIntents.some(intent => {
                if (item && intent.type === 'ITEM' && intent.data.id === item.id) {
                    return true;
                }
                if (cat && intent.type === 'CATEGORY' && intent.data.id === cat.id) {
                    return true;
                }
                return false;
            });
            
            if (alreadyDetected) continue;
            
            if (item) {
                detectedIntents.push({ type: 'ITEM', data: item, qty });
            } else if (cat) {
                detectedIntents.push({ type: 'CATEGORY', data: cat, qty });
            }
        }

        // Third pass: Catch items without quantities (e.g., "and wrapsssss", "and burger")
        // Reset regex
        noQtyRegex.lastIndex = 0;
        while ((match = noQtyRegex.exec(cleanText)) !== null) {
            const rawText = match[1].trim();
            
            // Skip stop words and short text
            if (stopWords.includes(rawText) || rawText.length < 3) continue;
            
            // Normalize text (removes excessive repetitions and special chars)
            const normalizedText = normalizeText(rawText);
            
            if (!normalizedText || normalizedText.length < 2) continue;
            
            if (!lang) lang = 'en';
            
            // Try to match as category/item
            const cat = findBestMatchCategory(rawText, lang);
            const item = !cat ? findBestMatchItem(rawText, lang) : null;
            
            // Check if already detected by comparing actual matched items/categories
            const alreadyDetected = detectedIntents.some(intent => {
                if (cat && intent.type === 'CATEGORY' && intent.data.id === cat.id) {
                    return true;
                }
                if (item && intent.type === 'ITEM' && intent.data.id === item.id) {
                    return true;
                }
                return false;
            });
            
            if (alreadyDetected) continue;
            
            if (cat) {
                detectedIntents.push({ type: 'CATEGORY', data: cat, qty: 1 });
            } else if (item) {
                detectedIntents.push({ type: 'ITEM', data: item, qty: 1 });
            }
        }

        // Fallback: If regex matched nothing, try simple category search
        if (detectedIntents.length === 0) {
            const cat = findBestMatchCategory(cleanText, lang);
            if (cat) {
                detectedIntents.push({ type: 'CATEGORY', data: cat, qty: 0 });
            }
        }

        console.log('Detected intents:', detectedIntents);
        return detectedIntents;
        } catch (error) {
            console.error('Error in parseNaturalLanguageOrder:', error);
            return [];
        }
    };

    const handleUserMessage = (text) => {
        // Prevent duplicate processing of the same message within 500ms
        const now = Date.now();
        if (text === lastProcessedMessage.current && now - lastProcessedTime.current < 500) {
            console.log('Ignoring duplicate message:', text);
            return;
        }
        
        lastProcessedMessage.current = text;
        lastProcessedTime.current = now;
        
        addMessage(text, 'user');
        simulateTyping(() => {
            try {
                processInput(text);
            } catch (err) {
                console.error("Bot Engine Error:", err);
                console.error("Error stack:", err.stack);
                console.error("User input was:", text);
                console.error("Current bot state:", botState);
                addMessage("Sorry, I encountered an error processing that. Let me help you.", 'bot');
                setTimeout(() => {
                    showCategories(botState.language || 'en');
                }, 500);
            }
        });
    };

    // --- HELPER: Process Next Item in Queue ---
    // Returns true if an item was processed, false if queue empty
    const processNextQueueItem = (queue, t, lang, previousItemName = null) => {
        // Clear pending resolution just in case
        setBotState(prev => ({ ...prev, pendingResolution: null }));

        if (queue.length === 0) return false;
        const nextIntent = queue[0];
        const remainingQueue = queue.slice(1);

        // CASE 1: SPECIFIC ITEM (e.g. "3 Tea", "2 Coffee")
        if (nextIntent.type === 'ITEM') {
            const nextItem = nextIntent.data;
            const hasQty = nextIntent.qty && nextIntent.qty > 0;

            // Transitional Message - clearer format
            if (previousItemName) {
                const msg = lang === 'en'
                    ? `Now, let's add the next item...`
                    : `الآن، دعنا نضيف العنصر التالي...`;
                addMessage(msg, 'bot');
            }

            const preferenceWhitelist = ['1', '2', '5', '25', '26', '27'];
            const needsPref = preferenceWhitelist.includes(nextItem.id);

            // If user specified quantity AND item needs preference
            if (hasQty && needsPref) {
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_PREF',
                    currentItem: { ...nextItem, qty: nextIntent.qty },
                    itemQueue: remainingQueue
                }));
                addMessage(`${t.confirmAdd} ${nextItem.name[lang]} x${nextIntent.qty}`, 'bot');
                setTimeout(() => {
                    addMessage(t.choosePref, 'bot', 'button', [
                        { id: 'pref_spicy', label: t.spicy },
                        { id: 'pref_normal', label: t.nonSpicy }
                    ]);
                }, 500);
            // If user specified quantity AND no preference needed - direct confirm
            } else if (hasQty && !needsPref) {
                setBotState(prev => ({
                    ...prev,
                    step: 'ITEM_CONFIRM',
                    currentItem: { ...nextItem, qty: nextIntent.qty },
                    itemQueue: remainingQueue
                }));
                addMessage(`${t.confirmAdd}\n*${nextItem.name[lang]}* x${nextIntent.qty}`, 'bot', 'button', [
                    { id: 'confirm_yes', label: t.yes },
                    { id: 'confirm_no', label: t.no }
                ]);
            // If user did NOT specify quantity - ask for it or preference first
            } else if (!hasQty) {
                if (needsPref) {
                    setBotState(prev => ({
                        ...prev,
                        step: 'ITEM_PREF',
                        currentItem: { ...nextItem, qty: 1 },
                        itemQueue: remainingQueue
                    }));
                    const prefMsg = lang === 'en'
                        ? `🌶️ **How would you like your ${nextItem.name[lang]}?**`
                        : `🌶️ **كيف تريد ${nextItem.name[lang]}؟**`;
                    addMessage(prefMsg, 'bot', 'button', [
                        { id: 'pref_spicy', label: t.spicy },
                        { id: 'pref_normal', label: t.nonSpicy }
                    ]);
                } else {
                    // Ask for quantity
                    setBotState(prev => ({
                        ...prev,
                        step: 'ITEM_QTY',
                        currentItem: { ...nextItem, qty: 1 },
                        itemQueue: remainingQueue
                    }));
                    const qtyMsg = lang === 'en'
                        ? `🔢 **How many ${nextItem.name[lang]} would you like?**\n(or type a number)`
                        : `🔢 **كم عدد ${nextItem.name[lang]} تريد؟**\n(أو اكتب رقماً)`;
                    addMessage(qtyMsg, 'bot', 'button', [
                        { id: 'qty_1', label: '1' },
                        { id: 'qty_2', label: '2' },
                        { id: 'qty_3', label: '3' },
                        { id: 'qty_4', label: '4' },
                        { id: 'type_qty', label: t.typeQuantity }
                    ]);
                }
            }
        }

        // CASE 2: CATEGORY INTENT (e.g. "3 Drinks")
        if (nextIntent.type === 'CATEGORY') {
            const category = nextIntent.data;
            const qty = nextIntent.qty;

            // Set state to resolving this category
            setBotState(prev => ({
                ...prev,
                step: 'ITEMS_LIST',
                currentCategory: category.id,
                pendingResolution: { qty, catId: category.id }, // STORE INTENT
                itemQueue: remainingQueue
            }));

            // Conversational Prompt - Show items menu
            let promptText = "";
            if (previousItemName) {
                promptText = lang === 'en'
                    ? `✅ Great! Now let's proceed with ${category.title[lang]}.\n\nShowing you the ${category.title[lang]} menu...`
                    : `✅ ممتاز! الآن لنتابع مع ${category.title[lang]}.\n\nإظهار قائمة ${category.title[lang]}...`;
            } else {
                promptText = lang === 'en'
                    ? `✅ Perfect! Let's help you choose from ${category.title[lang]}.\n\nShowing you the ${category.title[lang]} menu...`
                    : `✅ ممتاز! دعنا نساعدك في الاختيار من ${category.title[lang]}.\n\nإظهار قائمة ${category.title[lang]}...`;
            }

            addMessage(promptText, 'bot');

            // Filter items to exclude already-ordered ones
            let allItems = menu.items[category.id] || [];
            const { cart } = botState;
            const alreadyOrderedItemIds = new Set();
            
            cart.forEach(cartItem => alreadyOrderedItemIds.add(cartItem.id));
            
            // Also check if specific items from this category were ordered in the queue
            if (remainingQueue && remainingQueue.length > 0) {
                remainingQueue.forEach(queueItem => {
                    if (queueItem.type === 'ITEM') {
                        alreadyOrderedItemIds.add(queueItem.data.id);
                    }
                });
            }
            
            const items = allItems.filter(item => !alreadyOrderedItemIds.has(item.id));
            
            if (items.length === 0) {
                const noItemsMsg = lang === 'en'
                    ? `✅ All items from ${category.title[lang]} have been added!`
                    : `✅ تمت إضافة جميع العناصر من ${category.title[lang]}!`;
                addMessage(noItemsMsg, 'bot');
                // Continue to next item in queue
                if (remainingQueue.length > 0) {
                    setTimeout(() => processNextQueueItem(remainingQueue, t, lang), 600);
                }
                return true;
            }

            // Show items for selection
            items.forEach((item, index) => {
                setTimeout(() => {
                    addMessage(
                        `*${item.name[lang]}*\n💰 ${item.price}`,
                        'bot',
                        'image',
                        [{ id: `add_${item.id}`, label: '➕ Add' }],
                        item.image
                    );
                }, index * 150 + 200);
            });
        }

        return true;
    }

    // --- HELPER: Show Items for a Category ---
    const showItemsForCategory = (catId, lang, t, delay = 0) => {
        setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: catId }));
        const category = menu.categories.find(c => c.id === catId);

        setTimeout(() => {
            addMessage(`*${category.title[lang]}*`, 'bot');
            let allItems = menu.items[catId] || [];
            
            // Filter out items that are already in the cart or queue
            const { cart, itemQueue, categoryQueue } = botState;
            const alreadyOrderedItemIds = new Set();
            
            // Get items from cart
            cart.forEach(cartItem => alreadyOrderedItemIds.add(cartItem.id));
            
            // Get items from item queue
            if (itemQueue && itemQueue.length > 0) {
                itemQueue.forEach(queueItem => {
                    if (queueItem.type === 'ITEM') {
                        alreadyOrderedItemIds.add(queueItem.data.id);
                    }
                });
            }
            
            // Get items from category queue (check if user ordered specific items like "coffee")
            if (categoryQueue && categoryQueue.length > 0) {
                categoryQueue.forEach(queueItem => {
                    if (queueItem.type === 'ITEM') {
                        alreadyOrderedItemIds.add(queueItem.data.id);
                    }
                });
            }
            
            // Filter out already ordered items
            const items = allItems.filter(item => !alreadyOrderedItemIds.has(item.id));
            
            if (items.length === 0) {
                const noItemsMsg = lang === 'en'
                    ? `✅ All items from ${category.title[lang]} have been added to your order!`
                    : `✅ تمت إضافة جميع العناصر من ${category.title[lang]} إلى طلبك!`;
                addMessage(noItemsMsg, 'bot');
                addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
                return;
            }

            items.forEach((item, index) => {
                setTimeout(() => {
                    // Add Number Prefix for Numeric Selection
                    addMessage(
                        `*${index + 1}. ${item.name[lang]}*\n💰 ${item.price}`,
                        'bot',
                        'image',
                        [{ id: `add_${item.id}`, label: '➕ Add' }],
                        item.image
                    );
                }, index * 150 + 200);
            });

            setTimeout(() => {
                addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
            }, items.length * 150 + 300);
        }, delay);
    };

    // --- HELPER: Initiate Item Add Logic ---
    const initiateItemAdd = (selectedItem, t, lang) => {
        const preferenceWhitelist = ['1', '2', '5', '25', '26', '27'];
        const nextStep = preferenceWhitelist.includes(selectedItem.id) ? 'ITEM_PREF' : 'ITEM_QTY';

        setBotState(prev => ({
            ...prev,
            step: nextStep,
            currentItem: { ...selectedItem, qty: 1 }
        }));

        if (nextStep === 'ITEM_PREF') {
            const prefMsg = lang === 'en'
                ? `🌶️ **How would you like your ${selectedItem.name[lang]}?**`
                : `🌶️ **كيف تريد ${selectedItem.name[lang]}؟**`;
            
            addMessage(prefMsg, 'bot', 'button', [
                { id: 'pref_spicy', label: t.spicy },
                { id: 'pref_normal', label: t.nonSpicy }
            ]);
        } else {
            const qtyMsg = lang === 'en'
                ? `🔢 **How many ${selectedItem.name[lang]} would you like?**\n(or type a number)`
                : `🔢 **كم عدد ${selectedItem.name[lang]} تريد؟**\n(أو اكتب رقماً)`;
            
            addMessage(qtyMsg, 'bot', 'button', [
                { id: 'qty_1', label: '1' },
                { id: 'qty_2', label: '2' },
                { id: 'qty_3', label: '3' },
                { id: 'qty_4', label: '4' },
                { id: 'type_qty', label: t.typeQuantity }
            ]);
        }
    };

    const processInput = (text) => {
        // ... (rest of processInput as previously defined)
        const { step, language, currentCategory, currentItem, cart, itemQueue, pendingResolution } = botState;
        const t = translations[language] || translations['en'];

        // --- NUMBER SELECTION HANDLER ---
        // If user types "1", "2" etc. and we are in a list view, select that item.
        // We check this BEFORE Global NLP (which looks for "2 drinks" qty) 
        // BUT we must be careful. "2" could be Qty or Selection.
        // Context is key:
        // If in CATEGORIES -> "1" is selection.
        // If in ITEMS_LIST -> "1" is selection (Select item 1 to add it).
        // If in ITEM_QTY -> "1" is Qty.

        // Helper to check if input is single number
        const isSingleNumber = /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/i.test(text);

        if (isSingleNumber && (step === 'CATEGORIES' || step === 'BRANCHES_LIST' || step === 'ITEMS_LIST')) {
            const num = textToNumber(text); // Use our helper
            if (num > 0) {
                const index = num - 1;

                // Handle Category Selection by Number
                if (step === 'CATEGORIES') {
                    // Check if it's a consolidated group selection
                    const categoryGroups = {
                        'burgers_meals': ['burgers', 'meals'],
                        'sandwiches_wraps': ['sandwiches', 'wraps'],
                        'sides_drinks': ['sides', 'drinks', 'juices']
                    };
                    
                    // Handle consolidated group buttons
                    if (categoryGroups[text]) {
                        const subCategories = categoryGroups[text];
                        const groupName = text === 'burgers_meals' ? (language === 'en' ? 'Burgers & Meals' : 'برجر ووجبات') :
                                         text === 'sandwiches_wraps' ? (language === 'en' ? 'Sandwiches & Wraps' : 'سندويتشات ولفائف') :
                                         (language === 'en' ? 'Sides, Drinks & Juices' : 'مقبلات ومشروبات');
                        
                        const selectMsg = language === 'en'
                            ? `**${groupName}** - Please select:`
                            : `**${groupName}** - اختر:`;
                        
                        const subCatButtons = subCategories.map(catId => {
                            const category = menu.categories.find(c => c.id === catId);
                            return { id: catId, label: category.title[language] };
                        });
                        
                        addMessage(selectMsg, 'bot', 'button', subCatButtons);
                        return;
                    }
                    
                    if (menu.categories[index]) {
                        const catId = menu.categories[index].id;
                        // Trigger selection logic
                        showItemsForCategory(catId, language, t);
                        return;
                    }
                }

                // Handle Branch Selection by Number
                if (step === 'BRANCHES_LIST') {
                    if (branchInfo.branches[index]) {
                        const b = branchInfo.branches[index];
                        setBotState(prev => ({ ...prev, step: 'BRANCH_DETAIL' }));
                        const detailText = `📍 *${b.name}*\n🏠 ${b.address}\n📞 ${b.phone}`;
                        addMessage(detailText, 'bot', 'button', [
                            { id: 'call_now', label: `${t.call} (${b.phone})` },
                            { id: 'back_home', label: t.back },
                            { id: 'btn_menu', label: t.menu }
                        ]);
                        return;
                    }
                }

                // Handle Item Selection by Number (in Items List)
                if (step === 'ITEMS_LIST') {
                    const items = menu.items[currentCategory] || [];
                    if (items[index]) {
                        const selectedItem = items[index];
                        // Trigger Add Item Logic (Reuse logic below or extract)
                        // We will just let the flow continue to "selectedItem" check logic but we need to set it.
                        // Actually, let's manually trigger the item logic here to avoid state duplication issues
                        initiateItemAdd(selectedItem, t, language);
                        return;
                    }
                }
            }
        }

        // --- GLOBAL NAVIGATION HANDLERS ---
        // Catch-all for menu/branches buttons regardless of current step (unless selecting QTY)
        if (step !== 'ITEM_QTY') {
            if (text === 'btn_menu' || regexMatch(text, 'menu') || text === t.menu) {
                showCategories(language);
                return;
            }
            if (text === 'btn_branches' || regexMatch(text, 'branch') || text === t.branches) {
                setBotState(prev => ({ ...prev, step: 'BRANCHES_LIST' }));
                const branchButtons = branchInfo.branches.map(b => ({ id: `br_${b.id}`, label: b.name }));
                addMessage(t.selectBranch, 'bot', 'button', branchButtons);
                return;
            }
        }

        // --- GLOBAL: FINISH ORDER DETECTION ---
        // Detect phrases like "finish", "complete", "done", "no more", "that's all", etc.
        if (step !== 'ITEM_QTY' && step !== 'ITEM_PREF' && step !== 'ITEM_CONFIRM' && step !== 'LANGUAGE' && step !== 'PAYMENT_METHOD' && step !== 'ORDER_SUMMARY') {
            const cleanText = text.toLowerCase();
            
            // Check for finish/complete phrases
            const finishPhrases = [
                'finish', 'complete', 'done', 'no more', 'not any more', 'no anymore',
                "that's all", 'thats all', "i'm done", 'im done',
                'complete order', 'finish order', 'complete the order', 'finish the order',
                'checkout', 'check out', 'proceed to payment', 'pay now', 'ready to pay',
                'انهاء', 'اكمال', 'خلاص', 'كفاية', 'انتهيت'
            ];
            
            const wantsToFinish = finishPhrases.some(phrase => cleanText.includes(phrase));
            
            if (wantsToFinish && cart.length > 0) {
                setBotState(prev => ({ ...prev, step: 'PAYMENT_METHOD' }));
                addMessage(t.paymentMethod, 'bot', 'button', [
                    { id: 'pay_cash', label: t.cash },
                    { id: 'pay_online', label: t.online }
                ]);
                return;
            }
            
            // Check for "order more" / "add more" phrases
            const orderMorePhrases = [
                'order more', 'add more', 'want more', 'i want to order more',
                'want to add', 'add something', 'order something',
                'طلب المزيد', 'اضف المزيد', 'اريد المزيد'
            ];
            
            const wantsToOrderMore = orderMorePhrases.some(phrase => cleanText.includes(phrase));
            
            if (wantsToOrderMore && cart.length > 0) {
                showCategories(language);
                return;
            }
        }

        // --- GLOBAL: CHECK FOR NATURAL LANGUAGE ORDER (e.g. "2 drinks and 2 wraps", "add burger", "give me 3 coffees") ---
        // We check this BEFORE specific step logic (except QTY/PREF/CONFIRM) to allow "Add X" anywhere
        if (step !== 'ITEM_QTY' && step !== 'ITEM_PREF' && step !== 'ITEM_CONFIRM' && step !== 'LANGUAGE') {
            // Check for irrelevant questions FIRST
            if (isIrrelevantQuestion(text)) {
                const politeMsg = language === 'en'
                    ? "I apologize, but I can only help with food orders and restaurant information.\n\nLet me show you what I can do:"
                    : "عذراً، يمكنني فقط المساعدة في طلبات الطعام ومعلومات المطعم.\n\nدعني أريك ما يمكنني فعله:";
                
                addMessage(politeMsg, 'bot');
                
                setTimeout(() => {
                    addMessage(t.mainMenu, 'bot', 'button', [
                        { id: 'btn_branches', label: t.branches },
                        { id: 'btn_menu', label: t.menu }
                    ]);
                }, 800);
                return;
            }
            
            const nlpIntents = parseNaturalLanguageOrder(text, language);
            if (nlpIntents.length > 0) {
                // Check if there are actionable intents
                const hasActionableIntent = nlpIntents.some(i => i.type === 'ITEM' || (i.type === 'CATEGORY' && i.qty > 0));

                if (hasActionableIntent) {
                    // **CHECK IF THERE'S AN ACTIVE CATEGORY QUEUE (multi-category order in progress)**
                    // Don't trigger if user is still at category selection (hasn't started ordering yet)
                    const { categoryQueue, completedCategories } = botState;
                    const hasPendingCategories = step !== 'CATEGORY_SELECTION_CONFIRM' && 
                        categoryQueue && categoryQueue.length > 0 && 
                        categoryQueue.some(c => !completedCategories.includes(c.data.id)) &&
                        completedCategories.length > 0; // Only if they've completed at least one category
                    
                    if (hasPendingCategories) {
                        // User has pending categories but is trying to order something else
                        const pendingList = categoryQueue
                            .filter(c => !completedCategories.includes(c.data.id))
                            .map(c => `${c.qty}x ${c.data.title[language]}`)
                            .join(', ');
                        
                        const newItemsList = nlpIntents.map(i => {
                            if (i.type === 'ITEM') {
                                return `${i.qty}x ${i.data.name[language]}`;
                            } else {
                                return `${i.qty}x ${i.data.title[language]}`;
                            }
                        }).join(', ');
                        
                        const reminderMsg = language === 'en'
                            ? `⚠️ Wait, sir! You still have pending items from your original order:\n\n⏳ **Remaining:** ${pendingList}\n\n🆕 **New request:** ${newItemsList}\n\n📋 What would you like to do?`
                            : `⚠️ انتظر يا سيدي! لا يزال لديك عناصر معلقة من طلبك الأصلي:\n\n⏳ **المتبقي:** ${pendingList}\n\n🆕 **طلب جديد:** ${newItemsList}\n\n📋 ماذا تريد أن تفعل؟`;
                        
                        addMessage(reminderMsg, 'bot', 'button', [
                            { id: 'continue_original', label: language === 'en' ? '✅ Continue Original Order' : '✅ متابعة الطلب الأصلي' },
                            { id: 'add_to_queue', label: language === 'en' ? '➕ Add New Items to Queue' : '➕ إضافة عناصر جديدة' },
                            { id: 'replace_order', label: language === 'en' ? '🔄 Replace with New Order' : '🔄 استبدال بطلب جديد' }
                        ]);
                        
                        // Store the new intents temporarily
                        setBotState(prev => ({
                            ...prev,
                            step: 'PENDING_ORDER_DECISION',
                            pendingNewIntents: nlpIntents
                        }));
                        return;
                    }
                    
                    // Check if multiple CATEGORIES are detected (e.g., "2 drinks and 2 wraps")
                    const categoryIntents = nlpIntents.filter(i => i.type === 'CATEGORY' && i.qty > 0);
                    const itemIntents = nlpIntents.filter(i => i.type === 'ITEM');
                    
                    // **SMART HANDLING: If both ITEMs and CATEGORIEs detected (e.g., "2 burgers, 3 coffees, and 2 drinks")**
                    // Process items first, then categories (excluding items already ordered)
                    if (itemIntents.length > 0 && categoryIntents.length > 0) {
                        const allIntents = [...itemIntents, ...categoryIntents];
                        const itemsList = allIntents.map(i => {
                            if (i.type === 'ITEM') {
                                return `${i.qty}x ${i.data.name[language]}`;
                            } else {
                                return `${i.qty}x ${i.data.title[language]}`;
                            }
                        }).join(', ');
                        
                        const smartMsg = language === 'en'
                            ? `✅ Perfect, sir! I found: ${itemsList}\n\nLet me help you add them to your cart...`
                            : `✅ ممتاز يا سيدي! وجدت: ${itemsList}\n\nدعني أساعدك في إضافتهم للسلة...`;
                        
                        addMessage(smartMsg, 'bot');
                        
                        const first = allIntents[0];
                        const rest = allIntents.slice(1);
                        setBotState(prev => ({ ...prev, itemQueue: rest }));
                        
                        setTimeout(() => {
                            processNextQueueItem([first, ...rest], t, language);
                        }, 600);
                        return;
                    }
                    
                    // **PRIORITY: If specific ITEMs detected, handle them directly without category selection**
                    if (itemIntents.length > 0 && categoryIntents.length === 0) {
                        // User specified exact items (e.g., "2 beef burger"), add them directly
                        const itemsList = itemIntents.map(i => `${i.qty}x ${i.data.name[language]}`).join(', ');
                        
                        if (language === 'en') {
                            ackMessage = `✅ Perfect, sir! I found: ${itemsList}\n\nLet me help you add them to your cart...`;
                        } else {
                            ackMessage = `✅ ممتاز يا سيدي! وجدت: ${itemsList}\n\nدعني أساعدك في إضافتهم للسلة...`;
                        }
                        addMessage(ackMessage, 'bot');

                        const first = itemIntents[0];
                        const rest = itemIntents.slice(1);
                        setBotState(prev => ({ ...prev, itemQueue: rest }));
                        
                        setTimeout(() => {
                            processNextQueueItem([first, ...rest], t, language);
                        }, 600);
                        return;
                    }
                    
                    // **SPECIAL CASE: User is at category selection, adding more categories**
                    if (step === 'CATEGORY_SELECTION_CONFIRM' && categoryIntents.length > 0) {
                        const { categoryQueue } = botState;
                        
                        // Merge new categories with existing queue
                        const mergedQueue = [...categoryQueue, ...categoryIntents];
                        
                        const allItemsList = mergedQueue.map(i => 
                            `${i.qty}x ${i.data.title[language]}`
                        ).join(', ');
                        
                        const addedMsg = language === 'en'
                            ? `✅ Great! I've added ${categoryIntents.map(c => `${c.qty}x ${c.data.title[language]}`).join(', ')} to your order.\n\n📋 Your full order: ${allItemsList}\n\nWhich would you like to proceed with first?`
                            : `✅ رائع! أضفت ${categoryIntents.map(c => `${c.qty}x ${c.data.title[language]}`).join('، ')} إلى طلبك.\n\n📋 طلبك الكامل: ${allItemsList}\n\nبأيهم تريد البدء أولاً؟`;
                        
                        const categoryButtons = mergedQueue.map(intent => ({
                            id: `select_cat_${intent.data.id}`,
                            label: `${intent.qty}x ${intent.data.title[language]}`
                        }));
                        
                        addMessage(addedMsg, 'bot', 'button', categoryButtons);
                        
                        setBotState(prev => ({
                            ...prev,
                            categoryQueue: mergedQueue,
                            originalRequest: allItemsList
                        }));
                        return;
                    }
                    
                    // If multiple categories detected, use polite confirmation flow
                    if (categoryIntents.length > 1) {
                        const itemsList = nlpIntents.map(i => {
                            if (i.type === 'ITEM') {
                                return `${i.qty}x ${i.data.name[language]}`;
                            } else {
                                return `${i.qty}x ${i.data.title[language]}`;
                            }
                        }).join(', ');

                        // Polite acknowledgment
                        const politeMsg = language === 'en'
                            ? `✅ Perfect, sir! I found your request: ${itemsList}\n\nFor clarification, could you please tell me which type you would like for each category?\n\n📋 Which would you like to proceed with first?`
                            : `✅ ممتاز يا سيدي! وجدت طلبك: ${itemsList}\n\nللتوضيح، هل يمكنك إخباري بالنوع الذي تريده لكل فئة؟\n\n📋 بأيهم تريد البدء أولاً؟`;
                        
                        // Create buttons for each category
                        const categoryButtons = categoryIntents.map(intent => ({
                            id: `select_cat_${intent.data.id}`,
                            label: `${intent.qty}x ${intent.data.title[language]}`
                        }));

                        addMessage(politeMsg, 'bot', 'button', categoryButtons);

                        // Store the category queue for sequential processing
                        setBotState(prev => ({
                            ...prev,
                            step: 'CATEGORY_SELECTION_CONFIRM',
                            categoryQueue: categoryIntents,
                            originalRequest: itemsList,
                            itemQueue: []
                        }));
                        return;
                    }

                    // Single category or item - proceed as before with acknowledgment
                    let ackMessage = '';
                    const itemsList = nlpIntents.map(i => {
                        if (i.type === 'ITEM') {
                            return `${i.qty}x ${i.data.name[language]}`;
                        } else {
                            return `${i.qty > 0 ? i.qty + 'x ' : ''}${i.data.title[language]}`;
                        }
                    }).join(', ');

                    if (language === 'en') {
                        ackMessage = `✅ Perfect, sir! I found: ${itemsList}\n\nLet me help you add them to your cart...`;
                    } else {
                        ackMessage = `✅ ممتاز يا سيدي! وجدت: ${itemsList}\n\nدعني أساعدك في إضافتهم للسلة...`;
                    }
                    addMessage(ackMessage, 'bot');

                    const first = nlpIntents[0];
                    const rest = nlpIntents.slice(1);
                    setBotState(prev => ({ ...prev, itemQueue: rest }));
                    
                    setTimeout(() => {
                        processNextQueueItem([first, ...rest], t, language);
                    }, 600);
                    return;
                }
            }
        }

        // --- HELPER: Ask Confirmation ---
        const askConfirmation = (qty, t, lang) => {
            const finalQty = qty > 0 ? qty : 1;
            const updatedItem = { ...currentItem, qty: finalQty };

            setBotState(prev => ({ ...prev, step: 'ITEM_CONFIRM', currentItem: updatedItem }));

            addMessage(`${t.confirmAdd}\n*${updatedItem.name[lang]}* x${finalQty} ${updatedItem.selectedPref ? `(${updatedItem.selectedPref})` : ''}`, 'bot', 'button', [
                { id: 'confirm_yes', label: t.yes },
                { id: 'confirm_no', label: t.no }
            ]);
        }

        // Helper: Show Receipt
        const showReceipt = (currentCart, lang, payMethod) => {
            // Generate Receipt Logic
            const grouped = {};
            currentCart.forEach(item => {
                const key = `${item.id}_${item.selectedPref || ''}`;
                if (!grouped[key]) {
                    grouped[key] = { ...item, qty: 0 };
                }
                grouped[key].qty += 1;
            });

            let receiptText = `${t.orderSummary}:\n\n`;
            let total = 0;
            let index = 1;

            Object.values(grouped).forEach(g => {
                const lineTotal = g.price * g.qty;
                total += lineTotal;
                const prefText = g.selectedPref ? `(${g.selectedPref})` : '';

                receiptText += `${index}. ${g.name[lang]} ${prefText} x${g.qty} - ${lineTotal}\n`;
                index++;
            });

            receiptText += `\n💰 ${t.total}: ${total}\n💳 ${payMethod}`;

            addMessage(receiptText, 'bot', 'button', [
                { id: 'do_confirm', label: t.confirmOrderButton },
                { id: 'do_cancel', label: t.cancelOrder }
            ]);
        }

        // Global Reset
        if (regexMatch(text, 'hi') || regexMatch(text, 'start') || regexMatch(text, 'restart')) {
            setBotState({ ...INITIAL_STATE, step: 'LANGUAGE' });
            addMessage(translations.en.welcome, 'bot', 'button', [
                { id: 'lang_en', label: 'English' },
                { id: 'lang_ar', label: 'العربية' }
            ]);
            return;
        }
        
        // Helper: Check if question is irrelevant/unsupported
        const isIrrelevantQuestion = (text) => {
            const cleanText = text.toLowerCase().trim();
            
            // Comprehensive irrelevant patterns
            const irrelevantPatterns = [
                // Weather & Time
                /what.*weather/i, /how.*weather/i, /weather.*today/i, /is it raining/i,
                /what.*time/i, /current time/i, /what.*date/i,
                
                // Personal questions
                /who.*you/i, /what.*your name/i, /how.*are you/i, /are you.*bot/i,
                /who.*made you/i, /who.*created/i, /where.*from/i,
                
                // Entertainment
                /tell.*joke/i, /sing.*song/i, /play.*game/i, /tell.*story/i,
                /dance/i, /funny/i,
                
                // General knowledge
                /who.*president/i, /capital of/i, /who won/i, /calculate/i,
                /translate/i, /convert/i, /solve/i,
                
                // Location & directions  
                /where.*located/i, /how to get/i, /directions/i, /google maps/i,
                /distance/i, /how far/i,
                
                // Technical/Other
                /can you help me with/i, /i need help with/i, /homework/i,
                /write.*code/i, /fix.*computer/i, /wifi password/i,
                
                // Questions not about food/restaurant
                /buy.*ticket/i, /book.*hotel/i, /reserve.*car/i,
                
                // Arabic patterns
                /كيف.*الطقس/i, /كيف.*الجو/i, /ما.*الوقت/i,
                /من.*الرئيس/i, /من.*أنت/i, /ما.*اسمك/i,
                /كيف.*حالك/i, /أخبرني.*نكتة/i, /غني/i,
                /ارقص/i, /العب/i, /ساعدني في/i,
                
                // Nonsense or very short queries
                /^(what|why|how|when|where)$/i,
                /^(hello|hi|hey|sup)$/i,
                /^[a-z]{1,2}$/i
            ];
            
            // Check patterns
            if (irrelevantPatterns.some(pattern => pattern.test(cleanText))) {
                return true;
            }
            
            // Check if question mark exists but no food-related keywords
            if (cleanText.includes('?')) {
                const foodKeywords = [
                    'menu', 'food', 'order', 'burger', 'drink', 'coffee', 'tea', 
                    'sandwich', 'wrap', 'meal', 'price', 'cost', 'delivery',
                    'branch', 'location', 'phone', 'call', 'pay', 'payment',
                    'طعام', 'طلب', 'قائمة', 'برجر', 'قهوة', 'شاي',
                    'سندويتش', 'لفة', 'وجبة', 'سعر', 'توصيل',
                    'فرع', 'هاتف', 'دفع'
                ];
                
                const hasFoodContext = foodKeywords.some(keyword => cleanText.includes(keyword));
                if (!hasFoodContext && cleanText.length > 10) {
                    return true;
                }
            }
            
            return false;
        };

        // --- PENDING ORDER DECISION (when user tries to order something else while having pending categories) ---
        if (step === 'PENDING_ORDER_DECISION') {
            const { categoryQueue, completedCategories, pendingNewIntents } = botState;
            
            if (text === 'continue_original') {
                // User wants to continue with the original order
                const nextCategory = categoryQueue.find(c => !completedCategories.includes(c.data.id));
                
                if (nextCategory) {
                    setBotState(prev => ({
                        ...prev,
                        step: 'PROCESSING_CATEGORY',
                        currentCategory: nextCategory.data.id,
                        pendingResolution: { qty: nextCategory.qty, catId: nextCategory.data.id },
                        pendingNewIntents: null
                    }));
                    
                    const continueMsg = language === 'en'
                        ? `✅ Good choice, sir! Let's continue with ${nextCategory.data.title[language]}.\n\nShowing you the ${nextCategory.data.title[language]} menu...`
                        : `✅ اختيار جيد يا سيدي! لنتابع مع ${nextCategory.data.title[language]}.\n\nإظهار قائمة ${nextCategory.data.title[language]}...`;
                    
                    addMessage(continueMsg, 'bot');
                    
                    setTimeout(() => {
                        showItemsForCategory(nextCategory.data.id, language, t, 400);
                    }, 600);
                }
                return;
            }
            
            if (text === 'add_to_queue') {
                // Add new items to the existing queue
                const combinedMsg = language === 'en'
                    ? `✅ Perfect! I'll add the new items to your order queue.`
                    : `✅ ممتاز! سأضيف العناصر الجديدة إلى قائمة طلبك.`;
                
                addMessage(combinedMsg, 'bot');
                
                const first = pendingNewIntents[0];
                const rest = pendingNewIntents.slice(1);
                setBotState(prev => ({ 
                    ...prev, 
                    itemQueue: rest,
                    step: 'QUEUE_PROCESSING',
                    pendingNewIntents: null
                }));
                
                setTimeout(() => {
                    processNextQueueItem([first, ...rest], t, language);
                }, 600);
                return;
            }
            
            if (text === 'replace_order') {
                // Replace the current order with new one
                const replaceMsg = language === 'en'
                    ? `✅ Okay, I'll cancel the previous pending items and start fresh with your new order.`
                    : `✅ حسناً، سألغي العناصر المعلقة السابقة وأبدأ من جديد بطلبك الجديد.`;
                
                addMessage(replaceMsg, 'bot');
                
                // Clear category queue and process new intents
                const categoryIntents = pendingNewIntents.filter(i => i.type === 'CATEGORY' && i.qty > 0);
                
                if (categoryIntents.length > 1) {
                    const itemsList = pendingNewIntents.map(i => {
                        if (i.type === 'ITEM') {
                            return `${i.qty}x ${i.data.name[language]}`;
                        } else {
                            return `${i.qty}x ${i.data.title[language]}`;
                        }
                    }).join(', ');
                    
                    const politeMsg = language === 'en'
                        ? `✅ Perfect, sir! I found your request: ${itemsList}\n\nFor clarification, could you please tell me which type you would like for each category?\n\n📋 Which would you like to proceed with first?`
                        : `✅ ممتاز يا سيدي! وجدت طلبك: ${itemsList}\n\nللتوضيح، هل يمكنك إخباري بالنوع الذي تريده لكل فئة؟\n\n📋 بأيهم تريد البدء أولاً؟`;
                    
                    const categoryButtons = categoryIntents.map(intent => ({
                        id: `select_cat_${intent.data.id}`,
                        label: `${intent.qty}x ${intent.data.title[language]}`
                    }));

                    addMessage(politeMsg, 'bot', 'button', categoryButtons);

                    setBotState(prev => ({
                        ...prev,
                        step: 'CATEGORY_SELECTION_CONFIRM',
                        categoryQueue: categoryIntents,
                        completedCategories: [],
                        originalRequest: itemsList,
                        itemQueue: [],
                        pendingNewIntents: null
                    }));
                } else {
                    const first = pendingNewIntents[0];
                    const rest = pendingNewIntents.slice(1);
                    setBotState(prev => ({ 
                        ...prev, 
                        itemQueue: rest,
                        categoryQueue: [],
                        completedCategories: [],
                        step: 'QUEUE_PROCESSING',
                        pendingNewIntents: null
                    }));
                    
                    setTimeout(() => {
                        processNextQueueItem([first, ...rest], t, language);
                    }, 600);
                }
                return;
            }
        }

        if (step === 'LANGUAGE') {
            let lang = null;
            if (regexMatch(text, 'english') || text === 'lang_en') lang = 'en';
            if (regexMatch(text, 'arabic') || text.includes('العربية') || text === 'lang_ar') lang = 'ar';

            if (lang) {
                const nextT = translations[lang];
                setBotState(prev => ({ ...prev, language: lang, step: 'HOME' }));
                
                const greeting = lang === 'en'
                    ? `**Welcome!** You've selected English.\n\n**How to order:**\n• Type naturally: "2 coffees" or "beef burger"\n• Use buttons for easy navigation\n• I'll guide you step by step!`
                    : `**أهلاً بك!** اخترت العربية.\n\n**كيفية الطلب:**\n• اكتب بشكل طبيعي: "قهوتين" أو "برجر لحم"\n• استخدم الأزرار للتصفح السهل\n• سأرشدك خطوة بخطوة!`;
                
                addMessage(greeting, 'bot');
                setTimeout(() => {
                    addMessage(nextT.mainMenu, 'bot', 'button', [
                        { id: 'btn_branches', label: nextT.branches },
                        { id: 'btn_menu', label: nextT.menu }
                    ]);
                }, 800);
            } else {
                addMessage("Please select a valid language.", 'bot');
            }
            return;
        }

        // --- CATEGORY SELECTION CONFIRMATION (for multi-category orders) ---
        if (step === 'CATEGORY_SELECTION_CONFIRM') {
            const { categoryQueue } = botState;
            
            // Check if user is typing the same request again (intelligent duplicate detection)
            const nlpIntents = parseNaturalLanguageOrder(text, language);
            if (nlpIntents && nlpIntents.length > 0) {
                // Check if all detected intents already exist in categoryQueue
                const allAlreadyInQueue = nlpIntents.every(newIntent => {
                    return categoryQueue.some(existing => {
                        if (newIntent.type === 'ITEM' && existing.type === 'ITEM') {
                            return existing.data.id === newIntent.data.id;
                        } else if (newIntent.type === 'CATEGORY' && existing.type === 'CATEGORY') {
                            return existing.data.id === newIntent.data.id;
                        }
                        return false;
                    });
                });
                
                // If user is repeating what they already said, help them select it
                if (allAlreadyInQueue && nlpIntents.length === 1) {
                    const repeatedIntent = nlpIntents[0];
                    const matchingQueueItem = categoryQueue.find(q => 
                        (repeatedIntent.type === 'ITEM' && q.type === 'ITEM' && q.data.id === repeatedIntent.data.id) ||
                        (repeatedIntent.type === 'CATEGORY' && q.type === 'CATEGORY' && q.data.id === repeatedIntent.data.id)
                    );
                    
                    if (matchingQueueItem) {
                        // Automatically proceed with this category as if they clicked the button
                        text = `select_cat_${matchingQueueItem.data.id}`;
                    }
                }
            }
            
            // Check if user selected a category to start with
            if (text.startsWith('select_cat_')) {
                const selectedCatId = text.replace('select_cat_', '');
                const selectedIntent = categoryQueue.find(c => c.data.id === selectedCatId);
                
                if (selectedIntent) {
                    // Move selected category to front of queue
                    const reorderedQueue = [
                        selectedIntent,
                        ...categoryQueue.filter(c => c.data.id !== selectedCatId)
                    ];
                    
                    setBotState(prev => ({
                        ...prev,
                        categoryQueue: reorderedQueue,
                        step: 'PROCESSING_CATEGORY',
                        currentCategory: selectedIntent.data.id,
                        pendingResolution: { qty: selectedIntent.qty, catId: selectedIntent.data.id }
                    }));
                    
                    const confirmMsg = language === 'en'
                        ? `✅ Perfect! Let's start with ${selectedIntent.data.title[language]}.\n\nShowing you the ${selectedIntent.data.title[language]} menu...`
                        : `✅ ممتاز! لنبدأ بـ ${selectedIntent.data.title[language]}.\n\nإظهار قائمة ${selectedIntent.data.title[language]}...`;
                    
                    addMessage(confirmMsg, 'bot');
                    
                    // Show items for this category
                    setTimeout(() => {
                        showItemsForCategory(selectedIntent.data.id, language, t, 400);
                    }, 600);
                    
                    return;
                }
            }
        }

        // --- PROCESSING CATEGORY (after completing one category in multi-category order) ---
        if (step === 'CATEGORY_COMPLETE_CONFIRM') {
            const { categoryQueue, completedCategories, originalRequest } = botState;
            
            if (text === 'proceed_next_category' || text === t.yes || regexMatch(text, 'yes')) {
                const nextCategory = categoryQueue.find(c => !completedCategories.includes(c.data.id));
                
                if (nextCategory) {
                    setBotState(prev => ({
                        ...prev,
                        step: 'PROCESSING_CATEGORY',
                        currentCategory: nextCategory.data.id,
                        pendingResolution: { qty: nextCategory.qty, catId: nextCategory.data.id }
                    }));
                    
                    const nextMsg = language === 'en'
                        ? `✅ Excellent! Now let's proceed with ${nextCategory.data.title[language]}.\n\nShowing you the ${nextCategory.data.title[language]} menu...`
                        : `✅ ممتاز! الآن لنتابع مع ${nextCategory.data.title[language]}.\n\nإظهار قائمة ${nextCategory.data.title[language]}...`;
                    
                    addMessage(nextMsg, 'bot');
                    
                    setTimeout(() => {
                        showItemsForCategory(nextCategory.data.id, language, t, 400);
                    }, 600);
                    
                    return;
                }
            }
            
            if (text === 'order_more_items' || regexMatch(text, 'order more')) {
                setBotState(prev => ({ ...prev, step: 'CATEGORIES', categoryQueue: [], completedCategories: [] }));
                showCategories(language);
                return;
            }
            
            if (text === 'modify_order' || regexMatch(text, 'modify')) {
                setBotState(prev => ({ ...prev, step: 'MODIFY_DECISION' }));
                addMessage(t.cancelConfirmation, 'bot', 'button', [
                    { id: 'cancel_all', label: t.cancelAll },
                    { id: 'cancel_item', label: t.cancelItem },
                    { id: 'keep_order', label: t.keepOrder }
                ]);
                return;
            }
        }

        if (!language) return;

        // Home
        if (step === 'HOME') {
            // Note: NLP and Category naming are handled by Global NLP check above.
            // This block handles other Home-specific logic if any.
        }

        // Branch List
        if (step === 'BRANCHES_LIST') {
            const branchId = text.replace('br_', '');
            const branch = branchInfo.branches.find(b => b.id === branchId || b.name === text);

            if (branch) {
                setBotState(prev => ({ ...prev, step: 'BRANCH_DETAIL' }));
                const detailText = `📍 *${branch.name}*\n🏠 ${branch.address}\n📞 ${branch.phone}`;
                addMessage(detailText, 'bot', 'button', [
                    { id: 'call_now', label: `${t.call} (${branch.phone})` },
                    { id: 'back_home', label: t.back },
                    { id: 'btn_menu', label: t.menu }
                ]);
                return;
            }
        }

        if (text === 'back_home' || text === t.back) {
            setBotState(prev => ({ ...prev, step: 'HOME' }));
            addMessage(t.mainMenu, 'bot', 'button', [
                { id: 'btn_branches', label: t.branches },
                { id: 'btn_menu', label: t.menu }
            ]);
            return;
        }

        if (step === 'BRANCH_DETAIL') {
            if (text === 'call_now') {
                addMessage("📞 Ringing...", 'bot');
                return;
            }
        }

        // Categories Selection
        if (step === 'CATEGORIES') {
            const category = menu.categories.find(c => c.title[language] === text || c.id === text);
            if (category) {
                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: category.id }));
                addMessage(`*${category.title[language]}*`, 'bot');

                // Show items
                const items = menu.items[category.id] || [];
                items.forEach((item, index) => {
                    setTimeout(() => {
                        addMessage(
                            `*${item.name[language]}*\n💰 ${item.price}`,
                            'bot',
                            'image',
                            [{ id: `add_${item.id}`, label: '➕ Add' }],
                            item.image
                        );
                    }, index * 200);
                });

                setTimeout(() => {
                    addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
                }, items.length * 200 + 400);
                return;
            }
            if (text === 'back_cats' || text === t.back) {
                setBotState(prev => ({ ...prev, step: 'HOME' }));
                addMessage(t.mainMenu, 'bot', 'button', [
                    { id: 'btn_branches', label: t.branches },
                    { id: 'btn_menu', label: t.menu }
                ]);
                return;
            }

            // Handle Smart Category Search in CATEGORIES step
            const matchingCat = menu.categories.find(c =>
                text.toLowerCase().includes(c.title.en.toLowerCase()) ||
                text.includes(c.title.ar)
            );
            if (matchingCat) {
                setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentCategory: matchingCat.id }));
                addMessage(`*${matchingCat.title[language]}*`, 'bot');
                const items = menu.items[matchingCat.id] || [];
                items.forEach((item, index) => {
                    setTimeout(() => {
                        addMessage(
                            `*${item.name[language]}*\n💰 ${item.price}`,
                            'bot',
                            'image',
                            [{ id: `add_${item.id}`, label: '➕ Add' }],
                            item.image
                        );
                    }, index * 200);
                });
                setTimeout(() => {
                    addMessage(t.back, 'bot', 'button', [{ id: 'back_cats', label: t.back }]);
                }, items.length * 200 + 400);
                return;
            }
        }

        // Item Selection & Fallback Handling
        if (['CATEGORIES', 'ITEMS_LIST', 'HOME', 'BRANCH_DETAIL', 'BRANCHES_LIST'].includes(step) || step.includes('MENU')) {
            // Primarily handle button clicks "add_ID" here
            // Text search is ALREADY handled by Global NLP at the top of processInput
            if (text.startsWith('add_')) {
                const itemId = text.replace('add_', '');
                let selectedItem = null;
                Object.keys(menu.items).forEach(catId => {
                    if (selectedItem) return;
                    const match = menu.items[catId].find(i => i.id === itemId);
                    if (match) selectedItem = match;
                });

                if (selectedItem) {
                    // Always use standard flow - ask quantity even if pendingResolution exists
                    // pendingResolution only tracks which category is being processed, not the quantity
                    const addingMsg = language === 'en'
                        ? `Adding ${selectedItem.name[language]}...`
                        : `إضافة ${selectedItem.name[language]}...`;
                    addMessage(addingMsg, 'bot');
                    setTimeout(() => {
                        initiateItemAdd(selectedItem, t, language);
                    }, 300);
                    return;
                }
            }
        }

        if (step === 'ITEMS_LIST') {
            if (text === 'back_cats') {
                showCategories(language);
                return;
            }
        }

        // Item Pref
        if (step === 'ITEM_PREF') {
            const pref = (regexMatch(text, 'spicy') || text === t.spicy) ? t.spicy : t.nonSpicy;
            const updatedItem = { ...currentItem, selectedPref: pref || t.nonSpicy };

            if (updatedItem.qty && updatedItem.qty > 1) {
                askConfirmation(updatedItem.qty, t, language);
            } else {
                // Ask Quantity
                setBotState(prev => ({ ...prev, step: 'ITEM_QTY', currentItem: updatedItem }));
                addMessage(t.howMany, 'bot', 'button', [
                    { id: 'qty_1', label: '1' },
                    { id: 'qty_2', label: '2' },
                    { id: 'qty_3', label: '3' },
                    { id: 'qty_4', label: '4' },
                    { id: 'qty_5', label: '5' },
                    { id: 'qty_6', label: '6' },
                    { id: 'qty_7', label: '7' },
                    { id: 'qty_8', label: '8' },
                    { id: 'qty_9', label: '9' },
                    { id: 'qty_10', label: '10' }
                ]);
            }
            return;
        }

        // Quantity Selection
        if (step === 'ITEM_QTY') {
            let qty = 1;
            if (text.startsWith('qty_')) {
                qty = parseInt(text.replace('qty_', ''));
            } else {
                const cleanText = parseArabicNumbers(text);
                const parsed = parseInt(cleanText);
                if (!isNaN(parsed) && parsed > 0) qty = parsed;
            }

            const qtyConfirmMsg = language === 'en'
                ? `✅ You want ${qty}x ${currentItem.name[language]}`
                : `✅ تريد ${qty}x ${currentItem.name[language]}`;
            addMessage(qtyConfirmMsg, 'bot');
            
            askConfirmation(qty, t, language);
            return;
        }

        // Confirm Add (Actual logic)
        if (step === 'ITEM_CONFIRM') {
            if (text === 'confirm_yes' || text === t.yes || regexMatch(text, 'yes')) {
                const finalQty = currentItem.qty;
                const newItems = Array(finalQty).fill(currentItem);
                const newCart = [...cart, ...newItems]; // Actual Addition

                const total = newCart.reduce((acc, i) => acc + i.price, 0);

                // CHECK QUEUE AND CATEGORY QUEUE
                const hasMoreItems = itemQueue.length > 0;
                const { categoryQueue, completedCategories, currentCategory } = botState;

                setBotState(prev => ({
                    ...prev,
                    cart: newCart,
                    step: hasMoreItems ? 'QUEUE_PROCESSING' : 'CART_DECISION',
                    currentItem: null
                }));

                // Running Cart Summary
                const grouped = {};
                newCart.forEach(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    if (!grouped[key]) grouped[key] = { ...item, qty: 0 };
                    grouped[key].qty += 1;
                });

                let cartListStr = "";
                Object.values(grouped).forEach(g => {
                    const prefText = g.selectedPref ? `(${g.selectedPref})` : '';
                    cartListStr += `• ${g.qty}x ${g.name[language]} ${prefText}\n`;
                });

                const currentItemDetail = `${finalQty}x ${currentItem.name[language]} ${currentItem.selectedPref ? `(${currentItem.selectedPref})` : ''} - ${(currentItem.price * finalQty).toFixed(2)} SR`;

                const msg = language === 'en'
                    ? `✅ **Added to cart:**\n${currentItemDetail}\n\n🛒 **Your Cart (${newCart.length} items):**\n${cartListStr}\n💰 **Total:** ${total.toFixed(2)} SR`
                    : `✅ **تم الإضافة للسلة:**\n${currentItemDetail}\n\n🛒 **سلتك (${newCart.length} عنصر):**\n${cartListStr}\n💰 **الإجمالي:** ${total.toFixed(2)} ريال`;

                addMessage(msg, 'bot');

                // Check if we're processing a category queue
                if (!hasMoreItems && categoryQueue && categoryQueue.length > 0 && currentCategory) {
                    const currentCatId = currentCategory;
                    const currentCategoryData = menu.categories.find(c => c.id === currentCatId);
                    const remainingCategories = categoryQueue.filter(c => !completedCategories.includes(c.data.id) && c.data.id !== currentCatId);
                    
                    if (remainingCategories.length > 0) {
                        const nextCategory = remainingCategories[0];
                        
                        // Update completed categories
                        setBotState(prev => ({
                            ...prev,
                            completedCategories: [...(prev.completedCategories || []), currentCatId],
                            step: 'CATEGORY_COMPLETE_CONFIRM'
                        }));
                        
                        setTimeout(() => {
                            // Build completed and remaining lists
                            const completedList = categoryQueue
                                .filter(c => [...completedCategories, currentCatId].includes(c.data.id))
                                .map(c => `${c.qty}x ${c.data.title[language]}`);
                            
                            const remainingList = remainingCategories
                                .map(c => `${c.qty}x ${c.data.title[language]}`);
                            
                            const politeConfirmMsg = language === 'en'
                                ? `✅ Excellent, sir! Your ${currentCategoryData?.title[language]} order is now complete.\n\n` +
                                  `📊 **Progress Update:**\n` +
                                  `✅ Completed: ${completedList.join(', ')}\n` +
                                  `⏳ Remaining: ${remainingList.join(', ')}\n\n` +
                                  `Should we continue with ${nextCategory.data.title[language]} or would you like a different approach?`
                                : `✅ ممتاز يا سيدي! طلب ${currentCategoryData?.title[language]} اكتمل الآن.\n\n` +
                                  `📊 **تحديث التقدم:**\n` +
                                  `✅ مكتمل: ${completedList.join('، ')}\n` +
                                  `⏳ متبقي: ${remainingList.join('، ')}\n\n` +
                                  `هل نتابع مع ${nextCategory.data.title[language]} أو تريد طريقة مختلفة؟`;
                            
                            addMessage(politeConfirmMsg, 'bot', 'button', [
                                { id: 'proceed_next_category', label: language === 'en' ? `✅ Continue with ${nextCategory.data.title[language]}` : `✅ تابع مع ${nextCategory.data.title[language]}` },
                                { id: 'order_more_items', label: language === 'en' ? '🛒 Order Something Else' : '🛒 طلب شيء آخر' },
                                { id: 'modify_order', label: language === 'en' ? '✏️ Modify Order' : '✏️ تعديل الطلب' }
                            ]);
                        }, 1000);
                        return;
                    } else {
                        // All categories complete
                        setBotState(prev => ({
                            ...prev,
                            completedCategories: [...(prev.completedCategories || []), currentCatId],
                            categoryQueue: [],
                            currentCategory: null,
                            step: 'CART_DECISION'
                        }));
                        
                        setTimeout(() => {
                            const allCompleteMsg = language === 'en'
                                ? `✅ Perfect, sir! All categories from your request have been completed.\n\nYour order is ready for review.`
                                : `✅ ممتاز يا سيدي! جميع الفئات من طلبك قد اكتملت.\n\nطلبك جاهز للمراجعة.`;
                            
                            addMessage(allCompleteMsg, 'bot');
                            
                            setTimeout(() => {
                                addMessage(t.orderMore, 'bot', 'button', [
                                    { id: 'order_more', label: t.yesOrderMore },
                                    { id: 'finish_order', label: t.finishOrder }
                                ]);
                            }, 800);
                        }, 1000);
                        return;
                    }
                }

                if (hasMoreItems) {
                    setTimeout(() => {
                        const nextMsg = language === 'en' 
                            ? "Now, let's add the next item..." 
                            : "الآن، دعنا نضيف العنصر التالي...";
                        addMessage(nextMsg, 'bot');
                        processNextQueueItem(itemQueue, t, language, currentItem.name[language]);
                    }, 1200);
                } else {
                    setTimeout(() => {
                        addMessage(t.orderMore, 'bot', 'button', [
                            { id: 'order_more', label: t.yesOrderMore },
                            { id: 'finish_order', label: t.finishOrder }
                        ]);
                    }, 800);
                }
                return;
            }
            if (text === 'confirm_no' || text === t.no) {
                const hasMore = itemQueue.length > 0;
                const cancelMsg = language === 'en' 
                    ? "❌ Item not added. Let me remove it from the queue."
                    : "❌ لم يتم إضافة العنصر. سأزيله من القائمة.";
                addMessage(cancelMsg, 'bot');
                if (hasMore) {
                    setTimeout(() => {
                        processNextQueueItem(itemQueue, t, language);
                    }, 800);
                } else {
                    setBotState(prev => ({ ...prev, step: 'ITEMS_LIST', currentItem: null }));
                    showCategories(language);
                }
                return;
            }
        }

        if (step === 'QUEUE_PROCESSING') {
            // Should be handled by timeout
        }

        // Cart Decision
        if (step === 'CART_DECISION') {
            if (text === 'order_more' || regexMatch(text, 'more')) {
                showCategories(language);
                return;
            }
            if (text === 'finish_order' || regexMatch(text, 'finish') || regexMatch(text, 'confirm')) {
                setBotState(prev => ({ ...prev, step: 'PAYMENT_METHOD' }));
                addMessage(t.paymentMethod, 'bot', 'button', [
                    { id: 'pay_cash', label: t.cash },
                    { id: 'pay_online', label: t.online }
                ]);
                return;
            }
        }

        // Payment Method
        if (step === 'PAYMENT_METHOD') {
            let method = null;
            if (regexMatch(text, 'cash') || text === 'pay_cash') method = t.cash;
            if (regexMatch(text, 'online') || text === 'pay_online') method = t.online;

            if (method) {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY', paymentMethod: method }));
                showReceipt(cart, language, method);
                return;
            }
            addMessage("Please select Cash or Online.", 'bot');
            return;
        }

        // ORDER SUMMARY / MODIFY
        if (step === 'ORDER_SUMMARY') {
            if (text === 'do_confirm' || regexMatch(text, 'confirm')) {
                addMessage(`${t.receiptHeader}\n\n${t.thankYou}\n\nTerminating Session...`, 'bot');
                setBotState(prev => ({ ...INITIAL_STATE, step: 'INIT' }));
                return;
            }
            // "Cancel / Modify" Clicked
            if (text === 'do_cancel' || regexMatch(text, 'cancel') || regexMatch(text, 'modify')) {
                setBotState(prev => ({ ...prev, step: 'MODIFY_DECISION' }));
                addMessage(t.cancelConfirmation, 'bot', 'button', [
                    { id: 'cancel_all', label: t.cancelAll },
                    { id: 'cancel_item', label: t.cancelItem },
                    { id: 'keep_order', label: t.keepOrder }
                ]);
                return;
            }
        }

        // Modify Decision (Cancel All vs One)
        if (step === 'MODIFY_DECISION') {
            if (text === 'cancel_all') {
                setBotState(prev => ({ ...prev, step: 'CANCEL_CONFIRM_ALL' }));
                addMessage("⚠️ Are you sure you want to cancel everything?", 'bot', 'button', [
                    { id: 'yes_cancel_all', label: t.confirmCancel },
                    { id: 'no_keep', label: t.keepOrder }
                ]);
                return;
            }
            if (text === 'cancel_item') {
                if (cart.length === 0) {
                    addMessage(t.emptyCart, 'bot');
                    setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                    showReceipt(cart, language, botState.paymentMethod);
                    return;
                }

                // List UNIQUE items to remove
                const uniqueItems = [];
                const seen = new Set();
                cart.forEach(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueItems.push({ ...item, key });
                    }
                });

                setBotState(prev => ({ ...prev, step: 'REMOVE_ITEM_SELECT' }));
                addMessage(t.selectRemove, 'bot', 'button',
                    uniqueItems.map(i => ({
                        id: `rem_${i.key}`,
                        label: `❌ ${i.name[language]} ${i.selectedPref ? `(${i.selectedPref})` : ''}`
                    }))
                );
                return;
            }
            if (text === 'keep_order' || text === 'no_keep') {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                showReceipt(cart, language, botState.paymentMethod);
                return;
            }
        }

        // Cancel All Confirmation
        if (step === 'CANCEL_CONFIRM_ALL') {
            if (text === 'yes_cancel_all') {
                setBotState(prev => ({ ...prev, step: 'CANCEL_EXIT', cart: [] }));
                addMessage(t.cancelled, 'bot');
                return;
            }
            if (text === 'no_keep') {
                setBotState(prev => ({ ...prev, step: 'ORDER_SUMMARY' }));
                showReceipt(cart, language, botState.paymentMethod);
                return;
            }
        }

        // Remove Specific Item
        if (step === 'REMOVE_ITEM_SELECT') {
            if (text.startsWith('rem_')) {
                const keyToRemove = text.replace('rem_', '');

                const newCart = cart.filter(item => {
                    const key = `${item.id}_${item.selectedPref || ''}`;
                    return key !== keyToRemove;
                });

                setBotState(prev => ({ ...prev, cart: newCart, step: 'ORDER_SUMMARY' }));
                addMessage(t.itemRemoved, 'bot');
                setTimeout(() => {
                    if (newCart.length === 0) {
                        addMessage(t.emptyCart, 'bot');
                        showCategories(language);
                    } else {
                        showReceipt(newCart, language, botState.paymentMethod);
                    }
                }, 800);
                return;
            }
        }

        // Contextual Error Handler
        const handleUnknownInput = (currentStep, lang) => {
            const t = translations[lang] || translations['en'];
            
            // Professional unknown input response based on context
            if (currentStep === 'CATEGORIES' || currentStep === 'HOME') {
                const helpMsg = lang === 'en'
                    ? "I didn't quite understand that.\n\n**Try:**\n• Selecting a button below\n• Typing: '2 burgers' or 'coffee'\n• Or say 'menu' to see options"
                    : "لم أفهم ذلك.\n\n**جرب:**\n• اختر زر أدناه\n• اكتب: '2 برجر' أو 'قهوة'\n• أو قل 'قائمة' لرؤية الخيارات";
                
                addMessage(helpMsg, 'bot');
                setTimeout(() => showCategories(lang), 800);
            } else if (currentStep === 'ITEMS_LIST') {
                const helpMsg = lang === 'en'
                    ? "Please select an item from the menu above, or type the item name."
                    : "الرجاء اختيار عنصر من القائمة أعلاه، أو اكتب اسم العنصر.";
                addMessage(helpMsg, 'bot');
            } else if (currentStep === 'ITEM_QTY') {
                const helpMsg = lang === 'en'
                    ? "Please enter a valid quantity (e.g., 1, 2, 3) or select from the buttons."
                    : "الرجاء إدخال كمية صحيحة (مثل 1، 2، 3) أو اختر من الأزرار.";
                addMessage(helpMsg, 'bot');
            } else if (currentStep === 'BRANCHES_LIST') {
                const branchMsg = lang === 'en'
                    ? "Please select a branch from the list to view details."
                    : "الرجاء اختيار فرع من القائمة لمشاهدة التفاصيل.";
                addMessage(branchMsg, 'bot');
            } else {
                const helpMsg = lang === 'en'
                    ? "I didn't understand that. Please use the buttons provided or type 'menu' to start over."
                    : "لم أفهم ذلك. الرجاء استخدام الأزرار الموجودة أو اكتب 'قائمة' للبدء من جديد.";
                addMessage(helpMsg, 'bot');
            }
        };

        handleUnknownInput(step, language);
    };

    const showCategories = (lang) => {
        setBotState(prev => ({ ...prev, step: 'CATEGORIES' }));
        const t = translations[lang];
        
        // Professional WhatsApp-optimized category grouping (only 3 buttons)
        const categoryMsg = lang === 'en'
            ? "**Please select what you'd like to order:**\n\n• Type naturally (e.g., '2 coffees', 'beef burger')\n• Or choose a category below"
            : "**اختر ما تريد طلبه:**\n\n• اكتب بشكل طبيعي ('قهوتين'، 'برجر لحم')\n• أو اختر فئة أدناه";
        
        // Consolidated groups for WhatsApp deployment (3 buttons only)
        const categoryGroups = [
            {
                id: 'burgers_meals',
                label: lang === 'en' ? 'Burgers & Meals' : 'برجر ووجبات',
                categories: ['burgers', 'meals']
            },
            {
                id: 'sandwiches_wraps',
                label: lang === 'en' ? 'Sandwiches & Wraps' : 'سندويتشات ولفائف',
                categories: ['sandwiches', 'wraps']
            },
            {
                id: 'sides_drinks',
                label: lang === 'en' ? 'Sides, Drinks & Juices' : 'مقبلات ومشروبات',
                categories: ['sides', 'drinks', 'juices']
            }
        ];
        
        addMessage(categoryMsg, 'bot', 'button', categoryGroups.map(g => ({
            id: g.id,
            label: g.label
        })));
    }

    // Init
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            setTimeout(() => {
                if (messages.length === 0) {
                    addMessage(translations.en.welcome, 'bot', 'button', [
                        { id: 'lang_en', label: 'English' },
                        { id: 'lang_ar', label: 'العربية' }
                    ]);
                    setBotState(prev => ({ ...prev, step: 'LANGUAGE' }));
                }
            }, 1000);
        }
    }, [addMessage, messages.length]);

    return { messages, isTyping, sendMessage: handleUserMessage };
}
