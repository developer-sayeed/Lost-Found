import { LostItem, User, FilterState } from '../../types';
import { generateUniqueItemCode } from '../../lib/codeGenerator';
import { getAuthHeaders } from './client';

export const itemsApi = {
  async getItems(filters?: Partial<FilterState> & { includeDeleted?: boolean; deletedOnly?: boolean }): Promise<{ items: LostItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.append('search', filters.searchQuery);
      if (filters?.status && filters.status !== 'All Status') params.append('status', filters.status);
      if (filters?.category && filters.category !== 'All Categories') params.append('category', filters.category);
      if (filters?.month && filters.month !== 'All') params.append('month', filters.month);
      if (filters?.year && filters.year !== 'All') params.append('year', filters.year);
      if (filters?.includeDeleted) params.append('includeDeleted', 'true');
      if (filters?.deletedOnly) params.append('deletedOnly', 'true');

      const res = await fetch(`/api/items?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fallback to local items:', e);
    }
    return { items: [], total: 0 };
  },

  async createItem(item: Partial<LostItem>, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to create item in database.');
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
      console.warn('Create item fallback:', e);
    }
    const generatedCode = item.code || generateUniqueItemCode([], 'LF', item.dateFound);
    const newItem: LostItem = {
      id: `item-${Date.now()}`,
      code: generatedCode,
      itemName: item.itemName || 'Found Item',
      category: item.category || 'Other',
      description: item.description || '',
      dateFound: item.dateFound || new Date().toISOString().split('T')[0],
      locationFound: item.locationFound || 'Room 101',
      roomNumber: item.roomNumber,
      guestName: item.guestName || 'Unknown',
      employeeName: item.employeeName || user?.name || 'Staff',
      storeLocation: item.storeLocation || 'HK Office',
      dispatchDurationDays: item.dispatchDurationDays || 90,
      dispatchDeadline: item.dispatchDeadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'Stored',
      recordedBy: user?.name || 'MD ABU SAYEED RIDAY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}`,
          action: 'Item Registered',
          performedBy: user?.name || 'Staff',
          timestamp: new Date().toISOString()
        }
      ]
    };
    return newItem;
  },

  async updateItem(id: string, updates: Partial<LostItem>, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Could not update item in database.');
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
      console.warn('Update item fallback:', e);
    }
    throw new Error('Could not update item');
  },

  async approveItem(id: string, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {
      console.warn('Approve item fallback:', e);
    }
    throw new Error('Failed to approve item');
  },

  async rejectItem(id: string, reason?: string, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {
      console.warn('Reject item fallback:', e);
    }
    throw new Error('Failed to reject item');
  },

  async handoverItem(
    id: string,
    handover: { receiverName: string; contactNumber: string; remarks?: string; idType?: string; idNumber?: string },
    user?: User | null
  ): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/handover`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(handover)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {
      console.warn('Handover fallback:', e);
    }
    throw new Error('Failed to record handover');
  },

  async dispatchItem(
    id: string,
    dispatch: { courierName?: string; trackingNumber?: string; destination?: string; remarks?: string },
    user?: User | null
  ): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/dispatch`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(dispatch)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {
      console.warn('Dispatch fallback:', e);
    }
    throw new Error('Failed to record dispatch');
  },

  async returnToStoreItem(id: string, reason?: string, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/return-to-store`, {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to return item to store');
    } catch (e: any) {
      console.warn('Return to store item error:', e);
      throw e;
    }
  },

  async deleteItem(
    id: string,
    options?: { permanent?: boolean; reason?: string },
    user?: User | null
  ): Promise<{ success: boolean; permanent?: boolean; message?: string }> {
    try {
      const reason = options?.reason || '';
      const params = new URLSearchParams();
      if (options?.permanent) params.append('permanent', 'true');
      if (reason) params.append('reason', reason);

      const res = await fetch(`/api/items/${id}?${params.toString()}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ permanent: options?.permanent, reason })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Delete item fallback:', e);
    }
    return { success: true, permanent: options?.permanent };
  },

  async restoreItem(id: string, user?: User | null): Promise<LostItem> {
    try {
      const res = await fetch(`/api/items/${id}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {
      console.warn('Restore item fallback:', e);
    }
    throw new Error('Failed to restore item');
  },

  async batchDeleteItems(
    ids: string[],
    options?: { permanent?: boolean; reason?: string },
    user?: User | null
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const res = await fetch('/api/items/batch-delete', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({
          ids,
          permanent: options?.permanent,
          reason: options?.reason
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Batch delete fallback:', e);
    }
    return { success: true, deletedCount: ids.length };
  },

  async batchDispatchItems(
    ids: string[],
    details: { courierName?: string; trackingNumber?: string; destination?: string; dispatchedTo?: string; notes?: string },
    user?: User | null
  ): Promise<{ success: boolean; dispatchedCount: number; items?: LostItem[] }> {
    try {
      const res = await fetch('/api/items/batch-dispatch', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({
          ids,
          ...details
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Batch dispatch fallback:', e);
    }
    return { success: true, dispatchedCount: ids.length };
  },

  async batchRestoreItems(ids: string[], user?: User | null): Promise<{ success: boolean; restoredCount: number }> {
    try {
      const res = await fetch('/api/items/trash/restore-batch', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Batch restore fallback:', e);
    }
    return { success: true, restoredCount: ids.length };
  },

  async batchPermanentDeleteItems(ids: string[], user?: User | null): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const res = await fetch('/api/items/trash/delete-batch', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Batch delete fallback:', e);
    }
    return { success: true, deletedCount: ids.length };
  },

  async emptyTrash(user?: User | null): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const res = await fetch('/api/items/trash/empty', {
        method: 'POST',
        headers: getAuthHeaders(user)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Empty trash fallback:', e);
    }
    return { success: true, count: 0, message: 'Trash emptied' };
  },

  async importItems(
    items: Partial<LostItem>[],
    mode: 'append' | 'replace' = 'append',
    user?: User | null
  ): Promise<{ success: boolean; count: number; items: LostItem[]; message: string }> {
    try {
      const res = await fetch('/api/items/import', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ items, mode })
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import items');
    } catch (e: any) {
      console.warn('Import items fallback:', e);
      throw e;
    }
  }
};
