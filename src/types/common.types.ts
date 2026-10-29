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
  | 'removed'
  | 'media';

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
  | 'media'
  | 'media_view'
  | 'media_upload'
  | 'media_edit'
  | 'media_delete'
  | 'audit_logs'
  | 'settings'
  | 'settings_hotel_info'
  | 'settings_categories'
  | 'settings_security'
  | 'settings_backup'
  | 'settings_devices'
  | 'settings_import_export'
  | 'settings_alerts'
  | 'settings_login_page';

export type PermissionCategory = 'Items' | 'Operations' | 'Certificates' | 'Media' | 'Administration' | 'Settings';

export interface PermissionDefinition {
  id: PermissionKey;
  label: string;
  category: PermissionCategory;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // --- Items ---
  {
    id: 'view',
    label: 'View Items & Analytics',
    category: 'Items',
    description: 'View lost & found items, search records, filters, and dashboard summary statistics'
  },
  {
    id: 'create',
    label: 'Add / Register Items',
    category: 'Items',
    description: 'Log newly found items, assign locations, deadlines, item photos, and finders'
  },
  {
    id: 'edit',
    label: 'Edit Item Information',
    category: 'Items',
    description: 'Update item descriptions, categories, storage locations, and tags'
  },
  {
    id: 'delete',
    label: 'Delete Items (Move to Trash)',
    category: 'Items',
    description: 'Move lost item records to Removed Items trash'
  },
  {
    id: 'handover',
    label: 'Handover to Guest',
    category: 'Items',
    description: 'Process guest item return, verify receiver ID, and mark as handed over'
  },
  {
    id: 'dispatch',
    label: 'Dispatch to Finder Staff',
    category: 'Items',
    description: 'Process return of unclaimed items to finder staff member upon retention expiry'
  },
  {
    id: 'print',
    label: 'Print Receipts & Export Excel',
    category: 'Items',
    description: 'Print official handover receipts, item summary sheets, QR codes, and export data'
  },
  {
    id: 'removed_items',
    label: 'Removed Items (Recycle Bin)',
    category: 'Items',
    description: 'Access the Removed Items category, view soft-deleted records, and restore items'
  },

  // --- Operations ---
  {
    id: 'performance',
    label: 'Staff Performance Analytics',
    category: 'Operations',
    description: 'View 30-day staff item processing analytics, charts, leaderboards, and throughput reports'
  },
  {
    id: 'audit_logs',
    label: 'Audit & Accountability Logs',
    category: 'Operations',
    description: 'View, filter, search, and export detailed audit trails tracking every system change and staff action'
  },

  // --- Certificates ---
  {
    id: 'certificates',
    label: 'Certificates Master Access',
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
    description: 'Generate, design, and issue new certificates using the 5-star studio and hotel award presets'
  },
  {
    id: 'certificates_edit',
    label: 'Edit Certificates',
    category: 'Certificates',
    description: 'Modify certificate content, typography, layouts, signatures, and custom attributes'
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
    id: 'certificates_delete',
    label: 'Delete Certificates',
    category: 'Certificates',
    description: 'Permanently remove issued certificate records from hotel award history'
  },

  // --- Media Library ---
  {
    id: 'media',
    label: 'Media Library Master Access',
    category: 'Media',
    description: 'Master access to view, upload, edit, and manage all photos and video proof records'
  },
  {
    id: 'media_view',
    label: 'View Media Files & Lightbox',
    category: 'Media',
    description: 'Browse uploaded photos, item proof pictures, and videos with fullscreen preview'
  },
  {
    id: 'media_upload',
    label: 'Upload Photos & Videos',
    category: 'Media',
    description: 'Upload new media files, photos, and video proof records to the central media vault'
  },
  {
    id: 'media_edit',
    label: 'Edit Media Metadata',
    category: 'Media',
    description: 'Update media titles, descriptive captions, tags, and item linkages'
  },
  {
    id: 'media_delete',
    label: 'Delete Media Files',
    category: 'Media',
    description: 'Permanently delete uploaded media files from server storage'
  },

  // --- Administration ---
  {
    id: 'staff_management',
    label: 'View Staff Directory',
    category: 'Administration',
    description: 'Access the staff management directory and employee listings'
  },
  {
    id: 'view_staff_profile',
    label: 'View Other Staff Profiles',
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
    description: 'Permanently remove staff members from the active system'
  },
  {
    id: 'manage_staff_access',
    label: 'Manage Security & Permissions',
    category: 'Administration',
    description: 'Modify staff security permissions, roles, custom overrides, and credential access levels'
  },

  // --- Settings ---
  {
    id: 'settings',
    label: 'System Settings Master Access',
    category: 'Settings',
    description: 'Full master access across all system configuration, branding, and integration settings'
  },
  {
    id: 'settings_hotel_info',
    label: 'Hotel Information & Branding',
    category: 'Settings',
    description: 'View and configure hotel profile, brand logos, contact details, and currency'
  },
  {
    id: 'settings_categories',
    label: 'Item Categories & Locations',
    category: 'Settings',
    description: 'Manage lost & found item categories, storage locations, and default retention durations'
  },
  {
    id: 'settings_security',
    label: 'Password & Security Policy',
    category: 'Settings',
    description: 'Configure password rules, session limits, and account lockout policies'
  },
  {
    id: 'settings_backup',
    label: 'Google Drive & System Backups',
    category: 'Settings',
    description: 'Manage automatic backup schedules, cloud sync, and archives'
  },
  {
    id: 'settings_devices',
    label: 'Connected Devices & Terminals',
    category: 'Settings',
    description: 'Monitor active device sessions, remote logout, and terminal blacklist rules'
  },
  {
    id: 'settings_import_export',
    label: 'Data Import & Export',
    category: 'Settings',
    description: 'Import item and staff records from Excel/CSV and export database archives'
  },
  {
    id: 'settings_alerts',
    label: 'Alerts & Validation Rules',
    category: 'Settings',
    description: 'Configure retention period alerts, notification rules, and validation checks'
  },
  {
    id: 'settings_login_page',
    label: 'Login Page Theme Customizer',
    category: 'Settings',
    description: 'Customize employee login page branding, background wallpapers, and welcome text'
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
    'delete',
    'removed_items',
    'performance',
    'audit_logs',
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_delete',
    'certificates_print',
    'certificates_save',
    'media',
    'media_view',
    'media_upload',
    'media_edit',
    'media_delete',
    'staff_management',
    'view_staff_profile',
    'edit_staff',
    'delete_staff',
    'manage_staff_access',
    'settings',
    'settings_hotel_info',
    'settings_categories',
    'settings_security',
    'settings_backup',
    'settings_devices',
    'settings_import_export',
    'settings_alerts',
    'settings_login_page'
  ],
  'Admin': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'delete',
    'removed_items',
    'performance',
    'audit_logs',
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_delete',
    'certificates_print',
    'certificates_save',
    'media',
    'media_view',
    'media_upload',
    'media_edit',
    'staff_management',
    'view_staff_profile',
    'edit_staff',
    'manage_staff_access',
    'settings',
    'settings_hotel_info',
    'settings_categories',
    'settings_security',
    'settings_backup',
    'settings_devices',
    'settings_import_export',
    'settings_alerts',
    'settings_login_page'
  ],
  'Manager': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'performance',
    'audit_logs',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_print',
    'certificates_save',
    'media_view',
    'media_upload',
    'staff_management',
    'view_staff_profile',
    'settings',
    'settings_hotel_info',
    'settings_categories',
    'settings_alerts'
  ],
  'Supervisor': [
    'view',
    'create',
    'edit',
    'handover',
    'dispatch',
    'print',
    'performance',
    'audit_logs',
    'certificates_view',
    'certificates_print',
    'media_view',
    'media_upload',
    'view_staff_profile'
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
    'handover',
    'print',
    'audit_logs'
  ]
};
