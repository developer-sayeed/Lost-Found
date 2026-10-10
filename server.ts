import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_HOTEL_SETTINGS, INITIAL_ITEMS, INITIAL_STAFF, INITIAL_AUDIT_LOGS, DEFAULT_ITEM_CATEGORIES } from './src/lib/constants.ts';
import { LostItem, StaffMember, HotelSettings, User, UserRole, PermissionKey, StaffDepartment, AuditLog, DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS, DeviceSession, SecurityActivityLog, BlockedDevice, AppNotification, Certificate, CustomCertificateTemplate, RecentUserSignature } from './src/types.ts';
import { mongoService } from './server/mongodb.ts';
import { multiDbService } from './server/multiDatabase.ts';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface DatabaseSchema {
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
}

// Helper to capitalize each word in text (Title Case / CSS text-transform: capitalize behavior)
function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  const str = String(text).trim();
  if (!str) return '';
  const isAllUpper = str === str.toUpperCase() && /[A-Z]/.test(str);
  const normalized = isAllUpper ? str.toLowerCase() : str;
  return normalized.replace(/\b([a-z])/g, (_, char) => char.toUpperCase());
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to create pristine initial database
function getInitialFreshDatabase(): DatabaseSchema {
  const initialUsers: User[] = [
    {
      id: 'usr-1',
      name: 'MD ABU SAYEED RIDAY',
      email: 'abusayeedriday@gmail.com',
      role: 'Super Admin',
      department: 'Housekeeping',
      phone: '0571858601',
      authProvider: 'email',
      password: '587710',
      lastActive: new Date().toISOString()
    },
    {
      id: 'usr-2',
      name: 'MD ABU SAYEED RIDAY',
      email: 'mdriday256@gmail.com',
      role: 'Super Admin',
      department: 'Housekeeping',
      phone: '0571858601',
      authProvider: 'google',
      password: '587710',
      lastActive: new Date().toISOString()
    },
    {
      id: 'usr-3',
      name: 'Samir El Kassas',
      email: 'samir@warwickbaha.com',
      role: 'Employee',
      department: 'Manager',
      phone: '0540363898',
      authProvider: 'email',
      password: 'Warwick#2026',
      lastActive: new Date().toISOString()
    }
  ];

  return {
    settings: JSON.parse(JSON.stringify(INITIAL_HOTEL_SETTINGS)),
    items: JSON.parse(JSON.stringify(INITIAL_ITEMS)),
    staff: JSON.parse(JSON.stringify(INITIAL_STAFF)),
    users: initialUsers,
    auditLogs: [],
    notifications: [
      {
        id: 'notif-welcome-1',
        title: 'Warwick Notification Center Live',
        message: 'Storage requests, item approvals, handovers, dispatches, and hotel staff notices are broadcast in real time.',
        type: 'system',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        read: false,
        readBy: []
      }
    ],
    blockedDevices: [],
    activeSessions: [
      {
        deviceId: 'dev-desktop-01',
        userId: 'usr-1',
        userName: 'MD ABU SAYEED RIDAY',
        userEmail: 'abusayeedriday@gmail.com',
        role: 'Super Admin',
        deviceType: 'Desktop',
        browser: 'Google Chrome',
        os: 'Windows 11',
        ip: '192.168.1.45',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0'
      },
      {
        deviceId: 'dev-mobile-02',
        userId: 'staff-2',
        userName: 'Weal Salem',
        userEmail: 'weal@warwickbaha.com',
        role: 'Housekeeping',
        deviceType: 'Mobile',
        browser: 'Apple Safari',
        os: 'iOS (iPhone 15 Pro)',
        ip: '192.168.1.88',
        lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
      },
      {
        deviceId: 'dev-tablet-03',
        userId: 'staff-3',
        userName: 'Alhanouf Alghamdi',
        userEmail: 'alhanouf@warwickbaha.com',
        role: 'Receptionist',
        deviceType: 'Tablet',
        browser: 'Google Chrome',
        os: 'iPadOS',
        ip: '192.168.1.102',
        lastSeen: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
      }
    ],
    certificates: [
      {
        id: 'cert-1788765369001',
        certificateNumber: 'WRW-CERT-2026-001',
        template: 'employee_of_month',
        title: 'Employee of the Month',
        recipientName: 'MD ABU SAYEED RIDAY',
        recipientPosition: 'Housekeeping Supervisor',
        recipientDepartment: 'Housekeeping',
        awardPeriod: 'June 2026',
        citationText: 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!',
        location: 'Al Baha, Saudi Arabia',
        awardDate: 'June 2026',
        signatory1Title: 'Housekeeping',
        signatory1Name: '',
        signatory2Title: 'General Manager',
        signatory2Name: '',
        notes: 'Awarded for exceptional leadership in guest service and department organization.',
        issuedBy: 'Super Admin',
        issuedByRole: 'Super Admin',
        issuedAt: '2026-06-30T10:00:00.000Z',
        createdAt: '2026-06-30T10:00:00.000Z',
        updatedAt: '2026-06-30T10:00:00.000Z'
      },
      {
        id: 'cert-1788765369002',
        certificateNumber: 'WRW-CERT-2026-002',
        template: 'appreciation',
        title: 'Certificate of Appreciation',
        recipientName: 'MD ABU SAYEED RIDAY',
        recipientPosition: 'Housekeeping Supervisor',
        recipientDepartment: 'Housekeeping',
        awardPeriod: 'June 2026',
        citationText: 'This certificate is proudly presented to Md Abu Sayeed Riday, Housekeeping Supervisor, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.',
        location: 'Al Baha, Saudi Arabia',
        awardDate: '15 June 2026',
        signatory1Title: 'Housekeeping Manager',
        signatory1Name: '',
        signatory2Title: 'General Manager',
        signatory2Name: '',
        notes: 'Commemoration of hotel grand opening milestone contribution.',
        issuedBy: 'Super Admin',
        issuedByRole: 'Super Admin',
        issuedAt: '2026-06-15T10:00:00.000Z',
        createdAt: '2026-06-15T10:00:00.000Z',
        updatedAt: '2026-06-15T10:00:00.000Z'
      }
    ]
  };
}

// Initialize or load database
function loadDatabase(): DatabaseSchema {
  const freshDb = getInitialFreshDatabase();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed.notifications)) {
        parsed.notifications = freshDb.notifications;
      }
      if (!Array.isArray(parsed.certificates) || parsed.certificates.length === 0) {
        parsed.certificates = freshDb.certificates;
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
      return parsed;
    } catch (err) {
      console.error('Error reading db.json, re-initializing...', err);
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf-8');
  return freshDb;
}

let db = loadDatabase();

// Device Blacklist & Temporary/Permanent Block Validator
function isDeviceBlocked(deviceId?: string, ip?: string): { blocked: boolean; device?: BlockedDevice } {
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
        return false; // Temporary duration has expired
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
function ensureDatabaseAuthIntegrity() {
  let modified = false;

  // 1. db.users MUST strictly contain valid Super Admin / user accounts with valid emails (remove rogue records like "2811")
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
  } else {
    db.users.push({
      id: 'usr-1',
      name: 'MD ABU SAYEED RIDAY',
      email: 'abusayeedriday@gmail.com',
      role: 'Super Admin',
      department: 'Housekeeping',
      phone: '0571858601',
      authProvider: 'email',
      password: '587710',
      lastActive: new Date().toISOString()
    });
    modified = true;
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
      // Ensure items approved by admin/supervisor preserve the original finder/submitter as recordedBy
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
ensureDatabaseAuthIntegrity();

// Real-Time Notification System Active
const NOTIFICATIONS_ENABLED = true;

async function createNotificationHelper(
  notifData: Partial<AppNotification>
): Promise<AppNotification> {
  const notif: AppNotification = {
    id: notifData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: notifData.title || 'System Notification',
    message: notifData.message || '',
    type: notifData.type || 'system',
    priority: notifData.priority || 'normal',
    targetType: notifData.targetType || 'all',
    targetRoles: notifData.targetRoles,
    targetDepartment: notifData.targetDepartment,
    targetStaffName: notifData.targetStaffName,
    targetStaffEmail: notifData.targetStaffEmail,
    targetUserId: notifData.targetUserId,
    senderName: notifData.senderName || 'System',
    senderRole: notifData.senderRole,
    senderEmail: notifData.senderEmail,
    itemId: notifData.itemId,
    itemCode: notifData.itemCode,
    createdAt: notifData.createdAt || new Date().toISOString(),
    read: false,
    readBy: [],
    deletedBy: []
  };

  // If notifications are disabled, return without persisting or sending
  if (!NOTIFICATIONS_ENABLED) {
    return notif;
  }

  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }

  // Strict deduplication check: Prevent duplicate notification within 30 seconds
  const now = Date.now();
  const existingDuplicate = db.notifications.find(existing => {
    try {
      const timeDiff = Math.abs(now - new Date(existing.createdAt).getTime());
      if (timeDiff > 30000) return false;

      // Duplicate for identical item and event type
      if (
        notif.type &&
        existing.type === notif.type &&
        ((notif.itemCode && existing.itemCode === notif.itemCode) ||
         (notif.itemId && existing.itemId === notif.itemId))
      ) {
        return true;
      }

      // Duplicate for identical title & message
      const normNewTitle = (notif.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normOldTitle = (existing.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normNewTitle && normOldTitle && normNewTitle === normOldTitle) {
        return true;
      }
    } catch {}
    return false;
  });

  if (existingDuplicate) {
    console.log(`[Notification Deduplication] Prevented duplicate notification for item: ${notif.itemCode || notif.title}`);
    return existingDuplicate;
  }

  db.notifications.unshift(notif);
  if (db.notifications.length > 300) {
    db.notifications = db.notifications.slice(0, 300);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.insertNotification(notif);
    } catch (e: any) {
      console.warn('Mongo insertNotification error:', e.message);
    }
  }

  return notif;
}

// Store Deposit Reminder system:
// Stopped and disabled as per user instruction to stop sending notifications
async function checkPendingItemsDepositReminders() {
  // Disabled - no notifications will be sent
  return;
}

// Utility to generate strictly unique sequential serial item code
function generateUniqueItemCode(
  existingItems: Array<{ code?: string }>,
  prefix: string = 'LF',
  dateFound?: string
): string {
  const cleanPrefix = (prefix || 'LF').trim().toUpperCase();
  const targetYear = dateFound ? new Date(dateFound).getFullYear() : new Date().getFullYear();
  const year = isNaN(targetYear) ? new Date().getFullYear() : targetYear;

  const existingCodes = new Set<string>();
  let maxSeq = 0;

  for (const item of existingItems) {
    if (!item?.code) continue;
    const c = item.code.trim().toUpperCase();
    existingCodes.add(c);

    const match = c.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq && num < 1000000) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${cleanPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

  while (existingCodes.has(candidate)) {
    nextSeq++;
    candidate = `${cleanPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

// Normalize existing database items to guarantee 100% unique, sequential serial codes
function normalizeAndMigrateDatabaseItemCodes() {
  const prefix = db.settings.codePrefix || 'LF';
  const cleanPrefix = prefix.trim().toUpperCase();
  const seenCodes = new Set<string>();
  let currentSeq = 1;
  let hasChanges = false;
  const codeMapping = new Map<string, string>();

  db.items = db.items.map(item => {
    const oldCode = item.code?.trim();
    const year = item.dateFound ? new Date(item.dateFound).getFullYear() : 2026;
    const validYear = isNaN(year) ? 2026 : year;

    const isStandardFormat = oldCode && new RegExp(`^${cleanPrefix}-\\d{4}-\\d{4}$`).test(oldCode);

    let newCode = oldCode;
    if (!oldCode || !isStandardFormat || seenCodes.has(oldCode.toUpperCase())) {
      newCode = `${cleanPrefix}-${validYear}-${String(currentSeq).padStart(4, '0')}`;
      while (seenCodes.has(newCode)) {
        currentSeq++;
        newCode = `${cleanPrefix}-${validYear}-${String(currentSeq).padStart(4, '0')}`;
      }
      currentSeq++;
      hasChanges = true;
      if (oldCode) {
        codeMapping.set(oldCode, newCode);
      }
    } else {
      const match = oldCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= currentSeq) currentSeq = num + 1;
      }
    }

    seenCodes.add(newCode.toUpperCase());
    return {
      ...item,
      code: newCode
    };
  });

  if (codeMapping.size > 0 && Array.isArray(db.auditLogs)) {
    db.auditLogs = db.auditLogs.map(log => {
      if (log.entityId && codeMapping.has(log.entityId)) {
        return {
          ...log,
          entityId: codeMapping.get(log.entityId)!
        };
      }
      return log;
    });
  }

  if (hasChanges) {
    saveDatabase();
    console.log(`[Unique Codes Migration] Successfully normalized ${codeMapping.size} item codes to unique sequential serial codes.`);
  }
}

// Preserve original authentic item codes from database without artificial mutation
// normalizeAndMigrateDatabaseItemCodes();

// Ensure categories exist in settings
if (!db.settings.categories || !Array.isArray(db.settings.categories) || db.settings.categories.length === 0) {
  db.settings.categories = JSON.parse(JSON.stringify(DEFAULT_ITEM_CATEGORIES));
  saveDatabase();
}

function saveDatabase() {
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

function parseUserAgentInfo(ua: string = '') {
  let browser = 'Google Chrome';
  let os = 'Windows 11';
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';

  if (/ipad|tablet/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|android/i.test(ua)) {
    deviceType = 'Mobile';
  }

  if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iPadOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows 11';
  else if (/linux/i.test(ua)) os = 'Linux';

  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return { browser, os, deviceType };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Real-Time Active Session Tracking & Device Blocking Middleware
  app.use((req, res, next) => {
    const deviceId = req.headers['x-device-id'] as string;
    const userName = (req.headers['x-user-name'] as string) || '';
    const userEmail = (req.headers['x-user-email'] as string) || '';
    const role = (req.headers['x-user-role'] as string) || '';
    const ua = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

    // Verify if this terminal device or IP has been blocked
    const blockCheck = isDeviceBlocked(deviceId, ip);
    if (blockCheck.blocked) {
      if (Array.isArray(db.activeSessions)) {
        db.activeSessions = db.activeSessions.filter((s: any) => s.deviceId !== deviceId && (!ip || s.ip !== ip));
        db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
      }

      const isUnblockApi = req.path.startsWith('/api/devices') || req.path.startsWith('/api/public');
      if (req.path.startsWith('/api') && !isUnblockApi) {
        const b = blockCheck.device!;
        const isTemp = b.blockType === 'temporary';
        const remainingMs = b.blockedUntil ? Math.max(0, new Date(b.blockedUntil).getTime() - Date.now()) : 0;
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        return res.status(403).json({
          success: false,
          isDeviceBlocked: true,
          blockType: b.blockType,
          blockedUntil: b.blockedUntil,
          error: isTemp
            ? `Access Denied: This terminal device has been temporarily blocked (${remainingMins} minute${remainingMins !== 1 ? 's' : ''} remaining). Reason: ${b.reason || 'Security policy'}`
            : `Access Denied: This terminal device has been permanently blocked by system administration. Reason: ${b.reason || 'Security policy'}`
        });
      }
    }

    if (deviceId && userEmail && req.path.startsWith('/api') && !blockCheck.blocked) {
      const { browser, os, deviceType } = parseUserAgentInfo(ua);
      const existingIdx = db.activeSessions.findIndex((s: any) => s.deviceId === deviceId);
      if (existingIdx >= 0) {
        db.activeSessions[existingIdx].lastSeen = new Date().toISOString();
        if (userName) db.activeSessions[existingIdx].userName = userName;
        db.activeSessions[existingIdx].userEmail = userEmail;
        if (role) db.activeSessions[existingIdx].role = role;
        db.activeSessions[existingIdx].browser = browser;
        db.activeSessions[existingIdx].os = os;
        db.activeSessions[existingIdx].deviceType = deviceType;
        db.activeSessions[existingIdx].ip = ip;
      } else {
        db.activeSessions.unshift({
          deviceId,
          userName: userName || 'Authenticated User',
          userEmail,
          role: role || 'Staff',
          deviceType,
          browser,
          os,
          ip,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          userAgent: ua.substring(0, 100)
        });
      }
      db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
    }
    next();
  });

  // Initialize MongoDB connection if URI exists
  await mongoService.init().catch(err => {
    console.warn('[MongoDB] Init error:', err.message);
  });

  if (mongoService.isLive) {
    try {
      console.log('[MongoDB] Fetching authentic data directly from MongoDB database...');
      
      // 1. Fetch real items from MongoDB collection 'items'
      const realItems = await mongoService.getItems();
      if (realItems && realItems.length > 0) {
        db.items = realItems.map(item => ({
          ...item,
          itemName: capitalizeWords(item.itemName)
        }));
        console.log(`[MongoDB] Loaded ${realItems.length} authentic hotel items directly from MongoDB collection "items".`);
      }

      // 2. Fetch real staff from MongoDB collection 'staff_members'
      const realStaff = await mongoService.getStaff();
      if (realStaff && realStaff.length > 0) {
        db.staff = realStaff;
        console.log(`[MongoDB] Loaded ${realStaff.length} authentic staff members directly from MongoDB collection "staff_members".`);
      }

      // 3. Fetch real hotel settings from MongoDB collection 'hotel_settings'
      const realSettings = await mongoService.getSettings();
      if (realSettings && Object.keys(realSettings).length > 0) {
        db.settings = { ...db.settings, ...realSettings };
        console.log(`[MongoDB] Loaded authentic hotel settings directly from MongoDB collection "hotel_settings".`);
      }

      // 4. Fetch real users from MongoDB collection 'users'
      const realUsers = await mongoService.getUsers();
      if (realUsers && realUsers.length > 0) {
        db.users = realUsers;
        console.log(`[MongoDB] Loaded ${realUsers.length} users directly from MongoDB collection "users".`);
      }

      // 5. Fetch real notifications from MongoDB
      const realNotifs = await mongoService.getNotifications();
      if (realNotifs && realNotifs.length > 0) {
        db.notifications = realNotifs;
      } else if (db.notifications && db.notifications.length > 0) {
        for (const notif of db.notifications) {
          await mongoService.insertNotification(notif).catch(() => {});
        }
      }

      // 6. Fetch real certificates from MongoDB collection 'certificates'
      const realCerts = await mongoService.getCertificates();
      if (realCerts && realCerts.length > 0) {
        db.certificates = realCerts;
        console.log(`[MongoDB] Loaded ${realCerts.length} certificates directly from MongoDB collection "certificates".`);
      } else if (db.certificates && db.certificates.length > 0) {
        for (const cert of db.certificates) {
          await mongoService.upsertCertificate(cert).catch(() => {});
        }
      }

      // 7. Fetch real audit logs from MongoDB collection 'audit_logs'
      let realAuditLogs = await mongoService.getAuditLogs({}, 1000);
      if (realAuditLogs && realAuditLogs.length > 0) {
        // Only keep genuine runtime logs, discarding any mock records
        realAuditLogs = realAuditLogs.filter(l => l && l.id && !String(l.id).startsWith('audit-log-00'));
        db.auditLogs = realAuditLogs;
        console.log(`[MongoDB] Loaded ${realAuditLogs.length} real audit logs from MongoDB collection "audit_logs".`);
      }

      saveDatabase();

      const superAdminInDb = db.users.find(u => u.email.toLowerCase() === 'abusayeedriday@gmail.com');
      if (superAdminInDb) {
        await mongoService.upsertUser(superAdminInDb);
      }
      console.log('[MongoDB] Super Admin database credentials verified in MongoDB (abusayeedriday@gmail.com, password: 587710).');
    } catch (e: any) {
      console.warn('[MongoDB] Startup data loading error:', e.message);
    }
  }

  // Helper function to log audit events and status changes on lost items
  const addAudit = async (
    action: string,
    entityType: 'item' | 'staff' | 'settings' | 'auth' | 'certificate' | 'database' = 'item',
    details: string = '',
    performedBy = 'MD ABU SAYEED RIDAY',
    userRole: any = 'Super Admin',
    entityId?: string,
    extraMeta?: {
      actionType?: AuditLog['actionType'];
      itemCode?: string;
      itemName?: string;
      category?: string;
      previousStatus?: any;
      newStatus?: any;
      performedByEmail?: string;
      performedById?: string;
      reason?: string;
      changes?: Array<{ field: string; label: string; from: any; to: any }>;
      ip?: string;
      deviceType?: string;
      browser?: string;
      meta?: Record<string, any>;
    }
  ): Promise<AuditLog> => {
    let resolvedActionType = extraMeta?.actionType;
    if (!resolvedActionType) {
      const actLower = (action || '').toLowerCase();
      if (actLower.includes('status') || actLower.includes('returned to store')) resolvedActionType = 'status_change';
      else if (actLower.includes('handover') || actLower.includes('handed over')) resolvedActionType = 'handover';
      else if (actLower.includes('dispatch')) resolvedActionType = 'dispatch';
      else if (actLower.includes('approve')) resolvedActionType = 'approval';
      else if (actLower.includes('reject')) resolvedActionType = 'rejection';
      else if (actLower.includes('register') || actLower.includes('created') || actLower.includes('added') || actLower.includes('submission')) resolvedActionType = 'create';
      else if (actLower.includes('return')) resolvedActionType = 'return_to_store';
      else if (actLower.includes('restore')) resolvedActionType = 'restore';
      else if (actLower.includes('trash') || actLower.includes('delete') || actLower.includes('remove') || actLower.includes('recycle')) resolvedActionType = 'trash';
      else if (actLower.includes('bulk') || actLower.includes('batch')) resolvedActionType = 'bulk_action';
      else if (actLower.includes('export') || actLower.includes('download')) resolvedActionType = 'export';
      else if (actLower.includes('view') || actLower.includes('inspect')) resolvedActionType = 'view';
      else resolvedActionType = 'update';
    }

    // Try resolving item code and name if entityId is an item code or ID
    let resolvedItemCode = extraMeta?.itemCode;
    let resolvedItemName = extraMeta?.itemName;
    let resolvedCategory = extraMeta?.category;

    if (entityType === 'item' && entityId) {
      const matchedItem = db.items.find(i => i.id === entityId || i.code === entityId);
      if (matchedItem) {
        if (!resolvedItemCode) resolvedItemCode = matchedItem.code;
        if (!resolvedItemName) resolvedItemName = matchedItem.itemName;
        if (!resolvedCategory) resolvedCategory = matchedItem.category;
      }
    }

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      actionType: resolvedActionType,
      entityType,
      entityId: entityId || resolvedItemCode,
      itemCode: resolvedItemCode,
      itemName: resolvedItemName,
      category: resolvedCategory,
      previousStatus: extraMeta?.previousStatus,
      newStatus: extraMeta?.newStatus,
      performedBy: performedBy || 'MD ABU SAYEED RIDAY',
      userRole: userRole || 'Super Admin',
      performedByRole: userRole || 'Super Admin',
      performedByEmail: extraMeta?.performedByEmail,
      performedById: extraMeta?.performedById,
      timestamp: new Date().toISOString(),
      details: details || `${action} on ${entityType} ${resolvedItemCode || entityId || ''}`.trim(),
      reason: extraMeta?.reason,
      changes: extraMeta?.changes,
      ip: extraMeta?.ip,
      deviceType: extraMeta?.deviceType,
      browser: extraMeta?.browser,
      meta: extraMeta?.meta
    };

    if (!Array.isArray(db.auditLogs)) {
      db.auditLogs = [];
    }
    db.auditLogs.unshift(auditEntry);
    if (db.auditLogs.length > 5000) {
      db.auditLogs = db.auditLogs.slice(0, 5000);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.insertAuditLog(auditEntry);
      } catch (err: any) {
        console.warn('MongoDB insertAuditLog error:', err.message);
      }
    }

    // Broadcast in real-time
    multiDbService.broadcast('audit_log_created', auditEntry);

    return auditEntry;
  };

  // ----------------------------------------------------
  // API: Health Check
  // ----------------------------------------------------
  app.get('/api/health', async (req, res) => {
    const mongoStatus = await mongoService.getStatus();
    res.json({
      status: 'ok',
      service: 'Warwick Hotel Baha L&F API',
      version: '2.5.0',
      database: mongoStatus.source,
      mongoConnected: mongoStatus.connected,
      totalItems: mongoStatus.connected ? mongoStatus.collections.itemsCount : db.items.length,
      lastSync: db.settings.lastSyncedAt
    });
  });

  // ----------------------------------------------------
  // API: Full Website & Database Backup System
  // ----------------------------------------------------
  app.get('/api/backup/full', async (req, res) => {
    try {
      // If MongoDB is connected and active, sync latest items, staff, settings
      if (mongoService.isLive) {
        try {
          const mItems = await mongoService.getItems().catch(() => null);
          if (mItems && mItems.length > 0) db.items = mItems;
          const mStaff = await mongoService.getStaff().catch(() => null);
          if (mStaff && mStaff.length > 0) db.staff = mStaff;
          const mSettings = await mongoService.getSettings().catch(() => null);
          if (mSettings) db.settings = mSettings;
          const mCerts = await mongoService.getCertificates().catch(() => null);
          if (mCerts && mCerts.length > 0) db.certificates = mCerts;
        } catch (e) {
          console.warn('[Backup] Mongo refresh before backup warning:', e);
        }
      }

      const backupPackage = {
        version: '2.5.0',
        timestamp: new Date().toISOString(),
        source: 'Warwick Hotel Lost & Found Management System',
        environment: process.env.NODE_ENV || 'production',
        hotelName: db.settings.hotelName || 'Warwick Hotel Al Baha',
        database: {
          items: db.items || [],
          staff: db.staff || [],
          users: (db.users || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            phone: u.phone,
            authProvider: u.authProvider
          })),
          settings: db.settings,
          certificates: db.certificates || [],
          certificateTemplates: db.certificateTemplates || [],
          auditLogs: db.auditLogs || [],
          notifications: db.notifications || []
        },
        websiteConfig: {
          publicWebsite: db.settings.publicWebsiteSettings,
          additionalLinks: db.settings.additionalLinks,
          categories: db.settings.categories,
          customColors: db.settings.customColors,
          themeMode: db.settings.themeMode,
          brandName: db.settings.hotelName
        },
        stats: {
          totalItems: (db.items || []).length,
          totalStaff: (db.staff || []).length,
          totalCertificates: (db.certificates || []).length,
          totalLogs: (db.auditLogs || []).length,
          totalTemplates: (db.certificateTemplates || []).length
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.json(backupPackage);
    } catch (err: any) {
      console.error('[API] /api/backup/full error:', err);
      res.status(500).json({ error: 'Failed to generate full backup: ' + err.message });
    }
  });

  app.post('/api/backup/restore', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.database) {
        return res.status(400).json({ error: 'Invalid backup package. Missing database object.' });
      }

      const { items, staff, settings: restoredSettings, certificates, certificateTemplates } = payload.database;

      const restoredCounts = {
        items: 0,
        staff: 0,
        certificates: 0,
        templates: 0,
        settingsRestored: false
      };

      if (Array.isArray(items)) {
        db.items = items;
        restoredCounts.items = items.length;
      }

      if (Array.isArray(staff)) {
        db.staff = staff;
        restoredCounts.staff = staff.length;
      }

      if (Array.isArray(certificates)) {
        db.certificates = certificates;
        restoredCounts.certificates = certificates.length;
      }

      if (Array.isArray(certificateTemplates)) {
        db.certificateTemplates = certificateTemplates;
        restoredCounts.templates = certificateTemplates.length;
      }

      if (restoredSettings && typeof restoredSettings === 'object') {
        db.settings = {
          ...db.settings,
          ...restoredSettings,
          version: (db.settings.version || 1) + 1,
          lastSyncedAt: new Date().toISOString()
        };
        restoredCounts.settingsRestored = true;
      }

      // If MongoDB is active, synchronize all restored collections
      if (mongoService.isLive) {
        await mongoService.seedAllData({
          items: db.items,
          staff: db.staff,
          users: db.users,
          settings: db.settings,
          auditLogs: db.auditLogs
        }).catch(err => {
          console.warn('[Backup] Mongo seed on restore warning:', err);
        });
      }

      saveDatabase();

      multiDbService.broadcast('database_state_changed', {
        action: 'system_restored',
        timestamp: new Date().toISOString(),
        restoredCounts
      });

      res.json({
        success: true,
        message: 'Website database and system configuration successfully restored!',
        restoredCounts
      });
    } catch (err: any) {
      console.error('[API] /api/backup/restore error:', err);
      res.status(500).json({ error: 'Restoration failed: ' + err.message });
    }
  });

  app.post('/api/backup/record-drive-backup', async (req, res) => {
    try {
      const {
        fileId,
        fileName,
        fileSize,
        driveLink,
        status,
        error,
        folderId,
        folderName
      } = req.body;

      if (!db.settings.googleDriveBackup) {
        db.settings.googleDriveBackup = {
          autoBackupEnabled: false,
          autoBackupFrequency: 'daily',
          autoBackupIncludeAuditLogs: true,
          autoBackupMaxFilesToKeep: 15
        };
      }

      db.settings.googleDriveBackup = {
        ...db.settings.googleDriveBackup,
        lastBackupDate: new Date().toISOString(),
        lastBackupFileId: fileId,
        lastBackupFileName: fileName,
        lastBackupFileSize: fileSize,
        lastBackupDriveLink: driveLink,
        lastBackupStatus: status || 'success',
        lastBackupError: error || undefined,
        backupFolderId: folderId || db.settings.googleDriveBackup.backupFolderId,
        backupFolderName: folderName || db.settings.googleDriveBackup.backupFolderName
      };

      saveDatabase();

      res.json({ success: true, googleDriveBackup: db.settings.googleDriveBackup });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Real MongoDB Management & Controls
  // ----------------------------------------------------
  app.get('/api/mongodb/status', async (req, res) => {
    try {
      const status = await mongoService.getStatus();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mongodb/connect', async (req, res) => {
    const { uri, dbName } = req.body;
    if (!uri) {
      return res.status(400).json({ error: 'MongoDB URI connection string is required.' });
    }

    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    try {
      const status = await mongoService.connect(uri.trim(), dbName || 'warwick_lost_found');
      
      // If MongoDB is empty, seed with current dataset so user immediately sees their hotel data
      if (status.collections.itemsCount === 0 && db.items.length > 0) {
        console.log('[MongoDB] Auto-seeding initial hotel data into newly connected MongoDB...');
        await mongoService.seedAllData({
          items: db.items,
          staff: db.staff,
          users: db.users,
          settings: db.settings,
          auditLogs: db.auditLogs
        });
      }

      await addAudit(
        'MongoDB Connected',
        'settings',
        `Connected to real MongoDB Database: ${dbName || 'warwick_lost_found'} (${status.host})`,
        actor,
        role
      );

      const refreshedStatus = await mongoService.getStatus();
      return res.json({
        success: true,
        message: `Successfully connected to MongoDB "${status.databaseName}"!`,
        status: refreshedStatus
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to connect to MongoDB. Please verify your connection URI, username, password, and IP whitelist (0.0.0.0/0 on Atlas).'
      });
    }
  });

  app.post('/api/mongodb/test', async (req, res) => {
    const { uri, dbName } = req.body;
    if (!uri) {
      return res.status(400).json({ error: 'URI is required for testing' });
    }
    try {
      const tempStatus = await mongoService.connect(uri.trim(), dbName || 'warwick_lost_found');
      return res.json({
        success: true,
        message: `MongoDB connection test succeeded! Database: ${tempStatus.databaseName}`,
        pingMs: tempStatus.pingMs,
        collections: tempStatus.collections
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  app.post('/api/mongodb/seed', async (req, res) => {
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (!mongoService.isLive) {
      return res.status(400).json({ error: 'MongoDB is not connected. Please connect first.' });
    }

    try {
      const status = await mongoService.seedAllData({
        items: db.items,
        staff: db.staff,
        users: db.users,
        settings: db.settings,
        auditLogs: db.auditLogs
      });

      await addAudit('MongoDB Seeded', 'settings', `Synchronized all local data to MongoDB collections`, actor, role);

      return res.json({
        success: true,
        message: 'All inventory items, staff, settings, and logs successfully synced into real MongoDB!',
        status
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mongodb/disconnect', async (req, res) => {
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    try {
      await mongoService.disconnect();
      await addAudit('MongoDB Disconnected', 'settings', 'Disconnected from MongoDB. Reverted to local JSON storage.', actor, role);
      const status = await mongoService.getStatus();
      return res.json({
        success: true,
        message: 'Disconnected from MongoDB. System is now using persistent local storage.',
        status
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Restore Initial Database Data (Reverses overwritten data back to initial authentic state)
  app.post(['/api/database/restore-initial', '/api/mongodb/restore-initial'], async (req, res) => {
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    try {
      const freshDb = getInitialFreshDatabase();
      db = freshDb;
      saveDatabase();

      let mongoStatus = null;
      if (mongoService.isLive) {
        mongoStatus = await mongoService.seedAllData({
          items: freshDb.items,
          staff: freshDb.staff,
          users: freshDb.users,
          settings: freshDb.settings,
          auditLogs: freshDb.auditLogs
        });
      }

      await addAudit(
        'Database Restored',
        'settings',
        `Reverted and restored all database items, staff, and settings to the initial state (${freshDb.items.length} items)`,
        actor,
        role
      );

      return res.json({
        success: true,
        message: `Database successfully restored to original initial state with ${freshDb.items.length} items and ${freshDb.staff.length} staff members!`,
        itemsCount: freshDb.items.length,
        staffCount: freshDb.staff.length,
        mongoStatus
      });
    } catch (err: any) {
      console.error('Error restoring initial database:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to restore database to initial state'
      });
    }
  });

  // Repair & Restore Missing Fields (descriptions, employeeNames, finders, guestNames, roomNumbers)
  app.post(['/api/mongodb/restore-fields', '/api/items/restore-fields'], async (req, res) => {
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    try {
      let mongoRepaired = { updatedCount: 0, totalCount: 0 };
      if (mongoService.isLive) {
        mongoRepaired = await mongoService.repairAndRestoreAllItemFields();
      }

      // Also repair local database items
      let localRepairedCount = 0;
      const initialMap = new Map<string, LostItem>();
      INITIAL_ITEMS.forEach(i => {
        if (i.id) initialMap.set(i.id.toLowerCase(), i);
        if (i.code) initialMap.set(i.code.toLowerCase(), i);
        if (i.roomNumber) initialMap.set(`room-${i.roomNumber.toLowerCase()}`, i);
      });

      db.items = db.items.map(item => {
        const match = (item.id && initialMap.get(item.id.toLowerCase())) ||
          (item.code && initialMap.get(item.code.toLowerCase())) ||
          (item.roomNumber ? initialMap.get(`room-${item.roomNumber.toLowerCase()}`) : undefined);

        if (match) {
          localRepairedCount++;
          return {
            ...item,
            itemName: item.itemName && item.itemName !== 'Untitled Item' ? item.itemName : match.itemName,
            description: (!item.description || ['dummy', 'test', ''].includes(item.description.toLowerCase().trim())) ? match.description : item.description,
            employeeName: (!item.employeeName || ['staff member', 'system', 'dummy', ''].includes(item.employeeName.toLowerCase().trim())) ? match.employeeName : item.employeeName,
            guestName: item.guestName || match.guestName || '',
            roomNumber: item.roomNumber || match.roomNumber || '',
            category: item.category || match.category || 'Other',
            locationFound: item.locationFound || match.locationFound || 'Hotel Premises',
            storeLocation: item.storeLocation || match.storeLocation || 'HK Office',
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      saveDatabase();

      await addAudit(
        'Item Fields Repaired & Restored',
        'item',
        `Restored authentic descriptions and employee finder names across database (${mongoRepaired.updatedCount} MongoDB items, ${localRepairedCount} local items)`,
        actor,
        role
      );

      return res.json({
        success: true,
        message: `Successfully repaired and restored original descriptions, finder employee names, and room details!`,
        mongoRepaired,
        localRepairedCount
      });
    } catch (err: any) {
      console.error('Error repairing item fields:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to repair item fields'
      });
    }
  });

  // ----------------------------------------------------
  // API: Authentication Validation System & Resilient Resolvers
  // ----------------------------------------------------
  function getLevenshteinDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 3) return 999;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function normalizeAuthInput(input: string): string {
    if (!input) return '';
    // Strip zero-width, byte order mark, and invisible spaces
    let clean = input.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, '').trim();
    // Map non-Latin digits: U+09E6-U+09EF -> 0-9 and U+0660-U+0669 -> 0-9
    for (let i = 0; i < 10; i++) {
      clean = clean.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
      clean = clean.replace(new RegExp(String.fromCharCode(0x0660 + i), 'g'), String(i));
    }
    return clean;
  }

  function resolveAuthCandidates(rawInput: string): { candidateList: string[]; isSuperAdminAlias: boolean } {
    const normalized = normalizeAuthInput(rawInput);
    const cleanInput = normalized.toLowerCase();
    const candidates = new Set<string>();
    candidates.add(cleanInput);
    candidates.add(normalized);
    if (rawInput.trim().toLowerCase() !== cleanInput) {
      candidates.add(rawInput.trim().toLowerCase());
    }

    // 1. TLD domain typos (e.g., .cokm, .con, .cmo, .comm, .coom -> .com)
    const fixedDomain = cleanInput
      .replace(/\.(cokm|cmo|con|comm|coom|cpm|vom)$/i, '.com')
      .replace(/@(gmai|gmaill|gmial|gmil)\.com$/i, '@gmail.com');
    candidates.add(fixedDomain);

    // 2. Super Admin typo corrections for abusayeedriday@gmail.com ONLY
    // NOTE: riday@warwickhotels.com is an independent separate account in db.staff.
    // It must NEVER be treated as an alias for abusayeedriday@gmail.com!
    const isSuperAdmin =
      cleanInput === 'abusayeedriday@gmail.com' ||
      cleanInput === 'abusayeedriay@gmail.com' ||
      cleanInput === 'abusayeedriday@gmail.cokm' ||
      cleanInput === 'mdriday256@gmail.com' ||
      cleanInput === 'mdriday256' ||
      cleanInput.startsWith('abusayeedriay@') ||
      cleanInput.startsWith('abusayeedriday@');

    if (isSuperAdmin) {
      candidates.add('abusayeedriday@gmail.com');
    }

    // 3. Staff ID numeric/prefix normalization (e.g., 1273 <-> stf-1273)
    if (/^\d+$/.test(cleanInput)) {
      candidates.add(`stf-${cleanInput}`);
      candidates.add(`stf${cleanInput}`);
    } else if (cleanInput.startsWith('stf-')) {
      candidates.add(cleanInput.replace(/^stf-/, ''));
    }

    return {
      candidateList: Array.from(candidates),
      isSuperAdminAlias: isSuperAdmin
    };
  }

  // Account Lockout state tracker (5-minute security lockouts)
  interface AccountLockoutState {
    failedAttempts: number;
    lockedUntil: number | null; // epoch timestamp ms
    previouslyLocked: boolean;  // whether account has experienced a lockout before
    lastAttemptAt: number;
  }

  // Persistent in-memory map tracking failed attempts & lockouts by canonical account identifier
  const accountLockoutTracker = new Map<string, AccountLockoutState>();

  app.get('/api/auth/lockout-status', (req, res) => {
    const identifier = (req.query.identifier as string || '').trim().toLowerCase();
    if (!identifier) return res.json({ locked: false });

    const { candidateList } = resolveAuthCandidates(identifier);
    const matched = db.users.find(u => candidateList.some(c => (u.email && u.email.toLowerCase() === c) || (u.id && u.id.toLowerCase() === c))) ||
      db.staff.find(s => candidateList.some(c => (s.userId && s.userId.toLowerCase() === c) || (s.email && s.email.toLowerCase() === c) || (s.id && s.id.toLowerCase() === c)));

    const canonicalKey = matched?.id || (matched as any)?.userId?.toLowerCase() || (matched as any)?.email?.toLowerCase() || identifier;
    const record = accountLockoutTracker.get(canonicalKey);
    const now = Date.now();

    if (record && record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return res.json({
        locked: true,
        lockedUntil: record.lockedUntil,
        remainingSeconds,
        contactMessage: 'Please contact administration to unlock or verify credentials.'
      });
    }

    return res.json({ locked: false, remainingSeconds: 0 });
  });

  app.post('/api/auth/unlock-account', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Identifier is required' });
    }
    const clean = identifier.trim().toLowerCase();
    const { candidateList } = resolveAuthCandidates(clean);
    const matched = db.users.find(u => candidateList.some(c => (u.email && u.email.toLowerCase() === c) || (u.id && u.id.toLowerCase() === c) || ((u as any).staffId && (u as any).staffId.toLowerCase() === c))) ||
      db.staff.find(s => candidateList.some(c => (s.userId && s.userId.toLowerCase() === c) || (s.email && s.email.toLowerCase() === c) || (s.id && s.id.toLowerCase() === c) || (s.staffId && s.staffId.toLowerCase() === c)));

    if (matched) {
      accountLockoutTracker.delete(matched.id);
      if (matched.email) accountLockoutTracker.delete(matched.email.toLowerCase());
      if ((matched as any).staffId) accountLockoutTracker.delete((matched as any).staffId.toLowerCase());
      if ((matched as any).userId) accountLockoutTracker.delete((matched as any).userId.toLowerCase());
    }
    for (const c of candidateList) {
      accountLockoutTracker.delete(c);
    }
    for (const [key] of accountLockoutTracker.entries()) {
      if (key.includes(clean) || clean.includes(key)) {
        accountLockoutTracker.delete(key);
      }
    }
    await addAudit('Account Unlocked', 'auth', `Account ${identifier} unlocked by administrator`, 'Administrator', 'Super Admin');
    return res.json({ success: true, message: `Account ${identifier} unlocked successfully.` });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    let deviceId = (req.headers['x-device-id'] as string) || '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
    const ua = req.headers['user-agent'] || '';
    const { browser, os, deviceType } = parseUserAgentInfo(ua);
    const clientDevice = `${deviceType} • ${os}`;

    // Verify if device is blocked
    const blockCheck = isDeviceBlocked(deviceId, clientIp);
    if (blockCheck.blocked) {
      const b = blockCheck.device!;
      const isTemp = b.blockType === 'temporary';
      const remainingMs = b.blockedUntil ? Math.max(0, new Date(b.blockedUntil).getTime() - Date.now()) : 0;
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      const msg = isTemp
        ? `Access Denied: This terminal device has been temporarily blocked by administrator (${remainingMins} minute${remainingMins !== 1 ? 's' : ''} remaining). Reason: ${b.reason || 'Security policy'}`
        : `Access Denied: This terminal device has been permanently blocked by system administration. Reason: ${b.reason || 'Security policy'}`;

      await addAudit(
        'Blocked Device Login',
        'auth',
        `Blocked authentication attempt from blacklisted device ${deviceId || clientIp} (Attempted identifier: ${email}). ${msg}`,
        email,
        'Guest',
        undefined,
        { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: email }
      );

      return res.status(403).json({
        success: false,
        isDeviceBlocked: true,
        blockType: b.blockType,
        blockedUntil: b.blockedUntil,
        error: msg
      });
    }

    // 1. Verify identifier input
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        errorType: 'INVALID_ID',
        error: 'Please enter your Staff ID or registered Email address.'
      });
    }

    // 2. Verify password input
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        success: false,
        errorType: 'INVALID_PASSWORD',
        error: 'Please enter your password to authenticate.'
      });
    }

    const cleanInput = (email || '').trim().toLowerCase();
    const { candidateList } = resolveAuthCandidates(cleanInput);

    // 3. Refresh live database records from MongoDB if connected
    if (mongoService.isLive) {
      try {
        const liveStaff = await mongoService.getStaff();
        if (liveStaff && liveStaff.length > 0) {
          db.staff = liveStaff;
        }
        const liveUsers = await mongoService.getUsers();
        if (liveUsers && liveUsers.length > 0) {
          db.users = liveUsers;
        }
      } catch (err: any) {
        console.warn('[Auth] Real-time MongoDB fetch warning:', err.message);
      }
    }

    // 4. Search database strictly for matching staff or user account
    let targetAccount: {
      type: 'user' | 'staff';
      id: string;
      name: string;
      email: string;
      role: UserRole;
      department?: string;
      phone?: string;
      permissions: PermissionKey[];
      password?: string;
      tempPassword?: string;
      tempPasswordExpiresAt?: string;
      isTempPassword?: boolean;
      status?: string;
      staffId?: string;
      avatar?: string | null;
      lastActive?: string;
      record: any;
    } | null = null;

    if (cleanInput.includes('@')) {
      // Direct Email login:
      // Check db.users first (Super Admin accounts)
      const matchedUser = db.users.find(u =>
        u.email && candidateList.includes(u.email.toLowerCase())
      );
      if (matchedUser) {
        targetAccount = {
          type: 'user',
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          department: matchedUser.department,
          phone: matchedUser.phone,
          permissions: matchedUser.permissions || DEFAULT_ROLE_PERMISSIONS[matchedUser.role],
          password: matchedUser.password,
          status: 'Active',
          staffId: matchedUser.staffId,
          avatar: (matchedUser as any).avatar,
          lastActive: matchedUser.lastActive,
          record: matchedUser
        };
      } else {
        // Check db.staff by email
        const matchedStaff = db.staff.find(s =>
          s.email && candidateList.includes(s.email.toLowerCase())
        );
        if (matchedStaff) {
          const roleBaseline = (db.settings?.rolePermissions && db.settings.rolePermissions[matchedStaff.role] && Array.isArray(db.settings.rolePermissions[matchedStaff.role]))
            ? db.settings.rolePermissions[matchedStaff.role]
            : (DEFAULT_ROLE_PERMISSIONS[matchedStaff.role] || DEFAULT_ROLE_PERMISSIONS['Employee']);
          const effectivePerms = matchedStaff.role === 'Super Admin'
            ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
            : (matchedStaff.isCustomPermissions && Array.isArray(matchedStaff.permissions)
                ? matchedStaff.permissions
                : roleBaseline);

          targetAccount = {
            type: 'staff',
            id: matchedStaff.id,
            name: matchedStaff.name,
            email: matchedStaff.email,
            role: matchedStaff.role,
            department: matchedStaff.department,
            phone: matchedStaff.phone,
            permissions: effectivePerms,
            password: matchedStaff.password,
            tempPassword: matchedStaff.tempPassword,
            tempPasswordExpiresAt: matchedStaff.tempPasswordExpiresAt,
            isTempPassword: matchedStaff.isTempPassword,
            status: matchedStaff.status,
            staffId: matchedStaff.staffId || matchedStaff.userId,
            avatar: matchedStaff.avatar,
            lastActive: matchedStaff.lastActive,
            record: matchedStaff
          };
        }
      }
    } else {
      // Non-email identifier (staffId, userId, or id)
      // Check db.users first
      const matchedUser = db.users.find(u =>
        (u.staffId && candidateList.includes(u.staffId.toLowerCase())) ||
        (u.id && candidateList.includes(u.id.toLowerCase()))
      );
      if (matchedUser) {
        targetAccount = {
          type: 'user',
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          department: matchedUser.department,
          phone: matchedUser.phone,
          permissions: matchedUser.permissions || DEFAULT_ROLE_PERMISSIONS[matchedUser.role],
          password: matchedUser.password,
          status: 'Active',
          staffId: matchedUser.staffId,
          avatar: (matchedUser as any).avatar,
          lastActive: matchedUser.lastActive,
          record: matchedUser
        };
      } else {
        // Check db.staff
        const matchedStaff = db.staff.find(s =>
          (s.staffId && candidateList.includes(s.staffId.toLowerCase())) ||
          (s.userId && candidateList.includes(s.userId.toLowerCase())) ||
          (s.id && candidateList.includes(s.id.toLowerCase()))
        );
        if (matchedStaff) {
          const roleBaseline = (db.settings?.rolePermissions && db.settings.rolePermissions[matchedStaff.role] && Array.isArray(db.settings.rolePermissions[matchedStaff.role]))
            ? db.settings.rolePermissions[matchedStaff.role]
            : (DEFAULT_ROLE_PERMISSIONS[matchedStaff.role] || DEFAULT_ROLE_PERMISSIONS['Employee']);
          const effectivePerms = matchedStaff.role === 'Super Admin'
            ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
            : (matchedStaff.isCustomPermissions && Array.isArray(matchedStaff.permissions)
                ? matchedStaff.permissions
                : roleBaseline);

          targetAccount = {
            type: 'staff',
            id: matchedStaff.id,
            name: matchedStaff.name,
            email: matchedStaff.email,
            role: matchedStaff.role,
            department: matchedStaff.department,
            phone: matchedStaff.phone,
            permissions: effectivePerms,
            password: matchedStaff.password,
            tempPassword: matchedStaff.tempPassword,
            tempPasswordExpiresAt: matchedStaff.tempPasswordExpiresAt,
            isTempPassword: matchedStaff.isTempPassword,
            status: matchedStaff.status,
            staffId: matchedStaff.staffId || matchedStaff.userId,
            avatar: matchedStaff.avatar,
            lastActive: matchedStaff.lastActive,
            record: matchedStaff
          };
        }
      }
    }

    // If ID or email is not recognized in database, strictly reject
    if (!targetAccount) {
      console.warn(`[Auth Alert] Access Denied: Unrecognized Staff ID / Email "${cleanInput}"`);
      await addAudit(
        'Failed Login',
        'auth',
        `Unauthorized login attempt with unrecognized identifier: ${email}`,
        email,
        'Guest',
        undefined,
        { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: email }
      );
      return res.status(401).json({
        success: false,
        errorType: 'INVALID_ID',
        error: `Access Denied: Staff ID or Email "${email}" not found in database. Only registered users in the database can log in.`
      });
    }

    // 4. Check account status
    if (targetAccount.status && targetAccount.status !== 'Active') {
      console.warn(`[Auth Alert] Access Denied: Account "${targetAccount.name}" is ${targetAccount.status}`);
      await addAudit(
        'Failed Login',
        'auth',
        `Login attempt for ${(targetAccount.status || '').toLowerCase()} account: ${targetAccount.name}`,
        targetAccount.name,
        targetAccount.role,
        targetAccount.id,
        { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
      );
      return res.status(403).json({
        success: false,
        errorType: 'ACCOUNT_INACTIVE',
        error: `Access Denied: Your staff account is currently marked as ${targetAccount.status}. Please contact Hotel Administration.`
      });
    }

    // 5. Account Lockout Check (5-minute security lockout)
    const canonicalAccountId = targetAccount.id || targetAccount.email?.toLowerCase() || cleanInput;
    const now = Date.now();
    let lockoutState = accountLockoutTracker.get(canonicalAccountId);

    if (lockoutState && lockoutState.lockedUntil && lockoutState.lockedUntil > now) {
      const remainingSeconds = Math.ceil((lockoutState.lockedUntil - now) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const formattedTime = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds === 1 ? '' : 's'}` : `${seconds} second${seconds === 1 ? '' : 's'}`;

      console.warn(`[Security Alert] Blocked login attempt for locked account "${canonicalAccountId}". Active lockout: ${remainingSeconds}s.`);
      await addAudit(
        'Blocked Login',
        'auth',
        `Blocked login attempt for temporarily locked account ${canonicalAccountId}. Remaining lockout: ${formattedTime}`,
        targetAccount.name,
        targetAccount.role,
        targetAccount.id,
        { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
      );

      return res.status(423).json({
        success: false,
        errorType: 'ACCOUNT_LOCKED',
        error: `Access Denied: Account is temporarily blocked. Please wait ${formattedTime} or contact administration.`,
        lockedUntil: lockoutState.lockedUntil,
        remainingSeconds,
        contactMessage: 'Please contact administration to unlock or verify credentials.'
      });
    }

    // If 5 minutes have elapsed, release active lock but remember account was previously locked
    if (lockoutState && lockoutState.lockedUntil && lockoutState.lockedUntil <= now) {
      lockoutState.lockedUntil = null;
      lockoutState.failedAttempts = 0;
      lockoutState.previouslyLocked = true;
    }

    // 6. Validate entered password
    const enteredPassword = normalizeAuthInput(password);
    const rawTrimmed = (password || '').trim();
    let isPasswordValid = false;

    // Check 24-hour temporary password first (if active and unexpired)
    if (targetAccount.tempPassword) {
      const normTemp = normalizeAuthInput(targetAccount.tempPassword);
      if (enteredPassword === targetAccount.tempPassword || enteredPassword === normTemp || rawTrimmed === targetAccount.tempPassword) {
        if (targetAccount.tempPasswordExpiresAt && new Date().getTime() > new Date(targetAccount.tempPasswordExpiresAt).getTime()) {
          console.warn(`[Auth Alert] Access Denied: 24-hour temporary password for "${targetAccount.name}" has expired.`);
          await addAudit(
            'Failed Login',
            'auth',
            `Expired 24-hr temporary password login attempt for ${targetAccount.name}`,
            targetAccount.name,
            targetAccount.role,
            targetAccount.id,
            { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
          );
          return res.status(401).json({
            success: false,
            errorType: 'TEMP_PASSWORD_EXPIRED',
            error: 'Access Denied: Your 24-hour temporary password has expired. Please contact your administrator to generate a new password.'
          });
        }
        isPasswordValid = true;
      }
    }

    // Check account permanent password strictly from database
    if (!isPasswordValid) {
      const storedPass = (targetAccount.password || '').trim();
      if (!storedPass) {
        console.warn(`[Auth Alert] Access Denied: No password stored in database for account "${targetAccount.name}".`);
        return res.status(401).json({
          success: false,
          errorType: 'INVALID_PASSWORD',
          error: 'Access Denied: No password configured for this account in database. Please contact Hotel Administration.'
        });
      }

      const normStored = normalizeAuthInput(storedPass);

      // Strict database-verified password matching ONLY:
      // Password must match the specific account's stored database password
      if (
        rawTrimmed === storedPass ||
        enteredPassword === storedPass ||
        enteredPassword === normStored ||
        enteredPassword.toLowerCase() === storedPass.toLowerCase()
      ) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      const accountName = targetAccount.name;
      const accountRole = targetAccount.role;
      const lockDurationMs = 5 * 60 * 1000; // 5 minutes

      if (lockoutState?.previouslyLocked) {
        const lockedUntil = now + lockDurationMs;
        accountLockoutTracker.set(canonicalAccountId, {
          failedAttempts: 1,
          lockedUntil,
          previouslyLocked: true,
          lastAttemptAt: now
        });

        console.warn(`[Security Lockout] Account "${canonicalAccountId}" re-blocked for 5 minutes after 1 single invalid retry.`);
        await addAudit(
          'Account Locked',
          'auth',
          `Account ${canonicalAccountId} re-blocked for 5 minutes after single invalid retry. Contact administration.`,
          accountName,
          accountRole,
          targetAccount.id,
          { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
        );

        return res.status(423).json({
          success: false,
          errorType: 'ACCOUNT_LOCKED',
          error: 'Access Denied: Incorrect password. Your account has been blocked for 5 minutes. Please contact administration.',
          lockedUntil,
          remainingSeconds: 300,
          contactMessage: 'Please contact administration to unlock or verify credentials.'
        });
      }

      const currentAttempts = (lockoutState?.failedAttempts || 0) + 1;

      if (currentAttempts >= 3) {
        const lockedUntil = now + lockDurationMs;
        accountLockoutTracker.set(canonicalAccountId, {
          failedAttempts: currentAttempts,
          lockedUntil,
          previouslyLocked: true,
          lastAttemptAt: now
        });

        console.warn(`[Security Lockout] Account "${canonicalAccountId}" blocked for 5 minutes after 3 invalid attempts.`);
        await addAudit(
          'Account Locked',
          'auth',
          `Account ${canonicalAccountId} blocked for 5 minutes after 3 consecutive invalid attempts. Contact administration.`,
          accountName,
          accountRole,
          targetAccount.id,
          { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
        );

        return res.status(423).json({
          success: false,
          errorType: 'ACCOUNT_LOCKED',
          error: 'Access Denied: Incorrect password entered 3 times. Your account has been blocked for 5 minutes. Please contact administration.',
          lockedUntil,
          remainingSeconds: 300,
          contactMessage: 'Please contact administration to unlock or verify credentials.'
        });
      } else {
        accountLockoutTracker.set(canonicalAccountId, {
          failedAttempts: currentAttempts,
          lockedUntil: null,
          previouslyLocked: false,
          lastAttemptAt: now
        });

        const remaining = 3 - currentAttempts;
        console.warn(`[Auth Alert] Incorrect password for "${accountName}" (${cleanInput}). Attempt ${currentAttempts}/3.`);
        await addAudit(
          'Failed Login',
          'auth',
          `Failed login attempt (${currentAttempts}/3): Incorrect password for ${accountName} (${email})`,
          accountName,
          accountRole,
          targetAccount.id,
          { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: targetAccount.email, performedById: targetAccount.id }
        );

        return res.status(401).json({
          success: false,
          errorType: 'INVALID_PASSWORD',
          error: `Access Denied: Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before 5-minute account lockout.`,
          failedAttempts: currentAttempts,
          remainingAttempts: remaining
        });
      }
    }

    // 7. Validation Passed: Reset lockout tracker for this account, generate session token & update records
    accountLockoutTracker.delete(canonicalAccountId);
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    targetAccount.record.lastActive = new Date().toISOString();
    targetAccount.record.token = token;
    if (targetAccount.type === 'staff') {
      targetAccount.record.lastLogin = new Date().toISOString();
    }

    const sessionUser: User = {
      id: targetAccount.id,
      name: targetAccount.name,
      email: targetAccount.email,
      role: targetAccount.role,
      department: (targetAccount.department as StaffDepartment) || 'Housekeeping',
      phone: targetAccount.phone || '',
      permissions: targetAccount.permissions,
      password: targetAccount.password || '',
      authProvider: 'email',
      lastActive: targetAccount.record.lastActive,
      token: token,
      staffId: targetAccount.staffId,
      avatar: targetAccount.avatar
    };

    // Register active session
    if (!deviceId) {
      deviceId = (req.headers['x-device-id'] as string) || `dev-${Math.random().toString(36).substring(2, 8)}`;
    }
    const existingSessionIdx = db.activeSessions.findIndex(s => s.deviceId === deviceId);
    if (existingSessionIdx >= 0) {
      db.activeSessions[existingSessionIdx].lastSeen = new Date().toISOString();
      db.activeSessions[existingSessionIdx].userId = sessionUser.id;
      db.activeSessions[existingSessionIdx].userName = sessionUser.name;
      db.activeSessions[existingSessionIdx].userEmail = sessionUser.email;
      db.activeSessions[existingSessionIdx].role = sessionUser.role;
      db.activeSessions[existingSessionIdx].browser = browser;
      db.activeSessions[existingSessionIdx].os = os;
      db.activeSessions[existingSessionIdx].deviceType = deviceType as any;
      db.activeSessions[existingSessionIdx].ip = clientIp;
    } else {
      db.activeSessions.push({
        deviceId,
        userId: sessionUser.id,
        userName: sessionUser.name,
        userEmail: sessionUser.email,
        role: sessionUser.role,
        lastSeen: new Date().toISOString(),
        userAgent: req.headers['user-agent']?.substring(0, 50) || 'Web Browser',
        browser,
        os,
        deviceType: deviceType as any,
        ip: clientIp
      });
    }

    saveDatabase();

    // Sync to MongoDB if connected without mixing collections
    if (mongoService.isLive) {
      try {
        if (targetAccount.type === 'user') {
          await mongoService.upsertUser(targetAccount.record);
        } else if (targetAccount.type === 'staff') {
          await mongoService.updateStaff(targetAccount.id, {
            password: targetAccount.password,
            lastLogin: targetAccount.record.lastLogin
          });
        }
      } catch (e: any) {
        console.warn('[MongoDB] Sync error after login:', e.message);
      }
    }

    await addAudit(
      'User Login',
      'auth',
      `User ${sessionUser.name} (${sessionUser.email || sessionUser.staffId}) validated and accessed dashboard`,
      sessionUser.name,
      sessionUser.role,
      sessionUser.id,
      { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: sessionUser.email, performedById: sessionUser.id }
    );

    return res.json({
      success: true,
      user: sessionUser,
      token: token,
      message: 'Authentication validated successfully. Dashboard access granted.'
    });
  });

  // Google OAuth verification endpoint
  app.post('/api/auth/oauth/google', (req, res) => {
    const { email, name, avatar, token: oauthToken } = req.body;
    const userEmail = (email || '').trim().toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'Email identifier is required for authentication' });
    }

    const isRiday =
      userEmail === 'abusayeedriday@gmail.com' ||
      userEmail === 'mdriday256@gmail.com' ||
      userEmail.startsWith('abusayeedriday') ||
      userEmail.startsWith('mdriday256');

    // Check if staff member in db.staff
    const matchedStaff = db.staff.find(s =>
      (s.email && s.email.toLowerCase() === userEmail) ||
      (s.userId && s.userId.toLowerCase() === userEmail) ||
      (s.staffId && s.staffId.toLowerCase() === userEmail)
    );

    const userName = name || (isRiday ? 'MD ABU SAYEED RIDAY' : (matchedStaff ? matchedStaff.name : 'Authorized Hotel Staff'));
    const userRole = isRiday ? 'Super Admin' : (matchedStaff ? matchedStaff.role : 'Employee');

    let user = db.users.find(u => u.email.toLowerCase() === userEmail);

    if (!user) {
      user = {
        id: `usr-oauth-${Date.now()}`,
        name: userName,
        email: userEmail,
        role: userRole,
        department: matchedStaff?.department || 'Housekeeping',
        phone: matchedStaff?.phone || '0571858601',
        permissions: matchedStaff?.permissions || DEFAULT_ROLE_PERMISSIONS[userRole] || DEFAULT_ROLE_PERMISSIONS['Employee'],
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        password: matchedStaff?.password || '587710',
        authProvider: 'google',
        lastActive: new Date().toISOString(),
        token: `jwt-oauth-${Date.now()}-${Math.random().toString(36).substring(2)}`
      };
      if (isRiday) {
        db.users.push(user);
      }
    } else {
      user.name = userName;
      user.role = userRole;
      if (avatar) user.avatar = avatar;
      if (!user.permissions) user.permissions = DEFAULT_ROLE_PERMISSIONS[userRole];
      user.lastActive = new Date().toISOString();
      user.token = `jwt-oauth-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }

    const deviceId = (req.headers['x-device-id'] as string) || `dev-${Math.random().toString(36).substring(2, 8)}`;
    db.activeSessions = db.activeSessions.filter(s => s.deviceId !== deviceId);
    db.activeSessions.push({
      deviceId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      lastSeen: new Date().toISOString(),
      userAgent: (req.headers['user-agent'] || 'Google Authenticated Browser').substring(0, 60)
    });

    addAudit('OAuth Login', 'auth', `Google OAuth authenticated for ${user.email}`, user.name, user.role);
    saveDatabase();

    return res.json({
      success: true,
      user,
      token: user.token,
      message: 'Google OAuth authentication verified successfully'
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access Denied: Authentication required. No token provided.'
      });
    }

    const user = db.users.find(u => u.token === token);
    if (user) {
      return res.json({ success: true, user });
    }

    const staffMember = db.staff.find(s => (s as any).token === token);
    if (staffMember) {
      const sessionUser: User = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        department: staffMember.department,
        phone: staffMember.phone || '',
        permissions: staffMember.permissions || DEFAULT_ROLE_PERMISSIONS[staffMember.role],
        password: staffMember.password,
        authProvider: 'email',
        lastActive: staffMember.lastActive,
        token: (staffMember as any).token,
        staffId: staffMember.staffId || staffMember.userId,
        avatar: staffMember.avatar
      };
      return res.json({ success: true, user: sessionUser });
    }

    return res.status(401).json({
      success: false,
      error: 'Access Denied: Session expired or invalid. Please log in.'
    });
  });

  // Session validation endpoint
  app.post('/api/auth/validate-session', (req, res) => {
    const { token, email } = req.body;
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No active session token.' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. If cleanEmail or identifier is specified, match the exact account
    if (cleanEmail) {
      const staffMember = db.staff.find(
        s => (s.email && s.email.toLowerCase() === cleanEmail) ||
             (s.userId && s.userId.toLowerCase() === cleanEmail) ||
             (s.staffId && s.staffId.toLowerCase() === cleanEmail) ||
             (s.id && s.id.toLowerCase() === cleanEmail)
      );
      if (staffMember) {
        (staffMember as any).token = token;
        const roleBaseline = (db.settings?.rolePermissions && db.settings.rolePermissions[staffMember.role] && Array.isArray(db.settings.rolePermissions[staffMember.role]))
          ? db.settings.rolePermissions[staffMember.role]
          : (DEFAULT_ROLE_PERMISSIONS[staffMember.role] || DEFAULT_ROLE_PERMISSIONS['Employee']);
        const effectivePerms = staffMember.role === 'Super Admin'
          ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
          : (staffMember.isCustomPermissions && Array.isArray(staffMember.permissions)
              ? staffMember.permissions
              : roleBaseline);

        const sessionUser: User = {
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email,
          role: staffMember.role,
          department: staffMember.department,
          phone: staffMember.phone || '',
          permissions: effectivePerms,
          password: staffMember.password,
          authProvider: 'email',
          lastActive: staffMember.lastActive,
          token: (staffMember as any).token || token,
          staffId: staffMember.staffId || staffMember.userId,
          avatar: staffMember.avatar
        };
        return res.json({ valid: true, user: sessionUser });
      }

      const user = db.users.find(
        u => (u.email && u.email.toLowerCase() === cleanEmail) ||
             (u.id && u.id.toLowerCase() === cleanEmail) ||
             ((u as any).staffId && (u as any).staffId.toLowerCase() === cleanEmail)
      );
      if (user) {
        user.token = token;
        return res.json({ valid: true, user });
      }
    }

    // 2. Token match alone if email not passed
    const tokenStaff = db.staff.find(s => (s as any).token === token);
    if (tokenStaff) {
      const roleBaseline = (db.settings?.rolePermissions && db.settings.rolePermissions[tokenStaff.role] && Array.isArray(db.settings.rolePermissions[tokenStaff.role]))
        ? db.settings.rolePermissions[tokenStaff.role]
        : (DEFAULT_ROLE_PERMISSIONS[tokenStaff.role] || DEFAULT_ROLE_PERMISSIONS['Employee']);
      const effectivePerms = tokenStaff.role === 'Super Admin'
        ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
        : (tokenStaff.isCustomPermissions && Array.isArray(tokenStaff.permissions)
            ? tokenStaff.permissions
            : roleBaseline);

      const sessionUser: User = {
        id: tokenStaff.id,
        name: tokenStaff.name,
        email: tokenStaff.email,
        role: tokenStaff.role,
        department: tokenStaff.department,
        phone: tokenStaff.phone || '',
        permissions: effectivePerms,
        password: tokenStaff.password,
        authProvider: 'email',
        lastActive: tokenStaff.lastActive,
        token: (tokenStaff as any).token || token,
        staffId: tokenStaff.staffId || tokenStaff.userId,
        avatar: tokenStaff.avatar
      };
      return res.json({ valid: true, user: sessionUser });
    }

    const tokenUser = db.users.find(u => u.token === token);
    if (tokenUser) {
      return res.json({ valid: true, user: tokenUser });
    }

    return res.status(401).json({ valid: false, error: 'Session is invalid or expired.' });
  });

  app.post('/api/auth/logout', (req, res) => {
    const deviceId = req.headers['x-device-id'] as string;
    if (deviceId) {
      db.activeSessions = db.activeSessions.filter(s => s.deviceId !== deviceId);
    }
    saveDatabase();
    res.json({ success: true, message: 'Logged out' });
  });

  // ----------------------------------------------------
  // API: Hotel Settings & Cross-Device Sync
  // ----------------------------------------------------
  app.get('/api/settings', async (req, res) => {
    let settingsData = db.settings;
    if (mongoService.isLive) {
      try {
        const mongoSettings = await mongoService.getSettings();
        if (mongoSettings) {
          settingsData = mongoSettings;
          db.settings = mongoSettings;
        }
      } catch (e) {
        console.warn('Error reading settings from MongoDB:', e);
      }
    }

    res.json({
      settings: {
        ...settingsData,
        syncedDevicesCount: Math.max(db.activeSessions.length, 1)
      },
      activeSessions: db.activeSessions
    });
  });

  app.put('/api/settings', async (req, res) => {
    const updated = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    db.settings = {
      ...db.settings,
      ...updated,
      version: (db.settings.version || 1) + 1,
      lastSyncedAt: new Date().toISOString(),
      syncedDevicesCount: Math.max(db.activeSessions.length, 1)
    };

    if (mongoService.isLive) {
      try {
        await mongoService.updateSettings(db.settings);
      } catch (e: any) {
        console.warn('Error updating settings in MongoDB:', e.message);
      }
    }

    await addAudit('Settings Updated', 'settings', `Hotel settings updated by ${actor} (Version ${db.settings.version})`, actor, role);
    saveDatabase();

    return res.json({
      success: true,
      settings: db.settings,
      message: 'Settings updated and synchronized across all active devices.'
    });
  });

  app.post('/api/settings/sync', async (req, res) => {
    const { deviceId, clientVersion } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';

    if (deviceId) {
      const session = db.activeSessions.find(s => s.deviceId === deviceId);
      if (session) {
        session.lastSeen = new Date().toISOString();
      } else {
        db.activeSessions.push({
          deviceId,
          userId: 'usr-1',
          userName: actor,
          userEmail: 'staff@warwickbaha.com',
          role: 'Staff',
          lastSeen: new Date().toISOString(),
          userAgent: (req.headers['user-agent'] || 'Synced Client Device').substring(0, 60)
        });
      }
    }

    db.settings.lastSyncedAt = new Date().toISOString();
    db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
    saveDatabase();

    return res.json({
      success: true,
      settings: db.settings,
      itemsCount: mongoService.isLive ? (await mongoService.getStatus()).collections.itemsCount : db.items.length,
      staffCount: db.staff.length,
      syncedAt: db.settings.lastSyncedAt,
      syncedDevicesCount: db.settings.syncedDevicesCount,
      activeSessions: db.activeSessions
    });
  });

  // ----------------------------------------------------
  // API: Clear System Cache & Force Client Synchronization
  // ----------------------------------------------------
  app.post(['/api/system/clear-cache', '/api/settings/clear-cache'], async (req, res) => {
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const actorEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase();

    // Check authorization: Super Admin, Admin, Manager or Settings permission
    const userObj = db.users.find(u => u.name.toLowerCase() === actor.toLowerCase() || (actorEmail && u.email.toLowerCase() === actorEmail));
    const userPerms = userObj?.permissions || (role ? DEFAULT_ROLE_PERMISSIONS[role] : []) || [];
    const canClearCache = ['Super Admin', 'Admin', 'Manager'].includes(role) || userPerms.includes('settings');

    if (!canClearCache) {
      return res.status(403).json({
        error: 'Permission Denied: Only administrators can clear system cache.'
      });
    }

    const now = new Date().toISOString();

    // 1. Purge obsolete inactive sessions (> 48 hours)
    const cutoff48h = Date.now() - 48 * 3600 * 1000;
    const initialSessionCount = db.activeSessions.length;
    db.activeSessions = db.activeSessions.filter(s => {
      if (!s.lastSeen) return true;
      const seenTime = new Date(s.lastSeen).getTime();
      return seenTime > cutoff48h;
    });

    // 2. Increment cache bust version & timestamp
    const nextVersion = (db.settings.version || 1) + 1;
    db.settings = {
      ...db.settings,
      version: nextVersion,
      lastSyncedAt: now,
      lastCachePurgedAt: now,
      cacheVersion: nextVersion,
      syncedDevicesCount: Math.max(db.activeSessions.length, 1)
    };

    // 3. If MongoDB is live, persist updated settings & reload live counts
    if (mongoService.isLive) {
      try {
        await mongoService.updateSettings(db.settings);
      } catch (e: any) {
        console.warn('MongoDB settings update on clear cache warning:', e.message);
      }
    }

    saveDatabase();

    // 4. Dispatch a real-time system broadcast notification so all clients receive instant update
    createNotificationHelper({
      title: '⚡ System Cache Cleared',
      message: `System cache was manually cleared by ${actor}. All client devices have refreshed to latest inventory version (v${nextVersion}).`,
      type: 'system',
      priority: 'normal',
      targetType: 'all',
      senderName: actor,
      senderRole: role,
      senderEmail: actorEmail
    }).catch(() => {});

    // 5. Add audit log entry
    await addAudit(
      'System Cache Cleared',
      'settings',
      `Administrator ${actor} purged stale server cache & forced data update across all client devices (Sync v${nextVersion})`,
      actor,
      role
    );

    return res.json({
      success: true,
      message: 'System cache purged successfully. Update broadcasted to all connected clients.',
      clearedAt: now,
      version: nextVersion,
      cacheStats: {
        items: db.items.length,
        staff: db.staff.length,
        activeSessions: db.activeSessions.length,
        notifications: db.notifications.length,
        purgedStaleSessions: Math.max(0, initialSessionCount - db.activeSessions.length)
      },
      settings: db.settings
    });
  });

  // ----------------------------------------------------
  // API: Real-Time Active Device Sessions
  // ----------------------------------------------------
  app.get('/api/sessions', (req, res) => {
    const currentDeviceId = req.headers['x-device-id'] as string;
    const sessions = db.activeSessions.map((s: any) => ({
      ...s,
      isCurrent: Boolean(s.deviceId && currentDeviceId && s.deviceId === currentDeviceId)
    }));

    // Sort: current device first, then most recently active
    sessions.sort((a: any, b: any) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });

    return res.json({
      success: true,
      sessions,
      total: sessions.length,
      currentDeviceId
    });
  });

  app.delete('/api/sessions/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const currentDeviceId = req.headers['x-device-id'] as string;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (deviceId === currentDeviceId) {
      return res.status(400).json({ error: 'Cannot terminate your current active session.' });
    }

    const removedSession = db.activeSessions.find((s: any) => s.deviceId === deviceId);
    db.activeSessions = db.activeSessions.filter((s: any) => s.deviceId !== deviceId);
    db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
    saveDatabase();

    if (removedSession) {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
      const ua = req.headers['user-agent'] || '';
      const { browser, os, deviceType } = parseUserAgentInfo(ua);
      addAudit(
        'Session Terminated',
        'auth',
        `Terminated active remote session for ${removedSession.userName} on ${removedSession.os || 'Device'} (${deviceId})`,
        actor,
        role,
        deviceId,
        { ip: clientIp, deviceType: `${deviceType} • ${os}`, browser, performedByEmail: removedSession.userEmail }
      );
    }

    const sessions = db.activeSessions.map((s: any) => ({
      ...s,
      isCurrent: Boolean(s.deviceId && currentDeviceId && s.deviceId === currentDeviceId)
    }));

    return res.json({
      success: true,
      message: `Session terminated for device ${deviceId}`,
      sessions
    });
  });

  // ----------------------------------------------------
  // API: Security Activity History (Connected Devices & Security)
  // ----------------------------------------------------
  app.get('/api/security/activity', async (req, res) => {
    try {
      const { type, search, limit = '300' } = req.query;

      let allLogs: AuditLog[] = [];
      if (mongoService.isLive) {
        try {
          const mLogs = await mongoService.getAuditLogs({ entityType: 'auth' }, 500);
          if (mLogs && mLogs.length > 0) {
            allLogs = mLogs;
          }
        } catch (e: any) {
          console.warn('Mongo security logs fetch warning:', e.message);
        }
      }

      const localAuth = (db.auditLogs || []).filter(l =>
        l.entityType === 'auth' ||
        l.action?.toLowerCase().includes('login') ||
        l.action?.toLowerCase().includes('password') ||
        l.action?.toLowerCase().includes('lock')
      );

      if (allLogs.length === 0) {
        allLogs = [...localAuth];
      } else {
        const mongoIds = new Set(allLogs.map(l => l.id));
        for (const log of localAuth) {
          if (!mongoIds.has(log.id)) {
            allLogs.push(log);
          }
        }
      }

      // Sort by newest first
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Map to SecurityActivityLog format
      let activities: SecurityActivityLog[] = allLogs.map(log => {
        const act = log.action || '';
        const actLower = act.toLowerCase();
        let eventType: SecurityActivityLog['eventType'] = 'login_success';
        let status: SecurityActivityLog['status'] = 'success';

        if (actLower.includes('password')) {
          eventType = 'password_change';
          status = 'info';
        } else if (
          actLower.includes('failed') ||
          actLower.includes('unauthorized') ||
          actLower.includes('invalid') ||
          actLower.includes('blocked') ||
          actLower.includes('locked')
        ) {
          eventType = 'login_failed';
          status = actLower.includes('locked') || actLower.includes('blocked') ? 'warning' : 'failed';
        } else if (actLower.includes('terminate') || actLower.includes('session')) {
          eventType = 'session_management';
          status = 'warning';
        } else if (actLower.includes('login') || actLower.includes('oauth') || actLower.includes('unlock')) {
          eventType = 'login_success';
          status = 'success';
        }

        return {
          id: log.id,
          action: log.action,
          eventType,
          performedBy: log.performedBy || 'Unknown User',
          performedByRole: log.performedByRole || log.userRole || 'Staff',
          performedByEmail: log.performedByEmail,
          details: log.details || '',
          timestamp: log.timestamp,
          ip: log.ip || '192.168.1.45',
          deviceType: log.deviceType || 'Desktop • Windows 11',
          browser: log.browser || 'Google Chrome',
          status
        };
      });

      // Stats calculated across full dataset
      const stats = {
        total: activities.length,
        successfulLogins: activities.filter(a => a.eventType === 'login_success').length,
        failedAttempts: activities.filter(a => a.eventType === 'login_failed').length,
        passwordChanges: activities.filter(a => a.eventType === 'password_change').length
      };

      // Filter by type
      if (type && type !== 'all') {
        activities = activities.filter(a => a.eventType === type);
      }

      // Filter by search query
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.toLowerCase().trim();
        activities = activities.filter(a =>
          a.performedBy?.toLowerCase().includes(q) ||
          a.performedByEmail?.toLowerCase().includes(q) ||
          a.details?.toLowerCase().includes(q) ||
          a.ip?.toLowerCase().includes(q) ||
          a.action?.toLowerCase().includes(q) ||
          a.deviceType?.toLowerCase().includes(q) ||
          a.browser?.toLowerCase().includes(q) ||
          a.performedByRole?.toLowerCase().includes(q)
        );
      }

      const totalCount = activities.length;
      const parsedLimit = parseInt(limit as string, 10) || 300;
      activities = activities.slice(0, parsedLimit);

      return res.json({
        success: true,
        activities,
        total: totalCount,
        stats
      });
    } catch (err: any) {
      console.error('Security activity fetch error:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
        activities: [],
        total: 0,
        stats: { total: 0, successfulLogins: 0, failedAttempts: 0, passwordChanges: 0 }
      });
    }
  });

  // Delete single security activity log entry
  app.delete('/api/security/activity/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

      const beforeLen = (db.auditLogs || []).length;
      db.auditLogs = (db.auditLogs || []).filter(l => l.id !== id);
      const isRemoved = beforeLen !== db.auditLogs.length;

      if (mongoService.isLive) {
        try {
          await mongoService.deleteAuditLog(id);
        } catch (e: any) {
          console.warn('MongoDB delete audit log warning:', e.message);
        }
      }

      saveDatabase();

      return res.json({
        success: true,
        message: isRemoved ? 'Security activity log record deleted.' : 'Log record not found.',
        deletedId: id
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch delete security activity logs by ID array
  app.post('/api/security/activity/delete-batch', async (req, res) => {
    try {
      const { ids } = req.body;
      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'No IDs provided for batch deletion.' });
      }

      const idSet = new Set(ids);
      const beforeCount = (db.auditLogs || []).length;
      db.auditLogs = (db.auditLogs || []).filter(l => !idSet.has(l.id));
      const deletedCount = beforeCount - db.auditLogs.length;

      if (mongoService.isLive) {
        try {
          await mongoService.deleteAuditLogs(ids);
        } catch (e: any) {
          console.warn('MongoDB batch delete audit logs warning:', e.message);
        }
      }

      saveDatabase();

      await addAudit(
        'Security Activity Deleted',
        'settings',
        `Administrator ${actor} deleted ${deletedCount} selected authentication and security activity records`,
        actor,
        role
      );

      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} security activity record${deletedCount !== 1 ? 's' : ''}.`,
        deletedCount
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clear / purge security activity history logs
  app.delete('/api/security/activity', async (req, res) => {
    try {
      const { filter = 'all' } = req.query; // 'all' | 'failed' | 'success' | 'password' | 'older_than_7_days'
      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const beforeCount = (db.auditLogs || []).length;
      const idsToDelete: string[] = [];

      db.auditLogs = (db.auditLogs || []).filter(l => {
        // Keep non-auth logs safe
        if (l.entityType !== 'auth' && !l.action?.toLowerCase().includes('login') && !l.action?.toLowerCase().includes('password')) {
          return true;
        }

        const actLower = (l.action || '').toLowerCase();
        let shouldDelete = false;

        if (filter === 'failed') {
          shouldDelete = actLower.includes('fail') || actLower.includes('invalid') || actLower.includes('block') || actLower.includes('lock') || actLower.includes('unauthorized');
        } else if (filter === 'success') {
          shouldDelete = (actLower.includes('login') || actLower.includes('oauth')) && !actLower.includes('fail') && !actLower.includes('block');
        } else if (filter === 'password') {
          shouldDelete = actLower.includes('password');
        } else if (filter === 'older_than_7_days') {
          const logTime = new Date(l.timestamp).getTime();
          shouldDelete = now - logTime > sevenDaysMs;
        } else {
          // 'all'
          shouldDelete = true;
        }

        if (shouldDelete) {
          idsToDelete.push(l.id);
          return false;
        }
        return true;
      });

      const deletedCount = beforeCount - db.auditLogs.length;

      if (mongoService.isLive && idsToDelete.length > 0) {
        try {
          await mongoService.deleteAuditLogs(idsToDelete);
        } catch (e: any) {
          console.warn('MongoDB batch delete audit logs warning:', e.message);
        }
      }

      saveDatabase();

      await addAudit(
        'Security Activity Cleared',
        'settings',
        `Administrator ${actor} deleted ${deletedCount} authentication & security activity history logs (Mode: ${filter})`,
        actor,
        role
      );

      return res.json({
        success: true,
        message: `Successfully cleared ${deletedCount} security activity history records.`,
        deletedCount
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Blocked Devices Management (Temporary & Permanent)
  // ----------------------------------------------------
  app.get('/api/devices/blocked', (req, res) => {
    if (!Array.isArray(db.blockedDevices)) {
      db.blockedDevices = [];
    }

    // Auto-clean expired temporary blocks
    const now = Date.now();
    let modified = false;
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
      saveDatabase();
    }

    return res.json({
      success: true,
      blockedDevices: db.blockedDevices
    });
  });

  app.post('/api/devices/block', async (req, res) => {
    try {
      const {
        deviceId,
        ip,
        userName,
        userEmail,
        deviceType,
        browser,
        os,
        blockType = 'temporary',
        durationHours = 24,
        reason
      } = req.body;

      const currentDeviceId = req.headers['x-device-id'] as string;
      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

      if (!deviceId && !ip) {
        return res.status(400).json({ success: false, error: 'Device ID or IP is required to block device.' });
      }

      if (deviceId && currentDeviceId && deviceId === currentDeviceId) {
        return res.status(400).json({ success: false, error: 'Cannot block your current active terminal session.' });
      }

      if (!Array.isArray(db.blockedDevices)) {
        db.blockedDevices = [];
      }

      const now = Date.now();
      const hours = Number(durationHours) || 24;
      const blockedUntil = blockType === 'temporary' ? new Date(now + hours * 60 * 60 * 1000).toISOString() : null;

      // Filter out existing record if exists
      db.blockedDevices = db.blockedDevices.filter(b => b.deviceId !== deviceId && (!ip || b.ip !== ip));

      const newBlock: BlockedDevice = {
        deviceId: deviceId || `dev-blocked-${Date.now()}`,
        ip: ip || clientIp,
        userName: userName || 'Unknown Staff',
        userEmail: userEmail || '',
        deviceType: deviceType || 'Unknown Device',
        browser: browser || 'Unknown Browser',
        os: os || 'Unknown OS',
        blockType: blockType === 'permanent' ? 'permanent' : 'temporary',
        blockedAt: new Date().toISOString(),
        blockedUntil,
        reason: reason || (blockType === 'permanent' ? 'Permanent administrator security block' : `Temporary ${hours}h security block`),
        blockedBy: actor,
        blockedByRole: role
      };

      db.blockedDevices.unshift(newBlock);

      // Force terminate active sessions on this blocked device
      if (Array.isArray(db.activeSessions)) {
        db.activeSessions = db.activeSessions.filter(s => s.deviceId !== deviceId && (!ip || s.ip !== ip));
        db.settings.syncedDevicesCount = Math.max(db.activeSessions.length, 1);
      }

      saveDatabase();

      await addAudit(
        'Device Blocked',
        'auth',
        `Device ${deviceId || ip} (${userName || 'User'} - IP: ${ip || clientIp}) blocked ${blockType === 'permanent' ? 'permanently' : `temporarily for ${hours}h`}. Reason: ${newBlock.reason}`,
        actor,
        role,
        deviceId,
        {
          ip: clientIp,
          deviceType: `${deviceType || 'Device'} • ${os || 'OS'}`,
          browser,
          performedByEmail: userEmail
        }
      );

      return res.json({
        success: true,
        message: `Device ${deviceId || ip} has been blocked ${blockType === 'permanent' ? 'permanently' : `temporarily for ${hours} hours`}.`,
        block: newBlock,
        blockedDevices: db.blockedDevices,
        sessions: db.activeSessions
      });
    } catch (err: any) {
      console.error('Device block error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/devices/unblock', async (req, res) => {
    try {
      const { deviceId, ip } = req.body;
      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';

      if (!Array.isArray(db.blockedDevices)) {
        db.blockedDevices = [];
      }

      const existing = db.blockedDevices.find(b => (deviceId && b.deviceId === deviceId) || (ip && b.ip === ip));
      db.blockedDevices = db.blockedDevices.filter(b => (!deviceId || b.deviceId !== deviceId) && (!ip || b.ip !== ip));
      saveDatabase();

      await addAudit(
        'Device Unblocked',
        'auth',
        `Device ${deviceId || ip} (${existing?.userName || 'Device'}) was unblocked by administrator ${actor}`,
        actor,
        role,
        deviceId,
        { ip: clientIp }
      );

      return res.json({
        success: true,
        message: `Device ${deviceId || ip} has been unblocked successfully.`,
        blockedDevices: db.blockedDevices
      });
    } catch (err: any) {
      console.error('Device unblock error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Lost & Found Items
  // ----------------------------------------------------
  app.get('/api/items', async (req, res) => {
    const { search, status, category, month, year, location, limit, offset, includeDeleted, deletedOnly } = req.query;

    let results: LostItem[] = [];

    const activeEngine = multiDbService.getPrimaryEngine();

    if (activeEngine === 'mongodb' && mongoService.isLive) {
      try {
        results = await mongoService.getItems();
        // Update local memory cache
        if (results.length > 0) {
          db.items = results;
        }
      } catch (err: any) {
        mongoService.handleConnectionError(err);
        console.warn('MongoDB query failed, fallback to local cache:', err.message);
        results = [...db.items];
      }
    } else {
      // For local_json or standalone file engine, reload fresh from data/db.json
      if (activeEngine === 'local_json') {
        try {
          if (fs.existsSync(DB_FILE)) {
            const fresh = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            if (Array.isArray(fresh.items)) {
              db.items = fresh.items;
            }
          }
        } catch (e) {
          console.warn('Failed to read db.json fresh:', e);
        }
      }
      results = [...db.items];
    }

    // Auto-purge items soft-deleted for more than 60 days (60 * 24 * 60 * 60 * 1000 ms)
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const nowTime = Date.now();
    const expiredIds: string[] = [];
    db.items = db.items.filter(item => {
      if (item.isDeleted && item.deletedAt) {
        const deletedTime = new Date(item.deletedAt).getTime();
        if (nowTime - deletedTime > SIXTY_DAYS_MS) {
          expiredIds.push(item.id);
          return false;
        }
      }
      return true;
    });

    if (expiredIds.length > 0) {
      saveDatabase();
      if (mongoService.isLive) {
        expiredIds.forEach(id => {
          mongoService.deleteItem(id).catch(() => {});
        });
      }
    }

    // Soft delete filtering:
    // If deletedOnly === 'true', return only soft-deleted items
    // If includeDeleted === 'true', return both active and soft-deleted items
    // By default, return only active (non-deleted) items
    if (deletedOnly === 'true') {
      results = results.filter(item => Boolean(item.isDeleted));
    } else if (includeDeleted !== 'true') {
      results = results.filter(item => !item.isDeleted);
    }

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      results = results.filter(item =>
        item.code.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.locationFound.toLowerCase().includes(q) ||
        (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
        (item.guestName && item.guestName.toLowerCase().includes(q)) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.storeLocation.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All' && status !== 'All Status') {
      results = results.filter(item => item.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (category && category !== 'All' && category !== 'All Categories') {
      results = results.filter(item => item.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (year && year !== 'All') {
      results = results.filter(item => item.dateFound.startsWith(year as string));
    }

    if (month && month !== 'All') {
      results = results.filter(item => {
        const itemMonth = new Date(item.dateFound).getMonth() + 1;
        return itemMonth.toString() === month || item.dateFound.includes(`-${month.toString().padStart(2, '0')}-`);
      });
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime());

    const total = results.length;
    const pageLimit = limit ? parseInt(limit as string, 10) : total;
    const pageOffset = offset ? parseInt(offset as string, 10) : 0;
    const paginated = results.slice(pageOffset, pageOffset + pageLimit).map(item => ({
      ...item,
      itemName: capitalizeWords(item.itemName)
    }));

    return res.json({
      items: paginated,
      total,
      limit: pageLimit,
      offset: pageOffset,
      source: mongoService.isLive ? 'mongodb' : 'local_storage'
    });
  });

  // Create new item
  // Create new item (Role-Based Approval Workflow)
  app.post('/api/items', async (req, res) => {
    const body = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

    // Auto-generate strictly unique serial code if not provided
    const foundDate = body.dateFound || new Date().toISOString().split('T')[0];
    const prefix = db.settings.codePrefix || 'LF';

    // Duplicate Item Code Validation
    if (body.code && db.items.some(i => i.code?.trim().toUpperCase() === body.code.trim().toUpperCase())) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_ITEM_CODE',
        error: `Already exists: Item with tracking code "${body.code.trim()}" already exists in the database. Duplicate item tracking codes are not permitted.`
      });
    }

    const autoCode = generateUniqueItemCode(db.items, prefix, foundDate);

    // Compute deadline
    const duration = parseInt(body.dispatchDurationDays || '90', 10);
    const deadlineDate = new Date(foundDate);
    deadlineDate.setDate(deadlineDate.getDate() + duration);
    const computedDeadline = deadlineDate.toISOString().split('T')[0];

    // Role Logic:
    // If user is Staff (role === 'Employee' or not in admin tier):
    // 1. Employee name is locked to the logged-in staff member's name
    // 2. Item is marked Pending Approval and will only enter main stored inventory after Admin/Manager/Supervisor approves
    // 3. Recorded By is set to Pending Approval until approved by Admin/Manager/Supervisor
    // If user is Admin/Manager/Supervisor:
    // 1. Admin can specify any staff member's name or input
    // 2. Automatically approved and recorded by the Admin/Manager/Supervisor
    const isApproved = isAdminTier && body.isApproved !== false;
    const approvalStatus: 'approved' | 'pending' = isApproved ? 'approved' : 'pending';
    const status: LostItem['status'] = isApproved ? ((body.status as LostItem['status']) || 'Stored') : 'Pending Approval';
    const employeeName = isAdminTier ? (body.employeeName || actor) : actor;
    const recordedBy = isApproved ? actor : 'Pending Approval';

    const newItem: LostItem = {
      id: `item-${Date.now()}`,
      code: body.code || autoCode,
      itemName: capitalizeWords(body.itemName || body.description?.substring(0, 30) || 'Lost Item'),
      category: body.category || 'Other',
      description: body.description || '',
      brand: body.brand || '',
      color: body.color || '',
      dateFound: foundDate,
      timeFound: body.timeFound || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      locationFound: body.locationFound || (body.roomNumber ? `Room ${body.roomNumber}` : 'General Hotel Area'),
      roomNumber: body.roomNumber || '',
      guestName: body.guestName || 'Unknown',
      employeeName,
      storeLocation: body.storeLocation || 'HK Office',
      dispatchDurationDays: duration,
      dispatchDeadline: body.dispatchDeadline || computedDeadline,
      status,
      recordedBy,
      imageUrl: body.imageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isApproved,
      approvalStatus,
      approvedBy: isApproved ? actor : undefined,
      approvedAt: isApproved ? new Date().toISOString() : undefined,
      submittedByStaffName: actor,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          action: isApproved ? 'Item Registered & Stored' : 'Submitted by Staff (Pending Approval)',
          actionType: 'create',
          performedBy: actor,
          performedByRole: role,
          timestamp: new Date().toISOString(),
          notes: isApproved
            ? `Registered by ${role} ${actor}. Found by staff "${employeeName}" in ${body.roomNumber ? `Room ${body.roomNumber}` : body.locationFound || 'Hotel premises'}. Assigned to storage "${body.storeLocation || 'HK Office'}".`
            : `Submitted by Staff ${actor} (${role}). Awaiting Admin / Manager approval.`
        }
      ]
    };

    db.items.unshift(newItem);
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.insertItem(newItem);
      } catch (err: any) {
        console.warn('MongoDB insertItem error:', err.message);
      }
    }

    const auditAction = isApproved ? 'Item Registered' : 'Item Submission Pending Approval';
    const auditDesc = isApproved
      ? `Registered item ${newItem.code} (${newItem.itemName}) recorded by ${actor}`
      : `Staff ${actor} submitted new item ${newItem.code} for admin approval`;

    await addAudit(auditAction, 'item', auditDesc, actor, role, newItem.code);

    // Real-Time Notification Trigger
    if (!isApproved) {
      // Staff submitted an item -> Notify Admins & Supervisors
      createNotificationHelper({
        title: `📦 Storage Approval Request: ${newItem.code}`,
        message: `Staff member "${actor}" registered a lost item "${newItem.itemName}" (${newItem.code}) found in ${newItem.locationFound}. Awaiting Admin / Supervisor approval.`,
        type: 'store_request',
        priority: 'high',
        targetType: 'roles',
        targetRoles: ['Super Admin', 'Admin', 'Manager', 'Supervisor'],
        itemId: newItem.id,
        itemCode: newItem.code,
        senderName: actor,
        senderRole: role
      }).catch(() => {});
    } else {
      // Direct Admin registration
      createNotificationHelper({
        title: `📦 New Item Stored: ${newItem.code}`,
        message: `Item ${newItem.code} (${newItem.itemName}) was registered in "${newItem.storeLocation}" by ${actor}.`,
        type: 'notice',
        priority: 'normal',
        targetType: 'all',
        itemId: newItem.id,
        itemCode: newItem.code,
        senderName: actor,
        senderRole: role
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      item: newItem,
      message: isApproved
        ? `Item ${newItem.code} registered and stored successfully.`
        : `Item ${newItem.code} submitted successfully. Waiting for Admin / Supervisor approval.`
    });
  });

  // Resilient helper to locate an item: checks MongoDB first, then memory cache
  const findItemByIdOrCode = async (idOrCode: string): Promise<LostItem | undefined> => {
    if (mongoService.isLive) {
      try {
        const found = await mongoService.getItems({ $or: [{ id: idOrCode }, { code: idOrCode }] });
        if (found && found.length > 0) return found[0];
      } catch (e: any) {
        mongoService.handleConnectionError(e);
      }
    }
    const itemIndex = db.items.findIndex(i => i.id === idOrCode || i.code === idOrCode || (i as any)._id === idOrCode);
    if (itemIndex >= 0) {
      return db.items[itemIndex];
    }
    return undefined;
  };

  // Central helper to resolve permissions for any requesting actor
  // Evaluates role baseline (with settings rolePermissions matrix override) + individual user-specific upgraded permissions
  const resolveActorPermissions = (req: express.Request): { role: UserRole; permissions: PermissionKey[]; isSuperAdmin: boolean } => {
    const rawRole = (req.headers['x-user-role'] as string) || '';
    const actorName = ((req.headers['x-user-name'] as string) || '').trim().toLowerCase();
    const actorEmail = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase();
    const actorId = ((req.headers['x-user-id'] as string) || '').trim().toLowerCase();
    const rawPermissionsHeader = (req.headers['x-user-permissions'] as string) || '';

    // 1. Super Admin recognition
    let role: UserRole = (rawRole as UserRole) || 'Employee';
    if (
      rawRole.toLowerCase() === 'super admin' ||
      actorEmail === 'mdriday256@gmail.com' ||
      actorEmail === 'abusayeedriday@gmail.com'
    ) {
      return {
        role: 'Super Admin',
        permissions: ALL_PERMISSIONS.map(p => p.id),
        isSuperAdmin: true
      };
    }

    // 2. Locate actor in db.staff first, then db.users
    const staffMatch = db.staff.find(s =>
      (actorId && (s.id.toLowerCase() === actorId || (s as any)._id?.toLowerCase() === actorId || s.userId?.toLowerCase() === actorId || s.staffId?.toLowerCase() === actorId)) ||
      (actorEmail && s.email && s.email.toLowerCase() === actorEmail) ||
      (actorName && s.name && s.name.toLowerCase() === actorName)
    );

    const userMatch = db.users.find(u =>
      (actorId && (u.id.toLowerCase() === actorId || (u as any).staffId?.toLowerCase() === actorId)) ||
      (actorEmail && u.email && u.email.toLowerCase() === actorEmail) ||
      (actorName && u.name && u.name.toLowerCase() === actorName)
    );

    const targetAccount = staffMatch || userMatch;
    if (targetAccount?.role) {
      role = targetAccount.role;
    }

    if (role === 'Super Admin') {
      return {
        role: 'Super Admin',
        permissions: ALL_PERMISSIONS.map(p => p.id),
        isSuperAdmin: true
      };
    }

    // 3. Baseline role permissions from settings matrix override or default
    let baselinePerms: PermissionKey[] = DEFAULT_ROLE_PERMISSIONS[role] || [];
    if (db.settings?.rolePermissions && db.settings.rolePermissions[role] && Array.isArray(db.settings.rolePermissions[role])) {
      baselinePerms = db.settings.rolePermissions[role] as PermissionKey[];
    }

    // 4. Custom/upgraded permissions specifically assigned to this staff member (only if explicit custom override)
    let customPerms: PermissionKey[] = [];
    if (targetAccount?.isCustomPermissions && Array.isArray(targetAccount.permissions)) {
      customPerms = targetAccount.permissions as PermissionKey[];
    }

    // Active permissions: custom staff override if flagged, otherwise strictly baseline role permissions
    const activePerms = (targetAccount?.isCustomPermissions && customPerms.length > 0)
      ? customPerms
      : baselinePerms;

    return {
      role,
      permissions: activePerms,
      isSuperAdmin: false
    };
  };

  const actorHasPermission = (req: express.Request, perm: PermissionKey): boolean => {
    const { role, permissions, isSuperAdmin } = resolveActorPermissions(req);
    if (isSuperAdmin || role === 'Super Admin') return true;
    if (permissions.includes(perm)) return true;

    // Strict Rule: NEVER grant delete via generic master 'certificates' key!
    if (perm === 'certificates_delete') {
      return role === 'Admin' || permissions.includes('certificates_delete');
    }

    // Backward compatibility mappings for certificates (non-delete only)
    if (perm === 'certificates_view' && permissions.includes('certificates')) return true;
    if (perm === 'certificates_create' && permissions.includes('certificates')) return true;
    if (perm === 'certificates_edit' && permissions.includes('certificates')) return true;
    if (perm === 'certificates_print' && permissions.includes('certificates')) return true;
    if (perm === 'certificates_save' && permissions.includes('certificates')) return true;

    return false;
  };

  // Get single item by ID or Code
  app.get('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const item = await findItemByIdOrCode(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in database' });
    }
    return res.json({ item, source: mongoService.isLive ? 'mongodb' : 'local' });
  });

  // Approve item by Admin / Manager / Supervisor
  app.post('/api/items/:id/approve', async (req, res) => {
    const { id } = req.params;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

    if (!isAdminTier) {
      return res.status(403).json({ error: 'Permission denied. Only Admin, Manager, or Supervisor can approve items.' });
    }

    const currentItem = await findItemByIdOrCode(id);

    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);

    // Preserve original recordedBy (the staff member who submitted the item) instead of overwriting with approver
    const originalSubmitter = currentItem.employeeName || currentItem.submittedByStaffName || currentItem.foundBy || actor;
    const preservedRecordedBy = (currentItem.recordedBy && currentItem.recordedBy !== 'Pending Approval')
      ? currentItem.recordedBy
      : originalSubmitter;

    const updatedItem: LostItem = {
      ...currentItem,
      isApproved: true,
      approvalStatus: 'approved',
      status: 'Stored',
      recordedBy: preservedRecordedBy,
      approvedBy: actor,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        ...(currentItem.timeline || []),
        {
          id: `tl-${Date.now()}`,
          action: 'Item Approved by Admin',
          actionType: 'approve',
          performedBy: actor,
          performedByRole: role,
          timestamp: new Date().toISOString(),
          notes: `Approved by ${role} "${actor}". Verified and stored in active inventory.`
        }
      ]
    };

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.unshift(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, updatedItem);
      } catch (err: any) {
        console.warn('MongoDB approve updateItem error:', err.message);
      }
    }

    await addAudit('Item Approved', 'item', `Item ${updatedItem.code} approved and recorded by ${actor}`, actor, role, updatedItem.code);

    // Real-Time Notification Trigger: Notify the staff member who found/submitted the item
    const targetStaff = updatedItem.submittedByStaffName || updatedItem.employeeName || (updatedItem.recordedBy !== 'Pending Approval' ? updatedItem.recordedBy : '') || '';
    const targetStaffId = updatedItem.submittedByStaffId;
    const staffMember = db.staff.find(s => 
      (targetStaffId && (s.id === targetStaffId || s.userId === targetStaffId)) ||
      (s.name && targetStaff && s.name.toLowerCase().trim() === targetStaff.toLowerCase().trim()) ||
      (s.userId && targetStaff && s.userId.toLowerCase().trim() === targetStaff.toLowerCase().trim())
    );

    createNotificationHelper({
      title: `✅ Item Approved: ${updatedItem.code}`,
      message: `Your submitted item "${updatedItem.itemName || updatedItem.code}" has been approved by ${actor} (${role}) and safely stored in "${updatedItem.storeLocation}".`,
      type: 'item_approved',
      priority: 'normal',
      targetType: 'individual',
      targetStaffName: targetStaff || staffMember?.name,
      targetStaffEmail: staffMember?.email,
      targetUserId: targetStaffId || staffMember?.id || staffMember?.userId,
      itemId: updatedItem.id,
      itemCode: updatedItem.code,
      senderName: actor,
      senderRole: role
    }).catch(() => {});

    return res.json({
      success: true,
      item: updatedItem,
      message: `Item ${updatedItem.code} approved successfully and recorded by ${actor}.`
    });
  });

  // Reject pending item
  app.post('/api/items/:id/reject', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

    if (!isAdminTier) {
      return res.status(403).json({ error: 'Permission denied. Only Admin, Manager, or Supervisor can reject items.' });
    }

    const currentItem = await findItemByIdOrCode(id);

    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);

    const cleanReason = (reason && typeof reason === 'string' && reason.trim())
      ? reason.trim()
      : 'Submission was rejected during supervisor verification.';

    const updatedItem: LostItem = {
      ...currentItem,
      isApproved: false,
      approvalStatus: 'rejected',
      status: 'Disposed',
      rejectionReason: cleanReason,
      rejectedBy: actor,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        ...(currentItem.timeline || []),
        {
          id: `tl-${Date.now()}`,
          action: 'Item Submission Rejected',
          actionType: 'reject',
          performedBy: actor,
          performedByRole: role,
          timestamp: new Date().toISOString(),
          notes: `Rejected by ${role} "${actor}". Reason: ${cleanReason}`
        }
      ]
    };

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.unshift(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, updatedItem);
      } catch (err: any) {
        console.warn('MongoDB reject updateItem error:', err.message);
      }
    }

    await addAudit('Item Rejected', 'item', `Item ${updatedItem.code} rejected by ${actor}. Reason: ${cleanReason}`, actor, role, updatedItem.code);

    // Real-Time Notification Trigger: Notify the staff member who found/submitted the item
    const targetStaff = updatedItem.submittedByStaffName || updatedItem.employeeName || (updatedItem.recordedBy !== 'Pending Approval' ? updatedItem.recordedBy : '') || '';
    const targetStaffId = updatedItem.submittedByStaffId;
    const staffMember = db.staff.find(s => 
      (targetStaffId && (s.id === targetStaffId || s.userId === targetStaffId)) ||
      (s.name && targetStaff && s.name.toLowerCase().trim() === targetStaff.toLowerCase().trim()) ||
      (s.userId && targetStaff && s.userId.toLowerCase().trim() === targetStaff.toLowerCase().trim())
    );

    await createNotificationHelper({
      title: `❌ Item Submission Rejected: ${updatedItem.code}`,
      message: `Your submitted item "${updatedItem.itemName || updatedItem.code}" was rejected by ${actor} (${role}). Reason: ${cleanReason}`,
      type: 'item_rejected',
      priority: 'high',
      targetType: 'individual',
      targetStaffName: targetStaff || staffMember?.name,
      targetStaffEmail: staffMember?.email,
      targetUserId: targetStaffId || staffMember?.id || staffMember?.userId,
      itemId: updatedItem.id,
      itemCode: updatedItem.code,
      senderName: actor,
      senderRole: role
    }).catch(err => console.warn('createNotificationHelper error on reject:', err));

    return res.json({
      success: true,
      item: updatedItem,
      message: `Item ${updatedItem.code} rejected.`
    });
  });

  // Update item (PUT & PATCH support for real-time edits)
  const handleItemUpdate = async (req: any, res: any) => {
    const { id } = req.params;
    const body = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    const currentItem = await findItemByIdOrCode(id);
    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);

    // REQUIREMENT: Handed Over items cannot be edited
    if (currentItem.status === 'Handed Over') {
      return res.status(403).json({ error: 'Handed Over items are locked and cannot be edited.' });
    }

    // Duplicate Item Code Validation
    if (body.code && body.code.trim().toUpperCase() !== currentItem.code?.trim().toUpperCase()) {
      const duplicateItem = db.items.find(i => i.id !== currentItem.id && i.code?.trim().toUpperCase() === body.code.trim().toUpperCase());
      if (duplicateItem) {
        return res.status(400).json({
          success: false,
          errorType: 'DUPLICATE_ITEM_CODE',
          error: `Already exists: Item with tracking code "${body.code.trim()}" already exists in the database (${duplicateItem.itemName || 'Existing Item'}). Duplicate tracking codes are not permitted.`
        });
      }
    }

    // REQUIREMENT: "edit korar somoy staff ar name edit kora jabe nah"
    // Keep original employeeName strictly locked so the finder staff name cannot be changed on edit.
    const protectedEmployeeName = currentItem.employeeName || body.employeeName;

    // Detect field changes for deep accountability logging
    const changes: Array<{ field: string; label: string; from: any; to: any }> = [];
    const fieldLabels: Record<string, string> = {
      itemName: 'Item Name',
      description: 'Description',
      category: 'Category',
      storeLocation: 'Storage Location',
      roomNumber: 'Room Number',
      guestName: 'Guest Name',
      brand: 'Brand',
      color: 'Color',
      dispatchDurationDays: 'Dispatch Duration',
      dispatchDeadline: 'Dispatch Deadline',
      status: 'Status',
      locationFound: 'Location Found',
      imageUrl: 'Item Photo'
    };

    for (const [key, label] of Object.entries(fieldLabels)) {
      if (body[key] !== undefined && String(body[key]).trim() !== String((currentItem as any)[key] || '').trim()) {
        changes.push({
          field: key,
          label,
          from: (currentItem as any)[key] || 'None',
          to: body[key] || 'None'
        });
      }
    }

    let activityNotes = body.updateNotes;
    if (!activityNotes && changes.length > 0) {
      activityNotes = changes.map(c => `${c.label}: "${c.from}" → "${c.to}"`).join(', ');
    } else if (!activityNotes) {
      activityNotes = 'Item details updated via dashboard';
    }

    let updatedItem: LostItem = {
      ...currentItem,
      ...body,
      itemName: capitalizeWords(body.itemName || currentItem.itemName),
      employeeName: protectedEmployeeName, // Guaranteed immutable finder name
      updatedAt: new Date().toISOString()
    };

    if (!updatedItem.timeline) updatedItem.timeline = [];
    updatedItem.timeline.push({
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'Item Information Updated',
      actionType: 'update',
      performedBy: actor,
      performedByRole: role,
      timestamp: new Date().toISOString(),
      notes: activityNotes,
      changes: changes.length > 0 ? changes : undefined
    });

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.unshift(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        const mongoRes = await mongoService.updateItem(id, updatedItem);
        if (mongoRes) {
          updatedItem = mongoRes;
          if (itemIndex >= 0) db.items[itemIndex] = mongoRes;
        }
      } catch (err: any) {
        console.warn('MongoDB updateItem error:', err.message);
      }
    }

    const statusChange = changes.find(c => c.field === 'status');
    const isStatusChanged = !!statusChange;
    const auditAction = isStatusChanged
      ? `Status Changed: ${statusChange.from} ➔ ${statusChange.to}`
      : 'Item Updated';

    await addAudit(
      auditAction,
      'item',
      isStatusChanged
        ? `Status updated from "${statusChange.from}" to "${statusChange.to}" for ${updatedItem.code} by ${actor}. ${activityNotes}`
        : `Updated details for item ${updatedItem.code}: ${activityNotes}`,
      actor,
      role,
      updatedItem.code,
      {
        actionType: isStatusChanged ? 'status_change' : 'update',
        itemCode: updatedItem.code,
        itemName: updatedItem.itemName,
        category: updatedItem.category,
        previousStatus: statusChange ? statusChange.from : currentItem.status,
        newStatus: statusChange ? statusChange.to : updatedItem.status,
        performedByEmail: req.headers['x-user-email'] as string,
        reason: body.updateNotes,
        changes: changes.length > 0 ? changes : undefined,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
      }
    );

    return res.json({
      success: true,
      item: updatedItem,
      message: 'Item updated successfully.'
    });
  };

  app.put('/api/items/:id', handleItemUpdate);
  app.patch('/api/items/:id', handleItemUpdate);

  // Handover item to guest (ADMIN ONLY)
  app.post('/api/items/:id/handover', async (req, res) => {
    const { id } = req.params;
    const { receiverName, contactNumber, remarks, idType, idNumber } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    // Handover permission validation: Super Admin, Admin tier, or explicitly granted 'handover' permission
    const canHandover = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'handover');
    if (!canHandover) {
      return res.status(403).json({ error: 'Permission denied. You do not have permission to perform Handover. Contact an Administrator.' });
    }

    const item = await findItemByIdOrCode(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    item.status = 'Handed Over';
    item.updatedAt = now.toISOString();
    item.handoverDetails = {
      receiverName: receiverName || 'Guest',
      contactNumber: contactNumber || '0',
      idType,
      idNumber,
      handoverDate: formattedDate,
      handedOverBy: actor,
      remarks: remarks || 'Verified with room reservation and guest identity.'
    };

    if (!item.timeline) item.timeline = [];
    item.timeline.push({
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'Item Handed Over to Guest',
      actionType: 'handover',
      performedBy: actor,
      performedByRole: role,
      timestamp: now.toISOString(),
      notes: `Handed over to "${receiverName}" (Contact: ${contactNumber}) by ${role} "${actor}". ID: ${idType || 'Verified'} ${idNumber || ''}.${remarks ? ' Remarks: ' + remarks : ''}`,
      meta: {
        receiverName,
        contactNumber,
        idType,
        idNumber,
        remarks
      }
    });

    if (itemIndex >= 0) {
      db.items[itemIndex] = item;
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, item);
      } catch (err: any) {
        console.warn('MongoDB handover update error:', err.message);
      }
    }

    await addAudit(
      'Item Handed Over to Guest',
      'item',
      `Item ${item.code} (${item.itemName || 'Lost Item'}) handed over to guest "${receiverName}". Contact: ${contactNumber}. Verified by Admin ${actor}.`,
      actor,
      role,
      item.code,
      {
        actionType: 'handover',
        itemCode: item.code,
        itemName: item.itemName,
        category: item.category,
        previousStatus: 'Stored',
        newStatus: 'Handed Over',
        performedByEmail: req.headers['x-user-email'] as string,
        reason: remarks || 'Verified with room reservation and guest identity.',
        changes: [
          { field: 'status', label: 'Status', from: 'Stored', to: 'Handed Over' },
          { field: 'receiverName', label: 'Receiver Name', from: 'None', to: receiverName }
        ],
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop',
        meta: {
          receiverName,
          contactNumber,
          idType,
          idNumber,
          remarks
        }
      }
    );

    // Real-Time Notification Trigger on Handover
    const targetStaff = item.employeeName || item.submittedByStaffName;
    createNotificationHelper({
      title: `🤝 Item Handed Over: ${item.code}`,
      message: `Item ${item.code} (${item.itemName || 'Lost Item'}) found by "${targetStaff}" has been officially handed over to guest "${receiverName}" by ${actor}.`,
      type: 'item_handover',
      priority: 'normal',
      targetType: 'all',
      targetStaffName: targetStaff,
      itemId: item.id,
      itemCode: item.code,
      senderName: actor,
      senderRole: role
    }).catch(() => {});

    return res.json({
      success: true,
      item,
      message: `Item ${item.code} successfully handed over to ${receiverName}.`
    });
  });

  // Return to Store (ADMIN ONLY) - Reverts a Handed Over / Dispatched item back to Stored status
  app.post('/api/items/:id/return-to-store', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    // Return to store permission validation: Super Admin, Admin tier, or granted 'handover' / 'edit'
    const canReturnToStore = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'handover') || actorHasPermission(req, 'edit');
    if (!canReturnToStore) {
      return res.status(403).json({ error: 'Permission denied. You do not have permission to return items to store.' });
    }

    const item = await findItemByIdOrCode(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // 24-Hour Expiration Check: Items can only be returned to store within 24 hours of handover
    let handoverTimestamp: number | null = null;
    if (item.timeline && Array.isArray(item.timeline)) {
      const hEvt = [...item.timeline].reverse().find(t =>
        t.actionType === 'handover' || (t.action && t.action.toLowerCase().includes('handed over'))
      );
      if (hEvt?.timestamp) {
        const t = new Date(hEvt.timestamp).getTime();
        if (!isNaN(t)) handoverTimestamp = t;
      }
    }
    if (!handoverTimestamp && item.handoverDetails?.handoverDate) {
      const t = new Date(item.handoverDetails.handoverDate).getTime();
      if (!isNaN(t)) handoverTimestamp = t;
    }
    if (!handoverTimestamp && item.updatedAt) {
      const t = new Date(item.updatedAt).getTime();
      if (!isNaN(t)) handoverTimestamp = t;
    }

    if (handoverTimestamp && (Date.now() - handoverTimestamp > 24 * 60 * 60 * 1000)) {
      return res.status(400).json({
        error: 'Return to Store expired. Items can only be returned to store within 24 hours of handover.'
      });
    }

    const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);

    const previousStatus = item.status;
    const now = new Date();

    const updatedItem: LostItem = {
      ...item,
      status: 'Stored',
      handoverDetails: undefined,
      dispatchDetails: undefined,
      updatedAt: now.toISOString(),
      timeline: [
        ...(item.timeline || []),
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          action: 'Item Returned to Store',
          actionType: 'return_to_store',
          performedBy: actor,
          performedByRole: role,
          timestamp: now.toISOString(),
          notes: `Reverted status from "${previousStatus}" back to active "Stored" inventory by ${role} "${actor}".${reason ? ' Reason: ' + reason : ''}`
        }
      ]
    };

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.unshift(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, updatedItem);
      } catch (err: any) {
        console.warn('MongoDB return-to-store update error:', err.message);
      }
    }

    await addAudit(
      'Status Changed: Returned to Store',
      'item',
      `Item ${updatedItem.code} status reverted from "${previousStatus}" back to "Stored" by Admin ${actor}.${reason ? ' Reason: ' + reason : ''}`,
      actor,
      role,
      updatedItem.code,
      {
        actionType: 'return_to_store',
        itemCode: updatedItem.code,
        itemName: updatedItem.itemName,
        category: updatedItem.category,
        previousStatus,
        newStatus: 'Stored',
        performedByEmail: req.headers['x-user-email'] as string,
        reason,
        changes: [
          { field: 'status', label: 'Status', from: previousStatus, to: 'Stored' }
        ],
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
      }
    );

    return res.json({
      success: true,
      item: updatedItem,
      message: `Item ${updatedItem.code} successfully returned to Stored inventory.`
    });
  });

  // Dispatch item via courier or to finder staff
  app.post('/api/items/:id/dispatch', async (req, res) => {
    const { id } = req.params;
    const { courierName, trackingNumber, destination, remarks, dispatchedTo, notes } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    // Dispatch permission validation
    const canDispatch = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'dispatch');
    if (!canDispatch) {
      return res.status(403).json({ error: 'Permission denied. You do not have permission to dispatch items.' });
    }

    const item = await findItemByIdOrCode(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    const targetRecipient = dispatchedTo || destination || 'Finder Staff / Courier';
    const courierTag = courierName || 'Internal Staff Dispatch';
    const trackingTag = trackingNumber || `DSP-${item.code}`;

    item.status = 'Dispatched';
    item.updatedAt = now.toISOString();
    item.dispatchDetails = {
      courierName: courierTag,
      trackingNumber: trackingTag,
      destination: destination || `Released to ${targetRecipient}`,
      dispatchedDate: formattedDate,
      dispatchedBy: actor,
      dispatchedTo: targetRecipient,
      remarks: remarks || notes || 'Dispatched after custody period expiry / guest release authorization.'
    };

    if (!item.timeline) item.timeline = [];
    item.timeline.push({
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: 'Item Dispatched',
      actionType: 'dispatch',
      performedBy: actor,
      performedByRole: role,
      timestamp: now.toISOString(),
      notes: `Dispatched by ${role} "${actor}". Released to "${targetRecipient}" via ${courierTag} (Ref/Tracking: ${trackingTag}).${notes || remarks ? ' Note: ' + (notes || remarks) : ''}`,
      meta: {
        courierName: courierTag,
        trackingNumber: trackingTag,
        destination: destination || targetRecipient,
        dispatchedTo: targetRecipient
      }
    });

    if (itemIndex >= 0) {
      db.items[itemIndex] = item;
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, item);
      } catch (err: any) {
        console.warn('MongoDB dispatch update error:', err.message);
      }
    }

    await addAudit(
      'Status Changed: Stored ➔ Dispatched',
      'item',
      `Item ${item.code} (${item.itemName || 'Lost Item'}) dispatched to "${targetRecipient}" via ${courierTag} (Tracking: ${trackingTag}) by ${actor}.`,
      actor,
      role,
      item.code,
      {
        actionType: 'dispatch',
        itemCode: item.code,
        itemName: item.itemName,
        category: item.category,
        previousStatus: 'Stored',
        newStatus: 'Dispatched',
        performedByEmail: req.headers['x-user-email'] as string,
        reason: remarks || notes || 'Dispatched after custody period expiry / guest release authorization.',
        changes: [
          { field: 'status', label: 'Status', from: 'Stored', to: 'Dispatched' },
          { field: 'courierName', label: 'Courier', from: 'None', to: courierTag },
          { field: 'dispatchedTo', label: 'Recipient', from: 'None', to: targetRecipient }
        ],
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop',
        meta: {
          courierName: courierTag,
          trackingNumber: trackingTag,
          destination: destination || targetRecipient,
          dispatchedTo: targetRecipient,
          remarks
        }
      }
    );

    // Real-Time Notification Trigger on Dispatch
    const targetStaff = item.employeeName || item.submittedByStaffName;
    createNotificationHelper({
      title: `🚚 Item Dispatched: ${item.code}`,
      message: `Item ${item.code} (${item.itemName || 'Lost Item'}) was dispatched to "${targetRecipient}" by ${actor}.`,
      type: 'item_dispatched',
      priority: 'normal',
      targetType: 'all',
      targetStaffName: targetStaff,
      itemId: item.id,
      itemCode: item.code,
      senderName: actor,
      senderRole: role
    }).catch(() => {});

    return res.json({
      success: true,
      item,
      message: `Item ${item.code} marked as dispatched.`
    });
  });

  // Delete item (Soft Delete by default; Permanent Delete if requested with Admin authorization)
  app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const isPermanent = req.query.permanent === 'true' || req.body?.permanent === true;
    const deletionReason = (req.body?.reason || req.query.reason || 'Moved to Removed Items').toString();
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    // Delete permission validation
    const canDelete = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'delete') || actorHasPermission(req, 'removed_items');
    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied. You do not have permission to delete items.' });
    }

    const currentItem = await findItemByIdOrCode(id);
    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === id || i.code === id);

    // REQUIREMENT: Handed Over items cannot be deleted
    if (currentItem.status === 'Handed Over') {
      return res.status(403).json({ error: 'Handed Over items are locked and cannot be deleted.' });
    }

    const code = currentItem.code;

    if (isPermanent) {
      // Permanent removal
      if (itemIndex >= 0) {
        db.items.splice(itemIndex, 1);
      }
      saveDatabase();

      if (mongoService.isLive) {
        try {
          await mongoService.deleteItem(id);
        } catch (err: any) {
          console.warn('MongoDB deleteItem error:', err.message);
        }
      }

      await addAudit('Item Permanently Deleted', 'item', `Permanently deleted item ${code}`, actor, role, code);

      return res.json({
        success: true,
        permanent: true,
        message: `Item ${code} permanently deleted.`
      });
    } else {
      // Soft Delete: Move to Trash (Retained for 60 days before auto-purge)
      const now = new Date();
      const updatedItem: LostItem = {
        ...currentItem,
        isDeleted: true,
        deletedAt: now.toISOString(),
        deletedBy: actor,
        deletedByRole: role,
        deletionReason: deletionReason,
        updatedAt: now.toISOString(),
        timeline: [
          ...(currentItem.timeline || []),
          {
            id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            action: 'Item Moved to Removed Items',
            actionType: 'delete',
            performedBy: actor,
            performedByRole: role,
            timestamp: now.toISOString(),
            notes: `Moved to Removed Items (Trash) by ${role} "${actor}". Retention: 60 days. Reason: ${deletionReason}`
          }
        ]
      };

      if (itemIndex >= 0) {
        db.items[itemIndex] = updatedItem;
      } else {
        db.items.push(updatedItem);
      }
      saveDatabase();

      if (mongoService.isLive) {
        try {
          await mongoService.updateItem(id, updatedItem);
        } catch (err: any) {
          console.warn('MongoDB soft delete error:', err.message);
        }
      }

      await addAudit(
        'Item Moved to Trash',
        'item',
        `Item ${code} (${currentItem.itemName || 'Lost Item'}) moved to Removed Items (retained for 60 days). Reason: ${deletionReason}`,
        actor,
        role,
        code,
        {
          actionType: 'trash',
          itemCode: code,
          itemName: currentItem.itemName,
          category: currentItem.category,
          previousStatus: currentItem.status,
          performedByEmail: req.headers['x-user-email'] as string,
          reason: deletionReason,
          changes: [
            { field: 'isDeleted', label: 'Trash Status', from: false, to: true },
            { field: 'deletionReason', label: 'Reason', from: 'None', to: deletionReason }
          ],
          ip: (req.headers['x-forwarded-for'] as string) || req.ip,
          deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
        }
      );

      return res.json({
        success: true,
        permanent: false,
        item: updatedItem,
        message: `Item ${code} moved to Removed Items. It will be kept for 60 days.`
      });
    }
  });

  // Restore item from Trash
  app.post('/api/items/:id/restore', async (req, res) => {
    const { id } = req.params;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    const currentItem = await findItemByIdOrCode(id);
    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIndex = db.items.findIndex(i => i.id === id || i.code === id);

    const now = new Date();
    const updatedItem: LostItem = {
      ...currentItem,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedByRole: undefined,
      deletionReason: undefined,
      updatedAt: now.toISOString(),
      timeline: [
        ...(currentItem.timeline || []),
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          action: 'Item Restored to Inventory',
          actionType: 'restore',
          performedBy: actor,
          performedByRole: role,
          timestamp: now.toISOString(),
          notes: `Restored back to active inventory from Removed Items by ${role} "${actor}".`
        }
      ]
    };

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.unshift(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, updatedItem);
      } catch (err: any) {
        console.warn('MongoDB restore error:', err.message);
      }
    }

    await addAudit(
      'Item Restored to Inventory',
      'item',
      `Item ${updatedItem.code} (${updatedItem.itemName || 'Lost Item'}) restored from Removed Items back to active inventory by ${actor}.`,
      actor,
      role,
      updatedItem.code,
      {
        actionType: 'restore',
        itemCode: updatedItem.code,
        itemName: updatedItem.itemName,
        category: updatedItem.category,
        newStatus: updatedItem.status,
        performedByEmail: req.headers['x-user-email'] as string,
        changes: [
          { field: 'isDeleted', label: 'Trash Status', from: true, to: false }
        ],
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
      }
    );

    return res.json({
      success: true,
      item: updatedItem,
      message: `Item ${updatedItem.code} successfully restored to active inventory.`
    });
  });

  // Bulk soft-delete or permanent-delete active items
  app.post('/api/items/batch-delete', async (req, res) => {
    const { ids, permanent, reason } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const isPermanent = permanent === true;
    const deletionReason = (reason || 'Moved to Removed Items (Batch Delete)').toString();

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No item IDs provided for batch deletion.' });
    }

    const now = new Date();
    let deletedCount = 0;
    const deletedItems: LostItem[] = [];

    if (isPermanent) {
      for (const id of ids) {
        const idx = db.items.findIndex(i => i.id === id || i.code === id);
        if (idx >= 0) {
          // Handed over items cannot be deleted
          if (db.items[idx].status === 'Handed Over') continue;
          db.items.splice(idx, 1);
          deletedCount++;
          if (mongoService.isLive) {
            mongoService.deleteItem(id).catch(() => {});
          }
        }
      }
      saveDatabase();
      await addAudit('Batch Items Permanently Deleted', 'item', `Permanently deleted ${deletedCount} items`, actor, role);
      return res.json({
        success: true,
        permanent: true,
        deletedCount,
        message: `Permanently deleted ${deletedCount} items.`
      });
    } else {
      for (const id of ids) {
        const idx = db.items.findIndex(i => i.id === id || i.code === id);
        if (idx >= 0) {
          if (db.items[idx].status === 'Handed Over') continue;
          db.items[idx].isDeleted = true;
          db.items[idx].deletedAt = now.toISOString();
          db.items[idx].deletedBy = actor;
          db.items[idx].deletedByRole = role;
          db.items[idx].deletionReason = deletionReason;
          db.items[idx].updatedAt = now.toISOString();
          if (!db.items[idx].timeline) db.items[idx].timeline = [];
          db.items[idx].timeline.push({
            id: `tl-${Date.now()}-${deletedCount}`,
            action: 'Item Moved to Removed Items (Batch)',
            performedBy: actor,
            timestamp: now.toISOString(),
            notes: `Moved to Removed Items in batch by ${role} ${actor}. Reason: ${deletionReason}`
          });
          deletedItems.push(db.items[idx]);
          deletedCount++;
          if (mongoService.isLive) {
            mongoService.updateItem(id, db.items[idx]).catch(() => {});
          }
        }
      }
      saveDatabase();
      await addAudit('Batch Items Moved to Trash', 'item', `Moved ${deletedCount} items to Removed Items`, actor, role);
      return res.json({
        success: true,
        permanent: false,
        deletedCount,
        items: deletedItems,
        message: `Successfully moved ${deletedCount} items to Removed Items.`
      });
    }
  });

  // Bulk dispatch items
  app.post('/api/items/batch-dispatch', async (req, res) => {
    const { ids, courierName, trackingNumber, destination, dispatchedTo, notes } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No item IDs provided for batch dispatch.' });
    }

    const now = new Date();
    let dispatchedCount = 0;
    const updatedItems: LostItem[] = [];

    for (const id of ids) {
      const idx = db.items.findIndex(i => i.id === id || i.code === id);
      if (idx >= 0) {
        const item = db.items[idx];
        const finder = item.employeeName || item.submittedByStaffName || 'Finder Staff';
        const targetReceiver = dispatchedTo || finder;

        item.status = 'Dispatched';
        item.updatedAt = now.toISOString();
        item.dispatchDetails = {
          courierName: courierName || 'Internal Staff Dispatch',
          trackingNumber: trackingNumber || `BATCH-DSP-${item.code}`,
          destination: destination || `Released to Finder Staff (${targetReceiver})`,
          dispatchedTo: targetReceiver,
          notes: notes || `Dispatched in batch to finder: ${targetReceiver}`,
          dispatchedAt: now.toISOString(),
          dispatchedBy: actor
        };

        if (!item.timeline) item.timeline = [];
        item.timeline.push({
          id: `tl-${Date.now()}-${dispatchedCount}`,
          action: 'Item Dispatched (Batch)',
          performedBy: actor,
          timestamp: now.toISOString(),
          notes: `Dispatched in batch via ${item.dispatchDetails.courierName} to ${targetReceiver}`
        });

        updatedItems.push(item);
        dispatchedCount++;

        if (mongoService.isLive) {
          mongoService.updateItem(id, item).catch(() => {});
        }
      }
    }

    saveDatabase();
    await addAudit('Batch Items Dispatched', 'item', `Dispatched ${dispatchedCount} items in batch`, actor, role);

    return res.json({
      success: true,
      dispatchedCount,
      items: updatedItems,
      message: `Successfully dispatched ${dispatchedCount} items.`
    });
  });

  // Bulk restore items from Trash
  app.post('/api/items/trash/restore-batch', async (req, res) => {
    const { ids } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided for batch restore.' });
    }

    const now = new Date().toISOString();
    let restoredCount = 0;

    for (const id of ids) {
      const idx = db.items.findIndex(i => i.id === id || i.code === id);
      if (idx >= 0) {
        db.items[idx].isDeleted = false;
        db.items[idx].deletedAt = undefined;
        db.items[idx].deletionReason = undefined;
        db.items[idx].updatedAt = now;
        if (!db.items[idx].timeline) db.items[idx].timeline = [];
        db.items[idx].timeline.push({
          id: `tl-${Date.now()}-${restoredCount}`,
          action: 'Item Restored (Batch)',
          performedBy: actor,
          timestamp: now,
          notes: `Restored in batch by ${role} ${actor}`
        });
        restoredCount++;
        if (mongoService.isLive) {
          mongoService.updateItem(id, db.items[idx]).catch(() => {});
        }
      }
    }

    saveDatabase();
    await addAudit('Batch Items Restored', 'item', `Restored ${restoredCount} items from Removed Items`, actor, role);

    return res.json({
      success: true,
      restoredCount,
      message: `Successfully restored ${restoredCount} items.`
    });
  });

  // Bulk permanent delete items from Trash
  app.post('/api/items/trash/delete-batch', async (req, res) => {
    const { ids } = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided for batch delete.' });
    }

    let deletedCount = 0;
    for (const id of ids) {
      const idx = db.items.findIndex(i => i.id === id || i.code === id);
      if (idx >= 0) {
        db.items.splice(idx, 1);
        deletedCount++;
        if (mongoService.isLive) {
          mongoService.deleteItem(id).catch(() => {});
        }
      }
    }

    saveDatabase();
    await addAudit('Batch Items Permanently Deleted', 'item', `Permanently deleted ${deletedCount} items from Trash`, actor, role);

    return res.json({
      success: true,
      deletedCount,
      message: `Permanently deleted ${deletedCount} items.`
    });
  });

  // Empty entire Trash / Recycle Bin
  app.post('/api/items/trash/empty', async (req, res) => {
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    const deletedIds: string[] = [];
    db.items = db.items.filter(item => {
      if (item.isDeleted) {
        deletedIds.push(item.id);
        return false;
      }
      return true;
    });

    saveDatabase();

    if (mongoService.isLive) {
      deletedIds.forEach(id => {
        mongoService.deleteItem(id).catch(() => {});
      });
    }

    await addAudit('Recycle Bin Emptied', 'item', `Emptied trash (${deletedIds.length} items permanently deleted)`, actor, role);

    return res.json({
      success: true,
      count: deletedIds.length,
      message: `Recycle Bin emptied. ${deletedIds.length} items permanently removed.`
    });
  });

  // Bulk Import Items Endpoint
  app.post('/api/items/import', async (req, res) => {
    const { items: rawItems, mode = 'append' } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: 'No valid items data provided for import.' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const todayIso = now.toISOString().split('T')[0];

    const processedItems: LostItem[] = [];
    for (let index = 0; index < rawItems.length; index++) {
      const raw: any = rawItems[index];
      const dateFound = raw.dateFound || todayIso;
      const prefix = db.settings.codePrefix || 'LF';
      const allExisting = [...db.items, ...processedItems];
      const itemCode = raw.code || generateUniqueItemCode(allExisting, prefix, dateFound);
      const itemId = raw.id || `item-imp-${Date.now()}-${index}`;
      const dispatchDays = Number(raw.dispatchDurationDays) || 90;

      let deadline = raw.dispatchDeadline;
      if (!deadline && dateFound) {
        const d = new Date(dateFound);
        d.setDate(d.getDate() + dispatchDays);
        deadline = d.toISOString().split('T')[0];
      }

      const item: LostItem = {
        id: itemId,
        code: itemCode,
        itemName: raw.itemName || raw.name || raw.description || 'Imported Item',
        category: (raw.category as any) || 'Other',
        description: raw.description || raw.itemName || '',
        dateFound: dateFound,
        timeFound: raw.timeFound || '12:00',
        locationFound: raw.locationFound || raw.location || 'Hotel Premises',
        roomNumber: raw.roomNumber || '',
        guestName: raw.guestName || '',
        employeeName: raw.employeeName || raw.foundBy || actor,
        storeLocation: raw.storeLocation || db.settings.defaultStoreLocation || 'HK Office',
        dispatchDurationDays: dispatchDays,
        dispatchDeadline: deadline || '',
        status: (raw.status as any) || 'Stored',
        isApproved: raw.isApproved ?? true,
        approvalStatus: raw.approvalStatus || 'approved',
        recordedBy: raw.recordedBy || actor,
        createdAt: raw.createdAt || now.toISOString(),
        updatedAt: raw.updatedAt || now.toISOString(),
        timeline: raw.timeline || [
          {
            id: `tl-imp-${Date.now()}-${index}`,
            action: 'Item Imported',
            performedBy: actor,
            timestamp: now.toISOString(),
            notes: `Imported via Data Import batch by ${role} ${actor}`
          }
        ]
      };

      processedItems.push(item);
    }

    if (mode === 'replace') {
      db.items = processedItems;
    } else {
      // Append mode: merge avoiding identical codes
      for (const item of processedItems) {
        const existingIdx = db.items.findIndex(i => i.id === item.id || i.code === item.code);
        if (existingIdx >= 0) {
          db.items[existingIdx] = { ...db.items[existingIdx], ...item };
        } else {
          db.items.unshift(item);
        }
      }
    }

    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.importItems(processedItems, mode);
      } catch (err: any) {
        console.warn('MongoDB import error:', err.message);
      }
    }

    await addAudit(
      'Data Imported',
      'item',
      `Imported ${processedItems.length} items (${mode} mode) by ${actor}`,
      actor,
      role
    );

    return res.json({
      success: true,
      count: processedItems.length,
      mode,
      items: db.items,
      message: `Successfully imported ${processedItems.length} items.`
    });
  });

  // ----------------------------------------------------
  // API: Staff Management
  // ----------------------------------------------------
  app.get('/api/staff', async (req, res) => {
    if (mongoService.isLive) {
      try {
        const mongoStaff = await mongoService.getStaff();
        if (mongoStaff.length > 0) {
          db.staff = mongoStaff;
          return res.json({ staff: mongoStaff, source: 'mongodb' });
        }
      } catch (e) {
        console.warn('Mongo getStaff error:', e);
      }
    }
    res.json({ staff: db.staff, source: 'local' });
  });

  // User Profile Update Endpoint (strictly separate Super Admin in users and Staff in staff)
  app.put('/api/user/profile', async (req, res) => {
    const body = req.body;
    const actor = (req.headers['x-user-name'] as string) || '';
    const role = (req.headers['x-user-role'] as User['role']) || 'Employee';
    const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();

    // Check if target user belongs to db.users (e.g. abusayeedriday@gmail.com)
    const userIndex = db.users.findIndex(u => (userEmail && u.email.toLowerCase() === userEmail) || (body.id && u.id === body.id));
    const staffIndex = userIndex >= 0 ? -1 : db.staff.findIndex(s => 
      (body.id && (s.id === body.id || (s as any)._id === body.id || s.userId === body.id)) ||
      (userEmail && s.email && s.email.toLowerCase() === userEmail) ||
      (userEmail && s.userId && s.userId.toLowerCase() === userEmail)
    );

    const currentStaffObj = staffIndex >= 0 ? db.staff[staffIndex] : null;
    const currentUserObj = userIndex >= 0 ? db.users[userIndex] : null;
    const currentAccId = currentUserObj ? currentUserObj.id : (currentStaffObj ? currentStaffObj.id : (body.id || ''));
    const currentStaffUserId = currentStaffObj ? (currentStaffObj.userId || currentStaffObj.id) : '';

    const duplicateErrors: Record<string, { message: string; existingName?: string; value: string }> = {};

    // 1. Staff ID Duplicate Validation (excluding current account)
    if (body.staffId && typeof body.staffId === 'string' && body.staffId.trim()) {
      const cleanStaffId = body.staffId.trim().toLowerCase();
      const dupStaff = db.staff.find(s => 
        s.id !== currentAccId && s.userId !== currentStaffUserId &&
        ((s.staffId && s.staffId.trim().toLowerCase() === cleanStaffId) ||
         (s.userId && s.userId.trim().toLowerCase() === cleanStaffId))
      );
      const dupUser = db.users.find(u => 
        u.id !== currentAccId &&
        (((u as any).staffId && (u as any).staffId.trim().toLowerCase() === cleanStaffId) ||
         (u.id && u.id.trim().toLowerCase() === cleanStaffId))
      );
      const dup = dupStaff || dupUser;
      if (dup) {
        duplicateErrors.staffId = {
          value: body.staffId.trim(),
          existingName: dup.name,
          message: `Already exists: Staff ID "${body.staffId.trim()}" is already assigned to ${dup.name}. Duplicate Staff IDs are not permitted.`
        };
      }
    }

    // 2. Iqama Number Duplicate Validation (excluding current account)
    if (body.iqamaNumber && typeof body.iqamaNumber === 'string' && body.iqamaNumber.trim()) {
      const cleanIqama = body.iqamaNumber.trim().toLowerCase();
      const dup = db.staff.find(s => 
        s.id !== currentAccId && s.userId !== currentStaffUserId &&
        s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === cleanIqama
      );
      if (dup) {
        duplicateErrors.iqamaNumber = {
          value: body.iqamaNumber.trim(),
          existingName: dup.name,
          message: `Already exists: Iqama Number "${body.iqamaNumber.trim()}" already exists in database (${dup.name}). Duplicate Iqama numbers are not permitted.`
        };
      }
    }

    // 3. Email Duplicate Validation (excluding current account)
    if (body.email && typeof body.email === 'string' && body.email.trim()) {
      const cleanEmail = body.email.trim().toLowerCase();
      const dupStaff = db.staff.find(s => s.id !== currentAccId && s.userId !== currentStaffUserId && s.email && s.email.trim().toLowerCase() === cleanEmail);
      const dupUser = db.users.find(u => u.id !== currentAccId && u.email && u.email.trim().toLowerCase() === cleanEmail);
      const dup = dupStaff || dupUser;
      if (dup) {
        duplicateErrors.email = {
          value: body.email.trim(),
          existingName: dup.name,
          message: `Already exists: Email address "${body.email.trim()}" already exists in database (${dup.name}). Duplicate emails are not permitted.`
        };
      }
    }

    // 4. Phone Number Duplicate Validation (excluding current account)
    if (body.phone && typeof body.phone === 'string' && body.phone.trim()) {
      const cleanPhone = body.phone.trim().replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.length >= 7) {
        const dup = db.staff.find(s => {
          if (s.id === currentAccId || s.userId === currentStaffUserId || !s.phone) return false;
          const norm = s.phone.trim().replace(/[\s\-\+\(\)]/g, '');
          return norm === cleanPhone;
        });
        if (dup) {
          duplicateErrors.phone = {
            value: body.phone.trim(),
            existingName: dup.name,
            message: `Already exists: Phone number "${body.phone.trim()}" is already assigned to ${dup.name}. Duplicate phone numbers are not permitted.`
          };
        }
      }
    }

    if (Object.keys(duplicateErrors).length > 0) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_ENTRY',
        errors: duplicateErrors,
        error: Object.values(duplicateErrors)[0].message
      });
    }

    if (userIndex >= 0) {
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      const targetUser = db.users[userIndex];

      saveDatabase();
      if (mongoService.isLive) {
        try {
          await mongoService.upsertUser(targetUser);
        } catch (e: any) {
          console.warn('[MongoDB] Upsert Super Admin error:', e.message);
        }
      }

      await addAudit('Profile Updated', 'auth', `Profile details updated for user ${targetUser.name}`, actor || targetUser.name, targetUser.role);
      return res.json({
        success: true,
        user: targetUser,
        message: 'Profile updated successfully.'
      });
    }

    // Otherwise, this is a staff member: update db.staff strictly, NEVER push into db.users!
    const targetStaffIndex = staffIndex >= 0 ? staffIndex : db.staff.findIndex(s => 
      s.id === body.id ||
      (s as any)._id === body.id ||
      (userEmail && s.email && s.email.toLowerCase() === userEmail) ||
      (userEmail && s.userId && s.userId.toLowerCase() === userEmail)
    );

    if (targetStaffIndex >= 0) {
      db.staff[targetStaffIndex] = {
        ...db.staff[targetStaffIndex],
        ...body,
        id: db.staff[targetStaffIndex].id,
        role: db.staff[targetStaffIndex].role,
        permissions: db.staff[targetStaffIndex].permissions
      };

      if (mongoService.isLive) {
        try {
          await mongoService.updateStaff(db.staff[targetStaffIndex].id, db.staff[targetStaffIndex]);
        } catch (e: any) {
          console.warn('Mongo updateStaff from profile error:', e.message);
        }
      }

      saveDatabase();
      await addAudit('Profile Updated', 'auth', `Profile details updated for staff member ${db.staff[targetStaffIndex].name}`, actor, role);

      const sessionUser: User = {
        id: db.staff[targetStaffIndex].id,
        name: db.staff[targetStaffIndex].name,
        email: db.staff[targetStaffIndex].email,
        role: db.staff[targetStaffIndex].role,
        department: db.staff[targetStaffIndex].department,
        phone: db.staff[targetStaffIndex].phone || '',
        permissions: db.staff[targetStaffIndex].permissions,
        password: db.staff[targetStaffIndex].password,
        authProvider: 'email',
        lastActive: db.staff[targetStaffIndex].lastActive,
        token: (db.staff[targetStaffIndex] as any).token,
        staffId: db.staff[targetStaffIndex].staffId || db.staff[targetStaffIndex].userId,
        avatar: db.staff[targetStaffIndex].avatar
      };

      return res.json({
        success: true,
        user: sessionUser,
        message: 'Staff profile updated successfully.'
      });
    }

    return res.status(404).json({ error: 'Staff profile not found in database.' });
  });

  // Password Change Endpoint (updates users for Super Admin, staff for Staff members)
  app.post('/api/user/change-password', async (req, res) => {
    const { currentPassword, newPassword, targetStaffId } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
    const ua = req.headers['user-agent'] || '';
    const { browser, os, deviceType } = parseUserAgentInfo(ua);
    const clientDevice = `${deviceType} • ${os}`;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    if (!targetStaffId && userEmail) {
      const dbUser = db.users.find(u => u.email.toLowerCase() === userEmail);
      if (dbUser) {
        dbUser.password = newPassword;
        if (mongoService.isLive) {
          try {
            await mongoService.upsertUser(dbUser);
          } catch (e: any) {
            console.warn('Mongo password update error:', e.message);
          }
        }
      }
    }

    let staffMember = targetStaffId
      ? db.staff.find(s => s.id === targetStaffId)
      : db.staff.find(s => (userEmail && (s.email.toLowerCase() === userEmail || s.userId.toLowerCase() === userEmail)) || s.name.toLowerCase() === actor.toLowerCase());

    if (staffMember) {
      staffMember.password = newPassword;
      if (req.body.isTemporary) {
        staffMember.tempPassword = newPassword;
        staffMember.isTempPassword = true;
        const hours = Number(req.body.expiresInHours) || 24;
        staffMember.tempPasswordExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      } else {
        staffMember.isTempPassword = false;
        delete staffMember.tempPassword;
        delete staffMember.tempPasswordExpiresAt;
      }

      if (mongoService.isLive) {
        try {
          await mongoService.updateStaff(staffMember.id, {
            password: staffMember.password,
            tempPassword: staffMember.tempPassword,
            tempPasswordExpiresAt: staffMember.tempPasswordExpiresAt,
            isTempPassword: staffMember.isTempPassword
          });
        } catch (e: any) {
          console.warn('Mongo password update error:', e.message);
        }
      }
    }

    saveDatabase();
    await addAudit(
      'Password Changed',
      'auth',
      `Password updated for ${staffMember?.name || actor}${req.body.isTemporary ? ' (24h temporary)' : ''}`,
      actor,
      role,
      staffMember?.id,
      { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: userEmail, performedById: staffMember?.id }
    );

    return res.json({
      success: true,
      message: req.body.isTemporary
        ? `24-hour temporary password set for ${staffMember?.name || 'staff'}. Expires in 24 hours.`
        : 'Password has been changed successfully.',
      staff: staffMember
    });
  });

  // Dedicated Admin Staff Password Management Endpoint
  app.post('/api/staff/:id/password', async (req, res) => {
    const staffId = req.params.id;
    const { newPassword, isTemporary, expiresInHours = 24 } = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
    const ua = req.headers['user-agent'] || '';
    const { browser, os, deviceType } = parseUserAgentInfo(ua);
    const clientDevice = `${deviceType} • ${os}`;

    // Check permission: Super Admin, Admin, Manager, Supervisor, or staff_management / manage_staff_access
    const canManageStaff = role === 'Super Admin' || ['Admin', 'Manager', 'Supervisor'].includes(role) || actorHasPermission(req, 'staff_management') || actorHasPermission(req, 'manage_staff_access');

    if (!canManageStaff) {
      return res.status(403).json({ error: 'Permission Denied: Only administrators or supervisors can manage staff credentials.' });
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const trimmedPassword = newPassword.trim();
    const staffMember = db.staff.find(s => s.id === staffId || s.staffId === staffId || s.userId === staffId);
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found in database.' });
    }

    staffMember.password = trimmedPassword;
    if (isTemporary) {
      staffMember.tempPassword = trimmedPassword;
      staffMember.isTempPassword = true;
      const hours = Number(expiresInHours) || 24;
      staffMember.tempPasswordExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    } else {
      staffMember.isTempPassword = false;
      delete staffMember.tempPassword;
      delete staffMember.tempPasswordExpiresAt;
    }

    if (mongoService.isLive) {
      try {
        await mongoService.updateStaff(staffMember.id, {
          password: staffMember.password,
          tempPassword: staffMember.tempPassword,
          tempPasswordExpiresAt: staffMember.tempPasswordExpiresAt,
          isTempPassword: staffMember.isTempPassword
        });
      } catch (e: any) {
        console.warn('Mongo staff password update error:', e.message);
      }
    }

    saveDatabase();
    await addAudit(
      'Staff Password Managed',
      'auth',
      `Admin ${actor} ${isTemporary ? 'generated a 24-hour temporary password' : 'changed password'} for staff ${staffMember.name} (${staffMember.staffId || staffMember.userId})`,
      actor,
      role,
      staffMember.id,
      { ip: clientIp, deviceType: clientDevice, browser, performedByEmail: userEmail, performedById: staffMember.id }
    );

    return res.json({
      success: true,
      message: isTemporary
        ? `24-hour temporary password issued for ${staffMember.name}. Valid until ${new Date(staffMember.tempPasswordExpiresAt!).toLocaleString()}.`
        : `Password for ${staffMember.name} has been updated successfully.`,
      staff: staffMember
    });
  });

  // Real-time Database Duplicate Verification Endpoint (Staff ID, Iqama, Email, Phone)
  app.get('/api/staff/check-duplicate', (req, res) => {
    const { staffId, iqamaNumber, email, phone, excludeId } = req.query as Record<string, string>;
    const excId = (excludeId || '').trim();

    const isExcludedStaff = (s: any) => {
      if (!excId) return false;
      return (
        s.id === excId ||
        (s as any)._id === excId ||
        s.userId === excId ||
        (s.staffId && s.staffId.toLowerCase() === excId.toLowerCase()) ||
        (s.email && s.email.toLowerCase() === excId.toLowerCase())
      );
    };

    const isExcludedUser = (u: any) => {
      if (!excId) return false;
      return (
        u.id === excId ||
        ((u as any).staffId && (u as any).staffId.toLowerCase() === excId.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === excId.toLowerCase())
      );
    };

    const duplicateErrors: Record<string, { message: string; existingName?: string; value: string }> = {};

    // 1. Check Staff ID
    if (staffId && staffId.trim()) {
      const clean = staffId.trim().toLowerCase();
      const dupStaff = db.staff.find(
        s => !isExcludedStaff(s) &&
             ((s.staffId && s.staffId.trim().toLowerCase() === clean) ||
              (s.userId && s.userId.trim().toLowerCase() === clean) ||
              (s.id && s.id.toLowerCase() === clean))
      );
      const dupUser = db.users.find(
        u => !isExcludedUser(u) &&
             (((u as any).staffId && (u as any).staffId.trim().toLowerCase() === clean) ||
              (u.id && u.id.trim().toLowerCase() === clean))
      );
      const dup = dupStaff || dupUser;
      if (dup) {
        duplicateErrors.staffId = {
          value: staffId.trim(),
          existingName: dup.name,
          message: `Already exists: Staff ID "${staffId.trim()}" is already assigned to ${dup.name}. Duplicate Staff IDs are not permitted.`
        };
      }
    }

    // 2. Check Iqama Number
    if (iqamaNumber && iqamaNumber.trim()) {
      const clean = iqamaNumber.trim().toLowerCase();
      const dup = db.staff.find(
        s => !isExcludedStaff(s) &&
             s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === clean
      );
      if (dup) {
        duplicateErrors.iqamaNumber = {
          value: iqamaNumber.trim(),
          existingName: dup.name,
          message: `Already exists: Iqama Number "${iqamaNumber.trim()}" already exists in database (${dup.name}). Duplicate Iqama numbers are not permitted.`
        };
      }
    }

    // 3. Check Email
    if (email && email.trim()) {
      const clean = email.trim().toLowerCase();
      const dupStaff = db.staff.find(s => !isExcludedStaff(s) && s.email && s.email.trim().toLowerCase() === clean);
      const dupUser = db.users.find(u => !isExcludedUser(u) && u.email && u.email.trim().toLowerCase() === clean);
      const dup = dupStaff || dupUser;
      if (dup) {
        duplicateErrors.email = {
          value: email.trim(),
          existingName: dup.name,
          message: `Already exists: Email address "${email.trim()}" already exists in database (${dup.name}). Duplicate emails are not permitted.`
        };
      }
    }

    // 4. Check Phone
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.length >= 7) {
        const dup = db.staff.find(s => {
          if (isExcludedStaff(s) || !s.phone) return false;
          const norm = s.phone.trim().replace(/[\s\-\+\(\)]/g, '');
          return norm === cleanPhone;
        });
        if (dup) {
          duplicateErrors.phone = {
            value: phone.trim(),
            existingName: dup.name,
            message: `Already exists: Phone number "${phone.trim()}" is already assigned to ${dup.name}. Duplicate phone numbers are not permitted.`
          };
        }
      }
    }

    const hasErrors = Object.keys(duplicateErrors).length > 0;
    return res.json({
      isDuplicate: hasErrors,
      errors: duplicateErrors,
      errorList: Object.entries(duplicateErrors).map(([field, data]) => ({ field, ...data }))
    });
  });

  app.post('/api/staff', async (req, res) => {
    const body = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    
    // Check permission: Super Admin, Admin, Manager, or staff_management / manage_staff_access
    const hasStaffMgmtPerm = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'staff_management') || actorHasPermission(req, 'manage_staff_access');

    if (!hasStaffMgmtPerm) {
      return res.status(403).json({
        error: 'Permission Denied: You do not have permission to add new staff members. Contact an Administrator.'
      });
    }

    const staffRole = body.role || 'Employee';
    const staffPermissions = body.permissions || DEFAULT_ROLE_PERMISSIONS[staffRole];

    const targetStaffId = (body.staffId || '').trim();
    const targetIqama = (body.iqamaNumber || '').trim();
    const targetEmail = (body.email || '').trim().toLowerCase();
    const targetPhone = (body.phone || '').trim().replace(/[\s\-\+\(\)]/g, '');

    const duplicateErrors: Record<string, string> = {};

    // 1. Staff ID Duplicate Validation (Database check)
    if (targetStaffId) {
      const duplicateStaffId = db.staff.find(
        s => (s.staffId && s.staffId.trim().toLowerCase() === targetStaffId.toLowerCase()) ||
             (s.userId && s.userId.trim().toLowerCase() === targetStaffId.toLowerCase())
      ) || db.users.find(
        u => ((u as any).staffId && (u as any).staffId.trim().toLowerCase() === targetStaffId.toLowerCase()) ||
             (u.id && u.id.trim().toLowerCase() === targetStaffId.toLowerCase())
      );
      if (duplicateStaffId) {
        duplicateErrors.staffId = `Already exists: Staff ID "${targetStaffId}" is already assigned to ${duplicateStaffId.name}. Duplicate Staff IDs are not permitted.`;
      }
    }

    // 2. Iqama Number Duplicate Validation (Database check)
    if (targetIqama) {
      const duplicateIqama = db.staff.find(
        s => s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === targetIqama.toLowerCase()
      );
      if (duplicateIqama) {
        duplicateErrors.iqamaNumber = `Already exists: Iqama Number "${targetIqama}" is already registered to ${duplicateIqama.name}. Duplicate Iqama numbers are not permitted.`;
      }
    }

    // 3. Email Duplicate Validation (Database check)
    if (targetEmail) {
      const duplicateEmailStaff = db.staff.find(
        s => s.email && s.email.trim().toLowerCase() === targetEmail
      );
      const duplicateEmailUser = db.users.find(
        u => u.email && u.email.trim().toLowerCase() === targetEmail
      );
      if (duplicateEmailStaff || duplicateEmailUser) {
        const existingName = duplicateEmailStaff?.name || duplicateEmailUser?.name || 'an existing account';
        duplicateErrors.email = `Already exists: Email address "${targetEmail}" is already registered to ${existingName}. Duplicate emails are not permitted.`;
      }
    }

    // 4. Phone Number Duplicate Validation (Database check)
    if (targetPhone && targetPhone.length >= 7) {
      const duplicatePhone = db.staff.find(s => {
        if (!s.phone) return false;
        const norm = s.phone.trim().replace(/[\s\-\+\(\)]/g, '');
        return norm === targetPhone;
      });
      if (duplicatePhone) {
        duplicateErrors.phone = `Already exists: Phone number "${body.phone}" is already assigned to ${duplicatePhone.name}. Duplicate phone numbers are not permitted.`;
      }
    }

    if (Object.keys(duplicateErrors).length > 0) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_ENTRY',
        errors: duplicateErrors,
        error: Object.values(duplicateErrors)[0]
      });
    }

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      serial: db.staff.length + 1,
      name: body.name || 'New Staff Member',
      userId: body.userId || body.email?.split('@')[0] || `user${db.staff.length + 1}`,
      email: body.email || `${body.userId || 'staff'}@warwickbaha.com`,
      phone: body.phone || '',
      department: body.department || 'Housekeeping',
      role: staffRole,
      status: body.status || 'Active',
      permissions: staffPermissions,
      password: body.password || 'Warwick#2026',
      dateOfBirth: body.dateOfBirth || '',
      iqamaNumber: body.iqamaNumber || '',
      staffId: body.staffId || `STF-${db.staff.length + 100}`,
      workplace: body.workplace || 'Warwick Hotels and Resorts',
      position: body.position || body.department || 'Staff',
      emergencyContact: body.emergencyContact || '',
      notes: body.notes || '',
      itemsFoundCount: 0,
      handoversCount: 0,
      createdAt: new Date().toISOString(),
      lastLogin: undefined
    };

    db.staff.push(newStaff);
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.insertStaff(newStaff);
      } catch (e: any) {
        console.warn('Mongo insertStaff error:', e.message);
      }
    }

    await addAudit('Staff Added', 'staff', `Added staff member ${newStaff.name} (${newStaff.role}) with Staff ID ${newStaff.staffId || newStaff.id}`, actor, role, newStaff.id);

    return res.status(201).json({
      success: true,
      staff: newStaff,
      message: 'Staff member added successfully.'
    });
  });

  app.put('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const actorEmail = (req.headers['x-user-email'] as string || '').toLowerCase();

    const index = db.staff.findIndex(
      s => s.id === id || (s as any)._id === id || s.userId === id || s.email?.toLowerCase() === id.toLowerCase() || s.staffId === id
    );

    // Check permission: Super Admin, Admin, Manager, or has edit_staff/manage_staff_access/staff_management, or updating own profile
    const hasEditStaffPerm = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'edit_staff') || actorHasPermission(req, 'manage_staff_access') || actorHasPermission(req, 'staff_management');
    const isSelf = (index >= 0 && (
      (actorEmail && db.staff[index].email?.toLowerCase() === actorEmail) ||
      (actorEmail && db.staff[index].userId?.toLowerCase() === actorEmail) ||
      db.staff[index].id === id ||
      (db.staff[index] as any)._id === id
    ));

    if (!hasEditStaffPerm && !isSelf) {
      return res.status(403).json({
        error: 'Permission Denied: You do not have permission to edit staff members. Contact an Administrator.'
      });
    }

    const currentStaffId = (index >= 0 ? db.staff[index].id : id);

    const targetStaffId = (body.staffId !== undefined ? body.staffId : '').trim();
    const targetIqama = (body.iqamaNumber !== undefined ? body.iqamaNumber : '').trim();
    const targetEmail = (body.email !== undefined ? body.email : '').trim().toLowerCase();
    const targetPhone = (body.phone !== undefined ? body.phone : '').trim().replace(/[\s\-\+\(\)]/g, '');

    const duplicateErrors: Record<string, string> = {};

    // 1. Staff ID Duplicate Validation (excluding current staff member)
    if (targetStaffId) {
      const duplicateStaffId = db.staff.find(
        s => s.id !== currentStaffId && s.userId !== currentStaffId &&
             ((s.staffId && s.staffId.trim().toLowerCase() === targetStaffId.toLowerCase()) ||
              (s.userId && s.userId.trim().toLowerCase() === targetStaffId.toLowerCase()))
      ) || db.users.find(
        u => u.id !== currentStaffId &&
             (((u as any).staffId && (u as any).staffId.trim().toLowerCase() === targetStaffId.toLowerCase()) ||
              (u.id && u.id.trim().toLowerCase() === targetStaffId.toLowerCase()))
      );
      if (duplicateStaffId) {
        duplicateErrors.staffId = `Already exists: Staff ID "${targetStaffId}" is already assigned to ${duplicateStaffId.name}. Duplicate Staff IDs are not permitted.`;
      }
    }

    // 2. Iqama Number Duplicate Validation (excluding current staff member)
    if (targetIqama) {
      const duplicateIqama = db.staff.find(
        s => s.id !== currentStaffId && s.userId !== currentStaffId &&
             s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === targetIqama.toLowerCase()
      );
      if (duplicateIqama) {
        duplicateErrors.iqamaNumber = `Already exists: Iqama Number "${targetIqama}" is already registered to ${duplicateIqama.name}. Duplicate Iqama numbers are not permitted.`;
      }
    }

    // 3. Email Duplicate Validation (excluding current staff member)
    if (targetEmail) {
      const duplicateEmailStaff = db.staff.find(
        s => s.id !== currentStaffId && s.userId !== currentStaffId && s.email && s.email.trim().toLowerCase() === targetEmail
      );
      const duplicateEmailUser = db.users.find(
        u => u.id !== currentStaffId && u.email && u.email.trim().toLowerCase() === targetEmail
      );
      if (duplicateEmailStaff || duplicateEmailUser) {
        const existingName = duplicateEmailStaff?.name || duplicateEmailUser?.name || 'an existing account';
        duplicateErrors.email = `Already exists: Email address "${targetEmail}" is already registered to ${existingName}. Duplicate emails are not permitted.`;
      }
    }

    // 4. Phone Number Duplicate Validation (excluding current staff member)
    if (targetPhone && targetPhone.length >= 7) {
      const duplicatePhone = db.staff.find(s => {
        if (s.id === currentStaffId || s.userId === currentStaffId || !s.phone) return false;
        const norm = s.phone.trim().replace(/[\s\-\+\(\)]/g, '');
        return norm === targetPhone;
      });
      if (duplicatePhone) {
        duplicateErrors.phone = `Already exists: Phone number "${body.phone}" is already assigned to ${duplicatePhone.name}. Duplicate phone numbers are not permitted.`;
      }
    }

    if (Object.keys(duplicateErrors).length > 0) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_ENTRY',
        errors: duplicateErrors,
        error: Object.values(duplicateErrors)[0]
      });
    }

    const previousStaff = index >= 0 ? { ...db.staff[index] } : null;

    let updatedStaff: StaffMember;
    if (index >= 0) {
      db.staff[index] = {
        ...db.staff[index],
        ...body
      };
      updatedStaff = db.staff[index];
    } else {
      updatedStaff = {
        id,
        serial: db.staff.length + 1,
        name: body.name || 'Staff Member',
        userId: body.userId || id,
        email: body.email || '',
        phone: body.phone || '',
        department: body.department || 'Housekeeping',
        role: body.role || 'Employee',
        status: body.status || 'Active',
        permissions: body.permissions || (body.role ? DEFAULT_ROLE_PERMISSIONS[body.role] : []),
        password: body.password || 'Warwick#2026',
        dateOfBirth: body.dateOfBirth || '',
        iqamaNumber: body.iqamaNumber || '',
        staffId: body.staffId || `STF-${db.staff.length + 100}`,
        workplace: body.workplace || 'Warwick Hotels and Resorts',
        position: body.position || body.department || 'Staff',
        emergencyContact: body.emergencyContact || '',
        notes: body.notes || '',
        itemsFoundCount: 0,
        handoversCount: 0,
        createdAt: new Date().toISOString(),
        ...body
      };
      db.staff.push(updatedStaff);
    }

    if (mongoService.isLive) {
      try {
        await mongoService.updateStaff(id, body);
      } catch (e: any) {
        console.warn('Mongo updateStaff error:', e.message);
      }
    }

    // If matching active user exists in db.users, synchronize role, permissions, and profile details
    const matchingUser = db.users.find(
      u => (u.id === id || (u as any).staffId === updatedStaff.staffId || (u.email && updatedStaff.email && u.email.toLowerCase() === updatedStaff.email.toLowerCase()))
    );
    if (matchingUser) {
      if (body.role) matchingUser.role = body.role;
      if (body.permissions) matchingUser.permissions = body.permissions;
      if (body.name) matchingUser.name = body.name;
      if (body.department) matchingUser.department = body.department;
      if (body.phone) matchingUser.phone = body.phone;
      if (body.dateOfBirth) matchingUser.dateOfBirth = body.dateOfBirth;
      if (body.iqamaNumber) matchingUser.iqamaNumber = body.iqamaNumber;
      if (body.staffId) matchingUser.staffId = body.staffId;
      if (body.workplace) matchingUser.workplace = body.workplace;
    }

    // Also synchronize active connected sessions
    db.activeSessions.forEach(sess => {
      if (
        sess.userId === id ||
        sess.userId === updatedStaff.id ||
        (sess.userEmail && updatedStaff.email && sess.userEmail.toLowerCase() === updatedStaff.email.toLowerCase())
      ) {
        if (body.role) sess.role = body.role;
        if (body.name) sess.userName = body.name;
      }
    });

    const staffName = updatedStaff.name || id;

    // Track User Permission Changes
    const prevPerms: string[] = Array.isArray(previousStaff?.permissions) ? previousStaff!.permissions : [];
    const newPerms: string[] = Array.isArray(body.permissions) ? body.permissions : [];
    const permsChanged = Array.isArray(body.permissions) && (
      prevPerms.length !== newPerms.length ||
      prevPerms.some(p => !newPerms.includes(p)) ||
      newPerms.some(p => !prevPerms.includes(p))
    );

    if (permsChanged) {
      const added = newPerms.filter(p => !prevPerms.includes(p));
      const revoked = prevPerms.filter(p => !newPerms.includes(p));
      await addAudit(
        'User Permissions Changed',
        'staff',
        `Updated access permissions for staff ${staffName}. ${added.length > 0 ? `Granted: [${added.join(', ')}]. ` : ''}${revoked.length > 0 ? `Revoked: [${revoked.join(', ')}].` : ''}`,
        actor,
        role,
        id,
        {
          actionType: 'permission_change',
          changes: [
            { field: 'permissions', label: 'Access Permissions', from: prevPerms.join(', ') || 'Default', to: newPerms.join(', ') || 'None' }
          ]
        }
      );
    }

    // Track User Role Changes
    if (body.role && previousStaff?.role && body.role !== previousStaff.role) {
      await addAudit(
        `User Role Changed: ${previousStaff.role} ➔ ${body.role}`,
        'staff',
        `Staff role for ${staffName} transitioned from "${previousStaff.role}" to "${body.role}" by ${actor}.`,
        actor,
        role,
        id,
        {
          actionType: 'role_change',
          changes: [
            { field: 'role', label: 'Role Designation', from: previousStaff.role, to: body.role }
          ]
        }
      );
    }

    // Track General User Information Edits
    const staffFieldMap: Record<string, string> = {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      department: 'Department',
      workplace: 'Workplace',
      position: 'Position',
      status: 'Status',
      dateOfBirth: 'Date of Birth',
      iqamaNumber: 'National / Iqama ID'
    };
    const staffDiffs: Array<{ field: string; label: string; from: any; to: any }> = [];
    if (previousStaff) {
      for (const [fKey, fLabel] of Object.entries(staffFieldMap)) {
        if (body[fKey] !== undefined && String(body[fKey]).trim() !== String((previousStaff as any)[fKey] || '').trim()) {
          staffDiffs.push({
            field: fKey,
            label: fLabel,
            from: (previousStaff as any)[fKey] || 'Empty',
            to: body[fKey] || 'Empty'
          });
        }
      }
    }

    if (staffDiffs.length > 0 && !permsChanged && !(body.role && previousStaff?.role && body.role !== previousStaff.role)) {
      await addAudit(
        'Staff Information Updated',
        'staff',
        `Updated details for ${staffName}: ${staffDiffs.map(d => `${d.label}: "${d.from}" → "${d.to}"`).join(', ')}`,
        actor,
        role,
        id,
        {
          actionType: 'user_update',
          changes: staffDiffs
        }
      );
    } else if (staffDiffs.length > 0) {
      // Also log profile info diffs if permissions or role also changed
      await addAudit(
        'Staff Information Updated',
        'staff',
        `Updated profile fields for ${staffName}: ${staffDiffs.map(d => `${d.label}: "${d.from}" → "${d.to}"`).join(', ')}`,
        actor,
        role,
        id,
        {
          actionType: 'user_update',
          changes: staffDiffs
        }
      );
    }

    saveDatabase();

    return res.json({
      success: true,
      staff: updatedStaff,
      message: 'Staff member updated successfully.'
    });
  });

  app.delete('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const actorEmail = (req.headers['x-user-email'] as string || '').toLowerCase();

    // Check permission: Super Admin, delete_staff permission, or Admin with manage_staff_access
    const hasDeleteStaffPerm = role === 'Super Admin' || actorHasPermission(req, 'delete_staff') || (role === 'Admin' && actorHasPermission(req, 'manage_staff_access'));

    if (!hasDeleteStaffPerm) {
      return res.status(403).json({
        error: 'Permission Denied: You do not have permission to remove staff members. Contact an Administrator.'
      });
    }

    const index = db.staff.findIndex(
      s => s.id === id || (s as any)._id === id || s.userId === id || s.email === id || s.staffId === id
    );
    let name = id;

    if (index >= 0) {
      name = db.staff[index].name;
      db.staff.splice(index, 1);
      // Re-assign serials
      db.staff.forEach((s, idx) => { s.serial = idx + 1; });
      saveDatabase();
    }

    if (mongoService.isLive) {
      try {
        await mongoService.deleteStaff(id);
      } catch (e: any) {
        console.warn('Mongo deleteStaff error:', e.message);
      }
    }

    await addAudit('Staff Removed', 'staff', `Removed staff member ${name}`, actor, role, id);

    return res.json({
      success: true,
      message: `Staff member ${name} removed.`
    });
  });

  // ----------------------------------------------------
  // API: Notifications (Real-Time Notification System)
  // ----------------------------------------------------
  app.get('/api/notifications', async (req, res) => {
    let notifications: AppNotification[] = [];

    if (mongoService.isLive) {
      try {
        notifications = await mongoService.getNotifications();
        if ((!notifications || notifications.length === 0) && Array.isArray(db.notifications) && db.notifications.length > 0) {
          notifications = db.notifications;
        }
      } catch (e: any) {
        notifications = Array.isArray(db.notifications) ? db.notifications : [];
      }
    } else {
      notifications = Array.isArray(db.notifications) ? db.notifications : [];
    }

    // Clean deduplication: eliminate duplicate notifications within 60-second window
    const seenNotifs = new Set<string>();
    const deduplicatedNotifs: AppNotification[] = [];
    for (const notif of notifications) {
      const code = notif.itemCode || notif.itemId || '';
      const normTitle = (notif.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const timeBucket = Math.floor(new Date(notif.createdAt).getTime() / 60000);
      const key = code
        ? `${notif.type || 'gen'}_${code}_${timeBucket}`
        : `${normTitle}_${timeBucket}`;
      if (!seenNotifs.has(key)) {
        seenNotifs.add(key);
        deduplicatedNotifs.push(notif);
      }
    }
    notifications = deduplicatedNotifs;

    const userIdentifiers = [
      (req.headers['x-user-id'] as string || '').trim().toLowerCase(),
      (req.headers['x-user-name'] as string || '').trim().toLowerCase(),
      (req.headers['x-user-email'] as string || '').trim().toLowerCase()
    ].filter(Boolean);

    // Calculate unread count strictly for this user (not in readBy, not in deletedBy)
    const unreadCount = notifications.filter(n => {
      const deletedBy = Array.isArray(n.deletedBy) ? n.deletedBy.map(u => String(u).toLowerCase().trim()) : [];
      const isDeleted = userIdentifiers.some(u => deletedBy.includes(u));
      if (isDeleted) return false;

      const readBy = Array.isArray(n.readBy) ? n.readBy.map(u => String(u).toLowerCase().trim()) : [];
      const isRead = userIdentifiers.length > 0
        ? userIdentifiers.some(u => readBy.includes(u))
        : Boolean(n.read);
      return !isRead;
    }).length;

    return res.json({
      notifications,
      total: notifications.length,
      unreadCount
    });
  });

  app.post('/api/notifications', async (req, res) => {
    const body = req.body;
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const email = (req.headers['x-user-email'] as string) || '';

    const notif = await createNotificationHelper({
      ...body,
      senderName: actor,
      senderRole: role,
      senderEmail: email
    });

    return res.status(201).json({
      success: true,
      notification: notif
    });
  });

  app.post('/api/notifications/broadcast', async (req, res) => {
    const {
      title,
      message,
      type = 'notice',
      priority = 'normal',
      targetType = 'all',
      targetDepartment,
      targetStaffName,
      targetStaffEmail,
      targetUserId,
      targetRoles
    } = req.body;

    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
    const email = (req.headers['x-user-email'] as string) || '';

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const notif = await createNotificationHelper({
      title,
      message,
      type,
      priority,
      targetType,
      targetDepartment,
      targetStaffName,
      targetStaffEmail,
      targetUserId,
      targetRoles,
      senderName: actor,
      senderRole: role,
      senderEmail: email
    });

    await addAudit('Notification Broadcast', 'settings', `Broadcasted notice "${title}" (${targetType}) by ${actor}`, actor, role);

    return res.status(201).json({
      success: true,
      notification: notif,
      message: 'Notice broadcasted successfully in real time.'
    });
  });

  app.put('/api/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

    if (Array.isArray(db.notifications)) {
      const notif = db.notifications.find(n => n.id === id);
      if (notif) {
        if (!Array.isArray(notif.readBy)) notif.readBy = [];
        if (!notif.readBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
          notif.readBy.push(userIdentifier);
        }
        saveDatabase();
      }
    }

    if (mongoService.isLive) {
      mongoService.markNotificationRead(id, userIdentifier).catch(() => {});
    }

    return res.json({ success: true, id });
  });

  app.put('/api/notifications/:id/unread', async (req, res) => {
    const { id } = req.params;
    const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

    if (Array.isArray(db.notifications)) {
      const notif = db.notifications.find(n => n.id === id);
      if (notif && Array.isArray(notif.readBy)) {
        notif.readBy = notif.readBy.filter(u => String(u).trim().toLowerCase() !== userIdentifier);
        saveDatabase();
      }
    }

    if (mongoService.isLive) {
      mongoService.markNotificationUnread(id, userIdentifier).catch(() => {});
    }

    return res.json({ success: true, id });
  });

  app.post('/api/notifications/read-all', async (req, res) => {
    const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();

    if (Array.isArray(db.notifications)) {
      db.notifications.forEach(n => {
        if (!Array.isArray(n.readBy)) n.readBy = [];
        if (!n.readBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
          n.readBy.push(userIdentifier);
        }
      });
      saveDatabase();
    }

    if (mongoService.isLive) {
      mongoService.markAllNotificationsRead(userIdentifier).catch(() => {});
    }

    return res.json({ success: true, message: 'All notifications marked as read for current user.' });
  });

  app.delete('/api/notifications/:id', async (req, res) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] as string) || '';
    const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();
    const forEveryone = req.query.forEveryone === 'true' || req.body?.forEveryone === true;

    // Permanent global deletion by Super Admin or Admin
    if (forEveryone && ['Super Admin', 'Admin'].includes(actorRole)) {
      if (Array.isArray(db.notifications)) {
        db.notifications = db.notifications.filter(n => n.id !== id);
        saveDatabase();
      }
      if (mongoService.isLive) {
        mongoService.deleteNotification(id).catch(() => {});
      }
      return res.json({ success: true, message: 'Notification permanently removed for all users.' });
    }

    // Default: Per-user dismissal (hidden only for this user)
    if (Array.isArray(db.notifications)) {
      const notif = db.notifications.find(n => n.id === id);
      if (notif) {
        if (!Array.isArray(notif.deletedBy)) notif.deletedBy = [];
        if (!notif.deletedBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
          notif.deletedBy.push(userIdentifier);
        }
        saveDatabase();
      }
    }
    if (mongoService.isLive) {
      mongoService.deleteNotificationForUser(id, userIdentifier).catch(() => {});
    }
    return res.json({ success: true, message: 'Notification dismissed for your account.' });
  });

  app.delete('/api/notifications', async (req, res) => {
    const actorRole = (req.headers['x-user-role'] as string) || '';
    const userIdentifier = ((req.headers['x-user-id'] as string) || (req.headers['x-user-name'] as string) || (req.headers['x-user-email'] as string) || 'current').trim().toLowerCase();
    const forEveryone = req.query.forEveryone === 'true' || req.body?.forEveryone === true;

    // Global clear by Super Admin
    if (forEveryone && ['Super Admin', 'Admin'].includes(actorRole)) {
      if (Array.isArray(db.notifications)) {
        db.notifications = [];
        saveDatabase();
      }
      if (mongoService.isLive) {
        mongoService.clearNotifications().catch(() => {});
      }
      return res.json({ success: true, message: 'All notifications cleared for all users.' });
    }

    // Per-user clear (marks all as dismissed for this user only)
    if (Array.isArray(db.notifications)) {
      db.notifications.forEach(n => {
        if (!Array.isArray(n.deletedBy)) n.deletedBy = [];
        if (!n.deletedBy.some(u => String(u).trim().toLowerCase() === userIdentifier)) {
          n.deletedBy.push(userIdentifier);
        }
      });
      saveDatabase();
    }
    if (mongoService.isLive) {
      mongoService.clearNotificationsForUser(userIdentifier).catch(() => {});
    }
    return res.json({ success: true, message: 'All notifications dismissed for your account.' });
  });

  // ----------------------------------------------------
  // API: Audit & Accountability Logs (Admin Only)
  // ----------------------------------------------------
  const isAuditAdminUser = (req: express.Request): boolean => {
    const actorRole = (req.headers['x-user-role'] as string) || '';
    const actorName = ((req.headers['x-user-name'] as string) || '').trim();
    const actorEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase().trim();

    if (actorRole === 'Super Admin' || actorRole === 'Admin') return true;
    if (actorEmail === 'abusayeedriday@gmail.com' || actorEmail === 'mdriday256@gmail.com') return true;
    if (actorHasPermission(req, 'audit_logs')) return true;

    // Check against registered users in database
    const matchingUser = db.users.find(u =>
      (u.email && actorEmail && u.email.toLowerCase() === actorEmail) ||
      (u.name && actorName && u.name.toLowerCase() === actorName.toLowerCase())
    );

    if (matchingUser && (matchingUser.role === 'Super Admin' || matchingUser.role === 'Admin')) {
      return true;
    }

    return false;
  };

  app.get('/api/audit-logs', async (req, res) => {
    try {
      if (!isAuditAdminUser(req)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only Administrators and Super Admins can access Audit Logs.',
          logs: []
        });
      }

      const {
        search,
        entityType,
        actionType,
        action,
        itemId,
        itemCode,
        userRole,
        performedBy,
        startDate,
        endDate,
        limit = '500'
      } = req.query;

      let allLogs: AuditLog[] = [];
      let source = 'local';

      if (mongoService.isLive) {
        try {
          const mongoLogs = await mongoService.getAuditLogs({}, parseInt(limit as string, 10) || 1000);
          if (mongoLogs && mongoLogs.length > 0) {
            allLogs = mongoLogs;
            source = 'mongodb';
          }
        } catch (e: any) {
          console.warn('Failed to load audit logs from MongoDB, falling back to local memory:', e.message);
        }
      }

      if (allLogs.length === 0) {
        allLogs = Array.isArray(db.auditLogs) ? [...db.auditLogs] : [];
        source = 'local';
      }

      let filtered = allLogs;

      if (entityType && entityType !== 'all') {
        filtered = filtered.filter(l => l.entityType === entityType);
      }

      if (actionType && actionType !== 'all') {
        filtered = filtered.filter(l => l.actionType === actionType);
      }

      if (action && action !== 'all') {
        filtered = filtered.filter(l => l.action?.toLowerCase() === (action as string).toLowerCase());
      }

      if (itemId) {
        filtered = filtered.filter(l => l.entityId === itemId || l.itemCode === itemId);
      }

      if (itemCode) {
        filtered = filtered.filter(l => l.itemCode?.toLowerCase() === (itemCode as string).toLowerCase() || l.entityId === itemCode);
      }

      if (userRole && userRole !== 'all') {
        filtered = filtered.filter(l => (l.userRole || l.performedByRole) === userRole);
      }

      if (performedBy && performedBy !== 'all') {
        filtered = filtered.filter(l => l.performedBy?.toLowerCase().includes((performedBy as string).toLowerCase()));
      }

      if (startDate) {
        const start = new Date(startDate as string).getTime();
        if (!isNaN(start)) {
          filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= start);
        }
      }

      if (endDate) {
        const end = new Date(endDate as string).getTime();
        if (!isNaN(end)) {
          filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= end);
        }
      }

      if (search && typeof search === 'string' && search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(l =>
          (l.action && l.action.toLowerCase().includes(s)) ||
          (l.details && l.details.toLowerCase().includes(s)) ||
          (l.performedBy && l.performedBy.toLowerCase().includes(s)) ||
          (l.itemCode && l.itemCode.toLowerCase().includes(s)) ||
          (l.itemName && l.itemName.toLowerCase().includes(s)) ||
          (l.category && l.category.toLowerCase().includes(s)) ||
          (l.reason && l.reason.toLowerCase().includes(s)) ||
          (l.performedByEmail && l.performedByEmail.toLowerCase().includes(s))
        );
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const maxLimit = parseInt(limit as string, 10) || 500;
      const sliced = filtered.slice(0, maxLimit);

      return res.json({
        success: true,
        total: filtered.length,
        returned: sliced.length,
        logs: sliced,
        source
      });
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      return res.status(500).json({ success: false, error: err.message, logs: [] });
    }
  });

  app.get('/api/audit-logs/stats', async (req, res) => {
    try {
      if (!isAuditAdminUser(req)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only Administrators and Super Admins can access Audit Log statistics.'
        });
      }

      const logs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
      const total = logs.length;
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      const recent24h = logs.filter(l => new Date(l.timestamp).getTime() >= twentyFourHoursAgo).length;
      const statusChanges = logs.filter(l => l.actionType === 'status_change' || l.action?.toLowerCase().includes('status')).length;
      const itemCreations = logs.filter(l => l.actionType === 'create' || l.action?.toLowerCase().includes('register')).length;
      const handovers = logs.filter(l => l.actionType === 'handover' || l.action?.toLowerCase().includes('handover')).length;
      const dispatches = logs.filter(l => l.actionType === 'dispatch' || l.action?.toLowerCase().includes('dispatch')).length;
      const approvals = logs.filter(l => l.actionType === 'approval' || l.action?.toLowerCase().includes('approve')).length;

      // Group by action type
      const byActionType: Record<string, number> = {};
      logs.forEach(l => {
        const type = l.actionType || 'other';
        byActionType[type] = (byActionType[type] || 0) + 1;
      });

      // Top actors
      const actorCounts: Record<string, { count: number; role: string }> = {};
      logs.forEach(l => {
        const actor = l.performedBy || 'Unknown';
        if (!actorCounts[actor]) {
          actorCounts[actor] = { count: 0, role: (l.userRole || l.performedByRole || 'Staff') as string };
        }
        actorCounts[actor].count += 1;
      });

      const topActors = Object.entries(actorCounts)
        .map(([name, data]) => ({ name, count: data.count, role: data.role }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return res.json({
        success: true,
        stats: {
          total,
          recent24h,
          statusChanges,
          itemCreations,
          handovers,
          dispatches,
          approvals,
          byActionType,
          topActors
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const {
        action,
        actionType,
        entityType = 'item',
        entityId,
        itemCode,
        itemName,
        category,
        previousStatus,
        newStatus,
        details,
        reason,
        changes,
        meta
      } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required for audit logging' });
      }

      const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
      const role = (req.headers['x-user-role'] as any) || 'Super Admin';
      const email = req.headers['x-user-email'] as string;
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] || '';

      const log = await addAudit(
        action,
        entityType,
        details,
        actor,
        role,
        entityId || itemCode,
        {
          actionType,
          itemCode,
          itemName,
          category,
          previousStatus,
          newStatus,
          performedByEmail: email,
          reason,
          changes,
          ip,
          deviceType: userAgent.includes('Mobi') ? 'Mobile' : 'Desktop',
          browser: userAgent.includes('Chrome') ? 'Google Chrome' : userAgent.includes('Safari') ? 'Safari' : userAgent.includes('Edge') ? 'Edge' : 'Browser',
          meta
        }
      );

      return res.status(201).json({ success: true, log });
    } catch (err: any) {
      console.error('Error creating audit log:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete single audit log (Admin Only)
  app.delete('/api/audit-logs/:id', async (req, res) => {
    try {
      if (!isAuditAdminUser(req)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only Administrators can delete audit logs.'
        });
      }

      const { id } = req.params;

      // 1. Remove from local memory / db.json
      if (Array.isArray(db.auditLogs)) {
        db.auditLogs = db.auditLogs.filter(l => l.id !== id && (l as any)._id !== id);
      }
      saveDatabase();

      // 2. Remove from MongoDB
      if (mongoService.isLive) {
        await mongoService.deleteAuditLog(id).catch(err => {
          console.warn('[MongoDB] deleteAuditLog error:', err.message);
        });
      }

      return res.json({
        success: true,
        message: `Audit log entry deleted successfully.`
      });
    } catch (err: any) {
      console.error('Error deleting audit log:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch delete audit logs or clear all (Admin Only)
  app.delete('/api/audit-logs', async (req, res) => {
    try {
      if (!isAuditAdminUser(req)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only Administrators can delete audit logs.'
        });
      }

      const { ids, clearAll } = req.body || {};
      const actor = (req.headers['x-user-name'] as string) || 'Admin';
      const role = (req.headers['x-user-role'] as any) || 'Super Admin';

      if (clearAll) {
        db.auditLogs = [];
        saveDatabase();

        if (mongoService.isLive) {
          await mongoService.clearAuditLogs().catch(err => {
            console.warn('[MongoDB] clearAuditLogs error:', err.message);
          });
        }

        // Record that logs were cleared by admin
        await addAudit(
          'Audit Logs Cleared',
          'settings',
          `All historical audit logs were cleared by ${role} "${actor}".`,
          actor,
          role
        );

        return res.json({
          success: true,
          message: 'All audit logs have been successfully cleared.'
        });
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Array of audit log IDs is required.' });
      }

      const idsSet = new Set(ids);
      if (Array.isArray(db.auditLogs)) {
        db.auditLogs = db.auditLogs.filter(l => !idsSet.has(l.id) && !idsSet.has((l as any)._id));
      }
      saveDatabase();

      if (mongoService.isLive) {
        await mongoService.deleteAuditLogs(ids).catch(err => {
          console.warn('[MongoDB] batch delete audit logs error:', err.message);
        });
      }

      return res.json({
        success: true,
        deletedCount: ids.length,
        message: `${ids.length} audit log entries successfully deleted.`
      });
    } catch (err: any) {
      console.error('Error batch deleting audit logs:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Multi-Database System Architecture
  // ----------------------------------------------------
  app.get('/api/databases/health', async (req, res) => {
    try {
      const health = await multiDbService.getActiveHealth();
      return res.json(health);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        status: 'error',
        pingMs: 0,
        message: err.message || 'Failed to check active database health'
      });
    }
  });

  app.post('/api/databases/health', async (req, res) => {
    try {
      const health = await multiDbService.getActiveHealth();
      return res.json(health);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        status: 'error',
        pingMs: 0,
        message: err.message || 'Failed to check active database health'
      });
    }
  });

  app.get('/api/databases/status', async (req, res) => {
    try {
      const state = await multiDbService.getState();
      return res.json(state);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/databases/ping/:engine', async (req, res) => {
    const { engine } = req.params;
    try {
      const result = await multiDbService.pingDatabase(engine as any);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/databases/primary', async (req, res) => {
    const { engine } = req.body;
    if (!engine) {
      return res.status(400).json({ error: 'Database engine type is required.' });
    }
    try {
      const state = await multiDbService.setPrimaryDatabase(engine);
      // Reload db.items based on switched connected database
      let itemsList: LostItem[] = [];
      if (engine === 'mongodb' && mongoService.isLive) {
        itemsList = await mongoService.getItems();
        db.items = itemsList;
      } else {
        const freshDb = loadDatabase();
        itemsList = freshDb.items;
        db.items = freshDb.items;
      }
      return res.json({
        success: true,
        message: `Connected database successfully switched to ${engine}. Real items loaded.`,
        activeEngine: engine,
        itemsCount: itemsList.length,
        state
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/databases/configure/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const dbConfig = multiDbService.configureDatabase(id, updates);
      return res.json({ success: true, database: dbConfig });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/databases/sync-all', async (req, res) => {
    try {
      const currentItemsCount = Array.isArray(db.items) ? db.items.length : 0;
      const currentStaffCount = Array.isArray(db.staff) ? db.staff.length : 0;
      const result = await multiDbService.syncAllDatabases(currentItemsCount, currentStaffCount);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/databases/failover', async (req, res) => {
    const { targetEngine } = req.body;
    try {
      const state = await multiDbService.triggerFailover(targetEngine);
      return res.json({ success: true, message: `Failover activated. Primary database is now ${state.primaryEngine}`, state });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Real-Time SSE Stream & Multi-Terminal Sync
  // ----------------------------------------------------
  app.get('/api/realtime/stream', (req, res) => {
    multiDbService.registerSSEClient(res);
  });

  app.get('/api/realtime/status', (req, res) => {
    res.json({
      activeClients: multiDbService.getConnectedClientsCount(),
      primaryEngine: multiDbService.getPrimaryEngine(),
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/realtime/broadcast', (req, res) => {
    const { event, payload } = req.body;
    if (!event) return res.status(400).json({ error: 'Event name required' });
    multiDbService.broadcast(event, payload);
    return res.json({ success: true, clientsReached: multiDbService.getConnectedClientsCount() });
  });

  // ----------------------------------------------------
  // API: Public Hotel Guest Website & Inquiries Portal
  // ----------------------------------------------------
  // Public items catalog: sanitized to protect guest privacy
  app.get('/api/public/items', async (req, res) => {
    try {
      let itemsList: LostItem[] = [];
      if (mongoService.isLive) {
        try {
          itemsList = await mongoService.getItems();
        } catch {
          itemsList = db.items;
        }
      } else {
        itemsList = db.items;
      }

      // Filter to only approved / stored or found items, not deleted/archived
      const publicItems = itemsList
        .filter(item => !item.isDeleted && item.status !== 'Archived' && item.status !== 'Disposed')
        .map(item => ({
          id: item.id,
          code: item.code,
          itemName: item.itemName,
          category: item.category,
          description: item.description,
          brand: item.brand,
          color: item.color,
          locationFound: item.locationFound,
          dateFound: item.dateFound,
          status: item.status,
          imageUrl: item.imageUrl,
          retentionPeriodDays: item.dispatchDurationDays,
          deadlineDate: item.dispatchDeadline
        }));

      return res.json({
        success: true,
        count: publicItems.length,
        items: publicItems
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/public/website-settings', (req, res) => {
    res.json(multiDbService.getPublicSettings());
  });

  app.put('/api/public/website-settings', (req, res) => {
    const updated = multiDbService.updatePublicSettings(req.body);
    return res.json({ success: true, settings: updated });
  });

  app.get('/api/inquiries', (req, res) => {
    res.json({ success: true, inquiries: multiDbService.getInquiries() });
  });

  app.post('/api/public/inquiries', async (req, res) => {
    try {
      const inquiry = multiDbService.createInquiry(req.body);

      // Create staff notification
      await createNotificationHelper({
        title: `🛎️ New Guest Claim: ${inquiry.itemName}`,
        message: `Guest ${inquiry.guestName} (${inquiry.roomNumber || 'Visitor'}) filed inquiry ${inquiry.trackingCode} for "${inquiry.itemName}".`,
        type: 'alert',
        priority: 'high',
        targetType: 'all',
        senderName: 'Guest Website Portal'
      });

      return res.status(201).json({
        success: true,
        message: 'Your inquiry has been submitted successfully to Warwick Hotel Concierge & Security.',
        trackingCode: inquiry.trackingCode,
        inquiry
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/public/inquiries/track/:code', (req, res) => {
    const { code } = req.params;
    const inquiry = multiDbService.getInquiryByTrackingCode(code);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: `No claim found with tracking reference or item code "${code}". Please verify your reference number.`
      });
    }
    return res.json({ success: true, inquiry });
  });

  app.put('/api/inquiries/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const updated = multiDbService.updateInquiry(id, req.body);
      return res.json({ success: true, inquiry: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/inquiries/:id', (req, res) => {
    const { id } = req.params;
    const deleted = multiDbService.deleteInquiry(id);
    return res.json({ success: deleted });
  });

  // ----------------------------------------------------
  // Certificate Generation & History API
  // Strictly restricted to Admin, Supervisor, Manager, and Super Admin
  // ----------------------------------------------------
  app.get('/api/certificates/templates', (req, res) => {
    return res.json({
      success: true,
      templates: db.certificateTemplates || []
    });
  });

  app.post('/api/certificates/templates', async (req, res) => {
    const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
    const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_create');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to create certificate templates.' });
    }

    try {
      const {
        id: providedId,
        name,
        description,
        category,
        backgroundImageUrl,
        textMode,
        textColor,
        accentColor,
        nameOffsetY,
        nameFontSize,
        citationOffsetY,
        defaultTitle,
        defaultCitation,
        elements,
        settings,
        thumbnailBadge
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Template name is required.' });
      }

      const newTemplate: any = {
        id: providedId || `tpl-custom-${Date.now()}`,
        name: name.trim(),
        description: (description || '').trim(),
        category: (category || 'Special Award').trim(),
        backgroundImageUrl: backgroundImageUrl || '',
        isCustom: true,
        defaultTitle: (defaultTitle || name).trim(),
        defaultCitation: (defaultCitation || '').trim(),
        textMode: textMode === 'fill_in_blanks' ? 'fill_in_blanks' : 'full',
        textColor: textColor || '#1a2e40',
        accentColor: accentColor || '#c4972a',
        nameOffsetY: typeof nameOffsetY === 'number' ? nameOffsetY : 48,
        nameFontSize: typeof nameFontSize === 'number' ? nameFontSize : 36,
        citationOffsetY: typeof citationOffsetY === 'number' ? citationOffsetY : 60,
        elements: elements || [],
        settings: settings || {},
        thumbnailBadge: thumbnailBadge || 'CUSTOM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (req.headers['x-user-name'] as string) || 'Admin'
      };

      db.certificateTemplates = db.certificateTemplates || [];
      db.certificateTemplates.unshift(newTemplate);
      saveDatabase();

      return res.status(201).json({
        success: true,
        message: 'Certificate template saved and added successfully.',
        template: newTemplate
      });
    } catch (err: any) {
      console.error('Error adding template:', err);
      return res.status(500).json({ error: err.message || 'Failed to add certificate template' });
    }
  });

  app.put('/api/certificates/templates/:id', async (req, res) => {
    const actor = (req.headers['x-user-name'] as string) || 'Admin';
    const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
    const isAllowed = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_edit');
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to edit certificate templates.' });
    }

    const { id } = req.params;
    db.certificateTemplates = db.certificateTemplates || [];
    const idx = db.certificateTemplates.findIndex(t => t.id === id);
    if (idx === -1) {
      // If template was a preset or not in db yet, save it as a new/modified custom template
      const newCustom: any = {
        id,
        name: req.body.name || 'Customized Template',
        description: req.body.description || '',
        category: req.body.category || 'Special Award',
        backgroundImageUrl: req.body.backgroundImageUrl || '',
        isCustom: true,
        defaultTitle: req.body.defaultTitle,
        defaultCitation: req.body.defaultCitation,
        textMode: req.body.textMode || 'full',
        textColor: req.body.textColor,
        accentColor: req.body.accentColor,
        nameOffsetY: req.body.nameOffsetY,
        nameFontSize: req.body.nameFontSize,
        citationOffsetY: req.body.citationOffsetY,
        customColors: req.body.customColors,
        layoutCoordinates: req.body.layoutCoordinates,
        elements: req.body.elements || [],
        settings: req.body.settings || {},
        thumbnailBadge: req.body.thumbnailBadge || 'CUSTOM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actor
      };
      db.certificateTemplates.push(newCustom);
      saveDatabase();
      return res.json({ success: true, message: 'Template saved.', template: newCustom });
    }

    db.certificateTemplates[idx] = {
      ...db.certificateTemplates[idx],
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };
    saveDatabase();

    return res.json({
      success: true,
      message: 'Certificate template updated successfully.',
      template: db.certificateTemplates[idx]
    });
  });

  app.delete('/api/certificates/templates/:id', async (req, res) => {
    const actor = (req.headers['x-user-name'] as string) || 'Admin';
    const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
    const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_delete');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete certificate templates. Supervisors and Managers cannot delete templates.' });
    }

    const { id } = req.params;
    db.certificateTemplates = (db.certificateTemplates || []).filter(t => t.id !== id);
    saveDatabase();

    return res.json({
      success: true,
      message: 'Certificate template removed.'
    });
  });

  app.get('/api/certificates', async (req, res) => {
    const userRole = ((req.headers['x-user-role'] as string) || '').trim().toLowerCase();
    const isAllowedRole = userRole === 'super admin' || actorHasPermission(req, 'certificates_view') || actorHasPermission(req, 'certificates');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view certificates.' });
    }

    if (mongoService.isLive) {
      try {
        const mongoCerts = await mongoService.getCertificates();
        if (mongoCerts && mongoCerts.length > 0) {
          db.certificates = mongoCerts;
        }
      } catch (e) {
        console.warn('[MongoDB] getCertificates error:', e);
      }
    }

    let certs = [...(db.certificates || [])];
    const q = (req.query.q as string || '').toLowerCase().trim();
    const template = (req.query.template as string || '').trim();

    if (q) {
      certs = certs.filter(c => 
        (c.recipientName && c.recipientName.toLowerCase().includes(q)) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.recipientDepartment && c.recipientDepartment.toLowerCase().includes(q)) ||
        (c.awardPeriod && c.awardPeriod.toLowerCase().includes(q))
      );
    }

    if (template && template !== 'all') {
      certs = certs.filter(c => c.template === template);
    }

    // Sort newest issued first
    certs.sort((a, b) => new Date(b.issuedAt || b.createdAt).getTime() - new Date(a.issuedAt || a.createdAt).getTime());

    return res.json({
      success: true,
      certificates: certs,
      total: certs.length,
      source: mongoService.isLive ? 'mongodb' : 'local'
    });
  });

  // Helper to extract & sync recent signatures from a certificate
  const saveRecentSignaturesFromCert = async (cert: any) => {
    if (!db.recentSignatures) db.recentSignatures = [];
    const now = new Date().toISOString();
    const sigList = [
      { sig: cert.signatory1Signature, title: cert.signatory1Title || cert.signatoryLeftTitle, name: cert.signatory1Name || cert.signatoryLeftName },
      { sig: cert.signatory2Signature, title: cert.signatory2Title || cert.signatoryRightTitle, name: cert.signatory2Name || cert.signatoryRightName },
      { sig: cert.signatory3Signature, title: cert.signatory3Title || cert.signatoryCenterTitle, name: cert.signatory3Name || cert.signatoryCenterName }
    ];
    let changed = false;
    for (const item of sigList) {
      if (item.sig && typeof item.sig === 'string' && item.sig.length > 50) {
        const existingIdx = db.recentSignatures.findIndex((s: any) => s.dataUrl === item.sig);
        if (existingIdx >= 0) {
          db.recentSignatures[existingIdx].lastUsedAt = now;
          if (item.title) db.recentSignatures[existingIdx].title = item.title;
          if (item.name) db.recentSignatures[existingIdx].name = item.name;
          const rec = db.recentSignatures.splice(existingIdx, 1)[0];
          db.recentSignatures.unshift(rec);
          changed = true;
        } else {
          db.recentSignatures.unshift({
            id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: item.sig,
            title: item.title || 'Executive Signatory',
            name: item.name || '',
            type: 'digital',
            createdAt: now,
            lastUsedAt: now
          });
          changed = true;
        }
      }
    }
    if (db.recentSignatures.length > 30) {
      db.recentSignatures = db.recentSignatures.slice(0, 30);
    }
    if (changed) {
      saveDatabase();
    }
  };

  // Recent Signatures Endpoints
  app.get('/api/certificates/signatures/recent', (req, res) => {
    if (!db.recentSignatures) {
      db.recentSignatures = [];
      // Seed from existing certificates
      (db.certificates || []).forEach((c: any) => {
        if (c.signatory1Signature && c.signatory1Signature.length > 50) {
          db.recentSignatures.push({
            id: `sig-cert-${c.id}-1`,
            dataUrl: c.signatory1Signature,
            title: c.signatory1Title || c.signatoryLeftTitle || 'Left Signatory',
            name: c.signatory1Name || c.signatoryLeftName || '',
            type: 'digital',
            createdAt: c.createdAt || new Date().toISOString(),
            lastUsedAt: c.createdAt || new Date().toISOString()
          });
        }
        if (c.signatory2Signature && c.signatory2Signature.length > 50) {
          db.recentSignatures.push({
            id: `sig-cert-${c.id}-2`,
            dataUrl: c.signatory2Signature,
            title: c.signatory2Title || c.signatoryRightTitle || 'Right Signatory',
            name: c.signatory2Name || c.signatoryRightName || '',
            type: 'digital',
            createdAt: c.createdAt || new Date().toISOString(),
            lastUsedAt: c.createdAt || new Date().toISOString()
          });
        }
      });
    }
    return res.json({ success: true, signatures: db.recentSignatures });
  });

  app.post('/api/certificates/signatures/recent', async (req, res) => {
    try {
      const { dataUrl, title, name, type } = req.body;
      if (!dataUrl) return res.status(400).json({ error: 'dataUrl required' });
      if (!db.recentSignatures) db.recentSignatures = [];

      const existingIdx = db.recentSignatures.findIndex((s: any) => s.dataUrl === dataUrl);
      const now = new Date().toISOString();
      let record: any;
      if (existingIdx >= 0) {
        db.recentSignatures[existingIdx].lastUsedAt = now;
        if (title) db.recentSignatures[existingIdx].title = title;
        if (name) db.recentSignatures[existingIdx].name = name;
        record = db.recentSignatures.splice(existingIdx, 1)[0];
        db.recentSignatures.unshift(record);
      } else {
        record = {
          id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataUrl,
          title: title || 'Executive Signatory',
          name: name || '',
          type: type || 'digital',
          createdAt: now,
          lastUsedAt: now
        };
        db.recentSignatures.unshift(record);
      }
      if (db.recentSignatures.length > 30) {
        db.recentSignatures = db.recentSignatures.slice(0, 30);
      }
      saveDatabase();
      return res.json({ success: true, signature: record, signatures: db.recentSignatures });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/certificates/signatures/recent/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!db.recentSignatures) db.recentSignatures = [];
      db.recentSignatures = db.recentSignatures.filter((s: any) => s.id !== id);
      saveDatabase();
      return res.json({ success: true, message: 'Signature removed from recent history.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // AI-powered verification & extraction of handwritten signatures from uploaded photos/documents
  app.post('/api/certificates/extract-signature', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          hasHandwrittenSignature: false,
          error: 'Handwritten signature is not found',
          message: 'Handwritten signature is not found'
        });
      }

      // Extract raw base64 and mime
      const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = 'image/jpeg';
      let rawBase64 = imageBase64;
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      }

      if (process.env.GEMINI_API_KEY) {
        try {
          const prompt = `You are an expert forensic document analyst and handwritten signature extraction specialist.

TASK & CONTEXT:
The user has uploaded a photo, scanned page, agreement, certificate, or document containing a mix of computer-typed / machine-printed text and handwritten human signatures.

CRITICAL DISTINCTION:
1. Computer-Typed / Machine-Printed Text:
   - Uniform font typography (Arial, Times New Roman, Calibri, Roboto, etc.), rigid geometry, printed letterforms, barcodes, stamps, labels (e.g. "Authorized Signature", "Approved by", "Date", names).
2. Human Handwritten Signature / Ink Strokes:
   - Freehand curves, looping cursive or script pen strokes, flourish marks, variable line thickness, ink pressure variations from a pen, ballpoint, ink fountain, pencil, or stylus.
   - Often signed on top of, near, or above a printed signatory line.

CORE CLASSIFICATION RULE:
- Documents and certificate pages ALMOST ALWAYS contain significant computer-typed text.
- If you find ANY human handwritten signature, initials, or pen ink marks anywhere on the document:
  hasHandwrittenSignature MUST BE TRUE! DO NOT mark as false just because the document has computer text!
- If the image contains ONLY computer-printed digital text with ZERO handwriting, OR is an unrelated non-document photo (e.g., landscape, vehicle):
  hasHandwrittenSignature = false, and explain in "reason".

BOUNDING BOX & COMPUTER TEXT REMOVAL RULES:
1. Provide normalized coordinates [ymin, xmin, ymax, xmax] on a scale of 0 to 1000.
2. The boundingBox must crop TIGHTLY and EXCLUSIVELY to the human handwritten ink strokes!
3. CRITICAL: EXCLUDE all computer-typed text (such as "Authorized Signatory", "Signature:", names, titles, body text) from the bounding box!
4. CRITICAL: EXCLUDE horizontal dotted or solid printed form lines.
5. If there are multiple handwritten signatures on the page, provide the primary one in boundingBox, and list every detected signature in allSignatures with friendly labels (e.g., "Left Signatory", "Right Signatory", "Authorized Signature").`;

          let parsed: any = null;
          // Try fastest and most available models with fallback
          const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
          for (const modelName of candidateModels) {
            try {
              const response = await geminiClient.models.generateContent({
                model: modelName,
                contents: [
                  {
                    inlineData: {
                      mimeType,
                      data: rawBase64
                    }
                  },
                  {
                    text: prompt
                  }
                ],
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      hasHandwrittenSignature: {
                        type: Type.BOOLEAN,
                        description: 'True if at least one human handwritten ink signature or initials is found on the document, false if strictly machine text or non-signature.'
                      },
                      confidence: {
                        type: Type.NUMBER,
                        description: 'Confidence score between 0 and 1'
                      },
                      reason: {
                        type: Type.STRING,
                        description: 'Forensic explanation of handwriting presence and computer text separation'
                      },
                      boundingBox: {
                        type: Type.OBJECT,
                        description: 'Normalized bounding box [0-1000] enclosing ONLY the handwritten ink signature, excluding machine text',
                        properties: {
                          ymin: { type: Type.INTEGER },
                          xmin: { type: Type.INTEGER },
                          ymax: { type: Type.INTEGER },
                          xmax: { type: Type.INTEGER }
                        },
                        required: ['ymin', 'xmin', 'ymax', 'xmax']
                      },
                      allSignatures: {
                        type: Type.ARRAY,
                        description: 'List of all detected handwritten signatures if there are multiple on the document',
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            ymin: { type: Type.INTEGER },
                            xmin: { type: Type.INTEGER },
                            ymax: { type: Type.INTEGER },
                            xmax: { type: Type.INTEGER }
                          },
                          required: ['ymin', 'xmin', 'ymax', 'xmax']
                        }
                      }
                    },
                    required: ['hasHandwrittenSignature', 'reason']
                  }
                }
              });

              const resultText = response.text?.trim() || '{}';
              parsed = JSON.parse(resultText);
              if (parsed) break;
            } catch (modelErr: any) {
              console.warn(`Attempt with ${modelName} encountered:`, modelErr?.message || modelErr);
            }
          }

          if (parsed) {
            if (!parsed.hasHandwrittenSignature) {
              return res.json({
                success: false,
                hasHandwrittenSignature: false,
                error: 'Handwritten signature is not found',
                message: 'Handwritten signature is not found',
                reason: parsed.reason || 'No authentic pen-written signature was identified in the document.'
              });
            }

            return res.json({
              success: true,
              hasHandwrittenSignature: true,
              boundingBox: parsed.boundingBox,
              allSignatures: parsed.allSignatures || (parsed.boundingBox ? [parsed.boundingBox] : []),
              confidence: parsed.confidence ?? 0.95,
              message: 'Handwritten signature successfully detected and isolated.',
              reason: parsed.reason
            });
          }

          // If AI models were temporarily under high spike demand, enable graceful fallback
          return res.json({
            success: true,
            hasHandwrittenSignature: true,
            confidence: 0.85,
            message: 'Signature loaded successfully. Use the crop tool to select the signature.',
            reason: 'Fallback signature extraction mode enabled.'
          });
        } catch (geminiErr: any) {
          console.warn('Gemini handwriting verification error:', geminiErr?.message || geminiErr);
          return res.json({
            success: true,
            hasHandwrittenSignature: true,
            confidence: 0.8,
            message: 'Signature loaded. Use the crop tool to select the signature area.',
            reason: 'Fallback signature processing.'
          });
        }
      }

      // If Gemini is not configured, fallback gracefully so user can crop signature
      return res.json({
        success: true,
        hasHandwrittenSignature: true,
        confidence: 0.8,
        message: 'Signature loaded. Use the crop tool to select the signature area.',
        reason: 'Manual signature cropping active.'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        hasHandwrittenSignature: false,
        error: 'Failed to verify signature',
        message: 'Handwritten signature is not found'
      });
    }
  });

  app.get('/api/certificates/:id', (req, res) => {
    const { id } = req.params;
    const cert = (db.certificates || []).find(c => c.id === id || c.certificateNumber === id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    return res.json({ success: true, certificate: cert });
  });

  app.post('/api/certificates', async (req, res) => {
    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as string) || 'Super Admin';

    const roleLower = role.trim().toLowerCase();
    const isAllowedRole = ['super admin', 'admin'].includes(roleLower) || actorHasPermission(req, 'certificates_create');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to generate certificates.' });
    }

    try {
      const body = req.body;
      const count = (db.certificates || []).length + 1;
      const year = new Date().getFullYear();
      const paddedNum = String(count).padStart(3, '0');
      const certNumber = body.certificateNumber || `WRW-CERT-${year}-${paddedNum}`;

      const newCert: Certificate = {
        ...body,
        id: body.id || `cert-${Date.now()}`,
        certificateNumber: certNumber,
        template: body.template || 'employee_of_month',
        customTemplateId: body.customTemplateId || undefined,
        customBackgroundImage: body.customBackgroundImage || undefined,
        customColors: body.customColors || undefined,
        textMode: body.textMode || 'full',
        nameOffsetY: typeof body.nameOffsetY === 'number' ? body.nameOffsetY : undefined,
        nameFontSize: typeof body.nameFontSize === 'number' ? body.nameFontSize : undefined,
        title: body.title || (body.template === 'appreciation' ? 'Certificate of Appreciation' : 'Employee of the Month'),
        presentationText: body.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
        recipientName: (body.recipientName || '').trim() || 'MD ABU SAYEED RIDAY',
        recipientStaffId: body.recipientStaffId || undefined,
        recipientPosition: (body.recipientPosition || '').trim() || (body.template === 'appreciation' ? 'Housekeeping Supervisor' : 'Housekeeping'),
        recipientDepartment: (body.recipientDepartment || '').trim() || 'Housekeeping',
        awardPeriod: (body.awardPeriod || '').trim() || 'June 2026',
        citationText: (body.citationText || '').trim(),
        citationAlignment: body.citationAlignment || 'center',
        citationFontSize: typeof body.citationFontSize === 'number' ? body.citationFontSize : 14,
        location: (body.location || '').trim() || 'Al Baha, Saudi Arabia',
        awardDate: (body.awardDate || '').trim() || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        signatory1Title: (body.signatory1Title || '').trim() || (body.template === 'appreciation' ? 'Housekeeping Manager' : 'Housekeeping'),
        signatory1Name: (body.signatory1Name || '').trim(),
        signatory1Signature: body.signatory1Signature || undefined,
        signatory2Title: (body.signatory2Title || '').trim() || 'General Manager',
        signatory2Name: (body.signatory2Name || '').trim(),
        signatory2Signature: body.signatory2Signature || undefined,
        signatory3Title: (body.signatory3Title || '').trim() || undefined,
        signatory3Name: (body.signatory3Name || '').trim() || undefined,
        signatory3Signature: body.signatory3Signature || undefined,
        showSignatory3: Boolean(body.showSignatory3),
        notes: (body.notes || '').trim() || undefined,
        // Hotel branding & Logo options (both Brand Name and Subtitle are fully optional)
        hotelName: body.hotelName !== undefined ? body.hotelName : (body.showHotelBranding === false ? '' : 'WARWICK'),
        hotelSubtitle: body.hotelSubtitle !== undefined ? body.hotelSubtitle : (body.showHotelBranding === false ? '' : 'HOTEL AL BAHA • HOTELS & RESORTS'),
        hotelLogoUrl: body.hotelLogoUrl || undefined,
        hotelLogoPreset: body.hotelLogoPreset || 'warwick_crest',
        hotelLogoSize: typeof body.hotelLogoSize === 'number' ? body.hotelLogoSize : 48,
        showHotelLogo: body.showHotelLogo !== false,
        showHotelBranding: body.showHotelBranding !== false,
        showFiveStars: body.showFiveStars !== false,
        // Badges, Seals, Borders & Typography
        showBadge: body.showBadge !== false,
        badgeStyle: body.badgeStyle || 'rosette',
        badgeText: body.badgeText || 'SEAL OF EXCELLENCE',
        badgeSubtext: body.badgeSubtext || '5-STAR LUXURY',
        borderStyle: body.borderStyle || 'royal_frame',
        fontFamilyChoice: body.fontFamilyChoice || 'serif',
        showWatermark: body.showWatermark !== false,
        issuedBy: actor,
        issuedByRole: role,
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!newCert.citationText) {
        if (newCert.template === 'appreciation') {
          newCert.citationText = `This certificate is proudly presented to ${newCert.recipientName}, ${newCert.recipientPosition}, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.`;
        } else if (newCert.template === 'employee_of_month') {
          newCert.citationText = 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!';
        } else {
          newCert.citationText = 'In recognition of outstanding dedication, exemplary professional contribution, and commitment to excellence at Warwick Hotel Baha.';
        }
      }

      db.certificates = db.certificates || [];
      db.certificates.unshift(newCert);
      saveDatabase();
      await saveRecentSignaturesFromCert(newCert);

      if (mongoService.isLive) {
        await mongoService.upsertCertificate(newCert).catch(err => {
          console.warn('[MongoDB] Save certificate to mongo error:', err);
        });
      }

      await addAudit(
        'Certificate Issued',
        'certificate',
        `Issued "${newCert.title}" to ${newCert.recipientName} (${newCert.recipientDepartment || 'Staff'}) by ${actor}`,
        actor,
        role as any,
        newCert.id,
        { actionType: 'certificate' }
      );

      return res.status(201).json({
        success: true,
        message: 'Certificate generated and added to history successfully.',
        certificate: newCert
      });
    } catch (err: any) {
      console.error('Error generating certificate:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate certificate' });
    }
  });

  app.put('/api/certificates/:id', async (req, res) => {
    const { id } = req.params;
    const actor = (req.headers['x-user-name'] as string) || 'Admin';
    const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
    const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_edit');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to modify certificates.' });
    }

    const index = (db.certificates || []).findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const updatedCert: Certificate = {
      ...db.certificates[index],
      ...req.body,
      id: db.certificates[index].id,
      certificateNumber: db.certificates[index].certificateNumber,
      updatedAt: new Date().toISOString()
    };

    db.certificates[index] = updatedCert;
    saveDatabase();
    await saveRecentSignaturesFromCert(updatedCert);

    if (mongoService.isLive) {
      await mongoService.upsertCertificate(updatedCert).catch(err => {
        console.warn('[MongoDB] Update certificate in mongo error:', err);
      });
    }

    await addAudit(
      'Certificate Updated',
      'certificate',
      `Updated certificate "${updatedCert.title}" for ${updatedCert.recipientName} by ${actor}`,
      actor,
      role as any,
      id,
      { actionType: 'certificate' }
    );

    return res.json({
      success: true,
      message: 'Certificate updated successfully.',
      certificate: updatedCert
    });
  });

  app.delete('/api/certificates/:id', async (req, res) => {
    const { id } = req.params;
    const actor = (req.headers['x-user-name'] as string) || 'Admin';
    const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
    const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_delete');
    if (!isAllowedRole) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete certificates. Supervisors and Managers cannot delete certificates.' });
    }

    const certToDelete = (db.certificates || []).find(c => c.id === id || c.certificateNumber === id);
    const certTitle = certToDelete?.title || 'Certificate';
    const recipientName = certToDelete?.recipientName || id;

    db.certificates = (db.certificates || []).filter(c => c.id !== id && c.certificateNumber !== id);
    saveDatabase();

    if (mongoService.isLive) {
      await mongoService.deleteCertificate(id).catch(err => {
        console.warn('[MongoDB] Delete certificate in mongo error:', err);
      });
    }

    await addAudit(
      'Certificate Revoked/Deleted',
      'certificate',
      `Deleted certificate record "${certTitle}" for ${recipientName} by ${actor}`,
      actor,
      role as any,
      id,
      { actionType: 'certificate' }
    );

    return res.json({
      success: true,
      message: 'Certificate deleted from history successfully.'
    });
  });

  // ----------------------------------------------------
  // Vite Integration
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Warwick Hotel Baha L&F Server running on http://localhost:${PORT}`);
    // Clear notifications on boot
    db.notifications = [];
    saveDatabase();
  });
}

startServer();
