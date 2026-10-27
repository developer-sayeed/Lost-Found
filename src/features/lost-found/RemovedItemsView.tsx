import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LostItem } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  RemovedItemsHeader,
  RemovedItemsAccessRestricted
} from './components/trash/RemovedItemsHeader';
import { RemovedItemsToolbar } from './components/trash/RemovedItemsToolbar';
import { RemovedItemsTable } from './components/trash/RemovedItemsTable';
import { TrashModals } from './components/trash/TrashModals';

export const RemovedItemsView: React.FC = () => {
  const {
    removedItems,
    restoreItem,
    permanentDeleteItem,
    batchRestoreItems,
    batchPermanentDeleteItems,
    emptyTrash,
    openItemDetails,
    setActiveTab,
    isLoading
  } = useApp();
  const { user, hasPermission, isSuperAdmin, previewRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<'deletedAt' | 'daysLeft' | 'code' | 'itemName'>('deletedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Confirmation Modals State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<LostItem | null>(null);

  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [itemToPermanentDelete, setItemToPermanentDelete] = useState<LostItem | null>(null);

  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchRestoreModalOpen, setIsBatchRestoreModalOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const restoreModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessing) {
      setIsRestoreModalOpen(false);
      setItemToRestore(null);
    }
  }, { active: isRestoreModalOpen && !!itemToRestore, closeOnEsc: true });

  const permanentDeleteModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessing) {
      setIsPermanentDeleteModalOpen(false);
      setItemToPermanentDelete(null);
    }
  }, { active: isPermanentDeleteModalOpen && !!itemToPermanentDelete, closeOnEsc: true });

  const batchRestoreModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessing) setIsBatchRestoreModalOpen(false);
  }, { active: isBatchRestoreModalOpen, closeOnEsc: true });

  const batchDeleteModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessing) setIsBatchDeleteModalOpen(false);
  }, { active: isBatchDeleteModalOpen, closeOnEsc: true });

  const emptyTrashModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isProcessing) setIsEmptyTrashModalOpen(false);
  }, { active: isEmptyTrashModalOpen, closeOnEsc: true });

  const isMasterAdmin = isSuperAdmin && !previewRole;
  const hasRemovedItemsAccess = isMasterAdmin || hasPermission('removed_items');
  const canManageTrash = isMasterAdmin || hasPermission('removed_items') || hasPermission('delete');

  // Calculate days remaining out of 60 days
  const calculateDaysRemaining = (deletedAt?: string) => {
    if (!deletedAt) return 60;
    const deleteTime = new Date(deletedAt).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - deleteTime) / (1000 * 60 * 60 * 24));
    const remaining = 60 - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  // Distinct categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    removedItems.forEach(i => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats);
  }, [removedItems]);

  // Filtered and Sorted list
  const filteredAndSortedItems = useMemo(() => {
    let result = removedItems.filter(item => {
      if (searchQuery.trim()) {
        const q = (searchQuery || '').toLowerCase().trim();
        const matches =
          Boolean(item.code && item.code.toLowerCase().includes(q)) ||
          Boolean(item.itemName && item.itemName.toLowerCase().includes(q)) ||
          Boolean(item.description && item.description.toLowerCase().includes(q)) ||
          Boolean(item.category && item.category.toLowerCase().includes(q)) ||
          Boolean(item.locationFound && item.locationFound.toLowerCase().includes(q)) ||
          Boolean(item.deletedBy && item.deletedBy.toLowerCase().includes(q)) ||
          Boolean(item.deletionReason && item.deletionReason.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (categoryFilter !== 'All') {
        if ((item.category || '').toLowerCase() !== (categoryFilter || '').toLowerCase()) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortField === 'deletedAt') {
        const timeA = new Date(a.deletedAt || '1970-01-01').getTime();
        const timeB = new Date(b.deletedAt || '1970-01-01').getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortField === 'daysLeft') {
        const daysA = calculateDaysRemaining(a.deletedAt);
        const daysB = calculateDaysRemaining(b.deletedAt);
        return sortDirection === 'asc' ? daysA - daysB : daysB - daysA;
      }
      if (sortField === 'code') {
        const codeA = a.code || '';
        const codeB = b.code || '';
        return sortDirection === 'asc' ? codeA.localeCompare(codeB) : codeB.localeCompare(codeA);
      }
      if (sortField === 'itemName') {
        const nameA = a.itemName || a.description || '';
        const nameB = b.itemName || b.description || '';
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [removedItems, searchQuery, categoryFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, currentPage, pageSize]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map(item => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: 'deletedAt' | 'daysLeft' | 'code' | 'itemName') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Actions
  const handleSingleRestore = async () => {
    if (!itemToRestore) return;
    setIsProcessing(true);
    try {
      await restoreItem(itemToRestore.id);
      setIsRestoreModalOpen(false);
      setItemToRestore(null);
      setSelectedIds(prev => prev.filter(id => id !== itemToRestore.id));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSinglePermanentDelete = async () => {
    if (!itemToPermanentDelete) return;
    setIsProcessing(true);
    try {
      await permanentDeleteItem(itemToPermanentDelete.id);
      setIsPermanentDeleteModalOpen(false);
      setItemToPermanentDelete(null);
      setSelectedIds(prev => prev.filter(id => id !== itemToPermanentDelete.id));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await batchRestoreItems(selectedIds);
      setSelectedIds([]);
      setIsBatchRestoreModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await batchPermanentDeleteItems(selectedIds);
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmptyTrash = async () => {
    setIsProcessing(true);
    try {
      await emptyTrash();
      setSelectedIds([]);
      setIsEmptyTrashModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasRemovedItemsAccess) {
    return (
      <RemovedItemsAccessRestricted
        userName={user?.name}
        userRole={user?.role}
        onReturnToDashboard={() => setActiveTab('dashboard')}
      />
    );
  }

  if (isLoading) {
    return (
      <TableSkeleton
        rows={8}
        columns={7}
        hasFilterBar={true}
        hasMetricCards={false}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      <RemovedItemsHeader
        removedCount={removedItems.length}
        canManageTrash={Boolean(canManageTrash)}
        onNavigateToActiveItems={() => setActiveTab('items')}
        onOpenEmptyTrashModal={() => setIsEmptyTrashModalOpen(true)}
      />

      <RemovedItemsToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setCurrentPage={setCurrentPage}
        selectedIds={selectedIds}
        canManageTrash={Boolean(canManageTrash)}
        onOpenBatchRestoreModal={() => setIsBatchRestoreModalOpen(true)}
        onOpenBatchDeleteModal={() => setIsBatchDeleteModalOpen(true)}
        onClearSelection={() => setSelectedIds([])}
      />

      <RemovedItemsTable
        paginatedItems={paginatedItems}
        filteredAndSortedCount={filteredAndSortedItems.length}
        selectedIds={selectedIds}
        canManageTrash={Boolean(canManageTrash)}
        onSelectAll={handleSelectAll}
        onToggleSelect={handleToggleSelect}
        onSort={handleSort}
        calculateDaysRemaining={calculateDaysRemaining}
        openItemDetails={openItemDetails}
        onOpenSingleRestoreModal={item => {
          setItemToRestore(item);
          setIsRestoreModalOpen(true);
        }}
        onOpenSinglePermanentDeleteModal={item => {
          setItemToPermanentDelete(item);
          setIsPermanentDeleteModalOpen(true);
        }}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        onResetFilters={() => {
          setSearchQuery('');
          setCategoryFilter('All');
        }}
      />

      <TrashModals
        isRestoreModalOpen={isRestoreModalOpen}
        itemToRestore={itemToRestore}
        restoreModalRef={restoreModalRef}
        onCloseRestoreModal={() => {
          setIsRestoreModalOpen(false);
          setItemToRestore(null);
        }}
        onConfirmSingleRestore={handleSingleRestore}

        isPermanentDeleteModalOpen={isPermanentDeleteModalOpen}
        itemToPermanentDelete={itemToPermanentDelete}
        permanentDeleteModalRef={permanentDeleteModalRef}
        onClosePermanentDeleteModal={() => {
          setIsPermanentDeleteModalOpen(false);
          setItemToPermanentDelete(null);
        }}
        onConfirmSinglePermanentDelete={handleSinglePermanentDelete}

        isBatchRestoreModalOpen={isBatchRestoreModalOpen}
        batchRestoreModalRef={batchRestoreModalRef}
        onCloseBatchRestoreModal={() => setIsBatchRestoreModalOpen(false)}
        onConfirmBatchRestore={handleBatchRestore}

        isBatchDeleteModalOpen={isBatchDeleteModalOpen}
        batchDeleteModalRef={batchDeleteModalRef}
        onCloseBatchDeleteModal={() => setIsBatchDeleteModalOpen(false)}
        onConfirmBatchPermanentDelete={handleBatchPermanentDelete}

        isEmptyTrashModalOpen={isEmptyTrashModalOpen}
        emptyTrashModalRef={emptyTrashModalRef}
        onCloseEmptyTrashModal={() => setIsEmptyTrashModalOpen(false)}
        onConfirmEmptyTrash={handleEmptyTrash}

        selectedCount={selectedIds.length}
        totalTrashCount={removedItems.length}
        isProcessing={isProcessing}
      />
    </div>
  );
};
