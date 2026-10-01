import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Database,
  FileCode,
  HardDrive,
  Folder,
  Layers,
  ArrowRight,
  Info,
  Check,
  X,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  initGoogleDriveAuth,
  signInWithGoogleDrive,
  disconnectGoogleDrive,
  getDriveAccessToken,
  ensureDriveBackupFolder,
  listGoogleDriveBackups,
  uploadBackupToGoogleDrive,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  pruneOldDriveBackups,
  DEFAULT_BACKUP_FOLDER_NAME,
  GoogleDriveAuthState
} from '../lib/googleDriveBackup';
import { GoogleDriveBackupFile, FullSystemBackupPackage, GoogleDriveBackupSettings } from '../types';

export const GoogleDriveBackupManager: React.FC = () => {
  const { settings, updateSettings, refreshData } = useApp();
  const { user } = useAuth();

  // Auth State
  const [authState, setAuthState] = useState<GoogleDriveAuthState>({
    isAuthenticated: false,
    user: null,
    hasToken: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Backup & Files State
  const [driveFiles, setDriveFiles] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Schedule & Configuration State
  const [autoEnabled, setAutoEnabled] = useState<boolean>(
    Boolean(settings.googleDriveBackup?.autoBackupEnabled)
  );
  const [frequency, setFrequency] = useState<'6h' | '12h' | 'daily' | 'weekly'>(
    settings.googleDriveBackup?.autoBackupFrequency || 'daily'
  );
  const [maxFiles, setMaxFiles] = useState<number>(
    settings.googleDriveBackup?.autoBackupMaxFilesToKeep || 15
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Modals / Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<GoogleDriveBackupFile | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{
    file?: GoogleDriveBackupFile;
    package?: FullSystemBackupPackage;
    source: 'drive' | 'local';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local File Restore Input
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth Listener on mount
  useEffect(() => {
    const cleanup = initGoogleDriveAuth(state => {
      setAuthState(state);
      if (state.hasToken && state.isAuthenticated) {
        fetchDriveBackups();
      }
    });
    return cleanup;
  }, []);

  // Update local form state when settings change
  useEffect(() => {
    if (settings.googleDriveBackup) {
      setAutoEnabled(Boolean(settings.googleDriveBackup.autoBackupEnabled));
      setFrequency(settings.googleDriveBackup.autoBackupFrequency || 'daily');
      setMaxFiles(settings.googleDriveBackup.autoBackupMaxFilesToKeep || 15);
    }
  }, [settings.googleDriveBackup]);

  // Periodic Auto-Backup Runner when session has Google Drive active
  useEffect(() => {
    if (!autoEnabled || !authState.hasToken) return;

    const checkAndRunAutoBackup = async () => {
      const token = getDriveAccessToken();
      if (!token) return;

      const lastBackupStr = settings.googleDriveBackup?.lastBackupDate;
      const now = Date.now();

      let intervalMs = 24 * 3600 * 1000; // daily default
      if (frequency === '6h') intervalMs = 6 * 3600 * 1000;
      else if (frequency === '12h') intervalMs = 12 * 3600 * 1000;
      else if (frequency === 'weekly') intervalMs = 7 * 24 * 3600 * 1000;

      if (!lastBackupStr || now - new Date(lastBackupStr).getTime() >= intervalMs) {
        console.log('[Auto Backup] Scheduled backup interval elapsed. Starting auto backup to Google Drive...');
        try {
          await triggerBackup(true);
        } catch (e) {
          console.warn('[Auto Backup] Automated backup run failed:', e);
        }
      }
    };

    // Run check on mount/token acquire, and every 10 minutes
    checkAndRunAutoBackup();
    const interval = setInterval(checkAndRunAutoBackup, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, authState.hasToken, frequency, settings.googleDriveBackup?.lastBackupDate]);

  // Fetch list of backups from Drive
  const fetchDriveBackups = async () => {
    const token = getDriveAccessToken();
    if (!token) return;

    setIsLoadingFiles(true);
    try {
      const folderId = await ensureDriveBackupFolder(token);
      const files = await listGoogleDriveBackups(token, folderId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to load Google Drive backups:', err);
      setStatusMessage({
        type: 'error',
        text: `Could not retrieve backups from Google Drive: ${err.message}`
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Google Sign-In with Drive Scope
  const handleConnect = async () => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const { user: fUser, accessToken } = await signInWithGoogleDrive();
      setAuthState({
        isAuthenticated: true,
        user: {
          displayName: fUser.displayName,
          email: fUser.email,
          photoURL: fUser.photoURL,
          uid: fUser.uid
        },
        hasToken: true
      });
      setStatusMessage({
        type: 'success',
        text: `Connected to Google Drive as ${fUser.email || fUser.displayName || 'Google User'}`
      });

      // Load files
      const folderId = await ensureDriveBackupFolder(accessToken);
      const files = await listGoogleDriveBackups(accessToken, folderId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Google Drive sign-in failed:', err);
      setAuthError(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from Google Drive
  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setAuthState({
      isAuthenticated: false,
      user: null,
      hasToken: false
    });
    setDriveFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Disconnected from Google Drive.'
    });
  };

  // Trigger Backup (Manual or Automatic)
  const triggerBackup = async (isAuto = false) => {
    const token = getDriveAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your Google Drive account first.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage({
      type: 'info',
      text: 'Generating full database snapshot and uploading to Google Drive...'
    });

    try {
      // 1. Fetch complete backup payload from server API
      const backupPackage = await api.getFullSystemBackup(user);

      // 2. Ensure Google Drive backup folder exists
      const folderId = await ensureDriveBackupFolder(token);

      // 3. Upload multipart file to Drive
      const uploadedFile = await uploadBackupToGoogleDrive(token, backupPackage, folderId);

      // 4. Record backup activity on server
      await api.recordGoogleDriveBackupActivity(
        {
          fileId: uploadedFile.id,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size ? Number(uploadedFile.size) : undefined,
          driveLink: uploadedFile.webViewLink,
          status: 'success',
          folderId,
          folderName: DEFAULT_BACKUP_FOLDER_NAME
        },
        user
      );

      // 5. Prune old backups if count exceeds max
      await pruneOldDriveBackups(token, maxFiles, folderId);

      // 6. Refresh file list
      await fetchDriveBackups();

      setStatusMessage({
        type: 'success',
        text: `${isAuto ? 'Automated' : 'Manual'} backup "${uploadedFile.name}" successfully created and saved to Google Drive!`
      });
    } catch (err: any) {
      console.error('Backup creation failed:', err);
      setStatusMessage({
        type: 'error',
        text: `Backup failed: ${err.message}`
      });

      // Record failure on server
      await api
        .recordGoogleDriveBackupActivity(
          {
            fileId: '',
            fileName: 'Failed Backup',
            status: 'failed',
            error: err.message
          },
          user
        )
        .catch(() => {});
    } finally {
      setIsBackingUp(false);
    }
  };

  // Save Schedule Configuration
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const updatedBackupSettings: GoogleDriveBackupSettings = {
        autoBackupEnabled: autoEnabled,
        autoBackupFrequency: frequency,
        autoBackupIncludeAuditLogs: true,
        autoBackupMaxFilesToKeep: maxFiles,
        lastBackupDate: settings.googleDriveBackup?.lastBackupDate,
        lastBackupFileId: settings.googleDriveBackup?.lastBackupFileId,
        lastBackupFileName: settings.googleDriveBackup?.lastBackupFileName,
        lastBackupFileSize: settings.googleDriveBackup?.lastBackupFileSize,
        lastBackupDriveLink: settings.googleDriveBackup?.lastBackupDriveLink,
        lastBackupStatus: settings.googleDriveBackup?.lastBackupStatus || 'success',
        backupFolderId: settings.googleDriveBackup?.backupFolderId,
        backupFolderName: DEFAULT_BACKUP_FOLDER_NAME
      };

      await updateSettings({
        googleDriveBackup: updatedBackupSettings
      });

      setStatusMessage({
        type: 'success',
        text: 'Google Drive auto-backup schedule and preferences updated!'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to save configuration: ${err.message}`
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Download Local JSON Backup
  const handleDownloadLocalBackup = async () => {
    try {
      setStatusMessage({
        type: 'info',
        text: 'Generating system snapshot for local download...'
      });
      const backupPackage = await api.getFullSystemBackup(user);
      const jsonStr = JSON.stringify(backupPackage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `warwick_hotel_full_backup_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'Local system backup downloaded successfully!'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to export local backup: ${err.message}`
      });
    }
  };

  // Open File from Local Disk for Restore
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed: FullSystemBackupPackage = JSON.parse(event.target?.result as string);
        if (!parsed.database || !Array.isArray(parsed.database.items)) {
          throw new Error('Invalid backup file structure: missing database.items array.');
        }
        setRestoreTarget({
          package: parsed,
          source: 'local'
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Invalid backup JSON file: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  // Start Restore from Drive File
  const handleInitiateDriveRestore = async (file: GoogleDriveBackupFile) => {
    const token = getDriveAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Google Drive authentication required to download backup file.'
      });
      return;
    }

    try {
      setStatusMessage({
        type: 'info',
        text: `Downloading backup "${file.name}" from Google Drive...`
      });
      const pkg = await downloadBackupFromGoogleDrive(token, file.id);
      setRestoreTarget({
        file,
        package: pkg,
        source: 'drive'
      });
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to retrieve backup from Google Drive: ${err.message}`
      });
    }
  };

  // Execute Restore Confirmation
  const handleExecuteRestore = async () => {
    if (!restoreTarget?.package) return;

    setIsRestoring(true);
    setStatusMessage({
      type: 'info',
      text: 'Restoring database and applying system records...'
    });

    try {
      const res = await api.restoreFullSystemBackup(restoreTarget.package, user);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Restore complete! Restored ${res.restoredCounts.items} items, ${res.restoredCounts.staff} staff members, ${res.restoredCounts.certificates} certificates.`
        });
        setRestoreTarget(null);
        await refreshData();
      } else {
        throw new Error(res.message || 'Restoration encountered an issue.');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setStatusMessage({
        type: 'error',
        text: `System restoration failed: ${err.message}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Execute Delete from Drive Confirmation (MANDATORY per workspace skill)
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    const token = getDriveAccessToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      await deleteBackupFromGoogleDrive(token, deleteTarget.id);
      setStatusMessage({
        type: 'success',
        text: `Backup file "${deleteTarget.name}" was permanently removed from Google Drive.`
      });
      setDeleteTarget(null);
      await fetchDriveBackups();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to delete backup from Google Drive: ${err.message}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return 'Unknown size';
    const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(b)) return 'Unknown size';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5 text-slate-900 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Google Drive Auto Backup & Recovery Hub</h2>
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
            onClick={handleDownloadLocalBackup}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Download full JSON database snapshot to your computer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Local JSON</span>
          </button>

          <button
            type="button"
            onClick={() => localFileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Restore database from a local JSON backup file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Restore from File</span>
          </button>
          <input
            type="file"
            ref={localFileInputRef}
            onChange={handleLocalFileSelect}
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
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 px-1 py-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 1: Google Drive Account Authentication */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M17 6L4 29l8 13 13-23z" />
                <path fill="#FF3D00" d="M31 6H17l13 23h14z" />
                <path fill="#4CAF50" d="M4 29l7 13h26l-7-13z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Google Drive Connection</h3>
                {authState.isAuthenticated && authState.hasToken ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {authState.isAuthenticated && authState.user
                  ? `Signed in as ${authState.user.displayName || 'Google Account'} (${authState.user.email || 'No email'})`
                  : 'Connect your Google Drive account with permission to store and manage encrypted hotel backup snapshots.'}
              </p>
              {authState.isAuthenticated && (
                <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-600">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Folder: <strong>{DEFAULT_BACKUP_FOLDER_NAME}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {authState.isAuthenticated && authState.hasToken ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="gsi-material-button"
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isConnecting ? 'Connecting...' : 'Sign in with Google Drive'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* Section 2: Automated Backup Schedule & Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Automated Backup Schedule</span>
          </h3>
          <span className="text-xs text-slate-500">Continuous cloud sync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Toggle Auto Backup Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Auto-Backup Status</p>
                <p className="text-[11px] text-slate-500">Enable automatic scheduled backups</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoEnabled(!autoEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="text-[11px] text-slate-600 pt-1">
              {autoEnabled ? (
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-backup is ACTIVE</span>
                </span>
              ) : (
                <span className="text-slate-400">Auto-backup is paused</span>
              )}
            </div>
          </div>

          {/* Backup Frequency */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-900 block">Backup Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as any)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="6h">Every 6 Hours</option>
              <option value="12h">Every 12 Hours</option>
              <option value="daily">Daily (Every 24 Hours) [Recommended]</option>
              <option value="weekly">Weekly</option>
            </select>
            <p className="text-[11px] text-slate-500">Interval for automated background snapshots</p>
          </div>

          {/* Max Files to Retain */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-900 block">Cloud Retention (Max Files)</label>
            <select
              value={maxFiles}
              onChange={e => setMaxFiles(Number(e.target.value))}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={5}>Keep latest 5 backups</option>
              <option value={10}>Keep latest 10 backups</option>
              <option value={15}>Keep latest 15 backups (Recommended)</option>
              <option value={30}>Keep latest 30 backups</option>
            </select>
            <p className="text-[11px] text-slate-500">Automatically prunes older backups to save Drive space</p>
          </div>
        </div>

        {/* Schedule Controls & Last Backup Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-3 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span>Last Google Drive Backup: </span>
              <strong>
                {settings.googleDriveBackup?.lastBackupDate
                  ? new Date(settings.googleDriveBackup.lastBackupDate).toLocaleString()
                  : 'No cloud backups completed yet'}
              </strong>
              {settings.googleDriveBackup?.lastBackupFileName && (
                <span className="text-slate-500 ml-1">
                  ({settings.googleDriveBackup.lastBackupFileName})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              {isSavingConfig ? 'Saving...' : 'Save Schedule Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Instant Backup Execution */}
      <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Manual Instant Backup</h3>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl">
            Immediately capture all registered hotel lost items, staff accounts, certificates, custom themes, and system settings, creating a verified snapshot in your Google Drive folder.
          </p>
        </div>

        <button
          type="button"
          onClick={() => triggerBackup(false)}
          disabled={isBackingUp || !authState.hasToken}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer ${
            !authState.hasToken
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
          <span>{isBackingUp ? 'Backing Up to Drive...' : '⚡ Run Instant Backup to Drive'}</span>
        </button>
      </div>

      {/* Section 4: Google Drive Backups Browser */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Backups Stored in Google Drive</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {driveFiles.length} file{driveFiles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchDriveBackups}
              disabled={isLoadingFiles || !authState.hasToken}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>

        {!authState.hasToken ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Cloud className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Google Drive Not Connected</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sign in with Google Drive above to view, restore, and manage automated website and database backups directly from cloud storage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Connect Google Drive Now
            </button>
          </div>
        ) : isLoadingFiles ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Scanning Google Drive folder for backups...</span>
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Folder className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Backups Found in Google Drive</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Run Instant Backup to Drive&quot; above to create your first full website and database snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Backup File Name</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Snapshot Contents</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driveFiles.map(file => (
                  <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center space-x-2">
                        <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(file.createdTime).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {file.recordsCount ? (
                        <div className="flex items-center space-x-2 text-[11px]">
                          {file.recordsCount.items !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                              {file.recordsCount.items} Items
                            </span>
                          )}
                          {file.recordsCount.staff !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                              {file.recordsCount.staff} Staff
                            </span>
                          )}
                          {file.recordsCount.certificates !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-semibold">
                              {file.recordsCount.certificates} Certs
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] truncate max-w-xs block">
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
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Open file in Google Drive"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View in Drive</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleInitiateDriveRestore(file)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                        title="Restore website database using this backup"
                      >
                        <RefreshCw className="w-3 h-3 text-indigo-600" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(file)}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
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

      {/* CONFIRMATION MODAL: RESTORE SYSTEM FROM BACKUP */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm System & Database Restoration
                </h3>
                <p className="text-xs text-slate-500">
                  You are about to restore the full website database from{' '}
                  <strong className="text-slate-700">
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-800">Snapshot Contents to be Restored:</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span>Lost & Found Items:</span>
                    <strong className="text-slate-900">
                      {restoreTarget.package.database.items?.length || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span>Staff Accounts:</span>
                    <strong className="text-slate-900">
                      {restoreTarget.package.database.staff?.length || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span>Certificates:</span>
                    <strong className="text-slate-900">
                      {restoreTarget.package.database.certificates?.length || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span>Hotel Settings:</span>
                    <strong className="text-emerald-700">Included</strong>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 font-medium pt-1">
                  ⚠️ Current database state will be updated with this snapshot.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring System...' : 'Confirm & Restore Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE FROM DRIVE (MANDATORY PER WORKSPACE SKILL) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Google Drive Backup?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete this backup file from your Google Drive?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all">
              {deleteTarget.name}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                <span>{isDeleting ? 'Deleting...' : 'Delete from Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
