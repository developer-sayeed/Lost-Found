import React, { useState } from 'react';
import { X, Box, Truck, UserCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';

export const DispatchModal: React.FC = () => {
  const { isDispatchModalOpen, setIsDispatchModalOpen, selectedItem, dispatchItem } = useApp();
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsDispatchModalOpen(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isDispatchModalOpen && !!selectedItem,
    closeOnEsc: true
  });

  if (!isDispatchModalOpen || !selectedItem) return null;

  const finderName = selectedItem.employeeName || selectedItem.submittedByStaffName || 'Finder Staff';

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatchItem(selectedItem.id, {
        courierName: 'Internal Staff Dispatch',
        trackingNumber: `DSP-${selectedItem.code}`,
        destination: `Handed over to Finder Staff (${finderName})`,
        dispatchedTo: finderName,
        notes: dispatchNotes || `Dispatched & released to finder staff: ${finderName}`
      } as any);
      setIsDispatchModalOpen(false);
      setDispatchNotes('');
    } catch (e: any) {
      console.error(e);
      toast.error(`❌ Dispatch failed: ${e?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Dispatch to Finder Staff
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Item Tag: {selectedItem.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDispatchModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleDispatch} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div
              className="font-bold text-slate-900 text-sm capitalize"
              style={{ textTransform: 'capitalize' }}
            >
              {selectedItem.itemName || selectedItem.description}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div className="text-slate-500">Category: <span className="font-semibold text-slate-800">{selectedItem.category}</span></div>
              <div className="text-slate-500">Room: <span className="font-semibold text-slate-800">{selectedItem.roomNumber || 'Public Area'}</span></div>
              <div className="text-slate-500">Location: <span className="font-semibold text-slate-800">{selectedItem.storeLocation}</span></div>
              <div className="text-slate-500">Found Date: <span className="font-semibold text-slate-800">{new Date(selectedItem.dateFound).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            </div>
          </div>

          {/* Finder Staff Designation Banner */}
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center space-x-3 text-xs">
            <UserCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-purple-900 block">Dispatching to Finder Staff</span>
              <span className="text-purple-700 text-[11px]">
                Item will be officially released and credited to <strong>{finderName}</strong>.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Dispatch Remarks & Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Unclaimed retention expired, handed over to finder employee in good condition."
              value={dispatchNotes}
              onChange={e => setDispatchNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              id="btn-dispatch-cancel"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-dispatch-confirm"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : `Confirm Dispatch to ${finderName.split(' ')[0]}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
