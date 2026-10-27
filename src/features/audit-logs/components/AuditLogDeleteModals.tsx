import React from 'react';
import { Trash2, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../../types';

interface AuditLogDeleteModalsProps {
  logToDelete: AuditLog | null;
  onCancelDeleteSingle: () => void;
  onConfirmDeleteSingle: (id: string) => void;
  showBatchDeleteConfirm: boolean;
  onCancelBatchDelete: () => void;
  onConfirmBatchDelete: () => void;
  isBatchDeleting: boolean;
  selectedCount: number;
  showClearAllConfirm: boolean;
  onCancelClearAll: () => void;
  onConfirmClearAll: () => void;
  isClearingAll: boolean;
  totalLogsCount: number;
}

export const AuditLogDeleteModals: React.FC<AuditLogDeleteModalsProps> = ({
  logToDelete,
  onCancelDeleteSingle,
  onConfirmDeleteSingle,
  showBatchDeleteConfirm,
  onCancelBatchDelete,
  onConfirmBatchDelete,
  isBatchDeleting,
  selectedCount,
  showClearAllConfirm,
  onCancelClearAll,
  onConfirmClearAll,
  isClearingAll,
  totalLogsCount
}) => {
  return (
    <>
      {/* Single Log Deletion Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Audit Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this audit log entry? This operation will remove the accountability record permanently.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
              <div className="font-bold text-slate-900 font-sans">{logToDelete.action}</div>
              <div className="text-slate-500">
                By: {logToDelete.performedBy} ({logToDelete.userRole || logToDelete.performedByRole || 'Staff'})
              </div>
              <div className="text-slate-400 text-[11px]">
                {new Date(logToDelete.timestamp).toLocaleString('en-GB')}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancelDeleteSingle}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirmDeleteSingle(logToDelete.id)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Deletion Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete {selectedCount} Audit Records?</h3>
              <p className="text-xs text-slate-500">
                You have selected <strong>{selectedCount}</strong> audit logs. Deleting them will permanently erase them from both the database and audit trail.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancelBatchDelete}
                disabled={isBatchDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmBatchDelete}
                disabled={isBatchDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isBatchDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Selected</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Logs Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-rose-900">Clear Entire Audit Ledger?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This administrative action will permanently erase all <strong>{totalLogsCount}</strong> recorded audit events. This includes item registrations, custody transitions, and staff updates.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              ⚠️ <strong>Warning:</strong> This action cannot be reversed. Please make sure you have exported a CSV copy if needed.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancelClearAll}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmClearAll}
                disabled={isClearingAll}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Clear All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
