import React from 'react';
import { Clock, Info, Star } from 'lucide-react';
import ChefAnimation from './ChefAnimation';
import type { BranchInfo } from '../hooks/usePublicMenu';

interface BranchHeroProps {
    branch: BranchInfo | null;
    loading: boolean;
}

const BranchHero: React.FC<BranchHeroProps> = ({ branch, loading }) => {
    if (loading) {
        return <div className="glass-panel animate-pulse h-48 rounded-[2.5rem] mb-8" />;
    }

    if (!branch) return null;

    return (
        <div className="relative mb-8 group">
            <div className="glass-panel rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 backdrop-blur-md">
                                {branch.status || 'Open Now'}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white/60">
                                <Clock className="w-3 h-3" />
                                <span>Available Today</span>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight font-display leading-none">
                            {branch.name}
                        </h1>

                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg line-clamp-2">
                            Experience the authentic taste of premium cuisine, prepared fresh daily by our master chefs. Join us for an unforgettable dining journey in the heart of the city.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50/50 border border-primary/10 text-primary rounded-lg backdrop-blur-sm">
                                <span className="text-[10px] uppercase font-bold tracking-widest">★ Super Restaurant</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>10-25 min</span>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center gap-6 border-t border-slate-100/50 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 text-primary">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i === 5 ? 'text-slate-200 fill-slate-200' : 'fill-current'}`} />)}
                                </div>
                                <span className="text-xs font-bold text-slate-900">4.8/5 <span className="text-slate-400 font-normal">(500+)</span></span>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group/info">
                                <div className="p-1 bg-white rounded-full shadow-sm group-hover/info:scale-110 transition-transform">
                                    <Info className="w-3 h-3 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest">More Info</span>
                            </div>
                        </div>
                    </div>


                    <div className="hidden lg:block relative">
                        {/* Replaced static logo with Animated Chef */}
                        <div className="relative z-10 scale-125 origin-center transform transition-transform group-hover:scale-[1.3] group-hover:rotate-2 duration-700">
                            <ChefAnimation branchName={branch.name} />
                        </div>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 via-primary/0 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                {/* Extra 'Dec' - Food Pattern Opacity */}
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-[0.03] pointer-events-none mix-blend-multiply" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
            </div>
        </div>
    );
};

export default BranchHero;
