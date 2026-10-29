import { MediaItem, MediaStorageStats, User } from '../../types';
import { getAuthHeaders } from './client';

export const mediaApi = {
  async getMedia(
    filters?: { type?: string; search?: string; sortBy?: string },
    user?: User | null
  ): Promise<{ success: boolean; media: MediaItem[]; totalCount: number; stats: MediaStorageStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters?.search && filters.search.trim()) params.set('search', filters.search.trim());
      if (filters?.sortBy) params.set('sortBy', filters.sortBy);

      const qs = params.toString();
      const url = qs ? `/api/media?${qs}` : '/api/media';

      const res = await fetch(url, {
        headers: getAuthHeaders(user)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[Media API] getMedia error:', err);
      return {
        success: false,
        media: [],
        totalCount: 0,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          formattedTotalSize: '0 KB',
          imagesCount: 0,
          imagesSize: 0,
          formattedImagesSize: '0 KB',
          videosCount: 0,
          videosSize: 0,
          formattedVideosSize: '0 KB',
          otherCount: 0,
          otherSize: 0,
          formattedOtherSize: '0 KB'
        }
      };
    }
  },

  async getMediaStats(user?: User | null): Promise<{ success: boolean; stats: MediaStorageStats }> {
    try {
      const res = await fetch('/api/media/stats', {
        headers: getAuthHeaders(user)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.error('[Media API] getMediaStats error:', err);
      return {
        success: false,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          formattedTotalSize: '0 KB',
          imagesCount: 0,
          imagesSize: 0,
          formattedImagesSize: '0 KB',
          videosCount: 0,
          videosSize: 0,
          formattedVideosSize: '0 KB',
          otherCount: 0,
          otherSize: 0,
          formattedOtherSize: '0 KB'
        }
      };
    }
  },

  async uploadMedia(
    payload: {
      name?: string;
      title?: string;
      caption?: string;
      url: string;
      thumbnailUrl?: string;
      type?: string;
      mimeType?: string;
      size?: number;
      dimensions?: { width: number; height: number };
      duration?: string;
      tags?: string[];
      associatedTo?: any;
    },
    user?: User | null
  ): Promise<{ success: boolean; message?: string; mediaItem?: MediaItem; stats?: MediaStorageStats; error?: string }> {
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(user),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP error ${res.status}` };
      }
      return data;
    } catch (err: any) {
      console.error('[Media API] uploadMedia error:', err);
      return { success: false, error: err.message || 'Failed to upload media file.' };
    }
  },

  async updateMedia(
    id: string,
    updates: { title?: string; caption?: string; tags?: string[]; associatedTo?: any },
    user?: User | null
  ): Promise<{ success: boolean; message?: string; mediaItem?: MediaItem; error?: string }> {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(user),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP error ${res.status}` };
      }
      return data;
    } catch (err: any) {
      console.error('[Media API] updateMedia error:', err);
      return { success: false, error: err.message || 'Failed to update media item.' };
    }
  },

  async deleteMedia(
    id: string,
    user?: User | null
  ): Promise<{ success: boolean; message?: string; stats?: MediaStorageStats; error?: string }> {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP error ${res.status}` };
      }
      return data;
    } catch (err: any) {
      console.error('[Media API] deleteMedia error:', err);
      return { success: false, error: err.message || 'Failed to delete media item.' };
    }
  },

  async getCloudinaryStatus(
    user?: User | null
  ): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      const res = await fetch('/api/media/cloudinary/status', {
        headers: getAuthHeaders(user)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to get Cloudinary status' };
    }
  },

  async saveCloudinaryConfig(
    config: { cloudName: string; apiKey?: string; apiSecret?: string; uploadPreset?: string },
    user?: User | null
  ): Promise<{ success: boolean; message?: string; status?: any; error?: string }> {
    try {
      const res = await fetch('/api/media/cloudinary/config', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(user),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to save configuration' };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Error saving Cloudinary configuration' };
    }
  },

  async testCloudinary(
    user?: User | null
  ): Promise<{ success: boolean; message: string; ping?: any }> {
    try {
      const res = await fetch('/api/media/cloudinary/test', {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed' };
    }
  },

  async migrateToCloudinary(
    user?: User | null
  ): Promise<{ success: boolean; message?: string; migratedCount?: number; failedCount?: number; stats?: any; error?: string }> {
    try {
      const res = await fetch('/api/media/cloudinary/migrate', {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to migrate to Cloudinary' };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Migration request failed' };
    }
  }
};

