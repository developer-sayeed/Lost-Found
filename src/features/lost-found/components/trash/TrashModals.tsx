import React from 'react';
import { RotateCcw, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { LostItem } from '../../../../types';

interface TrashModalsProps {
  // Single Restore Modal
  isRestoreModalOpen: boolean;
  itemToRestore: LostItem | null;
  restoreModalRef: React.RefObject<HTMLDivElement | null>;
  onCloseRestoreModal: () => void;
  onConfirmSingleRestore: () => Promise<void>;

  // Single Permanent Delete Modal
  isPermanentDeleteModalOpen: boolean;
  itemToPermanentDelete: LostItem | null;
  permanentDeleteModalRef: React.RefObject<HTMLDivElement | null>;
  onClosePermanentDeleteModal: () => void;
  onConfirmSinglePermanentDelete: () => Promise<void>;

  // Batch Restore Modal
  isBatchRestoreModalOpen: boolean;
  batchRestoreModalRef: React.RefObject<HTMLDivElement | null>;
  onCloseBatchRestoreModal: () => void;
  onConfirmBatchRestore: () => Promise<void>;

  // Batch Permanent Delete Modal
  isBatchDeleteModalOpen: boolean;
  batchDeleteModalRef: React.RefObject<HTMLDivElement | null>;
  onCloseBatchDeleteModal: () => void;
  onConfirmBatchPermanentDelete: () => Promise<void>;

  // Empty Trash Modal
  isEmptyTrashModalOpen: boolean;
  emptyTrashModalRef: React.RefObject<HTMLDivElement | null>;
  onCloseEmptyTrashModal: () => void;
  onConfirmEmptyTrash: () => Promise<void>;

  selectedCount: number;
  totalTrashCount: number;
  isProcessing: boolean;
}

export const TrashModals: React.FC<TrashModalsProps> = ({
  isRestoreModalOpen,
  itemToRestore,
  restoreModalRef,
  onCloseRestoreModal,
  onConfirmSingleRestore,

  isPermanentDeleteModalOpen,
  itemToPermanentDelete,
  permanentDeleteModalRef,
  onClosePermanentDeleteModal,
  onConfirmSinglePermanentDelete,

  isBatchRestoreModalOpen,
  batchRestoreModalRef,
  onCloseBatchRestoreModal,
  onConfirmBatchRestore,

  isBatchDeleteModalOpen,
  batchDeleteModalRef,
  onCloseBatchDeleteModal,
  onConfirmBatchPermanentDelete,

  isEmptyTrashModalOpen,
  emptyTrashModalRef,
  onCloseEmptyTrashModal,
  onConfirmEmptyTrash,

  selectedCount,
  totalTrashCount,
  isProcessing
}) => {
  return (
    <>
      {/* SINGLE RESTORE MODAL */}
      {isRestoreModalOpen && itemToRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isProcessing) {
              onCloseRestoreModal();
            }
          }}
        >
          <div
            ref={restoreModalRef}
            className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-fuchsia-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Item to Inventory</h3>
                <p className="text-xs text-slate-500 dark:text-fuchsia-300/70 font-mono">
                  Item Code: {itemToRestore.code}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#200f24] border border-slate-200 dark:border-fuchsia-900/30 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {itemToRestore.itemName || itemToRestore.description}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Category: {itemToRestore.category}</p>
                <p className="text-slate-500 dark:text-slate-400">Found Location: {itemToRestore.locationFound}</p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Restoring this item will move it back to the active inventory catalog with full timeline history preserved.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-fuchsia-900/30">
                <button
                  type="button"
                  onClick={onCloseRestoreModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-restore"
                  disabled={isProcessing}
                  onClick={onConfirmSingleRestore}
                  className="px-5 py-2 btn-primary-gradient text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? 'Restoring...' : 'Restore Item'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PERMANENT DELETE MODAL */}
      {isPermanentDeleteModalOpen && itemToPermanentDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isProcessing) {
              onClosePermanentDeleteModal();
            }
          }}
        >
          <div
            ref={permanentDeleteModalRef}
            className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/40 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">Permanently Delete Item?</h3>
                <p className="text-xs text-rose-700 dark:text-rose-400 font-mono">
                  Item Code: {itemToPermanentDelete.code}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#200f24] border border-slate-200 dark:border-fuchsia-900/30 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {itemToPermanentDelete.itemName || itemToPermanentDelete.description}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Category: {itemToPermanentDelete.category}</p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ <strong>Irreversible Action:</strong> This item will be permanently wiped from the database. It cannot be recovered or restored after this.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-fuchsia-900/30">
                <button
                  type="button"
                  onClick={onClosePermanentDeleteModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-permanent-delete"
                  disabled={isProcessing}
                  onClick={onConfirmSinglePermanentDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH RESTORE MODAL */}
      {isBatchRestoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isProcessing) {
              onCloseBatchRestoreModal();
            }
          }}
        >
          <div
            ref={batchRestoreModalRef}
            className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-fuchsia-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Batch Restore Items</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCount} items selected</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Are you sure you want to restore <strong className="font-bold text-slate-900 dark:text-white">{selectedCount} items</strong> back to active inventory?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-fuchsia-900/30">
                <button
                  type="button"
                  onClick={onCloseBatchRestoreModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-batch-restore"
                  disabled={isProcessing}
                  onClick={onConfirmBatchRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isProcessing ? 'Restoring...' : `Restore ${selectedCount} Items`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PERMANENT DELETE MODAL */}
      {isBatchDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isProcessing) {
              onCloseBatchDeleteModal();
            }
          }}
        >
          <div
            ref={batchDeleteModalRef}
            className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/40 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  Permanently Delete {selectedCount} Items?
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-400">Bulk irreversible action</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ <strong>Warning:</strong> All {selectedCount} selected items will be permanently erased from both database and backup records.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-fuchsia-900/30">
                <button
                  type="button"
                  onClick={onCloseBatchDeleteModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-batch-delete"
                  disabled={isProcessing}
                  onClick={onConfirmBatchPermanentDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Deleting...' : `Permanently Delete (${selectedCount})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY TRASH MODAL */}
      {isEmptyTrashModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !isProcessing) {
              onCloseEmptyTrashModal();
            }
          }}
        >
          <div
            ref={emptyTrashModalRef}
            className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/40 overflow-hidden animate-scale-up"
          >
            <div className="p-6 pb-4 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">Empty Entire Recycle Bin?</h3>
                <p className="text-xs text-rose-700 dark:text-rose-400">{totalTrashCount} total items will be purged</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                This will permanently delete all{' '}
                <strong className="font-bold text-rose-900 dark:text-rose-300">{totalTrashCount} items</strong>{' '}
                currently in the Recycle Bin.
              </p>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ This operation cannot be undone.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-fuchsia-900/30">
                <button
                  type="button"
                  onClick={onCloseEmptyTrashModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-empty-trash"
                  disabled={isProcessing}
                  onClick={onConfirmEmptyTrash}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Emptying...' : 'Empty Recycle Bin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
