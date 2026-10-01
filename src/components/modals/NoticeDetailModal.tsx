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
        return { label: 'Official Notice', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Bell };
      case 'store_request':
        return { label: 'Store Request', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Package };
      case 'item_approved':
        return { label: 'Item Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
      case 'item_rejected':
        return { label: 'Item Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
      case 'item_dispatched':
        return { label: 'Item Dispatched', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Truck };
      case 'item_handover':
        return { label: 'Guest Handover', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: UserCheck };
      case 'alert':
        return { label: 'Priority Alert', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
      default:
        return { label: 'System Notice', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Info };
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <span
              className={`inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeInfo.bg}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badgeInfo.label}</span>
            </span>

            {notif.priority === 'urgent' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                Urgent Priority
              </span>
            )}
            {notif.priority === 'high' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                High Priority
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-close-notice-modal"
            onClick={closeNoticeModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {notif.title}
            </h2>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(notif.createdAt)}</span>
            </div>
          </div>

          {/* Metadata Card: Sender & Target */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2.5">
            {/* Sender */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Sender:
              </span>
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <span className="font-semibold text-slate-800">
                  {notif.senderName || 'System'}
                </span>
                {notif.senderRole && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-700 rounded-md">
                    {notif.senderRole}
                  </span>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Audience:
              </span>
              <span className="font-semibold text-slate-700">
                {notif.targetType === 'all' && 'All Staff & Departments'}
                {notif.targetType === 'department' && (
                  <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                    <Building className="w-3 h-3" />
                    {notif.targetDepartment || 'Specific Department'}
                  </span>
                )}
                {notif.targetType === 'individual' && (
                  <span className="text-slate-800 font-medium">
                    {notif.targetStaffName || notif.targetStaffEmail || 'Individual Staff'}
                  </span>
                )}
                {notif.targetType === 'roles' && (
                  <span className="text-slate-800 font-medium">
                    {Array.isArray(notif.targetRoles) ? notif.targetRoles.join(', ') : 'Roles'}
                  </span>
                )}
                {!notif.targetType && 'General Notification'}
              </span>
            </div>

            {/* Item Reference if attached */}
            {(notif.itemId || notif.itemCode) && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  Related Item:
                </span>
                <button
                  type="button"
                  onClick={handleViewItem}
                  className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-mono text-[11px] font-bold transition-colors cursor-pointer"
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
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Notice Details
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center space-x-1 rtl:space-x-reverse text-xs text-slate-400 hover:text-slate-700 transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
              {notif.message || 'No detailed message provided.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Read / Unread toggle */}
          <button
            type="button"
            id="btn-toggle-read-notice"
            onClick={handleToggleRead}
            className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isRead ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Mark as Unread</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark as Read</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Delete for current user */}
            <button
              type="button"
              id="btn-delete-notice-for-me"
              onClick={handleDeleteForMe}
              className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
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
                className="hidden sm:inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                title="Permanently remove notice for all staff"
              >
                <span>Delete for All</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeNoticeModal}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
