import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ItemsPaginationProps {
  pageSize: number;
  setPageSize: (size: number) => void;
  safePage: number;
  totalPages: number;
  totalFilteredCount: number;
  totalActiveCount: number;
  startIndex: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const ItemsPagination: React.FC<ItemsPaginationProps> = ({
  pageSize,
  setPageSize,
  safePage,
  totalPages,
  totalFilteredCount,
  totalActiveCount,
  startIndex,
  setCurrentPage
}) => {
  return (
    <>
      {/* Top Table Summary */}
      <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
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
          Showing <span className="font-semibold text-slate-800">{totalFilteredCount === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min(startIndex + pageSize, totalFilteredCount)}
          </span>{' '}
          of <span className="font-semibold text-slate-800">{totalFilteredCount}</span> filtered items (Total: {totalActiveCount})
        </div>
      </div>
    </>
  );
};

interface ItemsPaginationFooterProps {
  safePage: number;
  totalPages: number;
  sortedItemsCount: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const ItemsPaginationFooter: React.FC<ItemsPaginationFooterProps> = ({
  safePage,
  totalPages,
  sortedItemsCount,
  setCurrentPage
}) => {
  return (
    <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-[#180F1A]">
      <div className="font-medium">
        Page <span className="font-bold text-slate-900 dark:text-white">{safePage}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({sortedItemsCount} records)
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          id="btn-prev-page"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
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
              className={`w-8 h-8 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                safePage === pageNum
                  ? 'btn-primary-gradient text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-600'
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
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
