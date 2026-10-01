import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  UserCheck2,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  KeyRound,
  Sliders,
  CheckCircle2,
  User,
  PackageCheck,
  Lock,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Check,
  Minus,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  Info,
  BadgeCheck,
  ShieldAlert,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  StaffMember,
  UserRole,
  PermissionKey,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionCategory
} from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { StaffPasswordModal } from './modals/StaffPasswordModal';

type SortField = 'name' | 'department' | 'role' | 'itemsCount' | 'status';
type SortOrder = 'asc' | 'desc';

const PERMISSION_GROUPS: {
  category: PermissionCategory;
  title: string;
  icon: string;
}[] = [
  {
    category: 'Items',
    title: 'ITEM OPERATIONS',
    icon: '📦'
  },
  {
    category: 'Operations',
    title: 'GUEST & WORKFLOW ACTIONS',
    icon: '🔄'
  },
  {
    category: 'Certificates',
    title: 'CERTIFICATES & AWARDS (PERMISSION-CONTROLLED)',
    icon: '📜'
  },
  {
    category: 'Administration',
    title: 'ADMINISTRATION (STAFF & SYSTEM)',
    icon: '⚙️'
  }
];

const SYSTEM_ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Manager',
  'Supervisor',
  'Employee',
  'Receptionist',
  'Housekeeping',
  'Security'
];

const ROLE_META: Record<UserRole, {
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
    description: 'Front desk operations. Processes guest handovers, receipts, and item inquiries.',
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

export const StaffManagementView: React.FC = () => {
  const { staff, items, setIsStaffModalOpen, setEditingStaff, updateStaff, deleteStaff, openStaffProfile, settings, updateSettings } = useApp();
  const { user, hasPermission } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [passwordStaffTarget, setPasswordStaffTarget] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const deleteStaffModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isDeleting) setStaffToDelete(null);
  }, {
    active: !!staffToDelete,
    closeOnEsc: true
  });

  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdmin = isSuperAdmin || user?.role === 'Admin';
  const isManager = isAdmin || user?.role === 'Manager';
  const isSupervisor = isManager || user?.role === 'Supervisor';

  const canManageStaff = isSuperAdmin || isAdmin || hasPermission('staff_management') || hasPermission('manage_staff_access');
  const canEditStaff = isSuperAdmin || isAdmin || hasPermission('edit_staff') || hasPermission('manage_staff_access');
  const canDeleteStaff = isSuperAdmin || (isAdmin && hasPermission('delete_staff'));
  const canManageAccess = isSuperAdmin || isAdmin || hasPermission('manage_staff_access');
  const canViewOtherProfiles = isSuperAdmin || isAdmin || isManager || hasPermission('view_staff_profile');
  const canViewPermissionsTab = isSuperAdmin || isAdmin || isManager || hasPermission('manage_staff_access') || hasPermission('staff_management');

  // Permission Management View states
  const [activeTab, setActiveTab] = useState<'directory' | 'permissions'>('directory');
  const [matrixRoleFilter, setMatrixRoleFilter] = useState<string>('All');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('All');
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(true);
  const [staffOverrideFilter, setStaffOverrideFilter] = useState<'All' | 'Custom' | 'Default'>('All');
  const [staffPermSearch, setStaffPermSearch] = useState('');
  const [staffRoleFilterInPerms, setStaffRoleFilterInPerms] = useState('All');

  // Role Baseline Permission Matrix Management State
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  // Helper to get active baseline permissions for a role (settings override or standard default)
  const getRoleBaselinePermissions = useCallback((role: UserRole): PermissionKey[] => {
    if (settings?.rolePermissions && settings.rolePermissions[role]) {
      return settings.rolePermissions[role] as PermissionKey[];
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }, [settings?.rolePermissions]);

  const isRoleCustomized = useCallback((role: UserRole): boolean => {
    if (!settings?.rolePermissions?.[role]) return false;
    const custom = settings.rolePermissions[role] as PermissionKey[];
    const def = DEFAULT_ROLE_PERMISSIONS[role] || [];
    if (custom.length !== def.length) return true;
    const defSet = new Set(def);
    return custom.some(p => !defSet.has(p));
  }, [settings?.rolePermissions]);

  const hasAnyRoleCustomized = useMemo(() => {
    return SYSTEM_ROLES.some(r => isRoleCustomized(r));
  }, [isRoleCustomized]);

  // Toggle mark / unmark a specific permission for a role in baseline matrix
  const handleToggleRolePermission = async (role: UserRole, permId: PermissionKey) => {
    if (!canManageAccess) {
      toast.warning('Administrator access required to modify role baseline permissions.');
      return;
    }

    const currentPerms = getRoleBaselinePermissions(role);
    const hasPerm = currentPerms.includes(permId);
    const newPerms = hasPerm
      ? currentPerms.filter(p => p !== permId)
      : [...currentPerms, permId];

    const currentMap = settings?.rolePermissions || {};
    const updatedRolePermissions: Partial<Record<UserRole, PermissionKey[]>> = {
      ...currentMap,
      [role]: newPerms
    };

    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: updatedRolePermissions });
      const permObj = ALL_PERMISSIONS.find(p => p.id === permId);
      const permName = permObj ? permObj.label : permId;
      toast.success(`${hasPerm ? 'Unmarked (Revoked)' : 'Marked (Granted)'} "${permName}" for role "${role}".`, {
        autoClose: 1800
      });
    } catch (err: any) {
      console.error('Failed to update role baseline permission:', err);
      toast.error(err.message || 'Failed to update role permission');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Grant all permissions for a specific role
  const handleGrantAllForRole = async (role: UserRole) => {
    if (!canManageAccess) return;
    const currentMap = settings?.rolePermissions || {};
    const updatedRolePermissions: Partial<Record<UserRole, PermissionKey[]>> = {
      ...currentMap,
      [role]: ALL_PERMISSIONS.map(p => p.id)
    };
    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: updatedRolePermissions });
      toast.success(`Granted all permissions to role "${role}".`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant all permissions');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Revoke all permissions for a specific role
  const handleRevokeAllForRole = async (role: UserRole) => {
    if (!canManageAccess) return;
    const currentMap = settings?.rolePermissions || {};
    const updatedRolePermissions: Partial<Record<UserRole, PermissionKey[]>> = {
      ...currentMap,
      [role]: []
    };
    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: updatedRolePermissions });
      toast.info(`Revoked all permissions from role "${role}".`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke permissions');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Reset a specific role back to standard default
  const handleResetRoleToDefault = async (role: UserRole) => {
    if (!canManageAccess) return;
    const currentMap = { ...(settings?.rolePermissions || {}) };
    delete currentMap[role];
    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: currentMap });
      toast.success(`Reset role "${role}" to standard baseline defaults.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset role');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Reset all roles back to factory default baseline
  const handleResetAllRolesToDefault = async () => {
    if (!canManageAccess) return;
    if (!window.confirm('Are you sure you want to reset ALL system roles back to standard factory baseline permissions?')) {
      return;
    }
    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: DEFAULT_ROLE_PERMISSIONS });
      toast.success('All system role baseline permissions reset to standard defaults.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset role permissions');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  // Inline staff permissions editing state
  const [expandedStaffPermId, setExpandedStaffPermId] = useState<string | null>(null);
  const [inlineStaffPerms, setInlineStaffPerms] = useState<PermissionKey[]>([]);
  const [isSavingInlinePerms, setIsSavingInlinePerms] = useState(false);

  const isStaffCustomized = (member: StaffMember) => {
    if (!member.permissions) return false;
    const defaultPerms = getRoleBaselinePermissions(member.role);
    if (member.permissions.length !== defaultPerms.length) return true;
    const defaultSet = new Set(defaultPerms);
    return member.permissions.some(p => !defaultSet.has(p));
  };

  const getStaffPermissions = (member: StaffMember): PermissionKey[] => {
    return member.permissions || getRoleBaselinePermissions(member.role);
  };

  const handleOpenInlinePerms = (member: StaffMember) => {
    if (expandedStaffPermId === member.id) {
      setExpandedStaffPermId(null);
    } else {
      setExpandedStaffPermId(member.id);
      setInlineStaffPerms(getStaffPermissions(member));
    }
  };

  const handleToggleInlinePerm = (permId: PermissionKey) => {
    setInlineStaffPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveInlinePerms = async (member: StaffMember) => {
    if (!canManageAccess) return;
    setIsSavingInlinePerms(true);
    try {
      await updateStaff(member.id, { permissions: inlineStaffPerms });
      setFeedbackNotice(`Permissions successfully updated for ${member.name}.`);
      toast.success(`Permissions updated for ${member.name}.`);
      setExpandedStaffPermId(null);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff permissions');
    } finally {
      setIsSavingInlinePerms(false);
    }
  };

  const handleResetStaffPermissions = async (member: StaffMember) => {
    if (!canManageAccess) return;
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[member.role] || [];
    try {
      await updateStaff(member.id, { permissions: defaultPerms });
      if (expandedStaffPermId === member.id) {
        setInlineStaffPerms(defaultPerms);
      }
      setFeedbackNotice(`Reset permissions for ${member.name} to ${member.role} defaults.`);
      toast.success(`Reset permissions for ${member.name} to ${member.role} defaults.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      toast.error('Failed to reset permissions');
    }
  };

  const handleGrantAllStaffPermissions = async (member: StaffMember) => {
    if (!canManageAccess) return;
    const allPerms = ALL_PERMISSIONS.map(p => p.id);
    try {
      await updateStaff(member.id, { permissions: allPerms });
      if (expandedStaffPermId === member.id) {
        setInlineStaffPerms(allPerms);
      }
      setFeedbackNotice(`Granted all permissions to ${member.name}.`);
      toast.success(`Granted all permissions to ${member.name}.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      toast.error('Failed to grant all permissions');
    }
  };

  const filteredPermissionsForMatrix = useMemo(() => {
    return ALL_PERMISSIONS.filter(p => {
      if (matrixCategoryFilter !== 'All' && p.category !== matrixCategoryFilter) return false;
      if (matrixSearch) {
        const q = matrixSearch.toLowerCase().trim();
        const matchLabel = p.label.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchLabel && !matchId && !matchDesc) return false;
      }
      return true;
    });
  }, [matrixCategoryFilter, matrixSearch]);

  const filteredStaffForPermissions = useMemo(() => {
    return staff.filter(member => {
      if (staffPermSearch) {
        const q = staffPermSearch.toLowerCase().trim();
        const matchName = (member.name || '').toLowerCase().includes(q);
        const matchId = (member.userId || '').toLowerCase().includes(q) || (member.staffId || '').toLowerCase().includes(q);
        const matchEmail = (member.email || '').toLowerCase().includes(q);
        const matchDep = (member.department || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail && !matchDep) return false;
      }
      if (staffRoleFilterInPerms !== 'All' && member.role !== staffRoleFilterInPerms) {
        return false;
      }
      if (staffOverrideFilter === 'Custom' && !isStaffCustomized(member)) return false;
      if (staffOverrideFilter === 'Default' && isStaffCustomized(member)) return false;
      return true;
    });
  }, [staff, staffPermSearch, staffRoleFilterInPerms, staffOverrideFilter]);

  // Unified global click-outside & Escape listener for staff action menu
  useEffect(() => {
    if (!activeMenuId) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest(`[data-staff-menu-popover="${activeMenuId}"]`) ||
        target.closest(`[data-staff-menu-btn="${activeMenuId}"]`)
      ) {
        return;
      }
      setActiveMenuId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  // Compute dynamic items logged per staff
  const staffWithStats = useMemo(() => {
    return staff.map(member => {
      const memberNameLower = (member.name || '').toLowerCase().trim();
      const memberIdLower = (member.staffId || member.userId || '').toLowerCase().trim();
      
      const loggedItemsCount = items.filter(it => {
        const itFinder = (it.foundBy || (it as any).employeeName || (it as any).employee_name || '').toLowerCase().trim();
        const itLogged = (it.loggedBy || (it as any).recordedBy || '').toLowerCase().trim();
        const itStaffId = ((it as any).staffId || (it as any).employeeId || '').toLowerCase().trim();

        return (
          (memberNameLower && (itFinder === memberNameLower || itLogged === memberNameLower)) ||
          (memberIdLower && itStaffId === memberIdLower)
        );
      }).length;

      return {
        ...member,
        computedItemsCount: loggedItemsCount
      };
    });
  }, [staff, items]);

  // Unique departments for filter dropdown
  const departmentsList = useMemo(() => {
    const deps = new Set<string>();
    staff.forEach(s => {
      if (s.department) deps.add(s.department);
    });
    return Array.from(deps);
  }, [staff]);

  // Filtered and Sorted Staff List
  const processedStaff = useMemo(() => {
    let result = staffWithStats.filter(s => {
      // Search
      if (searchQuery) {
        const q = (searchQuery || '').toLowerCase().trim();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchId = (s.userId || '').toLowerCase().includes(q) || (s.staffId || '').toLowerCase().includes(q);
        const matchEmail = (s.email || '').toLowerCase().includes(q);
        const matchDep = (s.department || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail && !matchDep && !matchRole) return false;
      }
      // Department
      if (departmentFilter !== 'All' && s.department !== departmentFilter) return false;
      // Role
      if (roleFilter !== 'All' && s.role !== roleFilter) return false;
      // Status
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'department') {
        comparison = (a.department || '').localeCompare(b.department || '');
      } else if (sortField === 'role') {
        comparison = (a.role || '').localeCompare(b.role || '');
      } else if (sortField === 'itemsCount') {
        comparison = a.computedItemsCount - b.computedItemsCount;
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [staffWithStats, searchQuery, departmentFilter, roleFilter, statusFilter, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(processedStaff.length / itemsPerPage) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedStaff.slice(start, start + itemsPerPage);
  }, [processedStaff, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      setIsDeleting(true);
      const name = staffToDelete.name;
      await deleteStaff(staffToDelete.id);
      setStaffToDelete(null);
      setFeedbackNotice(`Staff member "${name}" removed successfully.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStaffCount = staff.length;
  const activeCount = staff.filter(s => s.status === 'Active').length;
  const managerCount = staff.filter(s => s.role === 'Manager' || s.department === 'Manager').length;
  const employeeCount = staff.filter(s => s.role === 'Employee' || s.role === 'Supervisor').length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedbackNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Metric Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Staff */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              TOTAL STAFF
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {totalStaffCount}
            </p>
            <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-indigo-600 font-medium truncate">
              <span className="mr-1">•</span>Registered personnel
            </div>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 ml-2">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              ACTIVE USERS
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
              {activeCount}
            </p>
            <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-emerald-600 font-medium truncate">
              <span className="mr-1">•</span>Operational
            </div>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 ml-2">
            <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Manager */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              MANAGERS
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {managerCount}
            </p>
            <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-amber-600 font-medium truncate">
              <span className="mr-1">•</span>Elevated access
            </div>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 ml-2">
            <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Employees */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              EMPLOYEES
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {employeeCount}
            </p>
            <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-sky-600 font-medium truncate">
              <span className="mr-1">•</span>Frontline team
            </div>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 ml-2">
            <UserCheck2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: Staff Directory vs Function Permissions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            id="tab-btn-directory"
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
              activeTab === 'directory'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Staff Directory</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'directory' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {staff.length}
            </span>
          </button>

          {canViewPermissionsTab && (
            <button
              id="tab-btn-permissions"
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                activeTab === 'permissions'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Role &amp; Function Matrix</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'permissions' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {ALL_PERMISSIONS.length}
              </span>
              {staff.filter(isStaffCustomized).length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white shadow-2xs animate-pulse">
                  {staff.filter(isStaffCustomized).length}
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === 'directory' && canManageStaff && (
          <button
            id="btn-add-staff-member"
            onClick={() => {
              setEditingStaff(null);
              setIsStaffModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}

        {activeTab === 'permissions' && canManageAccess && (
          <button
            id="btn-new-staff-permission"
            onClick={() => {
              setEditingStaff(null);
              setIsStaffModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Staff with Permissions</span>
          </button>
        )}
      </div>

      {/* Tab 1: Staff Directory & Accounts */}
      {activeTab === 'directory' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Staff Accounts & Access Controls</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Staff Data Table
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage personnel records, dynamic lost item submissions, and role permissions
            </p>
          </div>

          {canManageStaff ? (
            <button
              id="btn-add-staff-member-secondary"
              onClick={() => {
                setEditingStaff(null);
                setIsStaffModalOpen(true);
              }}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-xl border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Management Permission Required</span>
            </div>
          )}
        </div>

        {/* Data Table Control Bar: Search + Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              id="input-staff-search"
              type="text"
              placeholder="Search staff, ID, department..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 min-h-[38px]"
            />
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full lg:w-auto">
            {/* Department Filter */}
            <div className="flex items-center space-x-1 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Dept:</span>
              <select
                value={departmentFilter}
                onChange={e => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
              >
                <option value="All">All Depts</option>
                {departmentsList.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-1 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Role:</span>
              <select
                value={roleFilter}
                onChange={e => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
              >
                <option value="All">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Staff Cards Feed (for phones & tablets < md) */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {paginatedStaff.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs px-4">
              No staff records found matching your filters.
            </div>
          ) : (
            paginatedStaff.map((member) => {
              const userEmail = (user?.email || '').toLowerCase().trim();
              const userName = (user?.name || '').toLowerCase().trim();
              const memberEmail = (member.email || '').toLowerCase().trim();
              const memberUserId = (member.userId || '').toLowerCase().trim();
              const memberName = (member.name || '').toLowerCase().trim();

              const isCurrentUser = Boolean(
                (memberEmail && userEmail && memberEmail === userEmail) ||
                (memberUserId && userEmail && memberUserId === userEmail) ||
                (memberName && userName && memberName === userName)
              );

              const permissions = member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || [];
              const isMemberSuperAdmin = member.role === 'Super Admin';
              const submittedItemsCount = member.computedItemsCount;

              return (
                <div key={`mobile-card-${member.id}`} className="p-3.5 space-y-3 hover:bg-slate-50/70 transition-colors">
                  {/* Card Header: Avatar, Name, Email, Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        onClick={() => {
                          if (canViewOtherProfiles || isCurrentUser) {
                            openStaffProfile(member);
                          }
                        }}
                        className={`w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 ${
                          canViewOtherProfiles || isCurrentUser ? 'cursor-pointer hover:bg-indigo-100' : ''
                        }`}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          member.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => (canViewOtherProfiles || isCurrentUser) && openStaffProfile(member)}
                            className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors truncate text-left"
                          >
                            {member.name}
                          </button>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 truncate">
                          <span>{member.staffId || member.userId}</span>
                          <span>•</span>
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      member.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {member.status}
                    </span>
                  </div>

                  {/* Badges: Department, Role, Items Logged */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {member.department} {member.position ? `• ${member.position}` : ''}
                    </span>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {isMemberSuperAdmin && <Shield className="w-3 h-3 mr-1 text-indigo-600" />}
                      {member.role}
                    </span>

                    {(canViewOtherProfiles || isCurrentUser) ? (
                      <button
                        type="button"
                        onClick={() => openStaffProfile(member)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100 transition-colors"
                      >
                        <PackageCheck className="w-3 h-3" />
                        <span>{submittedItemsCount} item{submittedItemsCount !== 1 ? 's' : ''}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                        <PackageCheck className="w-3 h-3" />
                        <span>{submittedItemsCount} item{submittedItemsCount !== 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Permissions Summary Pills */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Perms:</span>
                    {isMemberSuperAdmin ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-indigo-600" />
                        Master System Access
                      </span>
                    ) : (
                      <>
                        {permissions.slice(0, 3).map(p => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-tight"
                          >
                            {p}
                          </span>
                        ))}
                        {permissions.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            +{permissions.length - 3} more
                          </span>
                        )}
                        {permissions.length === 0 && (
                          <span className="text-[10px] text-rose-500 italic">No permissions</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions Toolbar on Mobile */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    {(canViewOtherProfiles || isCurrentUser) && (
                      <button
                        type="button"
                        onClick={() => openStaffProfile(member)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Profile</span>
                      </button>
                    )}

                    {(canEditStaff || canManageAccess) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaff(member);
                          setIsStaffModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit</span>
                      </button>
                    )}

                    {(canEditStaff || canManageAccess || isSuperAdmin) && (
                      <button
                        type="button"
                        onClick={() => setPasswordStaffTarget(member)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Change password or issue 24-hr pass"
                        aria-label="Change password"
                      >
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                      </button>
                    )}

                    {canDeleteStaff && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => setStaffToDelete(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Remove staff member"
                        aria-label="Remove staff"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Staff Table (hidden on mobile, shown on md+) */}
        <div className="hidden md:block overflow-auto max-h-[640px] rounded-b-xl border-t border-slate-100 relative">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] select-none">
                <th className="py-3.5 px-5 w-12 text-center sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">#</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Staff Identity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('department')}
                  className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Department & Work</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('role')}
                  className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('itemsCount')}
                  className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Items Logged (Real Data)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-5 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Granted Permissions</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-5 text-right sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((member, index) => {
                  const userEmail = (user?.email || '').toLowerCase().trim();
                  const userName = (user?.name || '').toLowerCase().trim();
                  const memberEmail = (member.email || '').toLowerCase().trim();
                  const memberUserId = (member.userId || '').toLowerCase().trim();
                  const memberName = (member.name || '').toLowerCase().trim();

                  const isCurrentUser = Boolean(
                    (memberEmail && userEmail && memberEmail === userEmail) ||
                    (memberUserId && userEmail && memberUserId === userEmail) ||
                    (memberName && userName && memberName === userName)
                  );

                  const permissions = member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || [];
                  const isMemberSuperAdmin = member.role === 'Super Admin';
                  const submittedItemsCount = member.computedItemsCount;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-center font-medium text-slate-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div 
                            onClick={() => {
                              if (canViewOtherProfiles || isCurrentUser) {
                                openStaffProfile(member);
                              }
                            }}
                            className={`w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ${
                              canViewOtherProfiles || isCurrentUser ? 'cursor-pointer hover:bg-indigo-100' : ''
                            } transition-colors`}
                          >
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              member.name[0]
                            )}
                          </div>
                          <div>
                            {canViewOtherProfiles || isCurrentUser ? (
                              <button
                                onClick={() => openStaffProfile(member)}
                                className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                              >
                                {member.name}
                              </button>
                            ) : (
                              <span className="font-semibold text-slate-900 text-left block">
                                {member.name}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <span className="font-mono text-slate-500">{member.staffId || member.userId}</span>
                              <span>•</span>
                              <span>{member.email}</span>
                            </span>
                          </div>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">
                        <div className="font-medium text-slate-900">{member.department}</div>
                        <div className="text-[11px] text-slate-500">{member.position || member.workplace || 'Staff'}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {isMemberSuperAdmin && <Shield className="w-3 h-3 mr-1 text-indigo-600" />}
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {canViewOtherProfiles || isCurrentUser ? (
                          <button
                            onClick={() => openStaffProfile(member)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{submittedItemsCount} item{submittedItemsCount !== 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{submittedItemsCount} item{submittedItemsCount !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {isMemberSuperAdmin ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-indigo-600" />
                            Master Access
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {permissions.slice(0, 3).map(p => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-tight"
                              >
                                {p}
                              </span>
                            ))}
                            {permissions.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                +{permissions.length - 3} more
                              </span>
                            )}
                            {permissions.length === 0 && (
                              <span className="text-[11px] text-rose-500 italic">
                                No permissions
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                          member.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right relative" data-staff-menu-container>
                        <div className="flex items-center justify-end space-x-1">
                          {(canEditStaff || canManageAccess || isSuperAdmin) && (
                            <button
                              id={`btn-staff-pass-quick-${member.id}`}
                              onClick={() => setPasswordStaffTarget(member)}
                              title="Change password or generate 24-hr pass"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteStaff && !isCurrentUser && (
                            <button
                              id={`btn-staff-delete-quick-${member.id}`}
                              onClick={() => setStaffToDelete(member)}
                              title="Remove staff member"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            id={`btn-staff-menu-${member.id}`}
                            data-staff-menu-btn={member.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === member.id ? null : member.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              activeMenuId === member.id
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {activeMenuId === member.id && (
                          <div 
                            data-staff-menu-popover={member.id}
                            className="absolute right-4 top-10 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            {(canViewOtherProfiles || isCurrentUser) && (
                              <button
                                onClick={() => {
                                  openStaffProfile(member);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                              >
                                <User className="w-3.5 h-3.5 text-indigo-600" />
                                <span>View Profile & Items</span>
                              </button>
                            )}
                            
                            {(canEditStaff || canManageAccess) && (
                              <button
                                onClick={() => {
                                  setEditingStaff(member);
                                  setIsStaffModalOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                              >
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Edit & Permissions</span>
                              </button>
                            )}

                            {(canEditStaff || canManageAccess || isSuperAdmin) && (
                              <button
                                id={`btn-staff-pass-menu-${member.id}`}
                                onClick={() => {
                                  setPasswordStaffTarget(member);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Change / 24-Hr Password</span>
                              </button>
                            )}

                            {canDeleteStaff && !isCurrentUser && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setStaffToDelete(member);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Staff</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Data Table Pagination & Counter Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>Showing <strong className="text-slate-800 font-mono">{processedStaff.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, processedStaff.length)}</strong> of <strong className="text-slate-800 font-mono">{processedStaff.length}</strong> staff entries</span>
            <span>•</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Function Permissions & Role Access Matrix */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-fade-in">
          {/* Permission Management Header & Role-Based Security Notice */}
          {!canManageAccess ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Role-Based Read-Only Access
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  You are viewing the hotel system function permissions and organizational role matrices in audit inspection mode. 
                  Super Admin credentials or the <strong>"Manage Security &amp; Permissions"</strong> privilege is required to edit permissions or assign custom role overrides.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center space-x-2">
                  <span>Administrative Security &amp; Privilege Configuration</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">Full Access</span>
                </h4>
                <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                  Configure granular function-level access rights across all 4 operational modules. You can inspect baseline role inheritance, grant custom privilege overrides for specific employees, or revert to verified hotel defaults.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Functions</span>
                <Sliders className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{ALL_PERMISSIONS.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Across 4 modules</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Staff Evaluated</span>
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{staff.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Active staff profiles</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Custom Overrides</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {staff.filter(isStaffCustomized).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Bespoke staff access</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Standard Baselines</span>
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{SYSTEM_ROLES.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Role tier definitions</div>
            </div>
          </div>

          {/* Section 1: System Role Baseline Permission Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 flex-wrap gap-y-1">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>System Role Baseline Permission Matrix</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                    Role Inheritance
                  </span>
                  {hasAnyRoleCustomized && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Custom Baseline Active</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard baseline privileges granted to hotel staff roles. Administrators can mark or unmark any permission for any role below.
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {canManageAccess && hasAnyRoleCustomized && (
                  <button
                    type="button"
                    disabled={isSavingMatrix}
                    onClick={handleResetAllRolesToDefault}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Restore standard factory baseline permissions for all roles"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All to Defaults</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isMatrixExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse Matrix</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand Matrix</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isMatrixExpanded && (
              <div className="p-4 sm:p-6 space-y-4">
                {/* Admin Guidance / Tip Banner */}
                <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Interactive Permission Matrix:</strong> Administrators can mark or unmark any function for any role. Click any checkbox to toggle access, or use <strong>All</strong> / <strong>None</strong> on role headers.
                    </span>
                  </div>
                  {isSavingMatrix && (
                    <span className="text-[11px] font-bold text-indigo-600 animate-pulse flex items-center space-x-1 shrink-0 ml-2">
                      <span>Saving...</span>
                    </span>
                  )}
                </div>

                {/* Matrix Filter & Search Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search functions, keys, or descriptions..."
                      value={matrixSearch}
                      onChange={e => setMatrixSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {/* Category Filter Pills */}
                    <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
                      {(['All', 'Items', 'Operations', 'Certificates', 'Administration'] as const).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setMatrixCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            matrixCategoryFilter === cat
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {cat === 'All' ? 'All Modules' : cat}
                        </button>
                      ))}
                    </div>

                    {/* Role Filter Dropdown */}
                    <select
                      value={matrixRoleFilter}
                      onChange={e => setMatrixRoleFilter(e.target.value)}
                      className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[34px]"
                    >
                      <option value="All">All Roles Highlight</option>
                      {SYSTEM_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile horizontal swipe & sticky heading notice */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-indigo-700 bg-indigo-50/90 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium">
                  <span className="flex items-center space-x-1.5">
                    <span className="text-indigo-600 font-bold">📌 Sticky Headings Active:</span>
                    <span>Role column headers remain sticky at top when scrolling down, and permission labels stay sticky on left when swiping horizontally.</span>
                  </span>
                  <span className="text-indigo-600 font-semibold text-[10px] hidden md:inline shrink-0">
                    8 Roles • {filteredPermissionsForMatrix.length} Functions
                  </span>
                </div>

                {/* Matrix Table with Sticky Headers */}
                <div className="overflow-auto max-h-[620px] rounded-xl border border-slate-200 shadow-2xs relative">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] select-none">
                        <th className="py-3 px-4 w-1/3 min-w-[220px] sm:min-w-[260px] sticky top-0 left-0 bg-slate-50 z-30 shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.08)] border-b border-r border-slate-200">
                          Function / Permission
                        </th>
                        {SYSTEM_ROLES.map(role => {
                          const meta = ROLE_META[role];
                          const isFiltered = matrixRoleFilter === 'All' || matrixRoleFilter === role;
                          const rolePerms = getRoleBaselinePermissions(role);
                          const isCustom = isRoleCustomized(role);

                          return (
                            <th
                              key={role}
                              className={`py-3 px-2 text-center transition-opacity min-w-[100px] sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.06)] ${
                                isFiltered ? 'opacity-100' : 'opacity-40'
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText} border ${meta.borderColor} whitespace-nowrap`}>
                                  {role}
                                </span>
                                <div className="text-[10px] font-mono text-slate-500 font-semibold">
                                  {rolePerms.length} / {ALL_PERMISSIONS.length}
                                </div>
                                {canManageAccess && (
                                  <div className="flex items-center space-x-1 pt-0.5">
                                    <button
                                      type="button"
                                      disabled={isSavingMatrix}
                                      onClick={() => handleGrantAllForRole(role)}
                                      title={`Grant all permissions to ${role}`}
                                      className="text-[9px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      All
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSavingMatrix}
                                      onClick={() => handleRevokeAllForRole(role)}
                                      title={`Revoke all permissions from ${role}`}
                                      className="text-[9px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      None
                                    </button>
                                    {isCustom && (
                                      <button
                                        type="button"
                                        disabled={isSavingMatrix}
                                        onClick={() => handleResetRoleToDefault(role)}
                                        title={`Reset ${role} to default`}
                                        className="text-[9px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1 py-0.5 rounded cursor-pointer transition-colors"
                                      >
                                        ↺
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPermissionsForMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={1 + SYSTEM_ROLES.length} className="py-8 text-center text-slate-400">
                            No permissions match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPermissionsForMatrix.map((perm, idx) => {
                          return (
                            <tr key={perm.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                              <td className={`py-3 px-4 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-b border-r border-slate-200/80 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <div className="flex items-start space-x-2.5">
                                  <span className="text-base mt-0.5">
                                    {perm.category === 'Items' && '📦'}
                                    {perm.category === 'Operations' && '🔄'}
                                    {perm.category === 'Certificates' && '📜'}
                                    {perm.category === 'Administration' && '⚙️'}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-bold text-slate-900 leading-tight">{perm.label}</p>
                                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {perm.id}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                      {perm.description}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {SYSTEM_ROLES.map(role => {
                                const rolePerms = getRoleBaselinePermissions(role);
                                const isMarked = rolePerms.includes(perm.id);
                                const isFiltered = matrixRoleFilter === 'All' || matrixRoleFilter === role;

                                return (
                                  <td
                                    key={role}
                                    className={`py-2.5 px-2 text-center align-middle transition-opacity border-b border-slate-100 ${
                                      isFiltered ? 'opacity-100' : 'opacity-40'
                                    }`}
                                  >
                                    <div className="flex justify-center items-center">
                                      <button
                                        type="button"
                                        disabled={!canManageAccess || isSavingMatrix}
                                        onClick={() => handleToggleRolePermission(role, perm.id)}
                                        title={
                                          canManageAccess
                                            ? `${isMarked ? 'Click to unmark (revoke)' : 'Click to mark (grant)'} "${perm.label}" for role "${role}"`
                                            : `Baseline permission for ${role}`
                                        }
                                        aria-label={`${isMarked ? 'Revoke' : 'Grant'} ${perm.label} for ${role}`}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                          isMarked
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 shadow-2xs hover:scale-105 active:scale-90'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-300 hover:text-slate-600 border border-slate-200 active:scale-90'
                                        } ${!canManageAccess ? 'cursor-not-allowed opacity-75' : ''}`}
                                      >
                                        {isMarked ? (
                                          <Check className="w-4 h-4 stroke-[3]" />
                                        ) : (
                                          <Minus className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Staff Member Granular Permissions & Custom Access Overrides */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>Staff Member Permissions &amp; Custom Access Overrides</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                    {staff.filter(isStaffCustomized).length} Custom Overrides
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign or modify granular permissions for individual employees without altering global role definitions
                </p>
              </div>
            </div>

            {/* Filter Toolbar for Staff Permissions Table */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
              <div className="relative w-full lg:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff name, ID, department..."
                  value={staffPermSearch}
                  onChange={e => setStaffPermSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
                {/* Role filter */}
                <select
                  value={staffRoleFilterInPerms}
                  onChange={e => setStaffRoleFilterInPerms(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[38px] font-medium"
                >
                  <option value="All">All Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Employee">Employee</option>
                </select>

                {/* Override filter */}
                <select
                  value={staffOverrideFilter}
                  onChange={e => setStaffOverrideFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[38px] font-medium"
                >
                  <option value="All">All Profiles ({staff.length})</option>
                  <option value="Custom">Custom Only ({staff.filter(isStaffCustomized).length})</option>
                  <option value="Default">Defaults Only ({staff.length - staff.filter(isStaffCustomized).length})</option>
                </select>
              </div>
            </div>

            {/* Mobile Staff Permissions Cards (for phones & tablets < md) */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {filteredStaffForPermissions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs px-4">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No staff members found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or override filter.</p>
                </div>
              ) : (
                filteredStaffForPermissions.map(member => {
                  const customized = isStaffCustomized(member);
                  const currentPerms = getStaffPermissions(member);
                  const isExpanded = expandedStaffPermId === member.id;
                  const roleMeta = ROLE_META[member.role] || ROLE_META['Employee'];

                  return (
                    <div key={`mobile-perm-${member.id}`} className="space-y-0">
                      <div className={`p-4 space-y-3 transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/60'}`}>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">{member.name}</p>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono truncate">
                                <span>{member.staffId || member.userId}</span>
                                <span>•</span>
                                <span className="font-sans truncate">{member.department}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.borderColor}`}>
                            {member.role}
                          </span>
                        </div>

                        {/* Status & Privileges Count */}
                        <div className="flex items-center justify-between text-xs">
                          {customized ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sliders className="w-3 h-3" />
                              <span>Customized</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Shield className="w-3 h-3 text-slate-400" />
                              <span>Role Default</span>
                            </span>
                          )}

                          <span className="font-bold font-mono text-slate-900 text-xs">
                            {currentPerms.length} / {ALL_PERMISSIONS.length} active
                          </span>
                        </div>

                        {/* Controls Toolbar on Mobile */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                          {canManageAccess ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenInlinePerms(member)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Close' : 'Configure'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStaff(member);
                                  setIsStaffModalOpen(true);
                                }}
                                title="Edit in full Staff Modal"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {customized && (
                                <button
                                  type="button"
                                  onClick={() => handleResetStaffPermissions(member)}
                                  title="Reset permissions to role defaults"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleGrantAllStaffPermissions(member)}
                                title="Grant all function permissions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStaffProfile(member)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5 inline mr-1" />
                              <span>Profile</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline drawer if expanded on mobile */}
                      {isExpanded && canManageAccess && (
                        <div className="bg-slate-50/80 p-4 border-t border-b border-indigo-100 space-y-4 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                <span>Granular Privileges for {member.name}</span>
                                <span className="font-mono text-indigo-600 font-bold">
                                  ({inlineStaffPerms.length} / {ALL_PERMISSIONS.length})
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Toggle operational privileges for this specific staff account
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInlineStaffPerms(DEFAULT_ROLE_PERMISSIONS[member.role] || [])}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              >
                                Role Defaults
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineStaffPerms(ALL_PERMISSIONS.map(p => p.id))}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineStaffPerms([])}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {PERMISSION_GROUPS.map(group => {
                              const permsInGroup = ALL_PERMISSIONS.filter(p => p.category === group.category);

                              return (
                                <div key={`mob-${group.category}`} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 tracking-wider border-b border-slate-100 pb-2">
                                    <span>{group.icon}</span>
                                    <span>{group.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({permsInGroup.filter(p => inlineStaffPerms.includes(p.id)).length} / {permsInGroup.length})
                                    </span>
                                  </div>

                                  <div className="space-y-1.5">
                                    {permsInGroup.map(perm => {
                                      const isChecked = inlineStaffPerms.includes(perm.id);

                                      return (
                                        <button
                                          key={`mob-${perm.id}`}
                                          type="button"
                                          onClick={() => handleToggleInlinePerm(perm.id)}
                                          className={`w-full flex items-start space-x-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                            isChecked
                                              ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/20'
                                              : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="mt-0.5 flex-shrink-0">
                                            {isChecked ? (
                                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                              <Square className="w-4 h-4 text-slate-300" />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-1.5 flex-wrap">
                                              <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                                                {perm.label}
                                              </p>
                                              <span className="font-mono text-[9px] text-slate-400">
                                                {perm.id}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                              {perm.description}
                                            </p>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                            <div className="text-[11px] text-slate-500 font-medium">
                              {inlineStaffPerms.length !== (member.permissions || []).length && (
                                <span className="text-amber-600 font-semibold">
                                  Unsaved changes detected. Click Save to apply.
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setExpandedStaffPermId(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveInlinePerms(member)}
                                disabled={isSavingInlinePerms}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                {isSavingInlinePerms ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save Permissions</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Staff Permissions Table (hidden on mobile, shown on md+) */}
            <div className="hidden md:block overflow-auto max-h-[640px] rounded-xl border border-slate-200 shadow-2xs relative">
              <table className="w-full text-left text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] select-none">
                    <th className="py-3.5 px-5 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Staff Identity</th>
                    <th className="py-3.5 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Role Baseline</th>
                    <th className="py-3.5 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Permission Status</th>
                    <th className="py-3.5 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Active Functions</th>
                    <th className="py-3.5 px-5 text-right sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Management Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaffForPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No staff members found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or override filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaffForPermissions.map(member => {
                      const customized = isStaffCustomized(member);
                      const currentPerms = getStaffPermissions(member);
                      const isExpanded = expandedStaffPermId === member.id;
                      const roleMeta = ROLE_META[member.role] || ROLE_META['Employee'];

                      return (
                        <React.Fragment key={member.id}>
                          <tr className={`transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 leading-tight">{member.name}</p>
                                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                                    <span>{member.staffId || member.userId}</span>
                                    <span>•</span>
                                    <span className="font-sans">{member.department}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.borderColor}`}>
                                {member.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {customized ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Sliders className="w-3 h-3" />
                                  <span>Customized</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Shield className="w-3 h-3 text-slate-400" />
                                  <span>Role Default</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold font-mono text-slate-900 text-xs">
                                    {currentPerms.length} / {ALL_PERMISSIONS.length}
                                  </span>
                                  <span className="text-[11px] text-slate-400">privileges granted</span>
                                </div>
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {currentPerms.slice(0, 3).map(p => (
                                    <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                      {p}
                                    </span>
                                  ))}
                                  {currentPerms.length > 3 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                      +{currentPerms.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {canManageAccess ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInlinePerms(member)}
                                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        isExpanded
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                      }`}
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>{isExpanded ? 'Close' : 'Quick Manage'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStaff(member);
                                        setIsStaffModalOpen(true);
                                      }}
                                      title="Edit in full Staff Modal"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>

                                    {customized && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetStaffPermissions(member)}
                                        title="Reset permissions to role defaults"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleGrantAllStaffPermissions(member)}
                                      title="Grant all 23 function permissions"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openStaffProfile(member)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    <User className="w-3.5 h-3.5 inline mr-1" />
                                    <span>Profile</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Inline Granular Permission Drawer */}
                          {isExpanded && canManageAccess && (
                            <tr>
                              <td colSpan={5} className="p-0 bg-slate-50/80 border-b border-indigo-100">
                                <div className="p-5 space-y-5 animate-fade-in">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                        <span>Granular Permissions for {member.name}</span>
                                        <span className="font-mono text-indigo-600 font-bold">
                                          ({inlineStaffPerms.length} / {ALL_PERMISSIONS.length})
                                        </span>
                                      </h4>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        Toggle individual operational privileges for this specific employee account
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => setInlineStaffPerms(DEFAULT_ROLE_PERMISSIONS[member.role] || [])}
                                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                      >
                                        Role Defaults
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInlineStaffPerms(ALL_PERMISSIONS.map(p => p.id))}
                                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInlineStaffPerms([])}
                                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                      >
                                        Clear All
                                      </button>
                                    </div>
                                  </div>

                                  {/* 4 Category Groups Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {PERMISSION_GROUPS.map(group => {
                                      const permsInGroup = ALL_PERMISSIONS.filter(p => p.category === group.category);

                                      return (
                                        <div key={group.category} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 tracking-wider border-b border-slate-100 pb-2">
                                            <span>{group.icon}</span>
                                            <span>{group.title}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                              ({permsInGroup.filter(p => inlineStaffPerms.includes(p.id)).length} / {permsInGroup.length})
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {permsInGroup.map(perm => {
                                              const isChecked = inlineStaffPerms.includes(perm.id);

                                              return (
                                                <button
                                                  key={perm.id}
                                                  type="button"
                                                  onClick={() => handleToggleInlinePerm(perm.id)}
                                                  className={`w-full flex items-start space-x-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                                    isChecked
                                                      ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/20'
                                                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                                                  }`}
                                                >
                                                  <div className="mt-0.5 flex-shrink-0">
                                                    {isChecked ? (
                                                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                    ) : (
                                                      <Square className="w-4 h-4 text-slate-300" />
                                                    )}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                      <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                                                        {perm.label}
                                                      </p>
                                                      <span className="font-mono text-[9px] text-slate-400">
                                                        {perm.id}
                                                      </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                                      {perm.description}
                                                    </p>
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Drawer Footer Actions */}
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                    <div className="text-[11px] text-slate-500 font-medium">
                                      {inlineStaffPerms.length !== (member.permissions || []).length && (
                                        <span className="text-amber-600 font-semibold">
                                          Unsaved changes detected. Click Save to apply.
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedStaffPermId(null)}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveInlinePerms(member)}
                                        disabled={isSavingInlinePerms}
                                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                                      >
                                        {isSavingInlinePerms ? (
                                          <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            <span>Saving...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Save Permissions</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setStaffToDelete(null);
            }
          }}
        >
          <div
            ref={deleteStaffModalRef}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-up"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Staff Account</h3>
                <p className="text-xs text-slate-500">Administrator Security Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to remove staff member <strong className="text-slate-900">{staffToDelete.name}</strong> ({staffToDelete.userId})? 
              Their system credentials and access rights will be permanently deleted.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{staffToDelete.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800">{staffToDelete.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800">{staffToDelete.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Password Change & 24-Hr Pass Modal */}
      <StaffPasswordModal
        staff={passwordStaffTarget}
        isOpen={!!passwordStaffTarget}
        onClose={() => setPasswordStaffTarget(null)}
        onSuccess={(updated) => {
          updateStaff(updated.id, updated);
          setFeedbackNotice(`Credentials updated for ${updated.name}.`);
          setTimeout(() => setFeedbackNotice(null), 4000);
        }}
      />
    </div>
  );
};
