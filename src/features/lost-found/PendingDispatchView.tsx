import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LostItem } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  DispatchSortField,
  DispatchCategoryFilter,
  ItemWithDiff
} from './types/dispatch.feature.types';
import { PendingDispatchMetricCards } from './components/dispatch/PendingDispatchMetricCards';
import { PendingDispatchTableToolbar } from './components/dispatch/PendingDispatchTableToolbar';
import { PendingDispatchTable } from './components/dispatch/PendingDispatchTable';
import { PendingDispatchPagination } from './components/dispatch/PendingDispatchPagination';
import { BatchDispatchModal } from './components/dispatch/BatchDispatchModal';

export const PendingDispatchView: React.FC = () => {
  const { activeItems, batchDispatchItems, openDispatch, openItemDetails, getValidationMessage, isLoading } = useApp();
  const { user, hasPermission } = useAuth();
  const { t, isRTL, translateCategory } = useLanguage();

  // Selection & Tabs
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<DispatchCategoryFilter>('all');

  // Data Table Search, Filter, Sort, Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<DispatchSortField>('urgency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Batch Dispatch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Internal Staff Release (Finder Staff)');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [destination, setDestination] = useState('Released to Respective Finder Staff');
  const [dispatchedTo, setDispatchedTo] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const batchModalRef = useClickOutside<HTMLDivElement>(
    () => {
      if (!isSubmittingBatch) setIsBatchModalOpen(false);
    },
    { active: isBatchModalOpen, closeOnEsc: true }
  );

  // Helper date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Compute all Pending Dispatch Items dynamically with exact day calculations
  const { pendingItems, overdueItems, todayDueItems, upcomingDueItems } = useMemo(() => {
    const todayDate = new Date();
    const todayIso = todayDate.toISOString().split('T')[0];
    const todayMid = new Date(todayIso);

    const overdue: ItemWithDiff[] = [];
    const todayDue: ItemWithDiff[] = [];
    const upcoming: ItemWithDiff[] = [];
    const allPending: ItemWithDiff[] = [];

    activeItems.forEach(item => {
      const isEligible =
        item.status === 'Stored' ||
        item.status === 'Pending' ||
        item.status === 'Pending Approval' ||
        item.status === 'Pending Claim' ||
        item.status === 'Under Review';

      if (!isEligible) return;

      if (item.dispatchDeadline) {
        const deadlineDate = new Date(item.dispatchDeadline);
        const diffDays = Math.ceil((deadlineDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));

        const itemWithDiff = { ...item, diffDays };

        if (diffDays < 0) {
          overdue.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (diffDays === 0) {
          todayDue.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (diffDays <= 3) {
          upcoming.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
          allPending.push(itemWithDiff);
        }
      } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
        allPending.push({ ...item, diffDays: 0 });
      }
    });

    return {
      pendingItems: allPending,
      overdueItems: overdue,
      todayDueItems: todayDue,
      upcomingDueItems: upcoming
    };
  }, [activeItems]);

  // Unique categories list for dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    pendingItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [pendingItems]);

  // Base list filtered by metric category card
  const baseCategoryItems = useMemo(() => {
    if (activeCategoryFilter === 'overdue') return overdueItems;
    if (activeCategoryFilter === 'today') return todayDueItems;
    if (activeCategoryFilter === 'upcoming') return upcomingDueItems;
    return pendingItems;
  }, [activeCategoryFilter, overdueItems, todayDueItems, upcomingDueItems, pendingItems]);

  // Filtered Items (Search & Category filter)
  const filteredItems = useMemo(() => {
    return baseCategoryItems.filter(item => {
      // Category dropdown filter
      if (selectedCategory !== 'all') {
        if ((item.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          Boolean(item.code && item.code.toLowerCase().includes(q)) ||
          Boolean(item.itemName && item.itemName.toLowerCase().includes(q)) ||
          Boolean(item.category && item.category.toLowerCase().includes(q)) ||
          Boolean(item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
          Boolean(item.locationFound && item.locationFound.toLowerCase().includes(q)) ||
          Boolean(item.dateFound && item.dateFound.toLowerCase().includes(q)) ||
          Boolean(item.description && item.description.toLowerCase().includes(q));

        if (!matches) return false;
      }

      return true;
    });
  }, [baseCategoryItems, selectedCategory, searchQuery]);

  // Sorted Items
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'code':
          comparison = (a.code || '').localeCompare(b.code || '');
          break;
        case 'dateFound': {
          const timeA = a.dateFound ? new Date(a.dateFound).getTime() : 0;
          const timeB = b.dateFound ? new Date(b.dateFound).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case 'itemName':
          comparison = (a.itemName || '').localeCompare(b.itemName || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'employeeName':
          comparison = (a.employeeName || '').localeCompare(b.employeeName || '');
          break;
        case 'dispatchDeadline': {
          const timeA = a.dispatchDeadline ? new Date(a.dispatchDeadline).getTime() : 0;
          const timeB = b.dispatchDeadline ? new Date(b.dispatchDeadline).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
        case 'urgency':
        default:
          comparison = (a.diffDays ?? 0) - (b.diffDays ?? 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredItems, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(sortedItems.length, startIndex + pageSize);
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Selection handlers
  const selectedItemsList = useMemo(() => {
    return activeItems.filter(i => selectedItemIds.includes(i.id) || selectedItemIds.includes(i.code));
  }, [activeItems, selectedItemIds]);

  const toggleSelectAllCurrentPage = () => {
    const currentPageIds = paginatedItems.map(i => i.id);
    const allSelectedOnPage = currentPageIds.every(id => selectedItemIds.includes(id));

    if (allSelectedOnPage) {
      setSelectedItemIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Batch dispatch handlers
  const handleOpenBatchDispatch = () => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    setTrackingNumber(`DSP-${todayStr}-${randCode}`);
    setCourierName('Internal Staff Release (Finder Staff)');
    setDestination('Released to Respective Finder Staff');
    setDispatchedTo('');
    setBatchNotes(`Batch dispatch processed for ${selectedItemIds.length} items.`);
    setIsBatchModalOpen(true);
  };

  const handleConfirmBatchDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) return;

    if (!courierName.trim()) {
      toast.error(getValidationMessage('valDispatchMethod'));
      return;
    }
    if (!trackingNumber.trim()) {
      toast.error(getValidationMessage('valTrackingRef'));
      return;
    }

    setIsSubmittingBatch(true);
    try {
      await batchDispatchItems(selectedItemIds, {
        courierName: courierName.trim() || 'Internal Staff Dispatch',
        trackingNumber: trackingNumber.trim() || `BATCH-DSP-${Date.now()}`,
        destination: destination.trim() || 'Released to Staff / Guest',
        dispatchedTo: dispatchedTo.trim() || undefined,
        notes: batchNotes.trim() || `Batch dispatched by ${user?.name || 'Staff'}`
      });
      setSelectedItemIds([]);
      setIsBatchModalOpen(false);
    } catch (err) {
      console.error('Batch dispatch error:', err);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (sortedItems.length === 0) {
      toast.info('No records to export');
      return;
    }

    const headers = ['Serial', 'Code', 'Date Found', 'Item Name', 'Category', 'Found By', 'Deadline', 'Urgency Days', 'Status'];
    const rows = sortedItems.map((item, idx) => [
      idx + 1,
      `"${item.code || ''}"`,
      `"${item.dateFound || ''}"`,
      `"${(item.itemName || '').replace(/"/g, '""')}"`,
      `"${item.category || ''}"`,
      `"${(item.employeeName || '').replace(/"/g, '""')}"`,
      `"${item.dispatchDeadline || ''}"`,
      item.diffDays ?? '',
      `"${item.status || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pending_dispatch_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sortedItems.length} records to CSV`);
  };

  const isAllCurrentPageSelected =
    paginatedItems.length > 0 && paginatedItems.every(i => selectedItemIds.includes(i.id));

  if (isLoading) {
    return (
      <TableSkeleton
        rows={8}
        columns={7}
        hasFilterBar={true}
        hasMetricCards={true}
        metricCardsCount={4}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* 4 Top Metric Cards */}
      <PendingDispatchMetricCards
        activeCategoryFilter={activeCategoryFilter}
        setActiveCategoryFilter={setActiveCategoryFilter}
        setCurrentPage={setCurrentPage}
        pendingItems={pendingItems}
        overdueItems={overdueItems}
        todayDueItems={todayDueItems}
        upcomingDueItems={upcomingDueItems}
        t={t}
      />

      {/* Main Data Table Container */}
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-sm overflow-hidden">
        <PendingDispatchTableToolbar
          sortedCount={sortedItems.length}
          selectedItemIds={selectedItemIds}
          hasDispatchPermission={Boolean(hasPermission('dispatch'))}
          onOpenBatchDispatch={handleOpenBatchDispatch}
          onClearSelection={() => setSelectedItemIds([])}
          onExportCsv={handleExportCsv}
          searchQuery={searchQuery}
          onSearchChange={val => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          selectedCategory={selectedCategory}
          onCategoryChange={val => {
            setSelectedCategory(val);
            setCurrentPage(1);
          }}
          uniqueCategories={uniqueCategories}
          pageSize={pageSize}
          onPageSizeChange={val => {
            setPageSize(val);
            setCurrentPage(1);
          }}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setCurrentPage(1);
          }}
          translateCategory={translateCategory}
          t={t}
        />

        <PendingDispatchTable
          paginatedItems={paginatedItems}
          startIndex={startIndex}
          selectedItemIds={selectedItemIds}
          isAllCurrentPageSelected={isAllCurrentPageSelected}
          onToggleSelectAllCurrentPage={toggleSelectAllCurrentPage}
          onToggleSelect={toggleSelect}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={field => {
            if (sortField === field) {
              setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortField(field);
              setSortDirection('asc');
            }
          }}
          formatDate={formatDate}
          translateCategory={translateCategory}
          hasDispatchPermission={Boolean(hasPermission('dispatch'))}
          openItemDetails={openItemDetails}
          openDispatch={openDispatch}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setCurrentPage(1);
          }}
          t={t}
        />

        <PendingDispatchPagination
          startIndex={startIndex}
          endIndex={endIndex}
          totalSortedCount={sortedItems.length}
          filteredCount={filteredItems.length}
          baseCategoryCount={baseCategoryItems.length}
          currentPage={currentPage}
          totalPages={totalPages}
          safePage={safePage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <BatchDispatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        modalRef={batchModalRef}
        isSubmittingBatch={isSubmittingBatch}
        onConfirmBatchDispatch={handleConfirmBatchDispatch}
        selectedItemIds={selectedItemIds}
        selectedItemsList={selectedItemsList}
        courierName={courierName}
        setCourierName={setCourierName}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        destination={destination}
        setDestination={setDestination}
        dispatchedTo={dispatchedTo}
        setDispatchedTo={setDispatchedTo}
        batchNotes={batchNotes}
        setBatchNotes={setBatchNotes}
      />
    </div>
  );
};
