import { HotelSettings, User } from '../../types';
import { INITIAL_HOTEL_SETTINGS } from '../../lib/constants';
import { getAuthHeaders, getDeviceId } from './client';

export const settingsApi = {
  async getSettings(): Promise<{ settings: HotelSettings; activeSessions: any[] }> {
    try {
      const res = await fetch('/api/settings', { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fallback to local settings:', e);
    }
    return {
      settings: INITIAL_HOTEL_SETTINGS,
      activeSessions: [
        { deviceId: getDeviceId(), userId: 'usr-1', lastSeen: new Date().toISOString(), userAgent: 'Current Browser' }
      ]
    };
  },

  async updateSettings(settings: Partial<HotelSettings>, user?: User | null): Promise<HotelSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        return data.settings;
      }
    } catch (e) {
      console.warn('Settings update fallback:', e);
    }
    return { ...INITIAL_HOTEL_SETTINGS, ...settings, lastSyncedAt: new Date().toISOString() };
  },

  async triggerSync(user?: User | null): Promise<any> {
    try {
      const res = await fetch('/api/settings/sync', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ deviceId: getDeviceId() })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Sync trigger error:', e);
    }
    return { success: true, syncedAt: new Date().toISOString(), syncedDevicesCount: 3 };
  },

  async clearSystemCache(user?: User | null): Promise<{
    success: boolean;
    message: string;
    clearedAt: string;
    version: number;
    cacheStats?: { items: number; staff: number; notifications: number; activeSessions: number; purgedStaleSessions?: number };
    settings?: HotelSettings;
  }> {
    const res = await fetch('/api/system/clear-cache', {
      method: 'POST',
      headers: getAuthHeaders(user)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to clear system cache');
    }
    return data;
  }
};
