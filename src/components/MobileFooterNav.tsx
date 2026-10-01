import React from 'react';
import {
  Home,
  Package,
  PlusCircle,
  Clock,
  User as UserIcon,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const MobileFooterNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAddModalOpen,
    openStaffProfile,
    selectedStaffProfile
  } = useApp();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isProfileActive = activeTab === 'profile' && !selectedStaffProfile;

  return (
    <nav
      id="mobile-bottom-footer-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Home / Dashboard */}
        <button
          id="btn-mobile-nav-home"
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.dashboard}</span>
        </button>

        {/* 2. Items List */}
        <button
          id="btn-mobile-nav-items"
          type="button"
          onClick={() => {
            setActiveTab('items');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'items'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.totalItems}</span>
        </button>

        {/* 3. Center Highlighted Action: Add Item */}
        <button
          id="btn-mobile-nav-add-item"
          type="button"
          onClick={() => {
            setIsAddModalOpen(true);
          }}
          className="flex flex-col items-center justify-center -mt-5 group"
          title={t.addItem}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 active:scale-95 transition-all border-4 border-white dark:border-slate-900">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {t.addItem}
          </span>
        </button>

        {/* 4. Pending Dispatch */}
        <button
          id="btn-mobile-nav-dispatch"
          type="button"
          onClick={() => {
            setActiveTab('dispatch');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'dispatch'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.dispatch}</span>
        </button>

        {/* 5. User Profile */}
        <button
          id="btn-mobile-nav-profile"
          type="button"
          onClick={() => {
            openStaffProfile(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isProfileActive
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
          </div>
          <span className="text-[10px] tracking-tight">{t.myProfile}</span>
        </button>
      </div>
    </nav>
  );
};
