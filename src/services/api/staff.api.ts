import { StaffMember, User, DEFAULT_ROLE_PERMISSIONS } from '../../types';
import { getAuthHeaders } from './client';

export const staffApi = {
  async getStaff(): Promise<StaffMember[]> {
    try {
      const res = await fetch('/api/staff', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.staff;
      }
    } catch (e) {
      console.warn('Fallback to local staff:', e);
    }
    return [];
  },

  async checkStaffDuplicate(params: { staffId?: string; iqamaNumber?: string; email?: string; phone?: string; excludeId?: string }): Promise<{
    isDuplicate: boolean;
    errors?: Record<string, { message: string; existingName?: string; value: string }>;
    errorList?: Array<{ field: string; message: string; existingName?: string; value?: string }>;
    field?: string;
    value?: string;
    message?: string;
    existingName?: string;
  }> {
    try {
      const qs = new URLSearchParams();
      if (params.staffId) qs.set('staffId', params.staffId);
      if (params.iqamaNumber) qs.set('iqamaNumber', params.iqamaNumber);
      if (params.email) qs.set('email', params.email);
      if (params.phone) qs.set('phone', params.phone);
      if (params.excludeId) qs.set('excludeId', params.excludeId);

      const res = await fetch(`/api/staff/check-duplicate?${qs.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore network errors
    }
    return { isDuplicate: false };
  },

  async addStaff(staff: Partial<StaffMember>, user?: User | null): Promise<StaffMember> {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(staff)
      });
      if (res.ok) {
        const data = await res.json();
        return data.staff;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Duplicate entry or invalid staff data.');
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
      console.warn('Add staff fallback:', e);
    }
    const newId = staff.id || `staff-${Date.now()}`;
    return {
      id: newId,
      serial: Date.now(),
      name: staff.name || 'New Staff Member',
      userId: staff.userId || staff.email?.split('@')[0] || `user_${Date.now()}`,
      email: staff.email || '',
      phone: staff.phone || '',
      department: staff.department || 'Housekeeping',
      role: staff.role || 'Employee',
      status: staff.status || 'Active',
      permissions: staff.permissions || (staff.role ? DEFAULT_ROLE_PERMISSIONS[staff.role] : []),
      ...staff
    } as StaffMember;
  },

  async updateStaff(id: string, updates: Partial<StaffMember>, user?: User | null): Promise<StaffMember> {
    try {
      const res = await fetch(`/api/staff/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.staff;
      }
      const errData = await res.json().catch(() => ({}));
      const err: any = new Error(errData.error || errData.message || 'Duplicate entry or invalid staff data.');
      err.errors = errData.errors;
      err.errorType = errData.errorType;
      throw err;
    } catch (e: any) {
      if (e.errors || e.errorType || (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError'))) {
        throw e;
      }
      console.warn('Update staff fallback:', e);
    }
    return {
      id,
      name: updates.name || 'Staff Member',
      userId: updates.userId || id,
      email: updates.email || '',
      role: updates.role || 'Employee',
      department: updates.department || 'Housekeeping',
      status: updates.status || 'Active',
      permissions: updates.permissions || [],
      ...updates
    } as StaffMember;
  },

  async deleteStaff(id: string, user?: User | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      return res.ok;
    } catch (e) {
      console.warn('Delete staff fallback:', e);
      return true;
    }
  },

  async updateUserProfile(profile: Partial<User>, user?: User | null): Promise<User> {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      const errData = await res.json().catch(() => ({}));
      const err: any = new Error(errData.error || errData.message || 'Duplicate entry or invalid profile data.');
      err.errors = errData.errors;
      err.errorType = errData.errorType;
      throw err;
    } catch (e: any) {
      if (e.errors || e.errorType || (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError'))) {
        throw e;
      }
      console.warn('Profile update fallback:', e);
    }
    return { ...user, ...profile } as User;
  },

  async changePassword(params: { currentPassword?: string; newPassword: string; targetStaffId?: string; isTemporary?: boolean; expiresInHours?: number }, user?: User | null): Promise<{ success: boolean; message: string; staff?: StaffMember }> {
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
    return data;
  },

  async updateStaffPassword(
    staffId: string,
    params: { newPassword: string; isTemporary?: boolean; expiresInHours?: number },
    user?: User | null
  ): Promise<{ success: boolean; message: string; staff?: StaffMember }> {
    const res = await fetch(`/api/staff/${staffId}/password`, {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update staff password');
    }
    return data;
  }
};
