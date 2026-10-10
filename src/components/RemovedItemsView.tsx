import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckSquare,
  Square,
  Eye,
  Info,
  Calendar,
  User,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LostItem } from '../types';
import { Badge } from './Badge';
import { useClickOutside } from '../hooks/useClickOutside';

export const RemovedItemsView: React.FC = () => {
  const {
    removedItems,
    restoreItem,
    permanentDeleteItem,
    batchRestoreItems,
    batchPermanentDeleteItems,
    emptyTrash,
    openItemDetails,
    setActiveTab
  } = useApp();
  const { user, hasPermission, isSuperAdmin, previewRole, effectiveRole } = useAuth();

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

  if (!hasRemovedItemsAccess) {
    return (
      <div className="p-6 sm:p-12 max-w-3xl mx-auto text-center animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Removed Items and Recycle Bin access is restricted. Only users who have been granted explicit permission by the Administrator can view or restore removed items.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl mb-6">
            Current Account: {user?.name || 'Staff'} ({user?.role || 'Employee'})
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate days remaining out of 60 days
  const calculateDaysRemaining = (deletedAt?: string) => {
    if (!deletedAt) return 60;
    const deleteTime = new Date(deletedAt).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - deleteTime) / (1000 * 60 * 60 * 24));
    const remaining = 60 - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

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

  // Distinct categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    removedItems.forEach(i => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats);
  }, [removedItems]);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                Removed Items
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  {removedItems.length} {removedItems.length === 1 ? 'item' : 'items'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Items removed from inventory are retained for 60 days before auto-purge
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Package className="w-4 h-4 text-slate-500" />
            <span>Active Inventory</span>
          </button>

          {canManageTrash && removedItems.length > 0 && (
            <button
              type="button"
              id="btn-empty-trash"
              onClick={() => setIsEmptyTrashModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Empty Recycle Bin</span>
            </button>
          )}
        </div>
      </div>

      {/* 60-Day Retention Notice Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed flex-1">
          <p className="font-semibold text-amber-950 text-sm mb-0.5">
            60-Day Data Retention & Automatic Purge Policy
          </p>
          <p className="text-amber-800">
            Soft-deleted records remain securely in the system for <strong className="font-semibold text-amber-950">60 days</strong> from the deletion date. During this retention window, authorized staff can restore items back to the active catalog with full audit logs intact. Items exceeding 60 days are automatically purged during database sync.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="input-search-removed-items"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by code, item, location, deleted by..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category & Display Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Show:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Operations Bar (When items selected) */}
      {selectedIds.length > 0 && canManageTrash && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-950">
              {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-batch-restore"
              onClick={() => setIsBatchRestoreModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Selected ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              id="btn-batch-delete"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Permanently Delete ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredAndSortedItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Removed Items Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1">
                {searchQuery || categoryFilter !== 'All'
                  ? 'No items match your active search filter criteria.'
                  : 'Recycle bin is clean. Deleted items are stored here for 60 days before auto-purge.'}
              </p>
            </div>
            {(searchQuery || categoryFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                }}
                className="mt-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold select-none">
                  {canManageTrash && (
                    <th className="p-3.5 pl-4 w-10">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-slate-400 hover:text-slate-600 flex items-center"
                        title="Select All"
                      >
                        {selectedIds.length === paginatedItems.length && paginatedItems.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th
                    onClick={() => handleSort('code')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item Code & Info</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Category & Location</th>
                  <th
                    onClick={() => handleSort('deletedAt')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Removed On & By</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Deletion Reason</th>
                  <th
                    onClick={() => handleSort('daysLeft')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Auto-Purge In</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const daysLeft = calculateDaysRemaining(item.deletedAt);
                  const deletedDate = item.deletedAt
                    ? new Date(item.deletedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Unknown';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      {canManageTrash && (
                        <td className="p-3.5 pl-4">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="text-slate-400 hover:text-slate-600 flex items-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Code & Item Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-bold text-slate-900 block truncate">
                              {item.code}
                            </span>
                            <span
                              className="text-xs text-slate-600 font-medium truncate block max-w-xs capitalize"
                              style={{ textTransform: 'capitalize' }}
                            >
                              {item.itemName || item.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {item.category}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate">
                            Found: {item.locationFound}
                          </p>
                        </div>
                      </td>

                      {/* Removed On & By */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{deletedDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>
                              {item.deletedBy || 'Staff'}{' '}
                              {item.deletedByRole ? `(${item.deletedByRole})` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Deletion Reason */}
                      <td className="p-3.5">
                        <span className="text-slate-600 text-xs italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 block max-w-xs truncate">
                          "{item.deletionReason || 'Moved to trash'}"
                        </span>
                      </td>

                      {/* Auto-Purge Remaining Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            daysLeft > 30
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : daysLeft > 10
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          }`}
                        >
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View Full Item Details"
                            onClick={() => openItemDetails(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="Restore Item to Inventory"
                            onClick={() => {
                              setItemToRestore(item);
                              setIsRestoreModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>

                          {canManageTrash && (
                            <button
                              type="button"
                              title="Permanently Delete Item"
                              onClick={() => {
                                setItemToPermanentDelete(item);
                                setIsPermanentDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredAndSortedItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, filteredAndSortedItems.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{filteredAndSortedItems.length}</span> removed records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE RESTORE MODAL */}
      {isRestoreModalOpen && itemToRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setIsRestoreModalOpen(false);
              setItemToRestore(null);
            }
          }}
        >
          <div
            ref={restoreModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restore Item to Inventory</h3>
                <p className="text-xs text-slate-500 font-mono">Item Code: {itemToRestore.code}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900 text-sm">
                  {itemToRestore.itemName || itemToRestore.description}
                </p>
                <p className="text-slate-500">Category: {itemToRestore.category}</p>
                <p className="text-slate-500">Found Location: {itemToRestore.locationFound}</p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Restoring this item will move it back to the active inventory catalog with full timeline history preserved.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setItemToRestore(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-restore"
                  disabled={isProcessing}
                  onClick={handleSingleRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? 'Restoring...' : 'Restore Item'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PERMANENT DELETE MODAL */}
      {isPermanentDeleteModalOpen && itemToPermanentDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setIsPermanentDeleteModalOpen(false);
              setItemToPermanentDelete(null);
            }
          }}
        >
          <div
            ref={permanentDeleteModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Permanently Delete Item?</h3>
                <p className="text-xs text-rose-700 font-mono">Item Code: {itemToPermanentDelete.code}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900 text-sm">
                  {itemToPermanentDelete.itemName || itemToPermanentDelete.description}
                </p>
                <p className="text-slate-500">Category: {itemToPermanentDelete.category}</p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                ⚠️ <strong>Irreversible Action:</strong> This item will be permanently wiped from the database. It cannot be recovered or restored after this.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPermanentDeleteModalOpen(false);
                    setItemToPermanentDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-permanent-delete"
                  disabled={isProcessing}
                  onClick={handleSinglePermanentDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH RESTORE MODAL */}
      {isBatchRestoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setIsBatchRestoreModalOpen(false);
            }
          }}
        >
          <div
            ref={batchRestoreModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Batch Restore Items</h3>
                <p className="text-xs text-slate-500">{selectedIds.length} items selected</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Are you sure you want to restore <strong className="font-bold">{selectedIds.length} items</strong> back to active inventory?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchRestoreModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-batch-restore"
                  disabled={isProcessing}
                  onClick={handleBatchRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? 'Restoring...' : `Restore ${selectedIds.length} Items`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PERMANENT DELETE MODAL */}
      {isBatchDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setIsBatchDeleteModalOpen(false);
            }
          }}
        >
          <div
            ref={batchDeleteModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Permanently Delete {selectedIds.length} Items?</h3>
                <p className="text-xs text-rose-700">Bulk irreversible action</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                ⚠️ <strong>Warning:</strong> All {selectedIds.length} selected items will be permanently erased from both database and backup records.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-batch-delete"
                  disabled={isProcessing}
                  onClick={handleBatchPermanentDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Deleting...' : `Permanently Delete (${selectedIds.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY TRASH MODAL */}
      {isEmptyTrashModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setIsEmptyTrashModalOpen(false);
            }
          }}
        >
          <div
            ref={emptyTrashModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Empty Entire Recycle Bin?</h3>
                <p className="text-xs text-rose-700">{removedItems.length} total items will be purged</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                This will permanently delete all <strong className="font-bold text-rose-900">{removedItems.length} items</strong> currently in the Recycle Bin.
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                ⚠️ This operation cannot be undone.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmptyTrashModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-empty-trash"
                  disabled={isProcessing}
                  onClick={handleEmptyTrash}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Emptying...' : 'Empty Recycle Bin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
