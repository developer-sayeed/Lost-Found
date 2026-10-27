export type ActiveTab =
  | 'dashboard'
  | 'items'
  | 'dispatch'
  | 'staff'
  | 'performance'
  | 'certificates'
  | 'audit_logs'
  | 'databases'
  | 'settings'
  | 'profile'
  | 'removed';

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Employee'
  | 'Receptionist'
  | 'Housekeeping'
  | 'Security';

export type StaffDepartment =
  | 'Housekeeping'
  | 'Manager'
  | 'Receptionist'
  | 'Security'
  | 'Front Desk'
  | 'Food & Beverage'
  | 'Maintenance';

export type PermissionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'handover'
  | 'dispatch'
  | 'print'
  | 'delete'
  | 'removed_items'
  | 'staff_management'
  | 'performance'
  | 'view_staff_profile'
  | 'edit_staff'
  | 'delete_staff'
  | 'manage_staff_access'
  | 'certificates'
  | 'certificates_view'
  | 'certificates_create'
  | 'certificates_edit'
  | 'certificates_delete'
  | 'certificates_print'
  | 'certificates_save'
  | 'audit_logs'
  | 'settings';

export type PermissionCategory = 'Items' | 'Operations' | 'Certificates' | 'Administration';

export interface PermissionDefinition {
  id: PermissionKey;
  label: string;
  category: PermissionCategory;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    id: 'view',
    label: 'View Items & Analytics',
    category: 'Items',
    description: 'View lost & found items, search records, filters, and dashboard statistics'
  },
  {
    id: 'create',
    label: 'Add / Register Items',
    category: 'Items',
    description: 'Log newly found items, assign locations, deadlines, and finders'
  },
  {
    id: 'edit',
    label: 'Edit Item Information',
    category: 'Items',
    description: 'Update item descriptions, categories, storage locations, and tags'
  },
  {
    id: 'delete',
    label: 'Delete Items',
    category: 'Items',
    description: 'Move lost item records to Removed Items trash'
  },
  {
    id: 'handover',
    label: 'Handover to Guest',
    category: 'Operations',
    description: 'Process guest item return, verify receiver ID, and mark as handed over (Admin only)'
  },
  {
    id: 'dispatch',
    label: 'Dispatch to Finder Staff',
    category: 'Operations',
    description: 'Process return of unclaimed items to finder staff member upon retention expiry'
  },
  {
    id: 'removed_items',
    label: 'Removed Items (Recycle Bin)',
    category: 'Operations',
    description: 'Access the Removed Items category, view soft-deleted records, and restore items'
  },
  {
    id: 'print',
    label: 'Print & Export Reports',
    category: 'Operations',
    description: 'Print official handover receipts, item summary sheets, and export Excel data'
  },
  {
    id: 'performance',
    label: 'Staff Performance Analytics',
    category: 'Operations',
    description: 'View 30-day staff item processing analytics, charts, leaderboards, and throughput reports'
  },
  {
    id: 'certificates',
    label: 'Certificates Module Master Access',
    category: 'Certificates',
    description: 'Master access to view, generate, design, print, and manage all hotel award certificates'
  },
  {
    id: 'certificates_view',
    label: 'View Certificates & Awards',
    category: 'Certificates',
    description: 'Access the Certificates module, browse awarded certificates and award templates'
  },
  {
    id: 'certificates_create',
    label: 'Add / Generate Certificate',
    category: 'Certificates',
    description: 'Generate, design, and issue new certificates using the 5-star studio and 25 hotel award presets'
  },
  {
    id: 'certificates_edit',
    label: 'Edit Certificates',
    category: 'Certificates',
    description: 'Modify certificate content, typography, layouts, signatures, and custom attributes'
  },
  {
    id: 'certificates_delete',
    label: 'Delete Certificates',
    category: 'Certificates',
    description: 'Permanently remove issued certificate records from hotel award history'
  },
  {
    id: 'certificates_print',
    label: 'Print Certificate (Direct Print)',
    category: 'Certificates',
    description: 'Access the dedicated Direct Print page and send certificates to physical printers'
  },
  {
    id: 'certificates_save',
    label: 'Save Drafts & Export PDF/PNG',
    category: 'Certificates',
    description: 'Save certificate drafts and export high-resolution PDF documents and PNG images'
  },
  {
    id: 'staff_management',
    label: 'Staff Management Access',
    category: 'Administration',
    description: 'Access the staff management directory and employee listings'
  },
  {
    id: 'view_staff_profile',
    label: 'View Other Staff Profiles & Items',
    category: 'Administration',
    description: 'Allow viewing personal profile details and logged items of other staff members'
  },
  {
    id: 'edit_staff',
    label: 'Edit Staff Information',
    category: 'Administration',
    description: 'Update staff details, department, workplace, and profile information'
  },
  {
    id: 'delete_staff',
    label: 'Delete Staff Accounts',
    category: 'Administration',
    description: 'Permanently remove staff members from the system'
  },
  {
    id: 'manage_staff_access',
    label: 'Manage Security & Permissions',
    category: 'Administration',
    description: 'Modify staff security permissions, roles, and credential access levels'
  },
  {
    id: 'audit_logs',
    label: 'Audit & Accountability Logs',
    category: 'Administration',
    description: 'View, filter, search, and export detailed audit trails tracking every status change and staff action on lost items'
  },
  {
    id: 'settings',
    label: 'System & Sync Settings',
    category: 'Administration',
    description: 'Configure hotel brand settings, custom themes, and MongoDB storage'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  'Super Admin': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'performance',
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_delete',
    'certificates_print',
    'certificates_save',
    'audit_logs',
    'delete',
    'removed_items',
    'staff_management',
    'view_staff_profile',
    'edit_staff',
    'delete_staff',
    'manage_staff_access',
    'settings'
  ],
  'Admin': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'performance',
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_delete',
    'certificates_print',
    'certificates_save',
    'audit_logs',
    'delete',
    'removed_items',
    'staff_management',
    'view_staff_profile',
    'edit_staff',
    'manage_staff_access',
    'settings'
  ],
  'Manager': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'performance',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_print',
    'certificates_save',
    'staff_management',
    'view_staff_profile',
    'settings'
  ],
  'Supervisor': [
    'view',
    'create',
    'edit',
    'dispatch',
    'print',
    'performance',
    'certificates_view',
    'certificates_print'
  ],
  'Employee': [
    'view',
    'create'
  ],
  'Receptionist': [
    'view',
    'create',
    'handover',
    'print'
  ],
  'Housekeeping': [
    'view',
    'create'
  ],
  'Security': [
    'view',
    'create',
    'print'
  ]
};
