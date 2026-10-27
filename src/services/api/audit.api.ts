import { AuditLog, User } from '../../types';
import { getAuthHeaders } from './client';

export const auditApi = {
  async getAuditLogs(
    params?: {
      search?: string;
      entityType?: string;
      actionType?: string;
      action?: string;
      itemId?: string;
      itemCode?: string;
      userRole?: string;
      performedBy?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
    currentUser?: User | null
  ): Promise<{ logs: AuditLog[]; total: number; source: string }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.entityType) query.set('entityType', params.entityType);
      if (params?.actionType) query.set('actionType', params.actionType);
      if (params?.action) query.set('action', params.action);
      if (params?.itemId) query.set('itemId', params.itemId);
      if (params?.itemCode) query.set('itemCode', params.itemCode);
      if (params?.userRole) query.set('userRole', params.userRole);
      if (params?.performedBy) query.set('performedBy', params.performedBy);
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      if (params?.limit) query.set('limit', String(params.limit));

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`/api/audit-logs${qs}`, { headers: getAuthHeaders(currentUser) });
      if (res.ok) {
        const data = await res.json();
        return {
          logs: data.logs || [],
          total: data.total || (data.logs ? data.logs.length : 0),
          source: data.source || 'server'
        };
      }
    } catch (e) {
      console.warn('Audit logs fallback:', e);
    }
    return { logs: [], total: 0, source: 'fallback' };
  },

  async getAuditLogStats(currentUser?: User | null): Promise<any> {
    try {
      const res = await fetch('/api/audit-logs/stats', { headers: getAuthHeaders(currentUser) });
      if (res.ok) {
        const data = await res.json();
        return data.stats;
      }
    } catch (e) {
      console.warn('Audit log stats fallback:', e);
    }
    return null;
  },

  async createAuditLog(logData: Partial<AuditLog>, currentUser?: User | null): Promise<AuditLog | null> {
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.log;
      }
    } catch (e) {
      console.warn('Create audit log error:', e);
    }
    return null;
  },

  async deleteAuditLog(id: string, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/audit-logs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser)
      });
      return res.ok;
    } catch (e) {
      console.warn('Delete audit log error:', e);
      return false;
    }
  },

  async batchDeleteAuditLogs(ids: string[], currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ ids })
      });
      return res.ok;
    } catch (e) {
      console.warn('Batch delete audit logs error:', e);
      return false;
    }
  },

  async clearAuditLogs(currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ clearAll: true })
      });
      return res.ok;
    } catch (e) {
      console.warn('Clear audit logs error:', e);
      return false;
    }
  }
};
