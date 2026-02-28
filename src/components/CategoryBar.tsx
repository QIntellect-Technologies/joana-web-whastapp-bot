import React from 'react';
import { motion } from 'framer-motion';

interface CategoryBarProps {
    categories: { id: string; name_en: string }[];
    activeCategoryId: string;
    onSelect: (id: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ categories, activeCategoryId, onSelect }) => {
    return (
        <div className="sticky top-24 z-40 mx-auto max-w-7xl pt-4 pb-4">
            <div className="glass-panel rounded-[2rem] px-2 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 shadow-floating bg-white/80 backdrop-blur-xl border border-white/60">
                {/* "All Items" Button */}
                <button
                    onClick={() => onSelect('all')}
                    className={`relative px-6 py-3 rounded-[1.5rem] text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap z-10 ${activeCategoryId === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    {activeCategoryId === 'all' && (
                        <motion.div
                            layoutId="activeCategory"
                            className="absolute inset-0 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/30 z-[-1]"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    All Items
                </button>

                {/* Category Buttons */}
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`relative px-6 py-3 rounded-[1.5rem] text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap z-10 ${activeCategoryId === cat.id ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {activeCategoryId === cat.id && (
                            <motion.div
                                layoutId="activeCategory"
                                className="absolute inset-0 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/30 z-[-1]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        {cat.name_en}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryBar;
