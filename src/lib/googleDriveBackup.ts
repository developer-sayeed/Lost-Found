import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleDriveBackupFile, FullSystemBackupPackage } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive File scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'consent'
});

// In-memory access token cache (MANDATORY: Never store access token in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedFolderId: string | null = null;
let isSigningIn = false;

export interface GoogleDriveAuthState {
  isAuthenticated: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
  hasToken: boolean;
}

let authListeners: ((state: GoogleDriveAuthState) => void)[] = [];

function notifyAuthListeners(user: FirebaseUser | null, token: string | null) {
  const state: GoogleDriveAuthState = {
    isAuthenticated: Boolean(user && token),
    user: user
      ? {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        }
      : null,
    hasToken: Boolean(token)
  };
  authListeners.forEach(listener => listener(state));
}

/**
 * Initialize auth state listener. Call this on app/module load.
 */
export const initGoogleDriveAuth = (
  onStateChange: (state: GoogleDriveAuthState) => void
): (() => void) => {
  authListeners.push(onStateChange);

  // Trigger initial state immediately
  const currentUser = auth.currentUser;
  notifyAuthListeners(currentUser, cachedAccessToken);

  const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (!cachedAccessToken && !isSigningIn) {
        // Token may have expired or is not cached in this fresh session
        cachedAccessToken = null;
      }
    } else {
      cachedAccessToken = null;
    }
    notifyAuthListeners(user, cachedAccessToken);
  });

  return () => {
    authListeners = authListeners.filter(l => l !== onStateChange);
    unsubscribe();
  };
};

/**
 * Interactive Sign in with Google requesting Google Drive scope.
 * Must be triggered by user interaction (button click).
 */
export const signInWithGoogleDrive = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned by Google Authentication.');
    }

    cachedAccessToken = credential.accessToken;
    notifyAuthListeners(result.user, cachedAccessToken);

    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    console.error('[Google Drive Auth] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token.
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Disconnect and sign out from Google Drive.
 */
export const disconnectGoogleDrive = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Google Drive Auth] Error signing out:', err);
  } finally {
    cachedAccessToken = null;
    cachedFolderId = null;
    notifyAuthListeners(null, null);
  }
};

// ============================================================================
// Google Drive v3 REST API Integration
// ============================================================================

const DRIVE_API_ROOT = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_ROOT = 'https://www.googleapis.com/upload/drive/v3';
export const DEFAULT_BACKUP_FOLDER_NAME = 'Warwick Hotel Lost & Found Backups';

/**
 * Ensures the dedicated backup folder exists in user's Google Drive.
 * Returns the folder ID, or undefined to fallback to Drive root.
 */
export const ensureDriveBackupFolder = async (accessToken: string): Promise<string | undefined> => {
  if (cachedFolderId) {
    return cachedFolderId;
  }

  try {
    // 1. Check if folder already exists
    const query = encodeURIComponent(`name='${DEFAULT_BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const searchRes = await fetch(
      `${DRIVE_API_ROOT}/files?q=${query}&fields=files(id,name)&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        cachedFolderId = searchData.files[0].id;
        return cachedFolderId;
      }
    }

    // 2. Create the folder if not present
    const createRes = await fetch(`${DRIVE_API_ROOT}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: DEFAULT_BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Automated and manual snapshots for Warwick Hotel Lost & Found website database and system configuration.'
      })
    });

    if (createRes.ok) {
      const newFolder = await createRes.json();
      cachedFolderId = newFolder.id;
      return cachedFolderId;
    } else {
      const errJson = await createRes.json().catch(() => ({}));
      console.warn('[Google Drive] Folder create warning, falling back to root:', errJson);
      return undefined;
    }
  } catch (err: any) {
    console.warn('[Google Drive] Folder resolution warning, continuing with root storage:', err);
    return undefined;
  }
};

/**
 * Lists all system backups stored in Google Drive.
 */
export const listGoogleDriveBackups = async (
  accessToken: string,
  folderId?: string
): Promise<GoogleDriveBackupFile[]> => {
  try {
    let query = `trashed=false and (name contains 'warwick_' or name contains 'backup')`;
    if (folderId) {
      query = `'${folderId}' in parents and trashed=false`;
    }

    const url = `${DRIVE_API_ROOT}/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&orderBy=createdTime desc&pageSize=50`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to list files from Google Drive (HTTP ${res.status})`);
    }

    const data = await res.json();
    const files: GoogleDriveBackupFile[] = (data.files || []).map((f: any) => {
      let recordsCount: GoogleDriveBackupFile['recordsCount'] = undefined;
      if (f.description) {
        try {
          const matchItems = f.description.match(/Items: (\d+)/);
          const matchStaff = f.description.match(/Staff: (\d+)/);
          const matchCerts = f.description.match(/Certs: (\d+)/);
          if (matchItems || matchStaff || matchCerts) {
            recordsCount = {
              items: matchItems ? parseInt(matchItems[1], 10) : undefined,
              staff: matchStaff ? parseInt(matchStaff[1], 10) : undefined,
              certificates: matchCerts ? parseInt(matchCerts[1], 10) : undefined
            };
          }
        } catch {}
      }

      return {
        id: f.id,
        name: f.name,
        size: f.size,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink,
        webContentLink: f.webContentLink,
        description: f.description,
        recordsCount
      };
    });

    return files;
  } catch (err: any) {
    console.error('[Google Drive] List backups error:', err);
    throw err;
  }
};

/**
 * Uploads a full website & database backup package to Google Drive using multipart upload.
 */
export const uploadBackupToGoogleDrive = async (
  accessToken: string,
  backupData: FullSystemBackupPackage,
  folderId?: string
): Promise<GoogleDriveBackupFile> => {
  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `warwick_full_backup_${timestampStr}.json`;

    const description = `Warwick Hotel L&F Full Backup | Items: ${backupData.stats.totalItems} | Staff: ${backupData.stats.totalStaff} | Certs: ${backupData.stats.totalCertificates} | Date: ${new Date().toLocaleString()}`;

    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: 'application/json',
      description
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const jsonContent = JSON.stringify(backupData, null, 2);

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const res = await fetch(
      `${DRIVE_UPLOAD_ROOT}/files?uploadType=multipart&fields=id,name,size,createdTime,webViewLink,webContentLink,description`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to upload backup to Google Drive (HTTP ${res.status})`);
    }

    const uploaded = await res.json();
    return {
      id: uploaded.id,
      name: uploaded.name,
      size: uploaded.size,
      createdTime: uploaded.createdTime,
      webViewLink: uploaded.webViewLink,
      webContentLink: uploaded.webContentLink,
      description: uploaded.description,
      recordsCount: {
        items: backupData.stats.totalItems,
        staff: backupData.stats.totalStaff,
        certificates: backupData.stats.totalCertificates,
        logs: backupData.stats.totalLogs
      }
    };
  } catch (err: any) {
    console.error('[Google Drive] Upload error:', err);
    throw err;
  }
};

/**
 * Downloads full backup content from Google Drive for restoration.
 */
export const downloadBackupFromGoogleDrive = async (
  accessToken: string,
  fileId: string
): Promise<FullSystemBackupPackage> => {
  try {
    const res = await fetch(`${DRIVE_API_ROOT}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download backup file from Google Drive (HTTP ${res.status})`);
    }

    const data: FullSystemBackupPackage = await res.json();
    return data;
  } catch (err: any) {
    console.error('[Google Drive] Download error:', err);
    throw err;
  }
};

/**
 * Deletes a backup from Google Drive.
 * (Note: Caller MUST confirm with user first as per workspace-integration rules).
 */
export const deleteBackupFromGoogleDrive = async (
  accessToken: string,
  fileId: string
): Promise<boolean> => {
  try {
    const res = await fetch(`${DRIVE_API_ROOT}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete file from Google Drive (HTTP ${res.status})`);
    }

    return true;
  } catch (err: any) {
    console.error('[Google Drive] Delete file error:', err);
    throw err;
  }
};

/**
 * Automatically prunes old backups in Google Drive so storage doesn't grow unbounded.
 * Keeps the latest `maxToKeep` files.
 */
export const pruneOldDriveBackups = async (
  accessToken: string,
  maxToKeep: number = 10,
  folderId?: string
): Promise<number> => {
  try {
    const backups = await listGoogleDriveBackups(accessToken, folderId);
    if (backups.length <= maxToKeep) {
      return 0;
    }

    // Sort descending by createdTime, slice files beyond maxToKeep
    const sorted = [...backups].sort(
      (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );
    const toDelete = sorted.slice(maxToKeep);

    let deletedCount = 0;
    for (const file of toDelete) {
      try {
        await deleteBackupFromGoogleDrive(accessToken, file.id);
        deletedCount++;
      } catch (e) {
        console.warn(`Failed to prune old backup ${file.id}:`, e);
      }
    }

    return deletedCount;
  } catch (err) {
    console.warn('[Google Drive] Pruning error:', err);
    return 0;
  }
};
