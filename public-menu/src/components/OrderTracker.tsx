import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, ChefHat, Truck, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderTrackerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Order {
    id: string;
    total: number;
    status: string;
    created_at: string;
    order_date: string;
    order_time: string;
    items: any[];
    branch_id: string;
    reviews?: { id: string }[]; // Joined reviews
}

const STATUS_STEPS = [
    { key: 'Pending', label: 'Order Placed', icon: Clock },
    { key: 'Preparing', label: 'Cooking', icon: ChefHat },
    { key: 'Ready', label: 'Ready for Pickup', icon: CheckCircle },
    { key: 'Completed', label: 'Completed', icon: Truck },
];

const OrderTracker: React.FC<OrderTrackerProps> = ({ isOpen, onClose }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Fetch orders if user is identified
    useEffect(() => {
        if (!isOpen) return;

        const storedUser = localStorage.getItem('foodboot_user');
        if (!storedUser) {
            setLoading(false);
            return;
        }

        const { id: customerId } = JSON.parse(storedUser);

        const fetchOrders = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('orders')
                .select(`
                    *,
                    reviews (id)
                `)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(20);

            setOrders(data || []);
            setLoading(false);
        };

        fetchOrders();

        // Real-time listener
        const channel = supabase
            .channel('public-orders')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `customer_id=eq.${customerId}`
            }, (payload) => {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen]);

    const getStepStatus = (currentStatus: string, stepKey: string) => {
        const statusMap: Record<string, number> = { 'Pending': 0, 'Preparing': 1, 'Ready': 2, 'Delivered': 3, 'Cancelled': -1 };
        const currentIdx = statusMap[currentStatus] || 0;
        const stepIdx = statusMap[stepKey];

        if (currentStatus === 'Cancelled') return 'cancelled';
        if (currentIdx > stepIdx) return 'completed';
        if (currentIdx === stepIdx) return 'active';
        return 'upcoming';
    };

    const handleReviewSubmit = async () => {
        if (!reviewingOrder || rating === 0) return;
        setIsSubmittingReview(true);
        try {
            const storedUser = localStorage.getItem('foodboot_user');
            let { id: customerId, name: customerName } = storedUser ? JSON.parse(storedUser) : { id: null, name: 'Guest' };

            // SAFETY CHECK: Verify if customer mirror-profile exists to avoid FK violation
            if (customerId) {
                const { data: profileExists } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', customerId)
                    .maybeSingle();

                if (!profileExists) {
                    console.warn('Customer profile missing in database, submitting as guest link.');
                    customerId = null; // Revert to null to bypass FK constraint
                }
            }

            const { error } = await supabase
                .from('reviews')
                .insert({
                    order_id: reviewingOrder.id,
                    customer_id: customerId,
                    customer_name: customerName,
                    branch_id: reviewingOrder.branch_id,
                    rating,
                    comment,
                    status: 'PENDING'
                });

            if (error) throw error;

            // Update local state to show "Experience Rated" immediately
            setOrders(prev => prev.map(o => o.id === reviewingOrder.id ? { ...o, reviews: [{ id: 'new' }] } : o));

            setReviewingOrder(null);
            setRating(0);
            setComment('');
            alert('Review submitted successfully!'); // Added success feedback
        } catch (err: any) {
            console.error('Failed to submit review:', err);
            alert('Rating delivery failed: ' + (err.message || 'Unknown error')); // Added error feedback
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="pointer-events-auto w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-[110]"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 font-display">Your Orders</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {loading ? (
                                <div className="text-center py-10 text-slate-400">Loading your history...</div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-10 flex flex-col items-center gap-4 opacity-50">
                                    <Clock className="w-12 h-12 text-slate-300" />
                                    <p className="font-medium text-slate-500">No recent orders found.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order #{order.id.slice(0, 6)}</span>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">
                                                    {new Date(order.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        {/* Stepper or Success State */}
                                        {order.status === 'Cancelled' ? (
                                            <div className="bg-red-50 p-4 rounded-xl text-center mb-6 mt-6 border border-red-100">
                                                <p className="text-red-800 font-bold text-sm">Order Cancelled</p>
                                                <p className="text-red-500 text-xs mt-1">Please contact staff for details.</p>
                                            </div>
                                        ) : (order.status === 'Completed' || order.status === 'Delivered') ? (
                                            <div className="bg-green-50/50 p-6 rounded-2xl text-center mb-6 mt-6 border border-green-100 relative overflow-hidden group">
                                                {/* Animated Background Particles */}
                                                <span className="absolute top-0 left-1/4 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:animate-ping"></span>
                                                <span className="absolute bottom-2 right-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-0 delay-75 group-hover:animate-ping"></span>

                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_0_8px_rgba(220,252,231,0.4)] animate-bounce-subtle">
                                                    <CheckCircle className="w-8 h-8 text-green-600 drop-shadow-sm" />
                                                </div>
                                                <h3 className="text-green-800 font-black text-lg font-display uppercase tracking-wide">Order Completed!</h3>
                                                <p className="text-green-600/80 text-xs font-medium mt-1 mb-4">Your order has been served. Enjoy your meal!</p>

                                                {order.reviews && order.reviews.length > 0 ? (
                                                    <div className="inline-flex items-center gap-2 bg-green-100/50 text-green-700 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-green-200">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Experience Rated
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setReviewingOrder(order)}
                                                        className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-green-100"
                                                    >
                                                        <Star className="w-3.5 h-3.5 fill-green-600" />
                                                        Rate Experience
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center relative mb-6 mt-6 px-2">
                                                {/* Connecting Line */}
                                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />

                                                {STATUS_STEPS.map((step) => {
                                                    const status = getStepStatus(order.status || 'Pending', step.key);
                                                    const Icon = step.icon;
                                                    // Hide Completed step from stepper since we show full UI for it
                                                    if (step.key === 'Completed') return null;

                                                    return (
                                                        <div key={step.key} className="flex flex-col items-center gap-2 bg-white px-1 z-10 w-1/3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 relative ${status === 'completed' ? 'bg-green-500 text-white' :
                                                                status === 'active' ? 'bg-primary text-white scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' :
                                                                    'bg-slate-50 text-slate-300 border border-slate-100'
                                                                }`}>
                                                                {status === 'active' && (
                                                                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
                                                                )}
                                                                <Icon className="w-4 h-4 relative z-10" />
                                                            </div>
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider text-center transition-colors duration-300 ${status === 'active' ? 'text-primary' :
                                                                status === 'completed' ? 'text-green-600' : 'text-slate-300'
                                                                }`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="space-y-2 border-t border-slate-50 pt-4">
                                            {order.items.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-slate-600 font-medium">
                                                        {item.qty}x {item.name}
                                                    </span>
                                                    <span className="font-bold text-slate-800">
                                                        SAR {item.price * item.qty}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm pt-2 font-bold text-primary">
                                                <span>Total</span>
                                                <span>SAR {order.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Review Modal Overlay */}
                    <AnimatePresence>
                        {reviewingOrder && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
                                >
                                    <div className="p-8 text-center space-y-6">
                                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-500">
                                            <Star className="w-10 h-10 fill-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 font-display">Rate Your Meal</h3>
                                            <p className="text-slate-500 text-sm mt-1">How was everything today?</p>
                                        </div>

                                        {/* Stars */}
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setRating(s)}
                                                    className="p-1 hover:scale-110 transition-transform"
                                                >
                                                    <Star className={`w-8 h-8 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} />
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            rows={3}
                                            placeholder="Write a comment (optional)..."
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setReviewingOrder(null)}
                                                className="bg-slate-100 text-slate-400 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReviewSubmit}
                                                disabled={rating === 0 || isSubmittingReview}
                                                className="bg-primary text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                            >
                                                {isSubmittingReview ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OrderTracker;
