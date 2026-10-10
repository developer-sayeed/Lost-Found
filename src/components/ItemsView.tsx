import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  HeartHandshake,
  Box,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  CheckSquare,
  Square,
  Download,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  QrCode,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LostItem, ItemStatus, ItemCategory } from '../types';
import { isWithinHandover24Hours } from '../lib/handoverUtils';
import { Badge } from './Badge';
import { useClickOutside } from '../hooks/useClickOutside';
import { useLanguage } from '../context/LanguageContext';
import { RejectSubmissionModal } from './modals/RejectSubmissionModal';

type SortField =
  | 'serial'
  | 'code'
  | 'dateFound'
  | 'locationFound'
  | 'itemName'
  | 'category'
  | 'storeLocation'
  | 'status'
  | 'dispatchDeadline';

type SortDirection = 'asc' | 'desc';

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
    openQrScanner,
    openItemQrModal,
    approveItem,
    rejectItem,
    openReturnToStore,
    batchDeleteItems
  } = useApp();
  const { user, isAdmin, hasPermission, effectiveRole, isSuperAdmin, previewRole } = useAuth();
  const { t, isRTL, translateCategory, translateStatus } = useLanguage();
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

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered Items with dynamic Status & Date Range logic
  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      // Search
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

      // Status Filter (All Status, Store, Pending, Handover, Displaced)
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

      // Date Range Filter (Start Date & End Date)
      const itemDate = item.dateFound ? item.dateFound.split('T')[0] : (item.createdAt ? item.createdAt.split('T')[0] : '');
      if (filters.startDate && itemDate) {
        if (itemDate < filters.startDate) return false;
      }
      if (filters.endDate && itemDate) {
        if (itemDate > filters.endDate) return false;
      }

      // Category Filter
      if (filters.category && filters.category !== 'All Categories' && filters.category !== 'All') {
        if ((item.category || '').toLowerCase() !== (filters.category || '').toLowerCase()) return false;
      }

      // Store Location Filter
      if (filters.storeLocation && filters.storeLocation !== 'All Locations' && filters.storeLocation !== 'All') {
        if ((item.storeLocation || '').toLowerCase() !== (filters.storeLocation || '').toLowerCase()) return false;
      }

      // Year Filter
      if (filters.year && filters.year !== 'Year' && filters.year !== 'All') {
        if (!item.dateFound || !item.dateFound.startsWith(filters.year)) return false;
      }

      // Month Filter
      if (filters.month && filters.month !== 'Month' && filters.month !== 'All') {
        const itemMonth = new Date(item.dateFound).getMonth() + 1;
        const targetMonth = parseInt(filters.month, 10);
        if (itemMonth !== targetMonth) return false;
      }

      return true;
    });
  }, [activeItems, filters]);

  // Sorted Items
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

  // Pagination Math
  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  // Selection Handlers
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

  // Export handlers
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

  // Date preset helper
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

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.lostAndFoundItems || 'Lost & Found Data Table'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.hotelSubtitle || 'Interactive hotel inventory database with live sorting, pagination, and multi-record controls'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="btn-items-qr-scan"
            onClick={openQrScanner}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl transition-all shadow-2xs group"
            title={t.scanQr || 'Scan physical QR code tag with camera or upload photo'}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>{t.scanQr || 'Scan QR Tag'}</span>
          </button>

          <button
            id="btn-export-excel"
            onClick={() => exportExcel(filteredItems)}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel || 'Export Excel'}</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.exportCSV || 'CSV'}</span>
          </button>

          {hasPermission('create') && (
            <button
              id="btn-items-add-new"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addItem || (isAdminTier ? 'Add New Item' : 'Submit Found Item')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Pending Approval Alert Banner for Admin/Manager/Supervisor or authorized edit staff */}
      {(isAdminTier || hasPermission('edit')) && pendingApprovalsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex items-center space-x-3 rtl:space-x-reverse text-amber-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-amber-950 flex items-center space-x-2 rtl:space-x-reverse">
                <span>{pendingApprovalsCount} {t.pendingApproval || 'Staff Submissions Awaiting Approval'}</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full">Review Required</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Staff have logged items requiring approval before entering the active inventory. Once approved, the record will show you as "Recorded By".
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, status: 'Pending Approval' }));
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors shrink-0 self-start sm:self-auto"
          >
            Show Pending ({pendingApprovalsCount})
          </button>
        </div>
      )}

      {/* Interactive Control & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-time Global Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 transform -translate-y-1/2`} />
            <input
              id="input-items-search"
              type="text"
              placeholder={t.searchPlaceholder || 'Search code, item name, room, finder, category, guest...'}
              value={filters.searchQuery}
              onChange={e => {
                setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              className={`w-full ${isRTL ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'} py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400`}
            />
          </div>

          {/* Dedicated Status Filter Dropdown (All Status, Store, Pending, Handover, Displaced) */}
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse min-w-[150px]">
            <span className="text-xs font-semibold text-slate-500 shrink-0">{t.status}:</span>
            <select
              id="select-status-filter-dropdown"
              value={filters.status || 'All Status'}
              onChange={e => {
                setFilters(prev => ({ ...prev, status: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="All Status">{t.allStatuses || 'All Status'}</option>
              <option value="Store">{t.store || 'Store'}</option>
              <option value="Pending">{t.pending || 'Pending'}</option>
              <option value="Handover">{t.handover || 'Handover'}</option>
              <option value="Displaced">{t.displaced || 'Displaced'}</option>
            </select>
          </div>

          {/* Date Range Selector Dropdown */}
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse min-w-[150px]">
            <span className="text-xs font-semibold text-slate-500 shrink-0">{t.datePreset || 'Date Range'}:</span>
            <select
              id="select-date-range-preset"
              value={filters.datePreset || 'All'}
              onChange={e => handleDatePresetChange(e.target.value)}
              className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="All">{t.allDates || 'All Dates'}</option>
              <option value="Today">{t.today || 'Today'}</option>
              <option value="Yesterday">{t.yesterday || 'Yesterday'}</option>
              <option value="Last 7 Days">{t.last7Days || 'Last 7 Days'}</option>
              <option value="This Month">{t.thisMonth || 'This Month'}</option>
              <option value="Last 30 Days">{t.last30Days || 'Last 30 Days'}</option>
              <option value="Custom">{t.customRange || 'Custom Range'}</option>
            </select>
          </div>

          {/* Custom Date Pickers (Shown if Custom is selected or filters expanded) */}
          {(filters.datePreset === 'Custom' || filters.startDate || filters.endDate) && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                title="Start Date"
                value={filters.startDate || ''}
                onChange={e => {
                  setFilters(prev => ({ ...prev, startDate: e.target.value, datePreset: 'Custom' }));
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-medium">{t.to || 'to'}</span>
              <input
                type="date"
                title="End Date"
                value={filters.endDate || ''}
                onChange={e => {
                  setFilters(prev => ({ ...prev, endDate: e.target.value, datePreset: 'Custom' }));
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              />
            </div>
          )}

          {/* Toggle More Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 border rounded-xl text-xs font-medium transition-all ${
              showAdvancedFilters
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t.filters || 'More Filters'}</span>
          </button>

          {/* Reset Filters */}
          {(filters.searchQuery || filters.status !== 'All Status' || filters.category !== 'All Categories' || filters.startDate || filters.endDate || filters.datePreset !== 'All') && (
            <button
              onClick={resetFilters}
              title={t.resetFilters || 'Reset all filters'}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-1 rtl:space-x-reverse text-xs font-medium text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.reset || 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filters Tray */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            {/* Category Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                id="select-items-category"
                value={filters.category}
                onChange={e => {
                  setFilters(prev => ({ ...prev, category: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All Categories">All Categories</option>
                {(settings?.categories && settings.categories.length > 0
                  ? settings.categories.map(c => c.name)
                  : ['Medicine', 'Foods & Perishables', 'Clothing', 'Personal Items', 'Electronics', 'Documents / ID', 'Valuables & Jewelry', 'Keys & Cards', 'Other']
                ).map(catName => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Location Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Storage Location
              </label>
              <select
                id="select-items-location"
                value={filters.storeLocation}
                onChange={e => {
                  setFilters(prev => ({ ...prev, storeLocation: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All Locations">All Locations</option>
                <option value="HK Office">HK Office</option>
                <option value="Safe Box">Safe Box</option>
                <option value="Front Desk Safe">Front Desk Safe</option>
                <option value="Security Office">Security Office</option>
                <option value="Storage Room B">Storage Room B</option>
              </select>
            </div>

            {/* Month Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Month
              </label>
              <select
                id="select-items-month"
                value={filters.month}
                onChange={e => {
                  setFilters(prev => ({ ...prev, month: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            {/* Year Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Year
              </label>
              <select
                id="select-items-year"
                value={filters.year}
                onChange={e => {
                  setFilters(prev => ({ ...prev, year: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedItemIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-slide-down">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {selectedItemIds.length}
            </span>
            <span className="text-xs font-semibold">
              {selectedItemIds.length} {selectedItemIds.length === 1 ? 'item' : 'items'} selected
            </span>
            {selectedItemIds.length < filteredItems.length && (
              <button
                onClick={() => setSelectedItemIds(filteredItems.map(i => i.id))}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium ml-2"
              >
                Select all {filteredItems.length} filtered items
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportSelectedExcel}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl border border-slate-700 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export ({selectedItemIds.length})</span>
            </button>

            {/* Bulk Print Button */}
            {hasPermission('print') && (
              <button
                onClick={() => {
                  const firstSelected = activeItems.find(i => i.id === selectedItemIds[0]);
                  if (firstSelected) openPrint(firstSelected);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl border border-slate-700 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print First</span>
              </button>
            )}

            {/* Bulk Delete Button */}
            {hasPermission('delete') && (
              <button
                id="btn-bulk-delete-selected"
                onClick={() => {
                  setBatchDeleteReason('');
                  setIsPermanentBatchDelete(false);
                  setIsBatchDeleteModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedItemIds.length})</span>
              </button>
            )}

            <button
              title="Clear selection"
              onClick={() => setSelectedItemIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls Top Header */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={10}>10 rows</option>
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
            <span>entries</span>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredItems.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(startIndex + pageSize, filteredItems.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredItems.length}</span> filtered items (Total: {activeItems.length})
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-200 select-none">
                {/* Select All Checkbox */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAllPage}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Serial */}
                <th className="py-3.5 px-3 w-12 text-center">#</th>

                {/* Code Sortable */}
                <th
                  onClick={() => handleSort('code')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <span>{t.itemCode || 'Code'}</span>
                    {renderSortIcon('code')}
                  </div>
                </th>

                {/* Date Found Sortable */}
                <th
                  onClick={() => handleSort('dateFound')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <span>{t.dateFound || 'Date Found'}</span>
                    {renderSortIcon('dateFound')}
                  </div>
                </th>

                {/* Item Name Sortable */}
                <th
                  onClick={() => handleSort('itemName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <span>{t.itemName || 'Item Details'}</span>
                    {renderSortIcon('itemName')}
                  </div>
                </th>

                {/* Location Found Sortable */}
                <th
                  onClick={() => handleSort('locationFound')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <span>{t.locationFound || 'Location'}</span>
                    {renderSortIcon('locationFound')}
                  </div>
                </th>

                {/* Status Sortable */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <span>{t.status || 'Status'}</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* Actions */}
                <th className="py-3.5 px-5 text-right rtl:text-left font-semibold">{t.actions || 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-600">{t.noMatchingRecords || 'No records found'}</div>
                      <p className="text-xs text-slate-400">
                        Try adjusting your search query or removing active status filters.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg mt-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.resetFilters || 'Clear Filters'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const serial = startIndex + index + 1;
                  const isSelected = selectedItemIds.includes(item.id);
                  const isStored = item.status === 'Stored';
                  const isHandedOver = item.status === 'Handed Over';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Serial */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-400">
                        {serial}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        <button
                          onClick={() => openItemDetails(item)}
                          className="hover:underline text-left rtl:text-right"
                        >
                          {item.code}
                        </button>
                      </td>

                      {/* Date Found */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {new Date(item.dateFound).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Item Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div
                          className="font-semibold text-slate-900 truncate capitalize"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {item.itemName}
                        </div>
                      </td>

                      {/* Location Found */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {item.locationFound}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right rtl:text-left whitespace-nowrap">
                        <div className="flex items-center justify-end rtl:justify-start space-x-1 rtl:space-x-reverse">
                          {/* Pending Approval Actions for Admin Tier or authorized staff */}
                          {(item.status === 'Pending Approval' || item.approvalStatus === 'pending') && (isAdminTier || hasPermission('edit')) && (
                            <>
                              <button
                                id={`btn-items-approve-${item.id}`}
                                onClick={async () => {
                                  await approveItem(item.id);
                                }}
                                title="Approve & Move to Stored Inventory"
                                className="flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs mr-1 rtl:mr-0 rtl:ml-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t.approve || 'Approve'}</span>
                              </button>
                              <button
                                id={`btn-items-reject-${item.id}`}
                                onClick={() => setRejectModalItem(item)}
                                title="Reject Submission"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors mr-1 rtl:mr-0 rtl:ml-1 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* QR Code Tag Action */}
                          <button
                            id={`btn-items-qr-${item.id}`}
                            onClick={() => openItemQrModal(item)}
                            title={t.viewPrintQr || 'View, Print & Download QR Tag'}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {hasPermission('view') && (
                            <button
                              id={`btn-items-view-${item.id}`}
                              onClick={() => openItemDetails(item)}
                              title={t.viewDetails || 'View Details'}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('edit') && !isHandedOver && (
                            <button
                              id={`btn-items-edit-${item.id}`}
                              onClick={() => openEditItem(item)}
                              title={t.editItem || 'Edit Item'}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isStored && (
                            <>
                              {hasPermission('handover') && (
                                <button
                                  id={`btn-items-handover-${item.id}`}
                                  onClick={() => openHandover(item)}
                                  title={t.handoverToGuest || 'Handover to Guest'}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <HeartHandshake className="w-4 h-4" />
                                </button>
                              )}

                              {hasPermission('dispatch') && (
                                <button
                                  id={`btn-items-dispatch-${item.id}`}
                                  onClick={() => openDispatch(item)}
                                  title={t.dispatch || 'Dispatch to Finder Staff'}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Box className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {isHandedOver && ((isSuperAdmin && !previewRole) || hasPermission('handover')) && isWithinHandover24Hours(item) && (
                            <button
                              id={`btn-items-return-store-${item.id}`}
                              onClick={() => openReturnToStore(item)}
                              title={t.returnToStore || 'Return to Store (Within 24hr)'}
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('print') && (
                            <button
                              id={`btn-items-print-${item.id}`}
                              onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                              title={t.print || 'Print Document'}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('delete') && !isHandedOver && (
                            <button
                              id={`btn-items-delete-${item.id}`}
                              onClick={() => openDelete(item)}
                              title={t.deleteItem || 'Delete Item'}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Data Table Pagination Controls */}
        <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50/50">
          <div className="font-medium">
            Page <span className="font-bold text-slate-900">{safePage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span> ({sortedItems.length} records)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="btn-prev-page"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Jump Numbers */}
            {(() => {
              const maxButtons = Math.min(5, totalPages);
              const startPage = Math.max(1, Math.min(safePage - 2, totalPages - maxButtons + 1));
              return Array.from({ length: maxButtons }, (_, i) => startPage + i).map(pageNum => (
                <button
                  key={`page-btn-${pageNum}`}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl font-medium text-xs transition-all ${
                    safePage === pageNum
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ));
            })()}

            <button
              id="btn-next-page"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isProcessingBatchDelete) {
              setIsBatchDeleteModalOpen(false);
            }
          }}
        >
          <div
            ref={batchDeleteModalRef}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                Delete {selectedItemIds.length} Selected {selectedItemIds.length === 1 ? 'Item' : 'Items'}?
              </h3>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {isPermanentBatchDelete
                  ? 'Warning: This will permanently remove these records from the system. This action cannot be undone.'
                  : 'Selected records will be moved to Removed Items (retained for 60 days where you can restore or permanently delete them).'}
              </p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Deletion (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared by management, Batch cleanup"
                    value={batchDeleteReason}
                    onChange={e => setBatchDeleteReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                  />
                </div>

                {isAdminTier && (
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isPermanentBatchDelete}
                      onChange={e => setIsPermanentBatchDelete(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-slate-300"
                    />
                    <span className="font-medium text-rose-700">
                      Permanent Deletion (Bypass 60-day recycle bin)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={isProcessingBatchDelete}
                  onClick={() => setIsBatchDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isProcessingBatchDelete}
                  onClick={async () => {
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
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isProcessingBatchDelete
                      ? 'Deleting...'
                      : isPermanentBatchDelete
                      ? `Permanently Delete (${selectedItemIds.length})`
                      : `Move to Trash (${selectedItemIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reject Submission Reason Modal */}
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
