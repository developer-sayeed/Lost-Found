import express from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { createNotificationHelper } from '../../utils/notification.helper.ts';
import { User, DEFAULT_ROLE_PERMISSIONS } from '../../../src/types.ts';
import { cloudinaryService } from '../media/cloudinary.service.ts';

export const settingsRouter = express.Router();

// ----------------------------------------------------
// 1. Get Settings
// ----------------------------------------------------
settingsRouter.get('/api/settings', async (req, res) => {
  let settingsData = db.settings;
  if (mongoService.isLive) {
    try {
      const mongoSettings = await mongoService.getSettings();
      if (mongoSettings) {
        settingsData = mongoSettings;
        db.settings = mongoSettings;
      }
    } catch (e) {
      console.warn('Error reading settings from MongoDB:', e);
    }
  }

  res.json({
    settings: {
      ...settingsData,
      syncedDevicesCount: Math.max(db.activeSessions.length, 1)
    },
    activeSessions: db.activeSessions
  });
});

// ----------------------------------------------------
// 2. Update Settings
// ----------------------------------------------------
settingsRouter.put('/api/settings', async (req, res) => {
  const updated = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');

  // Automatic Cloudinary upload for Hotel Logos & Favicon to CDN
  if (cloudinaryService.isConfigured()) {
    const brandFields: ('logoUrl' | 'logoLightUrl' | 'logoDarkUrl' | 'faviconUrl')[] = [
      'logoUrl',
      'logoLightUrl',
      'logoDarkUrl',
      'faviconUrl'
    ];
    for (const field of brandFields) {
      if (typeof updated[field] === 'string' && updated[field].startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(updated[field], {
            folder: 'warwick_branding',
            resourceType: 'image',
            publicId: `brand_${field}_${Date.now()}`
          });
          updated[field] = res.secureUrl;
        } catch (e: any) {
          console.warn(`[Cloudinary] Failed to upload ${field} to Cloudinary:`, e.message);
        }
      }
    }
  }

  db.settings = {
    ...db.settings,
    ...updated,
    version: (db.settings.version || 1) + 1,
    lastSyncedAt: new Date().toISOString(),
    syncedDevicesCount: Math.max(db.activeSessions.length, 1)
  };

  if (mongoService.isLive) {
    try {
      await mongoService.updateSettings(db.settings);
    } catch (e: any) {
      console.warn('Error updating settings in MongoDB:', e.message);
    }
  }

  await addAudit('Settings Updated', 'settings', `Hotel settings updated by ${actor} (Version ${db.settings.version})`, actor, role);
  saveDatabase();

  return res.json({
    success: true,
    settings: db.settings,
    message: 'Settings updated and synchronized across all active devices.'
  });
});

// ----------------------------------------------------
// 3. Settings Sync
// ----------------------------------------------------
settingsRouter.post('/api/settings/sync', async (req, res) => {
  const { deviceId } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';

  if (deviceId) {
    const session = db.activeSessions.find(s => s.deviceId === deviceId);
    if (session) {
      session.lastSeen = new Date().toISOString();
    } else {
      db.activeSessions.push({
        deviceId,
        userId: 'usr-1',
        userName: actor,
        userEmail: 'staff@warwickbaha.com',
        role: 'Staff',
        lastSeen: new Date().toISOString(),
        userAgent: (req.headers['user-agent'] || 'Synced Client Device').substring(0, 60)
      });
    }
  }

  db.settings.lastSyncedAt = new Date().toISOString();
  db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
  saveDatabase();

  return res.json({
    success: true,
    settings: db.settings,
    itemsCount: mongoService.isLive ? (await mongoService.getStatus()).collections.itemsCount : db.items.length,
    staffCount: db.staff.length,
    syncedAt: db.settings.lastSyncedAt,
    syncedDevicesCount: db.settings.syncedDevicesCount,
    activeSessions: db.activeSessions
  });
});

// ----------------------------------------------------
// 4. Clear Cache
// ----------------------------------------------------
settingsRouter.post(['/api/system/clear-cache', '/api/settings/clear-cache'], async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');
  const actorEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase();

  const userObj = db.users.find(u => u.name.toLowerCase() === actor.toLowerCase() || (actorEmail && u.email.toLowerCase() === actorEmail));
  const userPerms = userObj?.permissions || (role ? DEFAULT_ROLE_PERMISSIONS[role] : []) || [];
  const canClearCache = ['Super Admin', 'Admin', 'Manager'].includes(role) || userPerms.includes('settings');

  if (!canClearCache) {
    return res.status(403).json({
      error: 'Permission Denied: Only administrators can clear system cache.'
    });
  }

  const now = new Date().toISOString();

  // 1. Purge obsolete inactive sessions (> 24 hours) and dummy seeds
  const cutoff24h = Date.now() - 24 * 3600 * 1000;
  const initialSessionCount = db.activeSessions.length;
  db.activeSessions = db.activeSessions.filter(s => {
    if (!s || !s.deviceId || !s.lastSeen) return false;
    if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
    const seenTime = new Date(s.lastSeen).getTime();
    return !isNaN(seenTime) && seenTime > cutoff24h;
  });

  // 2. Increment cache bust version & timestamp
  const nextVersion = (db.settings.version || 1) + 1;
  db.settings = {
    ...db.settings,
    version: nextVersion,
    lastSyncedAt: now,
    lastCachePurgedAt: now,
    cacheVersion: nextVersion,
    syncedDevicesCount: Math.max(db.activeSessions.length, 1)
  };

  // 3. If MongoDB is live, persist updated settings
  if (mongoService.isLive) {
    try {
      await mongoService.updateSettings(db.settings);
    } catch (e: any) {
      console.warn('MongoDB settings update on clear cache warning:', e.message);
    }
  }

  saveDatabase();

  // 4. Dispatch a real-time system broadcast notification
  createNotificationHelper({
    title: '⚡ System Cache Cleared',
    message: `System cache was manually cleared by ${actor}. All client devices have refreshed to latest inventory version (v${nextVersion}).`,
    type: 'system',
    priority: 'normal',
    targetType: 'all',
    senderName: actor,
    senderRole: role,
    senderEmail: actorEmail
  }).catch(() => {});

  // 5. Add audit log entry
  await addAudit(
    'System Cache Cleared',
    'settings',
    `Administrator ${actor} purged stale server cache & forced data update across all client devices (Sync v${nextVersion})`,
    actor,
    role
  );

  return res.json({
    success: true,
    message: 'System cache purged successfully. Update broadcasted to all connected clients.',
    clearedAt: now,
    version: nextVersion,
    cacheStats: {
      items: db.items.length,
      staff: db.staff.length,
      activeSessions: db.activeSessions.length,
      notifications: db.notifications.length,
      purgedStaleSessions: Math.max(0, initialSessionCount - db.activeSessions.length)
    },
    settings: db.settings
  });
});

export default settingsRouter;

