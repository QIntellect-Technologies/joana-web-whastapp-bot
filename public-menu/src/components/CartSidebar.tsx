import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import type { PublicMenuItem } from '../hooks/usePublicMenu';

export interface CartItem extends PublicMenuItem {
    quantity: number;
}

interface CartSidebarProps {
    cart: CartItem[];
    onUpdateQuantity: (itemId: string, delta: number) => void;
    onRemove: (itemId: string) => void;
    isOpen: boolean;
    onCheckout: () => void;
    onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cart, onUpdateQuantity, onRemove, isOpen, onCheckout, onClose }) => {
    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + ((item.discounted_price || item.price) * item.quantity), 0);
    }, [cart]);

    const deliveryFee = 15; // Example fixed fee
    const total = subtotal + (subtotal > 0 ? deliveryFee : 0);

    // If implementing toggle, conditionally render or use variants for off-screen
    // For now, we assume it's always visible on desktop or toggled via parent

    return (
        <>
            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] md:hidden cursor-pointer"
                    />
                )}
            </AnimatePresence>

            <div className={`fixed right-0 top-0 h-screen w-full md:w-[400px] z-[60] pointer-events-none flex justify-end transition-transform duration-500 ${!isOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="w-full h-full bg-white/80 backdrop-blur-xl border-l border-white/50 shadow-2xl pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 font-display leading-none">Order Summary</h2>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                    {cart.length} Items Selected
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        <AnimatePresence mode='popLayout'>
                            {cart.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50"
                                >
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400">Your cart is empty</p>
                                </motion.div>
                            ) : (
                                cart.map(item => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white/60 p-3 rounded-2xl flex gap-3 group border border-white/40 shadow-sm hover:shadow-md transition-all"
                                    >
                                        {/* Tiny Thumbnail */}
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                            <img
                                                src={item.image_url || `https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.name_en + ' food')}&w=200&h=200&c=7&rs=1&p=0`}
                                                alt={item.name_en}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://placehold.co/200x200/e2e8f0/1e293b?text=${encodeURIComponent(item.name_en)}`;
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name_en}</h4>
                                                <button
                                                    onClick={() => onRemove(item.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    {item.discounted_price && item.discounted_price < item.price && (
                                                        <span className="text-[10px] font-bold text-slate-300 line-through decoration-slate-300">SAR {item.price * item.quantity}</span>
                                                    )}
                                                    <span className="text-sm font-black text-primary">
                                                        <span className="text-[10px] text-slate-400 font-medium mr-0.5">SAR</span>
                                                        {((item.discounted_price || item.price) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-2 py-1 border border-slate-100">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary active:scale-90 transition-all font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-xs font-black text-slate-800 w-3 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary active:scale-90 transition-all font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="p-6 bg-white/60 border-t border-white/50 backdrop-blur-md space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-500">
                                    <span>Subtotal</span>
                                    <span>SAR {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-slate-500">
                                    <span>Delivery Fee</span>
                                    <span>SAR {deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                                    <span>Total</span>
                                    <span>SAR {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={onCheckout}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span>Checkout</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">SAR {total.toFixed(0)}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartSidebar;
