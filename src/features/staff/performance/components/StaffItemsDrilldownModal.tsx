import React from 'react';
import { X, Search, Eye, Printer } from 'lucide-react';
import { UserAvatar } from '../../../../lib/avatarHelper';
import { Badge } from '../../../../components/Badge';
import { LostItem } from '../../../../types';
import { StaffPerformanceStats, DEPT_COLORS } from '../types/performance.types';

interface StaffItemsDrilldownModalProps {
  inspectingStaff: StaffPerformanceStats | null;
  onClose: () => void;
  drilldownSearch: string;
  setDrilldownSearch: (q: string) => void;
  drilldownStatusFilter: string;
  setDrilldownStatusFilter: (status: string) => void;
  drilldownFilteredItems: LostItem[];
  dateRangeLabel: string;
  onOpenItemDetails: (item: LostItem) => void;
  onPrintStaffAudit: (staff: StaffPerformanceStats) => void;
}

export const StaffItemsDrilldownModal: React.FC<StaffItemsDrilldownModalProps> = ({
  inspectingStaff,
  onClose,
  drilldownSearch,
  setDrilldownSearch,
  drilldownStatusFilter,
  setDrilldownStatusFilter,
  drilldownFilteredItems,
  dateRangeLabel,
  onOpenItemDetails,
  onPrintStaffAudit
}) => {
  if (!inspectingStaff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <UserAvatar
              name={inspectingStaff.staffName}
              avatarUrl={inspectingStaff.avatar}
              sizeClassName="w-10 h-10"
              className="shadow-xs"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{inspectingStaff.staffName}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: DEPT_COLORS[inspectingStaff.department] || '#64748b' }}
                >
                  {inspectingStaff.department}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {inspectingStaff.processedItems.length} items processed in {dateRangeLabel} ({inspectingStaff.itemsLogged} logged, {inspectingStaff.itemsHandedOver} handovers)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Inside Modal */}
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, item name, room..."
              value={drilldownSearch}
              onChange={e => setDrilldownSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-indigo-500"
            />
          </div>

          <select
            value={drilldownStatusFilter}
            onChange={e => setDrilldownStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Stored">Stored</option>
            <option value="Handed Over">Handed Over</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Pending Approval">Pending Approval</option>
          </select>
        </div>

        {/* Modal Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {drilldownFilteredItems.length > 0 ? (
            drilldownFilteredItems.map(item => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {item.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.itemName}
                    </h4>
                    <Badge status={item.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                    <span>Category: <strong className="text-slate-700">{item.category}</strong></span>
                    <span>Location: <strong className="text-slate-700">{item.locationFound || 'Hotel'}</strong></span>
                    <span>Date: <strong>{item.dateFound || item.createdAt.split('T')[0]}</strong></span>
                    {item.handoverDetails?.receiverName && (
                      <span className="text-emerald-700">Receiver: <strong>{item.handoverDetails.receiverName}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenItemDetails(item)}
                  className="shrink-0 flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No items matched your search criteria for this staff member.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {drilldownFilteredItems.length} of {inspectingStaff.processedItems.length} records
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onPrintStaffAudit(inspectingStaff)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 border border-indigo-200"
              title="Print this staff member's official performance audit record"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Print Staff Audit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
