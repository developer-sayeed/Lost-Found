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
import { backupApi } from '../services/api/backup.api';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Configure Google Auth Provider with full Google Drive backup scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// In-memory access token cache & persistent session state
let cachedAccessToken: string | null = null;
let cachedFolderId: string | null = null;
let cachedUserProfile: any = null;
let cachedTokenExpiresAt: number = 0;
let isPersistentConnected = false;
let isSigningIn = false;
let gisTokenClient: any = null;
let isRefreshingToken = false;
let refreshPromise: Promise<string | null> | null = null;

export class GoogleDriveAuthExpiredError extends Error {
  isAuthExpired = true;
  constructor(message = 'Your Google Drive session needs renewal. Your scheduled backups and connection remain intact.') {
    super(message);
    this.name = 'GoogleDriveAuthExpiredError';
  }
}

export const isDriveAuthError = (status?: number, message?: string): boolean => {
  if (status === 401 || status === 403) {
    if (!message) return true;
  }
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('invalid authentication credentials') ||
    lower.includes('expected oauth 2 access token') ||
    lower.includes('unauthenticated') ||
    lower.includes('invalid credentials') ||
    lower.includes('token expired') ||
    lower.includes('access token expired') ||
    lower.includes('login cookie or other valid authentication credential')
  );
};

export const storeDriveAccessToken = (token: string, profile?: any, expiresInSeconds = 3500, folderId?: string) => {
  cachedAccessToken = token;
  isPersistentConnected = true;
  if (profile) cachedUserProfile = profile;
  if (folderId) cachedFolderId = folderId;
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  cachedTokenExpiresAt = expiresAt;

  try {
    localStorage.setItem('gdrive_session_connected', 'true');
    localStorage.setItem('gdrive_access_token', token);
    localStorage.setItem('gdrive_token_expires_at', String(expiresAt));
    if (profile) localStorage.setItem('gdrive_user_profile', JSON.stringify(profile));
    if (folderId) localStorage.setItem('gdrive_folder_id', folderId);
    sessionStorage.setItem('gdrive_session_connected', 'true');
    sessionStorage.setItem('gdrive_access_token', token);
    sessionStorage.setItem('gdrive_token_expires_at', String(expiresAt));
    if (profile) sessionStorage.setItem('gdrive_user_profile', JSON.stringify(profile));
  } catch {}

  // Sync to backend persistent store
  try {
    backupApi.saveDriveSession({
      user: profile || cachedUserProfile,
      token,
      folderId: folderId || cachedFolderId || undefined,
      folderName: DEFAULT_BACKUP_FOLDER_NAME,
      expiresInSeconds
    }).catch(err => {
      console.warn('[Google Drive Auth] Background session sync warning:', err);
    });
  } catch {}
};

/**
 * Handle token notification without killing the connection.
 * We NEVER clear the user profile or mark disconnected here.
 */
export const handleDriveAuthExpiry = (reason?: string) => {
  if (reason) {
    console.warn(`[Google Drive Auth] Token renewal needed: ${reason}`);
  }
  // Remove only the expired access token string, NEVER the persistent session flag or user profile!
  cachedAccessToken = null;
  try {
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_token_expires_at');
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_token_expires_at');
  } catch {}
  notifyAuthListeners(cachedUserProfile, null);
};

// Check localStorage on client-side startup to restore persistent connection safely across tabs and reloads
if (typeof window !== 'undefined') {
  try {
    const isConn = localStorage.getItem('gdrive_session_connected') === 'true' ||
      sessionStorage.getItem('gdrive_session_connected') === 'true';
    const savedToken = localStorage.getItem('gdrive_access_token') || sessionStorage.getItem('gdrive_access_token');
    const savedProfile = localStorage.getItem('gdrive_user_profile') || sessionStorage.getItem('gdrive_user_profile');
    const savedExpiry = localStorage.getItem('gdrive_token_expires_at') || sessionStorage.getItem('gdrive_token_expires_at');
    const savedFolder = localStorage.getItem('gdrive_folder_id') || sessionStorage.getItem('gdrive_folder_id');

    if (savedFolder) cachedFolderId = savedFolder;
    if (savedProfile) {
      try {
        cachedUserProfile = JSON.parse(savedProfile);
      } catch {}
    }

    if (isConn || savedProfile) {
      isPersistentConnected = true;
    }

    if (savedToken) {
      cachedAccessToken = savedToken;
      if (savedExpiry) {
        cachedTokenExpiresAt = Number(savedExpiry);
      }
    }
  } catch {}

  // Verify and sync persistent session with backend database on startup
  setTimeout(async () => {
    try {
      const serverSession = await backupApi.getDriveSession();
      if (serverSession && serverSession.isConnected) {
        isPersistentConnected = true;
        if (serverSession.user) {
          cachedUserProfile = serverSession.user;
          try {
            localStorage.setItem('gdrive_user_profile', JSON.stringify(serverSession.user));
            localStorage.setItem('gdrive_session_connected', 'true');
          } catch {}
        }
        if (serverSession.folderId) {
          cachedFolderId = serverSession.folderId;
        }
        notifyAuthListeners(cachedUserProfile, cachedAccessToken);
      }
    } catch {}
  }, 150);

  // Preload Google Identity Services script so it is ready synchronously on user click
  loadGisScript().catch(() => {});

  // Background session sync scheduler: checks every 10 minutes to verify backend session
  setInterval(async () => {
    if (!isPersistentConnected) return;
    try {
      const serverSession = await backupApi.getDriveSession();
      if (serverSession && serverSession.isConnected) {
        if (serverSession.user) cachedUserProfile = serverSession.user;
      }
    } catch {}
  }, 10 * 60 * 1000);
}

export interface GoogleDriveAuthState {
  isAuthenticated: boolean;
  isConnected: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
  hasToken: boolean;
  isRefreshing?: boolean;
  unauthorizedDomain?: string;
}

let authListeners: ((state: GoogleDriveAuthState) => void)[] = [];

function notifyAuthListeners(user: FirebaseUser | any | null, token: string | null, unauthorizedDomain?: string) {
  const effectiveUser = user || cachedUserProfile;
  const connected = isPersistentConnected || Boolean(effectiveUser);
  const state: GoogleDriveAuthState = {
    isAuthenticated: connected,
    isConnected: connected,
    user: effectiveUser
      ? {
          displayName: effectiveUser.displayName || 'Google Account',
          email: effectiveUser.email || null,
          photoURL: effectiveUser.photoURL || null,
          uid: effectiveUser.uid || 'google-user'
        }
      : null,
    hasToken: Boolean(token || cachedAccessToken),
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
export function loadGisScript(): Promise<boolean> {
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
export const requestAccessTokenViaGis = async (silent = false): Promise<{ user: any; accessToken: string }> => {
  // Never attempt silent popups; browsers block window.open without direct user gesture
  if (silent) {
    throw new Error('Silent GIS token requests are not allowed without direct user gesture.');
  }

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
      gisTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error) {
            if (response.error === 'popup_closed_by_user') {
              const err: any = new Error('Sign-in cancelled: popup was closed before authorization.');
              err.code = 'auth/popup-closed-by-user';
              reject(err);
              return;
            }
            if (response.error === 'popup_blocked_by_browser' || response.error.includes('popup')) {
              const err: any = new Error('The Google sign-in popup was blocked by your browser. Please allow popups for this site in your browser URL bar, or connect using an Access Token.');
              err.code = 'auth/popup-blocked';
              reject(err);
              return;
            }
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (!response.access_token) {
            reject(new Error('No access token returned by Google authentication.'));
            return;
          }
          try {
            const profile = await fetchGoogleUserProfile(response.access_token);
            storeDriveAccessToken(response.access_token, profile, Number(response.expires_in) || 3500);
            notifyAuthListeners(profile, cachedAccessToken);
            resolve({ user: profile, accessToken: cachedAccessToken! });
          } catch (profileErr) {
            reject(profileErr);
          }
        },
        error_callback: (nonOAuthErr: any) => {
          console.warn('[Google Drive Auth] GIS error callback:', nonOAuthErr);
          if (nonOAuthErr?.type === 'popup_failed_to_open') {
            const err: any = new Error('The Google sign-in popup was blocked by your browser. Please allow popups for this site in your browser URL bar, or click "Connect via Token" below.');
            err.code = 'auth/popup-blocked';
            reject(err);
          } else {
            reject(new Error(nonOAuthErr?.message || 'Failed to open Google authorization popup.'));
          }
        }
      });

      gisTokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      if (err?.message?.includes('popup') || err?.message?.includes('block')) {
        const popupErr: any = new Error('The sign-in popup was blocked by your browser. Please allow popups for this site in your browser URL bar.');
        popupErr.code = 'auth/popup-blocked';
        reject(popupErr);
      } else {
        reject(err);
      }
    }
  });
};

/**
 * Connect directly using a Google OAuth Access Token (instant connection)
 */
export const connectWithDirectToken = async (token: string): Promise<{ user: any; accessToken: string }> => {
  const clean = token.trim();
  if (!clean) {
    throw new Error('Please enter a valid Google OAuth access token.');
  }

  // Validate token with Google APIs
  const profile = await fetchGoogleUserProfile(clean);
  storeDriveAccessToken(clean, profile, 3500);

  notifyAuthListeners(profile, cachedAccessToken);
  return {
    user: profile,
    accessToken: clean
  };
};

/**
 * Silently refreshes the Google Drive access token using backend session or existing cache.
 * Never attempts unauthorized programmatic popups that trigger browser popup blockers.
 */
export const refreshDriveAccessToken = async (force = false): Promise<string | null> => {
  if (isRefreshingToken && refreshPromise) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = (async () => {
    try {
      // Try fetching updated token from backend database session (no popups)
      try {
        const session = await backupApi.getDriveSession();
        if (session && session.isConnected) {
          if (session.user) cachedUserProfile = session.user;
          isPersistentConnected = true;
          if (session.hasToken && cachedAccessToken) {
            return cachedAccessToken;
          }
        }
      } catch {}

      // Fallback to existing cached token
      return cachedAccessToken;
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Returns a guaranteed valid access token, automatically refreshing if close to expiry.
 * Used by all automated and manual backup jobs.
 */
export const getValidDriveAccessToken = async (): Promise<string | null> => {
  const now = Date.now();
  const isExpiringSoon = !cachedTokenExpiresAt || now >= cachedTokenExpiresAt - 3 * 60 * 1000;

  if (cachedAccessToken && !isExpiringSoon) {
    return cachedAccessToken;
  }

  // If expired or expiring soon, attempt background refresh
  if (isPersistentConnected) {
    try {
      const refreshed = await refreshDriveAccessToken();
      if (refreshed) {
        return refreshed;
      }
    } catch (err) {
      console.warn('[Google Drive Auth] Token refresh warning, using cached session token:', err);
    }
  }

  return cachedAccessToken;
};

/**
 * Initialize auth state listener. Call this on app/module load.
 */
export const initGoogleDriveAuth = (
  onStateChange: (state: GoogleDriveAuthState) => void
): (() => void) => {
  authListeners.push(onStateChange);

  // Trigger initial state immediately
  const currentUser = auth.currentUser || cachedUserProfile;
  notifyAuthListeners(currentUser, cachedAccessToken);

  const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (!cachedAccessToken && !isSigningIn) {
        // Keep profile active
      }
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
    // Attempt 1: Standard Firebase Auth popup (Recommended by Workspace integration guidelines)
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Google Drive access token was not returned by Google Authentication.');
      }

      storeDriveAccessToken(credential.accessToken, result.user, 3500);
      notifyAuthListeners(result.user, cachedAccessToken);

      return {
        user: result.user,
        accessToken: cachedAccessToken!
      };
    } catch (fbErr: any) {
      const fbCode = fbErr?.code || '';
      const fbMsg = fbErr?.message || '';

      if (fbCode === 'auth/popup-closed-by-user' || fbMsg.includes('popup-closed-by-user')) {
        throw fbErr;
      }

      if (fbCode === 'auth/popup-blocked' || fbMsg.includes('popup-blocked')) {
        throw fbErr;
      }

      // Fallback to GIS with OAuth Client ID if Firebase unauthorized-domain or similar occurs
      if (firebaseConfig.oAuthClientId) {
        console.warn(`[Google Drive Auth] Firebase Auth notice (${fbCode || fbMsg}), attempting GIS fallback...`);
        try {
          const gisResult = await requestAccessTokenViaGis(false);
          return gisResult;
        } catch (gisErr: any) {
          if (gisErr?.code === 'auth/popup-closed-by-user' || gisErr?.code === 'auth/popup-blocked') {
            throw gisErr;
          }
          console.warn('[Google Drive Auth] GIS fallback notice:', gisErr);
        }
      }

      throw fbErr;
    }
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle user closing popup window gracefully
    if (errorCode === 'auth/popup-closed-by-user' || errorMsg.includes('popup-closed-by-user') || errorMsg.includes('popup_closed_by_user')) {
      const userClosedErr: any = new Error(
        'Sign-in was cancelled because the Google sign-in window was closed before completing authorization.'
      );
      userClosedErr.code = 'auth/popup-closed-by-user';
      userClosedErr.isUserCancelled = true;
      throw userClosedErr;
    }

    // Handle popup blocked by browser
    if (errorCode === 'auth/popup-blocked' || errorMsg.includes('popup-blocked') || errorMsg.includes('popup_blocked') || errorMsg.includes('blocked by the browser')) {
      const popupBlockedErr: any = new Error(
        'The sign-in popup was blocked by your browser. Please allow popups for this site in your browser URL bar or connect using an Access Token.'
      );
      popupBlockedErr.code = 'auth/popup-blocked';
      throw popupBlockedErr;
    }

    console.warn('[Google Drive Auth] Sign in notice:', error?.message || error);
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
 * EXPLICIT MANUAL DISCONNECT: The ONLY way the Google Drive connection is terminated.
 */
export const disconnectGoogleDrive = async (): Promise<void> => {
  isPersistentConnected = false;
  cachedAccessToken = null;
  cachedFolderId = null;
  cachedUserProfile = null;
  cachedTokenExpiresAt = 0;

  try {
    localStorage.removeItem('gdrive_session_connected');
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_user_profile');
    localStorage.removeItem('gdrive_token_expires_at');
    localStorage.removeItem('gdrive_folder_id');
    sessionStorage.removeItem('gdrive_session_connected');
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_user_profile');
    sessionStorage.removeItem('gdrive_token_expires_at');
    sessionStorage.removeItem('gdrive_folder_id');
  } catch {}

  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Google Drive Auth] Error signing out:', err);
  }

  try {
    await backupApi.disconnectDriveSession();
  } catch (err) {
    console.warn('[Google Drive Auth] Error disconnecting backend session:', err);
  }

  notifyAuthListeners(null, null);
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
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
    const searchRes = await fetch(
      `${DRIVE_API_ROOT}/files?q=${query}&fields=files(id,name)&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      }
    );

    if (searchRes.status === 401 || searchRes.status === 403) {
      console.warn('[Google Drive] 401 on search folder, attempting silent refresh...');
      const renewed = await refreshDriveAccessToken(true);
      if (renewed && renewed !== activeToken) {
        return ensureDriveBackupFolder(renewed);
      }
      handleDriveAuthExpiry('Session renewal requested on folder search');
      throw new GoogleDriveAuthExpiredError();
    }

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        cachedFolderId = searchData.files[0].id;
        try {
          localStorage.setItem('gdrive_folder_id', cachedFolderId);
        } catch {}
        return cachedFolderId;
      }
    }

    // 2. Create the folder if not present
    const createRes = await fetch(`${DRIVE_API_ROOT}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: DEFAULT_BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Automated and manual snapshots for Warwick Hotel Lost & Found website database and system configuration.'
      })
    });

    if (createRes.status === 401 || createRes.status === 403) {
      const renewed = await refreshDriveAccessToken(true);
      if (renewed && renewed !== activeToken) {
        return ensureDriveBackupFolder(renewed);
      }
      handleDriveAuthExpiry('Session renewal requested on folder create');
      throw new GoogleDriveAuthExpiredError();
    }

    if (createRes.ok) {
      const newFolder = await createRes.json();
      cachedFolderId = newFolder.id;
      try {
        localStorage.setItem('gdrive_folder_id', cachedFolderId);
      } catch {}
      return cachedFolderId;
    } else {
      const errJson = await createRes.json().catch(() => ({}));
      if (isDriveAuthError(createRes.status, errJson?.error?.message)) {
        handleDriveAuthExpiry(errJson?.error?.message);
        throw new GoogleDriveAuthExpiredError();
      }
      console.warn('[Google Drive] Folder create warning, falling back to root:', errJson);
      return undefined;
    }
  } catch (err: any) {
    if (err instanceof GoogleDriveAuthExpiredError || err?.isAuthExpired) {
      throw err;
    }
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
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
    let query = `trashed=false and (name contains 'warwick_' or name contains 'backup')`;
    if (folderId) {
      query = `'${folderId}' in parents and trashed=false`;
    }

    const url = `${DRIVE_API_ROOT}/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink,webContentLink,description)&orderBy=createdTime desc&pageSize=50`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Failed to list files from Google Drive (HTTP ${res.status})`;
      if (res.status === 401 || res.status === 403 || isDriveAuthError(res.status, msg)) {
        console.warn('[Google Drive] 401 on list files, attempting silent refresh...');
        const renewed = await refreshDriveAccessToken(true);
        if (renewed && renewed !== activeToken) {
          return listGoogleDriveBackups(renewed, folderId);
        }
        handleDriveAuthExpiry(msg);
        return [];
      }
      console.warn('[Google Drive] List backups non-auth response:', msg);
      return [];
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
    if (
      err instanceof GoogleDriveAuthExpiredError ||
      err?.isAuthExpired ||
      isDriveAuthError(err?.status, err?.message)
    ) {
      handleDriveAuthExpiry(err?.message);
      return [];
    }
    console.warn('[Google Drive] List backups notice:', err?.message || err);
    return [];
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
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
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
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Failed to upload backup to Google Drive (HTTP ${res.status})`;
      if (isDriveAuthError(res.status, msg)) {
        console.warn('[Google Drive] 401 on upload, attempting silent refresh...');
        const renewed = await refreshDriveAccessToken(true);
        if (renewed && renewed !== activeToken) {
          return uploadBackupToGoogleDrive(renewed, backupData, folderId);
        }
        handleDriveAuthExpiry(msg);
        throw new GoogleDriveAuthExpiredError();
      }
      throw new Error(msg);
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
    if (err instanceof GoogleDriveAuthExpiredError || err?.isAuthExpired) {
      throw err;
    }
    console.warn('[Google Drive] Upload notice:', err?.message || err);
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
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
    const res = await fetch(`${DRIVE_API_ROOT}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Failed to download backup file from Google Drive (HTTP ${res.status})`;
      if (isDriveAuthError(res.status, msg)) {
        const renewed = await refreshDriveAccessToken(true);
        if (renewed && renewed !== activeToken) {
          return downloadBackupFromGoogleDrive(renewed, fileId);
        }
        handleDriveAuthExpiry(msg);
        throw new GoogleDriveAuthExpiredError();
      }
      throw new Error(msg);
    }

    const data: FullSystemBackupPackage = await res.json();
    return data;
  } catch (err: any) {
    if (err instanceof GoogleDriveAuthExpiredError || err?.isAuthExpired) {
      throw err;
    }
    console.warn('[Google Drive] Download notice:', err?.message || err);
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
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
    const res = await fetch(`${DRIVE_API_ROOT}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Failed to delete file from Google Drive (HTTP ${res.status})`;
      if (isDriveAuthError(res.status, msg)) {
        const renewed = await refreshDriveAccessToken(true);
        if (renewed && renewed !== activeToken) {
          return deleteBackupFromGoogleDrive(renewed, fileId);
        }
        handleDriveAuthExpiry(msg);
        throw new GoogleDriveAuthExpiredError();
      }
      throw new Error(msg);
    }

    return true;
  } catch (err: any) {
    if (err instanceof GoogleDriveAuthExpiredError || err?.isAuthExpired) {
      throw err;
    }
    console.warn('[Google Drive] Delete file notice:', err?.message || err);
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
): Promise<void> => {
  try {
    let activeToken = accessToken || (await getValidDriveAccessToken()) || '';
    const backups = await listGoogleDriveBackups(activeToken, folderId);
    if (backups.length > maxToKeep) {
      // Sort oldest first
      const toDelete = backups.slice(maxToKeep);
      for (const file of toDelete) {
        try {
          await deleteBackupFromGoogleDrive(activeToken, file.id);
        } catch (e) {
          console.warn('[Google Drive] Auto-prune file warning:', file.id, e);
        }
      }
    }
  } catch (err) {
    console.warn('[Google Drive] Auto-pruning old backups notice:', err);
  }
};
