import { Router } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { createNotificationHelper } from '../../utils/notification.helper.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { AppNotification, User } from '../../../src/types.ts';

const router = Router();

// GET notifications
router.get('/', async (req, res) => {
  let notifications: AppNotification[] = [];

  if (mongoService.isLive) {
    try {
      notifications = await mongoService.getNotifications();
      if ((!notifications || notifications.length === 0) && Array.isArray(db.notifications) && db.notifications.length > 0) {
        notifications = db.notifications;
      }
    } catch (e: any) {
      notifications = Array.isArray(db.notifications) ? db.notifications : [];
    }
  } else {
    notifications = Array.isArray(db.notifications) ? db.notifications : [];
  }

  // Clean deduplication: eliminate duplicate notifications within 60-second window
  const seenNotifs = new Set<string>();
  const deduplicatedNotifs: AppNotification[] = [];
  for (const notif of notifications) {
    const code = notif.itemCode || notif.itemId || '';
    const normTitle = (notif.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const timeBucket = Math.floor(new Date(notif.createdAt).getTime() / 60000);
    const key = code
      ? `${notif.type || 'gen'}_${code}_${timeBucket}`
      : `${normTitle}_${timeBucket}`;
    if (!seenNotifs.has(key)) {
      seenNotifs.add(key);
      deduplicatedNotifs.push(notif);
    }
  }
  notifications = deduplicatedNotifs;

  const userIdentifiers = [
    (req.headers['x-user-id'] as string || '').trim().toLowerCase(),
    (req.headers['x-user-name'] as string || '').trim().toLowerCase(),
    (req.headers['x-user-email'] as string || '').trim().toLowerCase()
  ].filter(Boolean);

  // Calculate unread count strictly for this user (not in readBy, not in deletedBy)
  const unreadCount = notifications.filter(n => {
    const deletedBy = Array.isArray(n.deletedBy) ? n.deletedBy.map(u => String(u).toLowerCase().trim()) : [];
    const isDeleted = userIdentifiers.some(u => deletedBy.includes(u));
    if (isDeleted) return false;

    const readBy = Array.isArray(n.readBy) ? n.readBy.map(u => String(u).toLowerCase().trim()) : [];
    const isRead = userIdentifiers.length > 0
      ? userIdentifiers.some(u => readBy.includes(u))
      : Boolean(n.read);
    return !isRead;
  }).length;

  return res.json({
    notifications,
    total: notifications.length,
    unreadCount
  });
});

// POST notification
router.post('/', async (req, res) => {
  const body = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const email = (req.headers['x-user-email'] as string) || '';

  const notif = await createNotificationHelper({
    ...body,
    senderName: actor,
    senderRole: role,
    senderEmail: email
  });

  return res.status(201).json({
    success: true,
    notification: notif
  });
});

// POST broadcast notification
router.post('/broadcast', async (req, res) => {
  const {
    title,
    message,
    type = 'notice',
    priority = 'normal',
    targetType = 'all',
    targetDepartment,
    targetStaffName,
    targetStaffEmail,
    targetUserId,
    targetRoles
  } = req.body;

  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const email = (req.headers['x-user-email'] as string) || '';

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const notif = await createNotificationHelper({
    title,
    message,
    type,
    priority,
    targetType,
    targetDepartment,
    targetStaffName,
    targetStaffEmail,
    targetUserId,
    targetRoles,
    senderName: actor,
    senderRole: role,
    senderEmail: email
  });

  await addAudit('Notification Broadcast', 'settings', `Broadcasted notice "${title}" (${targetType}) by ${actor}`, actor, role);

  return res.status(201).json({
    success: true,
    notification: notif,
    message: 'Notice broadcasted successfully in real time.'
  });
});

// PUT mark notification read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

  if (Array.isArray(db.notifications)) {
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      if (!Array.isArray(notif.readBy)) notif.readBy = [];
      if (!notif.readBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
        notif.readBy.push(userIdentifier);
      }
      saveDatabase();
    }
  }

  if (mongoService.isLive) {
    mongoService.markNotificationRead(id, userIdentifier).catch(() => {});
  }

  return res.json({ success: true, id });
});

// PUT mark notification unread
router.put('/:id/unread', async (req, res) => {
  const { id } = req.params;
  const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

  if (Array.isArray(db.notifications)) {
    const notif = db.notifications.find(n => n.id === id);
    if (notif && Array.isArray(notif.readBy)) {
      notif.readBy = notif.readBy.filter(u => String(u).trim().toLowerCase() !== userIdentifier);
      saveDatabase();
    }
  }

  if (mongoService.isLive) {
    mongoService.markNotificationUnread(id, userIdentifier).catch(() => {});
  }

  return res.json({ success: true, id });
});

// POST mark all read
router.post('/read-all', async (req, res) => {
  const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

  if (Array.isArray(db.notifications)) {
    db.notifications.forEach(n => {
      if (!Array.isArray(n.readBy)) n.readBy = [];
      if (!n.readBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
        n.readBy.push(userIdentifier);
      }
    });
    saveDatabase();
  }

  if (mongoService.isLive) {
    mongoService.markAllNotificationsRead(userIdentifier).catch(() => {});
  }

  return res.json({ success: true, message: 'All notifications marked as read for current user.' });
});

// DELETE single notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const actorRole = (req.headers['x-user-role'] as string) || '';
  const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();
  const forEveryone = req.query.forEveryone === 'true' || req.body?.forEveryone === true;

  // Permanent global deletion by Super Admin or Admin
  if (forEveryone && ['Super Admin', 'Admin'].includes(actorRole)) {
    if (Array.isArray(db.notifications)) {
      db.notifications = db.notifications.filter(n => n.id !== id);
      saveDatabase();
    }
    if (mongoService.isLive) {
      mongoService.deleteNotification(id).catch(() => {});
    }
    return res.json({ success: true, message: 'Notification permanently removed for all users.' });
  }

  // Default: Per-user dismissal (hidden only for this user)
  if (Array.isArray(db.notifications)) {
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      if (!Array.isArray(notif.deletedBy)) notif.deletedBy = [];
      if (!notif.deletedBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
        notif.deletedBy.push(userIdentifier);
      }
      saveDatabase();
    }
  }
  if (mongoService.isLive) {
    mongoService.deleteNotificationForUser(id, userIdentifier).catch(() => {});
  }
  return res.json({ success: true, message: 'Notification dismissed for your account.' });
});

// DELETE all notifications
router.delete('/', async (req, res) => {
  const actorRole = (req.headers['x-user-role'] as string) || '';
  const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();
  const forEveryone = req.query.forEveryone === 'true' || req.body?.forEveryone === true;

  // Global clear by Super Admin
  if (forEveryone && ['Super Admin', 'Admin'].includes(actorRole)) {
    if (Array.isArray(db.notifications)) {
      db.notifications = [];
      saveDatabase();
    }
    if (mongoService.isLive) {
      mongoService.clearNotifications().catch(() => {});
    }
    return res.json({ success: true, message: 'All notifications cleared for all users.' });
  }

  // Per-user clear (marks all as dismissed for this user only)
  if (Array.isArray(db.notifications)) {
    db.notifications.forEach(n => {
      if (!Array.isArray(n.deletedBy)) n.deletedBy = [];
      if (!n.deletedBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
        n.deletedBy.push(userIdentifier);
      }
    });
    saveDatabase();
  }
  if (mongoService.isLive) {
    mongoService.clearNotificationsForUser(userIdentifier).catch(() => {});
  }
  return res.json({ success: true, message: 'All notifications dismissed for your account.' });
});

export default router;
