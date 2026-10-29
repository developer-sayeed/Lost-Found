import express from 'express';
import { UserRole, PermissionKey, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../../src/types.ts';
import { db } from '../database/json-db.ts';

// Central helper to resolve permissions for any requesting actor
// Evaluates role baseline (with settings rolePermissions matrix override) + individual user-specific upgraded permissions
export const resolveActorPermissions = (
  req: express.Request
): { role: UserRole; permissions: PermissionKey[]; isSuperAdmin: boolean; name: string; email: string } => {
  const rawRole = (req.headers['x-user-role'] as string) || '';
  const actorName = ((req.headers['x-user-name'] as string) || '').trim();
  const actorEmail = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase();
  const actorId = ((req.headers['x-user-id'] as string) || '').trim().toLowerCase();

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
      isSuperAdmin: true,
      name: actorName || 'MD ABU SAYEED RIDAY',
      email: actorEmail || 'mdriday256@gmail.com'
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

  const resolvedName = targetAccount?.name || actorName || 'Authorized Staff';
  const resolvedEmail = targetAccount?.email || actorEmail || '';

  if (role === 'Super Admin') {
    return {
      role: 'Super Admin',
      permissions: ALL_PERMISSIONS.map(p => p.id),
      isSuperAdmin: true,
      name: resolvedName,
      email: resolvedEmail
    };
  }

  // 3. Baseline role permissions from settings matrix override or default
  let baselinePerms: PermissionKey[] = DEFAULT_ROLE_PERMISSIONS[role] || [];
  if (db.settings?.rolePermissions && db.settings.rolePermissions[role] && Array.isArray(db.settings.rolePermissions[role])) {
    baselinePerms = db.settings.rolePermissions[role] as PermissionKey[];
  }

  // 4. Custom/upgraded permissions specifically assigned to this staff member
  let customPerms: PermissionKey[] = [];
  if (Array.isArray(targetAccount?.permissions) && targetAccount.permissions.length > 0) {
    customPerms = targetAccount.permissions as PermissionKey[];
  }

  // Active permissions: If member has explicit permissions array assigned or isCustomPermissions flagged, honor it!
  const hasCustom = Boolean(targetAccount?.isCustomPermissions) || (Array.isArray(targetAccount?.permissions) && targetAccount.permissions.length > 0);
  const activePerms = (hasCustom && customPerms.length > 0)
    ? customPerms
    : baselinePerms;

  return {
    role,
    permissions: activePerms,
    isSuperAdmin: false,
    name: resolvedName,
    email: resolvedEmail
  };
};

export const actorHasPermission = (req: express.Request, perm: PermissionKey): boolean => {
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

  // Media permissions hierarchy
  if (perm === 'media_view' && (permissions.includes('media') || permissions.includes('media_view'))) return true;
  if (perm === 'media_upload' && (permissions.includes('media') || permissions.includes('media_upload'))) return true;
  if (perm === 'media_edit' && (permissions.includes('media') || permissions.includes('media_edit'))) return true;
  if (perm === 'media_delete' && permissions.includes('media_delete')) return true;
  if (perm === 'media' && (permissions.includes('media') || permissions.includes('media_view'))) return true;

  // Staff management permissions hierarchy
  if (perm === 'staff_management' && (permissions.includes('staff_management') || permissions.includes('manage_staff_access') || permissions.includes('edit_staff'))) return true;
  if (perm === 'manage_staff_access' && (permissions.includes('manage_staff_access') || permissions.includes('staff_management'))) return true;
  if (perm === 'edit_staff' && (permissions.includes('edit_staff') || permissions.includes('manage_staff_access'))) return true;
  if (perm === 'view_staff_profile' && (permissions.includes('view_staff_profile') || permissions.includes('staff_management'))) return true;

  // Settings permissions hierarchy
  if (perm === 'settings' && (
    permissions.includes('settings') ||
    permissions.includes('manage_staff_access') ||
    permissions.some(p => typeof p === 'string' && p.startsWith('settings_'))
  )) return true;

  if (typeof perm === 'string' && perm.startsWith('settings_')) {
    if (permissions.includes('settings')) return true;
    if (perm === 'settings_security' && permissions.includes('manage_staff_access')) return true;
  }

  return false;
};
