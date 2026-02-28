import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, XCircle, Clock, Filter, Search, BarChart3, TrendingUp, Users, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ReviewManager: React.FC = () => {
    const { userRole, loggedInBranchId } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
    const [availableBranches, setAvailableBranches] = useState<{ id: string, name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStats, setShowStats] = useState(true);
    const [newReviewCount, setNewReviewCount] = useState(0);

    useEffect(() => {
        fetchReviews();
        fetchBranches();

        // Realtime Subscription
        const channel = supabase
            .channel('reviews_sync')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'reviews'
            }, (payload) => {
                setNewReviewCount(prev => prev + 1);
                fetchReviews();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'reviews'
            }, () => {
                fetchReviews();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loggedInBranchId, userRole]);

    useEffect(() => {
        fetchReviews();
    }, [selectedBranchId]);

    const handleNewReviewClear = () => {
        setNewReviewCount(0);
        fetchReviews();
    };

    const fetchBranches = async () => {
        if (userRole !== UserRole.MAIN_ADMIN) return;
        const { data } = await supabase.from('branches').select('id, name');
        setAvailableBranches(data || []);
    };

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('reviews')
                .select(`
                    *,
                    branches (name)
                `)
                .order('created_at', { ascending: false });

            // Branch filtering logic
            if (userRole === UserRole.BRANCH_ADMIN && loggedInBranchId) {
                query = query.eq('branch_id', loggedInBranchId);
            } else if (userRole === UserRole.MAIN_ADMIN && selectedBranchId !== 'ALL') {
                query = query.eq('branch_id', selectedBranchId);
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;
            setReviews(data || []);
        } catch (err: any) {
            console.error('Error fetching reviews:', err);
            setError(err.message || 'Failed to connect to reviews database');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
        // Optimistic Update
        const previousReviews = [...reviews];
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));

        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating review status:', err);
            setReviews(previousReviews); // Rollback on error
            alert('Failed to update status. Please try again.');
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        const matchesSearch = r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.comment.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    const handleMoveBranch = async (reviewId: string, newBranchId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ branch_id: newBranchId })
                .eq('id', reviewId);

            if (error) throw error;
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, branch_id: newBranchId } : r));
            fetchReviews(); // Refresh to get the branch name join
        } catch (err) {
            console.error('Error moving review branch:', err);
            alert('Failed to move review');
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Realtime Notification Banner */}
            <AnimatePresence>
                {newReviewCount > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-primary text-white p-4 rounded-3xl shadow-xl shadow-primary/20 flex justify-between items-center px-8 mb-6 border border-white/10 ring-4 ring-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl animate-pulse">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-wider">New Feedback Received</p>
                                    <p className="text-xs text-white/80 font-medium">You have {newReviewCount} new customer reviews waiting for moderation.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleNewReviewClear}
                                className="bg-white text-primary px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                            >
                                View New Reviews
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Monitoring</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 font-display uppercase tracking-tight">
                        {userRole === UserRole.MAIN_ADMIN ? 'Super Admin Control' : 'Branch Review Panel'}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {userRole === UserRole.MAIN_ADMIN
                            ? 'Managing customer feedback across all global headquarters'
                            : 'Managing feedback for your specific branch location'}
                    </p>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                    {/* Branch Selector for Super Admin */}
                    {userRole === UserRole.MAIN_ADMIN && (
                        <div className="w-full md:w-auto">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select Branch</p>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="w-full md:w-64 bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            >
                                <option value="ALL">All Branches</option>
                                {availableBranches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-4 bg-white p-1 rounded-3xl border border-slate-100 shadow-sm pr-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-black text-emerald-500 flex items-center gap-1.5 uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Synced
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Header */}
            {showStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                            <Star className="w-8 h-8 fill-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Rating</p>
                            <p className="text-3xl font-black text-slate-800 font-display">{averageRating}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Reviews</p>
                            <p className="text-3xl font-black text-slate-800 font-display">{reviews.length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
                            <p className="text-3xl font-black text-slate-800 font-display">{reviews.filter(r => r.status === 'APPROVED').length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <p className="text-3xl font-black text-slate-800 font-display">{reviews.filter(r => r.status === 'PENDING').length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reviews or customers..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterStatus === status
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {error ? (
                    <div className="col-span-full p-8 bg-red-50 border border-red-100 rounded-[2.5rem] text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-800 mb-2">Database Error</h3>
                        <p className="text-red-600 font-medium mb-6">{error}</p>
                        <button
                            onClick={fetchReviews}
                            className="bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : loading ? (
                    <div className="col-span-full py-20 text-center font-bold text-slate-400 animate-pulse">Scanning customer feedback...</div>
                ) : filteredReviews.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 font-display">No feedback found</h3>
                        <p className="text-slate-500 font-medium">Adjust your filters or wait for new reviews to come in.</p>
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 font-display">{review.customer_name}</p>

                                            {/* Branch Label or Switcher */}
                                            {userRole === UserRole.MAIN_ADMIN ? (
                                                <div className="mt-1">
                                                    <select
                                                        value={review.branch_id || ''}
                                                        onChange={(e) => handleMoveBranch(review.id, e.target.value)}
                                                        className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded-md border-none outline-none cursor-pointer transition-colors ${!review.branch_id
                                                            ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
                                                            : 'bg-primary/5 text-primary hover:bg-primary/10'
                                                            }`}
                                                    >
                                                        <option value="" disabled>Select Branch...</option>
                                                        {availableBranches.map(b => (
                                                            <option key={b.id} value={b.id}>{b.name}</option>
                                                        ))}
                                                    </select>
                                                    {!review.branch_id && (
                                                        <p className="text-[8px] text-red-400 font-bold mt-0.5 uppercase tracking-widest pl-1">
                                                            Invisible to customers
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[9px] font-bold text-primary uppercase tracking-tighter mb-1 bg-primary/5 px-1.5 py-0.5 rounded-md inline-block">
                                                    @{review.branches?.name || 'Local HQ'}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 mt-1">
                                                {renderStars(review.rating)}
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${review.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        review.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                                            'bg-orange-50 text-orange-600 border border-orange-100'
                                        }`}>
                                        {review.status}
                                    </span>
                                </div>

                                <div className="relative">
                                    <MessageSquare className="absolute -left-1 -top-1 w-8 h-8 text-blue-500/5 rotate-12" />
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic relative z-10 px-2 min-h-[60px]">
                                        "{review.comment}"
                                    </p>
                                </div>
                            </div>

                            {review.status === 'PENDING' ? (
                                <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                                        className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(review.id, 'REJECTED')}
                                        className="flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                                    <button
                                        onClick={() => handleUpdateStatus(review.id, 'PENDING')}
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                                    >
                                        Reset to Pending
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewManager;
