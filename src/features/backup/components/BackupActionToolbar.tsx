import React from 'react';
import { Cloud, Download, Upload, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface BackupActionToolbarProps {
  onDownloadLocalBackup: () => Promise<void>;
  onTriggerLocalFileSelect: () => void;
  localFileInputRef: React.RefObject<HTMLInputElement | null>;
  onLocalFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusMessage: {
    type: 'success' | 'error' | 'info';
    text: string;
  } | null;
  onClearStatus: () => void;
}

export const BackupActionToolbar: React.FC<BackupActionToolbarProps> = ({
  onDownloadLocalBackup,
  onTriggerLocalFileSelect,
  localFileInputRef,
  onLocalFileSelect,
  statusMessage,
  onClearStatus
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5 text-slate-900 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Google Drive Auto Backup &amp; Recovery Hub</h2>
              <p className="text-xs text-slate-500">
                Automatic scheduled and instant cloud snapshots of the entire website database, staff directory, certificates, and system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadLocalBackup}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Download full JSON database snapshot to your computer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Local JSON</span>
          </button>

          <button
            type="button"
            onClick={onTriggerLocalFileSelect}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Restore database from a local JSON backup file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Restore from File</span>
          </button>
          <input
            type="file"
            ref={localFileInputRef as any}
            onChange={onLocalFileSelect}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Notification / Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={onClearStatus}
            className="text-slate-400 hover:text-slate-600 px-1 py-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
