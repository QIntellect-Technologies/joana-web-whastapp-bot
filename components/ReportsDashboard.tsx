import React, { useState, useEffect } from 'react';
import { DateRange, ReportsService, ReportData } from '../services/ReportsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2 } from 'lucide-react';
import { Branch } from '../types';

interface ReportsDashboardProps {
    branch?: Branch; // Optional: if null, show global stats (Super Admin)
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ branch }) => {
    const [dateRange, setDateRange] = useState<DateRange>('Last 7 Days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await ReportsService.fetchSalesReport(
                branch?.id,
                dateRange,
                dateRange === 'Custom' ? customStart : undefined,
                dateRange === 'Custom' ? customEnd : undefined
            );
            setReportData(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load report data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange !== 'Custom' || (customStart && customEnd)) {
            fetchReport();
        }
    }, [dateRange, customStart, customEnd, branch]);

    const handleExport = () => {
        if (!reportData) return;
        const fileName = `Sales_Report_${branch ? branch.name : 'Global'}_${new Date().toISOString().split('T')[0]}`;
        ReportsService.generateExcel(reportData.tableData, fileName);
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 font-display">Performance Overview</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        {branch ? `Deep insights for ${branch.name}` : 'Global Metrics'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex items-center">
                        {(['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time'] as DateRange[]).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === range ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={!reportData || loading}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>

                    <button
                        onClick={fetchReport}
                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold text-center">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <SummaryCard
                        title="Total Revenue"
                        value={`SAR ${reportData.summary.totalRevenue.toLocaleString()}`}
                        trend="+12.5%"
                        isPositive={true}
                    />
                    <SummaryCard
                        title="Total Orders"
                        value={reportData.summary.totalOrders.toString()}
                        trend="+5.2%"
                        isPositive={true}
                    />
                    <SummaryCard
                        title="New Users"
                        value={reportData.summary.newUsers.toString()}
                        trend="+8.1%"
                        isPositive={true}
                    />
                    <SummaryCard
                        title="Avg. Order Value"
                        value={`SAR ${reportData.summary.avgOrderValue.toFixed(2)}`}
                        trend="-2.4%"
                        isPositive={false}
                    />
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Sales Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 font-display">Revenue Trend</h3>
                    <div className="h-[300px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
                        ) : reportData?.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={reportData.chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                        )}
                    </div>
                </div>

                {/* Popular Items (Placeholder/Mock for now or computed) */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 font-display">Top Performing Items</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">{i}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">Menu Item {i}</p>
                                    <p className="text-xs text-slate-400 font-medium">124 Orders</p>
                                </div>
                                <div className="text-sm font-bold text-slate-800">SAR 450</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, trend, isPositive }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <div className="flex items-end justify-between">
            <h4 className="text-2xl font-extrabold text-slate-800 font-display">{value}</h4>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
            </div>
        </div>
    </div>
);

export default ReportsDashboard;
