import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Lock,
  CheckCircle2,
  X,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  StaffMember,
  UserRole,
  PermissionKey,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS
} from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { StaffPasswordModal } from '../../components/modals/StaffPasswordModal';
import { StaffManagementSkeleton } from '../../components/common/Skeleton';

import { StaffStatsCards } from './components/StaffStatsCards';
import { StaffToolbar } from './components/StaffToolbar';
import { StaffTable, SortField } from './components/StaffTable';
import { StaffActionMenu, StaffActionMenuState } from './components/StaffActionMenu';
import { DeleteStaffModal } from './components/DeleteStaffModal';
import { StaffPermissionsMatrixTab } from './components/StaffPermissionsMatrixTab';
import { SYSTEM_ROLES } from './utils/staffRoleHelper';

type SortOrder = 'asc' | 'desc';

export const StaffManagementView: React.FC = () => {
  const {
    staff,
    items,
    setIsStaffModalOpen,
    setEditingStaff,
    updateStaff,
    deleteStaff,
    openStaffProfile,
    settings,
    updateSettings,
    isLoading
  } = useApp();

  const { user, hasPermission, previewRole, setPreviewRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeActionMenu, setActiveActionMenu] = useState<StaffActionMenuState | null>(null);

  const handleOpenActionMenu = (e: React.MouseEvent<HTMLButtonElement>, member: StaffMember) => {
    e.stopPropagation();
    if (activeActionMenu?.member.id === member.id) {
      setActiveActionMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const menuEstimatedHeight = 240;
    const spaceBelow = windowHeight - rect.bottom;

    let top: number | undefined = undefined;
    let bottom: number | undefined = undefined;

    if (spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight) {
      bottom = windowHeight - rect.top + 6;
    } else {
      top = rect.bottom + 6;
    }

    const right = Math.max(12, windowWidth - rect.right);

    setActiveActionMenu({
      member,
      top,
      bottom,
      right
    });
  };

  const handleCloseActionMenu = useCallback(() => {
    setActiveActionMenu(null);
  }, []);

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

  const canManageStaff = isSuperAdmin || isAdmin || hasPermission('staff_management') || hasPermission('manage_staff_access');
  const canEditStaff = isSuperAdmin || isAdmin || hasPermission('edit_staff') || hasPermission('manage_staff_access');
  const canDeleteStaff = isSuperAdmin || isAdmin || hasPermission('delete_staff');
  const canManageAccess = isSuperAdmin || isAdmin || hasPermission('manage_staff_access');
  const canViewOtherProfiles = isSuperAdmin || isAdmin || isManager || hasPermission('view_staff_profile');
  const canViewPermissionsTab = isSuperAdmin || isAdmin || isManager || hasPermission('manage_staff_access') || hasPermission('staff_management');

  const isCurrentStaffUser = useCallback((member?: StaffMember | null) => {
    if (!member || !user) return false;
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || '').toLowerCase().trim();
    const memberEmail = (member.email || '').toLowerCase().trim();
    const memberUserId = (member.userId || member.staffId || member.id || '').toLowerCase().trim();
    const memberName = (member.name || '').toLowerCase().trim();

    return Boolean(
      (memberEmail && userEmail && memberEmail === userEmail) ||
      (memberUserId && userEmail && memberUserId === userEmail) ||
      (memberName && userName && memberName === userName)
    );
  }, [user]);

  const [activeTab, setActiveTab] = useState<'directory' | 'permissions'>('directory');
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

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

    const baseMap: Record<UserRole, PermissionKey[]> = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...(settings?.rolePermissions || {})
    };
    const updatedRolePermissions: Record<UserRole, PermissionKey[]> = {
      ...baseMap,
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

  const handleGrantAllForRole = async (role: UserRole) => {
    if (!canManageAccess) return;
    const baseMap: Record<UserRole, PermissionKey[]> = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...(settings?.rolePermissions || {})
    };
    const updatedRolePermissions: Record<UserRole, PermissionKey[]> = {
      ...baseMap,
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

  const handleRevokeAllForRole = async (role: UserRole) => {
    if (!canManageAccess) return;
    const baseMap: Record<UserRole, PermissionKey[]> = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...(settings?.rolePermissions || {})
    };
    const updatedRolePermissions: Record<UserRole, PermissionKey[]> = {
      ...baseMap,
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

  const handleResetRoleToDefault = async (role: UserRole) => {
    if (!canManageAccess) return;
    const baseMap: Record<UserRole, PermissionKey[]> = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...(settings?.rolePermissions || {})
    };
    baseMap[role] = DEFAULT_ROLE_PERMISSIONS[role] || [];
    setIsSavingMatrix(true);
    try {
      await updateSettings({ rolePermissions: baseMap });
      toast.success(`Reset role "${role}" to standard baseline defaults.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset role');
    } finally {
      setIsSavingMatrix(false);
    }
  };

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

  const [expandedStaffPermId, setExpandedStaffPermId] = useState<string | null>(null);
  const [inlineStaffPerms, setInlineStaffPerms] = useState<PermissionKey[]>([]);
  const [isSavingInlinePerms, setIsSavingInlinePerms] = useState(false);

  const isStaffCustomized = useCallback((member: StaffMember) => {
    if (!member.permissions) return false;
    const defaultPerms = getRoleBaselinePermissions(member.role);
    if (member.permissions.length !== defaultPerms.length) return true;
    const defaultSet = new Set(defaultPerms);
    return member.permissions.some(p => !defaultSet.has(p));
  }, [getRoleBaselinePermissions]);

  const getStaffPermissions = useCallback((member: StaffMember): PermissionKey[] => {
    return member.permissions || getRoleBaselinePermissions(member.role);
  }, [getRoleBaselinePermissions]);

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
      const defaultPerms = getRoleBaselinePermissions(member.role);
      const isCustom = inlineStaffPerms.length !== defaultPerms.length || inlineStaffPerms.some(p => !defaultPerms.includes(p));
      await updateStaff(member.id, {
        permissions: inlineStaffPerms,
        isCustomPermissions: isCustom
      });
      window.dispatchEvent(new CustomEvent('warwick_permissions_updated'));
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
      await updateStaff(member.id, {
        permissions: defaultPerms,
        isCustomPermissions: false
      });
      if (expandedStaffPermId === member.id) {
        setInlineStaffPerms(defaultPerms);
      }
      window.dispatchEvent(new CustomEvent('warwick_permissions_updated'));
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
      await updateStaff(member.id, {
        permissions: allPerms,
        isCustomPermissions: true
      });
      if (expandedStaffPermId === member.id) {
        setInlineStaffPerms(allPerms);
      }
      window.dispatchEvent(new CustomEvent('warwick_permissions_updated'));
      setFeedbackNotice(`Granted all permissions to ${member.name}.`);
      toast.success(`Granted all permissions to ${member.name}.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      toast.error('Failed to grant all permissions');
    }
  };

  const handleRevokeAllStaffPermissions = async (member: StaffMember) => {
    if (!canManageAccess) return;
    try {
      await updateStaff(member.id, {
        permissions: [],
        isCustomPermissions: true
      });
      if (expandedStaffPermId === member.id) {
        setInlineStaffPerms([]);
      }
      window.dispatchEvent(new CustomEvent('warwick_permissions_updated'));
      setFeedbackNotice(`Revoked all permissions from ${member.name}.`);
      toast.info(`Revoked all permissions from ${member.name}.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      toast.error('Failed to revoke permissions');
    }
  };

  useEffect(() => {
    if (!activeActionMenu) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest(`[data-staff-menu-popover]`) ||
        target.closest(`[data-staff-menu-btn]`)
      ) {
        return;
      }
      setActiveActionMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveActionMenu(null);
      }
    };

    const handleScrollOrResize = () => {
      setActiveActionMenu(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeActionMenu]);

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

  const departmentsList = useMemo(() => {
    const deps = new Set<string>();
    staff.forEach(s => {
      if (s.department) deps.add(s.department);
    });
    return Array.from(deps);
  }, [staff]);

  const processedStaff = useMemo(() => {
    let result = staffWithStats.filter(s => {
      if (searchQuery) {
        const q = (searchQuery || '').toLowerCase().trim();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchId = (s.userId || '').toLowerCase().includes(q) || (s.staffId || '').toLowerCase().includes(q);
        const matchEmail = (s.email || '').toLowerCase().includes(q);
        const matchDep = (s.department || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail && !matchDep && !matchRole) return false;
      }
      if (departmentFilter !== 'All' && s.department !== departmentFilter) return false;
      if (roleFilter !== 'All' && s.role !== roleFilter) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      return true;
    });

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

  if (isLoading) {
    return <StaffManagementSkeleton />;
  }

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
      <StaffStatsCards staff={staff} />

      {/* View Switcher Tabs: Staff Directory vs Function Permissions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <button
            id="tab-btn-directory"
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
              activeTab === 'directory'
                ? 'btn-primary-gradient text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === 'directory' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Staff Directory</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {staff.length}
            </span>
          </button>

          {canViewPermissionsTab && (
            <button
              id="tab-btn-permissions"
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                activeTab === 'permissions'
                  ? 'btn-primary-gradient text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'permissions' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>Role &amp; Function Matrix</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'permissions' ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs w-full sm:w-auto cursor-pointer"
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
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs w-full sm:w-auto cursor-pointer"
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

          {/* Control Bar: Search + Filters */}
          <StaffToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            departmentsList={departmentsList}
            onFilterChangeResetPage={() => setCurrentPage(1)}
          />

          {/* Directory Table and Mobile Cards */}
          <StaffTable
            paginatedStaff={paginatedStaff}
            processedStaffCount={processedStaff.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalPages={totalPages}
            onSort={handleSort}
            canViewOtherProfiles={canViewOtherProfiles}
            canEditStaff={canEditStaff}
            canDeleteStaff={canDeleteStaff}
            canManageAccess={canManageAccess}
            isSuperAdmin={isSuperAdmin}
            isCurrentStaffUser={isCurrentStaffUser}
            onOpenProfile={openStaffProfile}
            onOpenActionMenu={handleOpenActionMenu}
            activeActionMenuId={activeActionMenu?.member.id}
            onOpenPasswordModal={setPasswordStaffTarget}
            onRequestDelete={setStaffToDelete}
          />
        </div>
      )}

      {/* Tab 2: Function Permissions & Role Access Matrix */}
      {activeTab === 'permissions' && (
        <StaffPermissionsMatrixTab
          staff={staff}
          canManageAccess={canManageAccess}
          isSuperAdmin={isSuperAdmin}
          previewRole={previewRole}
          setPreviewRole={setPreviewRole}
          getRoleBaselinePermissions={getRoleBaselinePermissions}
          isRoleCustomized={isRoleCustomized}
          handleToggleRolePermission={handleToggleRolePermission}
          handleGrantAllForRole={handleGrantAllForRole}
          handleRevokeAllForRole={handleRevokeAllForRole}
          handleResetRoleToDefault={handleResetRoleToDefault}
          handleResetAllRolesToDefault={handleResetAllRolesToDefault}
          isSavingMatrix={isSavingMatrix}
          hasAnyRoleCustomized={hasAnyRoleCustomized}
          isStaffCustomized={isStaffCustomized}
          getStaffPermissions={getStaffPermissions}
          handleResetStaffPermissions={handleResetStaffPermissions}
          handleGrantAllStaffPermissions={handleGrantAllStaffPermissions}
          handleRevokeAllStaffPermissions={handleRevokeAllStaffPermissions}
          handleSaveInlinePerms={handleSaveInlinePerms}
          isSavingInlinePerms={isSavingInlinePerms}
          inlineStaffPerms={inlineStaffPerms}
          setInlineStaffPerms={setInlineStaffPerms}
          expandedStaffPermId={expandedStaffPermId}
          setExpandedStaffPermId={setExpandedStaffPermId}
          handleOpenInlinePerms={handleOpenInlinePerms}
          handleToggleInlinePerm={handleToggleInlinePerm}
          setEditingStaff={setEditingStaff}
          setIsStaffModalOpen={setIsStaffModalOpen}
          openStaffProfile={openStaffProfile}
        />
      )}

      {/* Delete Staff Confirmation Modal */}
      <DeleteStaffModal
        staffToDelete={staffToDelete}
        isDeleting={isDeleting}
        modalRef={deleteStaffModalRef}
        onClose={() => setStaffToDelete(null)}
        onConfirmDelete={handleDeleteStaff}
      />

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

      {/* Fixed Floating Staff Action Menu */}
      {activeActionMenu && (
        <StaffActionMenu
          activeActionMenu={activeActionMenu}
          onClose={handleCloseActionMenu}
          canViewOtherProfiles={canViewOtherProfiles}
          canEditStaff={canEditStaff}
          canManageAccess={canManageAccess}
          canDeleteStaff={canDeleteStaff}
          isSuperAdmin={isSuperAdmin}
          isCurrentStaffUser={isCurrentStaffUser}
          onOpenProfile={openStaffProfile}
          onEditStaff={(member) => {
            setEditingStaff(member);
            setIsStaffModalOpen(true);
          }}
          onPasswordStaff={setPasswordStaffTarget}
          onRequestDelete={setStaffToDelete}
        />
      )}
    </div>
  );
};
