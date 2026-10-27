import { Router } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { multiDbService } from '../../multiDatabase.ts';

const router = Router();

// API: Full Website & Database Backup System
router.get('/full', async (req, res) => {
  try {
    // If MongoDB is connected and active, sync latest items, staff, settings
    if (mongoService.isLive) {
      try {
        const mItems = await mongoService.getItems().catch(() => null);
        if (mItems && mItems.length > 0) db.items = mItems;
        const mStaff = await mongoService.getStaff().catch(() => null);
        if (mStaff && mStaff.length > 0) db.staff = mStaff;
        const mSettings = await mongoService.getSettings().catch(() => null);
        if (mSettings) db.settings = mSettings;
        const mCerts = await mongoService.getCertificates().catch(() => null);
        if (mCerts && mCerts.length > 0) db.certificates = mCerts;
      } catch (e) {
        console.warn('[Backup] Mongo refresh before backup warning:', e);
      }
    }

    const backupPackage = {
      version: '2.5.0',
      timestamp: new Date().toISOString(),
      source: 'Warwick Hotel Lost & Found Management System',
      environment: process.env.NODE_ENV || 'production',
      hotelName: db.settings.hotelName || 'Warwick Hotel Al Baha',
      database: {
        items: db.items || [],
        staff: db.staff || [],
        users: (db.users || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          phone: u.phone,
          authProvider: u.authProvider
        })),
        settings: db.settings,
        certificates: db.certificates || [],
        certificateTemplates: db.certificateTemplates || [],
        auditLogs: db.auditLogs || [],
        notifications: db.notifications || []
      },
      websiteConfig: {
        publicWebsite: db.settings.publicWebsiteSettings,
        additionalLinks: db.settings.additionalLinks,
        categories: db.settings.categories,
        customColors: db.settings.customColors,
        themeMode: db.settings.themeMode,
        brandName: db.settings.hotelName
      },
      stats: {
        totalItems: (db.items || []).length,
        totalStaff: (db.staff || []).length,
        totalCertificates: (db.certificates || []).length,
        totalLogs: (db.auditLogs || []).length,
        totalTemplates: (db.certificateTemplates || []).length
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(backupPackage);
  } catch (err: any) {
    console.error('[API] /api/backup/full error:', err);
    res.status(500).json({ error: 'Failed to generate full backup: ' + err.message });
  }
});

router.post('/restore', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.database) {
      return res.status(400).json({ error: 'Invalid backup package. Missing database object.' });
    }

    const { items, staff, settings: restoredSettings, certificates, certificateTemplates } = payload.database;

    const restoredCounts = {
      items: 0,
      staff: 0,
      certificates: 0,
      templates: 0,
      settingsRestored: false
    };

    if (Array.isArray(items)) {
      db.items = items;
      restoredCounts.items = items.length;
    }

    if (Array.isArray(staff)) {
      db.staff = staff;
      restoredCounts.staff = staff.length;
    }

    if (Array.isArray(certificates)) {
      db.certificates = certificates;
      restoredCounts.certificates = certificates.length;
    }

    if (Array.isArray(certificateTemplates)) {
      db.certificateTemplates = certificateTemplates;
      restoredCounts.templates = certificateTemplates.length;
    }

    if (restoredSettings && typeof restoredSettings === 'object') {
      db.settings = {
        ...db.settings,
        ...restoredSettings,
        version: (db.settings.version || 1) + 1,
        lastSyncedAt: new Date().toISOString()
      };
      restoredCounts.settingsRestored = true;
    }

    // If MongoDB is active, synchronize all restored collections
    if (mongoService.isLive) {
      await mongoService.seedAllData({
        items: db.items,
        staff: db.staff,
        users: db.users,
        settings: db.settings,
        auditLogs: db.auditLogs
      }).catch(err => {
        console.warn('[Backup] Mongo seed on restore warning:', err);
      });
    }

    saveDatabase();

    multiDbService.broadcast('database_state_changed', {
      action: 'system_restored',
      timestamp: new Date().toISOString(),
      restoredCounts
    });

    res.json({
      success: true,
      message: 'Website database and system configuration successfully restored!',
      restoredCounts
    });
  } catch (err: any) {
    console.error('[API] /api/backup/restore error:', err);
    res.status(500).json({ error: 'Restoration failed: ' + err.message });
  }
});

router.post('/record-drive-backup', async (req, res) => {
  try {
    const {
      fileId,
      fileName,
      fileSize,
      driveLink,
      status,
      error,
      folderId,
      folderName
    } = req.body;

    if (!db.settings.googleDriveBackup) {
      db.settings.googleDriveBackup = {
        autoBackupEnabled: false,
        autoBackupFrequency: 'daily',
        autoBackupIncludeAuditLogs: true,
        autoBackupMaxFilesToKeep: 15
      };
    }

    db.settings.googleDriveBackup = {
      ...db.settings.googleDriveBackup,
      lastBackupDate: new Date().toISOString(),
      lastBackupFileId: fileId,
      lastBackupFileName: fileName,
      lastBackupFileSize: fileSize,
      lastBackupDriveLink: driveLink,
      lastBackupStatus: status || 'success',
      lastBackupError: error || undefined,
      backupFolderId: folderId || db.settings.googleDriveBackup.backupFolderId,
      backupFolderName: folderName || db.settings.googleDriveBackup.backupFolderName
    };

    saveDatabase();
    if (mongoService.isLive) {
      mongoService.updateSettings(db.settings).catch(() => {});
    }

    res.json({ success: true, googleDriveBackup: db.settings.googleDriveBackup });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Google Drive Persistent Session & Token Store (Prevent Automatic Disconnect)
// ============================================================================

interface StoredDriveSession {
  isConnected: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
  folderId?: string;
  folderName?: string;
  accessToken?: string;
  expiresAt?: number;
  connectedAt?: string;
  lastActiveAt?: string;
}

let activeDriveSession: StoredDriveSession = {
  isConnected: Boolean(db.settings?.googleDriveBackup?.isConnected),
  user: db.settings?.googleDriveBackup?.connectedEmail
    ? {
        displayName: db.settings.googleDriveBackup.connectedName || 'Google Account',
        email: db.settings.googleDriveBackup.connectedEmail,
        photoURL: db.settings.googleDriveBackup.connectedPhoto || null,
        uid: 'google-drive-user'
      }
    : null,
  folderId: db.settings?.googleDriveBackup?.backupFolderId,
  folderName: db.settings?.googleDriveBackup?.backupFolderName || 'Warwick Hotel Lost & Found Backups',
  connectedAt: db.settings?.googleDriveBackup?.connectedAt,
  lastActiveAt: new Date().toISOString()
};

// API: Get Google Drive Persistent Session Status
router.get('/drive-session', (req, res) => {
  const isConnected = Boolean(
    activeDriveSession.isConnected || db.settings?.googleDriveBackup?.isConnected
  );
  const user =
    activeDriveSession.user ||
    (db.settings?.googleDriveBackup?.connectedEmail
      ? {
          displayName: db.settings.googleDriveBackup.connectedName || 'Google Account',
          email: db.settings.googleDriveBackup.connectedEmail,
          photoURL: db.settings.googleDriveBackup.connectedPhoto || null,
          uid: 'google-drive-user'
        }
      : null);

  res.json({
    isConnected,
    user,
    folderId: activeDriveSession.folderId || db.settings?.googleDriveBackup?.backupFolderId,
    folderName:
      activeDriveSession.folderName ||
      db.settings?.googleDriveBackup?.backupFolderName ||
      'Warwick Hotel Lost & Found Backups',
    connectedAt: activeDriveSession.connectedAt || db.settings?.googleDriveBackup?.connectedAt,
    lastActiveAt: activeDriveSession.lastActiveAt,
    hasToken: Boolean(activeDriveSession.accessToken),
    expiresAt: activeDriveSession.expiresAt,
    autoBackupSettings: db.settings?.googleDriveBackup || null
  });
});

// API: Save / Update Persistent Google Drive Session
router.post('/drive-session', (req, res) => {
  try {
    const { user, token, folderId, folderName, expiresInSeconds } = req.body;

    if (!db.settings.googleDriveBackup) {
      db.settings.googleDriveBackup = {
        autoBackupEnabled: false,
        autoBackupFrequency: 'daily',
        autoBackupIncludeAuditLogs: true,
        autoBackupMaxFilesToKeep: 15
      };
    }

    const nowIso = new Date().toISOString();
    activeDriveSession.isConnected = true;
    activeDriveSession.user = user || activeDriveSession.user;
    if (folderId) activeDriveSession.folderId = folderId;
    if (folderName) activeDriveSession.folderName = folderName;
    if (token) activeDriveSession.accessToken = token;
    if (expiresInSeconds) activeDriveSession.expiresAt = Date.now() + Number(expiresInSeconds) * 1000;
    activeDriveSession.connectedAt = activeDriveSession.connectedAt || nowIso;
    activeDriveSession.lastActiveAt = nowIso;

    db.settings.googleDriveBackup.isConnected = true;
    db.settings.googleDriveBackup.connectedEmail = user?.email || db.settings.googleDriveBackup.connectedEmail;
    db.settings.googleDriveBackup.connectedName = user?.displayName || db.settings.googleDriveBackup.connectedName;
    db.settings.googleDriveBackup.connectedPhoto = user?.photoURL || db.settings.googleDriveBackup.connectedPhoto;
    db.settings.googleDriveBackup.connectedAt = activeDriveSession.connectedAt;
    if (folderId) db.settings.googleDriveBackup.backupFolderId = folderId;
    if (folderName) db.settings.googleDriveBackup.backupFolderName = folderName;

    saveDatabase();
    if (mongoService.isLive) {
      mongoService.updateSettings(db.settings).catch(() => {});
    }

    res.json({
      success: true,
      session: {
        isConnected: true,
        user: activeDriveSession.user,
        connectedAt: activeDriveSession.connectedAt,
        folderId: activeDriveSession.folderId,
        folderName: activeDriveSession.folderName
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save drive session: ' + err.message });
  }
});

// API: Refresh Token for Active Drive Session
router.post('/drive-session/refresh', (req, res) => {
  try {
    const { token, expiresInSeconds } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    activeDriveSession.accessToken = token;
    if (expiresInSeconds) {
      activeDriveSession.expiresAt = Date.now() + Number(expiresInSeconds) * 1000;
    }
    activeDriveSession.lastActiveAt = new Date().toISOString();

    if (db.settings.googleDriveBackup) {
      db.settings.googleDriveBackup.lastTokenRefreshAt = new Date().toISOString();
      saveDatabase();
      if (mongoService.isLive) {
        mongoService.updateSettings(db.settings).catch(() => {});
      }
    }

    res.json({
      success: true,
      expiresAt: activeDriveSession.expiresAt,
      lastActiveAt: activeDriveSession.lastActiveAt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to refresh token: ' + err.message });
  }
});

// API: Explicit Manual Disconnect (ONLY user-initiated disconnect kills the session)
router.post('/drive-session/disconnect', (req, res) => {
  try {
    activeDriveSession = {
      isConnected: false,
      user: null,
      folderId: undefined,
      folderName: undefined,
      accessToken: undefined,
      expiresAt: undefined,
      connectedAt: undefined,
      lastActiveAt: new Date().toISOString()
    };

    if (db.settings.googleDriveBackup) {
      db.settings.googleDriveBackup.isConnected = false;
      db.settings.googleDriveBackup.connectedEmail = undefined;
      db.settings.googleDriveBackup.connectedName = undefined;
      db.settings.googleDriveBackup.connectedPhoto = undefined;
      db.settings.googleDriveBackup.connectedAt = undefined;
      saveDatabase();
      if (mongoService.isLive) {
        mongoService.updateSettings(db.settings).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: 'Google Drive session explicitly disconnected.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to disconnect session: ' + err.message });
  }
});

export default router;
