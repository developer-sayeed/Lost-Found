import { getAuthHeaders, getDeviceId } from './client';
import { authApi } from './auth.api';
import { settingsApi } from './settings.api';
import { staffApi } from './staff.api';
import { itemsApi } from './items.api';
import { notificationsApi } from './notifications.api';
import { auditApi } from './audit.api';
import { databaseApi } from './database.api';
import { securityApi } from './security.api';
import { publicApi } from './public.api';
import { certificatesApi } from './certificates.api';
import { backupApi } from './backup.api';

export {
  getAuthHeaders,
  getDeviceId,
  authApi,
  settingsApi,
  staffApi,
  itemsApi,
  notificationsApi,
  auditApi,
  databaseApi,
  securityApi,
  publicApi,
  certificatesApi,
  backupApi
};

export const api = {
  getDeviceId,
  getAuthHeaders,
  ...authApi,
  ...settingsApi,
  ...staffApi,
  ...itemsApi,
  ...notificationsApi,
  ...auditApi,
  ...databaseApi,
  ...securityApi,
  ...publicApi,
  ...certificatesApi,
  ...backupApi
};

export default api;
