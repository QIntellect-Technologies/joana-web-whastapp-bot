import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, Phone, User, FileText, Ticket, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Confetti from 'react-confetti';


interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (details: { name: string; phone: string; notes: string }, discountId?: string, finalTotal?: number) => Promise<{ success: boolean; orderId?: string; customerId?: string }>;
    totalAmount: number;
    branchId?: string;
    calculatePoints?: (amount: number) => number;
    getCustomerPoints?: (phone: string) => Promise<{ loyalty_points: number; loyalty_tier: string }>;
    calculateApplicableDiscounts?: (total: number) => { type: string; value: number; name: string } | null;
    calculateRedemption?: (points: number, total: number) => { discountAmount: number; pointsCost: number; ruleId: string | null };
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSubmit, totalAmount, branchId, calculatePoints, getCustomerPoints, calculateApplicableDiscounts, calculateRedemption }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null); // Manually applied coupon

    // Auto-applied discount from Loyalty Rules (e.g. Spend & Earn)
    const autoDiscount = calculateApplicableDiscounts ? calculateApplicableDiscounts(totalAmount) : null;

    // Effective Discount: Coupon overrides Auto (or we can stack, but simple override is safer for now, or display both?)
    // Let's say Coupon is usually explicit "I have a code", so maybe it overrides. 
    // BUT if "Spend 100 get 10% off" is a sitewide deal, it should probably apply unless a better coupon is used.
    // For simplicity: If Coupon Applied -> Use Coupon. If not -> Use Auto.
    const activeDiscount = appliedDiscount || autoDiscount;

    const [customerLoyalty, setCustomerLoyalty] = useState<{ loyalty_points: number, loyalty_tier: string } | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const validateCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        setCouponError('');

        try {
            const { data: dData, error } = await supabase
                .from('discounts')
                .select('*')
                .eq('coupon_code', couponCode.toUpperCase())
                .eq('is_active', true)
                .maybeSingle();

            if (error || !dData) {
                setCouponError('Invalid or expired coupon code.');
                setAppliedDiscount(null);
                return;
            }

            // Check Date Range
            const now = new Date();
            if (new Date(dData.start_date) > now || new Date(dData.end_date) < now) {
                setCouponError('This coupon is not currently active.');
                setAppliedDiscount(null);
                return;
            }

            // Check Target Audience restriction
            if (dData.target_audience.startsWith('USER:')) {
                const targetUserId = dData.target_audience.split(':')[1];
                if (!phone) {
                    setCouponError('Please enter your phone number first to verify this coupon.');
                    setAppliedDiscount(null);
                    return;
                }

                const { data: userData } = await supabase.from('profiles').select('phone').eq('id', targetUserId).maybeSingle();
                if (userData?.phone !== phone) {
                    setCouponError('This coupon is not valid for this account.');
                    setAppliedDiscount(null);
                    return;
                }
            }

            setAppliedDiscount(dData);
            setCouponError('');
        } catch (err) {
            setCouponError('Coupon validation failed.');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const discountedTotal = activeDiscount
        ? (activeDiscount.type === 'PERCENTAGE'
            ? totalAmount * (1 - activeDiscount.value / 100)
            : Math.max(0, totalAmount - activeDiscount.value))
        : totalAmount;

    const pointsToEarn = calculatePoints ? calculatePoints(discountedTotal) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        setStatus('submitting');
        // Pass the applied discount ID and the final amount to the submission handler
        const result = await onSubmit({ name, phone, notes }, activeDiscount?.id, discountedTotal);

        if (result.success) {
            setOrderId(result.orderId || null);
            setCustomerId(result.customerId || null);
            setStatus('success');
            // Don't auto-close if they want to review
        } else {
            setStatus('idle');
        }
    };

    const handleReviewSubmit = async () => {
        if (!orderId || rating === 0) return;
        setIsSubmittingReview(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    branch_id: branchId,
                    order_id: orderId,
                    customer_id: customerId,
                    customer_name: name,
                    rating,
                    comment,
                    status: 'PENDING'
                });

            if (error) throw error;
            setReviewSubmitted(true);
            alert('Rating submitted! Thank you.');
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } catch (err: any) {
            console.error('Review failed:', err);
            alert('Review submission failed: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const resetForm = () => {
        setStatus('idle');
        setName('');
        setPhone('');
        setNotes('');
        setCouponCode('');
        setAppliedDiscount(null);
        setOrderId(null);
        setCustomerId(null);
        setRating(0);
        setComment('');
        setReviewSubmitted(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {status === 'success' && (
                        <div className="absolute inset-0 pointer-events-none z-[110]">
                            <Confetti numberOfPieces={200} recycle={false} />
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl"
                    >
                        {status === 'success' ? (
                            <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
                                >
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 font-display">Order Placed!</h2>
                                    <p className="text-slate-500 mt-2 mb-8">Thank you, {name}. We have received your order.</p>

                                    {!reviewSubmitted ? (
                                        <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
                                            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Rate your experience</p>
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setRating(s)}
                                                        className="p-1 hover:scale-110 transition-transform"
                                                    >
                                                        <Star className={`w-10 h-10 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                rows={2}
                                                placeholder="Any feedback? (Optional)"
                                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                            />
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { onClose(); resetForm(); }}
                                                    className="bg-white text-slate-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
                                                >
                                                    Skip
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleReviewSubmit}
                                                    disabled={rating === 0 || isSubmittingReview}
                                                    className="bg-primary text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                                >
                                                    {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2rem] border border-emerald-100 animate-bounce-subtle">
                                            <Star className="w-10 h-10 fill-emerald-500 mx-auto mb-2" />
                                            <p className="font-bold text-sm">Feedback Received!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-xl font-bold text-slate-800 font-display">Checkout</h2>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                onBlur={() => {
                                                    if (phone.length >= 9 && getCustomerPoints) {
                                                        getCustomerPoints(phone).then(data => {
                                                            if (data && data.loyalty_points > 0) {
                                                                // Just show notification or store in state?
                                                                // For now simple alert or state to render
                                                                setCustomerLoyalty(data);
                                                            }
                                                        });
                                                    }
                                                }}
                                                placeholder="05..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                            />
                                        </div>
                                        {customerLoyalty && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-amber-50 rounded-xl p-3 flex items-center gap-3 border border-amber-100"
                                            >
                                                <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Loyalty Member ({customerLoyalty.loyalty_tier})</p>
                                                    <p className="text-xs font-bold text-slate-700">You have {customerLoyalty.loyalty_points} Points</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notes (Optional)</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <textarea
                                                rows={2}
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                placeholder="Special requests?"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:border-primary transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Coupon Code</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setAppliedDiscount(null); setCouponError(''); }}
                                                    placeholder="Enter Code"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-sm focus:outline-none focus:border-primary transition-all"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={validateCoupon}
                                                disabled={!couponCode || isValidatingCoupon}
                                                className="px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p className="text-[10px] text-red-500 font-bold ml-1">{couponError}</p>}
                                        {appliedDiscount && <p className="text-[10px] text-emerald-600 font-bold ml-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {appliedDiscount.name} Applied!
                                        </p>}
                                    </div>

                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
                                        <div className="flex justify-between items-center text-slate-500 font-bold text-[10px] uppercase tracking-widest px-1">
                                            <span>Original Total</span>
                                            <span className={activeDiscount ? 'line-through' : ''}>SAR {totalAmount.toFixed(2)}</span>
                                        </div>
                                        {activeDiscount && (
                                            <div className="flex justify-between items-center text-emerald-600 font-bold text-[10px] uppercase tracking-widest px-1">
                                                <span>Deal: {activeDiscount.name}</span>
                                                <span>- SAR {(totalAmount - discountedTotal).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {pointsToEarn > 0 && (
                                            <div className="flex justify-between items-center text-purple-600 font-bold text-[10px] uppercase tracking-widest px-1">
                                                <span>Points You'll Earn</span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-purple-600" />
                                                    +{pointsToEarn} PTS
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                                            <span className="text-sm font-semibold text-primary">Final Total (Cash)</span>
                                            <span className="text-xl font-black text-primary">SAR {discountedTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                    <button
                                        type="button"
                                        disabled={status === 'submitting'}
                                        onClick={handleSubmit}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {status === 'submitting' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Order"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CheckoutModal;
