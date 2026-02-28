import { SystemNotification, Branch, MenuItem, SyncEventType, AuditLogEntry } from '../types';

interface SyncEvent {
    type: SyncEventType;
    payload: any;
    timestamp: number;
}

class SyncService {
    private channel: BroadcastChannel;
    private listeners: ((event: SyncEvent) => void)[] = [];

    constructor() {
        this.channel = new BroadcastChannel('food-boot-sync_v2'); // Increment version for new schema
        this.channel.onmessage = (message) => {
            this.notifyListeners(message.data as SyncEvent);
        };
    }

    public subscribe(callback: (event: SyncEvent) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(event: SyncEvent) {
        this.listeners.forEach(listener => listener(event));
    }

    // --- Enterprise Actions ---

    public broadcastBranchUpdate(branch: Branch) {
        this.channel.postMessage({
            type: 'SYNC_BRANCH_UPDATE',
            payload: branch,
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastMenuUpdate(branchId: string, menu: MenuItem[]) {
        this.channel.postMessage({
            type: 'SYNC_MENU_UPDATE',
            payload: { branchId, menu },
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastNotification(notification: SystemNotification) {
        this.channel.postMessage({
            type: 'SYNC_NOTIFICATION',
            payload: notification,
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastNewOrder(orderData: any) {
        this.channel.postMessage({
            type: 'SYNC_NEW_ORDER',
            payload: orderData,
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastOrderUpdate(branchId: string, orderId: string, status: string) {
        this.channel.postMessage({
            type: 'SYNC_ORDER_UPDATE',
            payload: { branchId, orderId, status },
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastStockAlert(branchId: string, itemKey: string, currentStock: number) {
        this.channel.postMessage({
            type: 'SYNC_STOCK_ALERT',
            payload: { branchId, itemKey, currentStock },
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastAuditLog(log: AuditLogEntry) {
        this.channel.postMessage({
            type: 'SYNC_AUDIT_LOG',
            payload: log,
            timestamp: Date.now()
        } as SyncEvent);
    }

    public broadcastStaffUpdate(branchId: string, staff: any) {
        this.channel.postMessage({
            type: 'SYNC_STAFF_UPDATE',
            payload: { branchId, staff },
            timestamp: Date.now()
        } as SyncEvent);
    }
}

export const syncService = new SyncService();
