import React from 'react';
import { HardDrive, RefreshCw, Cloud, Folder, FileCode, ExternalLink, Trash2 } from 'lucide-react';
import { GoogleDriveBackupFile } from '../../../types';

interface BackupFilesTableProps {
  driveFiles: GoogleDriveBackupFile[];
  hasToken: boolean;
  isLoadingFiles: boolean;
  onRefresh: () => Promise<void>;
  onConnectDrive: () => Promise<void>;
  onInitiateRestore: (file: GoogleDriveBackupFile) => Promise<void>;
  onSelectDelete: (file: GoogleDriveBackupFile) => void;
}

export const BackupFilesTable: React.FC<BackupFilesTableProps> = ({
  driveFiles,
  hasToken,
  isLoadingFiles,
  onRefresh,
  onConnectDrive,
  onInitiateRestore,
  onSelectDelete
}) => {
  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return 'Unknown size';
    const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(b)) return 'Unknown size';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backups Stored in Google Drive</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#251329] text-slate-700 dark:text-fuchsia-300 border border-transparent dark:border-fuchsia-900/30">
            {driveFiles.length} file{driveFiles.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoadingFiles || !hasToken}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#180F1A] hover:bg-slate-50 dark:hover:bg-[#221028] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {!hasToken ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-[#180F1A] rounded-2xl border border-dashed border-slate-200 dark:border-fuchsia-900/40 space-y-3">
          <Cloud className="w-10 h-10 text-slate-400 dark:text-fuchsia-400/60 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Google Drive Not Connected</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Sign in with Google Drive above to view, restore, and manage automated website and database backups directly from cloud storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onConnectDrive}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Connect Google Drive Now
          </button>
        </div>
      ) : isLoadingFiles ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-300 text-xs flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 dark:text-fuchsia-400" />
          <span>Scanning Google Drive folder for backups...</span>
        </div>
      ) : driveFiles.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-[#180F1A] rounded-2xl border border-dashed border-slate-200 dark:border-fuchsia-900/40 space-y-2">
          <Folder className="w-10 h-10 text-slate-400 dark:text-fuchsia-400/60 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Backups Found in Google Drive</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Click &quot;Run Instant Backup to Drive&quot; above to create your first full website and database snapshot.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-fuchsia-900/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#200f24] text-slate-700 dark:text-fuchsia-200 font-bold border-b border-slate-200 dark:border-fuchsia-900/30">
              <tr>
                <th className="py-3 px-4">Backup File Name</th>
                <th className="py-3 px-4">Date Created</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Snapshot Contents</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fuchsia-900/20 bg-white dark:bg-[#180F1A]">
              {driveFiles.map(file => (
                <tr key={file.id} className="hover:bg-slate-50/70 dark:hover:bg-[#221028] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-indigo-500 dark:text-fuchsia-400 shrink-0" />
                      <span className="truncate max-w-xs">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(file.createdTime).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {file.recordsCount ? (
                      <div className="flex items-center space-x-2 text-[11px]">
                        {file.recordsCount.items !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40 font-semibold">
                            {file.recordsCount.items} Items
                          </span>
                        )}
                        {file.recordsCount.staff !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 font-semibold">
                            {file.recordsCount.staff} Staff
                          </span>
                        )}
                        {file.recordsCount.certificates !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40 font-semibold">
                            {file.recordsCount.certificates} Certs
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-xs block">
                        {file.description || 'Full System Snapshot'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#251329] border border-slate-200 dark:border-fuchsia-900/40 rounded-lg transition-colors cursor-pointer"
                        title="Open file in Google Drive"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View in Drive</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => onInitiateRestore(file)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-fuchsia-300 hover:bg-indigo-50 dark:hover:bg-fuchsia-950/40 border border-indigo-200 dark:border-fuchsia-800/40 rounded-lg transition-colors cursor-pointer"
                      title="Restore website database using this backup"
                    >
                      <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-fuchsia-400" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectDelete(file)}
                      className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete this backup from Google Drive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
