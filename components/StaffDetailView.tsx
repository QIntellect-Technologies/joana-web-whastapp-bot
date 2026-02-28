import React, { useState } from 'react';
import {
    X, Users, Clock, Star, Award, TrendingUp, AlertTriangle,
    Receipt, CalendarDays, Shield, FileText, Download,
    Edit, Trash2, Calendar, Phone, Mail, MapPin,
    ChevronRight, ArrowUpRight, ArrowDownRight, Activity, ArrowLeft,
    CheckCircle2, Target, Flame, Heart, Sparkles, Share2, Plus
} from 'lucide-react';
import { StaffMember, AttendanceRecord, StaffRole } from '../types';

interface StaffDetailViewProps {
    staff: StaffMember;
    onClose: () => void;
    onUpdate: (updatedStaff: StaffMember) => void;
    onDelete?: (staffId: string) => void;
}

const StaffDetailView: React.FC<StaffDetailViewProps> = ({ staff, onClose, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERFORMANCE' | 'ATTENDANCE' | 'FINANCIALS' | 'DOCUMENTS' | 'SYSTEM'>('OVERVIEW');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<StaffMember>({ ...staff });

    const handleSave = () => {
        onUpdate(editForm);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm({ ...staff });
        setIsEditing(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'On Leave': 'bg-amber-50 text-amber-600 border-amber-100',
            Suspended: 'bg-red-50 text-red-600 border-red-100',
            Disabled: 'bg-slate-50 text-slate-600 border-slate-100'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${colors[status as keyof typeof colors] || colors.Disabled}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-white w-full h-full rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-fade-in-up relative">

            {/* Navigation Header */}
            <div className="px-8 pt-8 flex items-center justify-between">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Staff List
                </button>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-600 shadow-lg shadow-primary/30 transition-all"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="p-3 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all border border-slate-100">
                                <Share2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (onDelete && window.confirm(`Are you sure you want to delete ${staff.name}?`)) {
                                        onDelete(staff.id);
                                    }
                                }}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Header Section */}
            <div className="relative p-8 overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50"></div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-xl group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100"></div>
                        <img src={staff.avatar} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white relative z-10" alt={staff.name} />
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white shadow-lg z-20 ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="text-4xl font-black text-slate-800 font-display tracking-tight bg-white border-2 border-primary/20 rounded-2xl px-4 py-2 outline-none focus:border-primary transition-all w-full md:w-auto"
                                    placeholder="Employee Name"
                                />
                            ) : (
                                <h2 className="text-5xl font-black text-slate-800 font-display tracking-tight">{staff.name}</h2>
                            )}

                            {isEditing ? (
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                    className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider outline-none focus:border-primary transition-all"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Disabled">Disabled</option>
                                </select>
                            ) : (
                                <StatusBadge status={staff.status} />
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {isEditing ? (
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                    className="bg-primary/5 text-primary px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[10px] border border-primary/10"
                                >
                                    {Object.values(StaffRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[10px]">{staff.role}</span>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-bold">SID: {staff.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-bold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Since {new Date(staff.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-8">
                            <div className="flex items-center gap-3 text-slate-600 group">
                                <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="text-sm font-black bg-white border border-slate-200 rounded-lg px-3 py-1 outline-none focus:border-primary"
                                    />
                                ) : (
                                    <span className="text-sm font-black">{staff.phone}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 group">
                                <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="text-sm font-black bg-white border border-slate-200 rounded-lg px-3 py-1 outline-none focus:border-primary"
                                    />
                                ) : (
                                    <span className="text-sm font-black">{staff.email}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl flex flex-col items-center justify-center min-w-[200px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Overall Score</p>
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - staff.metrics.rating / 5)} className="text-primary transition-all duration-1000 ease-out" />
                            </svg>
                            <span className="absolute text-2xl font-black text-slate-800">{staff.metrics.rating}</span>
                        </div>
                        <div className="flex gap-1 mt-3">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= staff.metrics.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 border-y border-slate-100 bg-slate-50/50">
                {[
                    { label: 'Success Rate', value: `${staff.metrics.successRate}%`, sub: 'Accuracy', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Avg Prep', value: `${staff.metrics.avgPrepTime}m`, sub: 'Speed', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Lifetime Orders', value: staff.metrics.lifetimeOrders, sub: 'Total', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    {
                        label: 'Monthly Salary',
                        value: isEditing ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">SAR</span>
                                <input
                                    type="number"
                                    value={editForm.financials.salary}
                                    onChange={(e) => setEditForm({ ...editForm, financials: { ...editForm.financials, salary: Number(e.target.value) } })}
                                    className="w-24 bg-white border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-primary text-sm font-black"
                                />
                            </div>
                        ) : formatCurrency(staff.financials.salary),
                        sub: 'Base',
                        icon: Receipt,
                        color: 'text-slate-800',
                        bg: 'bg-slate-800/10'
                    },
                    { label: 'Mistakes', value: staff.metrics.mistakes, sub: 'Loss Impact', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="p-6 border-r border-slate-100 hover:bg-white transition-all group">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800">{stat.value}</span>
                            <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 border-r border-slate-100 bg-white p-6 space-y-2 overflow-y-auto hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Menu Profile</p>
                    {[
                        { id: 'OVERVIEW', label: 'Overview Dashboard', icon: Activity },
                        { id: 'PERFORMANCE', label: 'Performance Analytics', icon: TrendingUp },
                        { id: 'ATTENDANCE', label: 'Attendance & Shifts', icon: CalendarDays },
                        { id: 'FINANCIALS', label: 'Payroll & Financials', icon: Receipt },
                        { id: 'DOCUMENTS', label: 'Documents & Compliance', icon: FileText },
                        { id: 'SYSTEM', label: 'System Access Log', icon: Shield }
                    ].map(nav => (
                        <button
                            key={nav.id}
                            onClick={() => setActiveTab(nav.id as any)}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all group ${activeTab === nav.id ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <nav.icon className={`w-4 h-4 transition-colors ${activeTab === nav.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                                {nav.label}
                            </div>
                            {activeTab === nav.id && <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}

                    <div className="pt-8 mt-8 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Quick Actions</p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all border ${isEditing ? 'bg-primary text-white border-primary shadow-lg' : 'text-slate-600 hover:bg-slate-50 hover:border-slate-100'}`}
                        >
                            <Edit className={`w-4 h-4 ${isEditing ? 'text-white' : 'text-blue-500'}`} />
                            {isEditing ? 'Currently Editing...' : 'Edit Staff Details'}
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm(`Suspend account for ${staff.name}?`)) {
                                    onUpdate({ ...staff, status: 'Suspended' });
                                }
                            }}
                            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                        >
                            <AlertTriangle className="w-4 h-4" /> Suspend Account
                        </button>
                    </div>
                </div>

                {/* Content View */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-10 animate-fade-in-up">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <Flame className="w-20 h-20 text-orange-500" />
                                    </div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Today's Pulse</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Orders Processed</p>
                                                <p className="text-4xl font-black text-slate-800">{staff.metrics.ordersToday}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    12%
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold">peak performance</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-orange-400 to-primary h-full rounded-full animate-width-fill" style={{ width: '75%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <Heart className="w-20 h-20 text-red-500" />
                                    </div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Worker Health</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Perfect Attendance</p>
                                                <p className="text-4xl font-black text-slate-800">100%</p>
                                            </div>
                                            <Target className="w-10 h-10 text-emerald-500/20" />
                                        </div>
                                        <div className="flex gap-2">
                                            {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
                                                <div key={i} className="flex-1 h-2 rounded-full bg-emerald-500"></div>
                                            ))}
                                            <div className="flex-1 h-2 rounded-full bg-slate-100"></div>
                                            <div className="flex-1 h-2 rounded-full bg-slate-100"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform">
                                        <Sparkles className="w-24 h-24 text-primary" />
                                    </div>
                                    <h4 className="text-primary font-black text-[10px] uppercase tracking-widest mb-4">Skill Matrix</h4>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {['Speed Expert', 'Punctual', 'Accuracy King', 'Team Player'].map(tag => (
                                                <span key={tag} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white font-black uppercase tracking-wider">{tag}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Next Milestone: <span className="text-white font-bold">500 Total Orders</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Two Column Layout for Trends & Actions */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* Recent Activity Timeline */}
                                <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                            <Activity className="w-5 h-5 text-primary" />
                                            Operation Stream
                                        </h4>
                                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">View All History</button>
                                    </div>
                                    <div className="space-y-8">
                                        {staff.systemAccess.recentActions.map((action, i) => (
                                            <div key={i} className="flex gap-6 relative">
                                                {i !== staff.systemAccess.recentActions.length - 1 && (
                                                    <div className="absolute left-3 top-8 bottom-0 w-px bg-slate-100"></div>
                                                )}
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border-4 border-white shadow-sm z-10 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-sm font-black text-slate-800">{action.action}</p>
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">{action.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills & Badges */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex flex-col items-center text-center">
                                    <Award className="w-16 h-16 text-yellow-400 mb-6 animate-bounce-slow" />
                                    <h4 className="text-lg font-black text-slate-800 mb-2">Top Performer</h4>
                                    <p className="text-sm text-slate-500 font-medium mb-8">This employee is in the top 5% of all staff in this branch.</p>

                                    <div className="w-full space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-slate-800">Verified ID</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">Completed Oct 2023</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between opacity-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <Target className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-slate-800">Senior Staff</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">2 Months remaining</p>
                                                </div>
                                            </div>
                                            <Clock className="w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other tabs remain similar but with page layout styling */}
                    {activeTab === 'PERFORMANCE' && (
                        <div className="space-y-10 animate-fade-in-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <h4 className="text-xl font-black text-slate-800 mb-8 flex justify-between items-center">
                                        Quality Metrics
                                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg">
                                            <Activity className="w-3 h-3" /> Live
                                        </span>
                                    </h4>
                                    <div className="space-y-8">
                                        {[
                                            { label: 'Order Accuracy', value: staff.metrics.successRate, color: 'bg-emerald-500', icon: Target },
                                            { label: 'Preparation Speed', value: 92, color: 'bg-blue-500', icon: Clock },
                                            { label: 'Customer Rating', value: (staff.metrics.customerSatisfaction / 5) * 100, color: 'bg-indigo-500', icon: Heart },
                                            { label: 'Wastage Efficiency', value: 88, color: 'bg-orange-500', icon: Flame }
                                        ].map((metric, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <metric.icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{metric.label}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800">{metric.value.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                                    <div
                                                        className={`${metric.color} h-full rounded-full transition-all duration-1000 ease-out`}
                                                        style={{ width: `${metric.value}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                                                <Award className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white">AI Copilot Analysis</h4>
                                                <p className="text-slate-400 text-xs font-bold">Dynamic performance coaching</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex gap-4 hover:bg-white/10 transition-colors">
                                                <Star className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-black text-white mb-1">Exceptional Punctuality</p>
                                                    <p className="text-xs text-slate-400 leading-relaxed">Staff has been early to 95% of shifts this month. Consider for a 'Consistency Reward'.</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex gap-4 hover:bg-white/10 transition-colors">
                                                <TrendingUp className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-black text-white mb-1">Growth Potential</p>
                                                    <p className="text-xs text-slate-400 leading-relaxed">Prep time has decreased by 15s/order compared to last month. Speed is trending upwards.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs during refactor - logic remains same as original but matching the new theme */}
                    {activeTab === 'ATTENDANCE' && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Re-using existing attendance logic but with polished UI */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: 'Total Present', val: '22', color: 'text-slate-800', sub: 'Days this month' },
                                    { label: 'Late Arrival', val: '02', color: 'text-orange-500', sub: 'Avg 5 mins late' },
                                    { label: 'Absences', val: '00', color: 'text-emerald-500', sub: 'Perfect record!' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.label}</p>
                                        <p className={`text-5xl font-black ${item.color}`}>{item.val}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2">{item.sub}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Table */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Shift Date</th>
                                            <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Entry Time</th>
                                            <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Exit Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {staff.attendance.map((record, i) => (
                                            <tr key={i} className="hover:bg-slate-50/20 transition-colors group">
                                                <td className="px-10 py-6 text-sm font-black text-slate-700">{new Date(record.date).toLocaleDateString()}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-sm font-bold text-slate-800">{record.checkIn}</td>
                                                <td className="px-10 py-6 text-sm font-bold text-slate-800">{record.checkOut}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'FINANCIALS' && (
                        <div className="space-y-10 animate-fade-in-up">
                            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px]"></div>
                                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-12">
                                    <div className="text-center xl:text-left">
                                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Total Net Payable</p>
                                        <h3 className="text-7xl font-black tracking-tight mb-6">
                                            {formatCurrency(staff.financials.salary + staff.financials.bonuses - staff.financials.penalties)}
                                        </h3>
                                        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4">
                                            <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-primary uppercase border border-white/10 tracking-widest">Jan 2026 Cycle</span>
                                            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Verified by Payroll
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 w-full xl:w-auto">
                                        {[
                                            { label: 'Base', val: staff.financials.salary, color: 'text-white' },
                                            { label: 'Bonus', val: staff.financials.bonuses, color: 'text-emerald-400' },
                                            { label: 'Deduct', val: staff.financials.penalties, color: 'text-red-400' }
                                        ].map((p, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center min-w-[140px] group hover:bg-white/10 transition-colors">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.label}</p>
                                                <p className={`text-lg font-black ${p.color}`}>{formatCurrency(p.val)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center justify-between">
                                    Payroll Archive
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all border border-slate-100">
                                        <Download className="w-4 h-4" /> Export Ledger
                                    </button>
                                </h4>
                                <div className="space-y-4">
                                    {staff.financials.history.map((record, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white/70">{record.month.split('-')[0]}</span>
                                                    <span className="text-lg font-black">{record.month.split('-')[1]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{new Date(record.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction Ref: #PRL-{staff.id}-{i + 100}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-800">{formatCurrency(record.base + record.bonus - record.penalty)}</p>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${record.status === 'Paid' ? 'text-emerald-500' : 'text-orange-500'}`}>{record.status}</span>
                                                </div>
                                                <button className="p-4 bg-slate-50 text-slate-400 hover:text-primary rounded-2xl transition-all group-hover:bg-white group-hover:shadow-md">
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === 'DOCUMENTS' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                        Compliance Matrix
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Verified</span>
                                    </h4>
                                    <p className="text-sm text-slate-500 font-medium">Digital archives of legal, health, and identity documentation.</p>
                                </div>
                                <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform">
                                    <Plus className="w-4 h-4" /> Upload Document
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {staff.documents.map((doc, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                        <div className={`p-5 rounded-2xl flex-shrink-0 transition-colors ${doc.status === 'Expired' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-black text-lg text-slate-800">{doc.name}</h5>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${doc.status === 'Valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 mb-6">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Exp: {doc.expiryDate || 'Permanent'}</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span>{doc.type}</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">View</button>
                                                <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-2">
                                                    <Download className="w-3.5 h-3.5" /> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SYSTEM TAB */}
                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center shadow-inner">
                                            <Shield className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800">Security & Privileges</h4>
                                            <p className="text-sm text-slate-500 font-bold">Encrypted access control and audit trails.</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Active Session</p>
                                        <p className="text-sm font-black text-slate-800">{new Date(staff.systemAccess.lastActive).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Functional Permissions</h5>
                                        <div className="flex flex-wrap gap-3">
                                            {staff.systemAccess.permissions.map((perm, i) => (
                                                <span key={i} className="px-5 py-2.5 bg-indigo-50/50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                                                    {perm}
                                                </span>
                                            ))}
                                            <button className="px-5 py-2.5 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 border-dashed hover:border-primary hover:bg-primary/5 transition-all">
                                                Manage Access
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-50">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Device Fingerprints</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { device: 'Admin Terminal - POS 01', ip: '192.168.1.45', os: 'Windows 11', status: 'Primary' },
                                                { device: 'Manager Mobile - iPhone 15', ip: '110.45.2.11', os: 'iOS 17.4', status: 'Mobile' }
                                            ].map((device, i) => (
                                                <div key={i} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800">{device.device}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{device.os} • IP: {device.ip}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">{device.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDetailView;
