import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface BackupInstantCardProps {
  onTriggerBackup: (isAuto: boolean) => Promise<void>;
  isBackingUp: boolean;
  hasToken: boolean;
}

export const BackupInstantCard: React.FC<BackupInstantCardProps> = ({
  onTriggerBackup,
  isBackingUp,
  hasToken
}) => {
  return (
    <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 dark:from-[#180F1A] dark:via-[#200f24] dark:to-[#180F1A] rounded-2xl border border-blue-100 dark:border-fuchsia-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-fuchsia-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manual Instant Backup</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
          Immediately capture all registered hotel lost items, staff accounts, certificates, custom themes, and system settings, creating a verified snapshot in your Google Drive folder.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onTriggerBackup(false)}
        disabled={isBackingUp || !hasToken}
        className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer ${
          !hasToken
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'btn-primary-gradient text-white shadow-fuchsia-500/20'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
        <span>{isBackingUp ? 'Backing Up to Drive...' : '⚡ Run Instant Backup to Drive'}</span>
      </button>
    </div>
  );
};
