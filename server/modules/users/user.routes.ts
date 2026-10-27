import { Router } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { parseUserAgentInfo } from '../../utils/device.utils.ts';
import { User } from '../../../src/types.ts';

const router = Router();

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  const body = req.body;
  const actor = (req.headers['x-user-name'] as string) || '';
  const role = (req.headers['x-user-role'] as User['role']) || 'Employee';
  const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();

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

// POST /api/user/change-password
router.post('/change-password', async (req, res) => {
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

export default router;
