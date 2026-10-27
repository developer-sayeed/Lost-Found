import { PermissionKey, StaffDepartment, UserRole } from './common.types';

export interface StaffMember {
  id: string;
  serial: number;
  name: string;
  userId: string; // email / identifier
  email: string;
  phone: string;
  department: StaffDepartment;
  role: UserRole;
  password?: string;
  tempPassword?: string;
  tempPasswordExpiresAt?: string;
  isTempPassword?: boolean;
  status: 'Active' | 'Inactive' | 'Suspended';
  avatar?: string;
  dateOfBirth?: string;
  iqamaNumber?: string;
  staffId?: string;
  workplace?: string;
  position?: string;
  emergencyContact?: string;
  notes?: string;
  itemsFoundCount: number;
  handoversCount: number;
  permissions?: PermissionKey[];
  isCustomPermissions?: boolean;
  createdAt: string;
  lastLogin?: string;
  lastActive?: string;
  token?: string;
}

export type Staff = StaffMember;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: StaffDepartment;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  iqamaNumber?: string;
  staffId?: string;
  userId?: string;
  workplace?: string;
  position?: string;
  emergencyContact?: string;
  permissions?: PermissionKey[];
  isCustomPermissions?: boolean;
  password?: string;
  authProvider: 'email' | 'google';
  lastActive?: string;
  token?: string;
}
