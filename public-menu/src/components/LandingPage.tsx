import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ArrowRight, UtensilsCrossed, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BranchInfo } from '../hooks/usePublicMenu';

const LandingPage: React.FC = () => {
    const [branches, setBranches] = useState<BranchInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const { data } = await supabase
                    .from('branches')
                    .select('*');
                // .eq('status', 'Active'); // Show all for now to debug visibility
                setBranches(data || []);
            } catch (error) {
                console.error('Error fetching branches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.3 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: "spring", stiffness: 50, damping: 15 }
        }
    };

    return (
        <div className="min-h-screen relative bg-slate-900 overflow-y-auto no-scrollbar font-display flex flex-col items-center justify-center p-6 sm:p-10">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
                <div className="bg-noise absolute inset-0 opacity-20 mix-blend-overlay" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">

                {/* HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-center mb-16 space-y-6"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-20 h-20 bg-gradient-to-tr from-primary to-orange-400 rounded-3xl mx-auto flex items-center justify-center shadow-glow mb-8"
                    >
                        <UtensilsCrossed className="w-10 h-10 text-white" />
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight leading-tiight drop-shadow-2xl">
                        Welcome to <br className="hidden md:block" />
                        <span className="text-white">Food Bot</span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Experience the future of dining. Select a branch to explore our AI-curated menu of premium culinary delights.
                    </p>
                </motion.div>

                {/* BRANCH CARDS GRID */}
                {loading ? (
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="w-80 h-64 glass-panel animate-pulse rounded-3xl bg-white/5" />)}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
                    >
                        {branches.map((branch) => (
                            <motion.a
                                key={branch.id}
                                href={`?branch_id=${branch.id}`} // Simple navigation
                                variants={itemVariants}
                                whileHover={{ y: -10, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative block"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-purple-600 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />

                                <div className="relative h-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden hover:border-white/20 transition-colors">
                                    {/* Card Content */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/20 transition-colors">
                                                <MapPin className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${branch.status === 'Active'
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                }`}>
                                                {branch.status || 'Active'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors duration-300">
                                                {branch.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Open today • 10:00 AM - 11:00 PM</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="text-white font-bold">4.8</span>
                                                <span>(Top Rated)</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{branch.address}</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-8 flex items-center justify-between text-white font-bold text-sm tracking-wide uppercase group/btn">
                                        <span>Enter Branch</span>
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    </div>

                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                </div>
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-slate-600 text-xs font-medium tracking-widest uppercase">
                Powered by Food Bot AI
            </div>
        </div>
    );
};

export default LandingPage;
