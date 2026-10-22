import React from 'react';
import {
  Home,
  Package,
  PlusCircle,
  Clock,
  User as UserIcon,
  Award,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useLocation } from 'react-router-dom';

export const MobileFooterNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAddModalOpen,
    openStaffProfile,
    selectedStaffProfile
  } = useApp();
  const { user, hasPermission, isSuperAdmin, previewRole } = useAuth();
  const { t } = useLanguage();

  const isMasterAdmin = isSuperAdmin && !previewRole;
  const isProfileActive = activeTab === 'profile' && !selectedStaffProfile;
  const canViewItems = isMasterAdmin || hasPermission('view');
  const canAddItem = isMasterAdmin || hasPermission('create');
  const canDispatch = isMasterAdmin || hasPermission('dispatch');
  const canCertificates = isMasterAdmin || hasPermission('certificates_view') || hasPermission('certificates');
  const canPerformance = isMasterAdmin || hasPermission('performance');

  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      id="mobile-bottom-footer-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-fuchsia-500/30 shadow-[0_-8px_30px_rgba(45,12,52,0.55)] px-2 py-1.5 transition-all select-none"
      style={{
        background: 'linear-gradient(135deg, #3d1246 0%, #260a2d 55%, #18071c 100%)'
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Home / Dashboard */}
        <Link
          id="btn-mobile-nav-home"
          to="/dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentPath === '/' || currentPath === '/dashboard'
              ? 'text-white font-bold bg-white/15 shadow-2xs'
              : 'text-fuchsia-200/75 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${currentPath === '/' || currentPath === '/dashboard' ? 'text-white' : 'text-fuchsia-300/80'}`} />
          <span className="text-[10px] tracking-tight">{t.dashboard}</span>
        </Link>

        {/* 2. Items List (if permitted) */}
        {canViewItems && (
          <Link
            id="btn-mobile-nav-items"
            to="/items"
            onClick={() => setActiveTab('items')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentPath === '/items'
                ? 'text-white font-bold bg-white/15 shadow-2xs'
                : 'text-fuchsia-200/75 hover:text-white'
            }`}
          >
            <Package className={`w-5 h-5 mb-0.5 ${currentPath === '/items' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="text-[10px] tracking-tight">{t.totalItems}</span>
          </Link>
        )}

        {/* 3. Center Highlighted Action: Add Item (only if create permission granted) */}
        {canAddItem ? (
          <button
            id="btn-mobile-nav-add-item"
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
            }}
            className="flex flex-col items-center justify-center -mt-5 group"
            title={t.addItem}
          >
            <div className="w-12 h-12 rounded-full btn-primary-gradient text-white flex items-center justify-center shadow-lg shadow-fuchsia-950/60 group-hover:scale-105 active:scale-95 transition-all border-4 border-[#3d1246]">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold text-fuchsia-200 mt-0.5">
              {t.addItem}
            </span>
          </button>
        ) : canCertificates ? (
          <Link
            id="btn-mobile-nav-certificates"
            to="/certificates"
            onClick={() => setActiveTab('certificates')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentPath === '/certificates'
                ? 'text-white font-bold bg-white/15 shadow-2xs'
                : 'text-fuchsia-200/75 hover:text-white'
            }`}
          >
            <Award className={`w-5 h-5 mb-0.5 ${currentPath === '/certificates' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="text-[10px] tracking-tight">Awards</span>
          </Link>
        ) : null}

        {/* 4. Secondary Action: Dispatch, Performance, or Certificates */}
        {canDispatch ? (
          <Link
            id="btn-mobile-nav-dispatch"
            to="/dispatch"
            onClick={() => setActiveTab('dispatch')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentPath === '/dispatch'
                ? 'text-white font-bold bg-white/15 shadow-2xs'
                : 'text-fuchsia-200/75 hover:text-white'
            }`}
          >
            <Clock className={`w-5 h-5 mb-0.5 ${currentPath === '/dispatch' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="text-[10px] tracking-tight">{t.dispatch}</span>
          </Link>
        ) : canPerformance ? (
          <Link
            id="btn-mobile-nav-performance"
            to="/performance"
            onClick={() => setActiveTab('performance')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentPath === '/performance'
                ? 'text-white font-bold bg-white/15 shadow-2xs'
                : 'text-fuchsia-200/75 hover:text-white'
            }`}
          >
            <TrendingUp className={`w-5 h-5 mb-0.5 ${currentPath === '/performance' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="text-[10px] tracking-tight">{t.performance}</span>
          </Link>
        ) : canCertificates && canAddItem ? (
          <Link
            id="btn-mobile-nav-certificates-sec"
            to="/certificates"
            onClick={() => setActiveTab('certificates')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentPath === '/certificates'
                ? 'text-white font-bold bg-white/15 shadow-2xs'
                : 'text-fuchsia-200/75 hover:text-white'
            }`}
          >
            <Award className={`w-5 h-5 mb-0.5 ${currentPath === '/certificates' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="text-[10px] tracking-tight">Awards</span>
          </Link>
        ) : null}

        {/* 5. User Profile */}
        <Link
          id="btn-mobile-nav-profile"
          to="/profile"
          onClick={() => {
            openStaffProfile(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentPath === '/profile'
              ? 'text-white font-bold bg-white/15 shadow-2xs'
              : 'text-fuchsia-200/75 hover:text-white'
          }`}
        >
          <div className="relative">
            <UserIcon className={`w-5 h-5 mb-0.5 ${currentPath === '/profile' ? 'text-white' : 'text-fuchsia-300/80'}`} />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-[#3d1246]" />
          </div>
          <span className="text-[10px] tracking-tight">{t.myProfile}</span>
        </Link>
      </div>
    </nav>
  );
};
