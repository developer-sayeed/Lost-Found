import React from 'react';
import { Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { GoogleDriveBackupSettings } from '../../../types';

interface BackupScheduleCardProps {
  autoEnabled: boolean;
  setAutoEnabled: (val: boolean) => void;
  frequency: '6h' | '12h' | 'daily' | 'weekly';
  setFrequency: (val: '6h' | '12h' | 'daily' | 'weekly') => void;
  maxFiles: number;
  setMaxFiles: (val: number) => void;
  isSavingConfig: boolean;
  onSaveConfig: () => Promise<void>;
  backupSettings?: GoogleDriveBackupSettings;
}

export const BackupScheduleCard: React.FC<BackupScheduleCardProps> = ({
  autoEnabled,
  setAutoEnabled,
  frequency,
  setFrequency,
  maxFiles,
  setMaxFiles,
  isSavingConfig,
  onSaveConfig,
  backupSettings
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
          <span>Automated Backup Schedule</span>
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Continuous cloud sync</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toggle Auto Backup Card */}
        <div className="p-4 bg-white dark:bg-[#180F1A] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Backup Status</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Enable automatic scheduled backups</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoEnabled(!autoEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoEnabled ? 'bg-fuchsia-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1">
            {autoEnabled ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto-backup is ACTIVE</span>
              </span>
            ) : (
              <span className="text-slate-400">Auto-backup is paused</span>
            )}
          </div>
        </div>

        {/* Backup Frequency */}
        <div className="p-4 bg-white dark:bg-[#180F1A] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">Backup Frequency</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value as any)}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value="6h">Every 6 Hours</option>
            <option value="12h">Every 12 Hours</option>
            <option value="daily">Daily (Every 24 Hours) [Recommended]</option>
            <option value="weekly">Weekly</option>
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Interval for automated background snapshots</p>
        </div>

        {/* Max Files to Retain */}
        <div className="p-4 bg-white dark:bg-[#180F1A] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">Cloud Retention (Max Files)</label>
          <select
            value={maxFiles}
            onChange={e => setMaxFiles(Number(e.target.value))}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value={5}>Keep latest 5 backups</option>
            <option value={10}>Keep latest 10 backups</option>
            <option value={15}>Keep latest 15 backups (Recommended)</option>
            <option value={30}>Keep latest 30 backups</option>
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Automatically prunes older backups to save Drive space</p>
        </div>
      </div>

      {/* Schedule Controls & Last Backup Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#180F1A] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 text-xs">
        <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span>Last Google Drive Backup: </span>
            <strong className="text-slate-900 dark:text-white">
              {backupSettings?.lastBackupDate
                ? new Date(backupSettings.lastBackupDate).toLocaleString()
                : 'No cloud backups completed yet'}
            </strong>
            {backupSettings?.lastBackupFileName && (
              <span className="text-slate-500 dark:text-slate-400 ml-1">
                ({backupSettings.lastBackupFileName})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onSaveConfig}
            disabled={isSavingConfig}
            className="px-4 py-1.5 btn-primary-gradient text-white font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            {isSavingConfig ? 'Saving...' : 'Save Schedule Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
