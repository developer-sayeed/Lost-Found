import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  initGoogleDriveAuth,
  signInWithGoogleDrive,
  disconnectGoogleDrive,
  getDriveAccessToken,
  getValidDriveAccessToken,
  refreshDriveAccessToken,
  ensureDriveBackupFolder,
  listGoogleDriveBackups,
  uploadBackupToGoogleDrive,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  pruneOldDriveBackups,
  DEFAULT_BACKUP_FOLDER_NAME,
  GoogleDriveAuthState,
  connectWithDirectToken,
  isDriveAuthError,
  GoogleDriveAuthExpiredError
} from '../../lib/googleDriveBackup';
import { GoogleDriveBackupFile, FullSystemBackupPackage, GoogleDriveBackupSettings } from '../../types';
import { BackupActionToolbar } from './components/BackupActionToolbar';
import { DriveAuthCard } from './components/DriveAuthCard';
import { BackupScheduleCard } from './components/BackupScheduleCard';
import { BackupInstantCard } from './components/BackupInstantCard';
import { BackupFilesTable } from './components/BackupFilesTable';
import { RestoreConfirmModal } from './components/RestoreConfirmModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const GoogleDriveBackupManager: React.FC = () => {
  const { settings, updateSettings, refreshData } = useApp();
  const { user } = useAuth();

  // Auth State (Persistent)
  const [authState, setAuthState] = useState<GoogleDriveAuthState>({
    isAuthenticated: Boolean(settings.googleDriveBackup?.isConnected),
    isConnected: Boolean(settings.googleDriveBackup?.isConnected),
    user: settings.googleDriveBackup?.connectedEmail
      ? {
          displayName: settings.googleDriveBackup.connectedName || 'Google Account',
          email: settings.googleDriveBackup.connectedEmail,
          photoURL: settings.googleDriveBackup.connectedPhoto || null,
          uid: 'google-user'
        }
      : null,
    hasToken: Boolean(getDriveAccessToken())
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);

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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Auth Listener & Sync with Backend Persistent Session on Mount
  useEffect(() => {
    const cleanup = initGoogleDriveAuth(state => {
      if (!isMountedRef.current) return;
      setAuthState(prev => ({
        ...prev,
        ...state,
        isConnected: state.isConnected || prev.isConnected || Boolean(settings.googleDriveBackup?.isConnected),
        isAuthenticated: state.isAuthenticated || prev.isAuthenticated || Boolean(settings.googleDriveBackup?.isConnected)
      }));
      if (state.hasToken || state.isAuthenticated || state.isConnected) {
        fetchDriveBackups();
      }
    });

    // Verify and sync persistent session from backend database
    api.getDriveSession().then(session => {
      if (session && session.isConnected && isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          isConnected: true,
          isAuthenticated: true,
          user: session.user || prev.user,
          hasToken: session.hasToken || prev.hasToken
        }));
        fetchDriveBackups();
      }
    }).catch(() => {});

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

  // Trigger Backup (Manual or Automatic) with Automatic Token Renewal
  const triggerBackup = async (isAuto = false) => {
    let token = await getValidDriveAccessToken();
    if (!token) {
      token = getDriveAccessToken();
    }
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your Google Drive account first or refresh your connection token.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage({
      type: 'info',
      text: 'Generating full database snapshot and uploading to Google Drive...'
    });

    try {
      const backupPackage = await api.getFullSystemBackup(user);
      const folderId = await ensureDriveBackupFolder(token);
      const uploadedFile = await uploadBackupToGoogleDrive(token, backupPackage, folderId);

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

      await pruneOldDriveBackups(token, maxFiles, folderId);
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

  // Periodic Auto-Backup Runner (Persistent: NEVER cancels unless explicitly disconnected by user)
  useEffect(() => {
    if (!autoEnabled || (!authState.isConnected && !authState.isAuthenticated)) return;

    const checkAndRunAutoBackup = async () => {
      if (!isMountedRef.current) return;
      const token = await getValidDriveAccessToken();
      if (!token) {
        console.log('[Auto Backup] Scheduled backup awaiting token renewal...');
        return;
      }

      const lastBackupStr = settings.googleDriveBackup?.lastBackupDate;
      const now = Date.now();

      let intervalMs = 24 * 3600 * 1000;
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

    // Run check on mount/schedule change and then every 5 minutes
    checkAndRunAutoBackup();
    const interval = setInterval(checkAndRunAutoBackup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, authState.isConnected, authState.isAuthenticated, frequency, settings.googleDriveBackup?.lastBackupDate]);

  // Fetch list of backups from Drive (Safely recovers from token timeouts without disconnecting)
  const fetchDriveBackups = async () => {
    let token = await getValidDriveAccessToken();
    if (!token) {
      token = getDriveAccessToken();
    }
    if (!token && !authState.isConnected) {
      return;
    }

    if (isMountedRef.current) setIsLoadingFiles(true);
    try {
      const activeToken = token || '';
      const folderId = await ensureDriveBackupFolder(activeToken);
      const files = await listGoogleDriveBackups(activeToken, folderId);
      if (isMountedRef.current) {
        setDriveFiles(files || []);
      }
    } catch (err: any) {
      console.warn('Notice while retrieving backups from Google Drive:', err?.message || err);
      // NEVER disconnect or wipe the user session on listing error
    } finally {
      if (isMountedRef.current) {
        setIsLoadingFiles(false);
      }
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
        isConnected: true,
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

      const folderId = await ensureDriveBackupFolder(accessToken);
      const files = await listGoogleDriveBackups(accessToken, folderId);
      setDriveFiles(files);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.isUserCancelled) {
        setStatusMessage({
          type: 'info',
          text: 'Google Sign-in popup was closed. Click "Connect Google Account" whenever you are ready.'
        });
      } else {
        console.warn('Google Drive sign-in notice:', err?.message || err);
        setAuthError(err.message || 'Failed to authenticate with Google Drive.');
        if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
          setShowTokenInput(true);
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Direct Access Token Connection
  const handleConnectWithToken = async () => {
    const trimmed = manualToken.trim();
    if (!trimmed) {
      setAuthError('Please enter a valid Google OAuth Access Token.');
      return;
    }
    setIsConnectingToken(true);
    setAuthError(null);
    try {
      const { user: fUser, accessToken } = await connectWithDirectToken(trimmed);
      setAuthState({
        isAuthenticated: true,
        isConnected: true,
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
        text: `Connected to Google Drive as ${fUser.email || fUser.displayName || 'Google Account'}`
      });
      setShowTokenInput(false);
      setManualToken('');

      const folderId = await ensureDriveBackupFolder(accessToken);
      const files = await listGoogleDriveBackups(accessToken, folderId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Direct token connection failed:', err);
      setAuthError(err.message || 'Failed to connect with access token. Please check that the token is valid.');
    } finally {
      setIsConnectingToken(false);
    }
  };

  const handleCopyHost = () => {
    const host = window.location.hostname || 'localhost';
    try {
      navigator.clipboard.writeText(host);
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2500);
    } catch {}
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setAuthState({
      isAuthenticated: false,
      isConnected: false,
      user: null,
      hasToken: false
    });
    setDriveFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Google Drive has been explicitly disconnected.'
    });
  };

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

  const handleInitiateDriveRestore = async (file: GoogleDriveBackupFile) => {
    const token = (await getValidDriveAccessToken()) || getDriveAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Google Drive authentication required to download backup file. Please refresh your connection.'
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

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    const token = (await getValidDriveAccessToken()) || getDriveAccessToken();
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
      <BackupActionToolbar
        onDownloadLocalBackup={handleDownloadLocalBackup}
        onTriggerLocalFileSelect={() => localFileInputRef.current?.click()}
        localFileInputRef={localFileInputRef}
        onLocalFileSelect={handleLocalFileSelect}
        statusMessage={statusMessage}
        onClearStatus={() => setStatusMessage(null)}
      />

      <DriveAuthCard
        authState={authState}
        isConnecting={isConnecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        showTokenInput={showTokenInput}
        setShowTokenInput={setShowTokenInput}
        manualToken={manualToken}
        setManualToken={setManualToken}
        isConnectingToken={isConnectingToken}
        onConnectWithToken={handleConnectWithToken}
        authError={authError}
        copiedHost={copiedHost}
        onCopyHost={handleCopyHost}
      />

      <BackupScheduleCard
        autoEnabled={autoEnabled}
        setAutoEnabled={setAutoEnabled}
        frequency={frequency}
        setFrequency={setFrequency}
        maxFiles={maxFiles}
        setMaxFiles={setMaxFiles}
        isSavingConfig={isSavingConfig}
        onSaveConfig={handleSaveConfig}
        backupSettings={settings.googleDriveBackup}
      />

      <BackupInstantCard
        onTriggerBackup={triggerBackup}
        isBackingUp={isBackingUp}
        hasToken={Boolean(authState.hasToken)}
      />

      <BackupFilesTable
        driveFiles={driveFiles}
        hasToken={Boolean(authState.hasToken)}
        isLoadingFiles={isLoadingFiles}
        onRefresh={fetchDriveBackups}
        onConnectDrive={handleConnect}
        onInitiateRestore={handleInitiateDriveRestore}
        onSelectDelete={file => setDeleteTarget(file)}
      />

      <RestoreConfirmModal
        restoreTarget={restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleExecuteRestore}
        isRestoring={isRestoring}
      />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
