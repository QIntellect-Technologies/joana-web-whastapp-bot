import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import type { PublicMenuItem } from '../hooks/usePublicMenu';
import React from 'react';

interface MenuCardProps {
    item: PublicMenuItem;
}

const MenuCard: React.FC<MenuCardProps & { onAdd: (item: PublicMenuItem) => void; onClick?: () => void }> = ({ item, onAdd, onClick }) => {
    const isOutOfStock = item.status === 'Out of Stock';
    const [imgError, setImgError] = React.useState(false);

    const imageUrl = React.useMemo(() => {
        if (imgError) {
            return `https://placehold.co/400x400/e2e8f0/1e293b?text=${encodeURIComponent(item.name_en)}`;
        }

        // Final Strategy: Web Search Thumbnails
        // This pulls the top image result from the web for the exact item name.
        // It provides the most "real" looking results for specific dishes.
        return item.image_url || `https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.name_en + ' food restaurant meal')}&w=500&h=500&c=7&rs=1&p=0`;
    }, [item.image_url, item.name_en, imgError]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => !isOutOfStock && onClick && onClick()}
            className={`glass-card rounded-[2rem] p-4 flex gap-4 min-h-[160px] group relative overflow-hidden cursor-pointer ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Left Content: Text and Price */}
            <div className="flex-1 flex flex-col justify-between py-2 relative z-10">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800 font-display leading-tight group-hover:text-primary transition-colors">
                        {item.name_en}
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            <span className="text-xs align-top text-primary mr-0.5">SAR</span>
                            {(item.discounted_price || item.price).toFixed(2)}
                        </span>
                        {(item.discounted_price && item.discounted_price < item.price) ? (
                            <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300">SAR {item.price.toFixed(2)}</span>
                        ) : (
                            <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300">SAR {(item.price * 1.2).toFixed(2)}</span>
                        )}
                        {item.active_discount && (
                            <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg animate-pulse flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />
                                {item.active_discount.type === 'PERCENTAGE' ? `SAVE ${item.active_discount.value}%` : `SAR ${item.active_discount.value} OFF`}
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed line-clamp-2 md:line-clamp-3">
                        {item.active_discount ? (
                            <span className="text-primary font-bold">Promotion: {item.active_discount.name}! </span>
                        ) : null}
                        Savory and delicious, our {item.name_en.toLowerCase()} is prepared with the finest ingredients and authentic spices.
                    </p>
                </div>
            </div>

            {/* Right Content: Image and Action */}
            <div className="relative w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-[1.5rem] overflow-hidden bg-white shadow-inner border border-white/60">
                <motion.img
                    layoutId={`image-${item.id}`} // Shared ID for Image Only
                    src={imageUrl}
                    alt={item.name_en}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
                        <span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest px-2 py-1 bg-white rounded-full shadow-sm">
                            Out of Stock
                        </span>
                    </div>
                )}

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onAdd(item);
                    }}
                    disabled={isOutOfStock}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOutOfStock
                        ? 'bg-slate-200 text-slate-400'
                        : 'bg-white text-slate-900 hover:bg-slate-900 hover:text-white hover:scale-110 hover:shadow-xl'
                        }`}
                >
                    <span className="text-xl font-light mb-0.5">+</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default MenuCard;
