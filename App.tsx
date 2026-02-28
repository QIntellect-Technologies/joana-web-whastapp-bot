import React, { useState, useEffect } from 'react';
import { UserRole, MenuItem, Branch, ViewState, SystemNotification, AuditLogEntry } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_BRANCHES } from './constants';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import { Bell } from 'lucide-react';
import MenuManager from './components/MenuManager';
import BranchManager from './components/BranchManager';
import BranchOwners from './components/BranchOwners';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { syncService } from './services/SyncService';
import { supabase } from './lib/supabase';
import { useActivityTracker } from './hooks/useActivityTracker';
import { useBranchData } from './hooks/useBranchData';
import DiscountManager from './components/DiscountManager';
import ReviewManager from './components/ReviewManager';
import LoyaltyManager from './components/LoyaltyManager';

const InnerApp: React.FC = () => {
  const { userRole, loggedInBranchId, login, logout, isLoading: isAuthLoading } = useAuth();
  useActivityTracker(); // Track user activity
  const { branches: realBranches, loading: isBranchDataLoading, refreshBranches } = useBranchData();

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    return localStorage.getItem('currentView') as ViewState || 'DASHBOARD';
  });
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  // We'll use the hook's branches, but keep local state if we need to modify it optimistically
  // For now, let's derive it or sync it.
  // Actually, let's trust the hook. But the rest of the app might expect 'branches' state to be mutable.
  // Let's keep 'branches' state and sync from hook for now to minimize refactoring risk.
  const [branches, setBranches] = useState<Branch[]>([]);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Sync hook data to local state
  useEffect(() => {
    console.log('--- App: realBranches from hook ---', realBranches);
    if (!isBranchDataLoading && realBranches.length > 0) {
      setBranches(realBranches);
      const allMenuItems = realBranches.flatMap(b => b.menu);
      setMenuData(allMenuItems);
      setIsLoadingData(false);
    } else if (!isBranchDataLoading && realBranches.length === 0) {
      // Fallback or empty state
      console.log('--- App: no branches found in hook ---');
      setIsLoadingData(false);
    }
  }, [realBranches, isBranchDataLoading]);

  // Removed manual fetchData useEffect

  // --- Real-Time Sync Listener ---
  useEffect(() => {
    const unsubscribe = syncService.subscribe((event) => {
      // console.log("Received Sync Event:", event); // Debug
      switch (event.type) {
        case 'SYNC_BRANCH_UPDATE':
          const updatedBranch = event.payload as Branch;
          setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
          break;
        case 'SYNC_MENU_UPDATE': {
          const { branchId, menu } = event.payload;
          setBranches(prev => prev.map(b => b.id === branchId ? { ...b, menu } : b));
          break;
        }
        case 'SYNC_NOTIFICATION': {
          const notif = event.payload as SystemNotification;
          if (notif.recipientRole === 'ALL' || notif.recipientRole === userRole) {
            if (!notif.targetBranchId || notif.targetBranchId === loggedInBranchId) {
              setNotifications(prev => {
                if (prev.some(n => n.id === notif.id)) return prev;
                return [notif, ...prev];
              });
            }
          }
          break;
        }
        case 'SYNC_ORDER_UPDATE': {
          const { branchId, orderId, status } = event.payload;
          addNotification('Order Updated', `Order #${orderId} changed to ${status}`, 'info', 'ALL', branchId);
          break;
        }
        case 'SYNC_STOCK_ALERT': {
          const { branchId, itemKey, currentStock } = event.payload;
          if (currentStock < 5) {
            addNotification('Stock Alert', `Item "${itemKey}" is running low (${currentStock} left)`, 'warning', 'ALL', branchId);
          }
          break;
        }
        case 'SYNC_AUDIT_LOG': {
          const log = event.payload as AuditLogEntry;
          setAuditLogs(prev => [log, ...prev]);
          break;
        }
        case 'SYNC_STAFF_UPDATE': {
          const { branchId, staff } = event.payload;
          setBranches(prev => prev.map(b => b.id === branchId ? { ...b, staff } : b));
          break;
        }
      }
    });
    return () => unsubscribe();
  }, [userRole, loggedInBranchId]);

  // --- Notification System ---
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', recipientRole: UserRole | 'ALL' = 'ALL', targetBranchId?: string) => {
    const newNotif: SystemNotification = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type,
      isRead: false,
      recipientRole,
      targetBranchId
    };

    // Add locally
    setNotifications(prev => [newNotif, ...prev]);

    // Broadcast to others
    syncService.broadcastNotification(newNotif);
  };

  // Persist View Changes
  useEffect(() => {
    if (currentView) {
      localStorage.setItem('currentView', currentView);
    }
  }, [currentView]);

  // Auto-Redirect on Login (once)
  useEffect(() => {
    // Basic view reset if role changes or login happens, handled by user choice usually, 
    // but we can ensure they land on dashboard.
    // Skipping aggressive redirect to respect persist view
  }, [userRole]);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 font-bold animate-pulse">Loading Application...</div>;
  }

  const handleDeleteBranch = (id: string) => {
    setBranches(prev => prev.filter(branch => branch.id !== id));
    // In a real app we'd broadcast delete too, assuming strictly add/update for now
  };

  const handleUpdateBranchMenu = (branchId: string, updatedMenu: MenuItem[]) => {
    // 1. Local Update
    setBranches(prev => prev.map(branch =>
      branch.id === branchId ? { ...branch, menu: updatedMenu } : branch
    ));

    // 2. Broadcast
    syncService.broadcastMenuUpdate(branchId, updatedMenu);

    // 3. Notify Logic
    const branchName = branches.find(b => b.id === branchId)?.name || 'Branch';
    if (userRole === UserRole.MAIN_ADMIN) {
      addNotification('Menu Update', `Admin updated the menu for ${branchName}`, 'info', UserRole.BRANCH_ADMIN, branchId);
    } else if (userRole === UserRole.BRANCH_ADMIN) {
      addNotification('Branch Menu Change', `${branchName} updated their menu`, 'warning', UserRole.MAIN_ADMIN);
    }
  };

  const handleAddBranch = (newBranch: Branch) => {
    setBranches(prev => [...prev, newBranch]);
    syncService.broadcastBranchUpdate(newBranch); // treat add as update for list sync roughly
    addNotification('New Branch', `New branch "${newBranch.name}" created`, 'success', UserRole.MAIN_ADMIN);
  };

  const handleUpdateBranch = (updatedBranch: Branch) => {
    // 1. Local
    setBranches(prev => prev.map(branch =>
      branch.id === updatedBranch.id ? updatedBranch : branch
    ));

    // 2. Broadcast
    syncService.broadcastBranchUpdate(updatedBranch);

    // 3. Notify
    if (userRole === UserRole.MAIN_ADMIN) {
      addNotification('Settings Update', `Admin updated settings for ${updatedBranch.name}`, 'info', UserRole.BRANCH_ADMIN, updatedBranch.id);
    } else if (userRole === UserRole.BRANCH_ADMIN) {
      addNotification('Branch Update', `${updatedBranch.name} updated their operational settings`, 'warning', UserRole.MAIN_ADMIN);
    }
  };

  if (!userRole) {
    return <LoginScreen branches={branches} onLogin={login} />;
  }

  // Get the specific branch for owner view
  const ownerBranch = loggedInBranchId ? branches.find(b => b.id === loggedInBranchId) : null;

  const renderContent = () => {
    // If Branch Admin, we mostly use ownerBranch but still allow all views
    const isBranchAdmin = userRole === UserRole.BRANCH_ADMIN;
    const isStaff = userRole === UserRole.STAFF;
    const effectiveBranches = (isBranchAdmin || isStaff) && ownerBranch ? [ownerBranch] : branches;
    const effectiveMenuData = (isBranchAdmin || isStaff) && ownerBranch ? ownerBranch.menu : menuData;

    switch (currentView) {
      case 'DASHBOARD':
        if (isBranchAdmin || isStaff) {
          return (
            <BranchManager
              branches={effectiveBranches}
              onDeleteBranch={() => { }}
              onUpdateBranchMenu={handleUpdateBranchMenu}
              onAddBranch={() => { }}
              onUpdateBranch={handleUpdateBranch}
              preSelectedBranchId={loggedInBranchId || undefined}
              isReadOnly={isStaff} // Staff might have limited edit rights in a real app
              initialTab="OVERVIEW"
              hideTabs={isStaff}
              allowAddBranch={false}
            />
          );
        }
        return (
          <DashboardStats
            menuItems={effectiveMenuData}
            branches={effectiveBranches}
            branchId={isBranchAdmin ? loggedInBranchId : null}
          />
        );
      case 'MENU_MANAGER':
        if (isBranchAdmin || isStaff) {
          return (
            <BranchManager
              branches={effectiveBranches}
              onDeleteBranch={() => { }}
              onUpdateBranchMenu={handleUpdateBranchMenu}
              onAddBranch={() => { }}
              onUpdateBranch={handleUpdateBranch}
              preSelectedBranchId={loggedInBranchId || undefined}
              isReadOnly={isStaff}
              initialTab="MENU"
              hideTabs={isStaff}
              allowAddBranch={false}
            />
          );
        }
        return (
          <MenuManager
            menuData={effectiveMenuData}
            setMenuData={setMenuData}
          />
        );
      case 'BRANCHES':
        return (
          <BranchManager
            branches={effectiveBranches}
            onDeleteBranch={isBranchAdmin ? () => { } : handleDeleteBranch}
            onUpdateBranchMenu={handleUpdateBranchMenu}
            onAddBranch={isBranchAdmin ? () => { } : handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            preSelectedBranchId={(isBranchAdmin || isStaff) ? loggedInBranchId || undefined : undefined}
            isReadOnly={(isBranchAdmin || isStaff) && !loggedInBranchId}
            initialTab='OVERVIEW'
            allowAddBranch={!isBranchAdmin && !isStaff}
          />
        );
      case 'BRANCH_OWNERS':
        return <BranchOwners branches={branches} />;
      case 'USERS':
        // Mapping "USERS" sidebar to "CUSTOMERS" tab in BranchManager
        return (
          <BranchManager
            branches={effectiveBranches}
            onDeleteBranch={() => { }}
            onUpdateBranchMenu={handleUpdateBranchMenu}
            onAddBranch={() => { }}
            onUpdateBranch={handleUpdateBranch}
            preSelectedBranchId={loggedInBranchId || undefined}
            isReadOnly={isStaff}
            initialTab="CUSTOMERS"
            hideTabs={isStaff}
            allowAddBranch={false}
          />
        );
      case 'SETTINGS':
        if (isBranchAdmin || isStaff) {
          return (
            <BranchManager
              branches={effectiveBranches}
              onDeleteBranch={() => { }}
              onUpdateBranchMenu={handleUpdateBranchMenu}
              onAddBranch={() => { }}
              onUpdateBranch={handleUpdateBranch}
              preSelectedBranchId={loggedInBranchId || undefined}
              isReadOnly={isStaff}
              initialTab="SETTINGS"
              hideTabs={isStaff}
              allowAddBranch={false}
            />
          );
        }
        return (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-display">System Settings</h2>
            <p className="text-slate-500 font-medium">Enterprise configuration and security protocols for Global HQ.</p>
          </div>
        );
      case 'DISCOUNTS':
        return <DiscountManager branches={branches} />;
      case 'REVIEWS':
        return <ReviewManager />;
      case 'LOYALTY':
        return <LoyaltyManager />;
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentRole={userRole}
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={logout}
      />

      <main className="flex-1 ml-64 flex flex-col h-screen bg-slate-50/50 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-8 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm z-20">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display mb-1">
              {userRole === UserRole.BRANCH_ADMIN ? (ownerBranch?.name || 'Branch Dashboard') : currentView.replace('_', ' ')}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{userRole === UserRole.MAIN_ADMIN ? 'Super Admin Control' : `Operations Manager: ${ownerBranch?.manager}`}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-3 bg-white rounded-full text-slate-400 hover:text-primary hover:bg-blue-50 transition-all shadow-sm border border-slate-100"
              >
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.isRead && (n.recipientRole === 'ALL' || n.recipientRole === userRole) && (!n.targetBranchId || n.targetBranchId === loggedInBranchId)).length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 animate-pop">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-4 font-display flex justify-between items-center">
                    Notifications
                    <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))} className="text-xs font-bold text-primary hover:text-sky-600">Mark all read</button>
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {notifications.filter(n => (n.recipientRole === 'ALL' || n.recipientRole === userRole) && (!n.targetBranchId || n.targetBranchId === loggedInBranchId)).length === 0 ? (
                      <p className="text-center text-slate-400 text-sm font-medium py-4">No new notifications</p>
                    ) : (
                      notifications.filter(n => (n.recipientRole === 'ALL' || n.recipientRole === userRole) && (!n.targetBranchId || n.targetBranchId === loggedInBranchId)).map(notif => (
                        <div key={notif.id} className={`p-4 rounded-2xl border ${notif.isRead ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-blue-50/50 border-blue-100'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${notif.type === 'error' ? 'text-red-500' : notif.type === 'warning' ? 'text-orange-500' : 'text-primary'}`}>{notif.type}</span>
                            <span className="text-[10px] font-bold text-slate-400">{notif.timestamp}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mb-0.5">{notif.title}</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 font-display">
                {userRole === UserRole.MAIN_ADMIN ? 'Global Headquarters' : ownerBranch?.name}
              </p>
              <p className="text-xs text-slate-500 font-bold">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden ring-2 ring-slate-100">
                <img src={`https://ui-avatars.com/api/?name=${userRole === UserRole.MAIN_ADMIN ? 'Admin' : ownerBranch?.manager}&background=random`} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
          <div className="animate-fade-in-up pb-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

export default App;