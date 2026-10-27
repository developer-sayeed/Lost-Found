import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PendingDispatchPaginationProps {
  startIndex: number;
  endIndex: number;
  totalSortedCount: number;
  filteredCount: number;
  baseCategoryCount: number;
  currentPage: number;
  totalPages: number;
  safePage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const PendingDispatchPagination: React.FC<PendingDispatchPaginationProps> = ({
  startIndex,
  endIndex,
  totalSortedCount,
  filteredCount,
  baseCategoryCount,
  currentPage,
  totalPages,
  safePage,
  setCurrentPage
}) => {
  if (totalSortedCount === 0) return null;

  return (
    <div className="px-5 py-4 border-t border-slate-200 dark:border-fuchsia-900/30 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-[#180F1A]">
      {/* Showing entries info */}
      <div className="font-medium">
        Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
        <span className="font-bold text-slate-900 dark:text-white">{endIndex}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-white">{totalSortedCount}</span> entries
        {filteredCount !== baseCategoryCount && (
          <span className="text-slate-400 dark:text-slate-500 ml-1">
            (filtered from {baseCategoryCount} total)
          </span>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={safePage === 1}
          className="p-1.5 border border-slate-200 dark:border-fuchsia-900/40 rounded-lg bg-white dark:bg-[#120815] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#251329] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="p-1.5 border border-slate-200 dark:border-fuchsia-900/40 rounded-lg bg-white dark:bg-[#120815] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#251329] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
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
                        ? 'btn-primary-gradient text-white font-bold shadow-xs'
                        : 'bg-white dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329]'
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
          className="p-1.5 border border-slate-200 dark:border-fuchsia-900/40 rounded-lg bg-white dark:bg-[#120815] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#251329] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          disabled={safePage === totalPages}
          className="p-1.5 border border-slate-200 dark:border-fuchsia-900/40 rounded-lg bg-white dark:bg-[#120815] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#251329] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
