import React from 'react';
import { Search, RotateCcw, Trash2 } from 'lucide-react';

interface RemovedItemsToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categories: string[];
  pageSize: number;
  setPageSize: (val: number) => void;
  setCurrentPage: (page: number) => void;
  selectedIds: string[];
  canManageTrash: boolean;
  onOpenBatchRestoreModal: () => void;
  onOpenBatchDeleteModal: () => void;
  onClearSelection: () => void;
}

export const RemovedItemsToolbar: React.FC<RemovedItemsToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categories,
  pageSize,
  setPageSize,
  setCurrentPage,
  selectedIds,
  canManageTrash,
  onOpenBatchRestoreModal,
  onOpenBatchDeleteModal,
  onClearSelection
}) => {
  return (
    <>
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category & Display Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 cursor-pointer"
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
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Show:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 cursor-pointer"
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
        <div className="bg-indigo-50 dark:bg-[#200f24] border border-indigo-200 dark:border-fuchsia-900/40 rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-fuchsia-600 text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-fuchsia-200">
              {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-batch-restore"
              onClick={onOpenBatchRestoreModal}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Selected ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              id="btn-batch-delete"
              onClick={onOpenBatchDeleteModal}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Permanently Delete ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={onClearSelection}
              className="px-3 py-1.5 bg-white dark:bg-[#180F1A] hover:bg-slate-100 dark:hover:bg-[#251329] text-slate-600 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-fuchsia-900/30 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}
    </>
  );
};
