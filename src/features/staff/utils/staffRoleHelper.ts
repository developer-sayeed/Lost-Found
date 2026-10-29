import {
  ShieldCheck,
  Shield,
  Briefcase,
  Sliders,
  User,
  UserCheck,
  PackageCheck,
  ShieldAlert
} from 'lucide-react';
import { UserRole, PermissionCategory } from '../../../types';

export const PERMISSION_GROUPS: {
  category: PermissionCategory;
  title: string;
  icon: string;
}[] = [
  {
    category: 'Items',
    title: 'ITEM OPERATIONS & INVENTORY',
    icon: '📦'
  },
  {
    category: 'Operations',
    title: 'WORKFLOW & PERFORMANCE ANALYTICS',
    icon: '🔄'
  },
  {
    category: 'Certificates',
    title: 'CERTIFICATES & AWARDS',
    icon: '📜'
  },
  {
    category: 'Media',
    title: 'MEDIA LIBRARY & ASSETS',
    icon: '🖼️'
  },
  {
    category: 'Administration',
    title: 'STAFF & ACCESS CONTROL',
    icon: '👥'
  },
  {
    category: 'Settings',
    title: 'SYSTEM CONFIGURATION & INTEGRATIONS',
    icon: '⚙️'
  }
];

export const SYSTEM_ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Manager',
  'Supervisor',
  'Employee',
  'Receptionist',
  'Housekeeping',
  'Security'
];

export const ROLE_META: Record<UserRole, {
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
  icon: any;
}> = {
  'Super Admin': {
    label: 'Super Admin',
    description: 'Master system authority. Unrestricted operational access, security configuration, database sync & hard deletion.',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    accentBg: 'bg-indigo-600',
    icon: ShieldCheck
  },
  'Admin': {
    label: 'Admin',
    description: 'Full hotel operations management. Oversees staff directory, item handovers, dispatch workflows & certificates.',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    accentBg: 'bg-purple-600',
    icon: Shield
  },
  'Manager': {
    label: 'Manager',
    description: 'Departmental oversight. Processes guest claims, audit logs, staff reviews, and certificate templates.',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-200',
    accentBg: 'bg-amber-600',
    icon: Briefcase
  },
  'Supervisor': {
    label: 'Supervisor',
    description: 'Shift supervisor. Handles item registrations, finder staff dispatches, print receipts & audit logs.',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-200',
    accentBg: 'bg-sky-600',
    icon: Sliders
  },
  'Employee': {
    label: 'Employee',
    description: 'Frontline associate. Logs newly found items and searches records within department bounds.',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-200',
    accentBg: 'bg-slate-600',
    icon: User
  },
  'Receptionist': {
    label: 'Receptionist',
    description: 'Front desk operations. Processes guest handovers, receipts, and item returns.',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderColor: 'border-teal-200',
    accentBg: 'bg-teal-600',
    icon: UserCheck
  },
  'Housekeeping': {
    label: 'Housekeeping',
    description: 'Room and public area operations. Registers found items and tracks room locations.',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    accentBg: 'bg-emerald-600',
    icon: PackageCheck
  },
  'Security': {
    label: 'Security',
    description: 'Security & loss prevention. Logs items, verifies guest claims, and prints reports.',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    accentBg: 'bg-rose-600',
    icon: ShieldAlert
  }
};
