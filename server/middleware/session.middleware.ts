import express from 'express';
import { db, isDeviceBlocked } from '../database/json-db.ts';
import { parseUserAgentInfo } from '../utils/device.utils.ts';

export function sessionTrackingMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const deviceId = req.headers['x-device-id'] as string;
  const userName = (req.headers['x-user-name'] as string) || '';
  const userEmail = (req.headers['x-user-email'] as string) || '';
  const role = (req.headers['x-user-role'] as string) || '';
  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

  // Verify if this terminal device or IP has been blocked
  const blockCheck = isDeviceBlocked(deviceId, ip);
  if (blockCheck.blocked) {
    if (Array.isArray(db.activeSessions)) {
      db.activeSessions = db.activeSessions.filter((s: any) => s.deviceId !== deviceId && (!ip || s.ip !== ip));
      db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
    }
    const isUnblockApi = req.path.startsWith('/api/devices') || req.path.startsWith('/api/public');
    if (req.path.startsWith('/api') && !isUnblockApi) {
      const b = blockCheck.device!;
      const isTemp = b.blockType === 'temporary';
      const remainingMs = b.blockedUntil ? Math.max(0, new Date(b.blockedUntil).getTime() - Date.now()) : 0;
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      return res.status(403).json({
        success: false,
        isDeviceBlocked: true,
        blockType: b.blockType,
        blockedUntil: b.blockedUntil,
        error: isTemp
          ? `Access Denied: This terminal device has been temporarily blocked (${remainingMins} minute${remainingMins !== 1 ? 's' : ''} remaining). Reason: ${b.reason || 'Security policy'}`
          : `Access Denied: This terminal device has been permanently blocked by system administration. Reason: ${b.reason || 'Security policy'}`
      });
    }
  }

  if (deviceId && userEmail && req.path.startsWith('/api') && !blockCheck.blocked) {
    const nowIso = new Date().toISOString();
    const cutoff24h = Date.now() - 24 * 3600 * 1000;
    const { browser, os, deviceType } = parseUserAgentInfo(ua);

    // Clean up any stale sessions (>24h)
    db.activeSessions = db.activeSessions.filter((s: any) => {
      if (!s || !s.deviceId || !s.lastSeen) return false;
      if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
      const seenTime = new Date(s.lastSeen).getTime();
      return !isNaN(seenTime) && seenTime > cutoff24h;
    });

    const existingIdx = db.activeSessions.findIndex((s: any) => s.deviceId === deviceId);
    if (existingIdx >= 0) {
      db.activeSessions[existingIdx].lastSeen = nowIso;
      if (!db.activeSessions[existingIdx].loginAt) {
        db.activeSessions[existingIdx].loginAt = db.activeSessions[existingIdx].createdAt || nowIso;
      }
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
  }

  next();
}
