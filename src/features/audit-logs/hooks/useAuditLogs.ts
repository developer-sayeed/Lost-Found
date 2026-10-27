import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { AuditLog } from '../../../types';
import { api } from '../../../lib/api';

export function useAuditLogs(user: any, isAdmin: boolean) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [source, setSource] = useState<string>('local');
  const [stats, setStats] = useState<any>(null);

  // Responsive View Mode
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

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

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialog States
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  const fetchAuditData = useCallback(async (showRefreshingSpinner = false) => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getAuditLogs({ limit: 1000 }, user),
        api.getAuditLogStats(user)
      ]);

      if (logsRes && Array.isArray(logsRes.logs)) {
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
        api.getAuditLogStats(user).then(s => s && setStats(s)).catch(() => {});
      } else {
        toast.error('Failed to delete audit log. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting audit log');
    }
  };

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

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
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
          const isSec =
            entity === 'auth' ||
            actionType.includes('auth') ||
            actionType.includes('password') ||
            actionLower.includes('password') ||
            actionLower.includes('login') ||
            actionLower.includes('lockout') ||
            actionLower.includes('session');
          if (!isSec) return false;
        }
      }

      if (selectedActionType !== 'all') {
        const actLower = (log.action || '').toLowerCase();
        const typeLower = (log.actionType || '').toLowerCase();

        if (selectedActionType === 'create') {
          if (typeLower !== 'create' && !actLower.includes('registered') && !actLower.includes('item added')) return false;
        } else if (selectedActionType === 'update') {
          if (typeLower !== 'update' && !actLower.includes('updated') && !actLower.includes('edited')) return false;
        } else if (selectedActionType === 'status_change') {
          if (typeLower !== 'status_change' && !actLower.includes('status changed') && !actLower.includes('status')) return false;
        } else if (selectedActionType === 'handover') {
          if (typeLower !== 'handover' && !actLower.includes('handover') && !actLower.includes('handed over')) return false;
        } else if (selectedActionType === 'dispatch') {
          if (typeLower !== 'dispatch' && !actLower.includes('dispatch') && !actLower.includes('dispatched')) return false;
        } else if (selectedActionType === 'return_to_store') {
          if (typeLower !== 'return_to_store' && !actLower.includes('returned to store') && !actLower.includes('return to store')) return false;
        } else if (selectedActionType === 'approval') {
          if (typeLower !== 'approval' && typeLower !== 'approve' && !actLower.includes('approv')) return false;
        } else if (selectedActionType === 'rejection') {
          if (typeLower !== 'rejection' && typeLower !== 'reject' && !actLower.includes('reject')) return false;
        } else if (selectedActionType === 'permission_change') {
          if (typeLower !== 'permission_change' && !actLower.includes('permission')) return false;
        } else if (selectedActionType === 'role_change') {
          if (typeLower !== 'role_change' && !actLower.includes('role')) return false;
        } else if (selectedActionType === 'user_update') {
          if (typeLower !== 'user_update' && typeLower !== 'staff_update' && !actLower.includes('staff updated') && !actLower.includes('profile')) return false;
        } else if (selectedActionType === 'delete') {
          if (typeLower !== 'delete' && typeLower !== 'trash' && !actLower.includes('delete') && !actLower.includes('trash')) return false;
        } else if (selectedActionType === 'certificate') {
          if (!typeLower.includes('certificate') && !actLower.includes('certificate')) return false;
        }
      }

      if (selectedRole !== 'all') {
        const role = (log.userRole || log.performedByRole || '').toLowerCase();
        if (role !== selectedRole.toLowerCase()) return false;
      }

      if (selectedDateRange !== 'all') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (selectedDateRange === 'today') {
          if (now - logDate > 86400000) return false;
        } else if (selectedDateRange === '7d') {
          if (now - logDate > 7 * 86400000) return false;
        } else if (selectedDateRange === '30d') {
          if (now - logDate > 30 * 86400000) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesCode = (log.itemCode || '').toLowerCase().includes(q);
        const matchesItemName = (log.itemName || '').toLowerCase().includes(q);
        const matchesStaff = (log.performedBy || '').toLowerCase().includes(q);
        const matchesRole = (log.userRole || log.performedByRole || '').toLowerCase().includes(q);
        const matchesEmail = (log.performedByEmail || '').toLowerCase().includes(q);
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        const matchesReason = (log.reason || '').toLowerCase().includes(q);

        if (
          !matchesAction &&
          !matchesCode &&
          !matchesItemName &&
          !matchesStaff &&
          !matchesRole &&
          !matchesEmail &&
          !matchesDetails &&
          !matchesReason
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedEntityTab, selectedActionType, selectedRole, selectedDateRange, searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedEntityTab !== 'all') count++;
    if (selectedActionType !== 'all') count++;
    if (selectedRole !== 'all') count++;
    if (selectedDateRange !== 'all') count++;
    return count;
  }, [searchQuery, selectedEntityTab, selectedActionType, selectedRole, selectedDateRange]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleSelectAll = () => {
    const allOnCurrentPageSelected =
      paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.has(l.id));

    if (allOnCurrentPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedLogs.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedLogs.forEach(l => next.add(l.id));
        return next;
      });
    }
  };

  const handleSelectAllAcrossPages = () => {
    const allIds = new Set(filteredLogs.map(l => l.id));
    setSelectedIds(allIds);
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

  return {
    logs,
    source,
    stats,
    isLoading,
    isRefreshing,
    fetchAuditData,
    viewMode,
    setViewMode,
    isFiltersOpen,
    setIsFiltersOpen,
    searchQuery,
    setSearchQuery,
    selectedEntityTab,
    setSelectedEntityTab,
    selectedActionType,
    setSelectedActionType,
    selectedRole,
    setSelectedRole,
    selectedDateRange,
    setSelectedDateRange,
    selectedLogDetail,
    setSelectedLogDetail,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    selectedIds,
    setSelectedIds,
    logToDelete,
    setLogToDelete,
    isBatchDeleting,
    showBatchDeleteConfirm,
    setShowBatchDeleteConfirm,
    showClearAllConfirm,
    setShowClearAllConfirm,
    isClearingAll,
    handleDeleteSingleLog,
    handleBatchDelete,
    handleClearAllLogs,
    toggleSelectLog,
    handleSelectAll,
    handleSelectAllAcrossPages,
    exportToCsv,
    filteredLogs,
    paginatedLogs,
    activeFiltersCount
  };
}
