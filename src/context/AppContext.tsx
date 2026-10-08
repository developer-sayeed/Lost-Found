import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LostItem,
  StaffMember,
  HotelSettings,
  FilterState,
  DashboardStats,
  ItemStatus,
  ItemCategory,
  MongoStatus,
  DeviceSession,
  BlockedDevice,
  CategoryConfig,
  ActiveTab,
  AppNotification,
  OfflineQueuedAction,
  ToastConfig,
  ValidationMessagesConfig,
  DEFAULT_TOAST_CONFIG,
  DEFAULT_VALIDATION_MESSAGES,
  MultiDatabaseSystemState,
  DatabaseEngineType,
  DatabaseConnectionInfo,
  DatabaseHealthInfo,
  PublicWebsiteSettings,
  GuestInquiry,
  DEFAULT_PUBLIC_WEBSITE_SETTINGS
} from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { INITIAL_HOTEL_SETTINGS, DEFAULT_ITEM_CATEGORIES } from '../lib/constants';
import { soundAlert } from '../lib/audio';
import { toast } from 'react-toastify';
import { offlineStorage, isNetworkError } from '../lib/offlineSync';
import { capitalizeWords } from '../lib/stringUtils';
import { updateDocumentFavicon } from '../utils/favicon';
import { applyDynamicTheme } from '../lib/themeEngine';

export type { ActiveTab };

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedStaffProfile: StaffMember | null;
  setSelectedStaffProfile: (staff: StaffMember | null) => void;
  openStaffProfile: (staff?: StaffMember | null) => void;
  items: LostItem[];
  staff: StaffMember[];
  settings: HotelSettings;
  sessions: DeviceSession[];
  isLoadingSessions: boolean;
  fetchSessions: () => Promise<void>;
  deleteSession: (deviceId: string) => Promise<void>;
  blockedDevices: BlockedDevice[];
  isLoadingBlockedDevices: boolean;
  fetchBlockedDevices: () => Promise<void>;
  blockDevice: (params: {
    deviceId?: string;
    ip?: string;
    userName?: string;
    userEmail?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    blockType: 'temporary' | 'permanent';
    durationHours?: number;
    reason?: string;
  }) => Promise<boolean>;
  unblockDevice: (params: { deviceId?: string; ip?: string }) => Promise<boolean>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isLoading: boolean;
  isSyncing: boolean;
  syncSuccessNotice: string | null;
  stats: DashboardStats;

  // Network & Sync State
  isOnline: boolean;
  isSyncPaused: boolean;
  checkConnection: () => Promise<boolean>;
  simulateOfflineToggle: () => void;

  // Offline Caching & Queue System
  offlineQueue: OfflineQueuedAction[];
  syncOfflineQueue: () => Promise<void>;
  isProcessingQueue: boolean;
  lastSyncTime: string | null;

  // Real-Time Notification System
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'readBy'>) => void;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: (forEveryone?: boolean) => void;
  deleteNotification: (id: string, forEveryone?: boolean) => Promise<void>;
  broadcastNotification: (payload: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    targetType?: 'all' | 'department' | 'individual' | 'roles';
    targetDepartment?: string;
    targetStaffName?: string;
    targetStaffEmail?: string;
    targetUserId?: string;
    targetRoles?: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: (open: boolean) => void;

  // Notice Detail Modal & Per-User Read/Delete Helpers
  selectedNoticeForModal: AppNotification | null;
  isNoticeModalOpen: boolean;
  openNoticeModal: (notif: AppNotification) => void;
  closeNoticeModal: () => void;
  isNotificationRead: (notif: AppNotification) => boolean;
  isNotificationDeleted: (notif: AppNotification) => boolean;
  
  // Dynamic Alerts & Validation Messages (Admin Controlled)
  getToastMessage: (key: keyof ToastConfig, replacements?: Record<string, string | number>) => string;
  getValidationMessage: (key: keyof ValidationMessagesConfig, fallback?: string) => string;
  showCustomToast: (
    type: 'success' | 'error' | 'info' | 'warning',
    key: keyof ToastConfig,
    replacements?: Record<string, string | number>,
    fallback?: string
  ) => void;
  
  // Real MongoDB State & Controls
  mongoStatus: MongoStatus | null;
  isConnectingMongo: boolean;
  refreshMongoStatus: () => Promise<void>;
  connectMongo: (uri: string, dbName?: string) => Promise<any>;
  testMongo: (uri: string, dbName?: string) => Promise<any>;
  seedMongo: () => Promise<any>;
  disconnectMongo: () => Promise<any>;
  restoreInitialDatabase: () => Promise<any>;
  restoreOriginalFields: () => Promise<any>;

  // Multi-Database System Architecture
  multiDbState: MultiDatabaseSystemState | null;
  isLoadingMultiDb: boolean;
  fetchMultiDbState: () => Promise<void>;
  pingDatabaseEngine: (engine: DatabaseEngineType) => Promise<{ success: boolean; pingMs: number; message: string }>;
  setPrimaryDatabaseEngine: (engine: DatabaseEngineType) => Promise<void>;
  configureDatabaseEngine: (id: string, updates: Partial<DatabaseConnectionInfo>) => Promise<void>;
  syncAllDatabasesNow: () => Promise<any>;
  triggerDatabaseFailover: (targetEngine?: DatabaseEngineType) => Promise<any>;

  // Real-Time Database Connection Health Indicator
  dbHealth: DatabaseHealthInfo | null;
  isCheckingDbHealth: boolean;
  checkDatabaseHealth: () => Promise<DatabaseHealthInfo>;

  // Real-Time SSE Stream & Multi-Terminal Sync
  isRealtimeConnected: boolean;
  realtimeClientsCount: number;

  // Public Hotel Guest Website & Inquiries Portal
  inquiries: GuestInquiry[];
  isLoadingInquiries: boolean;
  fetchInquiries: () => Promise<void>;
  createGuestInquiry: (inquiry: Partial<GuestInquiry>) => Promise<GuestInquiry>;
  updateGuestInquiry: (id: string, updates: Partial<GuestInquiry>) => Promise<GuestInquiry>;
  deleteGuestInquiry: (id: string) => Promise<void>;
  publicWebsiteSettings: PublicWebsiteSettings;
  updatePublicWebsiteSettings: (newSettings: Partial<PublicWebsiteSettings>) => Promise<void>;
  isPublicWebsiteMode: boolean;
  setIsPublicWebsiteMode: (mode: boolean) => void;
  
  // Modals & Selected items
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingItem: LostItem | null;
  setEditingItem: (item: LostItem | null) => void;
  selectedItem: LostItem | null;
  setSelectedItem: (item: LostItem | null) => void;

  // Sidebar Visibility & Collapse Controls (Desktop & Mobile)
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapse: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileSidebar: () => void;
  
  isDetailsModalOpen: boolean;
  setIsDetailsModalOpen: (open: boolean) => void;
  
  isHandoverModalOpen: boolean;
  setIsHandoverModalOpen: (open: boolean) => void;
  
  isDispatchModalOpen: boolean;
  setIsDispatchModalOpen: (open: boolean) => void;
  
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  
  isReturnToStoreModalOpen: boolean;
  setIsReturnToStoreModalOpen: (open: boolean) => void;
  returnModalItem: LostItem | null;
  setReturnModalItem: (item: LostItem | null) => void;
  openReturnToStore: (item: LostItem) => void;
  
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;
  printMode: 'report' | 'receipt';
  setPrintMode: (mode: 'report' | 'receipt') => void;

  isQrScannerOpen: boolean;
  setIsQrScannerOpen: (open: boolean) => void;
  openQrScanner: () => void;

  isItemQrModalOpen: boolean;
  setIsItemQrModalOpen: (open: boolean) => void;
  qrModalItem: LostItem | null;
  setQrModalItem: (item: LostItem | null) => void;
  openItemQrModal: (item: LostItem) => void;

  isStaffModalOpen: boolean;
  setIsStaffModalOpen: (open: boolean) => void;
  editingStaff: StaffMember | null;
  setEditingStaff: (staff: StaffMember | null) => void;

  // Global Command Palette & Keyboard Shortcuts Modals
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  commandPaletteInitialQuery: string;
  setCommandPaletteInitialQuery: (q: string) => void;
  openCommandPalette: (initialQuery?: string) => void;
  closeCommandPalette: () => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;

  // Trash & Removed Items State
  activeItems: LostItem[];
  removedItems: LostItem[];

  // Actions & Sync
  isClearingCache: boolean;
  clearSystemCache: () => Promise<any>;
  refreshData: () => Promise<void>;
  triggerSettingsSync: () => Promise<void>;
  updateSettings: (newSettings: Partial<HotelSettings>) => Promise<void>;
  createItem: (item: Partial<LostItem>) => Promise<LostItem>;
  updateItem: (id: string, updates: Partial<LostItem>) => Promise<LostItem>;
  approveItem: (id: string) => Promise<LostItem>;
  rejectItem: (id: string, reason?: string) => Promise<LostItem>;
  handoverItem: (id: string, details: { receiverName: string; contactNumber: string; remarks?: string }) => Promise<void>;
  dispatchItem: (id: string, details: { courierName?: string; trackingNumber?: string; destination?: string; remarks?: string }) => Promise<void>;
  deleteItem: (id: string, options?: { permanent?: boolean; reason?: string }) => Promise<void>;
  batchDeleteItems: (ids: string[], options?: { permanent?: boolean; reason?: string }) => Promise<void>;
  batchDispatchItems: (ids: string[], details: { courierName?: string; trackingNumber?: string; destination?: string; dispatchedTo?: string; notes?: string }) => Promise<void>;
  returnToStoreItem: (id: string, reason?: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  permanentDeleteItem: (id: string) => Promise<void>;
  batchRestoreItems: (ids: string[]) => Promise<void>;
  batchPermanentDeleteItems: (ids: string[]) => Promise<void>;
  emptyTrash: () => Promise<void>;
  
  addStaff: (staff: Partial<StaffMember>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  importItems: (items: Partial<LostItem>[], mode?: 'append' | 'replace') => Promise<{ success: boolean; count: number; items: LostItem[] }>;

  openItemDetails: (item: LostItem) => void;
  openHandover: (item: LostItem) => void;
  openDispatch: (item: LostItem) => void;
  openDelete: (item: LostItem) => void;
  openPrint: (item: LostItem, mode?: 'report' | 'receipt') => void;
  openEditItem: (item: LostItem) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserPermissions, updateUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<StaffMember | null>(null);
  const [items, setItems] = useState<LostItem[]>(() => offlineStorage.loadItems());
  const [staff, setStaff] = useState<StaffMember[]>(() => offlineStorage.loadStaff());
  const [mongoStatus, setMongoStatus] = useState<MongoStatus | null>(null);
  const [isConnectingMongo, setIsConnectingMongo] = useState<boolean>(false);
  const [settings, setSettings] = useState<HotelSettings>(() => {
    const cached = offlineStorage.loadSettings();
    return cached || {
      ...INITIAL_HOTEL_SETTINGS,
      categories: INITIAL_HOTEL_SETTINGS.categories || DEFAULT_ITEM_CATEGORIES
    };
  });

  // Multi-Database System Architecture State
  const [multiDbState, setMultiDbState] = useState<MultiDatabaseSystemState | null>(null);
  const [isLoadingMultiDb, setIsLoadingMultiDb] = useState<boolean>(false);

  // Real-Time Database Health Indicator State
  const [dbHealth, setDbHealth] = useState<DatabaseHealthInfo | null>(null);
  const [isCheckingDbHealth, setIsCheckingDbHealth] = useState<boolean>(false);

  // Real-Time SSE Stream & Multi-Terminal Sync State
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [realtimeClientsCount, setRealtimeClientsCount] = useState<number>(1);

  // Public Hotel Guest Website & Inquiries Portal State
  const [inquiries, setInquiries] = useState<GuestInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState<boolean>(false);
  const [publicWebsiteSettings, setPublicWebsiteSettings] = useState<PublicWebsiteSettings>(DEFAULT_PUBLIC_WEBSITE_SETTINGS);
  const [isPublicWebsiteMode, setIsPublicWebsiteMode] = useState<boolean>(false);

  // Dynamic Alerts & Validation Messages (Admin Controlled)
  const getToastMessage = useCallback((key: keyof ToastConfig, replacements: Record<string, string | number> = {}): string => {
    let template = (settings.toastConfig && settings.toastConfig[key]) as string | undefined;
    if (!template) {
      template = (DEFAULT_TOAST_CONFIG[key] as string) || '';
    }
    Object.entries(replacements).forEach(([k, val]) => {
      template = (template || '').replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
    });
    return template;
  }, [settings.toastConfig]);

  const getValidationMessage = useCallback((key: keyof ValidationMessagesConfig, fallback?: string): string => {
    const custom = settings.validationMessages && settings.validationMessages[key];
    return custom || (DEFAULT_VALIDATION_MESSAGES[key] as string) || fallback || '';
  }, [settings.validationMessages]);

  const showCustomToast = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    key: keyof ToastConfig,
    replacements: Record<string, string | number> = {},
    fallback?: string
  ) => {
    if (settings.toastConfig?.enableToasts === false) {
      return;
    }
    const msg = getToastMessage(key, replacements) || fallback;
    if (msg) {
      toast[type](msg);
    }
  }, [settings.toastConfig, getToastMessage]);

  // Offline Caching & Sync Queue State
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedAction[]>(() => offlineStorage.getQueue());
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => offlineStorage.getLastSyncTime());

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [blockedDevices, setBlockedDevices] = useState<BlockedDevice[]>([]);
  const [isLoadingBlockedDevices, setIsLoadingBlockedDevices] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [syncSuccessNotice, setSyncSuccessNotice] = useState<string | null>(null);

  // Network & Offline Status Detection
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  const effectiveOnline = isOnline && !isSimulatedOffline;
  const isSyncPaused = !effectiveOnline;

  const simulateOfflineToggle = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  const checkConnection = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      const res = await fetch(`/api/health?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const online = res.ok;
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  // Auto-sync offline queue when network is restored
  const syncOfflineQueue = useCallback(async () => {
    const queue = offlineStorage.getQueue();
    if (!queue || queue.length === 0) return;
    if (isProcessingQueue) return;

    setIsProcessingQueue(true);
    let syncedCount = 0;

    try {
      for (const act of queue) {
        try {
          if (act.type === 'CREATE_ITEM') {
            const created = await api.createItem(act.payload, user);
            // Replace local offline item with created server item
            setItems(prev => {
              const updated = prev.map(i => (i.id === act.localId ? created : i));
              offlineStorage.saveItems(updated);
              return updated;
            });
            offlineStorage.dequeue(act.id);
            syncedCount++;
          } else if (act.type === 'UPDATE_ITEM' && act.itemId) {
            const updated = await api.updateItem(act.itemId, act.payload, user);
            setItems(prev => {
              const next = prev.map(i => (i.id === act.itemId || i.code === act.itemId ? updated : i));
              offlineStorage.saveItems(next);
              return next;
            });
            offlineStorage.dequeue(act.id);
            syncedCount++;
          } else if (act.type === 'HANDOVER_ITEM' && act.itemId) {
            const handedOver = await api.handoverItem(act.itemId, act.payload, user);
            setItems(prev => {
              const next = prev.map(i => (i.id === act.itemId || i.code === act.itemId ? handedOver : i));
              offlineStorage.saveItems(next);
              return next;
            });
            offlineStorage.dequeue(act.id);
            syncedCount++;
          } else if (act.type === 'DISPATCH_ITEM' && act.itemId) {
            const dispatched = await api.dispatchItem(act.itemId, act.payload, user);
            setItems(prev => {
              const next = prev.map(i => (i.id === act.itemId || i.code === act.itemId ? dispatched : i));
              offlineStorage.saveItems(next);
              return next;
            });
            offlineStorage.dequeue(act.id);
            syncedCount++;
          }
        } catch (itemErr: any) {
          console.warn(`Sync failed for action ${act.id}:`, itemErr);
          if (isNetworkError(itemErr)) {
            break;
          }
        }
      }

      setOfflineQueue(offlineStorage.getQueue());
      setLastSyncTime(new Date().toISOString());

      if (syncedCount > 0) {
        toast.success(`📶 Wi-Fi sync complete: ${syncedCount} offline record(s) synchronized!`, {
          autoClose: 4000
        });
      }
    } finally {
      setIsProcessingQueue(false);
    }
  }, [user, isProcessingQueue]);

  // Monitor network status changes via window events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-trigger sync on reconnection
      try {
        await api.triggerSync(user);
        await syncOfflineQueue();
      } catch (err) {
        // silent
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, syncOfflineQueue]);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'All Status',
    category: 'All Categories',
    month: 'All',
    year: 'All',
    storeLocation: 'All',
    startDate: '',
    endDate: '',
    datePreset: 'All'
  });

  // Real-Time Notification System State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('warwick_app_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const initialNotifSyncDoneRef = useRef<boolean>(false);

  // Sync notifications to local storage
  useEffect(() => {
    try {
      localStorage.setItem('warwick_app_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Fetch real-time notifications for the active user
  const fetchNotifications = useCallback(async () => {
    try {
      const serverNotifs = await api.getNotifications(user);
      if (Array.isArray(serverNotifs)) {
        // Detect newly arrived notifications to trigger sound feedback
        if (initialNotifSyncDoneRef.current) {
          const userIdentifier = (user?.id || user?.name || '').toLowerCase().trim();
          const newItems = serverNotifs.filter(n => {
            if (knownNotifIdsRef.current.has(n.id)) return false;
            const readBy = Array.isArray(n.readBy) ? n.readBy : [];
            const isRead = n.read || (userIdentifier && readBy.some(u => u && typeof u === 'string' && u.toLowerCase().trim() === userIdentifier));
            return !isRead;
          });

          if (newItems.length > 0) {
            // Play acoustic alerts based on event type
            const hasDispatch = newItems.some(n => n.type === 'item_dispatched');
            const hasHandover = newItems.some(n => n.type === 'item_handover');
            const hasApproval = newItems.some(n => n.type === 'item_approved');
            
            if (hasDispatch) {
              soundAlert.playDispatchAlert();
            } else if (hasHandover) {
              soundAlert.playHandoverAlert();
            } else if (hasApproval) {
              soundAlert.playNewItemAlert();
            } else {
              soundAlert.playNotificationChime();
            }
          }
        }

        // Clean deduplication: remove any duplicate notifications that have identical item/event or identical title within 60s
        const uniqueNotifs: AppNotification[] = [];
        const seenKeys = new Set<string>();

        serverNotifs.forEach(n => {
          const itemKey = n.itemCode || n.itemId || '';
          const normTitle = (n.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const timeBucket = Math.floor(new Date(n.createdAt).getTime() / 60000); // 1-minute bucket
          const dedupKey = itemKey
            ? `${n.type || 'gen'}_${itemKey}_${timeBucket}`
            : `${normTitle}_${timeBucket}`;

          if (!seenKeys.has(dedupKey)) {
            seenKeys.add(dedupKey);
            uniqueNotifs.push(n);
          }
        });

        uniqueNotifs.forEach(n => knownNotifIdsRef.current.add(n.id));
        initialNotifSyncDoneRef.current = true;
        setNotifications(uniqueNotifs);
      }
    } catch (e) {
      console.warn('Notification fetch warning:', e);
    }
  }, [user]);

  const addNotification = useCallback(async (notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'readBy'>) => {
    try {
      const created = await api.createNotification(notifData, user);
      if (created) {
        setNotifications(prev => {
          if (prev.some(n => n.id === created.id)) return prev;
          return [created, ...prev];
        });
        soundAlert.playNotificationChime();
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('warwick_realtime_sync');
            bc.postMessage({ type: 'NEW_NOTIFICATION', timestamp: Date.now() });
            bc.close();
          } catch {}
        }
        return;
      }
    } catch (e) {
      console.warn('api.createNotification fallback:', e);
    }

    const localNotif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
      readBy: []
    };
    setNotifications(prev => [localNotif, ...prev]);
    soundAlert.playNotificationChime();
  }, [user]);

  // Notice Detail Modal State
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<AppNotification | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Per-User Read/Deleted Helpers
  const isNotificationRead = useCallback((notif: AppNotification): boolean => {
    if (!user) return false;
    const userIdentifiers = [
      user.id,
      user.name?.toLowerCase().trim(),
      user.email?.toLowerCase().trim()
    ].filter(Boolean) as string[];

    const readBy = Array.isArray(notif.readBy) ? notif.readBy.map(u => String(u).toLowerCase().trim()) : [];
    return userIdentifiers.some(uid => readBy.includes(uid));
  }, [user]);

  const isNotificationDeleted = useCallback((notif: AppNotification): boolean => {
    if (!user) return false;
    const userIdentifiers = [
      user.id,
      user.name?.toLowerCase().trim(),
      user.email?.toLowerCase().trim()
    ].filter(Boolean) as string[];

    const deletedBy = Array.isArray(notif.deletedBy) ? notif.deletedBy.map(u => String(u).toLowerCase().trim()) : [];
    return userIdentifiers.some(uid => deletedBy.includes(uid));
  }, [user]);

  const markNotificationRead = useCallback(async (id: string) => {
    const userIdentifier = (user?.id || user?.name || user?.email || 'current').toLowerCase().trim();
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const readBy = Array.isArray(n.readBy) ? n.readBy : [];
        if (!readBy.some(u => String(u).toLowerCase().trim() === userIdentifier)) {
          return {
            ...n,
            readBy: [...readBy, userIdentifier]
          };
        }
      }
      return n;
    }));
    await api.markNotificationRead(id, user);
  }, [user]);

  const markNotificationUnread = useCallback(async (id: string) => {
    const userIdentifier = (user?.id || user?.name || user?.email || 'current').toLowerCase().trim();
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const readBy = Array.isArray(n.readBy) ? n.readBy : [];
        return {
          ...n,
          readBy: readBy.filter(u => String(u).toLowerCase().trim() !== userIdentifier)
        };
      }
      return n;
    }));
    await api.markNotificationUnread(id, user);
  }, [user]);

  const markAllNotificationsRead = useCallback(async () => {
    const userIdentifier = (user?.id || user?.name || user?.email || 'current').toLowerCase().trim();
    setNotifications(prev => prev.map(n => {
      const readBy = Array.isArray(n.readBy) ? n.readBy : [];
      if (!readBy.some(u => String(u).toLowerCase().trim() === userIdentifier)) {
        return {
          ...n,
          readBy: [...readBy, userIdentifier]
        };
      }
      return n;
    }));
    await api.markAllNotificationsRead(user);
    toast.success('All notifications marked as read for your account');
  }, [user]);

  const deleteNotification = useCallback(async (id: string, forEveryone?: boolean) => {
    const role = user?.role || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(role);
    const userIdentifier = (user?.id || user?.name || user?.email || 'current').toLowerCase().trim();

    if (forEveryone && isAdmin) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.deleteNotification(id, { forEveryone: true }, user);
      toast.success('Notification permanently removed for all users');
    } else {
      // Per-user dismissal
      setNotifications(prev => prev.map(n => {
        if (n.id === id) {
          const deletedBy = Array.isArray(n.deletedBy) ? n.deletedBy : [];
          if (!deletedBy.some(u => String(u).toLowerCase().trim() === userIdentifier)) {
            return {
              ...n,
              deletedBy: [...deletedBy, userIdentifier]
            };
          }
        }
        return n;
      }));
      await api.deleteNotification(id, { forEveryone: false }, user);
      toast.info('Notification dismissed from your list');
    }
  }, [user]);

  const clearNotifications = useCallback(async (forEveryone?: boolean) => {
    const role = user?.role || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(role);
    const userIdentifier = (user?.id || user?.name || user?.email || 'current').toLowerCase().trim();

    if (forEveryone && isAdmin) {
      setNotifications([]);
      await api.clearNotifications({ forEveryone: true }, user);
      toast.success('All notifications cleared for all users');
    } else {
      // Per-user dismissal of all
      setNotifications(prev => prev.map(n => {
        const deletedBy = Array.isArray(n.deletedBy) ? n.deletedBy : [];
        if (!deletedBy.some(u => String(u).toLowerCase().trim() === userIdentifier)) {
          return {
            ...n,
            deletedBy: [...deletedBy, userIdentifier]
          };
        }
        return n;
      }));
      await api.clearNotifications({ forEveryone: false }, user);
      toast.info('All notifications dismissed from your list');
    }
  }, [user]);

  const openNoticeModal = useCallback((notif: AppNotification) => {
    setSelectedNoticeForModal(notif);
    setIsNoticeModalOpen(true);
    markNotificationRead(notif.id);
  }, [markNotificationRead]);

  const closeNoticeModal = useCallback(() => {
    setSelectedNoticeForModal(null);
    setIsNoticeModalOpen(false);
  }, []);

  const broadcastNotification = useCallback(async (payload: any) => {
    const res = await api.broadcastNotification(payload, user);
    if (res.success) {
      soundAlert.playNotificationChime();
      await fetchNotifications();
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('warwick_notif_channel');
          bc.postMessage({ type: 'NEW_NOTIFICATION', timestamp: Date.now() });
          bc.close();
        }
      } catch {}
    }
    return res;
  }, [user, fetchNotifications]);

  const broadcastItemsUpdated = useCallback(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('warwick_notif_channel');
        bc.postMessage({ type: 'ITEMS_UPDATED', timestamp: Date.now() });
        setTimeout(() => { try { bc.close(); } catch {} }, 200);
      }
    } catch {}
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    const userIdentifier = (user?.id || user?.name || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userRole = (user?.role || '').trim();
    const lowerUserRole = userRole.toLowerCase();
    const userDept = (user?.department || '').toLowerCase().trim();
    const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(userRole);

    return notifications.filter(n => {
      // Exclude if dismissed/deleted for current user
      if (isNotificationDeleted(n)) return false;

      // Check if user already marked as read
      const hasRead = isNotificationRead(n);
      if (hasRead) return false;

      const hasDeptTarget = Boolean(n.targetDepartment && n.targetDepartment.trim());
      const hasRoleTarget = Boolean(n.targetRoles && n.targetRoles.length > 0);
      const hasStaffTarget = Boolean(n.targetStaffName || n.targetStaffEmail || n.targetUserId);
      const isExplicitTargeted = n.targetType === 'department' || n.targetType === 'individual' || n.targetType === 'roles' || (n.targetType !== 'all' && (hasDeptTarget || hasRoleTarget || hasStaffTarget));

      const isSender = (n.senderName && userName && n.senderName.toLowerCase() === userName) ||
        (n.senderEmail && userEmail && n.senderEmail.toLowerCase() === userEmail);

      // If notification is explicitly targeted to specific recipients
      if (isExplicitTargeted) {
        if (user?.role === 'Super Admin') return true;

        // 1. Individual Staff Target
        if (n.targetType === 'individual' || hasStaffTarget) {
          const matchName = Boolean(n.targetStaffName && userName && (
            n.targetStaffName.toLowerCase().trim() === userName ||
            userName.includes(n.targetStaffName.toLowerCase().trim()) ||
            n.targetStaffName.toLowerCase().trim().includes(userName)
          ));
          const matchEmail = Boolean(n.targetStaffEmail && userEmail && (
            n.targetStaffEmail.toLowerCase().trim() === userEmail
          ));
          const matchId = Boolean(n.targetUserId && user?.id && n.targetUserId === user.id);

          return Boolean(matchName || matchEmail || matchId || isSender);
        }

        // 2. Department Target
        if (n.targetType === 'department' || hasDeptTarget) {
          const targetDept = (n.targetDepartment || '').toLowerCase().trim();
          const matchDept = Boolean(userDept && (
            userDept === targetDept ||
            userDept.includes(targetDept) ||
            targetDept.includes(userDept)
          ));
          const matchRoleAsDept = Boolean(lowerUserRole && (
            lowerUserRole === targetDept ||
            lowerUserRole.includes(targetDept) ||
            targetDept.includes(lowerUserRole)
          ));

          return Boolean(matchDept || matchRoleAsDept || isSender);
        }

        // 3. Role Target
        if (n.targetType === 'roles' || hasRoleTarget) {
          const matchRole = Boolean(n.targetRoles && n.targetRoles.some(r => r && typeof r === 'string' && r.toLowerCase().trim() === lowerUserRole));
          return Boolean(matchRole || isSender);
        }

        return false;
      }

      // Non-targeted notifications
      if (n.type === 'store_request') {
        return isAdminTier;
      }

      return true;
    }).length;
  }, [notifications, user]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LostItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReturnToStoreModalOpen, setIsReturnToStoreModalOpen] = useState(false);
  const [returnModalItem, setReturnModalItem] = useState<LostItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'report' | 'receipt'>('report');

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isItemQrModalOpen, setIsItemQrModalOpen] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<LostItem | null>(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Global Command Palette & Keyboard Shortcuts Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteInitialQuery, setCommandPaletteInitialQuery] = useState('');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const openCommandPalette = useCallback((initialQuery?: string) => {
    setCommandPaletteInitialQuery(initialQuery || '');
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
    setCommandPaletteInitialQuery('');
  }, []);

  const openShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(true);
  }, []);

  const closeShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(false);
  }, []);

  // Sidebar Visibility & Collapse States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('warwick_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('warwick_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const refreshMongoStatus = async () => {
    try {
      const status = await api.getMongoStatus();
      setMongoStatus(status);
    } catch (e) {
      console.warn('Failed to load mongo status:', e);
    }
  };

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.getSessions(user);
      if (res.sessions) {
        setSessions(res.sessions);
      }
    } catch (e) {
      console.warn('Failed to fetch active device sessions:', e);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  const deleteSession = async (deviceId: string) => {
    // Optimistic removal
    setSessions(prev => prev.filter(s => s.deviceId !== deviceId));
    setSettings(prev => ({
      ...prev,
      syncedDevicesCount: Math.max(prev.syncedDevicesCount - 1, 1)
    }));
    try {
      const res = await api.deleteSession(deviceId, user);
      if (res.sessions && res.sessions.length > 0) {
        setSessions(res.sessions);
      }
      setSyncSuccessNotice(`Terminated session on remote terminal`);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
    } catch (e) {
      console.error('Failed to terminate session:', e);
      await fetchSessions();
    }
  };

  const fetchBlockedDevices = useCallback(async () => {
    setIsLoadingBlockedDevices(true);
    try {
      const res = await api.getBlockedDevices(user);
      if (res && res.blockedDevices) {
        setBlockedDevices(res.blockedDevices);
      }
    } catch (e) {
      console.warn('Failed to fetch blocked devices:', e);
    } finally {
      setIsLoadingBlockedDevices(false);
    }
  }, [user]);

  const blockDevice = async (params: {
    deviceId?: string;
    ip?: string;
    userName?: string;
    userEmail?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    blockType: 'temporary' | 'permanent';
    durationHours?: number;
    reason?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.blockDevice(params, user);
      if (res.success) {
        if (res.blockedDevices) setBlockedDevices(res.blockedDevices);
        if (res.sessions) setSessions(res.sessions);
        setSyncSuccessNotice(res.message);
        setTimeout(() => setSyncSuccessNotice(null), 4000);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to block device:', e);
      return false;
    }
  };

  const unblockDevice = async (params: { deviceId?: string; ip?: string }): Promise<boolean> => {
    try {
      const res = await api.unblockDevice(params, user);
      if (res.success) {
        if (res.blockedDevices) setBlockedDevices(res.blockedDevices);
        setSyncSuccessNotice(res.message);
        setTimeout(() => setSyncSuccessNotice(null), 4000);
        await fetchSessions();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to unblock device:', e);
      return false;
    }
  };

  const refreshData = async () => {
    try {
      const [itemsRes, staffRes, settingsRes, mStatus, sessionsRes, multiDbRes, inquiriesRes, publicSetRes, blockedRes] = await Promise.all([
        api.getItems({ includeDeleted: true }),
        api.getStaff(),
        api.getSettings(),
        api.getMongoStatus(),
        api.getSessions(user),
        api.getMultiDbStatus().catch(() => null),
        api.getInquiries(user).catch(() => null),
        api.getPublicWebsiteSettings().catch(() => null),
        api.getBlockedDevices(user).catch(() => null)
      ]);
      if (itemsRes?.items) {
        setItems(itemsRes.items);
        offlineStorage.saveItems(itemsRes.items);
      }
      if (staffRes) {
        setStaff(staffRes);
        offlineStorage.saveStaff(staffRes);
      }
      setMongoStatus(mStatus);
      if (multiDbRes) {
        setMultiDbState(multiDbRes);
      }
      if (inquiriesRes?.inquiries) {
        setInquiries(inquiriesRes.inquiries);
      }
      if (publicSetRes) {
        setPublicWebsiteSettings(publicSetRes);
      }
      if (settingsRes?.settings) {
        const nextSettings: HotelSettings = {
          ...settingsRes.settings,
          categories: (settingsRes.settings.categories && settingsRes.settings.categories.length > 0)
            ? settingsRes.settings.categories
            : DEFAULT_ITEM_CATEGORIES
        };
        setSettings(nextSettings);
        offlineStorage.saveSettings(nextSettings);
      }
      if (sessionsRes?.sessions) {
        setSessions(sessionsRes.sessions);
      }
      if (blockedRes?.blockedDevices) {
        setBlockedDevices(blockedRes.blockedDevices);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      if (isNetworkError(e)) {
        setIsOnline(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectMongo = async (uri: string, dbName = 'warwick_lost_found') => {
    setIsConnectingMongo(true);
    try {
      const res = await api.connectMongo(uri, dbName, user);
      if (res.status) {
        setMongoStatus(res.status);
      }
      await refreshData();
      setSyncSuccessNotice(`Connected to MongoDB Database: "${res.status?.databaseName || dbName}"!`);
      setTimeout(() => setSyncSuccessNotice(null), 6000);
      return res;
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const testMongo = async (uri: string, dbName = 'warwick_lost_found') => {
    return await api.testMongo(uri, dbName);
  };

  const seedMongo = async () => {
    const res = await api.seedMongo(user);
    await refreshData();
    setSyncSuccessNotice('Local hotel data successfully synchronized to MongoDB collections!');
    setTimeout(() => setSyncSuccessNotice(null), 6000);
    return res;
  };

  const disconnectMongo = async () => {
    const res = await api.disconnectMongo(user);
    if (res.status) {
      setMongoStatus(res.status);
    }
    await refreshData();
    setSyncSuccessNotice('Disconnected from MongoDB. Returned to Local Storage.');
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    return res;
  };

  const restoreInitialDatabase = async () => {
    const res = await api.restoreInitialDatabase(user);
    await refreshData();
    setSyncSuccessNotice('Database successfully restored and reversed to original authentic state!');
    setTimeout(() => setSyncSuccessNotice(null), 6000);
    return res;
  };

  const restoreOriginalFields = async () => {
    const res = await api.restoreOriginalFields(user);
    await refreshData();
    setSyncSuccessNotice('Item descriptions and finder staff names successfully restored!');
    setTimeout(() => setSyncSuccessNotice(null), 6000);
    return res;
  };

  useEffect(() => {
    refreshData();
    fetchNotifications();
  }, []);

  // Cross-tab and real-time synchronization
  // Uses BroadcastChannel for instant inter-tab sync without continuous polling,
  // plus an efficient 60s background heartbeat (only active when tab is visible and online)
  useEffect(() => {
    fetchNotifications();

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('warwick_notif_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_NOTIFICATION') {
            fetchNotifications();
          } else if (event.data?.type === 'ITEMS_UPDATED') {
            // Instantly update items across all open tabs without needing polling
            api.getItems({ includeDeleted: true }).then(res => {
              if (res?.items) setItems(res.items);
            }).catch(() => {});
          } else if (event.data?.type === 'FORCE_CACHE_PURGE') {
            fetchNotifications();
            refreshData();
          }
        };
      }
    } catch {}

    // Calm 60-second heartbeat for notifications, active only when window is visible and online
    const interval = setInterval(async () => {
      if (document.hidden || !effectiveOnline) {
        return;
      }
      try {
        await fetchNotifications();
      } catch (e) {
        // silent
      }
    }, 60000);

    let lastVisibilityCheck = Date.now();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Throttle tab refocus refresh to at most once every 30 seconds
        if (now - lastVisibilityCheck >= 30000) {
          lastVisibilityCheck = now;
          fetchNotifications();
          api.getItems({ includeDeleted: true }).then(res => {
            if (res?.items) setItems(res.items);
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      clearInterval(interval);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
  }, [fetchNotifications, effectiveOnline]);

  // Periodic background check & cross-device sync polling (every 90s, active only when tab is visible)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!effectiveOnline || document.hidden) {
        // Sync is paused while offline or in background
        return;
      }
      try {
        const syncRes = await api.triggerSync(user);
        if (syncRes && syncRes.settings) {
          setSettings(prev => ({
            ...syncRes.settings,
            categories: (syncRes.settings.categories && syncRes.settings.categories.length > 0)
              ? syncRes.settings.categories
              : (prev.categories || DEFAULT_ITEM_CATEGORIES)
          }));
        }
      } catch (e) {
        // silent
      }
    }, 90000);
    return () => clearInterval(interval);
  }, [user, effectiveOnline]);

  // Real-Time Server-Sent Events (SSE) Stream Listener for instant multi-terminal sync
  useEffect(() => {
    if (!effectiveOnline) {
      setIsRealtimeConnected(false);
      return;
    }

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/realtime/stream');

      es.onopen = () => {
        setIsRealtimeConnected(true);
      };

      es.onerror = () => {
        setIsRealtimeConnected(false);
      };

      let lastDbSyncTime = 0;
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'database_state_changed') {
            const now = Date.now();
            if (now - lastDbSyncTime > 10000) {
              lastDbSyncTime = now;
              api.getItems({ includeDeleted: true }).then(res => {
                if (res?.items) setItems(res.items);
              }).catch(() => {});
              fetchNotifications();
            }
          } else if (parsed.event === 'database_sync_completed') {
            if (parsed.payload?.state) {
              setMultiDbState(parsed.payload.state);
            }
          } else if (parsed.event === 'primary_database_changed') {
            if (parsed.payload?.state) {
              setMultiDbState(parsed.payload.state);
            }
          } else if (parsed.event === 'guest_inquiry_created') {
            setInquiries(prev => [parsed.payload, ...prev]);
            fetchNotifications();
          } else if (parsed.event === 'guest_inquiry_updated') {
            setInquiries(prev => prev.map(inq => inq.id === parsed.payload.id ? parsed.payload : inq));
          } else if (parsed.event === 'public_settings_updated') {
            setPublicWebsiteSettings(parsed.payload);
          }
        } catch {
          // ignore keepalives or parsing errors
        }
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [effectiveOnline, fetchNotifications]);

  // Multi-Database Management Methods
  const fetchMultiDbState = useCallback(async () => {
    setIsLoadingMultiDb(true);
    try {
      const state = await api.getMultiDbStatus();
      setMultiDbState(state);
    } catch (err) {
      console.warn('Could not fetch multi-database state:', err);
    } finally {
      setIsLoadingMultiDb(false);
    }
  }, []);

  // Real-Time Database Connection Health Check with live latency & drop/timeout detection
  const checkDatabaseHealth = useCallback(async (): Promise<DatabaseHealthInfo> => {
    setIsCheckingDbHealth(true);
    try {
      const health = await api.getActiveDatabaseHealth();
      setDbHealth(health);
      return health;
    } catch (err: any) {
      const fallback: DatabaseHealthInfo = {
        success: false,
        engine: multiDbState?.primaryEngine || 'mongodb',
        name: 'Active Database',
        status: 'error',
        pingMs: 0,
        message: err.message || 'Database connection dropped or unreachable',
        checkedAt: new Date().toISOString(),
        isPrimary: true
      };
      setDbHealth(fallback);
      return fallback;
    } finally {
      setIsCheckingDbHealth(false);
    }
  }, [multiDbState?.primaryEngine]);

  // Initial database health check on mount and quiet 5-minute heartbeat when tab is active
  useEffect(() => {
    checkDatabaseHealth();
    const interval = setInterval(() => {
      if (!document.hidden && effectiveOnline) {
        checkDatabaseHealth();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [checkDatabaseHealth, effectiveOnline]);

  const pingDatabaseEngine = async (engine: DatabaseEngineType) => {
    const res = await api.pingDatabaseEngine(engine);
    await fetchMultiDbState();
    await checkDatabaseHealth();
    return res;
  };

  const setPrimaryDatabaseEngine = async (engine: DatabaseEngineType) => {
    await api.setPrimaryDatabase(engine, user);
    await fetchMultiDbState();
    await checkDatabaseHealth();
    await refreshData();
    setSyncSuccessNotice(`Active connected database switched to ${engine.toUpperCase()}! Live items loaded directly from this database.`);
    setTimeout(() => setSyncSuccessNotice(null), 6000);
  };

  const configureDatabaseEngine = async (id: string, updates: Partial<DatabaseConnectionInfo>) => {
    await api.configureDatabaseEngine(id, updates, user);
    await fetchMultiDbState();
  };

  const syncAllDatabasesNow = async () => {
    setIsLoadingMultiDb(true);
    try {
      const res = await api.syncAllDatabases(user);
      await fetchMultiDbState();
      setSyncSuccessNotice(`Successfully replicated ${res.totalRecordsReplicated || 38} records across all active databases!`);
      setTimeout(() => setSyncSuccessNotice(null), 6000);
      return res;
    } finally {
      setIsLoadingMultiDb(false);
    }
  };

  const triggerDatabaseFailover = async (targetEngine?: DatabaseEngineType) => {
    const res = await api.triggerDatabaseFailover(targetEngine, user);
    await fetchMultiDbState();
    setSyncSuccessNotice(`Failover test succeeded. Primary source of truth is now ${res.state?.primaryEngine?.toUpperCase() || 'active engine'}.`);
    setTimeout(() => setSyncSuccessNotice(null), 6000);
    return res;
  };

  // Guest Inquiries Methods
  const fetchInquiries = useCallback(async () => {
    setIsLoadingInquiries(true);
    try {
      const res = await api.getInquiries(user);
      if (res?.inquiries) {
        setInquiries(res.inquiries);
      }
    } catch (err) {
      console.warn('Error fetching inquiries:', err);
    } finally {
      setIsLoadingInquiries(false);
    }
  }, [user]);

  const createGuestInquiry = async (inquiryData: Partial<GuestInquiry>): Promise<GuestInquiry> => {
    const res = await api.createGuestInquiry(inquiryData);
    if (res.inquiry) {
      setInquiries(prev => [res.inquiry, ...prev]);
      return res.inquiry;
    }
    throw new Error(res.error || 'Failed to submit inquiry');
  };

  const updateGuestInquiry = async (id: string, updates: Partial<GuestInquiry>): Promise<GuestInquiry> => {
    const res = await api.updateInquiry(id, updates, user);
    if (res.inquiry) {
      setInquiries(prev => prev.map(i => i.id === id ? res.inquiry : i));
      return res.inquiry;
    }
    throw new Error(res.error || 'Failed to update inquiry');
  };

  const deleteGuestInquiry = async (id: string) => {
    await api.deleteInquiry(id, user);
    setInquiries(prev => prev.filter(i => i.id !== id));
  };

  const updatePublicWebsiteSettings = async (newSettings: Partial<PublicWebsiteSettings>) => {
    const res = await api.updatePublicWebsiteSettings(newSettings, user);
    if (res.settings) {
      setPublicWebsiteSettings(res.settings);
      setSyncSuccessNotice('Guest website portal settings updated and deployed live!');
      setTimeout(() => setSyncSuccessNotice(null), 5000);
    }
  };

  const triggerSettingsSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await api.triggerSync(user);
      if (res.settings) {
        setSettings(prev => ({
          ...res.settings,
          categories: (res.settings.categories && res.settings.categories.length > 0)
            ? res.settings.categories
            : (prev.categories || DEFAULT_ITEM_CATEGORIES)
        }));
      }
      setSyncSuccessNotice(`Database synchronized with ${res.syncedDevicesCount || 3} devices at ${new Date().toLocaleTimeString()}`);
      setTimeout(() => setSyncSuccessNotice(null), 5000);
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const clearSystemCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await api.clearSystemCache(user);

      // Clean local client storage caches safely while preserving tokens and active auth
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('cache_') || key.startsWith('query_') || key.startsWith('draft_') || key.startsWith('temp_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}

      // Dispatch real-time BroadcastChannel event across all open tabs / windows
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('warwick_notif_channel');
          bc.postMessage({ type: 'FORCE_CACHE_PURGE', timestamp: Date.now(), version: res.version });
          setTimeout(() => { try { bc.close(); } catch {} }, 500);
        }
      } catch {}

      // Reload fresh data from backend
      await refreshData();
      await fetchNotifications();

      if (res.settings) {
        setSettings(prev => ({
          ...res.settings,
          categories: (res.settings?.categories && res.settings.categories.length > 0)
            ? res.settings.categories
            : (prev.categories || DEFAULT_ITEM_CATEGORIES)
        }));
      }

      setSyncSuccessNotice(`⚡ System cache purged! Synchronized ${res.cacheStats?.items ?? items.length} items & ${res.cacheStats?.staff ?? staff.length} staff members (Sync v${res.version}).`);
      setTimeout(() => setSyncSuccessNotice(null), 6000);
      return res;
    } catch (e: any) {
      console.error('Clear cache failed:', e);
      throw e;
    } finally {
      setIsClearingCache(false);
    }
  };

  const updateSettings = async (newSettings: Partial<HotelSettings>) => {
    // Optimistically apply dynamic theme immediately so user experiences real-time feedback
    if (typeof document !== 'undefined') {
      applyDynamicTheme({ ...settings, ...newSettings });
    }
    setIsSyncing(true);
    try {
      const updated = await api.updateSettings(newSettings, user);
      const merged = {
        ...updated,
        categories: (updated.categories && updated.categories.length > 0)
          ? updated.categories
          : (newSettings.categories || settings.categories || DEFAULT_ITEM_CATEGORIES)
      };
      setSettings(prev => ({
        ...prev,
        ...merged
      }));
      offlineStorage.saveSettings(merged);
      if (typeof document !== 'undefined') {
        applyDynamicTheme(merged);
      }
      setSyncSuccessNotice('Hotel settings saved & synchronized across all connected devices!');
      setTimeout(() => setSyncSuccessNotice(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const createItem = async (itemData: Partial<LostItem>) => {
    // Ensure default status is 'Stored', default storeLocation 'HK Office' and dispatchDurationDays 90
    const payload: Partial<LostItem> = {
      status: 'Stored',
      storeLocation: settings.defaultStoreLocation || 'HK Office',
      dispatchDurationDays: settings.defaultDispatchDurationDays || 90,
      ...itemData
    };
    if (payload.itemName) {
      payload.itemName = capitalizeWords(payload.itemName);
    }

    // Offline / spotty Wi-Fi fallback: immediately store locally and queue for background sync
    if (!effectiveOnline) {
      const localCode = `OFF-${Date.now().toString().slice(-5)}`;
      const localId = `item-offline-${Date.now()}`;
      const localItem: LostItem = {
        id: localId,
        code: localCode,
        itemName: payload.itemName || 'Untitled Item',
        category: payload.category || 'Personal Effects',
        description: payload.description || '',
        locationFound: payload.locationFound || '',
        dateFound: payload.dateFound || new Date().toISOString().split('T')[0],
        timeFound: payload.timeFound || new Date().toTimeString().split(' ')[0].substring(0, 5),
        status: (payload.status as ItemStatus) || 'Stored',
        foundBy: payload.foundBy || user?.name || 'Staff',
        employeeName: payload.employeeName || payload.foundBy || user?.name || 'Staff',
        recordedBy: payload.recordedBy || user?.name || 'Staff',
        storeLocation: payload.storeLocation || settings.defaultStoreLocation || 'HK Office',
        roomNumber: payload.roomNumber,
        dispatchDurationDays: payload.dispatchDurationDays || 90,
        dispatchDeadline: new Date(Date.now() + (payload.dispatchDurationDays || 90) * 86400000).toISOString().split('T')[0],
        timeline: [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'CREATED_OFFLINE',
            actionType: 'create',
            performedBy: user?.name || 'Staff',
            performedByRole: user?.role || 'Staff',
            notes: 'Item logged offline while hotel Wi-Fi was disconnected. Queued for auto-sync.'
          }
        ],
        isOfflineQueued: true,
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setItems(prev => {
        const next = [localItem, ...prev];
        offlineStorage.saveItems(next);
        return next;
      });

      offlineStorage.enqueue({
        type: 'CREATE_ITEM',
        localId,
        localCode,
        payload
      });
      setOfflineQueue(offlineStorage.getQueue());

      soundAlert.playNewItemAlert();
      showCustomToast('info', 'offlineSaved', { code: localCode });
      return localItem;
    }

    try {
      const newItem = await api.createItem(payload, user);
      setItems(prev => {
        const next = [newItem, ...prev.filter(i => i.id !== newItem.id && i.code !== newItem.code)];
        offlineStorage.saveItems(next);
        return next;
      });
      
      // Play subtle audio alert on new item addition
      soundAlert.playNewItemAlert();
      
      // Sync authoritative notification created by backend route /api/items
      fetchNotifications().catch(() => {});

      setSyncSuccessNotice(`Item ${newItem.code} registered & stored in real-time!`);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
      showCustomToast('success', 'itemRegistered', { code: newItem.code, name: newItem.itemName });
      broadcastItemsUpdated();
      return newItem;
    } catch (err: any) {
      if (isNetworkError(err)) {
        setIsOnline(false);
        const localCode = `OFF-${Date.now().toString().slice(-5)}`;
        const localId = `item-offline-${Date.now()}`;
        const localItem: LostItem = {
          id: localId,
          code: localCode,
          itemName: payload.itemName || 'Untitled Item',
          category: payload.category || 'Personal Effects',
          description: payload.description || '',
          locationFound: payload.locationFound || '',
          dateFound: payload.dateFound || new Date().toISOString().split('T')[0],
          timeFound: payload.timeFound || new Date().toTimeString().split(' ')[0].substring(0, 5),
          status: (payload.status as ItemStatus) || 'Stored',
          foundBy: payload.foundBy || user?.name || 'Staff',
          employeeName: payload.employeeName || payload.foundBy || user?.name || 'Staff',
          recordedBy: payload.recordedBy || user?.name || 'Staff',
          storeLocation: payload.storeLocation || settings.defaultStoreLocation || 'HK Office',
          roomNumber: payload.roomNumber,
          dispatchDurationDays: payload.dispatchDurationDays || 90,
          dispatchDeadline: new Date(Date.now() + (payload.dispatchDurationDays || 90) * 86400000).toISOString().split('T')[0],
          timeline: [
            {
              id: `evt-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'CREATED_OFFLINE',
              actionType: 'create',
              performedBy: user?.name || 'Staff',
              performedByRole: user?.role || 'Staff',
              notes: 'Item logged during network drop. Queued for auto-sync.'
            }
          ],
          isOfflineQueued: true,
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setItems(prev => {
          const next = [localItem, ...prev];
          offlineStorage.saveItems(next);
          return next;
        });

        offlineStorage.enqueue({
          type: 'CREATE_ITEM',
          localId,
          localCode,
          payload
        });
        setOfflineQueue(offlineStorage.getQueue());

        soundAlert.playNewItemAlert();
        toast.info(`📶 Network dropped: Item ${localCode} saved locally! It will automatically sync when Wi-Fi is back.`, {
          autoClose: 5000
        });
        return localItem;
      }
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<LostItem>) => {
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.itemName) {
      sanitizedUpdates.itemName = capitalizeWords(sanitizedUpdates.itemName);
    }

    // 1. Optimistic real-time instant update in local React state
    setItems(prev => prev.map(item => (item.id === id || item.code === id ? { ...item, ...sanitizedUpdates, updatedAt: new Date().toISOString() } : item)));
    if (selectedItem && (selectedItem.id === id || selectedItem.code === id)) {
      setSelectedItem(prev => prev ? { ...prev, ...sanitizedUpdates, updatedAt: new Date().toISOString() } : null);
    }
    
    // Play dispatch alert if status was changed to Dispatched
    if (sanitizedUpdates.status === 'Dispatched') {
      soundAlert.playDispatchAlert();
    }
    
    // 2. Call backend API & MongoDB
    try {
      const updated = await api.updateItem(id, sanitizedUpdates, user);
      setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
      if (selectedItem && (selectedItem.id === id || selectedItem.code === id)) {
        setSelectedItem(updated);
      }
      setSyncSuccessNotice(`Item ${updated.code} updated in real-time!`);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
      showCustomToast('success', 'itemUpdated', { code: updated.code, name: updated.itemName });
      broadcastItemsUpdated();
      return updated;
    } catch (err: any) {
      console.error('Failed to update item:', err);
      toast.error(`Failed to update item: ${err?.message || 'Server error'}`);
      // Refresh to ensure consistent state if backend rejected
      await refreshData();
      throw err;
    }
  };

  const approveItem = async (id: string) => {
    try {
      const updated = await api.approveItem(id, user);
      setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
      if (selectedItem && (selectedItem.id === id || selectedItem.code === id)) {
        setSelectedItem(updated);
      }
      
      // Sync authoritative notification created by backend route /api/items/:id/approve
      fetchNotifications().catch(() => {});

      setSyncSuccessNotice(`Item ${updated.code} approved & recorded by ${user?.name || 'Admin'}!`);
      setTimeout(() => setSyncSuccessNotice(null), 5000);
      showCustomToast('success', 'itemApproved', { code: updated.code });
      broadcastItemsUpdated();
      return updated;
    } catch (err: any) {
      console.error('Failed to approve item:', err);
      toast.error(`Approval failed: ${err?.message || 'Server error'}`);
      await refreshData();
      throw err;
    }
  };

  const rejectItem = async (id: string, reason?: string) => {
    try {
      const cleanReason = (reason && reason.trim()) || 'Submission was rejected during supervisor verification.';
      const updated = await api.rejectItem(id, cleanReason, user);
      setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
      if (selectedItem && (selectedItem.id === id || selectedItem.code === id)) {
        setSelectedItem(updated);
      }

      // Sync authoritative notification created by backend route /api/items/:id/reject
      fetchNotifications().catch(() => {});

      setSyncSuccessNotice(`Item ${updated.code} submission rejected.`);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
      showCustomToast('info', 'itemRejected', { code: updated.code });
      broadcastItemsUpdated();
      return updated;
    } catch (err: any) {
      console.error('Failed to reject item:', err);
      toast.error(`Rejection failed: ${err?.message || 'Server error'}`);
      await refreshData();
      throw err;
    }
  };

  const handoverItem = async (id: string, details: { receiverName: string; contactNumber: string; remarks?: string }) => {
    const updated = await api.handoverItem(id, details, user);
    setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
    if (selectedItem?.id === id || selectedItem?.code === id) {
      setSelectedItem(updated);
    }

    // Play subtle handover confirmation audio alert
    soundAlert.playHandoverAlert();

    // Sync authoritative notification created by backend route /api/items/:id/handover
    fetchNotifications().catch(() => {});

    showCustomToast('success', 'itemHandedOver', { code: updated.code, receiver: details.receiverName });
    broadcastItemsUpdated();
  };

  const dispatchItem = async (id: string, details: { courierName?: string; trackingNumber?: string; destination?: string; remarks?: string }) => {
    const updated = await api.dispatchItem(id, details, user);
    setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
    if (selectedItem?.id === id || selectedItem?.code === id) {
      setSelectedItem(updated);
    }

    // Play subtle dispatch audio alert
    soundAlert.playDispatchAlert();

    // Sync authoritative notification created by backend route /api/items/:id/dispatch
    fetchNotifications().catch(() => {});

    showCustomToast('success', 'itemDispatched', { code: updated.code, courier: details.courierName || 'Courier' });
    broadcastItemsUpdated();
  };

  const deleteItem = async (id: string, options?: { permanent?: boolean; reason?: string }) => {
    const targetItem = items.find(i => i.id === id || i.code === id);
    if (targetItem?.status === 'Handed Over' || targetItem?.status === 'Claimed') {
      const lockedMsg = getValidationMessage('valLockedItem', '⚠️ Handed Over items are locked and cannot be deleted.');
      setSyncSuccessNotice(lockedMsg);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
      toast.warning(lockedMsg);
      setIsDeleteModalOpen(false);
      return;
    }

    const code = targetItem?.code || id;
    const isPermanent = options?.permanent;
    const reason = options?.reason || 'Moved to Removed Items';

    if (isPermanent) {
      setItems(prev => prev.filter(item => item.id !== id && item.code !== id));
      setSyncSuccessNotice(`Item ${code} permanently deleted.`);
      showCustomToast('info', 'itemDeleted', { code });
    } else {
      const now = new Date().toISOString();
      setItems(prev => prev.map(item => {
        if (item.id === id || item.code === id) {
          return {
            ...item,
            isDeleted: true,
            deletedAt: now,
            deletedBy: user?.name || 'Staff',
            deletedByRole: user?.role || 'Staff',
            deletionReason: reason,
            timeline: [
              ...(item.timeline || []),
              {
                id: `tl-${Date.now()}`,
                action: 'Moved to Removed Items',
                performedBy: user?.name || 'Staff',
                timestamp: now,
                notes: `Moved to Removed Items (retained for 60 days). Reason: ${reason}`
              }
            ]
          };
        }
        return item;
      }));
      setSyncSuccessNotice(`Item ${code} moved to Removed Items (retained for 60 days).`);
      showCustomToast('warning', 'itemTrash', { code });
    }

    if (selectedItem?.id === id || selectedItem?.code === id) {
      setSelectedItem(null);
    }
    if (editingItem?.id === id || editingItem?.code === id) {
      setEditingItem(null);
    }
    setIsDeleteModalOpen(false);
    setIsDetailsModalOpen(false);

    setTimeout(() => setSyncSuccessNotice(null), 5000);

    try {
      await api.deleteItem(id, options, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed to delete item from backend:', err);
      toast.error('Failed to delete item from server.');
      await refreshData();
    }
  };

  const batchDeleteItems = async (ids: string[], options?: { permanent?: boolean; reason?: string }) => {
    if (!ids || ids.length === 0) return;
    const isPermanent = options?.permanent;
    const reason = options?.reason || 'Moved to Removed Items (Batch Delete)';
    const now = new Date().toISOString();

    if (isPermanent) {
      setItems(prev => prev.filter(item => !ids.includes(item.id) && !ids.includes(item.code)));
      setSyncSuccessNotice(`Permanently deleted ${ids.length} items.`);
      showCustomToast('info', 'batchDeleted', { count: ids.length });
    } else {
      setItems(prev => prev.map(item => {
        if (ids.includes(item.id) || ids.includes(item.code)) {
          // Handed Over items cannot be deleted
          if (item.status === 'Handed Over' || item.status === 'Claimed') return item;
          return {
            ...item,
            isDeleted: true,
            deletedAt: now,
            deletedBy: user?.name || 'Staff',
            deletedByRole: user?.role || 'Staff',
            deletionReason: reason,
            timeline: [
              ...(item.timeline || []),
              {
                id: `tl-${Date.now()}-${item.id}`,
                action: 'Moved to Removed Items (Batch)',
                performedBy: user?.name || 'Staff',
                timestamp: now,
                notes: `Moved to Removed Items (retained for 60 days). Reason: ${reason}`
              }
            ]
          };
        }
        return item;
      }));
      setSyncSuccessNotice(`Successfully moved ${ids.length} items to Removed Items (retained for 60 days).`);
      showCustomToast('warning', 'batchTrash', { count: ids.length });
    }

    if (selectedItem && (ids.includes(selectedItem.id) || ids.includes(selectedItem.code))) {
      setSelectedItem(null);
    }
    if (editingItem && (ids.includes(editingItem.id) || ids.includes(editingItem.code))) {
      setEditingItem(null);
    }
    setIsDeleteModalOpen(false);
    setIsDetailsModalOpen(false);

    setTimeout(() => setSyncSuccessNotice(null), 5000);

    try {
      await api.batchDeleteItems(ids, options, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed batch delete on backend:', err);
      await refreshData();
    }
  };

  const batchDispatchItems = async (
    ids: string[],
    details: { courierName?: string; trackingNumber?: string; destination?: string; dispatchedTo?: string; notes?: string }
  ) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    setItems(prev => prev.map(item => {
      if (ids.includes(item.id) || ids.includes(item.code)) {
        const finder = item.employeeName || item.submittedByStaffName || 'Finder Staff';
        const targetReceiver = details.dispatchedTo || finder;
        return {
          ...item,
          status: 'Dispatched',
          updatedAt: now,
          dispatchDetails: {
            courierName: details.courierName || 'Internal Staff Dispatch',
            trackingNumber: details.trackingNumber || `BATCH-DSP-${item.code}`,
            destination: details.destination || `Released to Finder Staff (${targetReceiver})`,
            dispatchedTo: targetReceiver,
            notes: details.notes || `Dispatched in batch to finder: ${targetReceiver}`,
            dispatchedAt: now,
            dispatchedBy: user?.name || 'Staff'
          },
          timeline: [
            ...(item.timeline || []),
            {
              id: `tl-${Date.now()}-${item.id}`,
              action: 'Item Dispatched (Batch)',
              performedBy: user?.name || 'Staff',
              timestamp: now,
              notes: `Dispatched in batch via ${details.courierName || 'Internal Staff Dispatch'} to ${targetReceiver}`
            }
          ]
        };
      }
      return item;
    }));

    setSyncSuccessNotice(`Successfully dispatched ${ids.length} items.`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('success', 'batchDispatched', { count: ids.length });

    // Play subtle audio alert for batch dispatch
    soundAlert.playDispatchAlert();

    try {
      await api.batchDispatchItems(ids, details, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed batch dispatch on backend:', err);
      toast.error('Failed batch dispatch on server.');
      await refreshData();
    }
  };

  const returnToStoreItem = async (id: string, reason?: string) => {
    const targetItem = items.find(i => i.id === id || i.code === id);
    const code = targetItem?.code || id;
    const now = new Date().toISOString();

    // 1. Instant optimistic real-time state update in React
    setItems(prev => prev.map(item => {
      if (item.id === id || item.code === id) {
        return {
          ...item,
          status: 'Stored',
          handoverDetails: undefined,
          dispatchDetails: undefined,
          updatedAt: now,
          timeline: [
            ...(item.timeline || []),
            {
              id: `tl-${Date.now()}`,
              action: 'Item Returned to Store',
              performedBy: user?.name || 'Admin',
              timestamp: now,
              notes: `Returned to Store by Admin ${user?.name || 'Admin'}.${reason ? ' Reason: ' + reason : ''}`
            }
          ]
        };
      }
      return item;
    }));

    if (selectedItem && (selectedItem.id === id || selectedItem.code === id)) {
      setSelectedItem(prev => prev ? {
        ...prev,
        status: 'Stored',
        handoverDetails: undefined,
        dispatchDetails: undefined,
        updatedAt: now,
        timeline: [
          ...(prev.timeline || []),
          {
            id: `tl-${Date.now()}`,
            action: 'Item Returned to Store',
            performedBy: user?.name || 'Admin',
            timestamp: now,
            notes: `Returned to Store by Admin ${user?.name || 'Admin'}.${reason ? ' Reason: ' + reason : ''}`
          }
        ]
      } : null);
    }

    setSyncSuccessNotice(`Item ${code} successfully returned to Stored inventory!`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('info', 'itemReturned', { code });

    // 2. Persist to Express API & MongoDB backend
    try {
      const updated = await api.returnToStoreItem(id, reason, user);
      if (updated) {
        setItems(prev => prev.map(item => (item.id === id || item.code === id ? updated : item)));
        if (selectedItem?.id === id || selectedItem?.code === id) {
          setSelectedItem(updated);
        }
        broadcastItemsUpdated();
      }
    } catch (err: any) {
      console.error('Failed to return item to store in backend:', err);
      toast.error('Failed to return item to store on server.');
    }
  };

  const restoreItem = async (id: string) => {
    const targetItem = items.find(i => i.id === id || i.code === id);
    const code = targetItem?.code || id;
    const now = new Date().toISOString();

    setItems(prev => prev.map(item => {
      if (item.id === id || item.code === id) {
        return {
          ...item,
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          deletedByRole: undefined,
          deletionReason: undefined,
          timeline: [
            ...(item.timeline || []),
            {
              id: `tl-${Date.now()}`,
              action: 'Item Restored',
              performedBy: user?.name || 'Staff',
              timestamp: now,
              notes: 'Restored from Removed Items to active inventory'
            }
          ]
        };
      }
      return item;
    }));

    setSyncSuccessNotice(`Item ${code} successfully restored to active inventory.`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('success', 'itemRestored', { code });

    try {
      await api.restoreItem(id, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed to restore item:', err);
      toast.error('Failed to restore item on server.');
      await refreshData();
    }
  };

  const permanentDeleteItem = async (id: string) => {
    await deleteItem(id, { permanent: true });
  };

  const batchRestoreItems = async (ids: string[]) => {
    const now = new Date().toISOString();
    setItems(prev => prev.map(item => {
      if (ids.includes(item.id) || ids.includes(item.code)) {
        return {
          ...item,
          isDeleted: false,
          deletedAt: undefined,
          deletionReason: undefined,
          timeline: [
            ...(item.timeline || []),
            {
              id: `tl-${Date.now()}-${item.id}`,
              action: 'Item Restored (Batch)',
              performedBy: user?.name || 'Staff',
              timestamp: now,
              notes: 'Restored from Removed Items batch'
            }
          ]
        };
      }
      return item;
    }));

    setSyncSuccessNotice(`Successfully restored ${ids.length} items to active inventory.`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('success', 'batchRestored', { count: ids.length });

    try {
      await api.batchRestoreItems(ids, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed batch restore:', err);
      toast.error('Failed batch restore on server.');
      await refreshData();
    }
  };

  const batchPermanentDeleteItems = async (ids: string[]) => {
    setItems(prev => prev.filter(item => !ids.includes(item.id) && !ids.includes(item.code)));
    setSyncSuccessNotice(`Permanently deleted ${ids.length} items.`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('info', 'batchDeleted', { count: ids.length });

    try {
      await api.batchPermanentDeleteItems(ids, user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed batch permanent delete:', err);
      toast.error('Failed batch delete on server.');
      await refreshData();
    }
  };

  const emptyTrash = async () => {
    setItems(prev => prev.filter(item => !item.isDeleted));
    setSyncSuccessNotice(`Recycle Bin emptied successfully.`);
    setTimeout(() => setSyncSuccessNotice(null), 5000);
    showCustomToast('info', 'trashEmptied');

    try {
      await api.emptyTrash(user);
      broadcastItemsUpdated();
    } catch (err) {
      console.error('Failed to empty trash:', err);
      toast.error('Failed to empty trash on server.');
      await refreshData();
    }
  };

  const addStaff = async (staffData: Partial<StaffMember>) => {
    const created = await api.addStaff(staffData, user);
    setStaff(prev => [...prev, created]);
    showCustomToast('success', 'staffSaved', { name: created.name });
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    const updated = await api.updateStaff(id, updates, user);
    setStaff(prev => {
      const nextStaff = prev.map(s => (s.id === id || (s as any)._id === id || s.userId === id || s.staffId === id ? { ...s, ...updated } : s));
      offlineStorage.saveStaff(nextStaff);
      return nextStaff;
    });

    // If the updated staff member is the currently logged in user, synchronize auth state immediately
    if (user && (
      user.id === id ||
      (user as any)._id === id ||
      user.staffId === id ||
      user.userId === id ||
      (user.email && updated.email && user.email.toLowerCase() === updated.email.toLowerCase()) ||
      (user.name && updated.name && user.name.toLowerCase() === updated.name.toLowerCase())
    )) {
      if (updated.permissions) {
        updateUserPermissions(updated.permissions);
      }
      if (updated.role && updated.role !== user.role) {
        updateUserRole(updated.role);
      }
    }

    setSyncSuccessNotice(`Staff member updated successfully.`);
    setTimeout(() => setSyncSuccessNotice(null), 3000);
    showCustomToast('success', 'staffSaved', { name: updates.name || 'Staff' });
  };

  const deleteStaff = async (id: string) => {
    const targetMember = staff.find(s => s.id === id || s.userId === id || (s as any)._id === id);
    const memberName = targetMember?.name || 'Staff member';
    
    // Optimistic local state removal
    setStaff(prev => prev.filter(s => s.id !== id && s.userId !== id && (s as any)._id !== id));
    
    try {
      await api.deleteStaff(id, user);
      setSyncSuccessNotice(`${memberName} removed successfully.`);
      setTimeout(() => setSyncSuccessNotice(null), 4000);
      showCustomToast('info', 'staffDeleted', { name: memberName });
    } catch (err: any) {
      console.error('Failed to remove staff member:', err);
      toast.error(`Failed to remove staff member: ${err?.message || 'Server error'}`);
      await refreshData();
      throw err;
    }
  };

  const importItems = async (importedItems: Partial<LostItem>[], mode: 'append' | 'replace' = 'append') => {
    try {
      const res = await api.importItems(importedItems, mode, user);
      if (res.items && Array.isArray(res.items)) {
        setItems(res.items);
      } else {
        await refreshData();
      }
      setSyncSuccessNotice(`Successfully imported ${res.count || importedItems.length} items dynamically into item list!`);
      setTimeout(() => setSyncSuccessNotice(null), 5000);
      toast.success(`📥 Successfully imported ${res.count || importedItems.length} items!`);
      broadcastItemsUpdated();
      return res;
    } catch (err: any) {
      console.error('Failed to import items:', err);
      toast.error(`Import failed: ${err?.message || 'Server error'}`);
      await refreshData();
      throw err;
    }
  };

  // Modal helpers
  const openItemDetails = (item: LostItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const openHandover = (item: LostItem) => {
    setSelectedItem(item);
    setIsHandoverModalOpen(true);
  };

  const openDispatch = (item: LostItem) => {
    setSelectedItem(item);
    setIsDispatchModalOpen(true);
  };

  const openDelete = (item: LostItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const openReturnToStore = (item: LostItem) => {
    setReturnModalItem(item);
    setIsReturnToStoreModalOpen(true);
  };

  const openPrint = (item: LostItem, mode: 'report' | 'receipt' = 'report') => {
    setSelectedItem(item);
    setPrintMode(mode);
    setIsPrintModalOpen(true);
  };

  const openEditItem = (item: LostItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const openQrScanner = () => {
    setIsQrScannerOpen(true);
  };

  const openItemQrModal = (item: LostItem) => {
    setQrModalItem(item);
    setIsItemQrModalOpen(true);
  };

  // URL query parameter auto-lookup for scanned QR links (e.g. ?itemCode=LF-2026-08-112 or ?scan=true)
  useEffect(() => {
    if (typeof window !== 'undefined' && items.length > 0) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const itemCodeParam = urlParams.get('itemCode') || urlParams.get('code');
        const scanParam = urlParams.get('scan');

        if (itemCodeParam) {
          const lowerParam = itemCodeParam.toLowerCase().trim();
          const match = items.find(
            it =>
              (it.code && it.code.toLowerCase().trim() === lowerParam) ||
              (it.id && it.id.toLowerCase().trim() === lowerParam)
          );
          if (match) {
            setSelectedItem(match);
            setIsDetailsModalOpen(true);
          }
        } else if (scanParam === 'true' || scanParam === '1') {
          setIsQrScannerOpen(true);
        }
      } catch {
        // ignore url params error
      }
    }
  }, [items]);

  // Dynamic root CSS styling synchronization
  useEffect(() => {
    if (typeof document !== 'undefined') {
      applyDynamicTheme(settings);
    }
  }, [
    settings.primaryColor,
    settings.secondaryColor,
    settings.buttonColor,
    settings.buttonHoverColor,
    settings.buttonTextColor,
    settings.headingColor,
    settings.accentColor,
    settings.fontColor,
    settings.fontFamily,
    settings.buttonRadius,
    settings.activePresetId
  ]);

  // Synchronize dynamic browser Favicon in real-time
  useEffect(() => {
    updateDocumentFavicon(settings?.faviconUrl);
  }, [settings?.faviconUrl]);

  // Derived collections
  const activeItems = useMemo(() => items.filter(i => !i.isDeleted), [items]);
  const removedItems = useMemo(() => items.filter(i => Boolean(i.isDeleted)), [items]);

  // Compute stats 100% dynamically from live active items
  const stats: DashboardStats = useMemo(() => {
    const totalItems = activeItems.length;
    const stored = activeItems.filter(i => i.status === 'Stored').length;
    const handedOver = activeItems.filter(i => i.status === 'Handed Over' || i.status === 'Claimed').length;
    const dispatched = activeItems.filter(i => i.status === 'Dispatched' || i.status === 'Disposed').length;

    const todayDate = new Date();
    const todayIso = todayDate.toISOString().split('T')[0];
    const todayLocal = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    
    // Found Today: Items where dateFound or createdAt matches today
    const foundToday = activeItems.filter(i => {
      const dFound = i.dateFound ? i.dateFound.split('T')[0] : '';
      const cDate = i.createdAt ? i.createdAt.split('T')[0] : '';
      return dFound === todayIso || dFound === todayLocal || cDate === todayIso || cDate === todayLocal;
    }).length;

    // Items eligible for pending dispatch review (Stored or Pending status)
    const activeStorageItems = activeItems.filter(i => 
      i.status === 'Stored' ||
      i.status === 'Pending' || 
      i.status === 'Pending Approval' || 
      i.status === 'Pending Claim' ||
      i.status === 'Under Review'
    );

    let dueTodayDispatch = 0;
    let dueInThreeDaysDispatch = 0;
    let overdueDispatch = 0;
    const pendingDispatchList: LostItem[] = [];

    activeStorageItems.forEach(item => {
      if (item.dispatchDeadline) {
        const deadlineDate = new Date(item.dispatchDeadline);
        const todayMid = new Date(todayIso);
        const diffDays = Math.ceil((deadlineDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          overdueDispatch++;
          pendingDispatchList.push(item);
        } else if (diffDays === 0) {
          dueTodayDispatch++;
          pendingDispatchList.push(item);
        } else if (diffDays <= 3) {
          dueInThreeDaysDispatch++;
          pendingDispatchList.push(item);
        } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
          pendingDispatchList.push(item);
        }
      } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
        pendingDispatchList.push(item);
      }
    });

    const pendingDispatch = pendingDispatchList.length;

    const itemsByCategory: Record<ItemCategory, number> = {
      'Clothing': 0,
      'Documents': 0,
      'Electronics': 0,
      'Foods': 0,
      'Medicines': 0,
      'Jewelry': 0,
      'Personal Items': 0,
      'Other': 0
    };

    activeItems.forEach(item => {
      const cat = item.category as ItemCategory;
      if (itemsByCategory[cat] !== undefined) {
        itemsByCategory[cat]++;
      } else {
        itemsByCategory['Other'] = (itemsByCategory['Other'] || 0) + 1;
      }
    });

    const itemsByStatus: Record<ItemStatus, number> = {
      'Found': foundToday,
      'Stored': stored,
      'Pending Approval': activeItems.filter(i => i.status === 'Pending Approval').length,
      'Pending': pendingDispatch,
      'Handed Over': handedOver,
      'Claimed': handedOver,
      'Dispatched': dispatched,
      'Archived': activeItems.filter(i => i.status === 'Archived').length,
      'Pending Claim': activeItems.filter(i => i.status === 'Pending Claim').length,
      'Under Review': activeItems.filter(i => i.status === 'Under Review').length,
      'Unclaimed': activeItems.filter(i => i.status === 'Unclaimed').length,
      'Donated': activeItems.filter(i => i.status === 'Donated').length,
      'Disposed': activeItems.filter(i => i.status === 'Disposed').length
    };

    // Calculate dynamic monthly trends from real items
    const monthMap: Record<string, { found: number; returned: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed last 4 months
    const curMonth = todayDate.getMonth();
    for (let i = 3; i >= 0; i--) {
      const mIdx = (curMonth - i + 12) % 12;
      monthMap[monthNames[mIdx]] = { found: 0, returned: 0 };
    }

    activeItems.forEach(item => {
      if (item.dateFound) {
        const itemDate = new Date(item.dateFound);
        if (!isNaN(itemDate.getTime())) {
          const mName = monthNames[itemDate.getMonth()];
          if (monthMap[mName]) {
            monthMap[mName].found++;
            if (item.status === 'Handed Over' || item.status === 'Claimed') {
              monthMap[mName].returned++;
            }
          }
        }
      }
    });

    const monthlyTrends = Object.entries(monthMap).map(([month, data]) => ({
      month,
      found: data.found,
      returned: data.returned
    }));

    return {
      totalItems,
      foundToday,
      stored,
      handedOver,
      dispatched,
      pendingDispatch,
      overdueDispatch,
      dueTodayDispatch,
      dueInThreeDaysDispatch,
      itemsByCategory,
      itemsByStatus,
      monthlyTrends
    };
  }, [activeItems]);

  const openStaffProfile = useCallback((staffMember?: StaffMember | null) => {
    setSelectedStaffProfile(staffMember || null);
    setActiveTab('profile');
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedStaffProfile,
        setSelectedStaffProfile,
        openStaffProfile,
        items,
        activeItems,
        removedItems,
        staff,
        settings,
        sessions,
        isLoadingSessions,
        fetchSessions,
        deleteSession,
        blockedDevices,
        isLoadingBlockedDevices,
        fetchBlockedDevices,
        blockDevice,
        unblockDevice,
        filters,
        setFilters,
        isLoading,
        isSyncing,
        syncSuccessNotice,
        stats,
        isOnline: effectiveOnline,
        isSyncPaused,
        checkConnection,
        simulateOfflineToggle,
        offlineQueue,
        syncOfflineQueue,
        isProcessingQueue,
        lastSyncTime,
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationRead,
        markNotificationUnread,
        markAllNotificationsRead,
        clearNotifications,
        deleteNotification,
        broadcastNotification,
        selectedNoticeForModal,
        isNoticeModalOpen,
        openNoticeModal,
        closeNoticeModal,
        isNotificationRead,
        isNotificationDeleted,
        getToastMessage,
        getValidationMessage,
        showCustomToast,
        isBroadcastModalOpen,
        setIsBroadcastModalOpen,
        mongoStatus,
        isConnectingMongo,
        refreshMongoStatus,
        connectMongo,
        testMongo,
        seedMongo,
        disconnectMongo,
        restoreInitialDatabase,
        restoreOriginalFields,
        // Multi-Database System Architecture
        multiDbState,
        isLoadingMultiDb,
        fetchMultiDbState,
        pingDatabaseEngine,
        setPrimaryDatabaseEngine,
        configureDatabaseEngine,
        syncAllDatabasesNow,
        triggerDatabaseFailover,
        // Real-Time Database Health Indicator
        dbHealth,
        isCheckingDbHealth,
        checkDatabaseHealth,
        // Real-Time SSE Stream
        isRealtimeConnected,
        realtimeClientsCount,
        // Public Hotel Guest Website & Inquiries Portal
        inquiries,
        isLoadingInquiries,
        fetchInquiries,
        createGuestInquiry,
        updateGuestInquiry,
        deleteGuestInquiry,
        publicWebsiteSettings,
        updatePublicWebsiteSettings,
        isPublicWebsiteMode,
        setIsPublicWebsiteMode,
        isAddModalOpen,
        setIsAddModalOpen,
        editingItem,
        setEditingItem,
        selectedItem,
        setSelectedItem,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        isHandoverModalOpen,
        setIsHandoverModalOpen,
        isDispatchModalOpen,
        setIsDispatchModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isReturnToStoreModalOpen,
        setIsReturnToStoreModalOpen,
        returnModalItem,
        setReturnModalItem,
        openReturnToStore,
        isPrintModalOpen,
        setIsPrintModalOpen,
        printMode,
        setPrintMode,
        isQrScannerOpen,
        setIsQrScannerOpen,
        openQrScanner,
        isItemQrModalOpen,
        setIsItemQrModalOpen,
        qrModalItem,
        setQrModalItem,
        openItemQrModal,
        isStaffModalOpen,
        setIsStaffModalOpen,
        editingStaff,
        setEditingStaff,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        commandPaletteInitialQuery,
        setCommandPaletteInitialQuery,
        openCommandPalette,
        closeCommandPalette,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
        openShortcutsModal,
        closeShortcutsModal,
        refreshData,
        isClearingCache,
        clearSystemCache,
        triggerSettingsSync,
        updateSettings,
        createItem,
        updateItem,
        approveItem,
        rejectItem,
        handoverItem,
        dispatchItem,
        deleteItem,
        batchDeleteItems,
        batchDispatchItems,
        returnToStoreItem,
        restoreItem,
        permanentDeleteItem,
        batchRestoreItems,
        batchPermanentDeleteItems,
        emptyTrash,
        addStaff,
        updateStaff,
        deleteStaff,
        importItems,
        openItemDetails,
        openHandover,
        openDispatch,
        openDelete,
        openPrint,
        openEditItem
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
