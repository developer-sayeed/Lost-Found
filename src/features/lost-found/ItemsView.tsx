import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LostItem } from '../../types';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useLanguage } from '../../context/LanguageContext';
import { RejectSubmissionModal } from '../../components/modals/RejectSubmissionModal';
import { SortField, SortDirection } from './types/items.feature.types';
import { ItemsHeader } from './components/ItemsHeader';
import { ItemsPendingBanner } from './components/ItemsPendingBanner';
import { ItemsFilterBar } from './components/ItemsFilterBar';
import { ItemsBulkActionsBar } from './components/ItemsBulkActionsBar';
import { ItemsTable } from './components/ItemsTable';
import { ItemsPagination, ItemsPaginationFooter } from './components/ItemsPagination';
import { BatchDeleteModal } from './components/BatchDeleteModal';

export const ItemsView: React.FC = () => {
  const {
    activeItems,
    filters,
    setFilters,
    settings,
    setIsAddModalOpen,
    setEditingItem,
    openItemDetails,
    openHandover,
    openDispatch,
    openDelete,
    openPrint,
    openEditItem,
    openItemQrModal,
    approveItem,
    rejectItem,
    openReturnToStore,
    batchDeleteItems,
    isLoading
  } = useApp();
  const { user, hasPermission, effectiveRole, isSuperAdmin, previewRole } = useAuth();
  const { t } = useLanguage();
  const currentRole = effectiveRole || user?.role || '';
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(currentRole);

  // Data Table States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [sortField, setSortField] = useState<SortField>('dateFound');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteReason, setBatchDeleteReason] = useState('');
  const [isPermanentBatchDelete, setIsPermanentBatchDelete] = useState(false);
  const [isProcessingBatchDelete, setIsProcessingBatchDelete] = useState(false);
  const [rejectModalItem, setRejectModalItem] = useState<LostItem | null>(null);

  const batchDeleteModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessingBatchDelete) setIsBatchDeleteModalOpen(false);
  }, { active: isBatchDeleteModalOpen, closeOnEsc: true });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      if (filters.searchQuery) {
        const q = (filters.searchQuery || '').toLowerCase().trim();
        const matches =
          Boolean(item.code && item.code.toLowerCase().includes(q)) ||
          Boolean(item.itemName && item.itemName.toLowerCase().includes(q)) ||
          Boolean(item.description && item.description.toLowerCase().includes(q)) ||
          Boolean(item.locationFound && item.locationFound.toLowerCase().includes(q)) ||
          Boolean(item.guestName && item.guestName.toLowerCase().includes(q)) ||
          Boolean(item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
          Boolean(item.storeLocation && item.storeLocation.toLowerCase().includes(q)) ||
          Boolean(item.category && item.category.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filters.status && filters.status !== 'All Status' && filters.status !== 'All') {
        const fStatus = (filters.status || '').toLowerCase().trim();
        const itemStatus = (item.status || '').toLowerCase().trim();

        if (fStatus === 'store' || fStatus === 'stored') {
          if (itemStatus !== 'stored') return false;
        } else if (fStatus === 'pending') {
          const isPending = itemStatus === 'pending' || itemStatus === 'pending approval' || itemStatus === 'pending claim';
          if (!isPending) return false;
        } else if (fStatus === 'handover' || fStatus === 'handed over') {
          if (itemStatus !== 'handed over' && itemStatus !== 'claimed') return false;
        } else if (fStatus === 'displaced' || fStatus === 'dispatched' || fStatus === 'disposed') {
          const isDisplaced = itemStatus === 'dispatched' || itemStatus === 'disposed' || itemStatus === 'archived';
          if (!isDisplaced) return false;
        } else {
          if (itemStatus !== fStatus) return false;
        }
      }

      const itemDate = item.dateFound ? item.dateFound.split('T')[0] : (item.createdAt ? item.createdAt.split('T')[0] : '');
      if (filters.startDate && itemDate) {
        if (itemDate < filters.startDate) return false;
      }
      if (filters.endDate && itemDate) {
        if (itemDate > filters.endDate) return false;
      }

      if (filters.category && filters.category !== 'All Categories' && filters.category !== 'All') {
        if ((item.category || '').toLowerCase() !== (filters.category || '').toLowerCase()) return false;
      }

      if (filters.storeLocation && filters.storeLocation !== 'All Locations' && filters.storeLocation !== 'All') {
        if ((item.storeLocation || '').toLowerCase() !== (filters.storeLocation || '').toLowerCase()) return false;
      }

      if (filters.year && filters.year !== 'Year' && filters.year !== 'All') {
        if (!item.dateFound || !item.dateFound.startsWith(filters.year)) return false;
      }

      if (filters.month && filters.month !== 'Month' && filters.month !== 'All') {
        const itemMonth = new Date(item.dateFound).getMonth() + 1;
        const targetMonth = parseInt(filters.month, 10);
        if (itemMonth !== targetMonth) return false;
      }

      return true;
    });
  }, [activeItems, filters]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal: any = a[sortField as keyof LostItem] || '';
      let bVal: any = b[sortField as keyof LostItem] || '';

      if (sortField === 'dateFound' || sortField === 'dispatchDeadline') {
        aVal = new Date(aVal || '1970-01-01').getTime();
        bVal = new Date(bVal || '1970-01-01').getTime();
      } else if (typeof aVal === 'string' || typeof bVal === 'string') {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  const isAllPageSelected =
    paginatedItems.length > 0 && paginatedItems.every(i => selectedItemIds.includes(i.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedItems.map(i => i.id);
      setSelectedItemIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedItems.map(i => i.id);
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportExcel = (itemsToExport = filteredItems) => {
    const dataToExport = itemsToExport.map((item, idx) => ({
      Serial: idx + 1,
      Code: item.code,
      ItemName: item.itemName,
      Category: item.category,
      Description: item.description,
      DateFound: item.dateFound,
      TimeFound: item.timeFound || '',
      LocationFound: item.locationFound,
      RoomNumber: item.roomNumber || '',
      StoreLocation: item.storeLocation,
      Status: item.status,
      GuestName: item.guestName || '',
      FinderEmployee: item.employeeName,
      RecordedBy: item.recordedBy,
      DispatchDeadline: item.dispatchDeadline
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LostAndFound');
    XLSX.writeFile(wb, `Warwick_Lost_Found_DataTable_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSelectedExcel = () => {
    const selected = activeItems.filter(i => selectedItemIds.includes(i.id));
    if (selected.length > 0) {
      exportExcel(selected);
    }
  };

  const exportCSV = () => {
    const dataToExport = filteredItems.map((item, idx) => ({
      Serial: idx + 1,
      Code: item.code,
      ItemName: item.itemName,
      Category: item.category,
      DateFound: item.dateFound,
      LocationFound: item.locationFound,
      StoreLocation: item.storeLocation,
      Status: item.status,
      GuestName: item.guestName || '',
      FinderEmployee: item.employeeName
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Warwick_Lost_Found_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    
    if (preset === 'All') {
      setFilters(prev => ({ ...prev, datePreset: 'All', startDate: '', endDate: '' }));
    } else if (preset === 'Today') {
      setFilters(prev => ({ ...prev, datePreset: 'Today', startDate: todayIso, endDate: todayIso }));
    } else if (preset === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, datePreset: 'Yesterday', startDate: yesterdayIso, endDate: yesterdayIso }));
    } else if (preset === 'Last 7 Days') {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 7);
      setFilters(prev => ({ ...prev, datePreset: 'Last 7 Days', startDate: d7.toISOString().split('T')[0], endDate: todayIso }));
    } else if (preset === 'This Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, datePreset: 'This Month', startDate: firstDay, endDate: todayIso }));
    } else if (preset === 'Last 30 Days') {
      const d30 = new Date(today);
      d30.setDate(d30.getDate() - 30);
      setFilters(prev => ({ ...prev, datePreset: 'Last 30 Days', startDate: d30.toISOString().split('T')[0], endDate: todayIso }));
    } else if (preset === 'Custom') {
      setFilters(prev => ({ ...prev, datePreset: 'Custom' }));
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'All Status',
      category: 'All Categories',
      month: 'All',
      year: 'All',
      storeLocation: 'All',
      startDate: '',
      endDate: '',
      datePreset: 'All'
    });
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 ml-1" />
    );
  };

  const pendingApprovalsCount = useMemo(() => {
    return activeItems.filter(i => i.status === 'Pending Approval' || (i.isApproved === false && i.approvalStatus === 'pending')).length;
  }, [activeItems]);

  if (isLoading) {
    return (
      <TableSkeleton
        rows={8}
        columns={8}
        hasFilterBar={true}
        hasMetricCards={false}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <ItemsHeader
        t={t}
        isAdminTier={isAdminTier}
        hasCreatePermission={hasPermission('create')}
        onExportExcel={() => exportExcel(filteredItems)}
        onExportCSV={exportCSV}
        onAddNewItem={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
      />

      {(isAdminTier || hasPermission('edit')) && pendingApprovalsCount > 0 && (
        <ItemsPendingBanner
          pendingApprovalsCount={pendingApprovalsCount}
          t={t}
          onShowPending={() => {
            setFilters(prev => ({ ...prev, status: 'Pending Approval' }));
            setCurrentPage(1);
          }}
        />
      )}

      <ItemsFilterBar
        filters={filters}
        setFilters={setFilters}
        t={t}
        settings={settings}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        onDatePresetChange={handleDatePresetChange}
        onResetFilters={resetFilters}
        onPageReset={() => setCurrentPage(1)}
      />

      <ItemsBulkActionsBar
        selectedItemIds={selectedItemIds}
        totalFilteredCount={filteredItems.length}
        onSelectAllFiltered={() => setSelectedItemIds(filteredItems.map(i => i.id))}
        onClearSelection={() => setSelectedItemIds([])}
        onExportSelectedExcel={exportSelectedExcel}
        hasPrintPermission={hasPermission('print')}
        onBulkPrintFirst={() => {
          const firstSelected = activeItems.find(i => i.id === selectedItemIds[0]);
          if (firstSelected) openPrint(firstSelected);
        }}
        hasDeletePermission={hasPermission('delete')}
        onOpenBatchDelete={() => {
          setBatchDeleteReason('');
          setIsPermanentBatchDelete(false);
          setIsBatchDeleteModalOpen(true);
        }}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <ItemsPagination
          pageSize={pageSize}
          setPageSize={setPageSize}
          safePage={safePage}
          totalPages={totalPages}
          totalFilteredCount={filteredItems.length}
          totalActiveCount={activeItems.length}
          startIndex={startIndex}
          setCurrentPage={setCurrentPage}
        />

        <ItemsTable
          paginatedItems={paginatedItems}
          startIndex={startIndex}
          selectedItemIds={selectedItemIds}
          isAllPageSelected={isAllPageSelected}
          onToggleSelectAllPage={toggleSelectAllPage}
          onToggleSelectItem={toggleSelectItem}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          renderSortIcon={renderSortIcon}
          t={t}
          isAdminTier={isAdminTier}
          isSuperAdmin={isSuperAdmin}
          previewRole={previewRole}
          hasPermission={hasPermission}
          onApproveItem={async id => {
            await approveItem(id);
          }}
          onOpenRejectModal={item => setRejectModalItem(item)}
          onOpenItemQrModal={openItemQrModal}
          onOpenItemDetails={openItemDetails}
          onOpenEditItem={openEditItem}
          onOpenHandover={openHandover}
          onOpenDispatch={openDispatch}
          onOpenReturnToStore={openReturnToStore}
          onOpenPrint={openPrint}
          onOpenDelete={openDelete}
          onResetFilters={resetFilters}
        />

        <ItemsPaginationFooter
          safePage={safePage}
          totalPages={totalPages}
          sortedItemsCount={sortedItems.length}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <BatchDeleteModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        selectedCount={selectedItemIds.length}
        modalRef={batchDeleteModalRef}
        batchDeleteReason={batchDeleteReason}
        setBatchDeleteReason={setBatchDeleteReason}
        isPermanentBatchDelete={isPermanentBatchDelete}
        setIsPermanentBatchDelete={setIsPermanentBatchDelete}
        isProcessingBatchDelete={isProcessingBatchDelete}
        onConfirmBatchDelete={async () => {
          setIsProcessingBatchDelete(true);
          try {
            await batchDeleteItems(selectedItemIds, {
              reason: batchDeleteReason,
              permanent: isPermanentBatchDelete
            });
            setSelectedItemIds([]);
            setIsBatchDeleteModalOpen(false);
          } catch (e) {
            console.error('Batch delete error:', e);
          } finally {
            setIsProcessingBatchDelete(false);
          }
        }}
        isAdminTier={isAdminTier}
      />

      <RejectSubmissionModal
        isOpen={Boolean(rejectModalItem)}
        item={rejectModalItem}
        onClose={() => setRejectModalItem(null)}
        onConfirmReject={async (itemId, reason) => {
          await rejectItem(itemId, reason);
        }}
      />
    </div>
  );
};
