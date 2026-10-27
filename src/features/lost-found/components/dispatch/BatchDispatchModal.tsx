import React from 'react';
import { Truck, X } from 'lucide-react';
import { LostItem } from '../../../../types';

interface BatchDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalRef: React.RefObject<HTMLDivElement | null>;
  isSubmittingBatch: boolean;
  onConfirmBatchDispatch: (e: React.FormEvent) => Promise<void>;
  selectedItemIds: string[];
  selectedItemsList: LostItem[];
  courierName: string;
  setCourierName: (val: string) => void;
  trackingNumber: string;
  setTrackingNumber: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  dispatchedTo: string;
  setDispatchedTo: (val: string) => void;
  batchNotes: string;
  setBatchNotes: (val: string) => void;
}

export const BatchDispatchModal: React.FC<BatchDispatchModalProps> = ({
  isOpen,
  onClose,
  modalRef,
  isSubmittingBatch,
  onConfirmBatchDispatch,
  selectedItemIds,
  selectedItemsList,
  courierName,
  setCourierName,
  trackingNumber,
  setTrackingNumber,
  destination,
  setDestination,
  dispatchedTo,
  setDispatchedTo,
  batchNotes,
  setBatchNotes
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !isSubmittingBatch) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#180F1A] rounded-3xl border border-slate-100 dark:border-fuchsia-900/30 shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up"
      >
        <div className="p-6 border-b border-slate-100 dark:border-fuchsia-900/30 flex items-center justify-between bg-fuchsia-50/50 dark:bg-fuchsia-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl btn-primary-gradient text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Batch Dispatch ({selectedItemIds.length} Items)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Process and dispatch selected items in a single workflow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#251329] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onConfirmBatchDispatch} noValidate className="p-6 space-y-4">
          {/* Selected Items preview chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Selected Items ({selectedItemsList.length})
            </label>
            <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-[#120815] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 flex flex-wrap gap-1.5">
              {selectedItemsList.map(item => (
                <span
                  key={item.id}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-[#1c0f20] border border-slate-200 dark:border-fuchsia-900/40 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  <span className="font-mono text-fuchsia-600 dark:text-fuchsia-400 font-bold">{item.code}:</span>
                  <span className="max-w-[120px] truncate">{item.itemName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    ({item.employeeName || 'Staff'})
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispatch Method / Authorization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Internal Staff Release, Hotel Staff Handover"
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Reference / Auth # *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DSP-20260829-001"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination / Department
              </label>
              <input
                type="text"
                placeholder="e.g. Housekeeping Staff Room, Main Reception"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispatched To (Receiver / Staff)
              </label>
              <input
                type="text"
                placeholder="Defaults to respective finder employees"
                value={dispatchedTo}
                onChange={e => setDispatchedTo(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dispatch Notes & Authorization Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Additional dispatch remarks or handover notes..."
              value={batchNotes}
              onChange={e => setBatchNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-800 dark:text-white resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-fuchsia-900/30">
            <button
              type="button"
              disabled={isSubmittingBatch}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingBatch}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white btn-primary-gradient rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isSubmittingBatch
                  ? 'Processing Batch Dispatch...'
                  : `Confirm Dispatch (${selectedItemIds.length} Items)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
