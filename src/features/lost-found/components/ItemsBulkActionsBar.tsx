import React from 'react';
import { Download, Printer, Trash2, X } from 'lucide-react';

interface ItemsBulkActionsBarProps {
  selectedItemIds: string[];
  totalFilteredCount: number;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onExportSelectedExcel: () => void;
  hasPrintPermission: boolean;
  onBulkPrintFirst: () => void;
  hasDeletePermission: boolean;
  onOpenBatchDelete: () => void;
}

export const ItemsBulkActionsBar: React.FC<ItemsBulkActionsBarProps> = ({
  selectedItemIds,
  totalFilteredCount,
  onSelectAllFiltered,
  onClearSelection,
  onExportSelectedExcel,
  hasPrintPermission,
  onBulkPrintFirst,
  hasDeletePermission,
  onOpenBatchDelete
}) => {
  if (selectedItemIds.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-slide-down">
      <div className="flex items-center space-x-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {selectedItemIds.length}
        </span>
        <span className="text-xs font-semibold">
          {selectedItemIds.length} {selectedItemIds.length === 1 ? 'item' : 'items'} selected
        </span>
        {selectedItemIds.length < totalFilteredCount && (
          <button
            onClick={onSelectAllFiltered}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium ml-2 cursor-pointer"
          >
            Select all {totalFilteredCount} filtered items
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onExportSelectedExcel}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl border border-slate-700 transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export ({selectedItemIds.length})</span>
        </button>

        {/* Bulk Print Button */}
        {hasPrintPermission && (
          <button
            onClick={onBulkPrintFirst}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl border border-slate-700 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print First</span>
          </button>
        )}

        {/* Bulk Delete Button */}
        {hasDeletePermission && (
          <button
            id="btn-bulk-delete-selected"
            onClick={onOpenBatchDelete}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedItemIds.length})</span>
          </button>
        )}

        <button
          title="Clear selection"
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
