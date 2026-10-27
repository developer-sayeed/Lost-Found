import React from 'react';
import {
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  QrCode,
  Eye,
  Edit2,
  HeartHandshake,
  Box,
  Printer,
  Trash2
} from 'lucide-react';
import { LostItem } from '../../../types';
import { SortField, SortDirection } from '../types/items.feature.types';
import { Badge } from '../../../components/Badge';
import { isWithinHandover24Hours } from '../../../lib/handoverUtils';
import { Translations } from '../../../context/LanguageContext';

interface ItemsTableProps {
  paginatedItems: LostItem[];
  startIndex: number;
  selectedItemIds: string[];
  isAllPageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectItem: (id: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  renderSortIcon: (field: SortField) => React.ReactNode;
  t: Translations;
  isAdminTier: boolean;
  isSuperAdmin: boolean;
  previewRole: string | null;
  hasPermission: (p: any) => boolean;
  onApproveItem: (id: string) => Promise<void>;
  onOpenRejectModal: (item: LostItem) => void;
  onOpenItemQrModal: (item: LostItem) => void;
  onOpenItemDetails: (item: LostItem) => void;
  onOpenEditItem: (item: LostItem) => void;
  onOpenHandover: (item: LostItem) => void;
  onOpenDispatch: (item: LostItem) => void;
  onOpenReturnToStore: (item: LostItem) => void;
  onOpenPrint: (item: LostItem, type?: 'receipt' | 'report') => void;
  onOpenDelete: (item: LostItem) => void;
  onResetFilters: () => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  paginatedItems,
  startIndex,
  selectedItemIds,
  isAllPageSelected,
  onToggleSelectAllPage,
  onToggleSelectItem,
  sortField,
  sortDirection,
  onSort,
  renderSortIcon,
  t,
  isAdminTier,
  isSuperAdmin,
  previewRole,
  hasPermission,
  onApproveItem,
  onOpenRejectModal,
  onOpenItemQrModal,
  onOpenItemDetails,
  onOpenEditItem,
  onOpenHandover,
  onOpenDispatch,
  onOpenReturnToStore,
  onOpenPrint,
  onOpenDelete,
  onResetFilters
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-[#200f24] text-slate-600 dark:text-fuchsia-300 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-200 dark:border-fuchsia-900/30 select-none">
            {/* Select All Checkbox */}
            <th className="py-3.5 px-4 w-10 text-center">
              <button
                onClick={onToggleSelectAllPage}
                className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {isAllPageSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>

            {/* Serial */}
            <th className="py-3.5 px-3 w-12 text-center">#</th>

            {/* Code Sortable */}
            <th
              onClick={() => onSort('code')}
              className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors group"
            >
              <div className="flex items-center">
                <span>{t.itemCode || 'Code'}</span>
                {renderSortIcon('code')}
              </div>
            </th>

            {/* Date Found Sortable */}
            <th
              onClick={() => onSort('dateFound')}
              className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors group"
            >
              <div className="flex items-center">
                <span>{t.dateFound || 'Date Found'}</span>
                {renderSortIcon('dateFound')}
              </div>
            </th>

            {/* Item Name Sortable */}
            <th
              onClick={() => onSort('itemName')}
              className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors group"
            >
              <div className="flex items-center">
                <span>{t.itemName || 'Item Details'}</span>
                {renderSortIcon('itemName')}
              </div>
            </th>

            {/* Location Found Sortable */}
            <th
              onClick={() => onSort('locationFound')}
              className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors group"
            >
              <div className="flex items-center">
                <span>{t.locationFound || 'Location'}</span>
                {renderSortIcon('locationFound')}
              </div>
            </th>

            {/* Status Sortable */}
            <th
              onClick={() => onSort('status')}
              className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors group"
            >
              <div className="flex items-center">
                <span>{t.status || 'Status'}</span>
                {renderSortIcon('status')}
              </div>
            </th>

            {/* Actions */}
            <th className="py-3.5 px-5 text-right font-semibold">{t.actions || 'Actions'}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-fuchsia-900/20 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#180F1A]">
          {paginatedItems.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-16 text-slate-400">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {t.noMatchingRecords || 'No records found'}
                  </div>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search query or removing active status filters.
                  </p>
                  <button
                    onClick={onResetFilters}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl mt-2 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                    <span>{t.resetFilters || 'Clear Filters'}</span>
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            paginatedItems.map((item, index) => {
              const serial = startIndex + index + 1;
              const isSelected = selectedItemIds.includes(item.id);
              const isStored = item.status === 'Stored';
              const isHandedOver = item.status === 'Handed Over';

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-fuchsia-50/70 dark:bg-fuchsia-950/40' : 'hover:bg-slate-50/80 dark:hover:bg-fuchsia-950/20'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onToggleSelectItem(item.id)}
                      className="text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Serial */}
                  <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-400 font-semibold">
                    {serial}
                  </td>

                  {/* Code */}
                  <td className="py-3.5 px-4 font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 whitespace-nowrap">
                    <button
                      onClick={() => onOpenItemDetails(item)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {item.code}
                    </button>
                  </td>

                  {/* Date Found */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {new Date(item.dateFound).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Item Details */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div
                      className="font-semibold text-slate-900 dark:text-white truncate capitalize"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {item.itemName}
                    </div>
                  </td>

                  {/* Location Found */}
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.locationFound}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge status={item.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Pending Approval Actions */}
                      {(item.status === 'Pending Approval' || item.approvalStatus === 'pending') && (isAdminTier || hasPermission('edit')) && (
                        <>
                          <button
                            id={`btn-items-approve-${item.id}`}
                            onClick={async () => {
                              await onApproveItem(item.id);
                            }}
                            title="Approve &amp; Move to Stored Inventory"
                            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs mr-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.approve || 'Approve'}</span>
                          </button>
                          <button
                            id={`btn-items-reject-${item.id}`}
                            onClick={() => onOpenRejectModal(item)}
                            title="Reject Submission"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors mr-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* QR Code Tag Action */}
                      <button
                        id={`btn-items-qr-${item.id}`}
                        onClick={() => onOpenItemQrModal(item)}
                        title={t.viewPrintQr || 'View, Print & Download QR Tag'}
                        className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {hasPermission('view') && (
                        <button
                          id={`btn-items-view-${item.id}`}
                          onClick={() => onOpenItemDetails(item)}
                          title={t.viewDetails || 'View Details'}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('edit') && !isHandedOver && (
                        <button
                          id={`btn-items-edit-${item.id}`}
                          onClick={() => onOpenEditItem(item)}
                          title={t.editItem || 'Edit Item'}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {isStored && (
                        <>
                          {hasPermission('handover') && (
                            <button
                              id={`btn-items-handover-${item.id}`}
                              onClick={() => onOpenHandover(item)}
                              title={t.handoverToGuest || 'Handover to Guest'}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('dispatch') && (
                            <button
                              id={`btn-items-dispatch-${item.id}`}
                              onClick={() => onOpenDispatch(item)}
                              title={t.dispatch || 'Dispatch to Finder Staff'}
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Box className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {isHandedOver && ((isSuperAdmin && !previewRole) || hasPermission('handover')) && isWithinHandover24Hours(item) && (
                        <button
                          id={`btn-items-return-store-${item.id}`}
                          onClick={() => onOpenReturnToStore(item)}
                          title={t.returnToStore || 'Return to Store (Within 24hr)'}
                          className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('print') && (
                        <button
                          id={`btn-items-print-${item.id}`}
                          onClick={() => onOpenPrint(item, isHandedOver ? 'receipt' : 'report')}
                          title={t.print || 'Print Document'}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('delete') && !isHandedOver && (
                        <button
                          id={`btn-items-delete-${item.id}`}
                          onClick={() => onOpenDelete(item)}
                          title={t.deleteItem || 'Delete Item'}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
