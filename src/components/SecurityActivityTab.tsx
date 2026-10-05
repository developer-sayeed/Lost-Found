import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  LogIn,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  Download,
  RefreshCw,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trash2,
  X
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SecurityActivityLog } from '../types';

export const SecurityActivityTab: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<SecurityActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'login_success' | 'login_failed' | 'password_change'>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    successfulLogins: 0,
    failedAttempts: 0,
    passwordChanges: 0
  });

  // Delete & Clear Modal States
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearFilter, setClearFilter] = useState<'all' | 'failed' | 'success' | 'password' | 'older_than_7_days'>('all');
  const [logToDelete, setLogToDelete] = useState<SecurityActivityLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const fetchSecurityActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getSecurityActivity(user, {
        type: eventTypeFilter,
        search: searchQuery,
        limit: 500
      });
      if (res && res.activities) {
        setActivities(res.activities);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to load security activity:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, eventTypeFilter, searchQuery]);

  useEffect(() => {
    fetchSecurityActivities();
  }, [fetchSecurityActivities]);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, eventTypeFilter]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleExportCsv = () => {
    if (activities.length === 0) return;

    const headers = [
      'Timestamp (ISO)',
      'Date & Time',
      'Event Action',
      'Category',
      'User / Identity',
      'Role',
      'Email / Staff ID',
      'IP Address',
      'Device & OS',
      'Browser',
      'Details / Reason'
    ];

    const rows = activities.map(a => [
      `"${a.timestamp}"`,
      `"${new Date(a.timestamp).toLocaleString()}"`,
      `"${a.action}"`,
      `"${a.eventType}"`,
      `"${a.performedBy || 'Unknown'}"`,
      `"${a.performedByRole || 'Staff'}"`,
      `"${a.performedByEmail || ''}"`,
      `"${a.ip || '192.168.1.45'}"`,
      `"${a.deviceType || 'Desktop'}"`,
      `"${a.browser || 'Google Chrome'}"`,
      `"${(a.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `security_activity_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDeleteSingle = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteSecurityActivity(logToDelete.id, user);
      if (res.success) {
        setActivities(prev => prev.filter(a => a.id !== logToDelete.id));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          successfulLogins: logToDelete.eventType === 'login_success' ? Math.max(0, prev.successfulLogins - 1) : prev.successfulLogins,
          failedAttempts: logToDelete.eventType === 'login_failed' ? Math.max(0, prev.failedAttempts - 1) : prev.failedAttempts,
          passwordChanges: logToDelete.eventType === 'password_change' ? Math.max(0, prev.passwordChanges - 1) : prev.passwordChanges
        }));
        setActionNotice({ message: 'Security activity record deleted successfully.', type: 'success' });
        setLogToDelete(null);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setActionNotice({ message: res.message || 'Failed to delete record', type: 'error' });
      }
    } catch {
      setActionNotice({ message: 'Error deleting record', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearLogs = async () => {
    setIsDeleting(true);
    try {
      const res = await api.clearSecurityActivities(clearFilter, user);
      if (res.success) {
        setShowClearModal(false);
        setActionNotice({ message: `Successfully deleted ${res.deletedCount} activity records.`, type: 'success' });
        setTimeout(() => setActionNotice(null), 5000);
        await fetchSecurityActivities();
      } else {
        setActionNotice({ message: res.message || 'Failed to clear activity logs', type: 'error' });
      }
    } catch {
      setActionNotice({ message: 'Error clearing activity logs', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedActivities.map(a => a.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteSecurityActivitiesBatch(selectedIds, user);
      if (res.success) {
        const idSet = new Set(selectedIds);
        setActivities(prev => prev.filter(a => !idSet.has(a.id)));
        setActionNotice({
          message: `Successfully deleted ${res.deletedCount} security activity records.`,
          type: 'success'
        });
        setSelectedIds([]);
        setShowBatchDeleteModal(false);
        setTimeout(() => setActionNotice(null), 5000);
        await fetchSecurityActivities();
      } else {
        setActionNotice({ message: res.message || 'Failed to delete selected records', type: 'error' });
      }
    } catch {
      setActionNotice({ message: 'Error deleting selected records', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination Slicing
  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize));
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return activities.slice(startIndex, startIndex + pageSize);
  }, [activities, currentPage, pageSize]);

  const getDeviceIcon = (deviceType: string = '') => {
    const lower = deviceType.toLowerCase();
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('android') || lower.includes('ios')) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className="w-3.5 h-3.5 text-slate-500" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Notice Toast */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold animate-fade-in shadow-xs ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Security Activity &amp; Authentication History
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time audit records of login attempts, password changes, and successful logins with associated timestamps and IP addresses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Delete Selected Batch Button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              id="btn-delete-selected-history"
              onClick={() => setShowBatchDeleteModal(true)}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer animate-fade-in"
              title="Delete Selected Security Activity Records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Delete / Clear History Button */}
          <button
            type="button"
            id="btn-clear-security-history"
            onClick={() => setShowClearModal(true)}
            disabled={activities.length === 0 || isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Delete / Clear Security Activity Logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear History</span>
          </button>

          <button
            type="button"
            onClick={fetchSecurityActivities}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refresh Security Activity Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={activities.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Export Security Activity Report to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Security Events */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Logged Events
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1.5">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Persistent auth audit records
          </div>
        </div>

        {/* Successful Logins */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Successful Logins
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <LogIn className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1.5">
            {stats.successfulLogins.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">
            Validated sessions &amp; tokens
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Failed Attempts
            </div>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-800 mt-1.5">
            {stats.failedAttempts.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1">
            Invalid passwords &amp; lockouts
          </div>
        </div>

        {/* Password Changes */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Password Changes
            </div>
            <Key className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-indigo-800 mt-1.5">
            {stats.passwordChanges.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700/80 mt-1">
            Credential updates &amp; resets
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEventTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                eventTypeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              All Events ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setEventTypeFilter('login_success')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                eventTypeFilter === 'login_success'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Successful Logins ({stats.successfulLogins})</span>
            </button>
            <button
              type="button"
              onClick={() => setEventTypeFilter('login_failed')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                eventTypeFilter === 'login_failed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failed Attempts ({stats.failedAttempts})</span>
            </button>
            <button
              type="button"
              onClick={() => setEventTypeFilter('password_change')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                eventTypeFilter === 'password_change'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60 hover:bg-indigo-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Password Changes ({stats.passwordChanges})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by user, IP, action, details..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in gap-3 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-900">
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
            <span>{selectedIds.length} security activity record{selectedIds.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              id="btn-confirm-delete-selected"
              onClick={() => setShowBatchDeleteModal(true)}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected Records ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Activity Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading security activity audit logs...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Security Activity Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || eventTypeFilter !== 'all'
                ? 'No authentication logs matched your current search filters. Try clearing search query or choosing "All Events".'
                : 'Authentication attempts, password modifications, and logins will be automatically displayed here with IP addresses and timestamps.'}
            </p>
            {(searchQuery || eventTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setEventTypeFilter('all');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
              <div className="col-span-1 flex items-center justify-start">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={paginatedActivities.length > 0 && paginatedActivities.every(a => selectedIds.includes(a.id))}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                  title="Select all on this page"
                />
              </div>
              <div className="col-span-3">Event &amp; Action</div>
              <div className="col-span-2">User &amp; Role</div>
              <div className="col-span-2">IP Address</div>
              <div className="col-span-2">Device &amp; Browser</div>
              <div className="col-span-2 text-right">Timestamp &amp; Delete</div>
            </div>

            {/* Rows */}
            {paginatedActivities.map((act) => {
              const isSelected = selectedIds.includes(act.id);
              const isSuccess = act.eventType === 'login_success';
              const isFail = act.eventType === 'login_failed';
              const isPassChange = act.eventType === 'password_change';
              const isLocked = act.action?.toLowerCase().includes('lock') || act.action?.toLowerCase().includes('block');

              return (
                <div
                  key={act.id}
                  className={`p-4 md:px-6 md:py-3.5 hover:bg-slate-50/70 transition-all flex flex-col md:grid md:grid-cols-12 gap-2.5 md:gap-3 md:items-center group ${
                    isSelected ? 'bg-rose-50/40 ring-1 ring-rose-200' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      aria-label="Select this log"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(act.id)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                    />
                  </div>

                  {/* Event & Action */}
                  <div className="col-span-3 flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isFail
                          ? 'bg-rose-100 text-rose-700'
                          : isPassChange
                          ? 'bg-indigo-100 text-indigo-700'
                          : isLocked
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isFail ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isPassChange ? (
                        <Key className="w-4 h-4" />
                      ) : isLocked ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {act.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0 ${
                            isFail
                              ? 'bg-rose-100 text-rose-800'
                              : isPassChange
                              ? 'bg-indigo-100 text-indigo-800'
                              : isLocked
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFail ? 'Failed' : isPassChange ? 'Security' : isLocked ? 'Locked' : 'Success'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title={act.details}>
                        {act.details}
                      </p>
                    </div>
                  </div>

                  {/* User & Role */}
                  <div className="col-span-2 flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {(act.performedBy || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {act.performedBy}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                          {act.performedByRole || 'Staff'}
                        </span>
                      </div>
                      {act.performedByEmail && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          {act.performedByEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IP Address */}
                  <div className="col-span-2 flex items-center space-x-1.5">
                    <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-700 transition-colors">
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{act.ip || '192.168.1.45'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyIp(act.ip || '192.168.1.45')}
                        className="ml-1 text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                        title="Copy IP Address"
                      >
                        {copiedIp === (act.ip || '192.168.1.45') ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Device & Browser */}
                  <div className="col-span-2 flex items-center space-x-2">
                    <div className="p-1 rounded-md bg-slate-100 shrink-0">
                      {getDeviceIcon(act.deviceType)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-800 block truncate">
                        {act.browser || 'Chrome'}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {act.deviceType || 'Desktop • Windows'}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp & Actions */}
                  <div className="col-span-2 flex items-center justify-between md:justify-end space-x-2">
                    <div className="text-left md:text-right">
                      <span className="text-xs font-semibold text-slate-700 block">
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({getRelativeTime(act.timestamp)})
                      </span>
                    </div>

                    {/* Single Row Delete Button */}
                    <button
                      type="button"
                      onClick={() => setLogToDelete(act)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-all cursor-pointer opacity-70 group-hover:opacity-100 border border-transparent hover:border-rose-200"
                      title="Delete this activity log record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {activities.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, activities.length)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-800">{activities.length}</span>
              <span>events</span>

              <span className="text-slate-300">|</span>

              <label htmlFor="select-security-page-size" className="text-slate-500">Per page:</label>
              <select
                id="select-security-page-size"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Clear History Batch Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Clear Security Activity History?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose which authentication activity logs you wish to purge permanently from the system audit log.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">Deletion Scope:</label>

              <div className="space-y-1.5">
                {[
                  { id: 'all', label: 'Delete All Activity Records', count: stats.total },
                  { id: 'failed', label: 'Delete Failed / Blocked Login Attempts Only', count: stats.failedAttempts },
                  { id: 'success', label: 'Delete Successful Logins Only', count: stats.successfulLogins },
                  { id: 'password', label: 'Delete Password Change Records Only', count: stats.passwordChanges },
                  { id: 'older_than_7_days', label: 'Delete Records Older Than 7 Days', count: activities.filter(a => Date.now() - new Date(a.timestamp).getTime() > 7 * 86400000).length }
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      clearFilter === opt.id
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-500/20 text-rose-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="clearFilter"
                        checked={clearFilter === opt.id}
                        onChange={() => setClearFilter(opt.id as any)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {opt.count} logs
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>This action cannot be undone. Purged authentication logs will be permanently removed from persistent storage.</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-logs"
                onClick={handleConfirmClearLogs}
                disabled={isDeleting}
                className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-bounce' : ''}`} />
                <span>{isDeleting ? 'Purging Logs...' : 'Confirm Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Single Row Delete Confirmation */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Activity Record?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this specific authentication log?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <div className="font-bold text-slate-800">{logToDelete.action}</div>
              <div className="text-[11px] text-slate-500">User: {logToDelete.performedBy} ({logToDelete.performedByRole})</div>
              <div className="text-[11px] font-mono text-slate-500">IP: {logToDelete.ip}</div>
              <div className="text-[11px] text-slate-400">Date: {new Date(logToDelete.timestamp).toLocaleString()}</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Batch Delete Selected Confirmation */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete {selectedIds.length} Selected Records?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently delete these {selectedIds.length} authentication and security activity records?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>This action cannot be undone. Selected log records will be permanently removed.</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-batch-modal"
                onClick={handleConfirmDeleteBatch}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-bounce' : ''}`} />
                <span>{isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Records`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
