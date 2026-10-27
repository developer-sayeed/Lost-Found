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
import { UserAvatar } from '../lib/avatarHelper';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { resolveHotelLogo } from '../utils/logoHelper';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openStaffProfile,
    setSelectedStaffProfile,
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
  const { user, logout, hasPermission, isSuperAdmin, previewRole, effectiveRole } = useAuth();
  const { t, isRTL, translateRole } = useLanguage();
  const location = useLocation();
  const isMac = isMacOS();

  // Dynamic Theme state tracker for instant logo adaptation
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return settings?.themeMode === 'dark' || settings?.isDarkMode === true;
  });

  React.useEffect(() => {
    const checkDark = () => {
      const active = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ||
        settings?.themeMode === 'dark' ||
        settings?.isDarkMode === true;
      setIsDark(active);
    };
    checkDark();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          checkDark();
        }
      }
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [settings?.themeMode, settings?.isDarkMode]);

  // Dynamically resolve logo for current theme (Light Mode vs Dark Mode)
  const activeLogo = resolveHotelLogo(settings, isDark ? 'dark' : 'light');

  const currentRole = effectiveRole || user?.role || '';
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(currentRole);
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

  // Filter items strictly based on whether user has the permission
  const isMasterAdmin = isSuperAdmin && !previewRole;
  const navItems = allNavItems.filter(item => {
    if (isMasterAdmin) return true;
    if (item.id === 'dashboard') return true;
    if (item.id === 'items') return hasPermission('view');
    if (item.id === 'dispatch') return hasPermission('dispatch');
    if (item.id === 'staff') return hasPermission('staff_management');
    if (item.id === 'performance') return hasPermission('performance');
    if (item.id === 'certificates') return hasPermission('certificates_view') || hasPermission('certificates');
    if (item.id === 'audit_logs') return hasPermission('audit_logs');
    if (item.id === 'removed') return hasPermission('removed_items');
    if (item.id === 'settings') return hasPermission('settings') || hasPermission('manage_staff_access');
    return false;
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
        className={`bg-white dark:bg-[#0f0911] text-slate-800 dark:text-slate-100 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-200 dark:border-fuchsia-950/40 select-none transition-all duration-300 ease-in-out z-50 ${
          // Mobile: fixed drawer
          isMobileSidebarOpen
            ? 'fixed inset-y-0 left-0 w-72 shadow-2xl translate-x-0 md:static md:shadow-none'
            : 'fixed inset-y-0 left-0 -translate-x-full w-72 md:translate-x-0 md:static'
        } ${
          // Desktop collapsed vs expanded
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Hotel Brand Logo Header (Logo Only - No Text) */}
        <div className={`p-4 sm:p-5 border-b border-slate-100 dark:border-fuchsia-950/40 relative flex items-center justify-center min-h-[76px] transition-all ${
          isSidebarCollapsed ? 'px-2 py-4' : 'px-4 py-4'
        }`}>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`hidden md:flex absolute top-3.5 right-2.5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            title={t.collapseSidebar || 'Collapse Sidebar'}
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dynamic Hotel Brand Logo / Collapsed Sidebar Favicon */}
          <div className="flex items-center justify-center w-full px-1">
            {isSidebarCollapsed ? (
              /* Collapsed Sidebar (w-20): Render clickable Favicon to expand */
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 shadow-2xs flex items-center justify-center overflow-hidden hover:border-fuchsia-500 hover:shadow-xs transition-all group cursor-pointer"
                title={`${settings?.hotelName || 'Warwick'} - Click to expand sidebar`}
              >
                <img
                  src={settings?.faviconUrl || activeLogo.url || '/icon.svg'}
                  alt="Favicon"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/icon.svg') {
                      target.src = '/icon.svg';
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              </button>
            ) : activeLogo.url ? (
              /* Expanded Sidebar: Render Dynamic Hotel Brand Logo (Dark / Light Responsive) */
              <div
                className="flex items-center justify-center overflow-hidden transition-all duration-300 rounded-xl bg-transparent"
                style={{
                  width: `${settings?.logoWidth || 140}px`,
                  height: `${settings?.logoHeight || 48}px`,
                  maxWidth: '100%'
                }}
              >
                <img
                  key={activeLogo.url}
                  src={activeLogo.url}
                  alt={`${settings?.hotelName || 'Hotel Logo'} (${activeLogo.mode} mode)`}
                  className="w-full h-full transition-all duration-300 animate-fade-in"
                  style={{
                    objectFit: settings?.logoFit || 'contain',
                    maxWidth: `${settings?.logoWidth || 140}px`,
                    maxHeight: `${settings?.logoHeight || 48}px`
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
            const targetPath = item.id === 'dashboard' ? '/dashboard' : `/${item.id === 'audit_logs' ? 'audit-logs' : item.id}`;
            const isActive =
              location.pathname === targetPath ||
              (item.id === 'dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) ||
              (targetPath !== '/' && targetPath !== '/dashboard' && (location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`))) ||
              (item.id === 'settings' && (
                location.pathname.startsWith('/settings') ||
                activeTab === 'settings'
              )) ||
              (activeTab === item.id);
            return (
              <NavLink
                key={item.id}
                id={`nav-${item.id}`}
                to={targetPath}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-150 relative ${
                  isSidebarCollapsed
                    ? 'justify-center px-2 py-3'
                    : 'space-x-3 px-3.5 py-2.5 text-left'
                } ${
                  isActive
                    ? 'btn-primary-gradient !text-white shadow-md shadow-fuchsia-950/25 border border-white/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1f0e24] hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? '!text-white' : 'text-slate-400 dark:text-slate-500'
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
                {isSidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-2 min-w-[14px] h-3.5 px-1 rounded-full text-[9px] font-extrabold bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Bottom Expand Toggle in Collapsed Mode */}
          {isSidebarCollapsed && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="p-2 text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title={t.expandSidebar || 'Expand Sidebar'}
                aria-label="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/60">
          {!isSidebarCollapsed ? (
            <>
              <NavLink
                to="/profile"
                onClick={() => {
                  setSelectedStaffProfile(null);
                  setActiveTab('profile');
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 mb-2.5 text-left group hover:opacity-90 transition-opacity"
                title={t.myProfile}
              >
                <UserAvatar
                  name={user?.name || 'Staff Member'}
                  avatarUrl={(user as any)?.avatar}
                  sizeClassName="w-8 h-8"
                  className="shadow-2xs flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {user?.name || 'Staff Member'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user?.email || (user?.staffId ? `ID: ${user.staffId}` : '')}
                  </p>
                </div>
              </NavLink>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                  {user?.role === 'Super Admin' && <ShieldCheck className="w-3 h-3 mr-1 text-indigo-600" />}
                  {translateRole(user?.role)}
                </span>

                <button
                  id="btn-sidebar-signout"
                  onClick={() => logout()}
                  className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <UserAvatar
                name={user?.name || 'Staff Member'}
                avatarUrl={(user as any)?.avatar}
                sizeClassName="w-8 h-8"
                className="shadow-2xs"
              />
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
