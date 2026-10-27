import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GoogleDriveBackupFile, FullSystemBackupPackage } from '../../../types';

interface RestoreConfirmModalProps {
  restoreTarget: {
    file?: GoogleDriveBackupFile;
    package?: FullSystemBackupPackage;
    source: 'drive' | 'local';
  } | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isRestoring: boolean;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  restoreTarget,
  onCancel,
  onConfirm,
  isRestoring
}) => {
  if (!restoreTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/40 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/40 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Confirm System &amp; Database Restoration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are about to restore the full website database from{' '}
              <strong className="text-slate-700 dark:text-fuchsia-200">
                {restoreTarget.source === 'drive'
                  ? `Google Drive backup "${restoreTarget.file?.name}"`
                  : 'local JSON backup package'}
              </strong>
              .
            </p>
          </div>
        </div>

        {/* Summary of records in package */}
        {restoreTarget.package && (
          <div className="p-4 bg-slate-50 dark:bg-[#200f24] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 space-y-2 text-xs">
            <p className="font-bold text-slate-800 dark:text-white">Snapshot Contents to be Restored:</p>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-[#180F1A] rounded-lg border border-slate-100 dark:border-fuchsia-900/30">
                <span>Lost &amp; Found Items:</span>
                <strong className="text-slate-900 dark:text-white">
                  {restoreTarget.package.database.items?.length || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-[#180F1A] rounded-lg border border-slate-100 dark:border-fuchsia-900/30">
                <span>Staff Accounts:</span>
                <strong className="text-slate-900 dark:text-white">
                  {restoreTarget.package.database.staff?.length || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-[#180F1A] rounded-lg border border-slate-100 dark:border-fuchsia-900/30">
                <span>Certificates:</span>
                <strong className="text-slate-900 dark:text-white">
                  {restoreTarget.package.database.certificates?.length || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-[#180F1A] rounded-lg border border-slate-100 dark:border-fuchsia-900/30">
                <span>Hotel Settings:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">Included</strong>
              </div>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
              ⚠️ Current database state will be updated with this snapshot.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-fuchsia-900/30">
          <button
            type="button"
            onClick={onCancel}
            disabled={isRestoring}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring System...' : 'Confirm & Restore Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
