import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { getPageNumbers } from '../utils/auditLogBadgeHelper';

interface AuditLogPaginationProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (num: number) => void;
  filteredLogsCount: number;
}

export const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  filteredLogsCount
}) => {
  if (filteredLogsCount === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs text-slate-600">
      {/* Left side: Range stats and Rows-per-page selector */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
        <span className="font-medium text-slate-600">
          Showing <strong className="text-slate-900 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
          <strong className="text-slate-900 font-mono">
            {Math.min(currentPage * itemsPerPage, filteredLogsCount)}
          </strong>{' '}
          of <strong className="text-slate-900 font-mono">{filteredLogsCount}</strong> records
        </span>

        <span className="hidden sm:inline text-slate-300">•</span>

        <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
          <span className="text-slate-400 text-[11px] font-medium">Per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center justify-center space-x-1.5 w-full sm:w-auto">
        {/* First Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer font-semibold min-h-[34px]"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Prev</span>
        </button>

        {/* Page Number Pills */}
        <div className="flex items-center space-x-1">
          {getPageNumbers(currentPage, totalPages).map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs select-none">
                  …
                </span>
              );
            }
            const num = Number(pageNum);
            const isActive = num === currentPage;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-mono'
                    : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer font-semibold min-h-[34px]"
          title="Next Page"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline text-xs">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
