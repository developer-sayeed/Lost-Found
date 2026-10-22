import { LostItem, StaffMember, HotelSettings, User, CategoryConfig, DEFAULT_TOAST_CONFIG, DEFAULT_VALIDATION_MESSAGES, AuditLog, DEFAULT_ROLE_PERMISSIONS } from '../types';

export const DEFAULT_ITEM_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cat-med',
    name: 'Medicine',
    retentionDays: 7,
    description: 'Prescription & OTC medicines, pharmaceuticals, and health supplies. Disposed safely after 7 days.',
    color: '#ef4444',
    isDefault: true
  },
  {
    id: 'cat-food',
    name: 'Foods & Perishables',
    retentionDays: 3,
    description: 'Fresh foods, open beverages, and perishable items. Safely discarded after 3 days for hygiene.',
    color: '#f97316',
    isDefault: true
  },
  {
    id: 'cat-cloth',
    name: 'Clothing',
    retentionDays: 30,
    description: 'Garments, shoes, jackets, thobes, scarves, hats, and textile accessories. Retained for 30 days.',
    color: '#6366f1',
    isDefault: true
  },
  {
    id: 'cat-pers',
    name: 'Personal Items',
    retentionDays: 30,
    description: 'Eyeglasses, watches, toiletries, umbrellas, books, and small personal gear. Retained for 30 days.',
    color: '#8b5cf6',
    isDefault: true
  },
  {
    id: 'cat-elec',
    name: 'Electronics',
    retentionDays: 90,
    description: 'Phones, laptops, chargers, headphones, tablets, smart devices, and cameras. Retained for 90 days.',
    color: '#0284c7',
    isDefault: true
  },
  {
    id: 'cat-doc',
    name: 'Documents / ID',
    retentionDays: 180,
    description: 'Passports, national IDs, driving licenses, credit cards, legal & travel papers. Retained for 180 days.',
    color: '#059669',
    isDefault: true
  },
  {
    id: 'cat-val',
    name: 'Valuables & Jewelry',
    retentionDays: 365,
    description: 'Gold, diamonds, expensive jewelry, luxury watches, wallets, and cash. Retained for 365 days (1 year).',
    color: '#d97706',
    isDefault: true
  },
  {
    id: 'cat-keys',
    name: 'Keys & Cards',
    retentionDays: 60,
    description: 'Vehicle keys, room keys, access fobs, and security cards. Retained for 60 days.',
    color: '#64748b',
    isDefault: true
  },
  {
    id: 'cat-other',
    name: 'Other',
    retentionDays: 30,
    description: 'General miscellaneous items not classified under standard categories. Retained for 30 days.',
    color: '#475569',
    isDefault: true
  }
];

export const INITIAL_HOTEL_SETTINGS: HotelSettings = {
  id: 'hotel-warwick-baha-01',
  hotelName: 'Warwick Hotels and Resorts',
  hotelArabicName: '',
  hotelSubTitle: 'Hotels and Resorts',
  logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
  logoLightUrl: '',
  logoDarkUrl: '',
  logoWidth: 140,
  logoHeight: 48,
  logoFit: 'contain',
  faviconUrl: '/icon.svg',
  address: 'King Abdulaziz Rd, Baljurashi 65629, Al Baha, Saudi Arabia',
  phoneNumber: '017 512 2070',
  emailAddress: 'warwickhotelbaha@gmail.com',
  website: 'https://www.warwickhotels.com/warwick-hotel-bahah',
  additionalLinks: [
    { id: 'link-1', label: 'Guest Portal', url: 'https://warwickhotels.com/baha-guest' },
    { id: 'link-2', label: 'Staff Directory', url: 'https://warwickhotels.com/staff' }
  ],
  defaultDispatchDurationDays: 90,
  defaultStoreLocation: 'HK Office',
  codePrefix: 'LF',
  autoSyncEnabled: true,
  lastSyncedAt: new Date().toISOString(),
  syncedDevicesCount: 3,
  version: 1,
  fontFamily: 'Plus Jakarta Sans',
  primaryColor: '#0F172A',
  secondaryColor: '#4F46E5',
  buttonColor: '#4F46E5',
  buttonHoverColor: '#4338CA',
  buttonTextColor: '#FFFFFF',
  headingColor: '#0F172A',
  accentColor: '#059669',
  buttonRadius: 'rounded-xl',
  activePresetId: 'preset-royal-navy',
  customPresets: [],
  isDarkMode: false,
  themeMode: 'light',
  categories: DEFAULT_ITEM_CATEGORIES,
  showDepartmentProcessingShare: false,
  toastConfig: DEFAULT_TOAST_CONFIG,
  validationMessages: DEFAULT_VALIDATION_MESSAGES,
  certificatePrintBehavior: 'direct',
  certificateEnablePrintPreview: false,
  rolePermissions: DEFAULT_ROLE_PERMISSIONS
};

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    serial: 1,
    name: 'MD ABU SAYEED RIDAY',
    userId: 'abusayeedriday@gmail.com',
    email: 'abusayeedriday@gmail.com',
    phone: '0571858601',
    department: 'Housekeeping',
    role: 'Super Admin',
    status: 'Active',
    password: '587710',
    permissions: ['view', 'create', 'edit', 'handover', 'dispatch', 'print', 'delete', 'staff_management', 'settings'],
    itemsFoundCount: 42,
    handoversCount: 19,
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: '2026-08-23T07:15:00Z'
  }
];

export const INITIAL_ITEMS: LostItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const DEPARTMENT_OPTIONS: string[] = [
  'Housekeeping',
  'Front Desk',
  'Receptionist',
  'Security',
  'Food & Beverage',
  'Maintenance',
  'Manager',
  'Executive Office',
  'Concierge',
  'Guest Services'
];
