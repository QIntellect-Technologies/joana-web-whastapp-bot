import { supabase } from '../lib/supabase';

const RIYADH_BRANCH_ID = '550e8400-e29b-41d4-a716-446655440001';

/**
 * Persists an order to Supabase
 * @param {Object} orderData 
 * @param {Array} cart 
 * @param {String} language 
 */
export async function submitOrder(orderData, cart, language) {
    try {
        console.log('--- Order Submission Start ---');

        // 1. Group and aggregate items from cart
        const groupedItems = {};
        cart.forEach(item => {
            const key = item.id + (item.preference ? `_${item.preference}` : '');
            if (!groupedItems[key]) {
                const prefLabel = item.preference === 'spicy' ? ' (Spicy)' : (item.preference === 'non-spicy' ? ' (Non-Spicy)' : '');
                groupedItems[key] = {
                    name: `${item.name.en}${prefLabel}`,
                    qty: 0,
                    price: item.price
                };
            }
            groupedItems[key].qty += 1;
        });

        const itemsJson = Object.values(groupedItems).map(i => ({
            name: i.name,
            qty: i.qty,
            price: i.price
        }));
        const total = itemsJson.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const now = new Date();
        const orderDate = now.toISOString().split('T')[0];
        const orderTime = now.toLocaleTimeString('en-GB');

        // 2. Find or Create Customer (Real-time Link)
        let customerId = orderData.customerId;

        // If we have a phone number but no ID, try to find/create the customer
        if (!customerId && orderData.phone) {
            const phoneStr = orderData.phone.replace(/\s+/g, '');

            // Try to find existing
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', phoneStr)
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create new Customer & Profile
                const tempId = crypto.randomUUID();
                const placeholderEmail = `wa-${phoneStr}@foodboot.com`;

                // Create Profile first (if using profiles table)
                await supabase.from('profiles').insert({
                    id: tempId,
                    name: orderData.name || 'WhatsApp User',
                    email: placeholderEmail,
                    phone: phoneStr,
                    role: 'customer'
                });

                // Create Customer record
                const { data: newCustomer, error: insertError } = await supabase.from('customers').insert({
                    id: tempId,
                    name: orderData.name || 'WhatsApp User',
                    email: placeholderEmail, // REQUIRED BY DB
                    phone: phoneStr,
                    total_orders: 1,
                    total_spent: total
                }).select().single();

                if (insertError) {
                    console.error('--- Quick Customer Create Failed ---', insertError);
                } else if (newCustomer) {
                    customerId = newCustomer.id;
                }
            }
        }

        // 3. Create the Main Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                branch_id: RIYADH_BRANCH_ID,
                customer_id: customerId || null, // LINKED!
                total: total,
                status: 'Pending',
                payment_method: 'Cash',
                mode: 'Text',
                items: itemsJson,
                order_date: orderDate,
                order_time: orderTime
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 4. Log for analytics
        const { error: voiceError } = await supabase
            .from('voice_text_orders')
            .insert({
                order_id: order.id,
                mode: 'Text',
                language: language,
                confidence_score: 1,
                raw_transcript: 'Direct Integration Order'
            });

        if (voiceError) {
            console.error('--- Voice Analytics Log Failed ---', voiceError);
            // Don't throw here, the order itself worked.
        }

        console.log('--- Order Submission Success ---', order.id);
        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('--- Order Submission Failed ---', error);
        return { success: false, error: error.message };
    }
}
