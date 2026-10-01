import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Package,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  HeartHandshake,
  Trash2,
  RotateCcw,
  Edit3,
  PlusCircle,
  FileText,
  ExternalLink,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Key,
  UserCheck,
  UserCog,
  UserPlus,
  UserMinus,
  Award,
  CheckSquare,
  Square,
  AlertTriangle,
  Lock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuditLog, UserRole } from '../types';
import { api } from '../lib/api';

// Helper to generate a sliding window of page numbers with ellipsis
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export const AuditLogsView: React.FC = () => {
  const { items, openItemDetails } = useApp();
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();

  // Admin / Audit access check (Super Admin, Admin, or staff granted audit_logs permission)
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin' || hasPermission('audit_logs');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [source, setSource] = useState<string>('local');
  const [stats, setStats] = useState<any>(null);

  // Responsive View Mode: cards (feed) for mobile, table for desktop
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // Mobile filters collapsible state
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntityTab, setSelectedEntityTab] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLog | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Multi-Selection State for Batch Deletion
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialog States for Deletions
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  // Auto detect mobile resize
  useEffect(() => {
    const handleResize = () => {
      // Optional screen size listener
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAuditData = useCallback(async (showRefreshingSpinner = false) => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getAuditLogs(
          {
            limit: 1000
          },
          user
        ),
        api.getAuditLogStats(user)
      ]);

      if (logsRes && Array.isArray(logsRes.logs)) {
        // Strip out any legacy test mocks starting with audit-log-00
        const authenticLogs = logsRes.logs.filter(
          l => !l.id.startsWith('audit-log-00')
        );
        setLogs(authenticLogs);
        setSource(logsRes.source || 'server');
      }
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
      if (showRefreshingSpinner) setIsRefreshing(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(() => {
      fetchAuditData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAuditData]);

  // Handle single log deletion
  const handleDeleteSingleLog = async (logId: string) => {
    if (!isAdmin) {
      toast.error('Permission denied: Only Administrators can delete audit logs.');
      return;
    }
    try {
      const success = await api.deleteAuditLog(logId, user);
      if (success) {
        setLogs(prev => prev.filter(l => l.id !== logId));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(logId);
          return next;
        });
        if (selectedLogDetail?.id === logId) {
          setSelectedLogDetail(null);
        }
        setLogToDelete(null);
        toast.success('Audit log deleted successfully.');
        // Refresh stats
        api.getAuditLogStats(user).then(s => s && setStats(s)).catch(() => {});
      } else {
        toast.error('Failed to delete audit log. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting audit log');
    }
  };

  // Handle batch deletion of selected logs
  const handleBatchDelete = async () => {
    if (!isAdmin) {
      toast.error('Permission denied: Only Administrators can delete audit logs.');
      return;
    }
    if (selectedIds.size === 0) return;

    setIsBatchDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      const success = await api.batchDeleteAuditLogs(idsArray, user);
      if (success) {
        const deletedCount = selectedIds.size;
        setLogs(prev => prev.filter(l => !selectedIds.has(l.id)));
        setSelectedIds(new Set());
        setShowBatchDeleteConfirm(false);
        toast.success(`Successfully deleted ${deletedCount} audit records.`);
        api.getAuditLogStats(user).then(s => s && setStats(s)).catch(() => {});
      } else {
        toast.error('Failed to batch delete audit logs.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting audit logs');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Handle Clear All Logs
  const handleClearAllLogs = async () => {
    if (!isAdmin) {
      toast.error('Permission denied: Only Administrators can clear audit logs.');
      return;
    }
    setIsClearingAll(true);
    try {
      const success = await api.clearAuditLogs(user);
      if (success) {
        setLogs([]);
        setSelectedIds(new Set());
        setSelectedLogDetail(null);
        setShowClearAllConfirm(false);
        toast.success('All audit logs have been cleared.');
        setStats({
          total: 0,
          recent24h: 0,
          statusChanges: 0,
          itemCreations: 0,
          handovers: 0,
          dispatches: 0,
          approvals: 0,
          byActionType: {},
          topActors: []
        });
      } else {
        toast.error('Failed to clear audit logs.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error clearing audit logs');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Selection helpers
  const toggleSelectLog = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Entity Tab Filter
      if (selectedEntityTab !== 'all') {
        const entity = (log.entityType || 'item').toLowerCase();
        const actionType = (log.actionType || '').toLowerCase();
        const actionLower = (log.action || '').toLowerCase();

        if (selectedEntityTab === 'item') {
          if (entity !== 'item' && !actionLower.includes('item')) return false;
        } else if (selectedEntityTab === 'staff') {
          const isStaff =
            entity === 'staff' ||
            entity === 'user' ||
            actionType.includes('permission') ||
            actionType.includes('role') ||
            actionType.includes('user') ||
            actionLower.includes('staff') ||
            actionLower.includes('permission');
          if (!isStaff) return false;
        } else if (selectedEntityTab === 'certificate') {
          const isCert =
            entity === 'certificate' ||
            actionType.includes('certificate') ||
            actionLower.includes('certificate');
          if (!isCert) return false;
        } else if (selectedEntityTab === 'security') {
          const isSecurity =
            entity === 'auth' ||
            actionType === 'auth' ||
            actionLower.includes('password') ||
            actionLower.includes('login');
          if (!isSecurity) return false;
        } else if (selectedEntityTab === 'settings') {
          const isSettings =
            entity === 'settings' ||
            entity === 'database' ||
            actionLower.includes('setting') ||
            actionLower.includes('clear') ||
            actionLower.includes('theme');
          if (!isSettings) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          (log.action && log.action.toLowerCase().includes(query)) ||
          (log.details && log.details.toLowerCase().includes(query)) ||
          (log.performedBy && log.performedBy.toLowerCase().includes(query)) ||
          (log.itemCode && log.itemCode.toLowerCase().includes(query)) ||
          (log.itemName && log.itemName.toLowerCase().includes(query)) ||
          (log.category && log.category.toLowerCase().includes(query)) ||
          (log.reason && log.reason.toLowerCase().includes(query)) ||
          (log.performedByEmail && log.performedByEmail.toLowerCase().includes(query)) ||
          (log.previousStatus && log.previousStatus.toLowerCase().includes(query)) ||
          (log.newStatus && log.newStatus.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Action Type Filter
      if (selectedActionType !== 'all') {
        const actLower = (log.action || '').toLowerCase();
        const type = log.actionType || '';

        if (selectedActionType === 'status_change') {
          const isStatus =
            type === 'status_change' ||
            actLower.includes('status') ||
            (log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus);
          if (!isStatus) return false;
        } else if (selectedActionType === 'handover') {
          if (type !== 'handover' && !actLower.includes('handover')) return false;
        } else if (selectedActionType === 'dispatch') {
          if (type !== 'dispatch' && !actLower.includes('dispatch')) return false;
        } else if (selectedActionType === 'create') {
          if (type !== 'create' && !actLower.includes('register') && !actLower.includes('add') && !actLower.includes('creat')) return false;
        } else if (selectedActionType === 'update') {
          if (type !== 'update' && !actLower.includes('update') && !actLower.includes('edit')) return false;
        } else if (selectedActionType === 'permission_change') {
          if (type !== 'permission_change' && !actLower.includes('permission')) return false;
        } else if (selectedActionType === 'role_change') {
          if (type !== 'role_change' && !actLower.includes('role')) return false;
        } else if (selectedActionType === 'user_update') {
          if (type !== 'user_update' && !actLower.includes('staff information') && !actLower.includes('profile updated')) return false;
        } else if (selectedActionType === 'delete') {
          if (type !== 'delete' && type !== 'trash' && !actLower.includes('delete') && !actLower.includes('trash') && !actLower.includes('remov')) return false;
        } else if (selectedActionType === 'approval') {
          if (type !== 'approval' && !actLower.includes('approv')) return false;
        } else if (selectedActionType === 'rejection') {
          if (type !== 'rejection' && !actLower.includes('reject')) return false;
        } else if (selectedActionType === 'certificate') {
          if (!type.includes('certificate') && !actLower.includes('certificate')) return false;
        } else if (type !== selectedActionType) {
          return false;
        }
      }

      // Role Filter
      if (selectedRole !== 'all') {
        const role = log.userRole || log.performedByRole;
        if (role !== selectedRole) return false;
      }

      // Date Range Filter
      if (selectedDateRange !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (selectedDateRange === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (logTime < startOfToday) return false;
        } else if (selectedDateRange === '7d') {
          if (now - logTime > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (selectedDateRange === '30d') {
          if (now - logTime > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [logs, selectedEntityTab, searchQuery, selectedActionType, selectedRole, selectedDateRange]);

  // Reset currentPage to 1 whenever any filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEntityTab, selectedActionType, selectedRole, selectedDateRange, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  // Auto-correct currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated subset of logs for the current page view
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Selection helpers: Select all on current page vs All across all pages
  const handleSelectAll = () => {
    const pageIds = paginatedLogs.map(l => l.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleSelectAllAcrossPages = () => {
    if (selectedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedEntityTab !== 'all') count++;
    if (selectedActionType !== 'all') count++;
    if (selectedRole !== 'all') count++;
    if (selectedDateRange !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedEntityTab, selectedActionType, selectedRole, selectedDateRange, searchQuery]);

  // Rich Action Badge Visual Mapping for ALL actions across the system
  const getActionBadge = (log: AuditLog) => {
    const actLower = (log.action || '').toLowerCase();
    const type = (log.actionType || '').toLowerCase();

    // 1. Handover
    if (type === 'handover' || actLower.includes('handover') || actLower.includes('handed over')) {
      return {
        icon: HeartHandshake,
        label: 'Handover to Guest',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    // 2. Dispatch
    if (type === 'dispatch' || actLower.includes('dispatch')) {
      return {
        icon: Truck,
        label: 'Dispatched',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    // 3. User Permission Change
    if (type === 'permission_change' || actLower.includes('permission')) {
      return {
        icon: Key,
        label: 'Permission Changed',
        className: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    }
    // 4. User Role Change
    if (type === 'role_change' || actLower.includes('role changed') || actLower.includes('user role')) {
      return {
        icon: UserCheck,
        label: 'Role Changed',
        className: 'bg-violet-50 text-violet-700 border-violet-200'
      };
    }
    // 5. User / Staff Information Edit
    if (type === 'user_update' || actLower.includes('staff information') || actLower.includes('profile updated')) {
      return {
        icon: UserCog,
        label: 'Staff Edited',
        className: 'bg-cyan-50 text-cyan-700 border-cyan-200'
      };
    }
    // 6. Staff Added
    if (actLower.includes('staff added') || type === 'staff_create' || type === 'user_create') {
      return {
        icon: UserPlus,
        label: 'Staff Added',
        className: 'bg-teal-50 text-teal-700 border-teal-200'
      };
    }
    // 7. Staff Removed
    if (actLower.includes('staff removed') || type === 'staff_delete' || type === 'user_delete') {
      return {
        icon: UserMinus,
        label: 'Staff Removed',
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    // 8. Certificate Actions
    if (type.includes('certificate') || actLower.includes('certificate')) {
      return {
        icon: Award,
        label: 'Certificate',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    // 9. Status Change
    if (type === 'status_change' || actLower.includes('status changed') || actLower.includes('status')) {
      return {
        icon: ArrowRight,
        label: 'Status Change',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    // 10. Return to Store
    if (type === 'return_to_store' || actLower.includes('returned to store') || actLower.includes('return to store')) {
      return {
        icon: RotateCcw,
        label: 'Return to Store',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    // 11. Approval
    if (type === 'approval' || type === 'approve' || actLower.includes('approv')) {
      return {
        icon: CheckCircle2,
        label: 'Item Approved',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    // 12. Rejection
    if (type === 'rejection' || type === 'reject' || actLower.includes('reject')) {
      return {
        icon: AlertCircle,
        label: 'Item Rejected',
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    // 13. Registration / New Item
    if (type === 'create' || actLower.includes('register') || actLower.includes('item added') || actLower.includes('submission')) {
      return {
        icon: PlusCircle,
        label: 'Item Registered',
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    }
    // 14. Item Moved to Trash
    if (type === 'trash' || actLower.includes('trash') || actLower.includes('removed items')) {
      return {
        icon: Trash2,
        label: 'Moved to Trash',
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    // 15. Item Restored
    if (type === 'restore' || actLower.includes('restore')) {
      return {
        icon: RotateCcw,
        label: 'Item Restored',
        className: 'bg-teal-50 text-teal-700 border-teal-200'
      };
    }
    // 16. Item Permanent Deletion
    if (type === 'delete' || actLower.includes('permanently deleted') || actLower.includes('delete')) {
      return {
        icon: Trash2,
        label: 'Item Deleted',
        className: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    // 17. Security / Password
    if (type === 'auth' || actLower.includes('password') || actLower.includes('login')) {
      return {
        icon: Lock,
        label: 'Security / Auth',
        className: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    }

    // Default Item/General Update
    return {
      icon: Edit3,
      label: 'Item Updated',
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  const handleOpenItem = (itemCode?: string) => {
    if (!itemCode) return;
    const found = items.find(i => i.code === itemCode || i.id === itemCode);
    if (found) {
      openItemDetails(found);
    } else {
      toast.info(`Item ${itemCode} record was archived or removed.`);
    }
  };

  const exportToCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Timestamp',
      'Action',
      'Action Type',
      'Entity Type',
      'Item Code',
      'Item Name',
      'Previous Status',
      'New Status',
      'Performed By',
      'Role',
      'Email',
      'Details',
      'Reason'
    ];

    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${l.actionType || ''}"`,
      `"${l.entityType || ''}"`,
      `"${l.itemCode || ''}"`,
      `"${(l.itemName || '').replace(/"/g, '""')}"`,
      `"${l.previousStatus || ''}"`,
      `"${l.newStatus || ''}"`,
      `"${(l.performedBy || '').replace(/"/g, '""')}"`,
      `"${l.userRole || l.performedByRole || ''}"`,
      `"${l.performedByEmail || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit log export downloaded.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick Action Pills
  const quickFilterOptions = [
    { label: 'All Actions', value: 'all' },
    { label: 'Handovers', value: 'handover' },
    { label: 'Status Changes', value: 'status_change' },
    { label: 'Dispatches', value: 'dispatch' },
    { label: 'Item Adds', value: 'create' },
    { label: 'Item Edits', value: 'update' },
    { label: 'Permissions', value: 'permission_change' },
    { label: 'Staff Edits', value: 'user_update' },
    { label: 'Deletions', value: 'delete' },
    { label: 'Certificates', value: 'certificate' }
  ];

  // Entity Tabs
  const entityTabs = [
    { id: 'all', label: 'All Activities', icon: Layers },
    { id: 'item', label: 'Lost Items', icon: Package },
    { id: 'staff', label: 'Staff & Permissions', icon: UserCog },
    { id: 'certificate', label: 'Certificates', icon: Award },
    { id: 'security', label: 'Security & Auth', icon: Lock }
  ];

  // Security Access Barrier: Admin Only
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Access Restricted: Administrator Only
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The Audit & Accountability Ledger contains sensitive operational logs, custody transfers, user permission updates, and staff accountability history. Only authorized <strong>Super Admins</strong> and <strong>Administrators</strong> can view or manage this page.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">
              Current Role: {user?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="audit-logs-view" className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0 mt-0.5 sm:mt-0">
              <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {t.auditLogs || 'Audit & Accountability Ledger'}
                </h1>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${
                    source === 'mongodb'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{source === 'mongodb' ? 'MongoDB Synced' : 'Live Active Ledger'}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                Immutable audit trail tracking all actions: item registrations, status transitions, handovers, staff updates, and permissions.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            {/* View Switcher (Feed/Cards vs Table) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                id="btn-view-mode-cards"
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all min-h-[34px] ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Card Feed View (Mobile Optimized)"
                aria-label="Feed Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Feed</span>
              </button>
              <button
                id="btn-view-mode-table"
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all min-h-[34px] ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table View (Desktop Grid)"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              id="btn-refresh-audit-logs"
              onClick={() => fetchAuditData(true)}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60 min-h-[36px]"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{isRefreshing ? '...' : 'Refresh'}</span>
            </button>

            {/* Export CSV */}
            <button
              id="btn-export-audit-csv"
              onClick={exportToCsv}
              disabled={filteredLogs.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60 min-h-[36px]"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="whitespace-nowrap">CSV</span>
            </button>

            {/* Print Report */}
            <button
              id="btn-print-audit-report"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[36px]"
              title="Print report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="whitespace-nowrap">Print</span>
            </button>

            {/* Clear All Logs Button (Admin Authorized) */}
            <button
              id="btn-clear-all-audit-logs"
              onClick={() => setShowClearAllConfirm(true)}
              disabled={logs.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-40 min-h-[36px]"
              title="Clear all audit logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="whitespace-nowrap">Clear All</span>
            </button>
          </div>
        </div>

        {/* Entity Tabs (Lost Items, Staff, Certificates, Security) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {entityTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedEntityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedEntityTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[34px] ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Summary Cards (2x2 on Mobile, 4 columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Total Recorded</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {stats?.total ?? logs.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">Total audit events</span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Status Changes</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-700 font-mono">
            {stats?.statusChanges ?? logs.filter(l => l.actionType === 'status_change').length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">Lifecycle shifts</span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Handovers / Dispatches</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
            {(stats?.handovers || 0) + (stats?.dispatches || 0) ||
              logs.filter(l => l.actionType === 'handover' || l.actionType === 'dispatch').length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">Verified releases</span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Past 24 Hours</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-indigo-700 font-mono">
            {stats?.recent24h ??
              logs.filter(l => Date.now() - new Date(l.timestamp).getTime() <= 86400000).length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">Recent activities</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Search Row + Filter Toggle on Mobile */}
        <div className="flex gap-2 items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-audit-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search code, action, staff, email, reason..."
              className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filters Button for Mobile */}
          <button
            id="btn-toggle-audit-filters"
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`md:hidden flex items-center space-x-1.5 px-3 py-2 sm:py-2.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 min-h-[40px] ${
              isFiltersOpen || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Horizontal Scroll Pills (Mobile & Tablet Friendly) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Action:
          </span>
          {quickFilterOptions.map(opt => {
            const isActive = selectedActionType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedActionType(opt.value)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 border min-h-[30px] ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Extended Filter Dropdowns (Always visible on Desktop md+, Collapsible on Mobile) */}
        <div className={`${isFiltersOpen ? 'block' : 'hidden md:block'} pt-2 border-t border-slate-100`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Action Type Select */}
            <div>
              <label htmlFor="select-audit-action-type" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Action Type
              </label>
              <select
                id="select-audit-action-type"
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Action Types</option>
                <option value="create">Item Registration</option>
                <option value="update">Item Information Edits</option>
                <option value="status_change">Status Lifecycle Changes</option>
                <option value="handover">Handovers to Guest</option>
                <option value="dispatch">Dispatches / Couriers</option>
                <option value="return_to_store">Returns to Store</option>
                <option value="approval">Item Approvals</option>
                <option value="rejection">Item Rejections</option>
                <option value="permission_change">Staff Permission Changes</option>
                <option value="role_change">User Role Changes</option>
                <option value="user_update">Staff Profile Edits</option>
                <option value="delete">Item & Record Deletions</option>
                <option value="certificate">Certificates & Awards</option>
              </select>
            </div>

            {/* Staff Role Select */}
            <div>
              <label htmlFor="select-audit-role" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Performed By Role
              </label>
              <select
                id="select-audit-role"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Staff Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Employee">Staff / Employee</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Security">Security</option>
              </select>
            </div>

            {/* Date Range Select */}
            <div>
              <label htmlFor="select-audit-date-range" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Time Period
              </label>
              <select
                id="select-audit-date-range"
                value={selectedDateRange}
                onChange={e => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Recorded Dates</option>
                <option value="today">Today Only (24h)</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter, Select All, and Reset Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <strong className="text-slate-800 font-mono">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of{' '}
              <strong className="text-slate-800 font-mono">{filteredLogs.length}</strong> records
              {filteredLogs.length !== logs.length && (
                <span className="text-slate-400 text-[11px] ml-1">({logs.length} total)</span>
              )}
            </span>
            {filteredLogs.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                title="Select / deselect all records on this page"
              >
                {paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.has(l.id)) ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Deselect Page</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select Page ({paginatedLogs.length})</span>
                  </>
                )}
              </button>
            )}
            {selectedIds.size > 0 && selectedIds.size < filteredLogs.length && (
              <button
                type="button"
                onClick={handleSelectAllAcrossPages}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors"
              >
                Select all {filteredLogs.length} matching
              </button>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedEntityTab('all');
                setSelectedActionType('all');
                setSelectedRole('all');
                setSelectedDateRange('all');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors"
            >
              Reset filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading audit ledger...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs py-16 px-4 text-center space-y-3">
          <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {logs.length === 0 ? 'Live Audit Ledger Is Ready' : 'No Matching Audit Logs Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {logs.length === 0
              ? 'No audit events recorded yet. The system is actively tracking real-time operations: item registrations, status shifts, handovers, staff updates, and permissions.'
              : 'No audit logs matched your current search or filter criteria. Try adjusting your query or reset filters.'}
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedEntityTab('all');
                setSelectedActionType('all');
                setSelectedRole('all');
                setSelectedDateRange('all');
              }}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs hover:bg-indigo-100 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Mobile Feed View (Cards) */}
          <div className={`${viewMode === 'cards' ? 'block' : 'hidden md:hidden'} space-y-3`}>
            {paginatedLogs.map(log => {
              const badge = getActionBadge(log);
              const Icon = badge.icon;
              const isSelected = selectedIds.has(log.id);
              const formattedDate = new Date(log.timestamp).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const hasStatusChange =
                (log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus) ||
                log.actionType === 'status_change';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogDetail(log)}
                  className={`bg-white rounded-xl border p-3.5 sm:p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all active:bg-slate-50/80 cursor-pointer space-y-2.5 relative ${
                    isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200/90'
                  }`}
                >
                  {/* Card Header: Checkbox + Action Badge + Timestamp + Delete Icon */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={e => toggleSelectLog(log.id, e)}
                        className="text-slate-400 hover:text-indigo-600 p-1 -m-1 rounded transition-colors"
                        aria-label="Select log"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.className}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setLogToDelete(log);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete audit record"
                        aria-label="Delete audit record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Title */}
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {log.action}
                  </div>

                  {/* Item Details if present */}
                  {log.itemCode && (
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenItem(log.itemCode);
                          }}
                          className="font-mono font-bold text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1 shrink-0"
                          title="Open item details"
                        >
                          <span>{log.itemCode}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {log.itemName && (
                          <span className="text-xs text-slate-700 truncate font-medium">
                            {log.itemName}
                          </span>
                        )}
                      </div>
                      {log.category && (
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 ml-1">
                          {log.category}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status Progression Visual (if status changed) */}
                  {hasStatusChange && (
                    <div className="flex items-center space-x-1.5 bg-amber-50/70 p-2 rounded-lg border border-amber-200/70 text-xs">
                      <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-slate-700 font-medium text-[11px] shadow-2xs">
                        {log.previousStatus || 'Previous'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[11px] shadow-2xs">
                        {log.newStatus || 'New'}
                      </span>
                    </div>
                  )}

                  {/* Field Diffs (for Item or Staff Edits) */}
                  {log.changes && log.changes.length > 0 && !hasStatusChange && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60 space-y-1 text-xs">
                      {log.changes.slice(0, 2).map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">{c.label || c.field}:</span>
                          <div className="flex items-center space-x-1 font-mono">
                            <span className="line-through text-slate-400 truncate max-w-[90px]">{String(c.from)}</span>
                            <span>➔</span>
                            <span className="text-emerald-700 font-bold truncate max-w-[100px]">{String(c.to)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Narrative Details / Notes */}
                  {log.details && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100">
                      {log.details}
                    </p>
                  )}

                  {/* Performed By & Footer */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{log.performedBy || 'System'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium shrink-0">
                        {log.userRole || log.performedByRole || 'Staff'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLogDetail(log);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                      >
                        Inspect &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table View */}
          <div className={`${viewMode === 'table' ? 'block' : 'hidden'} bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden`}>
            <div className="overflow-auto max-h-[640px] relative">
              <table className="w-full text-left border-separate border-spacing-0 text-xs">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-slate-50 text-slate-600 font-semibold tracking-wider uppercase text-[11px] select-none">
                    <th className="py-3 px-3 w-8 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-slate-400 hover:text-indigo-600"
                        title="Select/Deselect all records on this page"
                      >
                        {paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.has(l.id)) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Date & Time</th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Action Event</th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Item / Entity</th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Status / Diff</th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Performed By</th>
                    <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Details & Notes</th>
                    <th className="py-3 px-4 text-right sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {paginatedLogs.map(log => {
                    const badge = getActionBadge(log);
                    const Icon = badge.icon;
                    const isSelected = selectedIds.has(log.id);
                    const formattedDate = new Date(log.timestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });

                    const hasStatusChange =
                      (log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus) ||
                      log.actionType === 'status_change';

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                        onClick={() => setSelectedLogDetail(log)}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 align-top" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSelectLog(log.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          <div className="font-mono text-slate-800 font-medium">{formattedDate}</div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{log.id.slice(0, 14)}</span>
                          </div>
                        </td>

                        {/* Action Event */}
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.className}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                          <div className="text-[11px] font-semibold text-slate-800 mt-1 max-w-[220px] truncate">
                            {log.action}
                          </div>
                        </td>

                        {/* Item / Entity */}
                        <td className="py-3 px-4 align-top">
                          {log.itemCode ? (
                            <div>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenItem(log.itemCode);
                                }}
                                className="inline-flex items-center space-x-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                title="Click to view item details"
                              >
                                <span>{log.itemCode}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              {log.itemName && (
                                <div className="text-[11px] text-slate-700 font-medium truncate max-w-[160px]">
                                  {log.itemName}
                                </div>
                              )}
                              {log.category && (
                                <span className="text-[10px] text-slate-400">{log.category}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              {log.entityType ? `[${log.entityType}]` : 'System / Non-item'}
                            </span>
                          )}
                        </td>

                        {/* Status / Diff */}
                        <td className="py-3 px-4 align-top">
                          {hasStatusChange ? (
                            <div className="flex items-center space-x-1 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {log.previousStatus || 'Previous'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                {log.newStatus || 'New'}
                              </span>
                            </div>
                          ) : log.changes && log.changes.length > 0 ? (
                            <div className="space-y-1">
                              {log.changes.slice(0, 2).map((c, idx) => (
                                <div key={idx} className="text-[10px] text-slate-600">
                                  <span className="font-semibold text-slate-700">{c.label || c.field}:</span>{' '}
                                  <span className="line-through text-slate-400">{String(c.from).slice(0, 14)}</span>{' '}
                                  ➔ <span className="text-emerald-600 font-semibold">{String(c.to).slice(0, 14)}</span>
                                </div>
                              ))}
                              {log.changes.length > 2 && (
                                <span className="text-[10px] text-indigo-600 font-medium">
                                  +{log.changes.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : log.newStatus ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {log.newStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Performed By */}
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{log.performedBy || 'System'}</div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {log.userRole || log.performedByRole || 'Staff'}
                            </span>
                          </div>
                          {log.performedByEmail && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {log.performedByEmail}
                            </div>
                          )}
                        </td>

                        {/* Details & Notes */}
                        <td className="py-3 px-4 align-top">
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {log.details || log.reason || 'No additional notes'}
                          </p>
                          {log.reason && log.details && log.details !== log.reason && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-amber-200">
                              Reason: {log.reason}
                            </div>
                          )}
                        </td>

                        {/* Actions (View + Delete) */}
                        <td className="py-3 px-4 align-top text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLogDetail(log)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors min-h-[30px]"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogToDelete(log)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center"
                              title="Delete audit log record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Pagination Controls (Responsive Mobile & Desktop) */}
          {filteredLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs text-slate-600">
              {/* Left side: Range stats and Rows-per-page selector */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
                <span className="font-medium text-slate-600">
                  Showing <strong className="text-slate-900 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-mono">
                    {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                  </strong>{' '}
                  of <strong className="text-slate-900 font-mono">{filteredLogs.length}</strong> records
                </span>

                <span className="hidden sm:inline text-slate-300">•</span>

                <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
                  <span className="text-slate-400 text-[11px] font-medium">Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Right side: Page navigation */}
              <div className="flex items-center justify-center space-x-1.5 w-full sm:w-auto">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="First Page"
                  aria-label="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer font-semibold min-h-[34px]"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Prev</span>
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers(currentPage, totalPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs select-none">
                          …
                        </span>
                      );
                    }
                    const num = Number(pageNum);
                    const isActive = num === currentPage;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs font-mono'
                            : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer font-semibold min-h-[34px]"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <span className="hidden sm:inline text-xs">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Last Page"
                  aria-label="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Bottom Bar for Batch Actions (Mobile and Desktop Friendly) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-auto z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between sm:justify-start gap-4 animate-slide-up">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">Selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Single Item Deletion Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Audit Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete this audit record from the ledger? This action cannot be undone.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className="font-semibold text-slate-900">{logToDelete.action}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {new Date(logToDelete.timestamp).toLocaleString('en-GB')}
              </div>
              {logToDelete.itemCode && (
                <div className="text-[11px] text-indigo-600 font-mono">
                  Item: {logToDelete.itemCode}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleLog(logToDelete.id)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Deletion Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete {selectedIds.size} Audit Records?</h3>
              <p className="text-xs text-slate-500">
                You have selected <strong>{selectedIds.size}</strong> audit logs. Deleting them will permanently erase them from both the database and audit trail.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                disabled={isBatchDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={isBatchDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] flex items-center justify-center space-x-1.5"
              >
                {isBatchDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Selected</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Logs Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-rose-900">Clear Entire Audit Ledger?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This administrative action will permanently erase all <strong>{logs.length}</strong> recorded audit events. This includes item registrations, custody transitions, and staff updates.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              ⚠️ <strong>Warning:</strong> This action cannot be reversed. Please make sure you have exported a CSV copy if needed.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] flex items-center justify-center space-x-1.5"
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Clear All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Log Modal (Mobile-Optimized Bottom Sheet & Responsive Modal) */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
            {/* Mobile Drag/Handle indicator */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    Accountability Audit Record
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">
                    ID: {selectedLogDetail.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => {
                    setLogToDelete(selectedLogDetail);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete record"
                  aria-label="Delete this audit record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Touch-Friendly Scrolling */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 text-xs">
              {/* Event Overview */}
              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Action Event</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedLogDetail.action}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Timestamp</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedLogDetail.timestamp).toLocaleString('en-GB')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Action Category</span>
                  <span className="uppercase font-mono font-bold text-indigo-600">
                    {selectedLogDetail.actionType || 'standard'}
                  </span>
                </div>
                {selectedLogDetail.entityType && (
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 font-medium">Target Entity</span>
                    <span className="font-semibold text-slate-800 uppercase">
                      {selectedLogDetail.entityType}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Change Progression */}
              {(selectedLogDetail.previousStatus || selectedLogDetail.newStatus) && (
                <div className="p-3.5 sm:p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900 text-xs">Status Progression</div>
                  <div className="flex items-center space-x-3 text-xs sm:text-sm">
                    <div className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 font-semibold text-slate-700 shadow-2xs">
                      {selectedLogDetail.previousStatus || 'None'}
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold shadow-2xs">
                      {selectedLogDetail.newStatus || 'Updated'}
                    </div>
                  </div>
                </div>
              )}

              {/* Item Info if present */}
              {selectedLogDetail.itemCode && (
                <div className="p-3.5 sm:p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-indigo-600">Associated Lost Item</div>
                    <div className="font-mono font-bold text-indigo-900 text-xs sm:text-sm truncate">
                      {selectedLogDetail.itemCode} {selectedLogDetail.itemName ? `— ${selectedLogDetail.itemName}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenItem(selectedLogDetail.itemCode);
                      setSelectedLogDetail(null);
                    }}
                    className="self-start sm:self-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs text-xs flex items-center space-x-1.5 min-h-[36px]"
                  >
                    <span>Inspect Item</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Field Diffs */}
              {selectedLogDetail.changes && selectedLogDetail.changes.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Field Changes Detected</div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {selectedLogDetail.changes.map((c, i) => (
                      <div key={i} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs bg-white">
                        <span className="font-semibold text-slate-700">{c.label || c.field}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="line-through text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                            {String(c.from)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {String(c.to)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performed By & Audit Metadata */}
              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs">Actor & Security Metadata</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Performed By:</span>{' '}
                    <span className="font-semibold text-slate-800">{selectedLogDetail.performedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Role:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedLogDetail.userRole || selectedLogDetail.performedByRole}
                    </span>
                  </div>
                  {selectedLogDetail.performedByEmail && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="font-mono text-slate-800 break-all">{selectedLogDetail.performedByEmail}</span>
                    </div>
                  )}
                  {selectedLogDetail.ip && (
                    <div>
                      <span className="text-slate-500">IP Address:</span>{' '}
                      <span className="font-mono text-slate-800">{selectedLogDetail.ip}</span>
                    </div>
                  )}
                  {selectedLogDetail.deviceType && (
                    <div>
                      <span className="text-slate-500">Device:</span>{' '}
                      <span className="font-semibold text-slate-800">{selectedLogDetail.deviceType}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Description & Reason */}
              <div>
                <div className="font-bold text-slate-800 text-xs mb-1">Audit Log Description</div>
                <p className="p-3 bg-slate-100 rounded-lg text-slate-700 leading-relaxed text-xs">
                  {selectedLogDetail.details || 'No narrative description provided.'}
                </p>
              </div>

              {selectedLogDetail.reason && (
                <div>
                  <div className="font-bold text-slate-800 text-xs mb-1">Official Stated Reason</div>
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed text-xs">
                    {selectedLogDetail.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setLogToDelete(selectedLogDetail);
                }}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold rounded-lg text-xs min-h-[44px] flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs min-h-[44px] flex items-center justify-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
