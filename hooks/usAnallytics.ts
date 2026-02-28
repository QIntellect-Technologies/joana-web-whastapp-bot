import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { TimeRange } from '../types';

export interface AnalyticsData {
    hourlyData: Array<{ time: string; revenue: number; orders: number; voice: number }>;
    topItems: Array<{ name: string; count: number }>;
    orderSource: Array<{ name: string; value: number; color: string }>;
    kpiData: {
        revenue: { value: string; growth: string; isUp: boolean };
        orders: { value: string; growth: string; isUp: boolean };
        voice: { value: string; growth: string; isUp: boolean };
        satisfaction: { value: string; growth: string; isUp: boolean };
    };
    intensityData: Array<{ time: string; intensity: 'Low' | 'Medium' | 'High' | 'Very High'; value: number }>;
}

export const useAnalytics = (branchId?: string | null, range: TimeRange = 'Today') => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // 1. Calculate Date Range
                const now = new Date();
                let startDate = new Date();
                if (range === 'Today') startDate.setHours(0, 0, 0, 0);
                else if (range === 'Yesterday') {
                    startDate.setDate(now.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(startDate);
                    endDate.setHours(23, 59, 59, 999);
                } else if (range === 'Last Week') startDate.setDate(now.getDate() - 7);
                else if (range === 'Month') startDate.setMonth(now.getMonth() - 1);

                // 2. Build Query
                let query = supabase
                    .from('orders')
                    .select('*, order_items(quantity, menu_items(name_en))')
                    .gte('created_at', startDate.toISOString());

                if (branchId) {
                    query = query.eq('branch_id', branchId);
                }

                const { data: orders, error } = await query;

                if (error) throw error;

                // 3. Process Data
                const hourlyMap = new Map();
                const itemMap = new Map();
                const sourceMap = { 'Mobile App': 0, 'Voice AI': 0, 'Walk-in': 0 };
                let totalRev = 0;
                let voiceOrders = 0;

                (orders || []).forEach(order => {
                    totalRev += order.total;
                    if (order.mode === 'Voice') voiceOrders++;

                    const source = order.mode === 'App' ? 'Mobile App' :
                        order.mode === 'Voice' ? 'Voice AI' : 'Walk-in';
                    sourceMap[source] = (sourceMap[source] || 0) + 1;

                    // Hourly
                    const hour = new Date(order.created_at).getHours();
                    const hourStr = `${hour}:00`;
                    const prev = hourlyMap.get(hourStr) || { revenue: 0, orders: 0, voice: 0 };
                    hourlyMap.set(hourStr, {
                        time: hourStr,
                        revenue: prev.revenue + order.total,
                        orders: prev.orders + 1,
                        voice: prev.voice + (order.mode === 'Voice' ? 1 : 0)
                    });

                    // Top Items
                    order.order_items?.forEach((oi: any) => {
                        const name = oi.menu_items?.name_en || 'Unknown';
                        itemMap.set(name, (itemMap.get(name) || 0) + oi.quantity);
                    });
                });

                // 4. Transform for Recharts
                const hourlyData = Array.from(hourlyMap.values()).sort((a, b) => parseInt(a.time) - parseInt(b.time));
                const topItems = Array.from(itemMap.entries())
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                const totalOrdersCount = orders?.length || 0;
                const orderSource = [
                    { name: 'Mobile App', value: sourceMap['Mobile App'], color: '#0ea5e9' },
                    { name: 'Voice AI', value: sourceMap['Voice AI'], color: '#f97316' },
                    { name: 'Walk-in', value: sourceMap['Walk-in'], color: '#8b5cf6' },
                ].filter(s => s.value > 0);

                // 5. Build Final Object
                setData({
                    hourlyData,
                    topItems,
                    orderSource,
                    kpiData: {
                        revenue: { value: `SAR ${totalRev.toLocaleString()}`, growth: '+12%', isUp: true },
                        orders: { value: totalOrdersCount.toLocaleString(), growth: '+5%', isUp: true },
                        voice: { value: voiceOrders.toLocaleString(), growth: '+8%', isUp: true },
                        satisfaction: { value: '4.8', growth: '+0.2', isUp: true }
                    },
                    intensityData: hourlyData.map(h => ({
                        time: h.time,
                        intensity: h.orders > 20 ? 'Very High' : h.orders > 10 ? 'High' : h.orders > 5 ? 'Medium' : 'Low',
                        value: (h.orders / 30) * 100
                    }))
                });
            } catch (err) {
                console.error('Analytics Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [branchId, range]);

    return { data, loading };
};
