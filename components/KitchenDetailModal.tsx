import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, ChefHat, CheckCircle2, Play, Flame, Check, ArrowLeft, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { LiveOrder, StaffMember, KitchenItem, KitchenItemStatus, LiveOrderStatus } from '../types';

interface KitchenDetailModalProps {
    order: LiveOrder;
    staff: StaffMember[];
    onClose: () => void;
    onUpdateOrder: (orderId: string, updates: Partial<LiveOrder>) => void;
}

const KitchenDetailModal: React.FC<KitchenDetailModalProps> = ({ order, staff, onClose, onUpdateOrder }) => {
    const [elapsed, setElapsed] = useState(0);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    // Filter only Chefs from staff list
    const chefs = staff.filter(s => s.role === 'Chef');

    useEffect(() => {
        // console.log('KitchenDetailView MOUNTED for order:', order.id);
        const tick = () => setElapsed(prev => prev + 1);
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAssignChef = (itemIndex: number, chefId: string) => {
        const newItems = [...order.items];
        newItems[itemIndex] = { ...newItems[itemIndex], chefId };
        onUpdateOrder(order.id, { items: newItems });
    };

    const handleUpdateItemStatus = (itemIndex: number, status: KitchenItemStatus) => {
        const newItems = [...order.items];
        const now = new Date().toISOString();

        newItems[itemIndex] = {
            ...newItems[itemIndex],
            status,
            startedAt: status === 'Cooking' ? now : undefined,
            completedAt: status === 'Ready' ? now : undefined
        };

        // Auto-update order status if all items are ready
        const allReady = newItems.every(i => i.status === 'Ready' || i.status === 'Served');
        let orderUpdates: Partial<LiveOrder> = { items: newItems };

        if (allReady && order.status !== LiveOrderStatus.READY) {
            orderUpdates.status = LiveOrderStatus.READY;
        } else if (!allReady && status === 'Cooking' && order.status === LiveOrderStatus.PENDING) {
            orderUpdates.status = LiveOrderStatus.PREPARING;
        }

        onUpdateOrder(order.id, orderUpdates);
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const SafeAvatar = ({ src, name, className, fallbackClass }: { src?: string, name: string, className: string, fallbackClass: string }) => {
        const isError = !src || imgErrors[src];

        if (isError) {
            return (
                <div className={`${className} ${fallbackClass} flex items-center justify-center font-bold text-[10px]`}>
                    {getInitials(name)}
                </div>
            );
        }

        return (
            <img
                src={src}
                className={`${className} object-cover`}
                alt={name}
                onError={() => setImgErrors(prev => ({ ...prev, [src!]: true }))}
            />
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F6F9] animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40 shadow-sm/50 backdrop-blur-xl bg-white/90">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onClose}
                        className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 text-slate-600 font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                            <UtensilsCrossed className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">Kitchen Monitor</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Processing</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-slate-600 font-bold border border-slate-200">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{order.elapsedMinutes}m elapsed</span>
                    </div>
                    <span className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs border bg-white shadow-sm ${order.status === LiveOrderStatus.PENDING ? 'text-orange-500 border-orange-100' :
                            order.status === LiveOrderStatus.PREPARING ? 'text-blue-500 border-blue-100' :
                                'text-emerald-500 border-emerald-100'
                        }`}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Order Items (8/12) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Customer Card */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-6">
                        <SafeAvatar
                            src={order.customerAvatar}
                            name={order.customerName}
                            className="w-16 h-16 rounded-2xl shadow-md border-2 border-white"
                            fallbackClass="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl"
                        />
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 mb-1">{order.customerName}</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{order.id.split('-').pop()}</span>
                                <span>•</span>
                                <span>{order.items.length} Items</span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs">Line Items</h3>
                            <span className="text-slate-400 text-xs font-bold">{order.items.filter(i => i.status === 'Ready').length}/{order.items.length} Ready</span>
                        </div>

                        {order.items.map((item, idx) => (
                            <div
                                key={idx}
                                className={`group bg-white rounded-[2rem] p-6 border transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 ${item.status === 'Ready' ? 'border-emerald-100 shadow-emerald-500/5 ring-1 ring-emerald-500/20' :
                                        item.status === 'Cooking' ? 'border-blue-100 shadow-blue-500/5 ring-1 ring-blue-500/20' :
                                            'border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-700 text-xl shadow-inner">
                                            {item.qty}x
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-extrabold text-slate-800 mb-1">{item.name}</h4>
                                            {item.notes ? (
                                                <p className="text-orange-500 text-sm font-bold flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg inline-block mt-1">
                                                    <AlertCircle className="w-3.5 h-3.5" /> {item.notes}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400 text-sm font-medium">No special instructions</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        {(!item.status || item.status === 'Pending') && (
                                            <button
                                                onClick={() => handleUpdateItemStatus(idx, 'Cooking')}
                                                className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-blue-100"
                                            >
                                                <Flame className="w-4 h-4" /> Start Cooking
                                            </button>
                                        )}
                                        {item.status === 'Cooking' && (
                                            <button
                                                onClick={() => handleUpdateItemStatus(idx, 'Ready')}
                                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 animate-pulse"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Mark Ready
                                            </button>
                                        )}
                                        {item.status === 'Ready' && (
                                            <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-emerald-100">
                                                <Check className="w-4 h-4" /> Ready to Serve
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chef Row */}
                                <div className="bg-slate-50/60 rounded-2xl p-4 flex items-center gap-5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-wider">
                                        <ChefHat className="w-4 h-4" /> Assigned:
                                    </div>
                                    <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center">
                                        {chefs.map(chef => (
                                            <button
                                                key={chef.id}
                                                onClick={() => handleAssignChef(idx, chef.id)}
                                                className={`flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full border transition-all whitespace-nowrap group/chef ${item.chefId === chef.id
                                                        ? 'bg-white text-slate-800 border-primary/30 shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-slate-50'
                                                        : 'bg-white text-slate-500 border-transparent hover:border-slate-200 hover:shadow-sm opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <SafeAvatar
                                                    src={chef.avatar}
                                                    name={chef.name}
                                                    className="w-7 h-7 rounded-full bg-slate-100"
                                                    fallbackClass="bg-slate-200 text-slate-600"
                                                />
                                                <span className="text-xs font-bold">{chef.name}</span>
                                            </button>
                                        ))}
                                        {chefs.length === 0 && <span className="text-slate-400 text-xs italic">No chefs on duty</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Metrics & Info (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-32">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-6">Live Metrics</h3>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between text-slate-600 text-sm font-bold mb-2">
                                    <span>Preparation Status</span>
                                    <span>{Math.round((order.items.filter(i => i.status === 'Ready').length / order.items.length) * 100)}%</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-rose-400 transition-all duration-500 shadow-sm"
                                        style={{ width: `${Math.max(5, (order.items.filter(i => i.status === 'Ready').length / order.items.length) * 100)}%` }} // Min 5% for visual
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center group hover:bg-slate-100 transition-colors">
                                    <div className="text-4xl font-black text-slate-800 mb-1">{order.items.length}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Items</div>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 text-center group hover:bg-blue-100 transition-colors">
                                    <div className="text-4xl font-black text-blue-500 mb-1">{order.items.filter(i => i.status === 'Cooking').length}</div>
                                    <div className="text-[10px] uppercase font-bold text-blue-400">Active Cooking</div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Staff Activity</h4>
                                <div className="space-y-4">
                                    {chefs.map(chef => (
                                        <div key={chef.id} className="flex items-center justify-between p-4 rounded-3xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <SafeAvatar
                                                    src={chef.avatar}
                                                    name={chef.name}
                                                    className="w-12 h-12 rounded-2xl shadow-sm"
                                                    fallbackClass="bg-slate-200 text-slate-600 text-sm"
                                                />
                                                <div>
                                                    <div className="text-slate-800 font-bold text-sm group-hover:text-primary transition-colors">{chef.name}</div>
                                                    <div className="text-slate-400 text-[10px] font-bold uppercase">{chef.role}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white border border-slate-200 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black text-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                                                {order.items.filter(i => i.chefId === chef.id).length}
                                            </div>
                                        </div>
                                    ))}
                                    {chefs.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No chefs currently active</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KitchenDetailModal;
