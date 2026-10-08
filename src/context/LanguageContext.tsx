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
    switchLanguage: 'عربي (Arabic)',
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
  ar: {
    // Navigation & Tabs
    dashboard: 'لوحة التحكم',
    lostAndFoundItems: 'المفقودات والموجودات',
    pendingDispatch: 'بانتظار التسليم للموظف',
    staffManagement: 'إدارة الموظفين',
    performance: 'أداء الموظفين',
    certificates: 'الشهادات والجوائز',
    auditLogs: 'سجلات التدقيق والمعاينة',
    removedItems: 'سلة المهملات (المحذوفات)',
    settings: 'الإعدادات',
    myProfile: 'ملفي الشخصي',
    logout: 'تسجيل الخروج',
    collapseSidebar: 'طي القائمة الجانبية',
    expandSidebar: 'توسيع القائمة الجانبية',
    hotelSubtitle: 'فنادق ومنتجعات',

    // Header
    warwickHotel: 'فندق وارويك الباحة',
    portalTitle: 'بوابة إدارة المفقودات والموجودات',
    searchPlaceholder: 'البحث باسم الغرض، رقم الغرفة، الموظف، التصنيف...',
    dbSynced: 'القاعدة متزامنة',
    dbLocal: 'القاعدة: محلي',
    dbLive: 'مونغو دي بي: متصل',
    syncedDevices: 'الأجهزة المتصلة والمتزامنة',
    switchLanguage: 'English (الإنجليزية)',
    notifications: 'الإشعارات',
    quickScan: 'مسح رمز الاستجابة QR',
    commandPalette: 'لوحة الأوامر والبحث السريع',
    keyboardShortcuts: 'اختصارات لوحة المفاتيح',

    // Network & Sync Status Banner
    offlineMode: 'انقطع الاتصال بالشبكة',
    offlineSyncPaused: 'المزامنة متوقفة مؤقتاً حالياً',
    offlineNoticeDescription: 'يتم حفظ التعديلات محلياً وستتم المزامنة تلقائياً بمجرد استعادة الاتصال بالإنترنت.',
    offlineCheckConnection: 'تحقق من الاتصال',
    offlineCheckingConnection: 'جاري التحقق...',
    onlineRestored: 'تمت استعادة الاتصال',
    onlineSyncResumed: 'تم استئناف المزامنة ومزامنة التحديثات بنجاح.',
    syncPausedStatus: 'المزامنة متوقفة (غير متصل)',

    // Dashboard & Metrics
    totalFoundItems: 'إجمالي المفقودات',
    totalItems: 'إجمالي الأغراض',
    store: 'الأمانات',
    handover: 'التسليم للنزيل',
    dispatched: 'التسليم للموظف',
    totalDispatch: 'إجمالي التسليم للموظفين',
    dispatchedItems: 'تم التسليم / الإتلاف',
    allRecords: 'جميع السجلات المسجلة',
    inStorage: 'مخزنة في أمانات الفندق',
    returnedToGuests: 'أعيدت للنزلاء والمطالبين',
    today: 'اليوم',
    loggedToday: 'سُجلت اليوم',
    itemsByStatus: 'الأغراض حسب الحالة',
    liveBreakdown: 'توزيع فوري مباشر',
    noItemsRecorded: 'لا توجد أغراض مسجلة حتى الآن',
    totalTracked: 'إجمالي المسجل',
    itemsByCategory: 'الأغراض حسب التصنيف',
    categories: 'تصنيفات',
    latestItemsLogged: 'أحدث الأغراض المسجلة في أقسام الفندق',
    addItem: 'إضافة غرض جديد',
    viewAll: 'عرض الكل',
    currentlyStored: 'المخزنة حالياً بالأمانات',
    pendingDispatchMetric: 'بانتظار التسليم للموظف',
    handedOverCount: 'تم تسليمها للنزلاء',
    handoverRate: 'نسبة التسليم للنزلاء',
    foundToday: 'عُثر عليها اليوم',
    recentActivity: 'أحدث السجلات المسجلة',
    addNewItem: 'تسجيل غرض مفقود جديد',
    viewAllItems: 'عرض جميع الأغراض',
    inventoryStatusOverview: 'توزيع حالات المخزون',
    monthlyTrends: 'المؤشرات الشهرية للمفقودات والتسليم',
    itemsFound: 'مفقودات تم العثور عليها',
    itemsReturned: 'أغراض تم تسليمها',
    exportData: 'تصدير إكسل / CSV',
    printReport: 'طباعة تقرير',
    noRecentActivity: 'لا توجد أنشطة مسجلة حديثاً.',

    // Table & Lists Common
    code: 'الرمز',
    itemCode: 'الرمز / الكود',
    itemName: 'تفاصيل الغرض',
    description: 'الوصف',
    locationFound: 'موقع العثور',
    storeLocation: 'موقع التخزين',
    category: 'التصنيف',
    roomLocation: 'الغرفة / الموقع',
    finderStaff: 'عثر عليه (الموظف)',
    status: 'الحالة',
    dateFound: 'تاريخ العثور',
    timeFound: 'وقت العثور',
    retentionDeadline: 'مهلة الحفظ بالأمانات',
    storageLocation: 'موقع التخزين',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    dispatch: 'تسليم للموظف',
    image: 'الصورة',
    guestName: 'اسم النزيل',
    recordedBy: 'سُجل بواسطة',
    daysLeft: 'أيام متبقية',
    overdue: 'منتهية المهلة',
    dueToday: 'مستحقة اليوم',
    dueInDays: 'يوم متبقي',

    // Notifications
    markAllAsRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة حالياً',
    clearAllNotifications: 'مسح الكل',

    // Filters & Search
    filter: 'تصفية',
    search: 'بحث',
    all: 'الكل',
    allCategories: 'جميع التصنيفات',
    allStatuses: 'جميع الحالات',
    allLocations: 'جميع مواقع التخزين',
    resetFilters: 'إعادة ضبط الفلاتر',
    showingResults: 'عرض النتائج',
    noMatchingRecords: 'لم يتم العثور على سجلات مطابقة للبحث.',
    selectCategory: 'اختر التصنيف',
    selectStatus: 'اختر الحالة',
    selectLocation: 'اختر موقع التخزين',

    // Statuses
    statusStored: 'مخزن في الأمانات',
    statusHandedOver: 'تم التسليم للنزيل',
    statusDispatched: 'تم التسليم للموظف',
    statusPendingApproval: 'قيد الاعتماد',
    statusUnderReview: 'قيد المراجعة',
    statusPendingClaim: 'بانتظار المطالبة',
    statusUnclaimed: 'غير مطالب به',
    statusDonated: 'تم التبرع به',
    statusDisposed: 'تم الإتلاف',

    // Categories
    catClothing: 'ملابس وأزياء',
    catDocuments: 'وثائق ومستندات',
    catElectronics: 'أجهزة إلكترونية',
    catFoods: 'أطعمة ومشروبات',
    catJewelry: 'مجوهرات وساعات',
    catLuggage: 'حقائب وأمتعة',
    catMedicines: 'أدوية ومستلزمات طبية',
    catMoney: 'أموال ونقد',
    catPersonalItems: 'أغراض شخصية',
    catOther: 'أخرى ومتنوعات',

    // Buttons & Actions
    viewDetails: 'عرض التفاصيل',
    handoverItem: 'تسليم للنزيل',
    dispatchToFinder: 'تسليم للموظف الذي وجده',
    returnToStore: 'إعادة للتخزين',
    editItem: 'تعديل السجل',
    deleteItem: 'نقل إلى سلة المهملات',
    restoreItem: 'استعادة السجل',
    permanentDelete: 'حذف نهائي',
    emptyTrash: 'تفريغ سلة المهملات',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
    back: 'رجوع',
    scanQr: 'مسح رمز QR',
    download: 'تحميل',
    print: 'طباعة البطاقة',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    addStaff: 'إضافة موظف جديد',
    editStaff: 'تعديل الموظف',
    deleteStaff: 'حذف الموظف',
    resetPassword: 'إعادة تعيين كلمة المرور',

    // Pending Dispatch View
    pendingDispatchTitle: 'أغراض بانتظار التسليم للموظف',
    pendingDispatchSubtitle: 'الأغراض التي قاربت أو تجاوزت مهلة الحفظ القانونية المحددة في سياسة الفندق للتسليم للموظف العاثر عليها',
    filterAll: 'جميع الأغراض المعلقة',
    filterOverdue: 'منتهية المهلة',
    filterDueToday: 'مستحقة اليوم',
    filterDue3Days: 'مستحقة خلال 3 أيام',
    processDispatch: 'إتمام التسليم للموظف',
    noPendingDispatch: 'لا توجد أغراض معلقة بانتظار التسليم للموظف حالياً.',
    awaitingFulfillment: 'بانتظار التسليم',
    pastPolicyWindow: 'تجاوزت فترة الاحتفاظ المحددة',
    immediateAction: 'إجراء فوري مطلوب',
    dueIn3Days: 'مستحقة خلال 3 أيام',
    upcomingCutoff: 'قرب انتهاء المهلة',
    allRetentionInCompliance: 'جميع سجلات الاحتفاظ بالمخزون متوافقة مع السياسة.',
    urgency: 'الأهمية والسرعة',
    immediate: 'فوري وعاجل',
    daysRemaining: 'أيام متبقية',

    // Items View Extras
    exportExcel: 'تصدير إكسل',
    exportCSV: 'ملف CSV',
    pendingApproval: 'طلبات مقدمة من الموظفين بانتظار الموافقة',
    pending: 'معلق',
    displaced: 'مرحل / منقول',
    datePreset: 'نطاق التاريخ',
    allDates: 'جميع التواريخ',
    yesterday: 'أمس',
    last7Days: 'آخر 7 أيام',
    thisMonth: 'هذا الشهر',
    last30Days: 'آخر 30 يوماً',
    customRange: 'نطاق مخصص',
    to: 'إلى',
    filters: 'المزيد من التصفية',
    reset: 'إعادة ضبط',
    approve: 'موافقة',
    viewPrintQr: 'عرض وطباعة رمز الاستجابة السريعة',
    handoverToGuest: 'تسليم للنزيل',

    // Staff Management View
    staffManagementTitle: 'إدارة موظفي الفندق',
    staffManagementSubtitle: 'إدارة حسابات موظفي الفندق، الأقسام، والصلاحيات',
    staffSerial: 'الرقم التسلسلي',
    staffName: 'اسم الموظف',
    staffRole: 'الدور والنظام',
    staffDepartment: 'القسم',
    staffContact: 'معلومات الاتصال',
    staffEmail: 'البريد الإلكتروني',
    staffPhone: 'رقم الهاتف',
    staffStatus: 'حالة الحساب',
    activeStatus: 'نشط',
    inactiveStatus: 'غير نشط',
    noStaffFound: 'لم يتم العثور على موظفين مطابقين للبحث.',

    // Removed Items View
    trashTitle: 'سلة المحذوفات',
    trashSubtitle: 'الأغراض المحذوفة مؤقتاً من المخزون. يتم حذفها نهائياً تلقائياً بعد 60 يوماً.',
    trashEmptyMessage: 'سلة المحذوفات فارغة. لا توجد أغراض محذوفة.',
    deletedAt: 'تاريخ الحذف',
    deletedBy: 'حُذف بواسطة',
    deletionReason: 'سبب الحذف',
    confirmEmptyTrash: 'هل أنت متأكد من تفريغ سلة المحذوفات وحذف جميع السجلات نهائياً؟',
    confirmRestoreItem: 'هل تريد استعادة هذا الغرض إلى قائمة المخزون النشطة؟',
    confirmPermanentDelete: 'هل أنت متأكد من الحذف النهائي لهذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',

    // User Profile & Settings
    profileTitle: 'الملف الشخصي للموظف',
    profileSubtitle: 'عرض بيانات الحساب، الصلاحيات الممنوحة، وجلسات الأجهزة النشطة',
    accountDetails: 'بيانات الحساب',
    securitySettings: 'الأمان وكلمة المرور',
    activeSessionsTitle: 'الأجهزة المتزامنة النشطة',
    terminateSession: 'إنهاء الجلسة',
    generalSettings: 'الإعدادات العامة',
    codePrefix: 'بادئة الرمز التسلسلي',
    categorySettings: 'تصنيفات الأغراض',
    storageLocations: 'مواقع التخزين والأمانات',
    dispatchRules: 'قواعد مدد الحفظ والتسليم',
    rolesPermissions: 'مصفوفة الأدوار والصلاحيات',
    dataImportExport: 'النسخ الاحتياطي واستيراد/تصدير البيانات',
    mongoSettings: 'إعدادات قاعدة بيانات MongoDB Atlas',

    // Modals & Forms
    registerNewItem: 'تسجيل غرض مفقود جديد',
    editRecordTitle: 'تعديل سجل المفقودات',
    itemDetails: 'معلومات الغرض',
    itemDescription: 'وصف الغرض والتفاصيل',
    descriptionPlaceholder: 'وصف بصري دقيق، العلامات المميزة، الأرقام التسلسلية...',
    roomPlaceholder: 'مثال: غرفة 402، البهو الرئيسي، المطعم، النادي الصحي...',
    guestNamePlaceholder: 'اختياري: اسم النزيل إذا كان مرتبطاً بحجز الغرفة',
    selectFinder: 'اختر الموظف الذي عثر على الغرض',
    selectStoreLocation: 'اختر موقع التخزين في الأمانات',
    dispatchDurationDays: 'مدة الحفظ بالأمانات (أيام)',
    itemPhoto: 'صورة الغرض',
    uploadPhoto: 'رفع صورة',
    dragPhotoHere: 'اسحب وأفلت الصورة هنا أو انقر للاختيار',

    // Handover Modal
    handoverTitle: 'تسليم الغرض للنزيل',
    handoverSubtitle: 'التحقق من هوية النزيل وتوثيق استلام الغرض رسمياً',
    guestIdType: 'نوع إثبات الهوية (هوية وطنية / جواز سفر / إقامة)',
    guestIdNumber: 'رقم وثيقة الإثبات / الهوية',
    guestPhoneNumber: 'رقم هاتف / جوال النزيل',
    handoverNotes: 'ملاحظات وتفاصيل الاستلام',
    handoverDate: 'تاريخ التسليم للنزيل',
    completeHandover: 'تأكيد وتسليم الغرض للنزيل',

    // Dispatch Modal
    dispatchTitle: 'تسليم الغرض للموظف العاثر عليه',
    dispatchSubtitle: 'انتهاء مهلة الحفظ بالأمانات. تسليم الغرض للموظف وفقاً للائحة الفندق.',
    recipientStaff: 'الموظف المستلم',
    authorizedBy: 'المدير / المشرف المعتمد',
    dispatchNotes: 'ملاحظات اعتماد التسليم للموظف',
    dispatchDate: 'تاريخ التسليم للموظف',
    completeDispatch: 'تأكيد التسليم للموظف',

    // Return To Store Modal
    returnToStoreTitle: 'إعادة الغرض إلى الأمانات',
    returnToStoreSubtitle: 'إعادة حالة الغرض إلى مخزن في الأمانات',
    newStoreLocation: 'موقع التخزين المستهدف',
    returnReason: 'سبب الإعادة إلى الأمانات',

    // QR & Print Modals
    qrScannerTitle: 'ماسح رمز الاستجابة السريعة QR',
    qrScannerSubtitle: 'امسح بطاقة رمز QR للبحث السريع عن الغرض ومعالجته',
    qrCodeTitle: 'بطاقة رمز الاستجابة السريعة QR',
    pointCamera: 'وجّه الكاميرا نحو رمز QR الملصق على الغرض',
    enterCodeManually: 'أو أدخل رمز الغرض يدوياً',
    printReportTitle: 'طباعة تقرير المخزون والمراجعة',
    dateRange: 'النطاق الزمني',
    generatePdf: 'إنشاء وطباعة التقرير',

    // Roles
    roleSuperAdmin: 'مدير عام للنظام',
    roleAdmin: 'مدير نظام',
    roleManager: 'مدير قسم',
    roleSupervisor: 'مشرف',
    roleStaff: 'موظف',
    roleSecurity: 'الأمن والسلامة',
    roleHousekeeping: 'خدمة الغرف',
    roleFrontDesk: 'الاستقبال',

    // Error Messages & Validations
    errorRequiredField: 'هذا الحقل مطلوب.',
    errorItemNameRequired: 'يرجى إدخال اسم الغرض.',
    errorCategoryRequired: 'يرجى اختيار تصنيف صالح.',
    errorLocationRequired: 'يرجى تحديد الغرفة أو الموقع الذي عُثر فيه على الغرض.',
    errorEnglishOnly: 'يرجى استخدام الحروف الإنجليزية لاسم الغرض والرمز.',
    errorGuestNameRequired: 'اسم النزيل مطلوب للتحقق من التسليم.',
    errorIdNumberRequired: 'رقم هوية / جواز سفر النزيل مطلوب.',
    errorPhoneRequired: 'رقم الهاتف للتواصل مطلوب.',
    errorStaffNameRequired: 'اسم الموظف مطلوب.',
    errorInvalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
    errorPasswordLength: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    errorDatabaseConnection: 'فشل الاتصال بقاعدة بيانات MongoDB. جاري العمل على القاعدة المحلية.',
    errorSaveFailed: 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.',
    errorDeleteFailed: 'فشل حذف السجل. يرجى التأكد من الصلاحيات.',
    errorUnauthorized: 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.',

    // Success Messages
    successItemCreated: 'تم تسجيل غرض المفقودات بنجاح.',
    successItemUpdated: 'تم تحديث بيانات الغرض بنجاح.',
    successHandoverComplete: 'تم تسليم الغرض للنزيل بنجاح.',
    successDispatchComplete: 'تم تسليم الغرض للموظف بنجاح.',
    successItemDeleted: 'تم نقل الغرض إلى سلة المحذوفات.',
    successItemRestored: 'تمت استعادة الغرض إلى قائمة المخزون النشطة.',
    successTrashEmptied: 'تم تفريغ سلة المحذوفات بنجاح.',
    successSettingsSaved: 'تم حفظ إعدادات الفندق بنجاح.',
    successStaffSaved: 'تم تحديث ملف الموظف بنجاح.',
    successPasswordUpdated: 'تم تغيير كلمة المرور بنجاح.',
    successSessionTerminated: 'تم إنهاء الجلسة المتصلة بنجاح.'
  }
};

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

  const applyLanguageAttributes = (lang: Language) => {
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      document.body.classList.add('font-arabic');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
      document.body.classList.remove('font-arabic');
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('warwick_app_language', lang);
    applyLanguageAttributes(lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
  };

  useEffect(() => {
    applyLanguageAttributes(language);
  }, [language]);

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
        language,
        setLanguage,
        toggleLanguage,
        t: currentTranslations,
        isRTL: language === 'ar',
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

