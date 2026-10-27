import { AppNotification } from '../../src/types.ts';
import { db, saveDatabase } from '../database/json-db.ts';
import { mongoService } from '../mongodb.ts';

const NOTIFICATIONS_ENABLED = true;

export async function createNotificationHelper(
  notifData: Partial<AppNotification>
): Promise<AppNotification> {
  const notif: AppNotification = {
    id: notifData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: notifData.title || 'System Notification',
    message: notifData.message || '',
    type: notifData.type || 'system',
    priority: notifData.priority || 'normal',
    targetType: notifData.targetType || 'all',
    targetRoles: notifData.targetRoles,
    targetDepartment: notifData.targetDepartment,
    targetStaffName: notifData.targetStaffName,
    targetStaffEmail: notifData.targetStaffEmail,
    targetUserId: notifData.targetUserId,
    senderName: notifData.senderName || 'System',
    senderRole: notifData.senderRole,
    senderEmail: notifData.senderEmail,
    itemId: notifData.itemId,
    itemCode: notifData.itemCode,
    createdAt: notifData.createdAt || new Date().toISOString(),
    read: false,
    readBy: [],
    deletedBy: []
  };

  // If notifications are disabled, return without persisting or sending
  if (!NOTIFICATIONS_ENABLED) {
    return notif;
  }

  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }

  // Strict deduplication check: Prevent duplicate notification within 30 seconds
  const now = Date.now();
  const existingDuplicate = db.notifications.find(existing => {
    try {
      const timeDiff = Math.abs(now - new Date(existing.createdAt).getTime());
      if (timeDiff > 30000) return false;

      // Duplicate for identical item and event type
      if (
        notif.type &&
        existing.type === notif.type &&
        ((notif.itemCode && existing.itemCode === notif.itemCode) ||
         (notif.itemId && existing.itemId === notif.itemId))
      ) {
        return true;
      }

      // Duplicate for identical title & message
      const normNewTitle = (notif.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normOldTitle = (existing.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normNewTitle && normOldTitle && normNewTitle === normOldTitle) {
        return true;
      }
    } catch {}
    return false;
  });

  if (existingDuplicate) {
    console.log(`[Notification Deduplication] Prevented duplicate notification for item: ${notif.itemCode || notif.title}`);
    return existingDuplicate;
  }

  db.notifications.unshift(notif);
  if (db.notifications.length > 300) {
    db.notifications = db.notifications.slice(0, 300);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.insertNotification(notif);
    } catch (e: any) {
      console.warn('Mongo insertNotification error:', e.message);
    }
  }

  return notif;
}
