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
  rejectedBy?: string;
  rejectedAt?: string;
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
