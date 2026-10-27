import React from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
  Truck,
  CheckCircle2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { LostItem } from '../../../../types';
import { DispatchSortField, ItemWithDiff } from '../../types/dispatch.feature.types';
import { Translations } from '../../../../context/LanguageContext';

interface PendingDispatchTableProps {
  paginatedItems: ItemWithDiff[];
  startIndex: number;
  selectedItemIds: string[];
  isAllCurrentPageSelected: boolean;
  onToggleSelectAllCurrentPage: () => void;
  onToggleSelect: (id: string) => void;
  sortField: DispatchSortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: DispatchSortField) => void;
  formatDate: (dateStr?: string) => string;
  translateCategory: (cat?: string) => string;
  hasDispatchPermission: boolean;
  openItemDetails: (item: LostItem) => void;
  openDispatch: (item: LostItem) => void;
  searchQuery: string;
  selectedCategory: string;
  onResetFilters: () => void;
  t: Translations;
}

export const PendingDispatchTable: React.FC<PendingDispatchTableProps> = ({
  paginatedItems,
  startIndex,
  selectedItemIds,
  isAllCurrentPageSelected,
  onToggleSelectAllCurrentPage,
  onToggleSelect,
  sortField,
  sortDirection,
  onSort,
  formatDate,
  translateCategory,
  hasDispatchPermission,
  openItemDetails,
  openDispatch,
  searchQuery,
  selectedCategory,
  onResetFilters,
  t
}) => {
  const renderSortHeader = (field: DispatchSortField, label: string) => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
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

  if (paginatedItems.length === 0) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <p className="font-bold text-slate-800 dark:text-white text-sm">
          {searchQuery || selectedCategory !== 'all'
            ? 'No records match your search or filter'
            : t.noPendingDispatch || 'No items in this dispatch category'}
        </p>
        <p className="text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          {searchQuery || selectedCategory !== 'all'
            ? 'Try clearing the search query or category filter to view all pending dispatches.'
            : t.allRetentionInCompliance || 'All retention and storage schedules are currently in compliance.'}
        </p>
        {(searchQuery || selectedCategory !== 'all') && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-fuchsia-950/40 hover:bg-indigo-100 dark:hover:bg-fuchsia-900/40 text-indigo-700 dark:text-fuchsia-300 border border-transparent dark:border-fuchsia-800/30 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-[#200f24] border-b border-slate-200 dark:border-fuchsia-900/40 text-slate-600 dark:text-fuchsia-300 font-semibold text-[11px] uppercase tracking-wider select-none">
          <tr>
            {/* Select All Checkbox */}
            <th className="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                id="checkbox-select-all-dispatch"
                checked={isAllCurrentPageSelected}
                onChange={onToggleSelectAllCurrentPage}
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

            {/* Date Found */}
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

            {/* Found By */}
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
            <th className="py-3 px-4 text-right whitespace-nowrap">
              {t.actions || 'Action'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#180F1A]">
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
                  isSelected ? 'bg-fuchsia-50/70 dark:bg-fuchsia-950/40' : 'hover:bg-slate-50/80 dark:hover:bg-fuchsia-950/20'
                }`}
              >
                {/* Checkbox */}
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="rounded border-slate-300 dark:border-slate-700 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer accent-fuchsia-600"
                  />
                </td>

                {/* Serial Number */}
                <td className="py-3 px-2.5 text-center font-mono text-[11px] text-slate-400 font-semibold">
                  {serialNumber}
                </td>

                {/* Code */}
                <td className="py-3 px-3 font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openItemDetails(item)}
                    className="hover:underline text-left cursor-pointer"
                    title="View Item Details"
                  >
                    {item.code}
                  </button>
                </td>

                {/* Date Found */}
                <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                  {item.dateFound ? (
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatDate(item.dateFound)}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Item Name */}
                <td
                  className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate capitalize"
                  style={{ textTransform: 'capitalize' }}
                >
                  {item.itemName}
                </td>

                {/* Category */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {translateCategory(item.category)}
                  </span>
                </td>

                {/* Found By */}
                <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                  {item.employeeName || 'Staff'}
                </td>

                {/* Deadline */}
                <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {item.dispatchDeadline ? formatDate(item.dispatchDeadline) : t.immediate || 'Immediate'}
                </td>

                {/* Urgency */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                      isOverdue
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : isDueToday
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800'
                    }`}
                  >
                    {isOverdue ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>
                          {t.overdue || 'Overdue'} ({Math.abs(diffDays)}d)
                        </span>
                      </>
                    ) : isDueToday ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{t.dueToday || 'Due Today'}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-fuchsia-600 dark:text-fuchsia-400" />
                        <span>
                          {diffDays} {t.daysRemaining || 'days left'}
                        </span>
                      </>
                    )}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => openItemDetails(item)}
                      title={t.viewDetails || 'View Details'}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {hasDispatchPermission && (
                      <button
                        id={`btn-dispatch-action-${item.id}`}
                        type="button"
                        onClick={() => openDispatch(item)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
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
    </div>
  );
};
