import express from 'express';
import { db, saveDatabase, isDeviceBlocked } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { parseUserAgentInfo } from '../../utils/device.utils.ts';
import {
  User,
  UserRole,
  PermissionKey,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  StaffDepartment
} from '../../../src/types.ts';
import {
  accountLockoutTracker,
  normalizeAuthInput,
  resolveAuthCandidates
} from './auth.service.ts';

export const authRouter = express.Router();

// ----------------------------------------------------
// 1. Lockout Status
// ----------------------------------------------------
authRouter.get('/api/auth/lockout-status', (req, res) => {
  const identifier = ((req.query.identifier as string) || '').trim().toLowerCase();
  if (!identifier) return res.json({ locked: false });

  const { candidateList } = resolveAuthCandidates(identifier);
  const matched =
    db.users.find(u => candidateList.some(c => (u.email && u.email.toLowerCase() === c) || (u.id && u.id.toLowerCase() === c))) ||
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

// ----------------------------------------------------
// 2. Unlock Account
// ----------------------------------------------------
authRouter.post('/api/auth/unlock-account', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Identifier is required' });
  }

  const clean = identifier.trim().toLowerCase();
  const { candidateList } = resolveAuthCandidates(clean);
  const matched =
    db.users.find(u => candidateList.some(c => (u.email && u.email.toLowerCase() === c) || (u.id && u.id.toLowerCase() === c) || ((u as any).staffId && (u as any).staffId.toLowerCase() === c))) ||
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

// ----------------------------------------------------
// 3. Login
// ----------------------------------------------------
authRouter.post('/api/auth/login', async (req, res) => {
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
  const { candidateList, isSuperAdminAlias } = resolveAuthCandidates(cleanInput);

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

        const hasCustom = Boolean(matchedStaff.isCustomPermissions) || (Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length > 0);
        const effectivePerms = matchedStaff.role === 'Super Admin'
          ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
          : (hasCustom && Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length > 0
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
    // Non-email identifier (staffId, userId, id, or email alias)
    const matchedUser = db.users.find(u =>
      (u.staffId && candidateList.includes(u.staffId.toLowerCase())) ||
      (u.id && candidateList.includes(u.id.toLowerCase())) ||
      (u.email && candidateList.includes(u.email.toLowerCase())) ||
      ((u as any).userId && candidateList.includes(String((u as any).userId).toLowerCase()))
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
        staffId: matchedUser.staffId || '1273',
        avatar: (matchedUser as any).avatar,
        lastActive: matchedUser.lastActive,
        record: matchedUser
      };
    } else {
      const matchedStaff = db.staff.find(s =>
        (s.staffId && candidateList.includes(s.staffId.toLowerCase())) ||
        (s.userId && candidateList.includes(s.userId.toLowerCase())) ||
        (s.id && candidateList.includes(s.id.toLowerCase())) ||
        (s.email && candidateList.includes(s.email.toLowerCase()))
      );
      if (matchedStaff) {
        const roleBaseline = (db.settings?.rolePermissions && db.settings.rolePermissions[matchedStaff.role] && Array.isArray(db.settings.rolePermissions[matchedStaff.role]))
          ? db.settings.rolePermissions[matchedStaff.role]
          : (DEFAULT_ROLE_PERMISSIONS[matchedStaff.role] || DEFAULT_ROLE_PERMISSIONS['Employee']);

        const hasCustom = Boolean(matchedStaff.isCustomPermissions) || (Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length > 0);
        const effectivePerms = matchedStaff.role === 'Super Admin'
          ? (roleBaseline.length > 0 ? roleBaseline : ALL_PERMISSIONS.map(p => p.id))
          : (hasCustom && Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length > 0
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

  // Super Admin alias fallback resolution (including Staff ID 1273)
  if (!targetAccount && isSuperAdminAlias) {
    const superAdmin = db.users.find(u => u.email.toLowerCase() === 'abusayeedriday@gmail.com') ||
      db.staff.find(s => s.email?.toLowerCase() === 'abusayeedriday@gmail.com');
    if (superAdmin) {
      targetAccount = {
        type: 'user',
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role as UserRole,
        department: superAdmin.department,
        phone: superAdmin.phone,
        permissions: (superAdmin as any).permissions || DEFAULT_ROLE_PERMISSIONS['Super Admin'],
        password: superAdmin.password,
        status: 'Active',
        staffId: (superAdmin as any).staffId || '1273',
        avatar: (superAdmin as any).avatar,
        lastActive: superAdmin.lastActive,
        record: superAdmin
      };
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
    isCustomPermissions: Boolean((targetAccount.record as any)?.isCustomPermissions) || (Array.isArray(targetAccount.permissions) && targetAccount.permissions.length > 0),
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
  const loginNowIso = new Date().toISOString();
  const cutoff24hLogin = Date.now() - 24 * 3600 * 1000;

  db.activeSessions = db.activeSessions.filter((s: any) => {
    if (!s || !s.deviceId || !s.lastSeen) return false;
    if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
    const seen = new Date(s.lastSeen).getTime();
    return !isNaN(seen) && seen > cutoff24hLogin;
  });

  const existingSessionIdx = db.activeSessions.findIndex(s => s.deviceId === deviceId);
  if (existingSessionIdx >= 0) {
    db.activeSessions[existingSessionIdx].lastSeen = loginNowIso;
    db.activeSessions[existingSessionIdx].loginAt = loginNowIso;
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
      lastSeen: loginNowIso,
      loginAt: loginNowIso,
      createdAt: loginNowIso,
      userAgent: req.headers['user-agent']?.substring(0, 100) || 'Web Browser',
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

// ----------------------------------------------------
// 4. Google OAuth
// ----------------------------------------------------
authRouter.post('/api/auth/oauth/google', (req, res) => {
  const { email, name, avatar } = req.body;
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

// ----------------------------------------------------
// 5. /api/auth/me
// ----------------------------------------------------
authRouter.get('/api/auth/me', (req, res) => {
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

// ----------------------------------------------------
// 6. Validate Session
// ----------------------------------------------------
authRouter.post('/api/auth/validate-session', (req, res) => {
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

// ----------------------------------------------------
// 7. Logout
// ----------------------------------------------------
authRouter.post('/api/auth/logout', (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (deviceId) {
    db.activeSessions = db.activeSessions.filter(s => s.deviceId !== deviceId);
  }
  saveDatabase();
  res.json({ success: true, message: 'Logged out' });
});

export default authRouter;

