import { StaffDepartment, UserRole } from './common.types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type:
    | 'store_request'
    | 'item_approved'
    | 'item_rejected'
    | 'item_dispatched'
    | 'item_handover'
    | 'notice'
    | 'alert'
    | 'system'
    | 'custom';
  priority?: 'normal' | 'high' | 'urgent';
  targetType?: 'all' | 'department' | 'individual' | 'roles';
  targetRoles?: UserRole[];
  targetDepartment?: StaffDepartment | string;
  targetStaffName?: string;
  targetStaffEmail?: string;
  targetUserId?: string;
  senderName?: string;
  senderRole?: string;
  senderEmail?: string;
  itemId?: string;
  itemCode?: string;
  createdAt: string;
  read: boolean;
  readBy?: string[];
  deletedBy?: string[];
  metadata?: Record<string, any>;
}
