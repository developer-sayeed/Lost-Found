import React from 'react';
import { Truck, X, Download, Search, Filter, RotateCcw } from 'lucide-react';
import { Translations } from '../../../../context/LanguageContext';

interface PendingDispatchTableToolbarProps {
  sortedCount: number;
  selectedItemIds: string[];
  hasDispatchPermission: boolean;
  onOpenBatchDispatch: () => void;
  onClearSelection: () => void;
  onExportCsv: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  uniqueCategories: string[];
  pageSize: number;
  onPageSizeChange: (val: number) => void;
  onResetFilters: () => void;
  translateCategory: (cat?: string) => string;
  t: Translations;
}

export const PendingDispatchTableToolbar: React.FC<PendingDispatchTableToolbarProps> = ({
  sortedCount,
  selectedItemIds,
  hasDispatchPermission,
  onOpenBatchDispatch,
  onClearSelection,
  onExportCsv,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  uniqueCategories,
  pageSize,
  onPageSizeChange,
  onResetFilters,
  translateCategory,
  t
}) => {
  return (
    <>
      {/* Table Top Header */}
      <div className="p-6 border-b border-slate-100 dark:border-fuchsia-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.pendingDispatchTitle || 'Pending Dispatch Records'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/40">
              {sortedCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.pendingDispatchSubtitle || 'Items exceeding or approaching storage retention threshold for finder staff claiming'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Dispatch Trigger Button */}
          {selectedItemIds.length > 0 && hasDispatchPermission && (
            <div className="flex items-center space-x-2 bg-fuchsia-50 dark:bg-fuchsia-950/40 px-3 py-1.5 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800/40 animate-slide-down">
              <span className="text-xs font-bold text-fuchsia-900 dark:text-fuchsia-200">
                {selectedItemIds.length} Selected
              </span>
              <button
                id="btn-batch-dispatch-trigger"
                onClick={onOpenBatchDispatch}
                className="flex items-center space-x-1.5 px-3 py-1 btn-primary-gradient text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Batch Dispatch</span>
              </button>
              <button
                onClick={onClearSelection}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            disabled={sortedCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table Search & Filter Toolbar */}
      <div className="p-4 bg-slate-50/80 dark:bg-[#150a17] border-b border-slate-200/80 dark:border-fuchsia-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search code, item name, staff, category..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-[#120815] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Rows Per Page */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#120815] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 text-slate-800 dark:text-white font-medium cursor-pointer shadow-2xs"
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
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1.5 text-xs bg-white dark:bg-[#120815] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 text-slate-800 dark:text-white font-medium cursor-pointer shadow-2xs"
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
              onClick={onResetFilters}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#251329] rounded-lg transition-colors cursor-pointer"
              title="Reset active search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
