import { User } from '../../types';

export function getDeviceId(): string {
  let id = localStorage.getItem('warwick_device_id');
  if (!id) {
    id = `dev-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('warwick_device_id', id);
  }
  return id;
}

export function getAuthHeaders(user?: User | null) {
  let currentUser = user;
  if (!currentUser) {
    try {
      const saved = localStorage.getItem('warwick_auth_user');
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    } catch {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId()
  };

  if (currentUser) {
    if (currentUser.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }
    headers['x-user-name'] = currentUser.name || '';
    headers['x-user-role'] = currentUser.role || '';
    headers['x-user-email'] = currentUser.email || '';
    headers['x-user-id'] = currentUser.id || '';
    if (currentUser.department) {
      headers['x-user-department'] = currentUser.department;
    }
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      headers['x-user-permissions'] = JSON.stringify(currentUser.permissions);
    }
  }
  return headers;
}
