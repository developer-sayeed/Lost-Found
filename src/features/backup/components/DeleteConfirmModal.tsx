import React from 'react';
import { Trash2 } from 'lucide-react';
import { GoogleDriveBackupFile } from '../../../types';

interface DeleteConfirmModalProps {
  deleteTarget: GoogleDriveBackupFile | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  deleteTarget,
  onCancel,
  onConfirm,
  isDeleting
}) => {
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/40 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/40 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Google Drive Backup?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this backup file from your Google Drive?
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-[#200f24] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 text-xs font-mono text-slate-700 dark:text-fuchsia-200 break-all">
          {deleteTarget.name}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-fuchsia-900/30">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
            <span>{isDeleting ? 'Deleting...' : 'Delete from Drive'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
