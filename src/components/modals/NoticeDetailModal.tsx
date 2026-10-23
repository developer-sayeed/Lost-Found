import React from 'react';
import {
  X,
  Bell,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  UserCheck,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Users,
  Building,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppNotification } from '../../types';
import { toast } from 'react-toastify';

export const NoticeDetailModal: React.FC = () => {
  const {
    isNoticeModalOpen,
    selectedNoticeForModal,
    closeNoticeModal,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
    items,
    openItemDetails,
    isNotificationRead
  } = useApp();

  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  if (!isNoticeModalOpen || !selectedNoticeForModal) return null;

  const notif = selectedNoticeForModal;
  const isRead = isNotificationRead ? isNotificationRead(notif) : true;
  const isAdminTier = user?.role === 'Super Admin' || user?.role === 'Admin';

  const handleCopyMessage = () => {
    if (!notif.message) return;
    navigator.clipboard.writeText(`${notif.title}\n\n${notif.message}`);
    setCopied(true);
    toast.info('Notice content copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleRead = () => {
    if (isRead) {
      markNotificationUnread(notif.id);
      toast.info('Marked as unread');
    } else {
      markNotificationRead(notif.id);
      toast.success('Marked as read');
    }
  };

  const handleDeleteForMe = async () => {
    await deleteNotification(notif.id, false);
    closeNoticeModal();
  };

  const handleDeleteForEveryone = async () => {
    if (window.confirm('Are you sure you want to permanently delete this notice for ALL staff and users?')) {
      await deleteNotification(notif.id, true);
      closeNoticeModal();
    }
  };

  const handleViewItem = () => {
    if (notif.itemId || notif.itemCode) {
      const match = items.find(
        it =>
          (notif.itemId && it.id === notif.itemId) ||
          (notif.itemCode && it.code && it.code.toLowerCase().trim() === notif.itemCode.toLowerCase().trim())
      );
      if (match) {
        closeNoticeModal();
        openItemDetails(match);
      } else {
        toast.warning('Linked item was not found in active records.');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeBadge = (type: AppNotification['type']) => {
    switch (type) {
      case 'notice':
        return {
          label: 'Official Notice',
          bg: 'bg-indigo-50 dark:bg-fuchsia-950/60 text-[#5E1E6C] dark:text-fuchsia-300 border-indigo-200 dark:border-fuchsia-800/60',
          icon: Bell
        };
      case 'store_request':
        return {
          label: 'Store Request',
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          icon: Package
        };
      case 'item_approved':
        return {
          label: 'Item Approved',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          icon: CheckCircle
        };
      case 'item_rejected':
        return {
          label: 'Item Rejected',
          bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          icon: XCircle
        };
      case 'item_dispatched':
        return {
          label: 'Item Dispatched',
          bg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
          icon: Truck
        };
      case 'item_handover':
        return {
          label: 'Guest Handover',
          bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          icon: UserCheck
        };
      case 'alert':
        return {
          label: 'Priority Alert',
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          icon: AlertTriangle
        };
      default:
        return {
          label: 'System Notice',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: Info
        };
    }
  };

  const badgeInfo = getTypeBadge(notif.type);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div
      id="modal-notice-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={closeNoticeModal}
    >
      <div
        id="modal-notice-detail"
        className="relative w-full max-w-lg bg-white dark:bg-[#150B1C] rounded-2xl shadow-2xl shadow-fuchsia-950/20 border border-[#5E1E6C]/50 dark:border-fuchsia-500/50 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeInfo.bg}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badgeInfo.label}</span>
            </span>

            {notif.priority === 'urgent' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                Urgent Priority
              </span>
            )}
            {notif.priority === 'high' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                High Priority
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-close-notice-modal"
            onClick={closeNoticeModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {notif.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(notif.createdAt)}</span>
            </div>
          </div>

          {/* Metadata Card: Sender & Target */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/70 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 text-xs space-y-2.5">
            {/* Sender */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Sender:
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {notif.senderName || 'System'}
                </span>
                {notif.senderRole && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-fuchsia-100 dark:bg-fuchsia-950/70 text-[#5E1E6C] dark:text-fuchsia-300 border border-fuchsia-200/80 dark:border-fuchsia-700/60 rounded-md">
                    {notif.senderRole}
                  </span>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Audience:
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {notif.targetType === 'all' && 'All Staff & Departments'}
                {notif.targetType === 'department' && (
                  <span className="inline-flex items-center gap-1 text-[#5E1E6C] dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/50 border border-fuchsia-200/70 dark:border-fuchsia-800/50 px-2 py-0.5 rounded-md font-medium">
                    <Building className="w-3 h-3" />
                    {notif.targetDepartment || 'Specific Department'}
                  </span>
                )}
                {notif.targetType === 'individual' && (
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {notif.targetStaffName || notif.targetStaffEmail || 'Individual Staff'}
                  </span>
                )}
                {notif.targetType === 'roles' && (
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {Array.isArray(notif.targetRoles) ? notif.targetRoles.join(', ') : 'Roles'}
                  </span>
                )}
                {!notif.targetType && 'General Notification'}
              </span>
            </div>

            {/* Item Reference if attached */}
            {(notif.itemId || notif.itemCode) && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  Related Item:
                </span>
                <button
                  type="button"
                  onClick={handleViewItem}
                  className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/50 text-[#5E1E6C] dark:text-fuchsia-300 border border-fuchsia-200/80 dark:border-fuchsia-800/60 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/60 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="Click to view full item details"
                >
                  <span>{notif.itemCode || 'View Item'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Notice Message Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Notice Details
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center space-x-1 text-xs text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/70 border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 rounded-xl text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
              {notif.message || 'No detailed message provided.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          {/* Read / Unread toggle */}
          <button
            type="button"
            id="btn-toggle-read-notice"
            onClick={handleToggleRead}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isRead ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Mark as Unread</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                <span>Mark as Read</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {/* Delete for current user */}
            <button
              type="button"
              id="btn-delete-notice-for-me"
              onClick={handleDeleteForMe}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition-colors"
              title="Remove this notice from your inbox only"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dismiss for Me</span>
            </button>

            {/* Super Admin / Admin: Delete for Everyone */}
            {isAdminTier && (
              <button
                type="button"
                id="btn-delete-notice-for-all"
                onClick={handleDeleteForEveryone}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Permanently remove notice for all staff"
              >
                <span>Delete for All</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeNoticeModal}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#5E1E6C] dark:bg-fuchsia-600 hover:bg-[#491754] dark:hover:bg-fuchsia-500 text-white transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

