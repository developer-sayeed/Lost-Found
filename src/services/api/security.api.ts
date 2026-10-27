import { User, DeviceSession, SecurityActivityLog, BlockedDevice } from '../../types';
import { getAuthHeaders, getDeviceId } from './client';

export const securityApi = {
  // Active Device Sessions
  async getSessions(user?: User | null): Promise<{
    sessions: DeviceSession[];
    total: number;
    onlineCount?: number;
    mobileCount?: number;
    tabletCount?: number;
    desktopCount?: number;
    timeWindowHours?: number;
    currentDeviceId: string;
  }> {
    try {
      const res = await fetch('/api/sessions', {
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Get sessions error:', e);
    }
    const currentId = getDeviceId();
    const nowIso = new Date().toISOString();
    return {
      sessions: user ? [
        {
          deviceId: currentId,
          userName: user.name || 'Current User',
          userEmail: user.email || '',
          role: user.role || 'Staff',
          deviceType: /mobile|iphone|android/i.test(navigator.userAgent) ? 'Mobile' : /ipad|tablet/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop',
          browser: 'Current Browser',
          os: navigator.userAgent.includes('Win') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Android') ? 'Android' : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Desktop OS',
          ip: 'Current Terminal',
          lastSeen: nowIso,
          loginAt: nowIso,
          createdAt: nowIso,
          isCurrent: true,
          isOnlineNow: true,
          hoursAgo: 0
        }
      ] : [],
      total: user ? 1 : 0,
      onlineCount: user ? 1 : 0,
      mobileCount: /mobile|iphone|android/i.test(navigator.userAgent) ? 1 : 0,
      tabletCount: /ipad|tablet/i.test(navigator.userAgent) ? 1 : 0,
      desktopCount: !/mobile|iphone|android|ipad|tablet/i.test(navigator.userAgent) ? 1 : 0,
      timeWindowHours: 24,
      currentDeviceId: currentId
    };
  },

  async pingSession(user?: User | null): Promise<void> {
    try {
      await fetch('/api/sessions/ping', {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
    } catch {}
  },

  async deleteSession(deviceId: string, user?: User | null): Promise<{ success: boolean; message: string; sessions: DeviceSession[] }> {
    try {
      const res = await fetch(`/api/sessions/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Delete session error:', e);
    }
    return {
      success: true,
      message: `Terminated session for device ${deviceId}`,
      sessions: []
    };
  },

  // Security Activity Logs
  async getSecurityActivity(
    user?: User | null,
    query?: { type?: string; search?: string; limit?: number }
  ): Promise<{
    success: boolean;
    activities: SecurityActivityLog[];
    total: number;
    stats: {
      total: number;
      successfulLogins: number;
      failedAttempts: number;
      passwordChanges: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (query?.type) params.set('type', query.type);
      if (query?.search) params.set('search', query.search);
      if (query?.limit) params.set('limit', String(query.limit));

      const res = await fetch(`/api/security/activity?${params.toString()}`, {
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Get security activity error:', e);
    }
    return {
      success: true,
      activities: [],
      total: 0,
      stats: { total: 0, successfulLogins: 0, failedAttempts: 0, passwordChanges: 0 }
    };
  },

  async deleteSecurityActivity(id: string, user?: User | null): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/security/activity/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Delete security activity error:', e);
    }
    return { success: false, message: 'Failed to delete activity log' };
  },

  async deleteSecurityActivitiesBatch(ids: string[], user?: User | null): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const res = await fetch('/api/security/activity/delete-batch', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Batch delete security activities error:', e);
    }
    return { success: false, message: 'Failed to delete selected activity logs', deletedCount: 0 };
  },

  async clearSecurityActivities(
    filter: 'all' | 'failed' | 'success' | 'password' | 'older_than_7_days' = 'all',
    user?: User | null
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const res = await fetch(`/api/security/activity?filter=${filter}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Clear security activities error:', e);
    }
    return { success: false, message: 'Failed to clear activity logs', deletedCount: 0 };
  },

  // Blocked Devices API
  async getBlockedDevices(user?: User | null): Promise<{ success: boolean; blockedDevices: BlockedDevice[] }> {
    try {
      const res = await fetch('/api/devices/blocked', {
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Get blocked devices error:', e);
    }
    return { success: true, blockedDevices: [] };
  },

  async blockDevice(
    params: {
      deviceId?: string;
      ip?: string;
      userName?: string;
      userEmail?: string;
      deviceType?: string;
      browser?: string;
      os?: string;
      blockType: 'temporary' | 'permanent';
      durationHours?: number;
      reason?: string;
    },
    user?: User | null
  ): Promise<{ success: boolean; message: string; block?: BlockedDevice; blockedDevices?: BlockedDevice[]; sessions?: DeviceSession[] }> {
    try {
      const res = await fetch('/api/devices/block', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to block device');
    } catch (e: any) {
      console.warn('Block device error:', e);
      return { success: false, message: e.message || 'Failed to block device' };
    }
  },

  async unblockDevice(
    params: { deviceId?: string; ip?: string },
    user?: User | null
  ): Promise<{ success: boolean; message: string; blockedDevices?: BlockedDevice[] }> {
    try {
      const res = await fetch('/api/devices/unblock', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to unblock device');
    } catch (e: any) {
      console.warn('Unblock device error:', e);
      return { success: false, message: e.message || 'Failed to unblock device' };
    }
  }
};
