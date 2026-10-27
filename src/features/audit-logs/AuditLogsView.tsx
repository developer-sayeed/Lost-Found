import React from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  LayoutGrid,
  List,
  RefreshCw,
  Download,
  Printer,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuditLogs } from './hooks/useAuditLogs';
import { ENTITY_TABS } from './utils/auditLogBadgeHelper';
import { AuditLogStatsCards } from './components/AuditLogStatsCards';
import { AuditLogFilterBar } from './components/AuditLogFilterBar';
import { AuditLogTableView } from './components/AuditLogTableView';
import { AuditLogCardsView } from './components/AuditLogCardsView';
import { AuditLogPagination } from './components/AuditLogPagination';
import { AuditLogDetailModal } from './components/AuditLogDetailModal';
import { AuditLogDeleteModals } from './components/AuditLogDeleteModals';

export const AuditLogsView: React.FC = () => {
  const { items, openItemDetails } = useApp();
  const { user, hasPermission, isSuperAdmin, previewRole } = useAuth();
  const { t } = useLanguage();

  const isMasterAdmin = isSuperAdmin && !previewRole;
  const isAdmin = isMasterAdmin || hasPermission('audit_logs');

  const {
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
  } = useAuditLogs(user, isAdmin);

  const handleOpenItem = (itemCode?: string) => {
    if (!itemCode) return;
    const found = items.find(i => i.code === itemCode || i.id === itemCode);
    if (found) {
      openItemDetails(found);
    } else {
      toast.info(`Item ${itemCode} record was archived or removed.`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Restricted Access</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Audit & Accountability Ledger is reserved for system administrators and supervisors with audit permissions.
          </p>
        </div>
      </div>
    );
  }

  const allOnPageSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.has(l.id));

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header and Controls */}
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
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                id="btn-view-mode-cards"
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all min-h-[34px] cursor-pointer ${
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
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all min-h-[34px] cursor-pointer ${
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60 min-h-[36px] cursor-pointer"
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-60 min-h-[36px] cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="whitespace-nowrap">CSV</span>
            </button>

            {/* Print Report */}
            <button
              id="btn-print-audit-report"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl shadow-xs transition-all min-h-[36px] cursor-pointer"
              title="Print report"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span className="whitespace-nowrap">Print</span>
            </button>

            {/* Clear All Logs Button */}
            <button
              id="btn-clear-all-audit-logs"
              onClick={() => setShowClearAllConfirm(true)}
              disabled={logs.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-40 min-h-[36px] cursor-pointer"
              title="Clear all audit logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="whitespace-nowrap">Clear All</span>
            </button>
          </div>
        </div>

        {/* Entity Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ENTITY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedEntityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedEntityTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[34px] cursor-pointer ${
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

      {/* Metrics Summary Cards */}
      <AuditLogStatsCards stats={stats} logs={logs} />

      {/* Filter and Search Bar */}
      <AuditLogFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        selectedActionType={selectedActionType}
        setSelectedActionType={setSelectedActionType}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        activeFiltersCount={activeFiltersCount}
        filteredLogsCount={filteredLogs.length}
        totalLogsCount={logs.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        paginatedLogsCount={paginatedLogs.length}
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        onSelectAllPage={handleSelectAll}
        onSelectAllAcrossPages={handleSelectAllAcrossPages}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedEntityTab('all');
          setSelectedActionType('all');
          setSelectedRole('all');
          setSelectedDateRange('all');
        }}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <Skeleton className="h-4 w-6 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {[1, 2, 3, 4, 5, 6, 7].map(idx => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-7 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 shadow-2xs py-16 px-4 text-center space-y-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {logs.length === 0 ? 'Live Audit Ledger Is Ready' : 'No Matching Audit Logs Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
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
              className="inline-flex items-center px-3 py-1.5 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 font-semibold rounded-lg text-xs hover:bg-fuchsia-100 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Card Feed View (Mobile) */}
          <div className={`${viewMode === 'cards' ? 'block' : 'hidden md:hidden'}`}>
            <AuditLogCardsView
              paginatedLogs={paginatedLogs}
              selectedIds={selectedIds}
              onToggleSelectLog={toggleSelectLog}
              onSelectLogDetail={setSelectedLogDetail}
              onRequestDelete={setLogToDelete}
              onOpenItem={handleOpenItem}
            />
          </div>

          {/* Table View (Desktop) */}
          <div className={`${viewMode === 'table' ? 'block' : 'hidden'}`}>
            <AuditLogTableView
              paginatedLogs={paginatedLogs}
              selectedIds={selectedIds}
              onToggleSelectLog={toggleSelectLog}
              onSelectAllPage={handleSelectAll}
              onSelectLogDetail={setSelectedLogDetail}
              onRequestDelete={setLogToDelete}
              onOpenItem={handleOpenItem}
            />
          </div>

          {/* Pagination Controls */}
          <AuditLogPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            filteredLogsCount={filteredLogs.length}
          />
        </>
      )}

      {/* Floating Bottom Bar for Batch Actions */}
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
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors min-h-[36px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <AuditLogDeleteModals
        logToDelete={logToDelete}
        onCancelDeleteSingle={() => setLogToDelete(null)}
        onConfirmDeleteSingle={handleDeleteSingleLog}
        showBatchDeleteConfirm={showBatchDeleteConfirm}
        onCancelBatchDelete={() => setShowBatchDeleteConfirm(false)}
        onConfirmBatchDelete={handleBatchDelete}
        isBatchDeleting={isBatchDeleting}
        selectedCount={selectedIds.size}
        showClearAllConfirm={showClearAllConfirm}
        onCancelClearAll={() => setShowClearAllConfirm(false)}
        onConfirmClearAll={handleClearAllLogs}
        isClearingAll={isClearingAll}
        totalLogsCount={logs.length}
      />

      {/* Detail Modal */}
      <AuditLogDetailModal
        selectedLogDetail={selectedLogDetail}
        onClose={() => setSelectedLogDetail(null)}
        onRequestDelete={log => setLogToDelete(log)}
        onInspectItem={handleOpenItem}
      />
    </div>
  );
};

export default AuditLogsView;
