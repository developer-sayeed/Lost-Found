import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, LayoutDashboard, Package, Clock, Users, TrendingUp, Award, History, Settings, Trash2, User, Database, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export interface RouteBreadcrumbConfig {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  parentPath?: string;
  parentTitle?: string;
}

export const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const { settings, selectedStaffProfile } = useApp();
  const { t, isRTL } = useLanguage();

  const currentPath = location.pathname.toLowerCase();

  // Dynamic route metadata lookup
  const getRouteInfo = (): RouteBreadcrumbConfig => {
    if (currentPath === '/' || currentPath === '/dashboard') {
      return { title: t.dashboard || 'Dashboard', icon: LayoutDashboard };
    }
    if (currentPath.startsWith('/items')) {
      return { title: t.lostAndFoundItems || 'Lost & Found Items', icon: Package };
    }
    if (currentPath.startsWith('/dispatch')) {
      return { title: t.pendingDispatch || 'Pending Dispatch', icon: Clock };
    }
    if (currentPath.startsWith('/staff')) {
      return { title: t.staffManagement || 'Staff Management', icon: Users };
    }
    if (currentPath.startsWith('/performance')) {
      return { title: t.performance || 'Staff Performance', icon: TrendingUp };
    }
    if (currentPath.startsWith('/certificates')) {
      return { title: t.certificates || 'Certificates & Awards', icon: Award };
    }
    if (currentPath.startsWith('/audit-logs') || currentPath.startsWith('/audit_logs')) {
      return { title: t.auditLogs || 'Audit & Activity Logs', icon: History };
    }
    if (currentPath.startsWith('/settings/')) {
      const sub = currentPath.replace('/settings/', '').split('/')[0];
      const subNames: Record<string, string> = {
        'hotel': 'Hotel Information',
        'hotel-information': 'Hotel Information',
        'certificate': 'Certificate & Logo',
        'logo': 'Certificate & Logo',
        'categories': 'Item Categories',
        'security': 'Password & Security',
        'database': 'Database Integrations',
        'google-drive': 'Google Drive Backup',
        'sync': 'Connected Devices',
        'import-data': 'Data Import & Export',
        'alerts-validation': 'Alerts & Validation',
        'login-page': 'Login Page Branding',
        'shortcuts': 'Keyboard Shortcuts'
      };
      return {
        title: subNames[sub] || 'Settings',
        icon: Settings,
        parentPath: '/settings',
        parentTitle: t.settings || 'System Settings'
      };
    }
    if (currentPath.startsWith('/settings')) {
      return { title: t.settings || 'System Settings', icon: Settings };
    }
    if (currentPath.startsWith('/profile/')) {
      const staffParam = decodeURIComponent(currentPath.replace('/profile/', ''));
      return {
        title: selectedStaffProfile ? `${selectedStaffProfile.name}'s Profile` : `Staff Profile (${staffParam})`,
        icon: User,
        parentPath: '/profile',
        parentTitle: t.myProfile || 'My Profile'
      };
    }
    if (currentPath.startsWith('/profile')) {
      return {
        title: selectedStaffProfile ? `${selectedStaffProfile.name}'s Profile` : (t.myProfile || 'My Profile'),
        icon: User
      };
    }
    if (currentPath.startsWith('/removed')) {
      return { title: t.removedItems || 'Removed Records', icon: Trash2 };
    }

    // Default fallback
    return { title: t.portalTitle || 'Lost & Found Portal', icon: Home };
  };

  const routeInfo = getRouteInfo();
  const IconComponent = routeInfo.icon;
  const isHome = currentPath === '/' || currentPath === '/dashboard';

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="hidden md:flex items-center space-x-1.5 sm:space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 select-none overflow-hidden"
    >
      {/* Root / Hotel Brand */}
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors shrink-0 group"
        title="Go to Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors" />
        <span className="hidden lg:inline font-semibold text-slate-700 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400">
          {settings.hotelName || t.warwickHotel || 'Warwick Hotel'}
        </span>
      </Link>

      {/* Separator */}
      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />

      {/* Parent route link if available */}
      {routeInfo.parentPath && routeInfo.parentTitle && (
        <>
          <Link
            to={routeInfo.parentPath}
            className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 text-slate-600 dark:text-slate-300 transition-colors hidden sm:inline"
          >
            {routeInfo.parentTitle}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 hidden sm:inline" />
        </>
      )}

      {/* Current Active Page with Icon (Matching Primary Button Gradient Style) */}
      <div className="flex items-center space-x-1.5 font-bold text-white btn-primary-gradient px-2.5 py-1 rounded-lg shadow-xs border border-white/20 truncate">
        {IconComponent && (
          <IconComponent className="w-3.5 h-3.5 text-white shrink-0" />
        )}
        <span className="truncate text-xs text-white" id="current-breadcrumb-title">
          {routeInfo.title}
        </span>
      </div>
    </nav>
  );
};
