import React from 'react';
import { Trash2 } from 'lucide-react';

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  modalRef: React.RefObject<HTMLDivElement | null>;
  batchDeleteReason: string;
  setBatchDeleteReason: (reason: string) => void;
  isPermanentBatchDelete: boolean;
  setIsPermanentBatchDelete: (val: boolean) => void;
  isProcessingBatchDelete: boolean;
  onConfirmBatchDelete: () => Promise<void>;
  isAdminTier: boolean;
}

export const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  modalRef,
  batchDeleteReason,
  setBatchDeleteReason,
  isPermanentBatchDelete,
  setIsPermanentBatchDelete,
  isProcessingBatchDelete,
  onConfirmBatchDelete,
  isAdminTier
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isProcessingBatchDelete) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef as any}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up"
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Delete {selectedCount} Selected {selectedCount === 1 ? 'Item' : 'Items'}?
          </h3>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {isPermanentBatchDelete
              ? 'Warning: This will permanently remove these records from the system. This action cannot be undone.'
              : 'Selected records will be moved to Removed Items (retained for 60 days where you can restore or permanently delete them).'}
          </p>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Deletion (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared by management, Batch cleanup"
                value={batchDeleteReason}
                onChange={e => setBatchDeleteReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
              />
            </div>

            {isAdminTier && (
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPermanentBatchDelete}
                  onChange={e => setIsPermanentBatchDelete(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-slate-300"
                />
                <span className="font-medium text-rose-700">
                  Permanent Deletion (Bypass 60-day recycle bin)
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={isProcessingBatchDelete}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessingBatchDelete}
              onClick={onConfirmBatchDelete}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {isProcessingBatchDelete
                  ? 'Deleting...'
                  : isPermanentBatchDelete
                  ? `Permanently Delete (${selectedCount})`
                  : `Move to Trash (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
