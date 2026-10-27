import React from 'react';
import {
  Boxes,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { LostItem } from '../../../../types';

interface UserItemsHistoryTableProps {
  userSubmittedItems: LostItem[];
  filteredAndSortedItems: LostItem[];
  paginatedItems: LostItem[];
  displayName: string;
  searchFilter: string;
  setSearchFilter: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (s: string) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  currentPageSafe: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  availableCategories: string[];
  storedItemsCount: number;
  itemsPending: number;
  successfulHandovers: number;
  dispatchedItemsCount: number;
  onExportExcel: () => void;
  onSort: (field: keyof LostItem) => void;
  renderSortIcon: (field: keyof LostItem) => React.ReactNode;
  openItemDetails: (item: LostItem) => void;
  openPrint: (item: LostItem, type: 'receipt' | 'report') => void;
}

export const UserItemsHistoryTable: React.FC<UserItemsHistoryTableProps> = ({
  userSubmittedItems,
  filteredAndSortedItems,
  paginatedItems,
  displayName,
  searchFilter,
  setSearchFilter,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  pageSize,
  setPageSize,
  currentPageSafe,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex,
  availableCategories,
  storedItemsCount,
  itemsPending,
  successfulHandovers,
  dispatchedItemsCount,
  onExportExcel,
  onSort,
  renderSortIcon,
  openItemDetails,
  openPrint
}) => {
  return (
    <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-sm overflow-hidden space-y-4">
      {/* Section Header with Actions */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-fuchsia-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50 dark:bg-[#1c0f20]">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-indigo-600 dark:text-fuchsia-400 flex-shrink-0" />
            <span>Deposited Items &amp; Inventory Records ({userSubmittedItems.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive record list for lost &amp; found items found and registered by {displayName}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onExportExcel}
            disabled={filteredAndSortedItems.length === 0}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2.5 sm:py-2 btn-primary-gradient disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Download full item list as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls Toolbar */}
      <div className="px-3.5 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Search Box */}
        <div className="sm:col-span-2 lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, code, location, category..."
            value={searchFilter}
            onChange={e => {
              setSearchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[44px] sm:min-h-0"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-3">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 min-h-[44px] sm:min-h-0"
          >
            <option value="All">All Statuses ({userSubmittedItems.length})</option>
            <option value="Stored">Stored ({storedItemsCount})</option>
            <option value="Pending">Pending Approval / Review ({itemsPending})</option>
            <option value="Handed Over">Handed Over / Claimed ({successfulHandovers})</option>
            <option value="Dispatched">Dispatched / Disposed ({dispatchedItemsCount})</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-3">
          <select
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 min-h-[44px] sm:min-h-0"
          >
            <option value="All">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Page Size Selector */}
        <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-between sm:justify-end space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Show:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-initial px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 min-h-[44px] sm:min-h-0"
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
          </select>
        </div>
      </div>

      {/* Data Items Display */}
      {paginatedItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No items found matching the selected filters</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search term or adjusting status/category filter</p>
          <button
            onClick={() => {
              setSearchFilter('');
              setStatusFilter('All');
              setCategoryFilter('All');
              setCurrentPage(1);
            }}
            className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Touch-Friendly Card View (visible on mobile < md) */}
          <div className="md:hidden divide-y divide-slate-100 px-3.5 sm:px-4">
            {paginatedItems.map((item, index) => {
              const serial = startIndex + index + 1;
              const itemCode = item.code || (item as any).trackingNumber || 'LF-2026';
              const itemStore = item.storeLocation || (item as any).storageLocation || 'HK Office';
              const isHandedOver = item.status === 'Handed Over' || item.status === 'Claimed';
              const statusColors: Record<string, string> = {
                'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                'Pending Claim': 'bg-amber-50 text-amber-700 border-amber-200',
                'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
                'Stored': 'bg-sky-50 text-sky-700 border-sky-200',
                'Registered': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                'Handed Over': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Claimed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Dispatched': 'bg-purple-50 text-purple-700 border-purple-200',
                'Disposed': 'bg-slate-100 text-slate-600 border-slate-200',
                'Archived': 'bg-slate-100 text-slate-600 border-slate-200'
              };

              return (
                <div key={item.id} className="py-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">#{serial}</span>
                      <button
                        type="button"
                        onClick={() => openItemDetails(item)}
                        className="font-mono font-bold text-sm text-indigo-600 hover:text-indigo-800 hover:underline text-left cursor-pointer truncate"
                      >
                        {itemCode}
                      </button>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <p
                      className="font-semibold text-slate-900 text-sm break-words capitalize"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {item.itemName}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 break-words">{item.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Category</span>
                      <span className="font-medium text-slate-700 truncate block">{item.category}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Date Found</span>
                      <span className="font-medium text-slate-700 truncate block">{item.dateFound || (item.createdAt ? item.createdAt.split('T')[0] : 'N/A')}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Location</span>
                      <span className="font-medium text-slate-700 truncate block">{item.locationFound || 'Not specified'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 block">Storage</span>
                      <span className="font-medium text-slate-700 truncate block">{itemStore}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openItemDetails(item)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-indigo-50 active:bg-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 active:bg-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Full Data Table (visible on md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] border-y border-slate-200 select-none">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th
                    onClick={() => onSort('code')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Code / ID</span>
                      {renderSortIcon('code')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('itemName')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Item Details</span>
                      {renderSortIcon('itemName')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('category')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Category</span>
                      {renderSortIcon('category')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('dateFound')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Date Found</span>
                      {renderSortIcon('dateFound')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('locationFound')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Location</span>
                      {renderSortIcon('locationFound')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('storeLocation')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Storage Facility</span>
                      {renderSortIcon('storeLocation')}
                    </div>
                  </th>
                  <th
                    onClick={() => onSort('status')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedItems.map((item, index) => {
                  const serial = startIndex + index + 1;
                  const itemCode = item.code || (item as any).trackingNumber || 'LF-2026';
                  const itemStore = item.storeLocation || (item as any).storageLocation || 'HK Office';
                  const statusColors: Record<string, string> = {
                    'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Pending Claim': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Stored': 'bg-sky-50 text-sky-700 border-sky-200',
                    'Registered': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    'Handed Over': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Claimed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Dispatched': 'bg-purple-50 text-purple-700 border-purple-200',
                    'Disposed': 'bg-slate-100 text-slate-600 border-slate-200',
                    'Archived': 'bg-slate-100 text-slate-600 border-slate-200'
                  };

                  const isHandedOver = item.status === 'Handed Over' || item.status === 'Claimed';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                        {serial}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        <button
                          onClick={() => openItemDetails(item)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {itemCode}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div>
                          <p
                            className="font-semibold text-slate-900 truncate capitalize"
                            style={{ textTransform: 'capitalize' }}
                          >
                            {item.itemName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {item.dateFound || (item.createdAt ? item.createdAt.split('T')[0] : 'N/A')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {item.locationFound}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {itemStore}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openItemDetails(item)}
                            title="View Full Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                            title="Print Item Record"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Data Table Pagination Footer */}
      {filteredAndSortedItems.length > 0 && (
        <div className="px-3.5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="text-center sm:text-left w-full sm:w-auto">
            Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredAndSortedItems.length}</span> items
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPageSafe <= 1}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-2.5 sm:py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="px-2 font-medium text-slate-700 whitespace-nowrap text-center">
              Page {currentPageSafe} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPageSafe >= totalPages}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-2.5 sm:py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
