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
    if (currentPath.startsWith('/databases')) {
      return {
        title: 'Database & Sync Settings',
        icon: Database,
        parentPath: '/settings',
        parentTitle: t.settings || 'Settings'
      };
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
    if (currentPath.startsWith('/guest-portal')) {
      return { title: 'Public Guest Portal', icon: Globe };
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
      className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-medium text-slate-500 rtl:space-x-reverse select-none overflow-hidden"
    >
      {/* Root / Hotel Brand */}
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 transition-colors shrink-0 group"
        title="Go to Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        <span className="hidden lg:inline font-semibold text-slate-700 group-hover:text-indigo-600">
          {settings.hotelName || t.warwickHotel || 'Warwick Hotel'}
        </span>
      </Link>

      {/* Separator */}
      <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 rtl:rotate-180" />

      {/* Parent route link if available */}
      {routeInfo.parentPath && routeInfo.parentTitle && (
        <>
          <Link
            to={routeInfo.parentPath}
            className="hover:text-indigo-600 text-slate-600 transition-colors hidden sm:inline"
          >
            {routeInfo.parentTitle}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 rtl:rotate-180 hidden sm:inline" />
        </>
      )}

      {/* Current Active Page with Icon */}
      <div className="flex items-center space-x-1.5 rtl:space-x-reverse font-bold text-slate-900 bg-slate-100/80 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs truncate">
        {IconComponent && (
          <IconComponent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        )}
        <span className="truncate text-xs text-slate-900" id="current-breadcrumb-title">
          {routeInfo.title}
        </span>
      </div>
    </nav>
  );
};
