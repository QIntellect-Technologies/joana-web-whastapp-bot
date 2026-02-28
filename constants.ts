import { MenuItem, Branch, AvailabilityStatus, BranchSettings, StaffRole } from './types';

// --- Menu Items ---
export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { category: "Burgers", category_id: "burgers", name_en: "Chicken Burger", name_ar: "برجر دجاج", price: 9.5, key: "1", stock: 15, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Burgers", category_id: "burgers", name_en: "Beef Burger", name_ar: "برجر لحم", price: 9.5, key: "2", stock: 2, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Burgers", category_id: "burgers", name_en: "Regular Zinger Burger", name_ar: "برجر زنجر عادي", price: 13.5, key: "3", stock: 20, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Burgers", category_id: "burgers", name_en: "Spicy Zinger Burger", name_ar: "برجر زنجر حار", price: 11.5, key: "4", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Burgers", category_id: "burgers", name_en: "Crispy Burger", name_ar: "برجر كرسبي", price: 14, key: "5", stock: 8, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Wraps", category_id: "wraps", name_en: "Spicy Tortilla Zinger", name_ar: "تورتيلا زنجر حار", price: 12.5, key: "6", stock: 18, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Wraps", category_id: "wraps", name_en: "Regular Tortilla Zinger", name_ar: "تورتيلا زنجر عادي", price: 14.5, key: "7", stock: 0, minStockThreshold: 5, isOutOfStock: true, status: AvailabilityStatus.OUT_OF_STOCK },
  { category: "Wraps", category_id: "wraps", name_en: "Tortilla Chicken Jumbo", name_ar: "تورتيلا دجاج جامبو", price: 15, key: "8", stock: 25, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Kibdah Sandwich", name_ar: "ساندويتش كبدة", price: 4.75, key: "9", stock: 30, minStockThreshold: 10, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Egg Sandwich", name_ar: "ساندويتش بيض", price: 3.75, key: "10", stock: 40, minStockThreshold: 10, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Shakshouka Sandwich", name_ar: "ساندويتش شكشوكة", price: 3.75, key: "11", stock: 20, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Chicken Sandwich", name_ar: "ساندويتش دجاج", price: 4.75, key: "12", stock: 15, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Kabab Chicken Jumbo", name_ar: "كباب دجاج جامبو", price: 14.5, key: "13", stock: 10, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Kudu Chicken Sandwich", name_ar: "ساندويتش دجاج كودو", price: 16.5, key: "14", stock: 5, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Falafel Sandwich", name_ar: "ساندويتش فلافل", price: 4.75, key: "15", stock: 50, minStockThreshold: 10, status: AvailabilityStatus.AVAILABLE },
  { category: "Sandwiches", category_id: "sandwiches", name_en: "Hot Dog Jumbo", name_ar: "هوت دوج جامبو", price: 8.5, key: "16", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Popcorn", name_ar: "فشار", price: 6, key: "44", stock: 100, minStockThreshold: 20, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Sweet Potato", name_ar: "بطاطس حلوة", price: 7.5, key: "17", stock: 30, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Sweet Corn", name_ar: "ذرة حلوة", price: 8, key: "18", stock: 25, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "French Fries", name_ar: "بطاطس مقلية", price: 8, key: "19", stock: 150, minStockThreshold: 30, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Potato Crispy", name_ar: "بطاطس كرسبي", price: 8, key: "20", stock: 40, minStockThreshold: 10, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Corn Dog", name_ar: "كورندوج", price: 8, key: "21", stock: 15, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Chicken Nuggets (8 pcs)", name_ar: "دجاج ناجتس ٨ قطع", price: 12, key: "22", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Chicken Popcorn", name_ar: "دجاج بوب كورن", price: 8.5, key: "23", stock: 20, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Sides", category_id: "sides", name_en: "Onion Rings", name_ar: "حلقات بصل", price: 8, key: "24", stock: 30, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Chicken Burger Meal", name_ar: "وجبة برجر دجاج", price: 14.5, key: "25", stock: 10, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Beef Burger Meal", name_ar: "وجبة برجر لحم", price: 14.5, key: "26", stock: 8, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Crispy Burger Meal", name_ar: "وجبة برجر كرسبي", price: 19.5, key: "27", stock: 5, minStockThreshold: 3, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Tortilla Chicken Meal", name_ar: "وجبة تورتيلا دجاج", price: 15.5, key: "28", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Kabab Chicken Meal", name_ar: "وجبة كباب دجاج", price: 19.5, key: "29", stock: 6, minStockThreshold: 3, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Hot Dog Meal", name_ar: "وجبة هوت دوج", price: 13.5, key: "30", stock: 15, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Spicy Zinger Burger Meal", name_ar: "وجبة برجر زنجر حار", price: 16.5, key: "31", stock: 10, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Regular Zinger Burger Meal", name_ar: "وجبة برجر زنجر عادي", price: 18.5, key: "32", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Spicy Tortilla Zinger Meal", name_ar: "وجبة تورتيلا زنجر حار", price: 17.5, key: "33", stock: 8, minStockThreshold: 3, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Regular Tortilla Zinger Meal", name_ar: "وجبة تورتيلا زنجر عادي", price: 19.5, key: "34", stock: 5, minStockThreshold: 3, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Spicy Chicken Barosted", name_ar: "دجاج باروستد حار", price: 19.5, key: "35", stock: 10, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Meals", category_id: "meals", name_en: "Chicken Nuggets Meal", name_ar: "وجبة دجاج ناجتس", price: 17.5, key: "36", stock: 12, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Juices", category_id: "juices", name_en: "Rabia Juice", name_ar: "عصير ربيع", price: 2.5, key: "45", stock: 60, minStockThreshold: 10, status: AvailabilityStatus.AVAILABLE },
  { category: "Juices", category_id: "juices", name_en: "Fresh Orange Juice", name_ar: "عصير برتقال طازج", price: 10, key: "37", stock: 20, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Juices", category_id: "juices", name_en: "Slash Juice", name_ar: "عصير سلاش", price: 6, key: "38", stock: 30, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Juices", category_id: "juices", name_en: "Cocktail Juice", name_ar: "عصير كوكتيل", price: 6, key: "39", stock: 25, minStockThreshold: 5, status: AvailabilityStatus.AVAILABLE },
  { category: "Drinks", category_id: "drinks", name_en: "Pepsi", name_ar: "بيبسي", price: 2.5, key: "40", stock: 100, minStockThreshold: 20, status: AvailabilityStatus.AVAILABLE },
  { category: "Drinks", category_id: "drinks", name_en: "Water", name_ar: "ماء", price: 1.5, key: "41", stock: 200, minStockThreshold: 50, status: AvailabilityStatus.AVAILABLE },
  { category: "Drinks", category_id: "drinks", name_en: "Tea", name_ar: "شاي", price: 1.5, key: "42", stock: 100, minStockThreshold: 20, status: AvailabilityStatus.AVAILABLE },
  { category: "Drinks", category_id: "drinks", name_en: "Coffee", name_ar: "قهوة", price: 3, key: "43", stock: 80, minStockThreshold: 15, status: AvailabilityStatus.AVAILABLE }
];

export const DEFAULT_BRANCH_SETTINGS: BranchSettings = {
  workingDays: {
    'Monday': { open: '09:00', close: '23:00', isClosed: false },
    'Tuesday': { open: '09:00', close: '23:00', isClosed: false },
    'Wednesday': { open: '09:00', close: '23:00', isClosed: false },
    'Thursday': { open: '09:00', close: '23:00', isClosed: false },
    'Friday': { open: '13:00', close: '23:30', isClosed: false },
    'Saturday': { open: '09:00', close: '23:00', isClosed: false },
    'Sunday': { open: '09:00', close: '22:00', isClosed: false },
  },
  holidayMode: {
    active: false,
    notice: 'Closed for public holiday. See you soon!'
  },
  // Quick Actions Defaults
  isOnlinePaused: false,
  isVoicePaused: false,
  kitchenBusyMode: false,
  emergencyStop: {
    active: false,
    until: null
  }
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Downtown Riyadh',
    location: 'King Fahd Road, Riyadh, KSA',
    manager: 'Ahmed Al-Saud',
    email: 'manager.riyadh@foodboot.com',
    phone: '+966 11 456 7890',
    ownerName: 'Sheikh Abdullah',
    ownerEmail: 'abdullah@investments.sa',
    ownerPhone: '+966 50 123 4567',
    ownerUsername: 'riyadh_owner',
    ownerPassword: 'password123',
    status: 'Active',
    menu: [...INITIAL_MENU_ITEMS],
    settings: { ...DEFAULT_BRANCH_SETTINGS },
    staff: [
      {
        id: 's1',
        name: 'Karim Abdul',
        role: StaffRole.CHEF,
        avatar: 'https://i.pravatar.cc/150?u=karim',
        email: 'karim@foodboot.com',
        phone: '+966 50 000 1111',
        emergencyContact: '+966 50 111 2222',
        joinDate: '2025-01-15',
        status: 'Active',
        shift: { start: '09:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], type: 'Morning' },
        metrics: {
          lifetimeOrders: 12500,
          ordersToday: 42,
          ordersThisWeek: 280,
          avgOrdersPerShift: 35,
          avgPrepTime: 12,
          fastestPrep: 4,
          slowestPrep: 25,
          peakHourPerformance: 92,
          successRate: 98,
          delayedOrders: 12,
          reassignedOrders: 5,
          mistakes: 2,
          cancellationByStaff: 1,
          customerSatisfaction: 4.8,
          rating: 4.8,
          wastageIncidents: 3,
          estimatedLoss: 150
        },
        financials: {
          salary: 4500,
          currency: 'SAR',
          paidThisMonth: 4500,
          pendingAmount: 0,
          bonuses: 200,
          penalties: 0,
          history: [
            { month: '2025-12', base: 4500, bonus: 300, penalty: 0, status: 'Paid' },
            { month: '2026-01', base: 4500, bonus: 200, penalty: 0, status: 'Paid' }
          ]
        },
        attendance: [
          { date: '2026-01-20', status: 'Present', checkIn: '08:55', checkOut: '17:05' },
          { date: '2026-01-21', status: 'Late', checkIn: '09:15', checkOut: '17:00' }
        ],
        performanceHistory: [
          { month: '2025-12', ordersHandled: 1100, successRate: 97, avgPrepTime: 13, mistakes: 4, managerRating: 4.5 },
          { month: '2026-01', ordersHandled: 1250, successRate: 98, avgPrepTime: 12, mistakes: 2, managerRating: 4.8 }
        ],
        documents: [
          { id: 'd1', type: 'ID', name: 'National ID', fileUrl: '#', status: 'Valid', expiryDate: '2028-12-31' },
          { id: 'd2', type: 'Health Certificate', name: 'Food Safety cert', fileUrl: '#', status: 'Valid', expiryDate: '2026-06-15' }
        ],
        systemAccess: {
          lastActive: '2026-01-25T14:30:00Z',
          permissions: ['Order View', 'Kitchen Display', 'Menu Management'],
          recentActions: [
            { action: 'Status Update', timestamp: '2026-01-25T14:15:00Z', details: 'Marked Order #4521 as Ready' }
          ]
        }
      },
      {
        id: 's2',
        name: 'Mona Lisa',
        role: StaffRole.CASHIER,
        avatar: 'https://i.pravatar.cc/150?u=mona',
        email: 'mona@foodboot.com',
        phone: '+966 50 000 2222',
        joinDate: '2025-02-01',
        status: 'Active',
        shift: { start: '08:00', end: '16:00', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], type: 'Morning' },
        metrics: {
          lifetimeOrders: 34000,
          ordersToday: 85,
          ordersThisWeek: 520,
          avgOrdersPerShift: 75,
          avgPrepTime: 2,
          fastestPrep: 1,
          slowestPrep: 5,
          peakHourPerformance: 98,
          successRate: 99.5,
          delayedOrders: 2,
          reassignedOrders: 0,
          mistakes: 5,
          cancellationByStaff: 0,
          customerSatisfaction: 4.9,
          rating: 4.9,
          wastageIncidents: 0,
          estimatedLoss: 20
        },
        financials: {
          salary: 3500,
          currency: 'SAR',
          paidThisMonth: 3500,
          pendingAmount: 0,
          bonuses: 150,
          penalties: 0,
          history: []
        },
        attendance: [],
        performanceHistory: [],
        documents: [],
        systemAccess: {
          lastActive: '2026-01-25T15:00:00Z',
          permissions: ['POS Access', 'Customer Records'],
          recentActions: []
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Jeddah Corniche',
    location: 'North Corniche, Jeddah, KSA',
    manager: 'Sara Khalid',
    email: 'manager.jeddah@foodboot.com',
    phone: '+966 12 654 3210',
    ownerName: 'Faisal Al-Harbi',
    ownerEmail: 'faisal.owner@group.com',
    ownerPhone: '+966 55 987 6543',
    ownerUsername: 'jeddah_owner',
    ownerPassword: 'password123',
    status: 'Active',
    menu: [...INITIAL_MENU_ITEMS],
    settings: { ...DEFAULT_BRANCH_SETTINGS },
    staff: [
      {
        id: 's3',
        name: 'Omar Sharif',
        role: StaffRole.SUPERVISOR,
        avatar: 'https://i.pravatar.cc/150?u=omar',
        email: 'omar@foodboot.com',
        phone: '+966 50 000 3333',
        joinDate: '2024-11-20',
        status: 'Active',
        shift: { start: '14:00', end: '22:00', days: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], type: 'Evening' },
        metrics: {
          lifetimeOrders: 8000,
          ordersToday: 15,
          ordersThisWeek: 120,
          avgOrdersPerShift: 20,
          avgPrepTime: 0,
          fastestPrep: 0,
          slowestPrep: 0,
          peakHourPerformance: 85,
          successRate: 97,
          delayedOrders: 5,
          reassignedOrders: 2,
          mistakes: 1,
          cancellationByStaff: 0,
          customerSatisfaction: 4.7,
          rating: 4.7,
          wastageIncidents: 1,
          estimatedLoss: 50
        },
        financials: {
          salary: 5000,
          currency: 'SAR',
          paidThisMonth: 5000,
          pendingAmount: 0,
          bonuses: 300,
          penalties: 50,
          history: []
        },
        attendance: [],
        performanceHistory: [],
        documents: [],
        systemAccess: {
          lastActive: '2026-01-25T11:00:00Z',
          permissions: ['Manager Dashboard', 'Shift Scheduling'],
          recentActions: []
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Dammam Seafront',
    location: 'King Abdullah Park, Dammam, KSA',
    manager: 'Omar F',
    email: 'manager.dammam@foodboot.com',
    phone: '+966 13 333 4444',
    ownerName: 'Mohammed Al-Qahtani',
    ownerEmail: 'm.qahtani@ventures.com',
    ownerPhone: '+966 54 555 1212',
    status: 'Inactive',
    menu: [...INITIAL_MENU_ITEMS],
    settings: { ...DEFAULT_BRANCH_SETTINGS },
    staff: []
  },
];