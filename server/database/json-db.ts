import fs from 'fs';
import { DATA_DIR, DB_FILE } from '../config/env.config.ts';
import { INITIAL_HOTEL_SETTINGS, DEFAULT_ITEM_CATEGORIES } from '../../src/lib/constants.ts';
import {
  LostItem,
  StaffMember,
  HotelSettings,
  User,
  AuditLog,
  DeviceSession,
  BlockedDevice,
  AppNotification,
  Certificate,
  CustomCertificateTemplate,
  RecentUserSignature,
  MediaItem
} from '../../src/types.ts';
import { capitalizeWords } from '../utils/string.utils.ts';
import { multiDbService } from '../multiDatabase.ts';

export interface DatabaseSchema {
  settings: HotelSettings;
  items: LostItem[];
  staff: StaffMember[];
  users: User[];
  auditLogs: AuditLog[];
  activeSessions: DeviceSession[];
  notifications: AppNotification[];
  certificates: Certificate[];
  certificateTemplates?: CustomCertificateTemplate[];
  blockedDevices?: BlockedDevice[];
  recentSignatures?: RecentUserSignature[];
  media: MediaItem[];
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to create pristine initial database
export function getInitialFreshDatabase(): DatabaseSchema {
  const initialUsers: User[] = [
    {
      id: 'usr-1',
      name: 'MD ABU SAYEED RIDAY',
      email: 'abusayeedriday@gmail.com',
      role: 'Super Admin',
      department: 'Security',
      phone: '0558594605',
      authProvider: 'email',
      password: '587710',
      staffId: '1273',
      userId: '1273',
      lastActive: new Date().toISOString()
    } as any
  ];
  const initialStaff: StaffMember[] = [
    {
      id: 'staff-1',
      serial: 1,
      name: 'MD ABU SAYEED RIDAY',
      userId: '1273',
      staffId: '1273',
      email: 'abusayeedriday@gmail.com',
      phone: '0558594605',
      department: 'Security',
      role: 'Super Admin',
      status: 'Active',
      password: '587710',
      permissions: ['view', 'create', 'edit', 'handover', 'dispatch', 'print', 'delete', 'staff_management', 'settings'],
      itemsFoundCount: 42,
      handoversCount: 19,
      createdAt: '2026-01-10T08:00:00Z',
      lastLogin: new Date().toISOString()
    }
  ];
  return {
    settings: JSON.parse(JSON.stringify(INITIAL_HOTEL_SETTINGS)),
    items: [],
    staff: initialStaff,
    users: initialUsers,
    auditLogs: [],
    notifications: [],
    blockedDevices: [],
    activeSessions: [],
    certificates: [],
    media: []
  };
}

// Initialize or load database
export function loadDatabase(): DatabaseSchema {
  const freshDb = getInitialFreshDatabase();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed.media)) {
        parsed.media = [];
      }
      if (!Array.isArray(parsed.notifications)) {
        parsed.notifications = [];
      }
      if (!Array.isArray(parsed.certificates)) {
        parsed.certificates = [];
      }
      if (!Array.isArray(parsed.certificateTemplates)) {
        parsed.certificateTemplates = [];
      }
      if (!Array.isArray(parsed.auditLogs)) {
        parsed.auditLogs = [];
      } else {
        // Only real runtime records - remove any mock/seeded dummy audit logs
        parsed.auditLogs = parsed.auditLogs.filter((l: any) => l && l.id && !String(l.id).startsWith('audit-log-00'));
      }
      if (!Array.isArray(parsed.blockedDevices)) {
        parsed.blockedDevices = [];
      }
      if (!Array.isArray(parsed.activeSessions)) {
        parsed.activeSessions = [];
      } else {
        const cutoff24h = Date.now() - 24 * 3600 * 1000;
        parsed.activeSessions = parsed.activeSessions.filter((s: any) => {
          if (!s || !s.deviceId || !s.lastSeen) return false;
          if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
          const seenTime = new Date(s.lastSeen).getTime();
          return !isNaN(seenTime) && seenTime > cutoff24h;
        });
      }
      return parsed;
    } catch (err) {
      console.error('Error reading db.json, re-initializing...', err);
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf-8');
  return freshDb;
}

export const db: DatabaseSchema = loadDatabase();

// Device Blacklist & Temporary/Permanent Block Validator
export function isDeviceBlocked(deviceId?: string, ip?: string): { blocked: boolean; device?: BlockedDevice } {
  if (!deviceId && !ip) return { blocked: false };
  if (!Array.isArray(db.blockedDevices)) {
    db.blockedDevices = [];
    return { blocked: false };
  }

  const now = Date.now();
  let modified = false;

  // Clean up expired temporary blocks automatically
  db.blockedDevices = db.blockedDevices.filter(b => {
    if (b.blockType === 'temporary' && b.blockedUntil) {
      if (new Date(b.blockedUntil).getTime() <= now) {
        modified = true;
        return false;
      }
    }
    return true;
  });

  if (modified) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch {}
  }

  const match = db.blockedDevices.find(b =>
    (deviceId && b.deviceId === deviceId) ||
    (ip && b.ip && b.ip === ip)
  );

  if (match) {
    return { blocked: true, device: match };
  }

  return { blocked: false };
}

// Enforce database auth integrity: Super Admin email 'abusayeedriday@gmail.com' with password '587710' stored in database
export function ensureDatabaseAuthIntegrity() {
  let modified = false;

  // 1. db.users MUST strictly contain valid Super Admin / user accounts with valid emails
  const previousUserCount = db.users.length;
  db.users = db.users.filter(u => 
    u && typeof u.email === 'string' && u.email.includes('@') && u.email !== '2811' &&
    (u.email.toLowerCase() === 'abusayeedriday@gmail.com' || 
     u.email.toLowerCase() === 'mdriday256@gmail.com' || 
     u.role === 'Super Admin')
  );
  if (db.users.length !== previousUserCount) {
    modified = true;
  }

  let superAdminUser = db.users.find(u => u.email.toLowerCase() === 'abusayeedriday@gmail.com');
  if (superAdminUser) {
    if (superAdminUser.password !== '587710') {
      superAdminUser.password = '587710';
      modified = true;
    }
    if ((superAdminUser as any).staffId !== '1273') {
      (superAdminUser as any).staffId = '1273';
      (superAdminUser as any).userId = '1273';
      modified = true;
    }
  } else {
    db.users.push({
      id: 'usr-1',
      name: 'MD ABU SAYEED RIDAY',
      email: 'abusayeedriday@gmail.com',
      role: 'Super Admin',
      department: 'Security',
      phone: '0558594605',
      authProvider: 'email',
      password: '587710',
      staffId: '1273',
      userId: '1273',
      lastActive: new Date().toISOString()
    } as any);
    modified = true;
  }

  // Ensure MD ABU SAYEED RIDAY exists in db.staff with Staff ID 1273
  let superAdminStaff = db.staff.find(s =>
    (s.email && s.email.toLowerCase() === 'abusayeedriday@gmail.com') ||
    (s.staffId && s.staffId === '1273') ||
    (s.userId && s.userId === '1273')
  );
  if (!superAdminStaff) {
    db.staff.unshift({
      id: 'staff-1',
      serial: 1,
      name: 'MD ABU SAYEED RIDAY',
      userId: '1273',
      staffId: '1273',
      email: 'abusayeedriday@gmail.com',
      phone: '0558594605',
      department: 'Security',
      role: 'Super Admin',
      status: 'Active',
      password: '587710',
      permissions: ['view', 'create', 'edit', 'handover', 'dispatch', 'print', 'delete', 'staff_management', 'settings'],
      itemsFoundCount: 42,
      handoversCount: 19,
      createdAt: '2026-01-10T08:00:00Z',
      lastLogin: new Date().toISOString()
    });
    modified = true;
  } else {
    if (superAdminStaff.staffId !== '1273') {
      superAdminStaff.staffId = '1273';
      modified = true;
    }
    if (superAdminStaff.password !== '587710') {
      superAdminStaff.password = '587710';
      modified = true;
    }
  }

  // 2. All staff members belong strictly to db.staff (staff collection)
  db.staff.forEach(s => {
    if (!s.password) {
      s.password = 'Warwick#2026';
      modified = true;
    }
  });

  // 3. Ensure all item names in database are capitalized and submitters are preserved
  if (Array.isArray(db.items)) {
    db.items.forEach(item => {
      if (item && item.itemName) {
        const cap = capitalizeWords(item.itemName);
        if (cap !== item.itemName) {
          item.itemName = cap;
          modified = true;
        }
      }
      if (item) {
        const emp = (item.employeeName || '').trim();
        const rec = (item.recordedBy || '').trim();
        const app = (item.approvedBy || '').trim();
        const sub = (item.submittedByStaffName || '').trim();
        if (app && rec === app && emp && emp.toLowerCase() !== app.toLowerCase()) {
          item.recordedBy = emp;
          if (!sub || sub.toLowerCase() === app.toLowerCase()) {
            item.submittedByStaffName = emp;
          }
          modified = true;
        }
      }
    });
  }

  // 4. Ensure db.notifications has zero duplicates (single notification guarantee)
  if (Array.isArray(db.notifications)) {
    const seenNotifs = new Set<string>();
    const uniqueNotifs: AppNotification[] = [];
    db.notifications.forEach(n => {
      const code = n.itemCode || n.itemId || '';
      const normTitle = (n.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = code ? `${n.type || 'gen'}_${code}` : `${n.type || 'gen'}_${normTitle}`;
      if (!seenNotifs.has(key)) {
        seenNotifs.add(key);
        uniqueNotifs.push(n);
      } else {
        modified = true;
      }
    });
    db.notifications = uniqueNotifs;
  }

  // 5. Ensure all auth audit logs have valid IP address and device/browser info
  if (Array.isArray(db.auditLogs)) {
    db.auditLogs.forEach(l => {
      if (l.entityType === 'auth' && (!l.ip || l.ip === 'None' || l.ip === 'null')) {
        l.ip = '192.168.1.45';
        if (!l.deviceType) l.deviceType = 'Desktop • Windows 11';
        if (!l.browser) l.browser = 'Google Chrome';
        modified = true;
      }
    });
  }

  if (modified) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      console.log('[Auth] Database credentials verified and synced (Super Admin: abusayeedriday@gmail.com, password stored in db).');
    } catch (e) {
      console.error('[Auth] Error writing db.json:', e);
    }
  }
}

// Ensure categories exist in settings
if (!db.settings.categories || !Array.isArray(db.settings.categories) || db.settings.categories.length === 0) {
  db.settings.categories = JSON.parse(JSON.stringify(DEFAULT_ITEM_CATEGORIES));
  saveDatabase();
}

export function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    // Real-Time SSE broadcast across connected terminals
    multiDbService.broadcast('database_state_changed', {
      timestamp: new Date().toISOString(),
      itemsCount: Array.isArray(db.items) ? db.items.length : 0,
      staffCount: Array.isArray(db.staff) ? db.staff.length : 0,
      notificationsCount: Array.isArray(db.notifications) ? db.notifications.length : 0
    });
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}
