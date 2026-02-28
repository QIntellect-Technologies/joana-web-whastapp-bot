// ProductModal v2.1 - Fixed Syntax & Icons
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { X, Star, Clock, Flame, ShoppingBag, ZoomIn } from 'lucide-react';
import type { PublicMenuItem } from '../hooks/usePublicMenu';

interface ProductModalProps {
    item: PublicMenuItem | null;
    onClose: () => void;
    onAdd: (item: PublicMenuItem, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, onClose, onAdd }) => {
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

    // Interactive 3D Tilt & Zoom Logic
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const scale = useMotionValue(1.1); // Start slightly zoomed to cover edges

    function onMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
        // Sensitivity 40: Balanced between subtle and noticeable
        const x = (event.clientX - left - width / 2) / 40;
        const y = (event.clientY - top - height / 2) / 40;
        rotateX.set(-y);
        rotateY.set(x);
    }

    function onMouseLeave() {
        rotateX.set(0);
        rotateY.set(0);
        scale.set(1.1); // Reset zoom on leave
    }

    function onWheel(event: React.WheelEvent<HTMLDivElement>) {
        event.stopPropagation();

        const currentScale = scale.get();
        // Increased sensitivity significantly (was 0.001, now 0.005)
        const newScale = currentScale - (event.deltaY * 0.005);
        const clampedScale = Math.min(Math.max(newScale, 1.0), 2.5);

        scale.set(clampedScale);
    }

    // New: Toggle Zoom function
    const toggleZoom = () => {
        const current = scale.get();
        scale.set(current > 1.5 ? 1.1 : 2.0); // Toggle between ~1x and 2x
    };

    // Reset quantity when item changes
    useEffect(() => {
        setQuantity(1);
        setActiveTab('details');
        // Reset scale on item change too
        scale.set(1.1);
    }, [item, scale]);

    // Mock Data Generators
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
    const reviewCount = Math.floor(Math.random() * 200) + 50;
    const calories = Math.floor(Math.random() * 400) + 200;
    const prepTime = Math.floor(Math.random() * 20) + 15;

    const mockReviews = [
        { id: 1, user: "Sarah M.", rating: 5, date: "2 days ago", text: "Absolutely delicious! The flavors are perfectly balanced. Will strictly order again." },
        { id: 2, user: "Ahmed K.", rating: 4, date: "1 week ago", text: "Great portion size and very fresh ingredients. Delivery was super fast too." },
        { id: 3, user: "John D.", rating: 5, date: "3 weeks ago", text: "Best I've had in the city. Highly recommended!" }
    ];

    const getImageUrl = (item: PublicMenuItem) => {
        return item.image_url || `https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.name_en + ' food restaurant meal')}&w=800&h=800&c=7&rs=1&p=0`;
    };

    return ReactDOM.createPortal(
        <AnimatePresence>
            {item && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ perspective: "1000px" }} // Explicit CSS perspective
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Card - Interactive 3D Wrapper */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} // Tweaked entrance
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseLeave}
                        // Rotations removed from Container
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:h-[600px] cursor-default"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-slate-900 transition-all border border-white/30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Left Side: Immersive Image (3D Parallax + Zoom) */}
                        <div
                            className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden group cursor-zoom-in"
                            onWheel={onWheel}
                            onClick={toggleZoom} // Added Click-to-Zoom
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />

                            {/* Zoom Hint Icons */}
                            <div className="absolute top-4 left-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 backdrop-blur-md text-white p-2 rounded-full border border-white/20 shadow-lg">
                                    <ZoomIn className="w-4 h-4" />
                                </span>
                            </div>

                            {/* Main Image */}
                            <motion.img
                                layoutId={`image-${item.id}`} // Shared ID matches MenuCard
                                src={getImageUrl(item)}
                                alt={item.name_en}
                                className="w-full h-full object-cover transition-transform duration-200" // Smooth manual transitions
                                style={{
                                    rotateX, // Applied ONLY to Image
                                    rotateY,
                                    scale,   // Dynamic Interactive Scale
                                    transform: "translateZ(50px)"
                                }}
                            />

                            {/* Floating Badges */}
                            <div className="absolute bottom-6 left-6 z-20 flex gap-3 flex-wrap pointer-events-none">
                                <div className="glass-pill px-4 py-2 rounded-xl flex items-center gap-2 text-white bg-white/10 backdrop-blur-md border border-white/20">
                                    <Clock className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-bold">{prepTime} mins</span>
                                </div>
                                <div className="glass-pill px-4 py-2 rounded-xl flex items-center gap-2 text-white bg-white/10 backdrop-blur-md border border-white/20">
                                    <Flame className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold">{calories} kcal</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Content & Reviews */}
                        <div className="w-full md:w-1/2 bg-white flex flex-col overflow-hidden">

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-3xl font-bold text-slate-800 font-display leading-tight">{item.name_en}</h2>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-primary">SAR {item.price}</span>
                                        {item.status === 'Out of Stock' && <span className="text-xs font-bold text-red-500 uppercase">Sold Out</span>}
                                    </div>
                                </div>

                                {/* Rating Row */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`w-4 h-4 ${i <= Math.round(Number(rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{rating}</span>
                                    <span className="text-xs font-medium text-slate-400">({reviewCount} reviews)</span>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-6 border-b border-slate-100 mb-6">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'details' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Details
                                        {activeTab === 'details' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'reviews' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Reviews
                                        {activeTab === 'reviews' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                                    </button>
                                </div>

                                <AnimatePresence mode='wait'>
                                    {activeTab === 'details' ? (
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            <p className="text-slate-600 leading-relaxed text-sm">
                                                Experience the taste of perfection with our {item.name_en}.
                                                Prepared fresh daily using premium ingredients, this dish is a customer favorite that perfectly balances flavor and texture.
                                            </p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cuisine</span>
                                                    <span className="font-bold text-slate-800">{item.cuisine_type || 'International'}</span>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</span>
                                                    <span className="font-bold text-slate-800">{item.category_name}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="reviews"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            {mockReviews.map(review => (
                                                <div key={review.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                {review.user.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800">{review.user}</span>
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-slate-400">{review.date}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 mb-2">
                                                        {[...Array(review.rating)].map((_, i) => (
                                                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">"{review.text}"</p>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Sticky Bottom Actions */}
                            <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2 border border-slate-200">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-all text-xl font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-lg font-black text-slate-900 w-6 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-all text-xl font-bold"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onAdd(item, quantity);
                                            onClose();
                                        }}
                                        disabled={item.status === 'Out of Stock'}
                                        className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl  transition-all transform active:scale-[0.98] ${item.status === 'Out of Stock'
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-primary text-white shadow-primary/30 hover:shadow-2xl hover:-translate-y-1'
                                            }`}
                                    >
                                        <ShoppingBag className="w-5 h-5 fill-current" />
                                        <span>Add to Order</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">SAR {(item.price * quantity).toFixed(0)}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProductModal;
