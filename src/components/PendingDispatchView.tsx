import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  Truck,
  CalendarCheck,
  Eye,
  CheckCircle2,
  X,
  Calendar,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  RotateCcw,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LostItem } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

type SortField =
  | 'serial'
  | 'code'
  | 'dateFound'
  | 'itemName'
  | 'category'
  | 'employeeName'
  | 'dispatchDeadline'
  | 'urgency';

export const PendingDispatchView: React.FC = () => {
  const { activeItems, batchDispatchItems, openDispatch, openItemDetails, getValidationMessage } = useApp();
  const { user, hasPermission } = useAuth();
  const { t, isRTL, translateCategory } = useLanguage();

  // Selection & Tabs
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  // Data Table Search, Filter, Sort, Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('urgency');
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

    const overdue: Array<LostItem & { diffDays: number }> = [];
    const todayDue: Array<LostItem & { diffDays: number }> = [];
    const upcoming: Array<LostItem & { diffDays: number }> = [];
    const allPending: Array<LostItem & { diffDays: number }> = [];

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

  // Reset to first page when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: number) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // Helper render sort header icon
  const renderSortHeader = (field: SortField, label: string) => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors uppercase tracking-wider text-[11px] font-bold cursor-pointer select-none"
      >
        <span>{label}</span>
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
        )}
      </button>
    );
  };

  const isAllCurrentPageSelected =
    paginatedItems.length > 0 && paginatedItems.every(i => selectedItemIds.includes(i.id));

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* 4 Top Metric Cards (Sleek Interface) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pending */}
        <div
          onClick={() => {
            setActiveCategoryFilter('all');
            setCurrentPage(1);
          }}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'all'
              ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.pendingDispatchMetric || 'TOTAL PENDING'}
            </p>
            <p className="text-2xl font-bold text-slate-900">{pendingItems.length}</p>
            <div className="mt-2 flex items-center text-xs text-indigo-600 font-medium">
              <span className="mr-1">•</span>
              {t.awaitingFulfillment || 'Awaiting fulfillment'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => {
            setActiveCategoryFilter('overdue');
            setCurrentPage(1);
          }}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'overdue'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-rose-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.overdue || 'OVERDUE'}
            </p>
            <p className="text-2xl font-bold text-rose-600">{overdueItems.length}</p>
            <div className="mt-2 flex items-center text-xs text-rose-600 font-medium">
              <span className="mr-1">•</span>
              {t.pastPolicyWindow || 'Past policy window'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => {
            setActiveCategoryFilter('today');
            setCurrentPage(1);
          }}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'today'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-amber-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.dueToday || 'DUE TODAY'}
            </p>
            <p className="text-2xl font-bold text-amber-600">{todayDueItems.length}</p>
            <div className="mt-2 flex items-center text-xs text-amber-600 font-medium">
              <span className="mr-1">•</span>
              {t.immediateAction || 'Immediate action'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Due in 1-3 Days */}
        <div
          onClick={() => {
            setActiveCategoryFilter('upcoming');
            setCurrentPage(1);
          }}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'upcoming'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-blue-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.dueIn3Days || 'DUE IN 1-3 DAYS'}
            </p>
            <p className="text-2xl font-bold text-blue-600">{upcomingDueItems.length}</p>
            <div className="mt-2 flex items-center text-xs text-blue-600 font-medium">
              <span className="mr-1">•</span>
              {t.upcomingCutoff || 'Upcoming cutoff'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                {t.pendingDispatchTitle || 'Pending Dispatch Records'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {sortedItems.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.pendingDispatchSubtitle || 'Items exceeding or approaching storage retention threshold for finder staff claiming'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Batch Dispatch Trigger Button */}
            {selectedItemIds.length > 0 && hasPermission('dispatch') && (
              <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 animate-slide-down">
                <span className="text-xs font-bold text-indigo-900">
                  {selectedItemIds.length} Selected
                </span>
                <button
                  id="btn-batch-dispatch-trigger"
                  onClick={handleOpenBatchDispatch}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Batch Dispatch</span>
                </button>
                <button
                  onClick={() => setSelectedItemIds([])}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              disabled={sortedItems.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Data Table Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search code, item name, staff, category..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Rows Per Page */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={e => handleCategoryChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer shadow-2xs"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {translateCategory(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Reset active search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          {sortedItems.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-sm">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No records match your search or filter'
                  : t.noPendingDispatch || 'No items in this dispatch category'}
              </p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try clearing the search query or category filter to view all pending dispatches.'
                  : t.allRetentionInCompliance || 'All retention and storage schedules are currently in compliance.'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left rtl:text-right text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      id="checkbox-select-all-dispatch"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAllCurrentPage}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select all on current page"
                    />
                  </th>

                  {/* Serial Number (#) */}
                  <th className="py-3 px-2.5 w-12 text-center text-slate-500">
                    {renderSortHeader('serial', '#')}
                  </th>

                  {/* Item Code */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('code', t.itemCode || 'Code')}
                  </th>

                  {/* Date Found (New Requested Column) */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('dateFound', 'Date Found')}
                  </th>

                  {/* Item Name */}
                  <th className="py-3 px-3">
                    {renderSortHeader('itemName', t.itemName || 'Item Name')}
                  </th>

                  {/* Category */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('category', t.category || 'Category')}
                  </th>

                  {/* Found By (Finder Staff) */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('employeeName', t.finderStaff || 'Found By')}
                  </th>

                  {/* Retention Deadline */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('dispatchDeadline', t.retentionDeadline || 'Deadline')}
                  </th>

                  {/* Urgency */}
                  <th className="py-3 px-3 whitespace-nowrap">
                    {renderSortHeader('urgency', t.urgency || 'Urgency')}
                  </th>

                  {/* Action */}
                  <th className="py-3 px-4 text-right rtl:text-left whitespace-nowrap">
                    {t.actions || 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {paginatedItems.map((item, index) => {
                  const serialNumber = startIndex + index + 1;
                  const diffDays = item.diffDays ?? 0;
                  const isOverdue = diffDays < 0;
                  const isDueToday = diffDays === 0;
                  const isSelected = selectedItemIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-2.5 text-center font-mono text-[11px] text-slate-400 font-semibold">
                        {serialNumber}
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openItemDetails(item)}
                          className="hover:underline text-left rtl:text-right cursor-pointer"
                          title="View Item Details"
                        >
                          {item.code}
                        </button>
                      </td>

                      {/* Date Found */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {item.dateFound ? (
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{formatDate(item.dateFound)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Item Name */}
                      <td
                        className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate capitalize"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {item.itemName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                          {translateCategory(item.category)}
                        </span>
                      </td>

                      {/* Found By */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {item.employeeName || 'Staff'}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {item.dispatchDeadline ? formatDate(item.dispatchDeadline) : t.immediate || 'Immediate'}
                      </td>

                      {/* Urgency */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isDueToday
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>
                                {t.overdue || 'Overdue'} ({Math.abs(diffDays)}d)
                              </span>
                            </>
                          ) : isDueToday ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{t.dueToday || 'Due Today'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>
                                {diffDays} {t.daysRemaining || 'days left'}
                              </span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions (QR Code has been removed as requested) */}
                      <td className="py-3 px-4 text-right rtl:text-left whitespace-nowrap">
                        <div className="flex items-center justify-end rtl:justify-start space-x-1.5 rtl:space-x-reverse">
                          <button
                            type="button"
                            onClick={() => openItemDetails(item)}
                            title={t.viewDetails || 'View Details'}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('dispatch') && (
                            <button
                              id={`btn-dispatch-action-${item.id}`}
                              type="button"
                              onClick={() => openDispatch(item)}
                              className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>{t.dispatch || 'Dispatch'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Data Table Pagination Controls Footer */}
        {sortedItems.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50/70">
            {/* Showing entries info */}
            <div className="font-medium">
              Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{sortedItems.length}</span> entries
              {filteredItems.length !== baseCategoryItems.length && (
                <span className="text-slate-400 ml-1">(filtered from {baseCategoryItems.length} total)</span>
              )}
            </div>

            {/* Page Navigation Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-slate-400 px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                            safePage === p
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Batch Dispatch Modal */}
      {isBatchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isSubmittingBatch) {
              setIsBatchModalOpen(false);
            }
          }}
        >
          <div
            ref={batchModalRef}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Batch Dispatch ({selectedItemIds.length} Items)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Process and dispatch selected items in a single workflow
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchDispatch} noValidate className="p-6 space-y-4">
              {/* Selected Items preview chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Selected Items ({selectedItemsList.length})
                </label>
                <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
                  {selectedItemsList.map(item => (
                    <span
                      key={item.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                    >
                      <span className="font-mono text-indigo-600 font-bold">{item.code}:</span>
                      <span className="max-w-[120px] truncate">{item.itemName}</span>
                      <span className="text-[10px] text-slate-400">({item.employeeName || 'Staff'})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Method / Authorization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Internal Staff Release, Hotel Staff Handover"
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Reference / Auth # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DSP-20260829-001"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Housekeeping Staff Room, Main Reception"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatched To (Receiver / Staff)
                  </label>
                  <input
                    type="text"
                    placeholder="Defaults to respective finder employees"
                    value={dispatchedTo}
                    onChange={e => setDispatchedTo(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Notes & Authorization Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional dispatch remarks or handover notes..."
                  value={batchNotes}
                  onChange={e => setBatchNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingBatch}
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isSubmittingBatch
                      ? 'Processing Batch Dispatch...'
                      : `Confirm Dispatch (${selectedItemIds.length} Items)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
