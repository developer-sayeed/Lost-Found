import { AppNotification, User } from '../../types';
import { getAuthHeaders } from './client';

export const notificationsApi = {
  async getNotifications(user?: User | null): Promise<AppNotification[]> {
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        return data.notifications || [];
      }
    } catch (e) {
      console.warn('Get notifications network fallback:', e);
    }
    return [];
  },

  async createNotification(notif: Partial<AppNotification>, user?: User | null): Promise<AppNotification | null> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(notif)
      });
      if (res.ok) {
        const data = await res.json();
        return data.notification;
      }
    } catch (e) {
      console.warn('Create notification fallback:', e);
    }
    return null;
  },

  async broadcastNotification(
    payload: {
      title: string;
      message: string;
      type?: string;
      priority?: string;
      targetType?: 'all' | 'department' | 'individual' | 'roles';
      targetDepartment?: string;
      targetStaffName?: string;
      targetStaffEmail?: string;
      targetUserId?: string;
      targetRoles?: string[];
    },
    user?: User | null
  ): Promise<{ success: boolean; notification?: AppNotification; message?: string }> {
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      console.warn('Broadcast notification fallback:', e);
      return { success: false, message: e.message || 'Failed to send broadcast' };
    }
  },

  async markNotificationRead(id: string, user?: User | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Mark notification read fallback:', e);
      return true;
    }
  },

  async markNotificationUnread(id: string, user?: User | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${id}/unread`, {
        method: 'PUT',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Mark notification unread fallback:', e);
      return true;
    }
  },

  async markAllNotificationsRead(user?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Mark all read fallback:', e);
      return true;
    }
  },

  async deleteNotification(id: string, options?: { forEveryone?: boolean }, user?: User | null): Promise<boolean> {
    try {
      const query = options?.forEveryone ? '?forEveryone=true' : '';
      const res = await fetch(`/api/notifications/${id}${query}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Delete notification fallback:', e);
      return true;
    }
  },

  async clearNotifications(options?: { forEveryone?: boolean }, user?: User | null): Promise<boolean> {
    try {
      const query = options?.forEveryone ? '?forEveryone=true' : '';
      const res = await fetch(`/api/notifications${query}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Clear notifications fallback:', e);
      return true;
    }
  }
};
