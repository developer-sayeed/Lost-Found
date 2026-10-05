import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Bell,
  Trash2,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
  HeartHandshake,
  ExternalLink,
  Send,
  X,
  Eye,
  EyeOff,
  WifiOff
} from 'lucide-react';
import { AppNotification } from '../types';
import { PWAInstallButton } from './pwa/PWAInstallButton';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openStaffProfile,
    openQrScanner,
    isSyncPaused,
    syncSuccessNotice,
    settings,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    clearNotifications,
    deleteNotification,
    setIsBroadcastModalOpen,
    openNoticeModal,
    isNotificationRead,
    isNotificationDeleted,
    items,
    openItemDetails
  } = useApp();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t, isRTL, translateRole } = useLanguage();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Notifications can strictly ONLY be deleted or cleared by Admin or Supervisor
  const canDeleteNotifications = useMemo(() => {
    const role = user?.role || '';
    return ['Super Admin', 'Admin', 'Supervisor'].includes(role);
  }, [user?.role]);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  // Filter notifications relevant to current user with strict isolation for targeted notices and deduplication
  const userNotifications = useMemo(() => {
    const filtered = notifications.filter(n => {
      // Hide if dismissed or deleted by current user
      if (isNotificationDeleted(n)) return false;

      const userIdentifier = (user?.id || user?.name || '').toLowerCase().trim();
      const userName = (user?.name || '').toLowerCase().trim();
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userRole = (user?.role || '').trim();
      const lowerUserRole = userRole.toLowerCase();
      const userDept = (user?.department || '').toLowerCase().trim();
      const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(userRole);

      const hasDeptTarget = Boolean(n.targetDepartment && n.targetDepartment.trim());
      const hasRoleTarget = Boolean(n.targetRoles && n.targetRoles.length > 0);
      const hasStaffTarget = Boolean(n.targetStaffName || n.targetStaffEmail || n.targetUserId);
      const isExplicitTargeted = n.targetType === 'department' || n.targetType === 'individual' || n.targetType === 'roles' || (n.targetType !== 'all' && (hasDeptTarget || hasRoleTarget || hasStaffTarget));

      const isSender = (n.senderName && userName && n.senderName.toLowerCase() === userName) ||
        (n.senderEmail && userEmail && n.senderEmail.toLowerCase() === userEmail);

      // If notification is explicitly targeted to specific recipients
      if (isExplicitTargeted) {
        if (user?.role === 'Super Admin') return true;

        // 1. Individual Staff Target
        if (n.targetType === 'individual' || hasStaffTarget) {
          const matchName = Boolean(n.targetStaffName && userName && (
            n.targetStaffName.toLowerCase().trim() === userName ||
            userName.includes(n.targetStaffName.toLowerCase().trim()) ||
            n.targetStaffName.toLowerCase().trim().includes(userName)
          ));
          const matchEmail = Boolean(n.targetStaffEmail && userEmail && (
            n.targetStaffEmail.toLowerCase().trim() === userEmail
          ));
          const matchId = Boolean(n.targetUserId && user?.id && n.targetUserId === user.id);

          return Boolean(matchName || matchEmail || matchId || isSender);
        }

        // 2. Department Target
        if (n.targetType === 'department' || hasDeptTarget) {
          const targetDept = (n.targetDepartment || '').toLowerCase().trim();
          const matchDept = Boolean(userDept && (
            userDept === targetDept ||
            userDept.includes(targetDept) ||
            targetDept.includes(userDept)
          ));
          const matchRoleAsDept = Boolean(lowerUserRole && (
            lowerUserRole === targetDept ||
            lowerUserRole.includes(targetDept) ||
            targetDept.includes(lowerUserRole)
          ));

          return Boolean(matchDept || matchRoleAsDept || isSender);
        }

        // 3. Role Target
        if (n.targetType === 'roles' || hasRoleTarget) {
          const matchRole = Boolean(n.targetRoles && n.targetRoles.some(r => r && typeof r === 'string' && r.toLowerCase().trim() === lowerUserRole));
          return Boolean(matchRole || isSender);
        }

        return false;
      }

      // Non-targeted notifications (all-staff broadcast or system alerts)
      if (n.type === 'store_request') {
        return isAdminTier;
      }

      return true;
    });

    // Deduplication pass: ensure only a single notification is displayed per event/item
    const seen = new Set<string>();
    const deduplicated: typeof filtered = [];

    for (const notif of filtered) {
      const itemKey = notif.itemCode || notif.itemId || '';
      const normTitle = (notif.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const timeBucket = Math.floor(new Date(notif.createdAt).getTime() / 60000); // 1-minute bucket
      const dedupKey = itemKey
        ? `${notif.type || 'gen'}_${itemKey}_${timeBucket}`
        : `${normTitle}_${timeBucket}`;

      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        deduplicated.push(notif);
      }
    }

    return deduplicated;
  }, [notifications, user, isNotificationDeleted]);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.dashboard;
      case 'items':
        return t.lostAndFoundItems;
      case 'dispatch':
        return t.pendingDispatch;
      case 'staff':
        return t.staffManagement;
      case 'performance':
        return t.performance || 'Staff Performance';
      case 'certificates':
        return t.certificates || 'Award Certificates';
      case 'audit_logs':
        return t.auditLogs || 'Audit & Accountability Logs';
      case 'removed':
        return t.removedItems;
      case 'settings':
        return t.settings;
      case 'profile':
        return t.myProfile;
      default:
        return t.portalTitle;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    openNoticeModal(notif);
    setIsNotifOpen(false);
  };

  const renderNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'store_request':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
        );
      case 'item_approved':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        );
      case 'item_rejected':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'item_handover':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
        );
      case 'item_dispatched':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Left side: Mobile Hamburger, Desktop Toggle, Breadcrumb & Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
          title={t.expandSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden md:flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs"
          title={isSidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
        >
          {isSidebarCollapsed ? (
            <>
              <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px]">{t.expandSidebar}</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
              <span className="text-[11px]">{t.collapseSidebar}</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Breadcrumb / Title */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">{settings.hotelName || t.warwickHotel}</span>
          <span className="text-slate-300 text-xs hidden sm:inline">/</span>
          <h1 className="text-sm font-bold text-slate-900 truncate">
            {getPageTitle()}
          </h1>
        </div>

        {syncSuccessNotice && (
          <span className="hidden lg:inline-flex items-center space-x-1.5 rtl:space-x-reverse ml-2 rtl:ml-0 rtl:mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{syncSuccessNotice}</span>
          </span>
        )}
      </div>

      {/* Center/Right Controls & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
        {/* Language Switcher (English / العربية) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              language === 'en'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="English Interface"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              language === 'ar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="الواجهة العربية (Arabic)"
          >
            عربي
          </button>
        </div>

        {/* Quick QR Scanner Button */}
        <button
          type="button"
          id="btn-header-qr-scanner"
          onClick={openQrScanner}
          className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold transition-all shadow-2xs group"
          title={t.scanQr}
        >
          <QrCode className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">{t.quickScan}</span>
        </button>

        {/* PWA App Install Button (for mobile hotel staff) */}
        <PWAInstallButton />

        {/* Real-time Notifications Bell & Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            id="btn-header-notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title={t.notifications || 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              {/* Mobile backdrop overlay to close notification popup on outside tap */}
              <div
                className="fixed inset-0 bg-slate-950/30 sm:hidden z-40 backdrop-blur-2xs animate-fade-in"
                onClick={() => setIsNotifOpen(false)}
                aria-hidden="true"
              />

              <div
                className={`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 sm:w-96 max-h-[calc(100vh-5.5rem)] sm:max-h-none bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col ${
                  isRTL ? 'sm:left-0 sm:origin-top-left' : 'sm:right-0 sm:origin-top-right'
                }`}
              >
                {/* Dropdown Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-xs font-bold text-slate-900">{t.notifications || 'Notifications'}</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    {/* Broadcast notice button for admin / supervisor */}
                    {['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotifOpen(false);
                          setIsBroadcastModalOpen(true);
                        }}
                        className="flex items-center space-x-1 rtl:space-x-reverse text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                        title="Broadcast Notice to Staff"
                      >
                        <Send className="w-3 h-3" />
                        <span>Notice</span>
                      </button>
                    )}
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                        title={t.markAllAsRead || 'Mark all as read'}
                      >
                        {t.markAllAsRead || 'Mark all read'}
                      </button>
                    )}
                    {userNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearNotifications(false)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t.clearAllNotifications || 'Clear all notifications for me'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100 flex-1">
                {userNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {t.noNotifications || 'No notifications at this time'}
                    </p>
                  </div>
                ) : (
                  userNotifications.map(notif => {
                    const isUnread = !isNotificationRead(notif);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 rtl:space-x-reverse relative group/item ${
                          isUnread ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {renderNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 pr-14 rtl:pr-0 rtl:pl-14">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center space-x-1.5 rtl:space-x-reverse truncate">
                              <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {notif.title}
                              </h4>
                              {notif.priority === 'urgent' && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 uppercase">
                                  Urgent
                                </span>
                              )}
                              {notif.priority === 'high' && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-700 uppercase">
                                  High
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.itemCode && (
                            <div className="mt-1.5 flex items-center space-x-1.5 rtl:space-x-reverse">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                {notif.itemCode}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5 hover:underline">
                                View Item <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick action buttons on hover: Toggle Read/Unread & Dismiss for me */}
                        <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex items-center space-x-1 rtl:space-x-reverse opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isUnread) {
                                markNotificationRead(notif.id);
                              } else {
                                markNotificationUnread(notif.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-200/70 transition-colors"
                            title={isUnread ? "Mark as read" : "Mark as unread"}
                          >
                            {isUnread ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id, false);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-200/70 transition-colors"
                            title="Dismiss notification for me"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5 group-hover/item:hidden" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
        </div>

        {/* Global Offline Badge when sync is paused (visible on all screens) */}
        {isSyncPaused && (
          <div
            id="badge-header-offline"
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 text-xs font-semibold rounded-xl bg-amber-100/90 text-amber-900 border border-amber-200/90 shadow-2xs"
            title={t.offlineNoticeDescription}
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">{t.offlineSyncPaused}</span>
            <span className="md:hidden">Offline</span>
          </div>
        )}

        {/* User Profile Info */}
        <button
          type="button"
          onClick={() => openStaffProfile(null)}
          className="flex items-center space-x-2.5 rtl:space-x-reverse pl-2 sm:pl-3 rtl:pl-0 rtl:pr-2 sm:rtl:pr-3 border-l rtl:border-l-0 rtl:border-r border-slate-200 hover:opacity-80 transition-opacity text-left rtl:text-right group"
          title={t.myProfile}
        >
          <div className="text-right rtl:text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {user?.name || 'MD ABU SAYEED RIDAY'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {translateRole(user?.role)}
            </p>
          </div>
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 transition-colors text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-indigo-100 flex-shrink-0"
            title={`${user?.name} (${translateRole(user?.role)})`}
          >
            {getInitials(user?.name)}
          </div>
        </button>
      </div>
    </header>
  );
};
