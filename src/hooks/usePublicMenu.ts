import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PublicMenuItem {
    id: string;
    name_en: string;
    name_ar: string;
    price: number;
    category_id: string;
    category_name: string;
    subcategory: string | null;
    status: string;
    stock: number;
    available_meals: string[];
    cuisine_type: string;
    image_url: string | null;
    original_price?: number;
    discounted_price?: number;
    active_discount?: PublicDiscount | null;
    key: string;
}

export interface BranchInfo {
    id: string;
    name: string;
    address: string;
    manager: string;
    phone: string;
    status: string;
    operational_hours: any;
}

export interface PublicDiscount {
    id: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    start_date: string;
    end_date: string;
    target_audience: string;
    is_active: boolean;
}

export const usePublicMenu = (branchId?: string) => {
    const [branch, setBranch] = useState<BranchInfo | null>(null);
    const [categories, setCategories] = useState<{ id: string, name_en: string }[]>([]);
    const [items, setItems] = useState<PublicMenuItem[]>([]);
    const [discounts, setDiscounts] = useState<PublicDiscount[]>([]);
    const [reviewStats, setReviewStats] = useState({ avgRating: '0.0', count: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Categories
            const { data: catData } = await supabase.from('menu_categories').select('id, name_en').order('name_en');
            const categoryMap = (catData || []).reduce((acc: any, c) => ({ ...acc, [c.id]: c.name_en }), {});
            setCategories(catData || []);

            // 2. Fetch Branches (default to first if no ID)
            const branchQuery = supabase.from('branches').select('*');
            if (branchId) branchQuery.eq('id', branchId);
            const { data: bData } = await branchQuery.limit(1).maybeSingle();
            setBranch(bData);

            if (bData) {
                // 3. Fetch Discounts for this branch
                const now = new Date().toISOString();
                const { data: dData } = await supabase
                    .from('discounts')
                    .select('*')
                    .eq('branch_id', bData.id)
                    .eq('is_active', true)
                    .lte('start_date', now)
                    .gte('end_date', now);

                const activeDiscounts = (dData || []) as PublicDiscount[];
                setDiscounts(activeDiscounts);

                // 4. Fetch Items for this branch
                const { data: iData } = await supabase
                    .from('menu_items')
                    .select('*')
                    .eq('branch_id', bData.id);

                const formattedItems: PublicMenuItem[] = (iData || []).map(item => {
                    // Check if any "ALL_USERS" discount applies
                    // We'll prioritize the best discount for now
                    let bestPrice = item.price;
                    let appliedDiscount: PublicDiscount | null = null;

                    activeDiscounts.forEach(d => {
                        if (d.target_audience === 'ALL_USERS') {
                            let applies = false;
                            if (d.description === 'All Menu Items') {
                                applies = true;
                            } else if (d.description.includes(item.key) || d.description.includes(item.name_en)) {
                                // Fallback check for item key/name in description string
                                applies = true;
                            }

                            if (applies) {
                                const newPrice = d.type === 'PERCENTAGE'
                                    ? item.price * (1 - d.value / 100)
                                    : Math.max(0, item.price - d.value);

                                if (newPrice < bestPrice) {
                                    bestPrice = Number(newPrice.toFixed(2));
                                    appliedDiscount = d;
                                }
                            }
                        }
                    });

                    return {
                        ...item,
                        category_name: categoryMap[item.category_id] || 'General',
                        original_price: item.price,
                        discounted_price: Number(bestPrice.toFixed(2)),
                        active_discount: appliedDiscount
                    };
                });
                setItems(formattedItems);

                // 5. Fetch Review Stats
                const { data: revData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('branch_id', bData.id)
                    .eq('status', 'APPROVED');

                if (revData && revData.length > 0) {
                    const avg = (revData.reduce((acc, r) => acc + r.rating, 0) / revData.length).toFixed(1);
                    setReviewStats({ avgRating: avg, count: revData.length });
                } else {
                    setReviewStats({ avgRating: '0.0', count: 0 });
                }
            }
        } catch (err) {
            console.error('Failed to fetch public menu:', err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchData();

        // Real-time updates for items, branches, discounts, and reviews
        const channel = supabase
            .channel('public-menu-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return { branch, categories, items, discounts, reviewStats, loading, refresh: fetchData };
};
