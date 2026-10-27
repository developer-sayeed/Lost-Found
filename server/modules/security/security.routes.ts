import express from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { parseUserAgentInfo } from '../../utils/device.utils.ts';
import { User, AuditLog, SecurityActivityLog, BlockedDevice } from '../../../src/types.ts';

export const securityRouter = express.Router();

// ----------------------------------------------------
// 1. Get Sessions
// ----------------------------------------------------
securityRouter.get('/api/sessions', (req, res) => {
  const currentDeviceId = req.headers['x-device-id'] as string;
  const cutoff24h = Date.now() - 24 * 3600 * 1000;
  const now = Date.now();

  // Filter to strictly real authentic user sessions active within the last 24 hours
  db.activeSessions = (db.activeSessions || []).filter((s: any) => {
    if (!s || !s.deviceId || !s.lastSeen) return false;
    if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
    const seenTime = new Date(s.lastSeen).getTime();
    return !isNaN(seenTime) && seenTime > cutoff24h;
  });

  const sessions = db.activeSessions.map((s: any) => {
    const lastSeenMs = new Date(s.lastSeen).getTime();
    const diffSecs = Math.floor((now - lastSeenMs) / 1000);
    const diffHours = Math.round(((now - lastSeenMs) / (3600 * 1000)) * 10) / 10;
    return {
      ...s,
      isCurrent: Boolean(s.deviceId && currentDeviceId && s.deviceId === currentDeviceId),
      isOnlineNow: diffSecs < 180,
      hoursAgo: Math.max(0, diffHours),
      loginAt: s.loginAt || s.createdAt || s.lastSeen
    };
  });

  sessions.sort((a: any, b: any) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  const mobileCount = sessions.filter((s: any) => s.deviceType === 'Mobile').length;
  const tabletCount = sessions.filter((s: any) => s.deviceType === 'Tablet').length;
  const desktopCount = sessions.filter((s: any) => s.deviceType === 'Desktop' || !s.deviceType).length;
  const onlineCount = sessions.filter((s: any) => s.isOnlineNow).length;

  db.settings.syncedDevicesCount = Math.max(sessions.length, 1);

  return res.json({
    success: true,
    sessions,
    total: sessions.length,
    onlineCount,
    mobileCount,
    tabletCount,
    desktopCount,
    timeWindowHours: 24,
    currentDeviceId
  });
});

// ----------------------------------------------------
// 2. Ping Sessions
// ----------------------------------------------------
securityRouter.post('/api/sessions/ping', (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  const userName = (req.headers['x-user-name'] as string) || '';
  const userEmail = (req.headers['x-user-email'] as string) || '';
  const role = (req.headers['x-user-role'] as string) || '';
  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

  if (!deviceId || !userEmail) {
    return res.json({ success: false, message: 'Unauthenticated device ping ignored' });
  }

  const { browser, os, deviceType } = parseUserAgentInfo(ua);
  const nowIso = new Date().toISOString();
  const cutoff24h = Date.now() - 24 * 3600 * 1000;

  db.activeSessions = (db.activeSessions || []).filter((s: any) => {
    if (!s || !s.deviceId || !s.lastSeen) return false;
    if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
    const seenTime = new Date(s.lastSeen).getTime();
    return !isNaN(seenTime) && seenTime > cutoff24h;
  });

  const existingIdx = db.activeSessions.findIndex((s: any) => s.deviceId === deviceId);
  if (existingIdx >= 0) {
    db.activeSessions[existingIdx].lastSeen = nowIso;
    if (userName) db.activeSessions[existingIdx].userName = userName;
    db.activeSessions[existingIdx].userEmail = userEmail;
    if (role) db.activeSessions[existingIdx].role = role;
    db.activeSessions[existingIdx].browser = browser;
    db.activeSessions[existingIdx].os = os;
    db.activeSessions[existingIdx].deviceType = deviceType;
    db.activeSessions[existingIdx].ip = ip;
  } else {
    db.activeSessions.unshift({
      deviceId,
      userName: userName || 'Authenticated User',
      userEmail,
      role: role || 'Staff',
      deviceType,
      browser,
      os,
      ip,
      lastSeen: nowIso,
      loginAt: nowIso,
      createdAt: nowIso,
      userAgent: ua.substring(0, 100)
    });
  }

  db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
  saveDatabase();

  return res.json({
    success: true,
    lastSeen: nowIso,
    totalActive24h: db.activeSessions.length
  });
});

// ----------------------------------------------------
// 3. Terminate Session
// ----------------------------------------------------
securityRouter.delete('/api/sessions/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const currentDeviceId = req.headers['x-device-id'] as string;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');

  if (deviceId === currentDeviceId) {
    return res.status(400).json({ error: 'Cannot terminate your current active session.' });
  }

  const removedSession = db.activeSessions.find((s: any) => s.deviceId === deviceId);
  db.activeSessions = db.activeSessions.filter((s: any) => s.deviceId !== deviceId);
  db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
  saveDatabase();

  if (removedSession) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
    const ua = req.headers['user-agent'] || '';
    const { browser, os, deviceType } = parseUserAgentInfo(ua);

    addAudit(
      'Session Terminated',
      'auth',
      `Terminated active remote session for ${removedSession.userName} on ${removedSession.os || 'Device'} (${deviceId})`,
      actor,
      role,
      deviceId,
      { ip: clientIp, deviceType: `${deviceType} • ${os}`, browser, performedByEmail: removedSession.userEmail }
    );
  }

  const sessions = db.activeSessions.map((s: any) => ({
    ...s,
    isCurrent: Boolean(s.deviceId && currentDeviceId && s.deviceId === currentDeviceId)
  }));

  return res.json({
    success: true,
    message: `Session terminated for device ${deviceId}`,
    sessions
  });
});

// ----------------------------------------------------
// 4. Security Activity History
// ----------------------------------------------------
securityRouter.get('/api/security/activity', async (req, res) => {
  try {
    const { type, search, limit = '300' } = req.query;
    let allLogs: AuditLog[] = [];

    if (mongoService.isLive) {
      try {
        const mLogs = await mongoService.getAuditLogs({ entityType: 'auth' }, 500);
        if (mLogs && mLogs.length > 0) {
          allLogs = mLogs;
        }
      } catch (e: any) {
        console.warn('Mongo security logs fetch warning:', e.message);
      }
    }

    const localAuth = (db.auditLogs || []).filter(l =>
      l.entityType === 'auth' ||
      l.action?.toLowerCase().includes('login') ||
      l.action?.toLowerCase().includes('password') ||
      l.action?.toLowerCase().includes('lock')
    );

    if (allLogs.length === 0) {
      allLogs = [...localAuth];
    } else {
      const mongoIds = new Set(allLogs.map(l => l.id));
      for (const log of localAuth) {
        if (!mongoIds.has(log.id)) {
          allLogs.push(log);
        }
      }
    }

    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let activities: SecurityActivityLog[] = allLogs.map(log => {
      const act = log.action || '';
      const actLower = act.toLowerCase();
      let eventType: SecurityActivityLog['eventType'] = 'login_success';
      let status: SecurityActivityLog['status'] = 'success';

      if (actLower.includes('password')) {
        eventType = 'password_change';
        status = 'info';
      } else if (
        actLower.includes('failed') ||
        actLower.includes('unauthorized') ||
        actLower.includes('invalid') ||
        actLower.includes('blocked') ||
        actLower.includes('locked')
      ) {
        eventType = 'login_failed';
        status = actLower.includes('locked') || actLower.includes('blocked') ? 'warning' : 'failed';
      } else if (actLower.includes('terminate') || actLower.includes('session')) {
        eventType = 'session_management';
        status = 'warning';
      } else if (actLower.includes('login') || actLower.includes('oauth') || actLower.includes('unlock')) {
        eventType = 'login_success';
        status = 'success';
      }

      return {
        id: log.id,
        action: act || log.details || 'Auth Activity',
        performedBy: log.performedBy || 'Staff Member',
        performedByRole: (log.userRole as any) || (log.performedByRole as any) || 'Staff',
        performedByEmail: log.performedByEmail || '',
        details: log.details || act || 'Auth Activity',
        timestamp: log.timestamp,
        userName: log.performedBy || 'Staff Member',
        userEmail: log.performedByEmail || '',
        role: (log.userRole as any) || (log.performedByRole as any) || 'Staff',
        eventType,
        description: log.details || act || 'Auth Activity',
        deviceType: log.deviceType || 'Desktop • Windows 11',
        browser: log.browser || 'Google Chrome',
        ip: log.ip || '192.168.1.45',
        status
      };
    });


    if (type && type !== 'all') {
      activities = activities.filter(a => a.eventType === type);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      activities = activities.filter(a =>
        (a.userName || '').toLowerCase().includes(q) ||
        (a.userEmail || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.ip || '').toLowerCase().includes(q)
      );
    }


    const maxLimit = parseInt(String(limit), 10) || 300;
    activities = activities.slice(0, maxLimit);

    return res.json({
      success: true,
      total: activities.length,
      activities
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 5. Delete Security Activity Log (Single)
// ----------------------------------------------------
securityRouter.delete('/api/security/activity/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const beforeLen = (db.auditLogs || []).length;
    db.auditLogs = (db.auditLogs || []).filter(l => l.id !== id);
    const isRemoved = beforeLen !== db.auditLogs.length;

    if (mongoService.isLive) {
      try {
        await mongoService.deleteAuditLog(id);
      } catch (e: any) {
        console.warn('MongoDB delete audit log warning:', e.message);
      }
    }

    saveDatabase();
    return res.json({
      success: true,
      message: isRemoved ? 'Security activity log record deleted.' : 'Log record not found.',
      deletedId: id
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 6. Delete Security Activity Logs (Batch)
// ----------------------------------------------------
securityRouter.post('/api/security/activity/delete-batch', async (req, res) => {
  try {
    const { ids } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided for batch deletion.' });
    }

    const idSet = new Set(ids);
    const beforeCount = (db.auditLogs || []).length;
    db.auditLogs = (db.auditLogs || []).filter(l => !idSet.has(l.id));
    const deletedCount = beforeCount - db.auditLogs.length;

    if (mongoService.isLive) {
      try {
        await mongoService.deleteAuditLogs(ids);
      } catch (e: any) {
        console.warn('MongoDB batch delete audit logs warning:', e.message);
      }
    }

    saveDatabase();
    await addAudit(
      'Security Activity Deleted',
      'settings',
      `Administrator ${actor} deleted ${deletedCount} selected authentication and security activity records`,
      actor,
      role
    );

    return res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} security activity record${deletedCount !== 1 ? 's' : ''}.`,
      deletedCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 7. Clear / Purge Security Activity
// ----------------------------------------------------
securityRouter.delete('/api/security/activity', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const beforeCount = (db.auditLogs || []).length;
    const idsToDelete: string[] = [];

    db.auditLogs = (db.auditLogs || []).filter(l => {
      if (l.entityType !== 'auth' && !l.action?.toLowerCase().includes('login') && !l.action?.toLowerCase().includes('password')) {
        return true;
      }
      const actLower = (l.action || '').toLowerCase();
      let shouldDelete = false;
      if (filter === 'failed') {
        shouldDelete = actLower.includes('fail') || actLower.includes('invalid') || actLower.includes('block') || actLower.includes('lock') || actLower.includes('unauthorized');
      } else if (filter === 'success') {
        shouldDelete = (actLower.includes('login') || actLower.includes('oauth')) && !actLower.includes('fail') && !actLower.includes('block');
      } else if (filter === 'password') {
        shouldDelete = actLower.includes('password');
      } else if (filter === 'older_than_7_days') {
        const logTime = new Date(l.timestamp).getTime();
        shouldDelete = now - logTime > sevenDaysMs;
      } else {
        shouldDelete = true;
      }
      if (shouldDelete) {
        idsToDelete.push(l.id);
        return false;
      }
      return true;
    });

    const deletedCount = beforeCount - db.auditLogs.length;

    if (mongoService.isLive && idsToDelete.length > 0) {
      try {
        await mongoService.deleteAuditLogs(idsToDelete);
      } catch (e: any) {
        console.warn('MongoDB batch delete audit logs warning:', e.message);
      }
    }

    saveDatabase();
    await addAudit(
      'Security Activity Cleared',
      'settings',
      `Administrator ${actor} deleted ${deletedCount} authentication & security activity history logs (Mode: ${filter})`,
      actor,
      role
    );

    return res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} security activity history records.`,
      deletedCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 8. Blocked Devices
// ----------------------------------------------------
securityRouter.get('/api/devices/blocked', (req, res) => {
  if (!Array.isArray(db.blockedDevices)) {
    db.blockedDevices = [];
  }

  const now = Date.now();
  let modified = false;
  db.blockedDevices = db.blockedDevices.filter(b => {
    if (b.blockType === 'temporary' && b.blockedUntil) {
      if (new Date(b.blockedUntil).getTime() <= now) {
        modified = true;
        return false;
      }
    }
    return true;
  });

  if (modified) {
    saveDatabase();
  }

  return res.json({
    success: true,
    blockedDevices: db.blockedDevices
  });
});

// ----------------------------------------------------
// 9. Block Device
// ----------------------------------------------------
securityRouter.post('/api/devices/block', async (req, res) => {
  try {
    const {
      deviceId,
      ip,
      userName,
      userEmail,
      deviceType,
      browser,
      os,
      blockType = 'temporary',
      durationHours = 24,
      reason
    } = req.body;
    const currentDeviceId = req.headers['x-device-id'] as string;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

    if (!deviceId && !ip) {
      return res.status(400).json({ success: false, error: 'Device ID or IP is required to block device.' });
    }

    if (deviceId && currentDeviceId && deviceId === currentDeviceId) {
      return res.status(400).json({ success: false, error: 'Cannot block your current active terminal session.' });
    }

    if (!Array.isArray(db.blockedDevices)) {
      db.blockedDevices = [];
    }

    const now = Date.now();
    const hours = Number(durationHours) || 24;
    const blockedUntil = blockType === 'temporary' ? new Date(now + hours * 60 * 60 * 1000).toISOString() : null;

    db.blockedDevices = db.blockedDevices.filter(b => b.deviceId !== deviceId && (!ip || b.ip !== ip));

    const newBlock: BlockedDevice = {
      deviceId: deviceId || `dev-blocked-${Date.now()}`,
      ip: ip || clientIp,
      userName: userName || 'Unknown Staff',
      userEmail: userEmail || '',
      deviceType: deviceType || 'Unknown Device',
      browser: browser || 'Unknown Browser',
      os: os || 'Unknown OS',
      blockType: blockType === 'permanent' ? 'permanent' : 'temporary',
      blockedAt: new Date().toISOString(),
      blockedUntil,
      reason: reason || (blockType === 'permanent' ? 'Permanent administrator security block' : `Temporary ${hours}h security block`),
      blockedBy: actor,
      blockedByRole: role
    };

    db.blockedDevices.unshift(newBlock);

    if (Array.isArray(db.activeSessions)) {
      db.activeSessions = db.activeSessions.filter(s => s.deviceId !== deviceId && (!ip || s.ip !== ip));
      db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
    }

    saveDatabase();

    await addAudit(
      'Device Blocked',
      'auth',
      `Device ${deviceId || ip} (${userName || 'User'} - IP: ${ip || clientIp}) blocked ${blockType === 'permanent' ? 'permanently' : `temporarily for ${hours}h`}. Reason: ${newBlock.reason}`,
      actor,
      role,
      deviceId,
      {
        ip: clientIp,
        deviceType: `${deviceType || 'Device'} • ${os || 'OS'}`,
        browser,
        performedByEmail: userEmail
      }
    );

    return res.json({
      success: true,
      message: `Device ${deviceId || ip} has been blocked ${blockType === 'permanent' ? 'permanently' : `temporarily for ${hours} hours`}.`,
      block: newBlock,
      blockedDevices: db.blockedDevices,
      sessions: db.activeSessions
    });
  } catch (err: any) {
    console.error('Device block error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 10. Unblock Device
// ----------------------------------------------------
securityRouter.post('/api/devices/unblock', async (req, res) => {
  try {
    const { deviceId, ip } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = ((req.headers['x-user-role'] as User['role']) || 'Super Admin');
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

    if (!Array.isArray(db.blockedDevices)) {
      db.blockedDevices = [];
    }

    const existing = db.blockedDevices.find(b => (deviceId && b.deviceId === deviceId) || (ip && b.ip === ip));
    db.blockedDevices = db.blockedDevices.filter(b => (!deviceId || b.deviceId !== deviceId) && (!ip || b.ip !== ip));
    saveDatabase();

    await addAudit(
      'Device Unblocked',
      'auth',
      `Device ${deviceId || ip} (${existing?.userName || 'Device'}) was unblocked by administrator ${actor}`,
      actor,
      role,
      deviceId,
      { ip: clientIp }
    );

    return res.json({
      success: true,
      message: `Device ${deviceId || ip} has been unblocked successfully.`,
      blockedDevices: db.blockedDevices
    });
  } catch (err: any) {
    console.error('Device unblock error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default securityRouter;

