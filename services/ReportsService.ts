import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export type ReportType = 'SALES' | 'USERS' | 'INVENTORY' | 'BRANCH_PERFORMANCE';
export type DateRange = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'All Time' | 'Custom';

export interface ReportData {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        newUsers: number;
        avgOrderValue: number;
    };
    chartData: Array<{ name: string; value: number }>;
    tableData: any[];
}

export const ReportsService = {
    // Helper to get date ISO strings
    getDateRange: (range: DateRange, customStart?: string, customEnd?: string) => {
        const end = new Date();
        const start = new Date();

        switch (range) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'Yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Last 7 Days':
                start.setDate(start.getDate() - 7);
                break;
            case 'Last 30 Days':
                start.setDate(start.getDate() - 30);
                break;
            case 'Custom':
                if (customStart) start.setTime(new Date(customStart).getTime());
                if (customEnd) end.setTime(new Date(customEnd).getTime());
                break;
            case 'All Time':
                start.setFullYear(2020, 0, 1); // Start from beginning of time (or reasonably far back)
                break;
        }

        return { start: start.toISOString(), end: end.toISOString() };
    },

    fetchSalesReport: async (branchId: string | undefined, range: DateRange, customStart?: string, customEnd?: string): Promise<ReportData> => {
        const { start, end } = ReportsService.getDateRange(range, customStart, customEnd);

        // 1. Fetch Orders
        let query = supabase
            .from('orders')
            .select('id, total, created_at, status, customer_id')
            .gte('created_at', start)
            .lte('created_at', end)
            .neq('status', 'Cancelled'); // Exclude cancelled

        if (branchId) query = query.eq('branch_id', branchId);

        const { data: orders, error } = await query;
        if (error) throw error;

        // 2. Calculate Summary
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 3. New Users (Approximate if 'created_at' on orders is used, but ideally from customers table)
        // For accurate "New Users", we usually query customers table
        let userQuery = supabase
            .from('customers')
            .select('id, created_at')
            .gte('created_at', start)
            .lte('created_at', end);

        const { data: newUsersData } = await userQuery;
        const newUsers = newUsersData?.length || 0;

        // 4. Chart Data (Revenue by Day)
        const chartMap = new Map<string, number>();
        orders?.forEach(o => {
            const dateStr = new Date(o.created_at).toLocaleDateString();
            chartMap.set(dateStr, (chartMap.get(dateStr) || 0) + o.total);
        });

        const chartData = Array.from(chartMap.entries()).map(([name, value]) => ({ name, value }));

        return {
            summary: { totalRevenue, totalOrders, newUsers, avgOrderValue },
            chartData,
            tableData: orders || []
        };
    },

    generateCustomerExport: (customers: any[], fileName: string) => {
        const exportData = customers.map(c => ({
            'Customer ID': c.id,
            'Name': c.name,
            'Phone': c.phone,
            'Email': c.email || 'N/A',
            'Role': c.role || 'Customer',
            'Status': c.status || 'Active',
            'Total Orders': c.totalOrders ?? c.total_orders ?? 0,
            'Total Spent': c.totalSpent ?? c.total_spent ?? 0,
            'Loyalty Points': c.loyaltyPoints ?? c.loyalty_points ?? 0,
            'First Visit': (c.joinDate || c.join_date || c.created_at) ? new Date(c.joinDate || c.join_date || c.created_at).toLocaleDateString() : 'N/A',
            'Last Visit': (c.lastInteraction || c.last_interaction) ? new Date(c.lastInteraction || c.last_interaction).toLocaleDateString() : 'N/A',
            'Visit Count': c.totalOrders ?? c.total_orders ?? 0,
            'Inactive Days': (c.lastInteraction || c.last_interaction)
                ? Math.floor((new Date().getTime() - new Date(c.lastInteraction || c.last_interaction).getTime()) / (1000 * 3600 * 24))
                : '0'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Auto-width columns
        const wscols = Object.keys(exportData[0] || {}).map(k => ({ wch: k.length + 5 }));
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    },

    generateExcel: (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    },

    generateCompleteOverviewExport: (data: {
        summary: any,
        timeline: any[],
        topItems: any[],
        sources: any[],
        activity: any[],
        lowStock: any[],
        transactions?: any[],
        customers?: any[],
        staff?: any[],
        menu?: any[]
    }, fileName: string) => {
        const workbook = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            { Metric: 'Total Revenue', Value: data.summary?.totalRevenue || 0 },
            { Metric: 'Total Orders', Value: data.summary?.totalOrders || 0 },
            { Metric: 'Avg order Value', Value: data.summary?.avgOrderValue || 0 },
            { Metric: 'Satisfaction', Value: data.summary?.satisfaction || 0 },
            { Metric: 'Revenue Trend', Value: data.summary?.revenueTrend || 'N/A' },
            { Metric: 'Orders Trend', Value: data.summary?.ordersTrend || 'N/A' }
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // 2. Performance Timeline
        if (data.timeline?.length > 0) {
            const timelineSheet = XLSX.utils.json_to_sheet(data.timeline);
            XLSX.utils.book_append_sheet(workbook, timelineSheet, "Timeline");
        }

        // 3. Transactions (Detailed List)
        if (data.transactions?.length > 0) {
            const transData = data.transactions.map(t => ({
                'Order ID': t.order_number || t.id,
                'Date': new Date(t.created_at).toLocaleDateString(),
                'Time': new Date(t.created_at).toLocaleTimeString(),
                'Total (SAR)': t.total,
                'Status': t.status,
                'Method': t.payment_method || 'Cash',
                'Mode': t.mode || 'Walk-in',
                'Items': (t.items || []).map((i: any) => `${i.name} (x${i.qty})`).join(', ')
            }));
            const transSheet = XLSX.utils.json_to_sheet(transData);
            XLSX.utils.book_append_sheet(workbook, transSheet, "Transactions");
        }

        // 4. Customers Sheet
        if (data.customers?.length > 0) {
            const custData = data.customers.map(c => ({
                'Name': c.name,
                'Email': c.email,
                'Phone': c.phone,
                'Joined': new Date(c.joinDate).toLocaleDateString(),
                'Total Orders': c.totalOrders,
                'Total Spent (SAR)': c.totalSpent,
                'Last Visit': c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : 'N/A'
            }));
            const custSheet = XLSX.utils.json_to_sheet(custData);
            XLSX.utils.book_append_sheet(workbook, custSheet, "Customers");
        }

        // 5. Staff Sheet
        if (data.staff?.length > 0) {
            const staffData = data.staff.map(s => ({
                'Name': s.name,
                'Role': s.role,
                'Status': s.status,
                'Phone': s.phone,
                'Joined': new Date(s.joinDate).toLocaleDateString()
            }));
            const staffSheet = XLSX.utils.json_to_sheet(staffData);
            XLSX.utils.book_append_sheet(workbook, staffSheet, "Staff");
        }

        // 6. Menu Sheet
        if (data.menu?.length > 0) {
            const menuData = data.menu.map(m => ({
                'Category': m.category,
                'Item Name (EN)': m.name_en,
                'Price (SAR)': m.price,
                'Stock': m.stock ?? 'N/A',
                'Status': m.status
            }));
            const menuSheet = XLSX.utils.json_to_sheet(menuData);
            XLSX.utils.book_append_sheet(workbook, menuSheet, "Menu Catalog");
        }

        // 7. Top Selling Items
        if (data.topItems?.length > 0) {
            const topItemsSheet = XLSX.utils.json_to_sheet(data.topItems);
            XLSX.utils.book_append_sheet(workbook, topItemsSheet, "Top Items");
        }

        // 8. Order Sources
        if (data.sources?.length > 0) {
            const sourcesSheet = XLSX.utils.json_to_sheet(data.sources);
            XLSX.utils.book_append_sheet(workbook, sourcesSheet, "Order Sources");
        }

        // 9. Activity Log
        if (data.activity?.length > 0) {
            const activityData = data.activity.map(a => ({
                Action: a.action || 'Order',
                Detail: a.detail || `${a.customerName} placed order`,
                Time: a.time || a.timestamp,
                User: a.user || 'System'
            }));
            const activitySheet = XLSX.utils.json_to_sheet(activityData);
            XLSX.utils.book_append_sheet(workbook, activitySheet, "Activity Log");
        }

        // 10. Low Stock Alerts
        if (data.lowStock && data.lowStock.length > 0) {
            const lowStockData = data.lowStock.map(p => ({
                Item: p.name_en,
                Category: p.category,
                CurrentStock: p.stock,
                MinThreshold: p.minStockThreshold
            }));
            const lowStockSheet = XLSX.utils.json_to_sheet(lowStockData);
            XLSX.utils.book_append_sheet(workbook, lowStockSheet, "Inventory Alerts");
        }

        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }
};
