import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Branch, MenuItem, StaffMember, StaffRole, AvailabilityStatus } from '../types';

export const useBranchData = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('--- useBranchData: FETCHING START ---');

            // 1. Fetch Branches
            const { data: branchesData, error: branchesError } = await supabase
                .from('branches')
                .select('*');

            if (branchesError) {
                console.error('--- useBranchData: BRANCH ERROR ---', branchesError);
                throw branchesError;
            }
            console.log('--- useBranchData: BRANCHES ---', branchesData);

            // 2. Fetch Menu Items
            const { data: menuData, error: menuError } = await supabase
                .from('menu_items')
                .select('*');

            if (menuError) {
                console.error('--- useBranchData: MENU ERROR ---', menuError);
                throw menuError;
            }
            console.log(`--- useBranchData: MENU ITEMS --- (count: ${menuData?.length})`);

            // 3. Fetch Staff Members and Related Data (Separately for resilience)
            console.log('--- useBranchData: FETCHING STAFF DATA ---');
            const [
                { data: staffRaw, error: sErr },
                { data: attendanceRaw, error: aErr },
                { data: kpiRaw, error: kErr },
                { data: docsRaw, error: dErr }
            ] = await Promise.all([
                supabase.from('staff_members').select('*'),
                supabase.from('staff_attendance').select('*'),
                supabase.from('staff_kpi_history').select('*'),
                supabase.from('staff_documents').select('*')
            ]);

            if (sErr) throw sErr;

            // Combine staff data in-memory
            const staffData = (staffRaw || []).map(staff => ({
                ...staff,
                staff_attendance: (attendanceRaw || []).filter(a => a.staff_id === staff.id),
                staff_kpi_history: (kpiRaw || []).filter(k => k.staff_id === staff.id),
                staff_documents: (docsRaw || []).filter(d => d.staff_id === staff.id)
            }));

            console.log(`--- useBranchData: STAFF COMPILED --- (count: ${staffData.length})`);

            // 3.5 Fetch Categories for Mapping
            const { data: categoriesData } = await supabase.from('menu_categories').select('*');
            const categoryMap = (categoriesData || []).reduce((acc: any, cat: any) => {
                acc[cat.id] = cat.name_en;
                return acc;
            }, {});

            // 4. Map Data to Types
            const formattedBranches: Branch[] = branchesData.map((branch, idx) => {
                try {
                    console.log(`--- Mapping Branch ${idx}: ${branch.name} ---`);
                    // Map Menu
                    const branchMenu: MenuItem[] = menuData
                        .filter(item => item.branch_id === branch.id)
                        .map(item => ({
                            id: item.id, // Explicitly map ID for DB updates
                            key: item.id,
                            category: categoryMap[item.category_id] || 'General',
                            category_id: item.category_id,
                            subcategory: item.subcategory,
                            name_en: item.name_en,
                            name_ar: item.name_ar || '',
                            price: item.price,
                            stock: item.stock,
                            minStockThreshold: item.min_stock_threshold,
                            status: item.status as AvailabilityStatus,
                            isOutOfStock: item.status === 'Out of Stock',
                            availableMeals: item.available_meals,
                            cuisineType: item.cuisine_type
                        }));

                    // Map Staff
                    const branchStaff: StaffMember[] = staffData
                        .filter(staff => staff.branch_id === branch.id)
                        .map(staff => {
                            try {
                                return {
                                    id: staff.id,
                                    name: staff.name,
                                    role: staff.role as StaffRole,
                                    avatar: staff.avatar_url || '',
                                    email: staff.email || '',
                                    phone: staff.phone || '',
                                    emergencyContact: staff.emergency_contact,
                                    joinDate: staff.join_date,
                                    status: staff.status,
                                    shift: {
                                        start: staff.shift_start?.slice(0, 5) || '09:00',
                                        end: staff.shift_end?.slice(0, 5) || '17:00',
                                        days: Array.isArray(staff.shift_days) ? staff.shift_days : [],
                                        type: staff.shift_type || 'Morning'
                                    },
                                    metrics: {
                                        lifetimeOrders: staff.staff_kpi_history?.reduce((acc: number, curr: any) => acc + (curr.orders_handled || 0), 0) || 0,
                                        ordersToday: 0,
                                        ordersThisWeek: 0,
                                        avgOrdersPerShift: 0,
                                        avgPrepTime: (staff.staff_kpi_history?.[0]?.avg_prep_time_sec / 60) || 0,
                                        fastestPrep: 0,
                                        slowestPrep: 0,
                                        peakHourPerformance: 0,
                                        successRate: 100,
                                        delayedOrders: 0,
                                        reassignedOrders: 0,
                                        mistakes: staff.staff_kpi_history?.[0]?.mistakes_count || 0,
                                        cancellationByStaff: 0,
                                        customerSatisfaction: staff.staff_kpi_history?.[0]?.customer_satisfaction || 5,
                                        rating: staff.staff_kpi_history?.[0]?.manager_rating || 5,
                                        wastageIncidents: 0,
                                        estimatedLoss: 0
                                    },
                                    financials: {
                                        salary: staff.base_salary,
                                        currency: staff.currency,
                                        paidThisMonth: 0,
                                        pendingAmount: 0,
                                        bonuses: 0,
                                        penalties: 0,
                                        history: []
                                    },
                                    attendance: staff.staff_attendance?.map((att: any) => ({
                                        date: att.date,
                                        status: att.status,
                                        checkIn: att.check_in,
                                        checkOut: att.check_out,
                                        notes: att.notes
                                    })) || [],
                                    performanceHistory: [],
                                    documents: staff.staff_documents?.map((doc: any) => ({
                                        id: doc.id,
                                        type: doc.type,
                                        name: doc.name,
                                        expiryDate: doc.expiry_date,
                                        fileUrl: doc.file_url,
                                        status: doc.status
                                    })) || [],
                                    systemAccess: {
                                        lastActive: '',
                                        permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
                                        recentActions: []
                                    }
                                };
                            } catch (sErr) {
                                console.error(`Error mapping staff ${staff.id} in branch ${branch.id}:`, sErr);
                                return null;
                            }
                        })
                        .filter(s => s !== null) as StaffMember[];

                    return {
                        id: branch.id,
                        name: branch.name,
                        location: branch.address,
                        manager: branch.manager || '',
                        email: branch.email || '',
                        phone: branch.contact || '',
                        ownerName: 'Admin',
                        ownerEmail: '',
                        ownerPhone: '',
                        status: branch.status,
                        menu: branchMenu,
                        settings: {
                            workingDays: branch.operational_hours || {},
                            holidayMode: { active: false, notice: '' },
                            isOnlinePaused: false,
                            isVoicePaused: false,
                            kitchenBusyMode: false,
                            emergencyStop: { active: false, until: null }
                        },
                        staff: branchStaff
                    } as Branch;
                } catch (bErr) {
                    console.error(`Error mapping branch at index ${idx}:`, bErr);
                    return null;
                }
            }).filter(b => b !== null) as Branch[];

            console.log('--- useBranchData: MAPPING COMPLETE ---', formattedBranches.length, 'branches');
            setBranches(formattedBranches);
        } catch (err: any) {
            console.error('Error fetching branch data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { branches, loading, error, refreshBranches: fetchData };
};

// Helper to handle category mapping removed as we now use lookup map in main hook
