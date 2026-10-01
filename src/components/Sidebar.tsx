import React from 'react';
import {
  LayoutDashboard,
  Package,
  Clock,
  Users,
  Settings,
  User as UserIcon,
  LogOut,
  Crown,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Trash2,
  TrendingUp,
  Award,
  Command,
  Keyboard,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PermissionKey, ActiveTab } from '../types';
import { isMacOS } from '../hooks/useKeyboardShortcuts';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openStaffProfile,
    openQrScanner,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    activeItems,
    removedItems,
    settings,
    openCommandPalette,
    openShortcutsModal
  } = useApp();
  const { user, logout, hasPermission } = useAuth();
  const { t, isRTL, translateRole } = useLanguage();
  const isMac = isMacOS();

  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '');
  const pendingApprovalCount = activeItems.filter(i => i.status === 'Pending Approval' || (i.isApproved === false && i.approvalStatus === 'pending')).length;

  const allNavItems = [
    { id: 'dashboard' as const, label: t.dashboard, icon: LayoutDashboard, requiredPerm: 'view' as PermissionKey },
    { id: 'items' as const, label: t.lostAndFoundItems, icon: Package, requiredPerm: 'view' as PermissionKey, badge: isAdminTier && pendingApprovalCount > 0 ? pendingApprovalCount : undefined },
    { id: 'dispatch' as const, label: t.pendingDispatch, icon: Clock, requiredPerm: 'dispatch' as PermissionKey },
    { id: 'staff' as const, label: t.staffManagement, icon: Users, requiredPerm: 'staff_management' as PermissionKey },
    { id: 'performance' as const, label: t.performance, icon: TrendingUp, requiredPerm: 'performance' as PermissionKey },
    { id: 'certificates' as const, label: t.certificates, icon: Award, requiredPerm: 'certificates' as PermissionKey },
    { id: 'audit_logs' as const, label: t.auditLogs || 'Audit Logs', icon: History, requiredPerm: 'audit_logs' as PermissionKey },
    { id: 'removed' as const, label: t.removedItems, icon: Trash2, requiredPerm: 'removed_items' as PermissionKey, badge: removedItems.length > 0 ? removedItems.length : undefined },
    { id: 'settings' as const, label: t.settings, icon: Settings, requiredPerm: 'settings' as PermissionKey },
  ];

  // Filter items based on whether user has the permission
  const navItems = allNavItems.filter(item => {
    if (user?.role === 'Super Admin') return true;
    if (item.id === 'dashboard') return true;
    if (item.id === 'settings') return true; // Accessible for profile & security, with internal tab restrictions
    if (item.id === 'audit_logs') {
      return user?.role === 'Admin' || hasPermission('audit_logs');
    }
    if (item.id === 'performance') {
      return ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '') || hasPermission('performance');
    }
    if (item.id === 'certificates') {
      return (
        user?.role === 'Admin' ||
        hasPermission('certificates_view') ||
        hasPermission('certificates')
      );
    }
    if (item.id === 'dispatch') {
      return hasPermission('dispatch') || hasPermission('view');
    }
    if (item.id === 'removed') {
      return hasPermission('removed_items');
    }
    return hasPermission(item.requiredPerm);
  });

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  React.useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity animate-fade-in"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`bg-white text-slate-800 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-200 select-none transition-all duration-300 ease-in-out z-50 ${
          // Mobile: fixed drawer
          isMobileSidebarOpen
            ? `fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-72 shadow-2xl translate-x-0 md:static md:shadow-none`
            : `fixed inset-y-0 ${isRTL ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'} w-72 md:translate-x-0 md:static`
        } ${
          // Desktop collapsed vs expanded
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Hotel Brand Logo Header (Logo Only - No Text) */}
        <div className={`p-4 sm:p-5 border-b border-slate-100 relative flex items-center justify-center min-h-[76px] transition-all ${
          isSidebarCollapsed ? 'px-2 py-4' : 'px-4 py-4'
        }`}>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`md:hidden absolute top-3.5 ${isRTL ? 'left-3.5' : 'right-3.5'} p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors`}
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Toggle Button in Header */}
          <button
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
            className={`hidden md:flex absolute top-3.5 ${isRTL ? 'left-3.5' : 'right-3.5'} p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors z-10`}
          >
            {isSidebarCollapsed ? (
              isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Dynamic Hotel Brand Logo / Collapsed Sidebar Favicon */}
          <div className="flex items-center justify-center w-full px-1">
            {isSidebarCollapsed ? (
              /* Collapsed Sidebar (w-20): Render the configured Favicon */
              <div
                className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 shadow-2xs flex items-center justify-center overflow-hidden hover:border-indigo-300 hover:shadow-xs transition-all group"
                title={`${settings?.hotelName || 'Warwick'} - Favicon`}
              >
                <img
                  src={settings?.faviconUrl || settings?.logoUrl || '/icon.svg'}
                  alt="Favicon"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/icon.svg') {
                      target.src = '/icon.svg';
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : settings?.logoUrl ? (
              /* Expanded Sidebar: Render Full Hotel Brand Logo */
              <div
                className="flex items-center justify-center overflow-hidden transition-all rounded-xl bg-transparent"
                style={{
                  width: `${settings.logoWidth || 140}px`,
                  height: `${settings.logoHeight || 48}px`,
                  maxWidth: '100%'
                }}
              >
                <img
                  src={settings.logoUrl}
                  alt={settings.hotelName || 'Hotel Logo'}
                  className="w-full h-full transition-all duration-150"
                  style={{
                    objectFit: settings.logoFit || 'contain',
                    maxWidth: `${settings.logoWidth || 140}px`,
                    maxHeight: `${settings.logoHeight || 48}px`
                  }}
                  onError={(e) => {
                    if (settings?.faviconUrl) {
                      e.currentTarget.src = settings.faviconUrl;
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              /* Expanded Sidebar fallback if no logo: Favicon or Crown emblem */
              <div
                className="rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100/80 shadow-2xs transition-all p-2"
                style={{
                  width: `${Math.min(settings?.logoWidth || 140, 56)}px`,
                  height: `${Math.min(settings?.logoHeight || 48, 56)}px`
                }}
              >
                {settings?.faviconUrl ? (
                  <img
                    src={settings.faviconUrl}
                    alt="Favicon"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Crown
                    className="text-indigo-600"
                    style={{
                      width: `${Math.max(20, Math.min((settings?.logoHeight || 48) * 0.5, 30))}px`,
                      height: `${Math.max(20, Math.min((settings?.logoHeight || 48) * 0.5, 30))}px`
                    }}
                    strokeWidth={1.75}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
                  isSidebarCollapsed
                    ? 'justify-center px-2 py-3'
                    : 'space-x-3 rtl:space-x-reverse px-3.5 py-2.5 text-left rtl:text-right'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse / Expand Toggle Button Footer (Desktop) */}
        <div className="hidden md:block px-3 py-2 border-t border-slate-100">
          <button
            onClick={toggleSidebarCollapse}
            id="btn-sidebar-toggle-collapse"
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 p-2 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : 'space-x-2 rtl:space-x-reverse'
            }`}
            title={isSidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
                <span>{t.collapseSidebar}</span>
              </>
            )}
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/60">
          {!isSidebarCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="w-full flex items-center space-x-3 rtl:space-x-reverse mb-2.5 text-left rtl:text-right group hover:opacity-90 transition-opacity"
                title={t.myProfile}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0 group-hover:bg-indigo-700 transition-colors">
                  {user?.name ? user.name[0].toUpperCase() : 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {user?.name || 'Staff Member'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user?.email || (user?.staffId ? `ID: ${user.staffId}` : '')}
                  </p>
                </div>
              </button>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                  {user?.role === 'Super Admin' && <ShieldCheck className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-indigo-600" />}
                  {translateRole(user?.role)}
                </span>

                <button
                  id="btn-sidebar-signout"
                  onClick={() => logout()}
                  className="flex items-center space-x-1 rtl:space-x-reverse text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                title={`${user?.name} (${translateRole(user?.role)})`}
              >
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <button
                onClick={() => logout()}
                title={t.logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
