import React from 'react';
import {
  Trash2,
  Package,
  Clock,
  User,
  ArrowUpDown,
  CheckSquare,
  Square,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LostItem } from '../../../../types';

interface RemovedItemsTableProps {
  paginatedItems: LostItem[];
  filteredAndSortedCount: number;
  selectedIds: string[];
  canManageTrash: boolean;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onSort: (field: 'deletedAt' | 'daysLeft' | 'code' | 'itemName') => void;
  calculateDaysRemaining: (deletedAt?: string) => number;
  openItemDetails: (item: LostItem) => void;
  onOpenSingleRestoreModal: (item: LostItem) => void;
  onOpenSinglePermanentDeleteModal: (item: LostItem) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  searchQuery: string;
  categoryFilter: string;
  onResetFilters: () => void;
}

export const RemovedItemsTable: React.FC<RemovedItemsTableProps> = ({
  paginatedItems,
  filteredAndSortedCount,
  selectedIds,
  canManageTrash,
  onSelectAll,
  onToggleSelect,
  onSort,
  calculateDaysRemaining,
  openItemDetails,
  onOpenSingleRestoreModal,
  onOpenSinglePermanentDeleteModal,
  currentPage,
  pageSize,
  totalPages,
  setCurrentPage,
  searchQuery,
  categoryFilter,
  onResetFilters
}) => {
  if (filteredAndSortedCount === 0) {
    return (
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs overflow-hidden">
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-[#200f24] border border-slate-200 dark:border-fuchsia-900/40 flex items-center justify-center text-slate-400 dark:text-fuchsia-400">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">No Removed Items Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {searchQuery || categoryFilter !== 'All'
                ? 'No items match your active search filter criteria.'
                : 'Recycle bin is clean. Deleted items are stored here for 60 days before auto-purge.'}
            </p>
          </div>
          {(searchQuery || categoryFilter !== 'All') && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 px-4 py-2 bg-indigo-50 dark:bg-fuchsia-950/40 hover:bg-indigo-100 dark:hover:bg-fuchsia-900/40 text-indigo-700 dark:text-fuchsia-300 text-xs font-semibold rounded-xl transition-colors border border-transparent dark:border-fuchsia-800/30 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-[#200f24] border-b border-slate-200 dark:border-fuchsia-900/40 text-slate-600 dark:text-fuchsia-300 uppercase tracking-wider text-[10px] font-bold select-none">
              {canManageTrash && (
                <th className="p-3.5 pl-4 w-10">
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center cursor-pointer"
                    title="Select All"
                  >
                    {selectedIds.length === paginatedItems.length && paginatedItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
              <th
                onClick={() => onSort('code')}
                className="p-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-fuchsia-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Item Code &amp; Info</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Category &amp; Location</th>
              <th
                onClick={() => onSort('deletedAt')}
                className="p-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-fuchsia-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Removed On &amp; By</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Deletion Reason</th>
              <th
                onClick={() => onSort('daysLeft')}
                className="p-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-fuchsia-300 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Auto-Purge In</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-fuchsia-900/20 bg-white dark:bg-[#180F1A]">
            {paginatedItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              const daysLeft = calculateDaysRemaining(item.deletedAt);
              const deletedDate = item.deletedAt
                ? new Date(item.deletedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Unknown';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-[#221028] transition-colors ${
                    isSelected ? 'bg-indigo-50/40 dark:bg-fuchsia-950/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  {canManageTrash && (
                    <td className="p-3.5 pl-4">
                      <button
                        type="button"
                        onClick={() => onToggleSelect(item.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}

                  {/* Code & Item Name */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-fuchsia-900/40 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#251329] text-slate-500 dark:text-fuchsia-300 border border-slate-200 dark:border-fuchsia-900/40 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {item.code}
                        </span>
                        <span
                          className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate block max-w-xs capitalize"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {item.itemName || item.description}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category & Location */}
                  <td className="p-3.5">
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-fuchsia-950/40 text-indigo-700 dark:text-fuchsia-300 border border-indigo-100 dark:border-fuchsia-800/40">
                        {item.category}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Found: {item.locationFound}
                      </p>
                    </div>
                  </td>

                  {/* Removed On & By */}
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
                        <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{deletedDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>
                          {item.deletedBy || 'Staff'}{' '}
                          {item.deletedByRole ? `(${item.deletedByRole})` : ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Deletion Reason */}
                  <td className="p-3.5">
                    <span className="text-slate-600 dark:text-slate-300 text-xs italic bg-slate-50 dark:bg-[#200f24] px-2 py-1 rounded-lg border border-slate-200 dark:border-fuchsia-900/30 block max-w-xs truncate">
                      &quot;{item.deletionReason || 'Moved to trash'}&quot;
                    </span>
                  </td>

                  {/* Auto-Purge Remaining Badge */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        daysLeft > 30
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          : daysLeft > 10
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 animate-pulse'
                      }`}
                    >
                      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="View Full Item Details"
                        onClick={() => openItemDetails(item)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-fuchsia-300 hover:bg-indigo-50 dark:hover:bg-[#251329] rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="Restore Item to Inventory"
                        onClick={() => onOpenSingleRestoreModal(item)}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      {canManageTrash && (
                        <button
                          type="button"
                          title="Permanently Delete Item"
                          onClick={() => onOpenSinglePermanentDeleteModal(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Pagination Footer */}
      {filteredAndSortedCount > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-fuchsia-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-[#180F1A]">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredAndSortedCount)}
            </span>{' '}
            of <span className="font-semibold text-slate-900 dark:text-white">{filteredAndSortedCount}</span> removed records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#251329] rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#251329] rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
