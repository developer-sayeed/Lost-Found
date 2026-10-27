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
  loginAt?: string;
  createdAt?: string;
  userAgent?: string;
  isCurrent?: boolean;
  isOnlineNow?: boolean;
  hoursAgo?: number;
}

export interface SecurityActivityLog {
  id: string;
  action: string;
  eventType: 'login_success' | 'login_failed' | 'password_change' | 'session_management';
  performedBy: string;
  performedByRole?: string;
  performedByEmail?: string;
  details: string;
  timestamp: string;
  ip: string;
  deviceType?: string;
  browser?: string;
  status: 'success' | 'failed' | 'warning' | 'info';
  userName?: string;
  userEmail?: string;
  description?: string;
  role?: string;
}

export interface BlockedDevice {
  deviceId: string;
  ip?: string;
  userName?: string;
  userEmail?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  blockType: 'temporary' | 'permanent';
  blockedAt: string;
  blockedUntil?: string | null;
  reason?: string;
  blockedBy: string;
  blockedByRole?: string;
}
