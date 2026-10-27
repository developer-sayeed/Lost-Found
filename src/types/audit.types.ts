import { ItemStatus } from './items.types';
import { UserRole } from './common.types';

export type AuditActionType =
  | 'create'
  | 'update'
  | 'status_change'
  | 'approval'
  | 'rejection'
  | 'handover'
  | 'dispatch'
  | 'return_to_store'
  | 'trash'
  | 'restore'
  | 'delete'
  | 'bulk_action'
  | 'export'
  | 'view'
  | 'permission_change'
  | 'role_change'
  | 'user_update'
  | 'user_create'
  | 'user_delete'
  | 'certificate'
  | 'database'
  | 'inquiry'
  | 'backup'
  | 'notification';

export interface AuditLog {
  id: string;
  action: string;
  actionType?: AuditActionType;
  entityType: 'item' | 'staff' | 'settings' | 'auth' | 'certificate' | 'database' | 'inquiry' | 'backup' | 'notification' | string;
  entityId?: string;
  itemCode?: string;
  itemName?: string;
  category?: string;
  previousStatus?: ItemStatus;
  newStatus?: ItemStatus;
  performedBy: string;
  userRole?: UserRole;
  performedByRole?: UserRole | string;
  performedByEmail?: string;
  performedById?: string;
  timestamp: string;
  details: string;
  reason?: string;
  changes?: Array<{ field: string; label: string; from: any; to: any }>;
  ip?: string;
  deviceType?: string;
  browser?: string;
  meta?: Record<string, any>;
}
