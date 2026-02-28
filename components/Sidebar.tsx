import React from 'react';
import { UserRole, ViewState } from '../types';
import { LayoutDashboard, Menu, Building2, Settings, LogOut, UtensilsCrossed, Users, ShoppingBag, Tag, Star, Gift } from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRole, currentView, onChangeView, onLogout }) => {
  const menuItems = [
    {
      id: 'DASHBOARD' as ViewState,
      label: 'Overview',
      icon: LayoutDashboard,
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]
    },
    {
      id: 'MENU_MANAGER' as ViewState,
      label: 'Menu Management',
      icon: Menu,
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STAFF]
    },
    {
      id: 'BRANCHES' as ViewState,
      label: 'Branches',
      icon: Building2,
      roles: [UserRole.MAIN_ADMIN]
    },
    {
      id: 'BRANCH_OWNERS' as ViewState,
      label: 'Branch Owners',
      icon: Users,
      roles: [UserRole.MAIN_ADMIN]
    },
    {
      id: 'USERS' as ViewState,
      label: 'Customer Database',
      icon: Users,
      roles: [UserRole.BRANCH_ADMIN, UserRole.STAFF]
    },
    {
      id: 'DISCOUNTS' as ViewState,
      label: 'Discounts & Offers',
      icon: Tag,
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN]
    },
    {
      id: 'REVIEWS' as ViewState,
      label: 'Customer Reviews',
      icon: Star,
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN]
    },
    {
      id: 'SETTINGS' as ViewState,
      label: 'Operational Settings',
      icon: Settings,
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN]
    },
    {
      id: 'LOYALTY' as ViewState,
      label: 'Loyalty Points',
      icon: Gift, // Changed to Gift icon, need to import it
      roles: [UserRole.MAIN_ADMIN, UserRole.BRANCH_ADMIN]
    },
  ];

  return (
    <aside className="w-64 bg-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-lg shadow-slate-200/50 border-r border-slate-100 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-50">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="block text-lg font-bold tracking-tight text-slate-800">FOOD BOOT</span>
          <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">Admin Panel</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
        {menuItems.filter(item => item.roles.includes(currentRole)).map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                ${isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm">
            {currentRole === UserRole.MAIN_ADMIN ? 'MA' : currentRole === UserRole.BRANCH_ADMIN ? 'BA' : 'ST'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">{currentRole}</p>
            <p className="text-xs text-slate-500 truncate">Logged in</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2.5 rounded-lg transition-colors border border-transparent hover:border-red-100 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;