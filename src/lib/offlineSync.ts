import { LostItem, StaffMember, HotelSettings, OfflineQueuedAction } from '../types';
import { capitalizeWords } from './stringUtils';

const STORAGE_KEYS = {
  ITEMS: 'warwick_offline_cached_items',
  STAFF: 'warwick_offline_cached_staff',
  SETTINGS: 'warwick_offline_cached_settings',
  QUEUE: 'warwick_offline_sync_queue',
  LAST_SYNC: 'warwick_last_sync_timestamp'
};

export const offlineStorage = {
  // Items Cache
  saveItems(items: LostItem[]): void {
    try {
      if (Array.isArray(items)) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      }
    } catch (e) {
      console.warn('Failed to cache items locally:', e);
    }
  },

  loadItems(): LostItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            ...item,
            itemName: capitalizeWords(item.itemName)
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached items:', e);
    }
    return [];
  },

  // Staff Cache
  saveStaff(staff: StaffMember[]): void {
    try {
      if (Array.isArray(staff)) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      }
    } catch (e) {
      console.warn('Failed to cache staff locally:', e);
    }
  },

  loadStaff(): StaffMember[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached staff:', e);
    }
    return [];
  },

  // Settings Cache
  saveSettings(settings: HotelSettings): void {
    try {
      if (settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('Failed to cache settings locally:', e);
    }
  },

  loadSettings(): HotelSettings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse cached settings:', e);
    }
    return null;
  },

  // Queue Operations
  getQueue(): OfflineQueuedAction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse offline queue:', e);
    }
    return [];
  },

  saveQueue(queue: OfflineQueuedAction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to persist offline queue:', e);
    }
  },

  enqueue(action: Omit<OfflineQueuedAction, 'id' | 'createdAt'>): OfflineQueuedAction {
    const queue = this.getQueue();
    const newEntry: OfflineQueuedAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      ...action
    };
    queue.push(newEntry);
    this.saveQueue(queue);
    return newEntry;
  },

  dequeue(id: string): void {
    const queue = this.getQueue().filter(q => q.id !== id);
    this.saveQueue(queue);
  },

  clearQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.QUEUE);
    } catch {}
  },

  getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  }
};

/**
 * Check whether an error is caused by a network disconnection or offline timeout
 */
export function isNetworkError(err: any): boolean {
  if (!err) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('offline') ||
    msg.includes('connection refused') ||
    msg.includes('abort') ||
    msg.includes('load failed')
  );
}
