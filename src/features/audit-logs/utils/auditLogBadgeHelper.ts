import React from 'react';
import {
  HeartHandshake,
  Truck,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  UserMinus,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  Lock,
  Edit3,
  Layers,
  Package
} from 'lucide-react';

export function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function getActionBadge(action: string, actionType?: string): {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className: string;
} {
  const actLower = (action || '').toLowerCase();
  const type = (actionType || '').toLowerCase();

  if (type === 'handover' || actLower.includes('handover') || actLower.includes('handed over')) {
    return {
      icon: HeartHandshake,
      label: 'Handover',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (type === 'dispatch' || actLower.includes('dispatch') || actLower.includes('dispatched')) {
    return {
      icon: Truck,
      label: 'Dispatched',
      className: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  }
  if (type === 'permission_change' || actLower.includes('permission') || actLower.includes('role')) {
    return {
      icon: ShieldCheck,
      label: 'Permission / Access',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (actLower.includes('temp password') || actLower.includes('temporary password') || actLower.includes('password reset')) {
    return {
      icon: UserCheck,
      label: 'Password Reset',
      className: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }
  if (actLower.includes('staff updated') || type === 'staff_update' || type === 'user_update') {
    return {
      icon: UserCog,
      label: 'Staff Edited',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    };
  }
  if (actLower.includes('staff added') || type === 'staff_create' || type === 'user_create') {
    return {
      icon: UserPlus,
      label: 'Staff Added',
      className: 'bg-teal-50 text-teal-700 border-teal-200'
    };
  }
  if (actLower.includes('staff removed') || type === 'staff_delete' || type === 'user_delete') {
    return {
      icon: UserMinus,
      label: 'Staff Removed',
      className: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  if (type.includes('certificate') || actLower.includes('certificate')) {
    return {
      icon: Award,
      label: 'Certificate',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  if (type === 'status_change' || actLower.includes('status changed') || actLower.includes('status')) {
    return {
      icon: ArrowRight,
      label: 'Status Change',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  if (type === 'return_to_store' || actLower.includes('returned to store') || actLower.includes('return to store')) {
    return {
      icon: RotateCcw,
      label: 'Return to Store',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (type === 'approval' || type === 'approve' || actLower.includes('approv')) {
    return {
      icon: CheckCircle2,
      label: 'Item Approved',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (type === 'rejection' || type === 'reject' || actLower.includes('reject')) {
    return {
      icon: AlertCircle,
      label: 'Item Rejected',
      className: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  if (type === 'create' || actLower.includes('register') || actLower.includes('item added') || actLower.includes('submission')) {
    return {
      icon: PlusCircle,
      label: 'Item Registered',
      className: 'bg-sky-50 text-sky-700 border-sky-200'
    };
  }
  if (type === 'trash' || actLower.includes('trash') || actLower.includes('removed items')) {
    return {
      icon: Trash2,
      label: 'Moved to Trash',
      className: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  if (type === 'restore' || actLower.includes('restore')) {
    return {
      icon: RotateCcw,
      label: 'Item Restored',
      className: 'bg-teal-50 text-teal-700 border-teal-200'
    };
  }
  if (type === 'delete' || actLower.includes('permanently deleted') || actLower.includes('delete')) {
    return {
      icon: Trash2,
      label: 'Item Deleted',
      className: 'bg-red-50 text-red-700 border-red-200'
    };
  }
  if (type === 'auth' || actLower.includes('password') || actLower.includes('login')) {
    return {
      icon: Lock,
      label: 'Security / Auth',
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  return {
    icon: Edit3,
    label: 'Item Updated',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  };
}

export const QUICK_FILTER_OPTIONS = [
  { label: 'All Actions', value: 'all' },
  { label: 'Handovers', value: 'handover' },
  { label: 'Status Changes', value: 'status_change' },
  { label: 'Dispatches', value: 'dispatch' },
  { label: 'Item Adds', value: 'create' },
  { label: 'Item Edits', value: 'update' },
  { label: 'Permissions', value: 'permission_change' },
  { label: 'Staff Edits', value: 'user_update' },
  { label: 'Deletions', value: 'delete' },
  { label: 'Certificates', value: 'certificate' }
];

export const ENTITY_TABS = [
  { id: 'all', label: 'All Activities', icon: Layers },
  { id: 'item', label: 'Lost Items', icon: Package },
  { id: 'staff', label: 'Staff & Permissions', icon: UserCog },
  { id: 'certificate', label: 'Certificates', icon: Award },
  { id: 'security', label: 'Security & Auth', icon: Lock }
];
