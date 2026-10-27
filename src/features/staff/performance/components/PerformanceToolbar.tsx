import React from 'react';
import { TrendingUp, Download, Printer } from 'lucide-react';
import { DateRangeFilter } from '../types/performance.types';

interface PerformanceToolbarProps {
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  dateRangeLabel: string;
  onExportExcel: () => void;
  onPrintReport: () => void;
}

export const PerformanceToolbar: React.FC<PerformanceToolbarProps> = ({
  dateRange,
  setDateRange,
  dateRangeLabel,
  onExportExcel,
  onPrintReport
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>Staff Processing Performance</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Supervisor Dashboard
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Staff throughput, items logged, guest returns, and department efficiency metrics over the {(dateRangeLabel || '').toLowerCase()}.
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selector & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Time Range Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          {(['last7', 'last14', 'last30', 'last90'] as DateRangeFilter[]).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                dateRange === range
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === 'last7' ? '7D' : range === 'last14' ? '14D' : range === 'last30' ? '30D' : '90D'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onExportExcel}
          id="btn-export-performance-excel"
          className="flex items-center space-x-1.5 px-3.5 py-2 btn-primary-gradient text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          title="Export Excel Worksheet"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Export Excel</span>
        </button>

        <button
          type="button"
          onClick={onPrintReport}
          id="btn-print-performance-report"
          className="flex items-center space-x-1.5 px-3.5 py-2 btn-primary-gradient text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer group"
          title="Print Official Performance Audit Report"
        >
          <Printer className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Print Report</span>
        </button>
      </div>
    </div>
  );
};
