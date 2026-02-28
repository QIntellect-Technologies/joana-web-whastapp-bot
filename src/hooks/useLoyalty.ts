import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LoyaltyRule {
    id: string;
    branch_id: string;
    name: string;
    description: string;
    type: 'EARN_RULE' | 'REDEEM_RULE' | 'TIER_RULE';
    condition_type: 'SPEND_AMOUNT' | 'ORDER_COUNT';
    condition_value: number;
    reward_type: 'POINTS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';
    reward_value: number;
    target_audience: string;
    is_active: boolean;
    start_date?: string;
    end_date?: string;
}

interface DiscountCampaign {
    id: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    branch_id: string;
}

export const useLoyalty = (branchId?: string) => {
    const [rules, setRules] = useState<LoyaltyRule[]>([]);
    const [discounts, setDiscounts] = useState<DiscountCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!branchId) return;

        const fetchData = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Loyalty Rules
            const { data: rulesData } = await supabase
                .from('loyalty_rules')
                .select('*')
                .eq('is_active', true)
                .or(`branch_id.is.null,branch_id.eq.${branchId}`);

            // Filter by Date
            const activeRules = (rulesData || []).filter((r: LoyaltyRule) => {
                if (r.start_date && r.start_date > today) return false;
                if (r.end_date && r.end_date < today) return false;
                return true;
            });
            setRules(activeRules);

            // 2. Fetch Discount Campaigns (Promotions)
            const { data: discountData } = await supabase
                .from('discounts')
                .select('*')
                .eq('is_active', true)
                .or(`branch_id.is.null,branch_id.eq.${branchId}`)
                .lte('start_date', today)
                .gte('end_date', today);

            setDiscounts(discountData || []);
            setLoading(false);
        };

        fetchData();

        // Realtime Subscription (Simplified for rules, ideally should cover discounts too)
        const channel = supabase
            .channel('public-loyalty-rules')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_rules' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [branchId]);

    // Calculate Points to be Earned for a given cart total
    const calculatePotentialPoints = (totalAmount: number) => {
        const earnRules = rules.filter(r => r.type === 'EARN_RULE' && r.condition_type === 'SPEND_AMOUNT');
        let points = 0;

        earnRules.forEach(rule => {
            if (totalAmount >= rule.condition_value) {
                const multiplier = Math.floor(totalAmount / rule.condition_value);
                if (multiplier > 0 && rule.reward_type === 'POINTS') {
                    points += multiplier * rule.reward_value;
                }
            }
        });

        return points;
    };

    // Get Active Deals for Display (Merged Rules + Campaigns)
    const activeDeals = [
        ...rules.map(rule => {
            let icon = '🎁';
            let gradient = 'from-pink-500/20 to-rose-500/20';
            let border = 'border-pink-200/50';
            let desc = rule.description;

            if (!desc) {
                if (rule.type === 'EARN_RULE') {
                    const condition = rule.condition_type === 'SPEND_AMOUNT' ? `$${rule.condition_value}` : `${rule.condition_value} orders`;
                    let reward = '';
                    if (rule.reward_type === 'POINTS') reward = `${rule.reward_value} pts`;
                    else if (rule.reward_type === 'DISCOUNT_PERCENT') reward = `${rule.reward_value}% OFF`;
                    else if (rule.reward_type === 'DISCOUNT_FIXED') reward = `$${rule.reward_value} OFF`;

                    desc = `Spend ${condition} to get ${reward}`;
                } else {
                    desc = 'Special Offer';
                }
            }

            if (rule.type === 'EARN_RULE') {
                icon = '💎';
                gradient = 'from-emerald-500/20 to-teal-500/20';
                border = 'border-emerald-200/50';
            } else if (rule.reward_type === 'DISCOUNT_PERCENT') {
                icon = '🏷️';
                gradient = 'from-blue-500/20 to-indigo-500/20';
                border = 'border-blue-200/50';
            }

            return {
                id: rule.id,
                title: rule.name,
                desc,
                icon,
                gradient,
                border
            };
        }),
        ...discounts.map(d => ({
            id: d.id,
            title: d.name,
            desc: d.description || `${d.value}${d.type === 'PERCENTAGE' ? '%' : '$'} OFF`,
            icon: '🔥',
            gradient: 'from-orange-500/20 to-red-500/20',
            border: 'border-orange-200/50'
        }))
    ];

    const getCustomerPoints = async (phone: string) => {
        const { data } = await supabase
            .from('customers')
            .select('loyalty_points, loyalty_tier')
            .eq('phone', phone)
            .maybeSingle();
        return data || { loyalty_points: 0, loyalty_tier: 'Bronze' };
    };

    // Calculate Max Redemption
    const calculateRedemption = (userPoints: number, cartTotal: number) => {
        const redeemRule = rules.find(r => r.type === 'REDEEM_RULE' && r.is_active);

        if (!redeemRule || userPoints < redeemRule.condition_value) {
            return { discountAmount: 0, pointsCost: 0, ruleId: null };
        }

        let discountAmount = 0;
        let pointsCost = 0;

        if (redeemRule.reward_type === 'DISCOUNT_FIXED') {
            // e.g. 100 Points = $10
            const unitCost = redeemRule.condition_value;
            const unitReward = redeemRule.reward_value;

            const maxUnits = Math.floor(userPoints / unitCost);
            // Cap units so we don't exceed cart total
            const neededUnits = Math.ceil(cartTotal / unitReward);
            const unitsToUse = Math.min(maxUnits, neededUnits);

            discountAmount = unitsToUse * unitReward;
            // Cap discount exactly to cart total if slightly over (though units check helps)
            if (discountAmount > cartTotal) discountAmount = cartTotal;

            pointsCost = unitsToUse * unitCost;

        } else if (redeemRule.reward_type === 'DISCOUNT_PERCENT') {
            // e.g. 500 Points = 10% Off
            discountAmount = (cartTotal * redeemRule.reward_value) / 100;
            pointsCost = redeemRule.condition_value;
        }

        return { discountAmount, pointsCost, ruleId: redeemRule.id };
    };
    // Calculate Discounts from EARN_RULE (Auto-Apply)
    const calculateApplicableDiscounts = (totalAmount: number) => {
        const discountRules = rules.filter(r => r.type === 'EARN_RULE' && r.condition_type === 'SPEND_AMOUNT' && (r.reward_type === 'DISCOUNT_PERCENT' || r.reward_type === 'DISCOUNT_FIXED'));

        // Find best matching rule (logic: highest reward value? or accumulation? Simplified to highest matching threshold for now)
        // Actually, usually "Spend 100 get 10% off" implies if you spend 200 you get... 10% off still? Or 20%? 
        // Standard is: Threshold met -> Apply Discount. (Not cumulative usually for %. Fixed amount maybe).
        // Let's take the highest condition_value met.

        let applicableRule: LoyaltyRule | null = null;
        let highestThreshold = 0;

        discountRules.forEach(r => {
            if (totalAmount >= r.condition_value && r.condition_value > highestThreshold) {
                highestThreshold = r.condition_value;
                applicableRule = r;
            }
        });

        if (!applicableRule) return null;

        return {
            type: (applicableRule as LoyaltyRule).reward_type === 'DISCOUNT_PERCENT' ? 'PERCENTAGE' : 'FIXED',
            value: (applicableRule as LoyaltyRule).reward_value,
            name: (applicableRule as LoyaltyRule).name
        };
    };

    return {
        rules,
        loading,
        calculatePotentialPoints,
        calculateRedemption,
        calculateApplicableDiscounts,
        activeDeals,
        getCustomerPoints
    };

};
