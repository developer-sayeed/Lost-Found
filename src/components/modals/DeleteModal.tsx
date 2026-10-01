import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';

export const DeleteModal: React.FC = () => {
  const { isDeleteModalOpen, setIsDeleteModalOpen, selectedItem, deleteItem } = useApp();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('Duplicate or mistaken entry');
  const [customReason, setCustomReason] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsDeleteModalOpen(false);
    setCustomReason('');
    setIsPermanent(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isDeleteModalOpen && !!selectedItem,
    closeOnEsc: true
  });

  if (!isDeleteModalOpen || !selectedItem) return null;

  const isSuperAdminOrAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const finalReason = reason === 'Other' ? (customReason.trim() || 'Other reason') : reason;
      await deleteItem(selectedItem.id, {
        permanent: isPermanent,
        reason: finalReason
      });
      setIsDeleteModalOpen(false);
      setCustomReason('');
      setIsPermanent(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`❌ Failed to delete item: ${e?.message || 'Server error'}`);
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
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isPermanent ? 'Permanently Delete Item' : 'Remove Item'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Item Code: {selectedItem.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900 text-sm">
              {selectedItem.itemName || selectedItem.description}
            </div>
            <div className="text-slate-500">
              Category: {selectedItem.category} • Found at: {selectedItem.locationFound}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Reason for Removal:
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Duplicate or mistaken entry">Duplicate or mistaken entry</option>
              <option value="Wrongly cataloged / corrected elsewhere">Wrongly cataloged / corrected elsewhere</option>
              <option value="Damaged or disposed off-record">Damaged or disposed off-record</option>
              <option value="Direct handover completed outside app">Direct handover completed outside app</option>
              <option value="Other">Other (Specify below)</option>
            </select>

            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Enter specific removal reason..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          {/* 60-day retention notice vs Permanent delete warning */}
          {!isPermanent ? (
            <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                This item will be moved to <strong>Removed Items</strong> and safely retained for <strong>60 days</strong> before automatic permanent deletion. You can restore it anytime.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] font-medium">
                <strong>Warning:</strong> Permanent deletion bypasses the 60-day recycle bin and immediately erases this record completely.
              </p>
            </div>
          )}

          {/* Super Admin Permanent Delete Toggle */}
          {isSuperAdminOrAdmin && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="text-slate-600 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={e => setIsPermanent(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-slate-700">Permanent Deletion (Bypass 60-day bin)</span>
              </label>
            </div>
          )}

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-delete-cancel"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-delete-confirm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className={`px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                isPermanent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : isPermanent
                  ? 'Permanently Delete'
                  : 'Move to Removed Items'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
