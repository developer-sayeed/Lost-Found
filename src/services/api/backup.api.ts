import { FullSystemBackupPackage, GoogleDriveBackupSettings, User } from '../../types';
import { getAuthHeaders } from './client';

export const backupApi = {
  async getFullSystemBackup(user?: User | null): Promise<FullSystemBackupPackage> {
    const res = await fetch('/api/backup/full', {
      headers: getAuthHeaders(user)
    });
    if (!res.ok) {
      throw new Error(`Failed to generate full system backup (HTTP ${res.status})`);
    }
    return res.json();
  },

  async restoreFullSystemBackup(
    backupData: FullSystemBackupPackage,
    user?: User | null
  ): Promise<{ success: boolean; message: string; restoredCounts: any }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(backupData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Restore failed with status ${res.status}`);
    }
    return res.json();
  },

  async recordGoogleDriveBackupActivity(
    details: {
      fileId: string;
      fileName: string;
      fileSize?: number;
      driveLink?: string;
      status: 'success' | 'failed';
      error?: string;
      folderId?: string;
      folderName?: string;
    },
    user?: User | null
  ): Promise<{ success: boolean; googleDriveBackup: GoogleDriveBackupSettings }> {
    const res = await fetch('/api/backup/record-drive-backup', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(details)
    });
    return res.json();
  },

  async getDriveSession(user?: User | null): Promise<{
    isConnected: boolean;
    user: { displayName: string | null; email: string | null; photoURL: string | null; uid: string } | null;
    folderId?: string;
    folderName?: string;
    connectedAt?: string;
    lastActiveAt?: string;
    hasToken: boolean;
    expiresAt?: number;
    autoBackupSettings: GoogleDriveBackupSettings | null;
  }> {
    const res = await fetch('/api/backup/drive-session', {
      headers: getAuthHeaders(user)
    });
    return res.json();
  },

  async saveDriveSession(
    sessionData: {
      user: any;
      token?: string;
      folderId?: string;
      folderName?: string;
      expiresInSeconds?: number;
    },
    user?: User | null
  ): Promise<{ success: boolean; session: any }> {
    const res = await fetch('/api/backup/drive-session', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(sessionData)
    });
    return res.json();
  },

  async refreshDriveToken(
    token: string,
    expiresInSeconds?: number,
    user?: User | null
  ): Promise<{ success: boolean; expiresAt?: number }> {
    const res = await fetch('/api/backup/drive-session/refresh', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify({ token, expiresInSeconds })
    });
    return res.json();
  },

  async disconnectDriveSession(user?: User | null): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/drive-session/disconnect', {
      method: 'POST',
      headers: getAuthHeaders(user)
    });
    return res.json();
  }
};
