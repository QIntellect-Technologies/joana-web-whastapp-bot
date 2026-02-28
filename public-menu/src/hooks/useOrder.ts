import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CartItem } from '../components/CartSidebar';

interface CustomerDetails {
    name: string;
    phone: string;
    notes?: string;
}

interface OrderResult {
    success: boolean;
    error?: string;
    orderId?: string;
    customerId?: string; // NEW
}

export const useOrder = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitOrder = async (
        branchId: string,
        cart: CartItem[],
        customer: CustomerDetails,
        discountId?: string,
        finalTotal?: number,
        loyaltyRedemption?: { points: number; ruleId: string }
    ): Promise<OrderResult> => {
        setIsSubmitting(true);
        try {
            // 1. Prepare Items JSON & Calculate Total
            const itemsJson = cart.map(item => ({
                name: item.name_en, // Storing English name by default
                qty: item.quantity,
                price: item.price,
                // Add preferences if we support them later
            }));

            const total = finalTotal !== undefined ? finalTotal : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const now = new Date();
            const orderDate = now.toISOString().split('T')[0];
            const orderTime = now.toLocaleTimeString('en-GB');

            // 2. Find or Create Customer (Refined for Sync)
            const phoneStr = customer.phone.replace(/\s+/g, '');

            // A. Ensure Profile exists (Auth Mirror)
            // We use upsert here to ensure that if a user changes their name but keeps the same phone, 
            // the profile is updated. If first time, it's created.
            const { data: profile, error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    phone: phoneStr,
                    name: customer.name || 'Web Guest',
                    role: 'customer'
                }, { onConflict: 'phone' })
                .select()
                .single();

            if (upsertError) {
                console.error('Profile sync warning:', upsertError);
            }

            const customerId = profile?.id;

            // B. Ensure Customer record exists (Business Logic)
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, total_orders, total_spent')
                .eq('phone', phoneStr)
                .maybeSingle();

            if (existingCustomer) {
                // Update existing customer totals
                await supabase.from('customers').update({
                    total_orders: (existingCustomer.total_orders || 0) + 1,
                    total_spent: (existingCustomer.total_spent || 0) + total,
                    name: customer.name || 'Web Guest'
                }).eq('id', existingCustomer.id);
            } else if (customerId) {
                // Create new Customer record linked to profile ID
                await supabase.from('customers').insert({
                    id: customerId,
                    name: customer.name || 'Web Guest',
                    phone: phoneStr,
                    total_orders: 1,
                    total_spent: total,
                    email: `web-${phoneStr}@foodboot.com`
                });
            }

            // 3. Insert Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    branch_id: branchId,
                    customer_id: customerId,
                    total: total,
                    status: 'Pending',
                    payment_method: 'Cash', // Default for now
                    mode: 'Web', // Distinct from 'Text' (WhatsApp)
                    items: itemsJson,
                    order_date: orderDate,
                    order_time: orderTime,
                    notes: discountId ? `Discount applied: ${discountId}` : (customer.notes || '')
                })
                .select()
                .single();

            if (orderError) throw new Error(orderError.message);



            if (loyaltyRedemption && customerId) {
                const { data: currentCust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single();
                if ((currentCust?.loyalty_points || 0) >= loyaltyRedemption.points) {
                    await supabase.from('customers').update({
                        loyalty_points: (currentCust?.loyalty_points || 0) - loyaltyRedemption.points
                    }).eq('id', customerId);
                }
            }

            // 5. Calculate and Award Loyalty Points
            const { data: earnRules } = await supabase
                .from('loyalty_rules')
                .select('*')
                .eq('type', 'EARN_RULE')
                .eq('is_active', true)
                .match({ condition_type: 'SPEND_AMOUNT' }); // Simplified for now

            let pointsEarned = 0;
            if (earnRules) {
                earnRules.forEach(rule => {
                    if (total >= rule.condition_value) {
                        const multiplier = Math.floor(total / rule.condition_value);
                        if (multiplier > 0) pointsEarned += multiplier * rule.reward_value;
                    }
                });
            }

            if (pointsEarned > 0 && customerId) {
                // Fetch current points to increment safely
                const { data: currentCust } = await supabase.from('customers').select('loyalty_points, lifetime_points_earned').eq('id', customerId).single();
                const newPoints = (currentCust?.loyalty_points || 0) + pointsEarned;
                const newLifetime = (currentCust?.lifetime_points_earned || 0) + pointsEarned;

                // Simple Tier Logic: Bronze < 1000 < Silver < 5000 < Gold
                let newTier = 'Bronze';
                if (newLifetime >= 5000) newTier = 'Gold';
                else if (newLifetime >= 1000) newTier = 'Silver';

                await supabase.from('customers').update({
                    loyalty_points: newPoints,
                    lifetime_points_earned: newLifetime,
                    loyalty_tier: newTier
                }).eq('id', customerId);
            }

            // 6. Trigger WhatsApp Receipt via Backend
            try {
                // Use absolute URL or relative if proxied
                const response = await fetch('/api/send-receipt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneStr,
                        name: customer.name || 'Valued Customer',
                        items: itemsJson,
                        total: total,
                        orderId: order.id
                    })
                });
                if (!response.ok) console.warn('Receipt API returned error:', await response.text());
            } catch (receiptErr) {
                console.error('Failed to trigger receipt:', receiptErr);
            }

            return { success: true, orderId: order.id, customerId: customerId || undefined };

        } catch (error: any) {
            console.error('Order submission error:', error);
            return { success: false, error: error.message || 'Failed to place order' };
        } finally {
            setIsSubmitting(false);
        }
    };

    return { submitOrder, isSubmitting };
};
