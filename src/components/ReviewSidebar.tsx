import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReviewSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    branchId?: string;
}

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

const ReviewSidebar: React.FC<ReviewSidebarProps> = ({ isOpen, onClose, branchId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !branchId) return;

        const fetchReviews = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('reviews')
                .select('*')
                .eq('branch_id', branchId)
                .eq('status', 'APPROVED')
                .order('created_at', { ascending: false })
                .limit(50);

            setReviews(data || []);
            setLoading(false);
        };

        fetchReviews();

        // Realtime Subscription
        const channel = supabase
            .channel(`public_reviews_${branchId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reviews',
                filter: `branch_id=eq.${branchId}`
            }, () => {
                fetchReviews();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, branchId]);

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-auto"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="pointer-events-auto w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-[160]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 bg-white relative">
                            <Quote className="absolute right-8 top-8 w-16 h-16 text-slate-50 opacity-50" />
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-slate-800 font-display uppercase tracking-tight">Customer Feed</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Real experiences from our community</p>
                            </div>
                            <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Stats */}
                        <div className="p-6 bg-slate-50/50 flex gap-4 overflow-x-auto no-scrollbar">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-[140px]">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                    <Star className="w-6 h-6 fill-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                                    <p className="text-lg font-black text-slate-800">{averageRating}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-[140px]">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviews</p>
                                    <p className="text-lg font-black text-slate-800">{reviews.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-slate-50 h-32 rounded-3xl animate-pulse" />
                                    ))}
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-20 px-8">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display font-black text-slate-800 uppercase tracking-tight mb-2">No reviews yet</h3>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                        Be the first to share your experience after your next delicious meal!
                                    </p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-black text-slate-800 font-display text-sm uppercase tracking-tight">{review.customer_name}</p>
                                                <div className="flex gap-0.5 mt-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star
                                                            key={s}
                                                            className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                                            "{review.comment}"
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Only approved reviews are shown here
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReviewSidebar;
