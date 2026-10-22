import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  // Navigation & Tabs
  dashboard: string;
  lostAndFoundItems: string;
  pendingDispatch: string;
  staffManagement: string;
  performance: string;
  certificates: string;
  auditLogs: string;
  removedItems: string;
  settings: string;
  myProfile: string;
  logout: string;
  collapseSidebar: string;
  expandSidebar: string;
  hotelSubtitle: string;
  
  // Header
  warwickHotel: string;
  portalTitle: string;
  searchPlaceholder: string;
  dbSynced: string;
  dbLocal: string;
  dbLive: string;
  syncedDevices: string;
  switchLanguage: string;
  notifications: string;
  quickScan: string;
  commandPalette: string;
  keyboardShortcuts: string;
  
  // Network & Sync Status Banner
  offlineMode: string;
  offlineSyncPaused: string;
  offlineNoticeDescription: string;
  offlineCheckConnection: string;
  offlineCheckingConnection: string;
  onlineRestored: string;
  onlineSyncResumed: string;
  syncPausedStatus: string;
  
  // Dashboard & Metrics
  totalFoundItems: string;
  totalItems: string;
  store: string;
  handover: string;
  dispatched: string;
  totalDispatch: string;
  dispatchedItems: string;
  allRecords: string;
  inStorage: string;
  returnedToGuests: string;
  today: string;
  loggedToday: string;
  itemsByStatus: string;
  liveBreakdown: string;
  noItemsRecorded: string;
  totalTracked: string;
  itemsByCategory: string;
  categories: string;
  latestItemsLogged: string;
  addItem: string;
  viewAll: string;
  currentlyStored: string;
  pendingDispatchMetric: string;
  handedOverCount: string;
  handoverRate: string;
  foundToday: string;
  recentActivity: string;
  addNewItem: string;
  viewAllItems: string;
  inventoryStatusOverview: string;
  monthlyTrends: string;
  itemsFound: string;
  itemsReturned: string;
  exportData: string;
  printReport: string;
  noRecentActivity: string;
  
  // Table & Lists Common
  code: string;
  itemCode: string;
  itemName: string;
  description: string;
  locationFound: string;
  storeLocation: string;
  category: string;
  roomLocation: string;
  finderStaff: string;
  status: string;
  dateFound: string;
  timeFound: string;
  retentionDeadline: string;
  storageLocation: string;
  actions: string;
  edit: string;
  delete: string;
  dispatch: string;
  image: string;
  guestName: string;
  recordedBy: string;
  daysLeft: string;
  overdue: string;
  dueToday: string;
  dueInDays: string;
  
  // Notifications
  markAllAsRead: string;
  noNotifications: string;
  clearAllNotifications: string;
  
  // Filters & Search
  filter: string;
  search: string;
  all: string;
  allCategories: string;
  allStatuses: string;
  allLocations: string;
  resetFilters: string;
  showingResults: string;
  noMatchingRecords: string;
  selectCategory: string;
  selectStatus: string;
  selectLocation: string;
  
  // Statuses
  statusStored: string;
  statusHandedOver: string;
  statusDispatched: string;
  statusPendingApproval: string;
  statusUnderReview: string;
  statusPendingClaim: string;
  statusUnclaimed: string;
  statusDonated: string;
  statusDisposed: string;
  
  // Categories
  catClothing: string;
  catDocuments: string;
  catElectronics: string;
  catFoods: string;
  catJewelry: string;
  catLuggage: string;
  catMedicines: string;
  catMoney: string;
  catPersonalItems: string;
  catOther: string;
  
  // Buttons & Actions
  viewDetails: string;
  handoverItem: string;
  dispatchToFinder: string;
  returnToStore: string;
  editItem: string;
  deleteItem: string;
  restoreItem: string;
  permanentDelete: string;
  emptyTrash: string;
  saveChanges: string;
  cancel: string;
  confirm: string;
  close: string;
  back: string;
  scanQr: string;
  download: string;
  print: string;
  copy: string;
  copied: string;
  addStaff: string;
  editStaff: string;
  deleteStaff: string;
  resetPassword: string;
  
  // Pending Dispatch View
  pendingDispatchTitle: string;
  pendingDispatchSubtitle: string;
  filterAll: string;
  filterOverdue: string;
  filterDueToday: string;
  filterDue3Days: string;
  processDispatch: string;
  noPendingDispatch: string;
  awaitingFulfillment: string;
  pastPolicyWindow: string;
  immediateAction: string;
  dueIn3Days: string;
  upcomingCutoff: string;
  allRetentionInCompliance: string;
  urgency: string;
  immediate: string;
  daysRemaining: string;

  // Items View Extras
  exportExcel: string;
  exportCSV: string;
  pendingApproval: string;
  pending: string;
  displaced: string;
  datePreset: string;
  allDates: string;
  yesterday: string;
  last7Days: string;
  thisMonth: string;
  last30Days: string;
  customRange: string;
  to: string;
  filters: string;
  reset: string;
  approve: string;
  viewPrintQr: string;
  handoverToGuest: string;
  
  // Staff Management View
  staffManagementTitle: string;
  staffManagementSubtitle: string;
  staffSerial: string;
  staffName: string;
  staffRole: string;
  staffDepartment: string;
  staffContact: string;
  staffEmail: string;
  staffPhone: string;
  staffStatus: string;
  activeStatus: string;
  inactiveStatus: string;
  noStaffFound: string;
  
  // Removed Items View
  trashTitle: string;
  trashSubtitle: string;
  trashEmptyMessage: string;
  deletedAt: string;
  deletedBy: string;
  deletionReason: string;
  confirmEmptyTrash: string;
  confirmRestoreItem: string;
  confirmPermanentDelete: string;
  
  // User Profile & Settings
  profileTitle: string;
  profileSubtitle: string;
  accountDetails: string;
  securitySettings: string;
  activeSessionsTitle: string;
  terminateSession: string;
  generalSettings: string;
  codePrefix: string;
  categorySettings: string;
  storageLocations: string;
  dispatchRules: string;
  rolesPermissions: string;
  dataImportExport: string;
  mongoSettings: string;
  
  // Modals & Forms
  registerNewItem: string;
  editRecordTitle: string;
  itemDetails: string;
  itemDescription: string;
  descriptionPlaceholder: string;
  roomPlaceholder: string;
  guestNamePlaceholder: string;
  selectFinder: string;
  selectStoreLocation: string;
  dispatchDurationDays: string;
  itemPhoto: string;
  uploadPhoto: string;
  dragPhotoHere: string;
  
  // Handover Modal
  handoverTitle: string;
  handoverSubtitle: string;
  guestIdType: string;
  guestIdNumber: string;
  guestPhoneNumber: string;
  handoverNotes: string;
  handoverDate: string;
  completeHandover: string;
  
  // Dispatch Modal
  dispatchTitle: string;
  dispatchSubtitle: string;
  recipientStaff: string;
  authorizedBy: string;
  dispatchNotes: string;
  dispatchDate: string;
  completeDispatch: string;
  
  // Return To Store Modal
  returnToStoreTitle: string;
  returnToStoreSubtitle: string;
  newStoreLocation: string;
  returnReason: string;
  
  // QR & Print Modals
  qrScannerTitle: string;
  qrScannerSubtitle: string;
  qrCodeTitle: string;
  pointCamera: string;
  enterCodeManually: string;
  printReportTitle: string;
  dateRange: string;
  generatePdf: string;
  
  // Roles
  roleSuperAdmin: string;
  roleAdmin: string;
  roleManager: string;
  roleSupervisor: string;
  roleStaff: string;
  roleSecurity: string;
  roleHousekeeping: string;
  roleFrontDesk: string;
  
  // Error Messages & Validations
  errorRequiredField: string;
  errorItemNameRequired: string;
  errorCategoryRequired: string;
  errorLocationRequired: string;
  errorEnglishOnly: string;
  errorGuestNameRequired: string;
  errorIdNumberRequired: string;
  errorPhoneRequired: string;
  errorStaffNameRequired: string;
  errorInvalidEmail: string;
  errorPasswordLength: string;
  errorDatabaseConnection: string;
  errorSaveFailed: string;
  errorDeleteFailed: string;
  errorUnauthorized: string;
  
  // Success Messages
  successItemCreated: string;
  successItemUpdated: string;
  successHandoverComplete: string;
  successDispatchComplete: string;
  successItemDeleted: string;
  successItemRestored: string;
  successTrashEmptied: string;
  successSettingsSaved: string;
  successStaffSaved: string;
  successPasswordUpdated: string;
  successSessionTerminated: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Tabs
    dashboard: 'Dashboard',
    lostAndFoundItems: 'Lost & Found Items',
    pendingDispatch: 'Pending Dispatch',
    staffManagement: 'Staff Management',
    performance: 'Performance',
    certificates: 'Certificates & Awards',
    auditLogs: 'Audit Logs',
    removedItems: 'Removed Items (Trash)',
    settings: 'Settings',
    myProfile: 'My Profile',
    logout: 'Sign Out',
    collapseSidebar: 'Collapse Sidebar',
    expandSidebar: 'Expand Sidebar',
    hotelSubtitle: 'Hotels and Resorts',

    // Header
    warwickHotel: 'Warwick Baha Hotel',
    portalTitle: 'Lost & Found Management Portal',
    searchPlaceholder: 'Search by item name, room, finder, category...',
    dbSynced: 'DB Synced',
    dbLocal: 'Database: Local',
    dbLive: 'MongoDB: Live',
    syncedDevices: 'Active Synced Devices',
    switchLanguage: 'Language: English',
    notifications: 'Notifications',
    quickScan: 'Scan QR / Tag',
    commandPalette: 'Command Palette & Search',
    keyboardShortcuts: 'Keyboard Shortcuts',

    // Network & Sync Status Banner
    offlineMode: 'Connection Lost',
    offlineSyncPaused: 'Sync is currently paused',
    offlineNoticeDescription: 'Changes are preserved locally and will automatically synchronize when your network connection is restored.',
    offlineCheckConnection: 'Check Connection',
    offlineCheckingConnection: 'Checking...',
    onlineRestored: 'Connection Restored',
    onlineSyncResumed: 'Sync resumed — updates synchronized with server.',
    syncPausedStatus: 'Sync Paused (Offline)',

    // Dashboard & Metrics
    totalFoundItems: 'TOTAL FOUND ITEMS',
    totalItems: 'TOTAL ITEM',
    store: 'STORE',
    handover: 'HANDOVER',
    dispatched: 'DISPATCHED',
    totalDispatch: 'TOTAL DISPATCH',
    dispatchedItems: 'Dispatched / Disposed',
    allRecords: 'All registered records',
    inStorage: 'In hotel storage',
    returnedToGuests: 'Returned to guests',
    today: 'Today',
    loggedToday: 'Logged today',
    itemsByStatus: 'Items by Status',
    liveBreakdown: 'Live Breakdown',
    noItemsRecorded: 'No items recorded yet',
    totalTracked: 'Total Tracked',
    itemsByCategory: 'Items by Category',
    categories: 'Categories',
    latestItemsLogged: 'Latest items logged across hotel departments',
    addItem: 'Add New Item',
    viewAll: 'View All',
    currentlyStored: 'CURRENTLY STORED',
    pendingDispatchMetric: 'PENDING DISPATCH',
    handedOverCount: 'HANDED OVER',
    handoverRate: 'Handover Rate',
    foundToday: 'Found Today',
    recentActivity: 'Recent Inventory Submissions',
    addNewItem: 'Register New Lost Item',
    viewAllItems: 'View All Items',
    inventoryStatusOverview: 'Inventory Status Distribution',
    monthlyTrends: 'Monthly Inflow vs Return Trends',
    itemsFound: 'Items Found',
    itemsReturned: 'Items Returned',
    exportData: 'Export Excel / CSV',
    printReport: 'Print Report',
    noRecentActivity: 'No recent inventory activity logged.',

    // Table & Lists Common
    code: 'Code',
    itemCode: 'Code / Tag',
    itemName: 'Item Details',
    description: 'Description',
    locationFound: 'Location Found',
    storeLocation: 'Store Location',
    category: 'Category',
    roomLocation: 'Room / Location',
    finderStaff: 'Found By (Staff)',
    status: 'Status',
    dateFound: 'Date Found',
    timeFound: 'Time Found',
    retentionDeadline: 'Retention Deadline',
    storageLocation: 'Storage Location',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    dispatch: 'Dispatch',
    image: 'Photo',
    guestName: 'Guest Name',
    recordedBy: 'Recorded By',
    daysLeft: 'days left',
    overdue: 'Overdue',
    dueToday: 'Due Today',
    dueInDays: 'days remaining',

    // Notifications
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications at this time',
    clearAllNotifications: 'Clear all',

    // Filters & Search
    filter: 'Filter',
    search: 'Search',
    all: 'All',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    allLocations: 'All Locations',
    resetFilters: 'Reset Filters',
    showingResults: 'Showing results',
    noMatchingRecords: 'No matching lost & found records found.',
    selectCategory: 'Select Category',
    selectStatus: 'Select Status',
    selectLocation: 'Select Storage Location',

    // Statuses
    statusStored: 'Stored',
    statusHandedOver: 'Handed Over',
    statusDispatched: 'Dispatched (Finder)',
    statusPendingApproval: 'Pending Approval',
    statusUnderReview: 'Under Review',
    statusPendingClaim: 'Pending Claim',
    statusUnclaimed: 'Unclaimed',
    statusDonated: 'Donated',
    statusDisposed: 'Disposed',

    // Categories
    catClothing: 'Clothing',
    catDocuments: 'Documents',
    catElectronics: 'Electronics',
    catFoods: 'Foods',
    catJewelry: 'Jewelry',
    catLuggage: 'Luggage',
    catMedicines: 'Medicines',
    catMoney: 'Money',
    catPersonalItems: 'Personal Items',
    catOther: 'Other',

    // Buttons & Actions
    viewDetails: 'View Details',
    handoverItem: 'Handover to Guest',
    dispatchToFinder: 'Dispatch to Finder Staff',
    returnToStore: 'Return to Storage',
    editItem: 'Edit Record',
    deleteItem: 'Move to Trash',
    restoreItem: 'Restore Item',
    permanentDelete: 'Delete Permanently',
    emptyTrash: 'Empty Trash',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    scanQr: 'Scan QR Code',
    download: 'Download',
    print: 'Print Tag',
    copy: 'Copy',
    copied: 'Copied!',
    addStaff: 'Add Staff Member',
    editStaff: 'Edit Staff',
    deleteStaff: 'Delete Staff',
    resetPassword: 'Reset Password',

    // Pending Dispatch View
    pendingDispatchTitle: 'Pending Dispatch Records',
    pendingDispatchSubtitle: 'Items exceeding or approaching storage retention threshold for finder staff claiming',
    filterAll: 'All Pending Items',
    filterOverdue: 'Overdue Items',
    filterDueToday: 'Due Today',
    filterDue3Days: 'Due in 3 Days',
    processDispatch: 'Process Staff Dispatch',
    noPendingDispatch: 'No items currently pending dispatch to finder staff.',
    awaitingFulfillment: 'Awaiting fulfillment',
    pastPolicyWindow: 'Past policy window',
    immediateAction: 'Immediate action',
    dueIn3Days: 'Due in 3 days',
    upcomingCutoff: 'Upcoming cutoff',
    allRetentionInCompliance: 'All inventory retention records are within compliance.',
    urgency: 'Urgency',
    immediate: 'Immediate',
    daysRemaining: 'days remaining',

    // Items View Extras
    exportExcel: 'Export Excel',
    exportCSV: 'CSV',
    pendingApproval: 'Staff Submissions Awaiting Approval',
    pending: 'Pending',
    displaced: 'Displaced',
    datePreset: 'Date Range',
    allDates: 'All Dates',
    yesterday: 'Yesterday',
    last7Days: 'Last 7 Days',
    thisMonth: 'This Month',
    last30Days: 'Last 30 Days',
    customRange: 'Custom Range',
    to: 'to',
    filters: 'More Filters',
    reset: 'Reset',
    approve: 'Approve',
    viewPrintQr: 'View, Print & Download QR Tag',
    handoverToGuest: 'Handover to Guest',

    // Staff Management View
    staffManagementTitle: 'Hotel Staff Management',
    staffManagementSubtitle: 'Manage hotel staff accounts, departments, and system access permissions',
    staffSerial: 'Serial / ID',
    staffName: 'Staff Name',
    staffRole: 'System Role',
    staffDepartment: 'Department',
    staffContact: 'Contact Details',
    staffEmail: 'Email Address',
    staffPhone: 'Phone Number',
    staffStatus: 'Account Status',
    activeStatus: 'Active',
    inactiveStatus: 'Inactive',
    noStaffFound: 'No staff members found matching criteria.',

    // Removed Items View
    trashTitle: 'Removed Items (Trash Bin)',
    trashSubtitle: 'Items soft-deleted from inventory. Auto-purged after 60 days of retention.',
    trashEmptyMessage: 'Trash bin is empty. No removed items found.',
    deletedAt: 'Deleted At',
    deletedBy: 'Deleted By',
    deletionReason: 'Deletion Reason',
    confirmEmptyTrash: 'Are you sure you want to permanently empty all items in trash?',
    confirmRestoreItem: 'Restore this item back to active inventory?',
    confirmPermanentDelete: 'Are you sure you want to permanently delete this record? This cannot be undone.',

    // User Profile & Settings
    profileTitle: 'My Staff Profile',
    profileSubtitle: 'View your account credentials, role permissions, and active device sessions',
    accountDetails: 'Account Information',
    securitySettings: 'Security & Password',
    activeSessionsTitle: 'Active Synchronized Devices',
    terminateSession: 'Terminate Session',
    generalSettings: 'General Settings',
    codePrefix: 'Serial Code Prefix',
    categorySettings: 'Item Categories',
    storageLocations: 'Storage Locations',
    dispatchRules: 'Dispatch & Retention Rules',
    rolesPermissions: 'Roles & Permissions Matrix',
    dataImportExport: 'Data Backup & Import/Export',
    mongoSettings: 'MongoDB Atlas Database Settings',

    // Modals & Forms
    registerNewItem: 'Register New Lost Item',
    editRecordTitle: 'Edit Lost & Found Record',
    itemDetails: 'Item Information',
    itemDescription: 'Item Description & Details',
    descriptionPlaceholder: 'Detailed visual description, distinguishing marks, serial numbers...',
    roomPlaceholder: 'e.g. Room 402, Main Lobby, Restaurant, Gym...',
    guestNamePlaceholder: 'Optional: Guest name if associated with room reservation',
    selectFinder: 'Select Finder Staff Member',
    selectStoreLocation: 'Select Storage Location',
    dispatchDurationDays: 'Dispatch Duration (Days)',
    itemPhoto: 'Item Image / Photo',
    uploadPhoto: 'Upload Photo',
    dragPhotoHere: 'Drag and drop photo here or click to browse',

    // Handover Modal
    handoverTitle: 'Handover Item to Guest',
    handoverSubtitle: 'Verify guest identity and record release documentation',
    guestIdType: 'Identity Type (National ID / Passport / Iqama)',
    guestIdNumber: 'Identity / Document Number',
    guestPhoneNumber: 'Guest Phone / Mobile Number',
    handoverNotes: 'Handover Notes & Release Remarks',
    handoverDate: 'Handover Release Date',
    completeHandover: 'Confirm & Release to Guest',

    // Dispatch Modal
    dispatchTitle: 'Dispatch Item to Finder Staff',
    dispatchSubtitle: 'Retention period expired. Item released to finder staff according to hotel policy.',
    recipientStaff: 'Recipient Staff Member',
    authorizedBy: 'Authorized Manager / Supervisor',
    dispatchNotes: 'Dispatch Authorization Notes',
    dispatchDate: 'Dispatch Date',
    completeDispatch: 'Confirm Staff Dispatch',

    // Return To Store Modal
    returnToStoreTitle: 'Return Item to Storage',
    returnToStoreSubtitle: 'Revert item status back to stored in custody',
    newStoreLocation: 'Target Storage Location',
    returnReason: 'Reason for Returning to Storage',

    // QR & Print Modals
    qrScannerTitle: 'QR & Barcode Scanner',
    qrScannerSubtitle: 'Scan item QR code tag for instant lookup and processing',
    qrCodeTitle: 'Item QR Code Tag',
    pointCamera: 'Point your camera at the item QR code',
    enterCodeManually: 'Or enter item code manually',
    printReportTitle: 'Print Inventory & Audit Report',
    dateRange: 'Date Range',
    generatePdf: 'Generate & Print Report',

    // Roles
    roleSuperAdmin: 'Super Admin',
    roleAdmin: 'Administrator',
    roleManager: 'Manager',
    roleSupervisor: 'Supervisor',
    roleStaff: 'Staff Member',
    roleSecurity: 'Security',
    roleHousekeeping: 'Housekeeping',
    roleFrontDesk: 'Front Desk',

    // Error Messages & Validations
    errorRequiredField: 'This field is required.',
    errorItemNameRequired: 'Please enter the item name.',
    errorCategoryRequired: 'Please select a valid category.',
    errorLocationRequired: 'Please specify the room or location where item was found.',
    errorEnglishOnly: 'Please use standard English characters for item name and code.',
    errorGuestNameRequired: 'Guest name is required for handover verification.',
    errorIdNumberRequired: 'Guest ID / Passport number is required.',
    errorPhoneRequired: 'Contact phone number is required.',
    errorStaffNameRequired: 'Staff member name is required.',
    errorInvalidEmail: 'Please enter a valid email address.',
    errorPasswordLength: 'Password must be at least 6 characters.',
    errorDatabaseConnection: 'Failed to connect to MongoDB. Operating on local database.',
    errorSaveFailed: 'An error occurred while saving. Please try again.',
    errorDeleteFailed: 'Failed to delete record. Please check permissions.',
    errorUnauthorized: 'You do not have permission to perform this action.',

    // Success Messages
    successItemCreated: 'Lost item record registered successfully.',
    successItemUpdated: 'Item details updated successfully.',
    successHandoverComplete: 'Item successfully handed over to guest.',
    successDispatchComplete: 'Item successfully dispatched to finder staff.',
    successItemDeleted: 'Item moved to trash bin.',
    successItemRestored: 'Item restored back to active inventory.',
    successTrashEmptied: 'Trash bin emptied successfully.',
    successSettingsSaved: 'Hotel settings saved successfully.',
    successStaffSaved: 'Staff profile updated successfully.',
    successPasswordUpdated: 'Password changed successfully.',
    successSessionTerminated: 'Remote session terminated successfully.'
  },
  ar: null as any
};

(translations as any).ar = translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isRTL: boolean;
  translateCategory: (category?: string) => string;
  translateStatus: (status?: string) => string;
  translateRole: (role?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('warwick_app_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const applyLanguageAttributes = () => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    document.body.classList.remove('font-arabic');
  };

  const setLanguage = (_lang: Language) => {
    setLanguageState('en');
    localStorage.setItem('warwick_app_language', 'en');
    applyLanguageAttributes();
  };

  const toggleLanguage = () => {
    setLanguage('en');
  };

  useEffect(() => {
    applyLanguageAttributes();
  }, []);

  const currentTranslations = translations[language] || translations.en;

  // Category translation helper
  const translateCategory = (category?: any): string => {
    const catStr = typeof category === 'string' ? category : (category?.name || '');
    if (!catStr) return currentTranslations.catOther;
    const cat = catStr.trim();
    if (language === 'en') return cat;
    switch (cat.toLowerCase()) {
      case 'clothing': return currentTranslations.catClothing;
      case 'documents': return currentTranslations.catDocuments;
      case 'electronics': return currentTranslations.catElectronics;
      case 'foods': return currentTranslations.catFoods;
      case 'jewelry': return currentTranslations.catJewelry;
      case 'luggage': return currentTranslations.catLuggage;
      case 'medicines': return currentTranslations.catMedicines;
      case 'money': return currentTranslations.catMoney;
      case 'personal items': return currentTranslations.catPersonalItems;
      default: return cat;
    }
  };

  // Status translation helper
  const translateStatus = (status?: any): string => {
    const statusStr = typeof status === 'string' ? status : (status?.name || status?.label || '');
    if (!statusStr) return currentTranslations.statusStored;
    const s = statusStr.trim();
    if (language === 'en') return s;
    switch (s.toLowerCase()) {
      case 'stored': return currentTranslations.statusStored;
      case 'handed over':
      case 'handed_over':
      case 'returned':
      case 'claimed':
        return currentTranslations.statusHandedOver;
      case 'dispatched': return currentTranslations.statusDispatched;
      case 'pending approval': return currentTranslations.statusPendingApproval;
      case 'under review': return currentTranslations.statusUnderReview;
      case 'pending claim': return currentTranslations.statusPendingClaim;
      case 'unclaimed': return currentTranslations.statusUnclaimed;
      case 'donated': return currentTranslations.statusDonated;
      case 'disposed': return currentTranslations.statusDisposed;
      default: return s;
    }
  };

  // Role translation helper
  const translateRole = (role?: any): string => {
    const roleStr = typeof role === 'string' ? role : (role?.name || role?.role || '');
    if (!roleStr) return currentTranslations.roleStaff;
    const r = roleStr.trim();
    if (language === 'en') return r;
    switch (r.toLowerCase()) {
      case 'super admin': return currentTranslations.roleSuperAdmin;
      case 'admin': return currentTranslations.roleAdmin;
      case 'manager': return currentTranslations.roleManager;
      case 'supervisor': return currentTranslations.roleSupervisor;
      case 'staff': return currentTranslations.roleStaff;
      case 'security': return currentTranslations.roleSecurity;
      case 'housekeeping': return currentTranslations.roleHousekeeping;
      case 'front desk': return currentTranslations.roleFrontDesk;
      default: return r;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language: 'en',
        setLanguage,
        toggleLanguage,
        t: translations.en,
        isRTL: false,
        translateCategory,
        translateStatus,
        translateRole
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

