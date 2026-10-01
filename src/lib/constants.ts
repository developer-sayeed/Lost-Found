import { LostItem, StaffMember, HotelSettings, User, CategoryConfig, DEFAULT_TOAST_CONFIG, DEFAULT_VALIDATION_MESSAGES, AuditLog } from '../types';

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
  hotelArabicName: 'ورويك الباحة',
  hotelSubTitle: 'Hotels and Resorts',
  logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
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
  certificateEnablePrintPreview: false
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

export const INITIAL_ITEMS: LostItem[] = [
  {
    id: 'item-001',
    code: 'LF-2026-0001',
    itemName: 'Thop',
    category: 'Clothing',
    description: 'Traditional white thobe garment left in wardrobe closet.',
    dateFound: '2026-08-22',
    timeFound: '14:30',
    locationFound: 'Room 404',
    roomNumber: '404',
    guestName: 'Unknown',
    employeeName: 'Minhaz',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-20',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-22T22:35:00Z',
    updatedAt: '2026-08-22T22:35:00Z',
    timeline: [
      {
        id: 'tl-001-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-22T22:35:00Z',
        notes: 'Found in Room 404 by Minhaz'
      },
      {
        id: 'tl-001-2',
        action: 'Stored in HK Office',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-22T22:35:00Z',
        notes: 'Placed in garment rack 3'
      }
    ]
  },
  {
    id: 'item-002',
    code: 'LF-2026-0002',
    itemName: 'Chargers',
    category: 'Electronics',
    description: 'Apple USB-C 30W Power Adapter with white braided lightning cable.',
    dateFound: '2026-08-22',
    timeFound: '11:15',
    locationFound: 'Room 216',
    roomNumber: '216',
    guestName: 'Sarah Jenkins',
    employeeName: 'Weal Salem',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-20',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-22T12:00:00Z',
    updatedAt: '2026-08-22T12:00:00Z',
    timeline: [
      {
        id: 'tl-002-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-22T12:00:00Z',
        notes: 'Left plugged into nightstand'
      }
    ]
  },
  {
    id: 'item-003',
    code: 'LF-2026-0003',
    itemName: 'Katel',
    category: 'Electronics',
    description: 'Electric cordless water kettle, stainless steel finish.',
    dateFound: '2026-08-21',
    timeFound: '16:45',
    locationFound: 'Room 205',
    roomNumber: '205',
    guestName: 'Abdullah Al-Shehri',
    employeeName: 'Minhaz',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-19',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-21T17:15:00Z',
    updatedAt: '2026-08-21T17:15:00Z',
    timeline: [
      {
        id: 'tl-003-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-21T17:15:00Z'
      }
    ]
  },
  {
    id: 'item-004',
    code: 'LF-2026-0004',
    itemName: 'Medicine',
    category: 'Medicines',
    description: 'Prescription blood pressure medication in pharmacy pouch.',
    dateFound: '2026-08-19',
    timeFound: '09:30',
    locationFound: 'Room 613',
    roomNumber: '613',
    guestName: 'Tariq Mansoor',
    employeeName: 'Weal Salem',
    storeLocation: 'HK Store',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-17',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-19T10:00:00Z',
    updatedAt: '2026-08-19T10:00:00Z',
    timeline: [
      {
        id: 'tl-004-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-19T10:00:00Z'
      }
    ]
  },
  {
    id: 'item-005',
    code: 'LF-2026-0005',
    itemName: 'Slipper + Others Items',
    category: 'Personal Items',
    description: 'Luxury hotel velvet slippers and personal toiletry bag.',
    dateFound: '2026-08-20',
    timeFound: '15:20',
    locationFound: 'Room 503',
    roomNumber: '503',
    guestName: 'Fahad Al-Otaibi',
    employeeName: 'Samir El Kassas',
    storeLocation: 'HK Store',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-18',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-20T16:00:00Z',
    updatedAt: '2026-08-20T16:00:00Z',
    timeline: [
      {
        id: 'tl-005-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-20T16:00:00Z'
      }
    ]
  },
  {
    id: 'item-006',
    code: 'LF-2026-0006',
    itemName: 'Cloth',
    category: 'Clothing',
    description: 'Navy blue men blazer jacket in closet.',
    dateFound: '2026-08-18',
    timeFound: '11:00',
    locationFound: 'Room 514',
    roomNumber: '514',
    guestName: 'Mohammad Khan',
    employeeName: 'Minhaz',
    storeLocation: 'HK Store',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-16',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-18T11:45:00Z',
    updatedAt: '2026-08-18T11:45:00Z',
    timeline: [
      {
        id: 'tl-006-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-18T11:45:00Z'
      }
    ]
  },
  {
    id: 'item-007',
    code: 'LF-2026-0007',
    itemName: 'Cloth',
    category: 'Clothing',
    description: 'Silk scarf with gold geometric pattern.',
    dateFound: '2026-08-18',
    timeFound: '13:10',
    locationFound: 'Room 615',
    roomNumber: '615',
    guestName: 'Noura Al-Zahrani',
    employeeName: 'Weal Salem',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-16',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-18T14:00:00Z',
    updatedAt: '2026-08-18T14:00:00Z',
    timeline: [
      {
        id: 'tl-007-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-18T14:00:00Z'
      }
    ]
  },
  {
    id: 'item-008',
    code: 'LF-2026-0008',
    itemName: 'Thop',
    category: 'Clothing',
    description: 'Embroidered formal Saudi thobe.',
    dateFound: '2026-08-18',
    timeFound: '16:00',
    locationFound: 'Room 518',
    roomNumber: '518',
    guestName: 'Khalid Al-Ghamdi',
    employeeName: 'Minhaz',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-16',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-18T16:30:00Z',
    updatedAt: '2026-08-18T16:30:00Z',
    timeline: [
      {
        id: 'tl-008-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-18T16:30:00Z'
      }
    ]
  },
  {
    id: 'item-009',
    code: 'LF-2026-0009',
    itemName: 'Medicine',
    category: 'Medicines',
    description: 'Insulin pen and cold packs stored in mini fridge.',
    dateFound: '2026-05-25',
    timeFound: '10:00',
    locationFound: 'Room 302',
    roomNumber: '302',
    guestName: 'Yousef Al-Harbi',
    employeeName: 'Weal Salem',
    storeLocation: 'HK Fridge',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-08-23',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-05-25T10:30:00Z',
    updatedAt: '2026-08-23T07:00:00Z',
    timeline: [
      {
        id: 'tl-009-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-05-25T10:30:00Z'
      }
    ]
  },
  {
    id: 'item-010',
    code: 'LF-2026-0010',
    itemName: 'Medicines',
    category: 'Medicines',
    description: 'Allergy relief tablets and nasal spray.',
    dateFound: '2026-05-29',
    timeFound: '14:20',
    locationFound: 'Room 108',
    roomNumber: '108',
    guestName: 'Mona Al-Dosari',
    employeeName: 'Minhaz',
    storeLocation: 'hk store',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-08-27',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-05-29T15:00:00Z',
    updatedAt: '2026-08-20T09:00:00Z',
    timeline: [
      {
        id: 'tl-010-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-05-29T15:00:00Z'
      }
    ]
  },
  {
    id: 'item-011',
    code: 'LF-2026-0011',
    itemName: 'Decorations Set-up Items Glass',
    category: 'Other',
    description: 'Decorations Set-up Items Glass crystal vase and candle holders.',
    dateFound: '2026-08-10',
    timeFound: '18:00',
    locationFound: 'Room 218',
    roomNumber: '218',
    guestName: 'N/A',
    employeeName: 'MD ABU SAYEED RIDAY',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-08',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-10T19:00:00Z',
    updatedAt: '2026-08-16T19:39:00Z',
    timeline: [
      {
        id: 'tl-011-1',
        action: 'Item Registered',
        performedBy: 'MD ABU SAYEED RIDAY',
        timestamp: '2026-08-10T19:00:00Z'
      }
    ]
  },
  {
    id: 'item-012',
    code: 'LF-2026-0012',
    itemName: 'Rolex Submariner Watch',
    category: 'Jewelry',
    description: 'Black dial luxury timepiece with stainless steel oyster bracelet.',
    dateFound: '2026-08-05',
    timeFound: '11:30',
    locationFound: 'Room 701',
    roomNumber: '701',
    guestName: 'Hassan Al-Majed',
    employeeName: 'Minhaz',
    storeLocation: 'HK Safe Locker',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-11-03',
    status: 'Stored',
    recordedBy: 'MD ABU SAYEED RIDAY',
    createdAt: '2026-08-05T12:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
    timeline: [
      {
        id: 'tl-012-1',
        action: 'Item Registered',
        performedBy: 'Minhaz',
        timestamp: '2026-08-05T12:00:00Z'
      }
    ]
  },
  {
    id: 'item-013',
    code: 'LF-2026-0013',
    itemName: 'Leather Travel Wallet',
    category: 'Personal Items',
    description: 'Brown Montblanc leather wallet containing boarding passes.',
    dateFound: '2026-08-01',
    timeFound: '08:45',
    locationFound: 'Lobby Lounge',
    employeeName: 'Alhanouf Alghamdi',
    storeLocation: 'HK Office',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-10-30',
    status: 'Stored',
    recordedBy: 'Alhanouf Alghamdi',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-02T16:20:00Z',
    timeline: [
      {
        id: 'tl-013-1',
        action: 'Item Registered',
        performedBy: 'Alhanouf Alghamdi',
        timestamp: '2026-08-01T09:00:00Z'
      }
    ]
  },
  {
    id: 'item-014',
    code: 'LF-2026-0014',
    itemName: 'International Passport',
    category: 'Documents',
    description: 'UK Passport in black leather cover.',
    dateFound: '2026-07-28',
    timeFound: '14:00',
    locationFound: 'Restaurant VIP Area',
    employeeName: 'Samir El Kassas',
    storeLocation: 'HK Safe Locker',
    dispatchDurationDays: 90,
    dispatchDeadline: '2026-10-26',
    status: 'Stored',
    recordedBy: 'Samir El Kassas',
    createdAt: '2026-07-28T14:30:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
    timeline: [
      {
        id: 'tl-014-1',
        action: 'Item Registered',
        performedBy: 'Samir El Kassas',
        timestamp: '2026-07-28T14:30:00Z'
      }
    ]
  }
];

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
