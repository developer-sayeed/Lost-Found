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

export type ItemStatus =
  | 'Stored'
  | 'Handed Over'
  | 'Claimed'
  | 'Dispatched'
  | 'Pending Claim'
  | 'Under Review'
  | 'Unclaimed'
  | 'Donated'
  | 'Disposed'
  | 'Found'
  | 'Pending'
  | 'Pending Approval'
  | 'Archived';

export type ItemCategory = string;

export interface CategoryConfig {
  id: string;
  name: string;
  retentionDays: number;
  description?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Employee'
  | 'Receptionist'
  | 'Housekeeping'
  | 'Security';

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
  // Certificate Specific Permissions
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
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_edit',
    'certificates_print',
    'certificates_save',
    'audit_logs',
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
    'certificates',
    'certificates_view',
    'certificates_create',
    'certificates_print',
    'audit_logs'
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

export type StaffDepartment =
  | 'Housekeeping'
  | 'Manager'
  | 'Receptionist'
  | 'Security'
  | 'Front Desk'
  | 'Food & Beverage'
  | 'Maintenance';

export interface LostItem {
  id: string;
  code: string; // e.g. LF-2026-08-112
  itemName: string;
  category: ItemCategory;
  description: string;
  brand?: string;
  color?: string;
  dateFound: string; // YYYY-MM-DD
  timeFound?: string;
  locationFound: string; // e.g. "Room 404", "Lobby"
  roomNumber?: string;
  guestName?: string;
  employeeName: string; // finder
  foundBy?: string;
  loggedBy?: string;
  storeLocation: string; // e.g. "HK Office", "HK Store", "HK Fridge"
  dispatchDurationDays: number; // e.g. 90
  dispatchDeadline: string; // YYYY-MM-DD
  status: ItemStatus;
  recordedBy: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Approval System fields
  isApproved?: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  submittedByStaffId?: string;
  submittedByStaffName?: string;
  rejectionReason?: string;
  // Soft Delete / Trash System (Retained for 60 days before auto-purge)
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: string;
  deletionReason?: string;
  // Handover details if handed over
  handoverDetails?: {
    receiverName: string;
    contactNumber: string;
    idType?: string;
    idNumber?: string;
    handoverDate: string;
    handedOverBy: string;
    remarks?: string;
  };
  // Dispatch details if dispatched
  dispatchDetails?: {
    courierName?: string;
    trackingNumber?: string;
    destination?: string;
    dispatchedDate?: string;
    dispatchedAt?: string;
    dispatchedBy?: string;
    dispatchedTo?: string;
    remarks?: string;
    notes?: string;
  };
  // Detailed Activity Log & Custody Timeline
  timeline: ItemActivityEvent[];
  activityLog?: ItemActivityEvent[];
  // Store Deposit Reminder tracking (1-hour periodic reminder if pending > 4 hours)
  lastDepositReminderAt?: string;
  metadata?: Record<string, any>;
  // Offline caching & sync status
  isOfflineQueued?: boolean;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface OfflineQueuedAction {
  id: string;
  type: 'CREATE_ITEM' | 'UPDATE_ITEM' | 'HANDOVER_ITEM' | 'DISPATCH_ITEM' | 'STATUS_CHANGE';
  localId?: string;
  localCode?: string;
  itemId?: string;
  payload?: any;
  createdAt: string;
  retryCount?: number;
  lastError?: string;
}

export interface ActivityChangeField {
  field: string;
  label: string;
  from?: any;
  to?: any;
}

export interface ItemActivityEvent {
  id: string;
  action: string;
  actionType?:
    | 'create'
    | 'update'
    | 'dispatch'
    | 'handover'
    | 'return_to_store'
    | 'approve'
    | 'reject'
    | 'delete'
    | 'restore'
    | 'status_change';
  performedBy: string;
  performedByRole?: string;
  performedByEmail?: string;
  timestamp: string;
  notes?: string;
  changes?: ActivityChangeField[];
  meta?: Record<string, any>;
}

export type TimelineEvent = ItemActivityEvent;

export interface StaffMember {
  id: string;
  serial: number;
  name: string;
  userId: string; // email / identifier
  email: string;
  phone: string;
  department: StaffDepartment;
  role: UserRole;
  password?: string;
  tempPassword?: string;
  tempPasswordExpiresAt?: string;
  isTempPassword?: boolean;
  status: 'Active' | 'Inactive' | 'Suspended';
  avatar?: string;
  dateOfBirth?: string;
  iqamaNumber?: string;
  staffId?: string;
  workplace?: string;
  position?: string;
  emergencyContact?: string;
  notes?: string;
  itemsFoundCount: number;
  handoversCount: number;
  permissions?: PermissionKey[];
  createdAt: string;
  lastLogin?: string;
  lastActive?: string;
  token?: string;
}

export type Staff = StaffMember;

export interface HotelLink {
  id: string;
  label: string;
  url: string;
}

export interface HeadingColorsConfig {
  h1?: string;
  h2?: string;
  h3?: string;
  h4?: string;
  h5?: string;
  h6?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  buttonTextColor: string;
  headingColor: string;
  headingColors?: HeadingColorsConfig;
  headingColorH1?: string;
  headingColorH2?: string;
  headingColorH3?: string;
  headingColorH4?: string;
  headingColorH5?: string;
  headingColorH6?: string;
  accentColor: string;
  fontFamily: string;
  buttonRadius: string;
  isCustom?: boolean;
}

export interface HotelSettings {
  id: string;
  hotelName: string;
  hotelArabicName?: string;
  hotelSubTitle?: string;
  logoUrl: string;
  logoWidth?: number;
  logoHeight?: number;
  logoFit?: 'contain' | 'cover' | 'fill';
  faviconUrl?: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  website: string;
  additionalLinks: HotelLink[];
  defaultDispatchDurationDays: number;
  defaultStoreLocation: string;
  codePrefix: string;
  autoSyncEnabled: boolean;
  lastSyncedAt: string;
  lastCachePurgedAt?: string;
  cacheVersion?: number;
  syncedDevicesCount: number;
  version: number;
  // Theme & Appearance Customizer
  fontFamily?: string;
  fontColor?: string;
  headingColor?: string;
  headingColors?: HeadingColorsConfig;
  headingColorH1?: string;
  headingColorH2?: string;
  headingColorH3?: string;
  headingColorH4?: string;
  headingColorH5?: string;
  headingColorH6?: string;
  primaryColor?: string;
  secondaryColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonTextColor?: string;
  accentColor?: string;
  buttonRadius?: string;
  activePresetId?: string;
  customPresets?: ThemePreset[];
  customColors?: string[];
  isDarkMode?: boolean;
  themeMode?: 'light' | 'dark' | 'system';
  autoLogoutMinutes?: number;
  categories?: CategoryConfig[];
  showDepartmentProcessingShare?: boolean;
  toastConfig?: ToastConfig;
  validationMessages?: ValidationMessagesConfig;

  // Login Page Customizer & Security Portal Controls (Admin Managed)
  loginPageTitle?: string;
  loginPageSubtitle?: string;
  loginPageTagline?: string;
  loginLogoUrl?: string;
  loginLogoWidth?: number;
  loginLogoHeight?: number;
  loginLogoFit?: 'contain' | 'cover' | 'fill';
  showLoginCrownBadge?: boolean;
  loginBackgroundStyle?: 'luxury-dark' | 'royal-indigo' | 'hotel-emerald' | 'minimal-clean' | 'custom-color' | 'custom-image';
  loginBgColor?: string;
  loginHeaderBgColor?: string;
  loginBgImageUrl?: string;
  loginCardBlur?: boolean;
  loginBannerNotice?: string;
  loginBannerType?: 'none' | 'info' | 'warning' | 'shield';
  loginFooterText?: string;
  showForgotPasswordHelp?: boolean;
  showQuickLoginHelper?: boolean;
  loginSupportPhone?: string;
  loginSupportEmail?: string;

  // Multi-Database System Architecture Configuration
  multiDbConfig?: MultiDatabaseSystemState;

  // Public Hotel Guest Website & Inquiries Portal Settings
  publicWebsiteSettings?: PublicWebsiteSettings;

  // Certificate Branding & 5-Star Hotel Configuration
  certificateLogoUrl?: string;
  certificateHotelName?: string;
  certificateHotelSubtitle?: string;
  certificateShowFiveStars?: boolean;
  certificateDefaultSignatoryLeftTitle?: string;
  certificateDefaultSignatoryLeftName?: string;
  certificateDefaultSignatoryRightTitle?: string;
  certificateDefaultSignatoryRightName?: string;
  certificateDraft?: any;
  certificatePrintBehavior?: 'direct' | 'preview'; // 'direct' = trigger system print dialog directly, 'preview' = open customized printable preview first
  certificateEnablePrintPreview?: boolean; // convenience boolean flag mirroring certificatePrintBehavior === 'preview'

  // System Role Baseline Permission Matrix Customization
  rolePermissions?: Partial<Record<UserRole, PermissionKey[]>>;

  // Google Drive Automated Cloud Backup Configuration
  googleDriveBackup?: GoogleDriveBackupSettings;
}

export interface GoogleDriveBackupSettings {
  autoBackupEnabled: boolean;
  autoBackupFrequency: '6h' | '12h' | 'daily' | 'weekly';
  autoBackupIncludeAuditLogs: boolean;
  autoBackupMaxFilesToKeep: number;
  lastBackupDate?: string;
  lastBackupFileId?: string;
  lastBackupFileName?: string;
  lastBackupFileSize?: number;
  lastBackupDriveLink?: string;
  lastBackupStatus?: 'success' | 'failed' | 'in_progress';
  lastBackupError?: string;
  nextScheduledBackup?: string;
  backupFolderId?: string;
  backupFolderName?: string;
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size?: string | number;
  createdTime: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  description?: string;
  recordsCount?: {
    items?: number;
    staff?: number;
    certificates?: number;
    logs?: number;
  };
}

export interface FullSystemBackupPackage {
  version: string;
  timestamp: string;
  source: string;
  environment: string;
  hotelName: string;
  database: {
    items: LostItem[];
    staff: StaffMember[];
    users: Partial<User>[];
    settings: HotelSettings;
    certificates: Certificate[];
    certificateTemplates?: CustomCertificateTemplate[];
    auditLogs?: AuditLog[];
    notifications?: AppNotification[];
  };
  websiteConfig: {
    publicWebsite?: PublicWebsiteSettings;
    additionalLinks?: HotelLink[];
    categories?: CategoryConfig[];
    customColors?: string[];
    themeMode?: 'light' | 'dark' | 'system';
    brandName?: string;
  };
  stats: {
    totalItems: number;
    totalStaff: number;
    totalCertificates: number;
    totalLogs: number;
    totalTemplates?: number;
  };
}

export interface ToastConfig {
  enableToasts?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoClose?: number;
  theme?: 'colored' | 'light' | 'dark';
  itemRegistered?: string;
  itemUpdated?: string;
  itemApproved?: string;
  itemRejected?: string;
  itemHandedOver?: string;
  itemDispatched?: string;
  itemTrash?: string;
  itemDeleted?: string;
  itemReturned?: string;
  itemRestored?: string;
  batchTrash?: string;
  batchRestored?: string;
  batchDispatched?: string;
  batchDeleted?: string;
  trashEmptied?: string;
  offlineSaved?: string;
  wifiSynced?: string;
  profileUpdated?: string;
  staffSaved?: string;
  staffDeleted?: string;
  // Login & Authentication Toast Customizations
  loginSuccess?: string;
  loginError?: string;
  loginSuccessConfetti?: boolean;
  loginSuccessPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  loginSuccessAutoClose?: number;
}

export interface ValidationMessagesConfig {
  valItemName?: string;
  valCategory?: string;
  valLocation?: string;
  valFinder?: string;
  valReceiver?: string;
  valStaffName?: string;
  valStaffEmail?: string;
  valStaffEmailInvalid?: string;
  valStaffPassword?: string;
  valLoginId?: string;
  valLoginPassword?: string;
  valLockedItem?: string;
  valRejectionReason?: string;
  valNotifStaffDelete?: string;
  valDispatchMethod?: string;
  valTrackingRef?: string;
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  enableToasts: true,
  position: 'top-right',
  autoClose: 4000,
  theme: 'colored',
  itemRegistered: '📦 Item {code} ({name}) registered & stored successfully!',
  itemUpdated: '✏️ Item {code} ({name}) updated successfully!',
  itemApproved: '✅ Storage request for {code} approved!',
  itemRejected: '🚫 Item {code} submission rejected.',
  itemHandedOver: '🤝 Item {code} handed over to {receiver}!',
  itemDispatched: '🚚 Item {code} dispatched / released successfully!',
  itemTrash: '📁 Item {code} moved to Removed Items (retained for 60 days).',
  itemDeleted: '🗑️ Item {code} permanently deleted.',
  itemReturned: '🔄 Item {code} returned to Stored inventory!',
  itemRestored: '♻️ Item {code} restored to active inventory!',
  batchTrash: '📁 Moved {count} items to Removed Items.',
  batchRestored: '♻️ Restored {count} items to active inventory!',
  batchDispatched: '🚚 Successfully dispatched {count} items!',
  batchDeleted: '🗑️ Permanently deleted {count} items.',
  trashEmptied: '🗑️ Removed Items archive emptied successfully.',
  offlineSaved: '📶 Saved locally in offline mode! Will sync when reconnected.',
  wifiSynced: '📶 Wi-Fi sync complete: {count} offline record(s) synchronized!',
  profileUpdated: '👤 Profile updated successfully!',
  staffSaved: '👤 Staff member saved successfully!',
  staffDeleted: '🗑️ Staff member removed successfully!',
  loginSuccess: '🔐 Authentication validated. Welcome {name} to {hotel}!',
  loginError: '⚠️ Access Denied: Invalid credentials. Verification failed.',
  loginSuccessConfetti: true,
  loginSuccessPosition: 'top-right',
  loginSuccessAutoClose: 3500
};

export const DEFAULT_VALIDATION_MESSAGES: ValidationMessagesConfig = {
  valItemName: '⚠️ Please provide an item title/name.',
  valCategory: '⚠️ Please select an item category.',
  valLocation: '⚠️ Please enter the room number or location found.',
  valFinder: "⚠️ Please enter the finder's name or staff ID.",
  valReceiver: '⚠️ Please enter the receiver / guest name.',
  valStaffName: "⚠️ Please enter the staff member's full name.",
  valStaffEmail: "⚠️ Please enter the staff member's email address.",
  valStaffEmailInvalid: '⚠️ Please enter a valid email format (e.g. staff@warwickhotels.com).',
  valStaffPassword: '⚠️ Please enter a password for the staff account.',
  valLoginId: '⚠️ Please enter your Staff ID or registered Email address.',
  valLoginPassword: '⚠️ Please enter your password to validate dashboard access.',
  valLockedItem: '⚠️ Handed Over items are locked and cannot be deleted.',
  valRejectionReason: '⚠️ Please provide a reason for rejection.',
  valNotifStaffDelete: '⚠️ Only Administrators and Supervisors can delete notifications.',
  valDispatchMethod: '⚠️ Please specify the dispatch/release method.',
  valTrackingRef: '⚠️ Please enter the batch reference or tracking number.'
};

export interface DeviceSession {
  deviceId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  deviceType?: 'Desktop' | 'Mobile' | 'Tablet';
  browser?: string;
  os?: string;
  ip?: string;
  lastSeen: string;
  createdAt?: string;
  userAgent?: string;
  isCurrent?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: StaffDepartment;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  iqamaNumber?: string;
  staffId?: string;
  workplace?: string;
  position?: string;
  emergencyContact?: string;
  permissions?: PermissionKey[];
  password?: string;
  authProvider: 'email' | 'google';
  lastActive?: string;
  token?: string;
}

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

export interface DashboardStats {
  totalItems: number;
  foundToday: number;
  stored: number;
  handedOver: number;
  dispatched: number;
  pendingDispatch: number;
  overdueDispatch: number;
  dueTodayDispatch: number;
  dueInThreeDaysDispatch: number;
  itemsByCategory: Record<ItemCategory, number>;
  itemsByStatus: Record<ItemStatus, number>;
  monthlyTrends: Array<{ month: string; found: number; returned: number }>;
}

export interface MongoStatus {
  connected: boolean;
  connecting: boolean;
  databaseName: string;
  host: string;
  source: 'mongodb' | 'local_json_fallback';
  uriConfigured: boolean;
  maskedUri: string;
  error?: string;
  lastConnectedAt?: string;
  pingMs?: number;
  collections: {
    itemsCount: number;
    staffCount: number;
    usersCount: number;
    auditLogsCount: number;
    settingsCount: number;
  };
}

export interface FilterState {
  searchQuery: string;
  status: string;
  category: string;
  month: string;
  year: string;
  storeLocation: string;
  startDate?: string;
  endDate?: string;
  datePreset?: string;
}

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

// -------------------------------------------------------------
// MULTI-DATABASE SYSTEM ARCHITECTURE TYPES
// -------------------------------------------------------------

export type DatabaseEngineType =
  | 'mongodb'
  | 'firebase'
  | 'firestore'
  | 'sql'
  | 'postgresql'
  | 'redis'
  | 'supabase'
  | 'local_json'
  | 'indexeddb';

export type DatabaseStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'replicating'
  | 'standby'
  | 'error';

export interface DatabaseConnectionInfo {
  id: string;
  name: string;
  type: DatabaseEngineType;
  description: string;
  badge: string;
  uri?: string;
  host?: string;
  port?: number;
  dbName?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  schema?: string;
  realtimeSyncEnabled?: boolean;
  ssl?: boolean;
  status: DatabaseStatus;
  isPrimary: boolean;
  isEnabled: boolean;
  pingMs?: number;
  lastSyncAt?: string;
  error?: string;
  recordCounts?: {
    items: number;
    staff: number;
    inquiries: number;
    settings: number;
    notifications: number;
  };
}

export interface MultiDatabaseSystemState {
  primaryEngine: DatabaseEngineType;
  replicationMode: 'dual-write' | 'multi-write' | 'primary-only' | 'eventual';
  realtimeSyncEnabled: boolean;
  autoFailoverEnabled: boolean;
  lastGlobalSyncAt?: string;
  activeConnectionsCount: number;
  totalReplicatedRecords: number;
  averagePingMs: number;
  databases: DatabaseConnectionInfo[];
  syncLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    engine: DatabaseEngineType;
    status: 'success' | 'warning' | 'error';
    details: string;
    durationMs: number;
  }>;
}

export interface DatabaseHealthInfo {
  success: boolean;
  engine: DatabaseEngineType;
  name: string;
  status: 'connected' | 'degraded' | 'error' | 'disconnected' | 'timeout';
  pingMs: number;
  message: string;
  checkedAt: string;
  isPrimary: boolean;
  host?: string;
  dbName?: string;
}

// -------------------------------------------------------------
// PUBLIC HOTEL GUEST WEBSITE & INQUIRY PORTAL TYPES
// -------------------------------------------------------------

export type GuestInquiryStatus =
  | 'Received'
  | 'Under Review'
  | 'Matched'
  | 'Ready for Pickup'
  | 'Dispatched'
  | 'Closed';

export interface GuestInquiry {
  id: string;
  trackingCode: string; // e.g. WARWICK-CLM-2026-0042
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber?: string;
  stayDate?: string;
  category: ItemCategory;
  itemName: string;
  description: string;
  brand?: string;
  color?: string;
  locationLost?: string;
  dateLost: string;
  photoUrl?: string;
  status: GuestInquiryStatus;
  matchedItemId?: string;
  matchedItemCode?: string;
  staffNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicWebsiteSettings {
  enabled: boolean;
  portalTitle: string;
  portalSubtitle: string;
  welcomeMessage: string;
  bannerNotice: string;
  showBannerNotice: boolean;
  contactPhone: string;
  contactEmail: string;
  allowPublicItemSearch: boolean;
  autoNotifyStaffOnInquiry: boolean;
  policyNotes: string;
  lostRetentionDays: number;
  heroImageUrl?: string;
  allowGuestPhotoUpload: boolean;
}

export const DEFAULT_PUBLIC_WEBSITE_SETTINGS: PublicWebsiteSettings = {
  enabled: true,
  portalTitle: 'Warwick Hotel Baha - Guest Lost & Found Portal',
  portalSubtitle: 'Official Guest Inquiry, Lost Property Reporting & Real-Time Tracking Service',
  welcomeMessage: 'Did you misplace a personal belonging during your stay at Warwick Hotel Baha? Our Concierge & Loss Prevention team is here 24/7 to help you search our registry or submit a recovery inquiry.',
  bannerNotice: '🌟 Concierge Notice: All found valuables (electronics, jewelry, wallets) are secured in our safe deposit vault for 90 days. Inquiries are processed within 2 hours.',
  showBannerNotice: true,
  contactPhone: '+966 17 725 1111',
  contactEmail: 'lostfound@warwickbahahotel.com',
  allowPublicItemSearch: true,
  autoNotifyStaffOnInquiry: true,
  policyNotes: 'All unclaimed guest items are securely categorized and held according to hotel policy. Valid government identification (Passport/Iqama) or room confirmation is required during handover.',
  lostRetentionDays: 90,
  allowGuestPhotoUpload: true
};

export type CertificateTemplateType =
  | 'employee_of_month'
  | 'appreciation'
  | 'star_eom'
  | 'star_appreciation'
  | 'star_leadership'
  | 'star_hospitality'
  | 'star_milestone'
  | 'star_mastery'
  | 'custom'
  | string;

export interface CertificateColors {
  primary?: string;
  primaryColor?: string; // Main wave, banner, or header brand color
  accent?: string;
  accentColor?: string; // Gold swoosh, stars, highlights
  border?: string;
  borderColor?: string; // Outer frame or flourish border color
  text?: string;
  textColor?: string; // Title / text color
  background?: string;
  backgroundColor?: string; // Canvas background tint
}

export type HotelLogoPreset =
  | 'warwick_crest'
  | 'grand_star'
  | 'royal_crown'
  | 'luxury_monogram'
  | 'none';

export type CertificateBadgeStyle =
  | 'rosette'
  | 'gold_seal'
  | 'laurel_crest'
  | 'star_medallion'
  | 'shield_crest'
  | 'crown_crest'
  | 'none';

export type CertificateBorderStyle =
  | 'royal_frame'
  | 'geometric_gold'
  | 'baroque_filigree'
  | 'double_border'
  | 'ornate_gold'
  | 'classic_gold'
  | 'ivy_laurel'
  | 'shield_crest_frame'
  | 'modern_minimalist'
  | 'imperial_black_gold';

export interface CustomCertificateTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  backgroundImageUrl: string; // Base64 data URL or uploaded certificate image URL (empty string for Elementor vector designs)
  isCustom: boolean;
  defaultTitle?: string;
  defaultCitation?: string;
  textMode?: 'full' | 'fill_in_blanks'; // 'full': headers + recipient + text; 'fill_in_blanks': only recipient name, date, signatures
  textColor?: string;
  accentColor?: string;
  nameOffsetY?: number; // Y-offset percentage (0 - 100%) for positioning recipient name over background
  nameFontSize?: number; // Font size in px
  citationOffsetY?: number;
  customColors?: CertificateColors;
  layoutCoordinates?: Record<string, { x: number; y: number; isVisible?: boolean }>;
  elements?: any[]; // BuilderElement[] for Elementor layouts
  settings?: any; // CanvasSettings
  thumbnailBadge?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  template: CertificateTemplateType;
  customTemplateId?: string;
  customTemplateName?: string;
  customBackgroundImage?: string;
  customColors?: CertificateColors;
  textMode?: 'full' | 'fill_in_blanks';
  nameOffsetY?: number;
  nameFontSize?: number;
  title: string;
  presentationText?: string; // e.g. "THIS CERTIFICATE IS PROUDLY PRESENTED TO"
  recipientName: string;
  recipientStaffId?: string;
  recipientPosition?: string;
  recipientDepartment?: string;
  awardPeriod?: string; // e.g. "June 2026"
  citationText: string;
  citationAlignment?: 'center' | 'left' | 'justify' | 'right';
  citationFontSize?: number;
  location?: string; // e.g. "Al Baha, Saudi Arabia"
  awardDate: string; // e.g. "15 June 2026"
  signatory1Title: string; // e.g. "Housekeeping Manager"
  signatory1Name?: string;
  signatory2Title: string; // e.g. "General Manager"
  signatory2Name?: string;
  signatory3Title?: string; // e.g. "Director of Operations"
  signatory3Name?: string;
  showSignatory3?: boolean;
  signatoryLeftTitle?: string;
  signatoryLeftName?: string;
  signatoryRightTitle?: string;
  signatoryRightName?: string;
  signatoryCenterTitle?: string;
  signatoryCenterName?: string;
  enableThirdSignatory?: boolean;
  // Signatures (Embedded canvas drawings or uploaded PNG images)
  signatory1Signature?: string;
  signatory2Signature?: string;
  signatory3Signature?: string;
  notes?: string;

  // Hotel branding & Logo options
  hotelName?: string; // e.g. "WARWICK" or custom hotel name
  hotelSubtitle?: string; // e.g. "HOTEL AL BAHA • HOTELS & RESORTS"
  hotelLogoUrl?: string; // custom uploaded logo image (base64 data url or image link)
  hotelLogoPreset?: HotelLogoPreset;
  hotelLogoSize?: number; // size in px (e.g. 40 - 130)
  showHotelLogo?: boolean;
  showHotelBranding?: boolean; // optional toggle for hotel name & subtitle
  showFiveStars?: boolean;
  hotelNameFontSize?: number;
  hotelNameIsBold?: boolean;
  hotelNameIsItalic?: boolean;

  // Rich text formatting overrides
  recipientNameIsBold?: boolean;
  recipientNameIsItalic?: boolean;
  citationIsBold?: boolean;
  citationIsItalic?: boolean;

  // Seal & Medal customizations
  showBadge?: boolean;
  badgeStyle?: CertificateBadgeStyle;
  badgeText?: string;
  badgeSubtext?: string;

  // Frame, Typography & Watermark customizations
  borderStyle?: CertificateBorderStyle;
  frameColor?: string; // custom frame/border color
  frameWidth?: number; // custom frame border width in px
  backgroundColor?: string; // custom body background color
  backgroundGradient?: string; // custom gradient background
  backgroundTexture?: string; // custom background pattern/texture
  fontFamily?: string;
  fontFamilyChoice?: 'serif' | 'playfair' | 'cinzel' | 'sans';
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;

  // Drag-and-drop Visual Layout Coordinates
  layoutCoordinates?: Record<string, { x: number; y: number; isVisible?: boolean }>;

  // Elementor Layout definitions
  elements?: any[];
  settings?: any;

  issuedBy: string;
  issuedByRole?: string;
  issuedAt: string;
  createdAt: string;
  updatedAt?: string;
}



