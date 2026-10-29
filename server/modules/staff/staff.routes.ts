import { Router } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { parseUserAgentInfo } from '../../utils/device.utils.ts';
import { actorHasPermission } from '../../middleware/permission.middleware.ts';
import { DEFAULT_ROLE_PERMISSIONS } from '../../../src/types.ts';
import { StaffMember, User } from '../../../src/types.ts';
import { cloudinaryService } from '../media/cloudinary.service.ts';

const router = Router();

// GET all staff
router.get('/', async (req, res) => {
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

// Real-time Database Duplicate Verification Endpoint (Staff ID, Iqama, Email, Phone)
router.get('/check-duplicate', (req, res) => {
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

// POST new staff member
router.post('/', async (req, res) => {
  const body = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  
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

  if (targetIqama) {
    const duplicateIqama = db.staff.find(
      s => s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === targetIqama.toLowerCase()
    );
    if (duplicateIqama) {
      duplicateErrors.iqamaNumber = `Already exists: Iqama Number "${targetIqama}" is already registered to ${duplicateIqama.name}. Duplicate Iqama numbers are not permitted.`;
    }
  }

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

// Dedicated Admin Staff Password Management Endpoint
router.post('/:id/password', async (req, res) => {
  const staffId = req.params.id;
  const { newPassword, isTemporary, expiresInHours = 24 } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const userEmail = (req.headers['x-user-email'] as string || '').toLowerCase();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '192.168.1.45';
  const ua = req.headers['user-agent'] || '';
  const { browser, os, deviceType } = parseUserAgentInfo(ua);
  const clientDevice = `${deviceType} • ${os}`;

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

// PUT update staff member
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const actorEmail = (req.headers['x-user-email'] as string || '').toLowerCase();

  const index = db.staff.findIndex(
    s => s.id === id || (s as any)._id === id || s.userId === id || s.email?.toLowerCase() === id.toLowerCase() || s.staffId === id
  );

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

  // Automatic Cloudinary Upload for Avatar Photo
  if (body.avatar && typeof body.avatar === 'string' && body.avatar.startsWith('data:') && cloudinaryService.isConfigured()) {
    try {
      const cloudRes = await cloudinaryService.upload(body.avatar, {
        folder: 'warwick_avatars',
        resourceType: 'image',
        publicId: `avatar_${id}_${Date.now()}`
      });
      body.avatar = cloudRes.secureUrl;
    } catch (err: any) {
      console.warn('[Cloudinary] Failed to upload avatar to Cloudinary:', err.message);
    }
  }

  const currentStaffId = (index >= 0 ? db.staff[index].id : id);

  const targetStaffId = (body.staffId !== undefined ? body.staffId : '').trim();
  const targetIqama = (body.iqamaNumber !== undefined ? body.iqamaNumber : '').trim();
  const targetEmail = (body.email !== undefined ? body.email : '').trim().toLowerCase();
  const targetPhone = (body.phone !== undefined ? body.phone : '').trim().replace(/[\s\-\+\(\)]/g, '');

  const duplicateErrors: Record<string, string> = {};

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

  if (targetIqama) {
    const duplicateIqama = db.staff.find(
      s => s.id !== currentStaffId && s.userId !== currentStaffId &&
           s.iqamaNumber && s.iqamaNumber.trim().toLowerCase() === targetIqama.toLowerCase()
    );
    if (duplicateIqama) {
      duplicateErrors.iqamaNumber = `Already exists: Iqama Number "${targetIqama}" is already registered to ${duplicateIqama.name}. Duplicate Iqama numbers are not permitted.`;
    }
  }

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
    if (Array.isArray(body.permissions)) {
      const roleDefault = DEFAULT_ROLE_PERMISSIONS[db.staff[index].role] || [];
      const isDiff = body.permissions.length !== roleDefault.length || body.permissions.some(p => !roleDefault.includes(p));
      db.staff[index].isCustomPermissions = body.isCustomPermissions !== undefined ? Boolean(body.isCustomPermissions) : isDiff;
    }
    updatedStaff = db.staff[index];
  } else {
    const roleDefault = DEFAULT_ROLE_PERMISSIONS[body.role || 'Employee'] || [];
    const isDiff = Array.isArray(body.permissions) && (body.permissions.length !== roleDefault.length || body.permissions.some(p => !roleDefault.includes(p)));
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
      isCustomPermissions: body.isCustomPermissions !== undefined ? Boolean(body.isCustomPermissions) : isDiff,
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
      await mongoService.updateStaff(id, {
        ...body,
        isCustomPermissions: updatedStaff.isCustomPermissions
      });
    } catch (e: any) {
      console.warn('Mongo updateStaff error:', e.message);
    }
  }

  const matchingUser = db.users.find(
    u => (u.id === id || (u as any).staffId === updatedStaff.staffId || (u.email && updatedStaff.email && u.email.toLowerCase() === updatedStaff.email.toLowerCase()))
  );
  if (matchingUser) {
    if (body.role) matchingUser.role = body.role;
    if (body.permissions) {
      matchingUser.permissions = body.permissions;
      (matchingUser as any).isCustomPermissions = updatedStaff.isCustomPermissions;
    }
    if (body.name) matchingUser.name = body.name;
    if (body.department) matchingUser.department = body.department;
    if (body.phone) matchingUser.phone = body.phone;
    if (body.dateOfBirth) matchingUser.dateOfBirth = body.dateOfBirth;
    if (body.iqamaNumber) matchingUser.iqamaNumber = body.iqamaNumber;
    if (body.staffId) matchingUser.staffId = body.staffId;
    if (body.workplace) matchingUser.workplace = body.workplace;
    if (body.avatar) matchingUser.avatar = updatedStaff.avatar;
  }

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

// DELETE staff member
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

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

export default router;
