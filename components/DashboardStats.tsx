import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, Branch, TimeRange } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, BarChart, Bar, Legend
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingBag, Activity, Bot, Mic, Globe,
  AlertTriangle, Calendar, Server, FileText, ArrowUpRight, ArrowDownRight,
  Zap, Star, XCircle, Users, Percent, Building2, CheckCircle2
} from 'lucide-react';

interface DashboardStatsProps {
  menuItems: MenuItem[];
  branches: Branch[];
  branchId?: string | null;
}

// --- DYNAMIC DATA GENERATORS ---

const generateTrendData = (range: TimeRange) => {
  const data = [];
  let points = 12;

  if (range === 'Today' || range === 'Yesterday') { points = 12; }
  else if (range === 'Last Week') { points = 7; }
  else if (range === 'Month') { points = 15; }
  else { points = 10; }

  for (let i = 0; i < points; i++) {
    let name = '';
    if (range === 'Today' || range === 'Yesterday') name = `${10 + i}:00`;
    else if (range === 'Last Week') name = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
    else name = `Day ${i * 2 + 1}`;

    // Randomize based on range to simulate real data changes
    const multiplier = (range === 'Today' || range === 'Yesterday') ? 1 : range === 'Last Week' ? 8 : 25;

    const baseRevenue = (Math.floor(Math.random() * 1500) + 800) * multiplier;
    const baseOrders = (Math.floor(Math.random() * 80) + 20) * multiplier;
    const voiceOrders = Math.floor(baseOrders * (0.2 + Math.random() * 0.15));
    const cancelled = Math.floor(baseOrders * 0.05);

    data.push({
      name,
      revenue: baseRevenue,
      orders: baseOrders,
      voice: voiceOrders,
      avgValue: Math.floor(baseRevenue / baseOrders),
      cancelled: cancelled,
      satisfaction: 4 + Math.random(),
      predictedRevenue: baseRevenue * (1 + (Math.random() * 0.2)) // AI Prediction: +0-20% higher
    });
  }
  return data;
};

// Generate data specific to comparison branches
const generateComparisonData = (selectedBranchIds: string[], branches: Branch[], range: TimeRange) => {
  const data = [];
  let points = (range === 'Today' || range === 'Yesterday') ? 8 : 7;

  for (let i = 0; i < points; i++) {
    let name = '';
    if (range === 'Today' || range === 'Yesterday') name = `${12 + i}:00`;
    else name = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];

    const point: any = { name };

    selectedBranchIds.forEach(id => {
      const branch = branches.find(b => b.id === id);
      if (branch) {
        // Create deterministic-looking random data seeded by branch ID char code
        const seed = branch.name.charCodeAt(0);
        const baseVal = (seed % 10) * 100 + 500;
        const variance = Math.floor(Math.random() * 300);

        point[`${id}_revenue`] = baseVal + variance;
        point[`${id}_orders`] = Math.floor((baseVal + variance) / 25);
      }
    });
    data.push(point);
  }
  return data;
};

const generateHeatmapData = (range: TimeRange) => {
  const randomVal = () => Math.floor(Math.random() * 40) + 60;
  return [
    { time: '12PM - 3PM', intensity: (range === 'Today' || range === 'Yesterday') ? 'High' : 'Medium', value: randomVal() },
    { time: '3PM - 6PM', intensity: 'Medium', value: randomVal() - 20 },
    { time: '6PM - 9PM', intensity: 'Very High', value: randomVal() + 10 },
    { time: '9PM - 12AM', intensity: range === 'Last Week' ? 'High' : 'Medium', value: randomVal() - 10 },
  ];
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ menuItems, branches, branchId }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders' | 'voice' | 'avgValue' | 'cancelled' | 'satisfaction'>('revenue');

  // Branch Comparison State
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  // Initialize comparison with first 2 branches
  useEffect(() => {
    if (branches.length > 0 && comparisonIds.length === 0 && !branchId) {
      setComparisonIds(branches.slice(0, 2).map(b => b.id));
    }
  }, [branches, branchId]);

  // --- REAL-TIME DATA CALCULATION ---

  const trendData = useMemo(() => generateTrendData(timeRange), [timeRange, customDate]);
  const comparisonData = useMemo(() => generateComparisonData(comparisonIds, branches, timeRange), [comparisonIds, branches, timeRange, customDate]);
  const peakHours = useMemo(() => generateHeatmapData(timeRange), [timeRange, customDate]);

  const kpiData = useMemo(() => {
    const totalRev = trendData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalOrders = trendData.reduce((acc, curr) => acc + curr.orders, 0);
    const totalVoice = trendData.reduce((acc, curr) => acc + curr.voice, 0);
    const totalCancelled = trendData.reduce((acc, curr) => acc + curr.cancelled, 0);
    const avgSatisfaction = (trendData.reduce((acc, curr) => acc + curr.satisfaction, 0) / trendData.length).toFixed(1);
    const avgOrderVal = (totalRev / totalOrders).toFixed(2);

    // Branch stats
    const activeBranches = branchId ? (branches.find(b => b.id === branchId)?.status === 'Active' ? 1 : 0) : branches.filter(b => b.status === 'Active').length;
    const totalBranchCount = branchId ? 1 : branches.length;

    return {
      revenue: { value: `$${(totalRev).toLocaleString()}`, growth: '+12.5%', isUp: true },
      orders: { value: totalOrders.toLocaleString(), growth: '+5.2%', isUp: true },
      voice: { value: totalVoice.toLocaleString(), growth: '+8.4%', isUp: true },
      avgValue: { value: `$${avgOrderVal}`, growth: '-1.2%', isUp: false },
      cancelled: { value: totalCancelled.toLocaleString(), growth: '-5%', isUp: true },
      satisfaction: { value: avgSatisfaction, growth: '+0.2', isUp: true },
      branches: { value: `${activeBranches}/${totalBranchCount}`, sub: branchId ? 'Branch Active' : 'Operational' }
    };
  }, [trendData, branches, branchId]);

  const categoryPerformance = [
    { subject: 'Burgers', A: 120, B: 110, fullMark: 150 },
    { subject: 'Wraps', A: 98, B: 130, fullMark: 150 },
    { subject: 'Sandwich', A: 86, B: 130, fullMark: 150 },
    { subject: 'Meals', A: 99, B: 100, fullMark: 150 },
    { subject: 'Sides', A: 85, B: 90, fullMark: 150 },
    { subject: 'Drinks', A: 65, B: 85, fullMark: 150 },
  ];

  // Colors for comparison lines
  const COLORS = ['#0ea5e9', '#8b5cf6', '#f97316', '#10b981', '#f43f5e'];

  const toggleBranchComparison = (id: string) => {
    setComparisonIds(prev =>
      prev.includes(id)
        ? prev.filter(bid => bid !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">

      {/* --- HEADER & GLOBAL FILTER --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {branchId ? `${branches.find(b => b.id === branchId)?.name} Command Center` : 'Command Center'}
          </h2>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            System Live • Updating {timeRange} data
          </p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase px-2 hidden sm:block">Date Filter:</span>
          {(['Today', 'Yesterday', 'Last Week', 'Month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${timeRange === range
                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              {range}
            </button>
          ))}

          <div className="relative group">
            <button
              onClick={() => setTimeRange('Custom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${timeRange === 'Custom' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
            {timeRange === 'Custom' && (
              <div className="absolute right-0 top-full mt-2 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-50 w-64 animate-pop">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Select Range</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold">Start Date</label>
                    <input
                      type="date"
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-primary"
                      onChange={(e) => setCustomDate({ ...customDate, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold">End Date</label>
                    <input
                      type="date"
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-primary"
                      onChange={(e) => setCustomDate({ ...customDate, end: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (customDate.start && customDate.end) {
                        setTimeRange('Custom');
                        // No extra trigger needed now that customDate is in useMemo dependencies
                      }
                    }}
                    className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg mt-2 hover:bg-sky-600 transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- 1. AI INSIGHTS --- */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-1 shadow-lg shadow-indigo-500/20">
        <div className="bg-white/10 backdrop-blur-sm rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-white/5 rotate-12">
            <Bot className="w-48 h-48" />
          </div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">AI Prediction: High Demand Expected</h3>
              <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                Analysis of <span className="font-semibold text-white">{timeRange}</span> data indicates a potential <strong>35% surge</strong> in orders for Riyadh Branch during evening hours. Consider increasing staff availability.
              </p>
            </div>
          </div>
          <button className="relative z-10 whitespace-nowrap bg-white text-indigo-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            View Action Plan
          </button>
        </div>
      </div>

      {/* --- 2. EXPANDED KPI GRID (Now 7 Cards including Branches) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {/* Card 0: Total Branches (New) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Branches</p>
          <h3 className="text-xl font-extrabold text-slate-800">{kpiData.branches.value}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpiData.branches.sub}</p>
        </div>

        {/* Existing KPI Cards */}
        {[
          { key: 'revenue', icon: DollarSign, color: 'blue', label: 'Revenue' },
          { key: 'orders', icon: ShoppingBag, color: 'purple', label: 'Total Orders' },
          { key: 'voice', icon: Mic, color: 'orange', label: 'Voice Orders' },
          { key: 'avgValue', icon: Percent, color: 'cyan', label: 'Avg Order Val' },
          { key: 'cancelled', icon: XCircle, color: 'red', label: 'Cancelled' },
          { key: 'satisfaction', icon: Star, color: 'yellow', label: 'Satisfaction' },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setActiveMetric(item.key as any)}
            className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 group ${activeMetric === item.key
              ? 'bg-slate-800 text-white border-slate-800 ring-4 ring-slate-100'
              : `bg-white border-slate-100 hover:border-${item.color}-300 hover:shadow-md`
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${activeMetric === item.key ? 'bg-white/20' : `bg-${item.color}-50 text-${item.color}-500`}`}>
                <item.icon className={`w-5 h-5 ${item.key === 'satisfaction' ? 'fill-current' : ''}`} />
              </div>
              <span className={`text-xs font-bold ${
                // @ts-ignore
                kpiData[item.key].isUp ? 'text-emerald-400' : 'text-red-400'
                } flex items-center`}>
                {/* @ts-ignore */}
                {kpiData[item.key].isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {/* @ts-ignore */}
                {kpiData[item.key].growth}
              </span>
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeMetric === item.key ? 'text-slate-400' : 'text-slate-400'}`}>{item.label}</p>
            {/* @ts-ignore */}
            <h3 className="text-xl font-extrabold">{kpiData[item.key].value}{item.key === 'satisfaction' && '/5'}</h3>
          </div>
        ))}
      </div>

      {/* --- 3. MAIN ANALYTICS ROW --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${activeMetric === 'revenue' ? 'bg-blue-500' :
                  activeMetric === 'orders' ? 'bg-purple-500' :
                    activeMetric === 'voice' ? 'bg-orange-500' :
                      activeMetric === 'cancelled' ? 'bg-red-500' :
                        activeMetric === 'satisfaction' ? 'bg-yellow-500' : 'bg-cyan-500'
                  }`}></span>
                {activeMetric} Analysis
              </h3>
              <p className="text-slate-500 text-xs">Timeline view based on selected range</p>
            </div>
            <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
              Download Report
            </button>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={
                      activeMetric === 'revenue' ? '#0ea5e9' :
                        activeMetric === 'orders' ? '#8b5cf6' :
                          activeMetric === 'voice' ? '#f97316' :
                            activeMetric === 'cancelled' ? '#ef4444' :
                              activeMetric === 'satisfaction' ? '#eab308' : '#06b6d4'
                    } stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={
                    activeMetric === 'revenue' ? '#0ea5e9' :
                      activeMetric === 'orders' ? '#8b5cf6' :
                        activeMetric === 'voice' ? '#f97316' :
                          activeMetric === 'cancelled' ? '#ef4444' :
                            activeMetric === 'satisfaction' ? '#eab308' : '#06b6d4'
                  }
                  strokeWidth={3}
                  fill="url(#colorMetric)"
                />
                {activeMetric === 'revenue' && (
                  <Area
                    type="monotone"
                    dataKey="predictedRevenue"
                    stroke="#818cf8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="AI Prediction"
                  />
                )}

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Category Performance</h3>
          <p className="text-slate-500 text-xs mb-4">Sales vs Rating</p>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryPerformance}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Sales" dataKey="A" stroke="#0ea5e9" strokeWidth={2} fill="#0ea5e9" fillOpacity={0.4} />
                <Radar name="Rating" dataKey="B" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.4} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- 4. OPERATIONAL HEATMAP & SYSTEM --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 rounded-lg text-red-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Operational Intensity</h3>
              <p className="text-xs text-slate-500">Peak hours for {timeRange}</p>
            </div>
          </div>
          <div className="space-y-4">
            {peakHours.map((slot, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>{slot.time}</span>
                  <span className={`${slot.intensity === 'Very High' ? 'text-red-500' : slot.intensity === 'High' ? 'text-orange-500' : 'text-blue-500'}`}>
                    {slot.intensity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${slot.intensity === 'Very High' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                      slot.intensity === 'High' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                        'bg-gradient-to-r from-blue-400 to-indigo-400'
                      }`}
                    style={{ width: `${slot.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">System Activity</h3>
                <p className="text-xs text-slate-500">Live logs & Health</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-600">Healthy</span>
            </div>
          </div>

          <div className="space-y-0 overflow-y-auto max-h-[200px] no-scrollbar pr-2">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">Menu Price Update</p>
                  <p className="text-xs text-slate-400">Riyadh Branch • Admin User</p>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {timeRange === 'Today' ? `10:${30 + i} AM` : '2h ago'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- 5. BRANCH COMPARISON MODULE (Hide for Owners) --- */}
      {!branchId && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-lg shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
          {/* Background Decorative */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Branch Comparison</h3>
                <p className="text-slate-500 font-medium">Compare performance metrics across multiple locations simultaneously.</p>
              </div>

              {/* Branch Toggles */}
              <div className="flex flex-wrap gap-2">
                {branches.map((branch, idx) => (
                  <button
                    key={branch.id}
                    onClick={() => toggleBranchComparison(branch.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${comparisonIds.includes(branch.id)
                      ? `bg-slate-800 text-white border-slate-800 shadow-lg`
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    style={comparisonIds.includes(branch.id) ? { backgroundColor: COLORS[idx % COLORS.length], borderColor: COLORS[idx % COLORS.length] } : {}}
                  >
                    {comparisonIds.includes(branch.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {branch.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* 5.1 Revenue Trajectory Line Chart */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  Revenue Velocity Comparison
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                      {comparisonIds.map((id, idx) => (
                        <Line
                          key={id}
                          type="monotone"
                          dataKey={`${id}_revenue`}
                          name={branches.find(b => b.id === id)?.name}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5.2 Efficiency Bar Chart */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Order Volume Efficiency
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 10 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                      {comparisonIds.map((id, idx) => (
                        <Bar
                          key={id}
                          dataKey={`${id}_orders`}
                          name={branches.find(b => b.id === id)?.name}
                          fill={COLORS[idx % COLORS.length]}
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardStats;