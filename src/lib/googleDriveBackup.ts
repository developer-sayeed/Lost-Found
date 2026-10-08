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

// In-memory access token cache
let cachedAccessToken: string | null = null;
let cachedFolderId: string | null = null;
let cachedUserProfile: any = null;
let isSigningIn = false;

// Check sessionStorage on client-side startup to restore connection across local reloads
if (typeof window !== 'undefined') {
  try {
    const savedToken = sessionStorage.getItem('gdrive_access_token');
    const savedProfile = sessionStorage.getItem('gdrive_user_profile');
    if (savedToken) {
      cachedAccessToken = savedToken;
      if (savedProfile) {
        cachedUserProfile = JSON.parse(savedProfile);
      }
    }
  } catch {}
}

export interface GoogleDriveAuthState {
  isAuthenticated: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
  hasToken: boolean;
  unauthorizedDomain?: string;
}

let authListeners: ((state: GoogleDriveAuthState) => void)[] = [];

function notifyAuthListeners(user: FirebaseUser | any | null, token: string | null, unauthorizedDomain?: string) {
  const effectiveUser = user || cachedUserProfile;
  const state: GoogleDriveAuthState = {
    isAuthenticated: Boolean(effectiveUser && token),
    user: effectiveUser
      ? {
          displayName: effectiveUser.displayName || 'Google Account',
          email: effectiveUser.email || null,
          photoURL: effectiveUser.photoURL || null,
          uid: effectiveUser.uid || 'google-user'
        }
      : null,
    hasToken: Boolean(token),
    unauthorizedDomain
  };
  authListeners.forEach(listener => listener(state));
}

/**
 * Fetch Google account profile using access token
 */
export const fetchGoogleUserProfile = async (accessToken: string) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        displayName: data.name || data.email || 'Google User',
        email: data.email || null,
        photoURL: data.picture || null,
        uid: data.sub || 'google-user'
      };
    }
  } catch {}

  // Fallback to Drive about endpoint
  try {
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (aboutRes.ok) {
      const data = await aboutRes.json();
      return {
        displayName: data.user?.displayName || 'Google Drive User',
        email: data.user?.emailAddress || null,
        photoURL: data.user?.photoLink || null,
        uid: data.user?.permissionId || 'google-user'
      };
    }
  } catch {}

  return {
    displayName: 'Google Account',
    email: 'Connected User',
    photoURL: null,
    uid: 'google-user'
  };
};

/**
 * Dynamically loads Google Identity Services (GIS) client script if not already present
 */
export const loadGisScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise(resolve => {
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

/**
 * Request Google Drive access token directly via Google Identity Services
 */
export const requestAccessTokenViaGis = async (): Promise<{ user: any; accessToken: string }> => {
  await loadGisScript();
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services script is not loaded.');
  }

  const clientId = firebaseConfig.oAuthClientId;
  if (!clientId) {
    throw new Error('OAuth Client ID is not configured.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (!response.access_token) {
            reject(new Error('No access token returned by Google authentication.'));
            return;
          }
          try {
            const profile = await fetchGoogleUserProfile(response.access_token);
            cachedAccessToken = response.access_token;
            cachedUserProfile = profile;
            try {
              sessionStorage.setItem('gdrive_access_token', response.access_token);
              sessionStorage.setItem('gdrive_user_profile', JSON.stringify(profile));
            } catch {}
            notifyAuthListeners(profile, cachedAccessToken);
            resolve({ user: profile, accessToken: cachedAccessToken });
          } catch (profileErr) {
            reject(profileErr);
          }
        }
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Connect directly using a Google OAuth Access Token (instant local connection)
 */
export const connectWithDirectToken = async (token: string): Promise<{ user: any; accessToken: string }> => {
  const clean = token.trim();
  if (!clean) {
    throw new Error('Please enter a valid Google OAuth access token.');
  }

  // Validate token with Google APIs
  const profile = await fetchGoogleUserProfile(clean);
  cachedAccessToken = clean;
  cachedUserProfile = profile;

  try {
    sessionStorage.setItem('gdrive_access_token', clean);
    sessionStorage.setItem('gdrive_user_profile', JSON.stringify(profile));
  } catch {}

  notifyAuthListeners(profile, cachedAccessToken);
  return {
    user: profile,
    accessToken: clean
  };
};

/**
 * Initialize auth state listener. Call this on app/module load.
 */
export const initGoogleDriveAuth = (
  onStateChange: (state: GoogleDriveAuthState) => void
): (() => void) => {
  authListeners.push(onStateChange);

  // Trigger initial state immediately (including restored session token if available)
  const currentUser = auth.currentUser || cachedUserProfile;
  notifyAuthListeners(currentUser, cachedAccessToken);

  const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (!cachedAccessToken && !isSigningIn) {
        cachedAccessToken = null;
      }
    } else if (!cachedAccessToken) {
      cachedAccessToken = null;
    }
    notifyAuthListeners(user || cachedUserProfile, cachedAccessToken);
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
  user: any;
  accessToken: string;
}> => {
  isSigningIn = true;
  const currentHost = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';

  try {
    // Attempt 1: Standard Firebase Auth popup
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned by Google Authentication.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUserProfile = result.user;
    try {
      sessionStorage.setItem('gdrive_access_token', cachedAccessToken);
      sessionStorage.setItem('gdrive_user_profile', JSON.stringify({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        uid: result.user.uid
      }));
    } catch {}

    notifyAuthListeners(result.user, cachedAccessToken);

    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // If unauthorized-domain occurs (e.g. localhost or custom dev domain not added to Firebase Authorized Domains)
    if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
      console.warn(`[Google Drive Auth] Firebase domain authorization needed for "${currentHost}". Trying GIS fallback...`);

      // Attempt 2: Try Google Identity Services
      try {
        const gisResult = await requestAccessTokenViaGis();
        return gisResult;
      } catch (gisError: any) {
        console.warn('[Google Drive Auth] GIS fallback encountered:', gisError);
        const detailedError: any = new Error(
          `Firebase: Error (auth/unauthorized-domain). The current domain "${currentHost}" is not authorized in Firebase Console. You can add "${currentHost}" in Firebase Console -> Authentication -> Settings -> Authorized Domains, or connect directly using an Access Token.`
        );
        detailedError.code = 'auth/unauthorized-domain';
        detailedError.currentHost = currentHost;
        throw detailedError;
      }
    }

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
    cachedUserProfile = null;
    try {
      sessionStorage.removeItem('gdrive_access_token');
      sessionStorage.removeItem('gdrive_user_profile');
    } catch {}
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
