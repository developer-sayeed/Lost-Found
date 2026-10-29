import React, { useState, useMemo } from 'react';
import {
  Lock,
  ShieldCheck,
  Sliders,
  Users,
  Sparkles,
  Shield,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  Search,
  Check,
  Minus,
  CheckSquare,
  Square,
  Edit2,
  User
} from 'lucide-react';
import {
  StaffMember,
  UserRole,
  PermissionKey,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionCategory
} from '../../../types';
import { PERMISSION_GROUPS, SYSTEM_ROLES, ROLE_META } from '../utils/staffRoleHelper';

interface StaffPermissionsMatrixTabProps {
  staff: StaffMember[];
  canManageAccess: boolean;
  isSuperAdmin: boolean;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  getRoleBaselinePermissions: (role: UserRole) => PermissionKey[];
  isRoleCustomized: (role: UserRole) => boolean;
  handleToggleRolePermission: (role: UserRole, permId: PermissionKey) => void;
  handleGrantAllForRole: (role: UserRole) => void;
  handleRevokeAllForRole: (role: UserRole) => void;
  handleResetRoleToDefault: (role: UserRole) => void;
  handleResetAllRolesToDefault: () => void;
  isSavingMatrix: boolean;
  hasAnyRoleCustomized: boolean;
  isStaffCustomized: (member: StaffMember) => boolean;
  getStaffPermissions: (member: StaffMember) => PermissionKey[];
  handleResetStaffPermissions: (member: StaffMember) => void;
  handleGrantAllStaffPermissions: (member: StaffMember) => void;
  handleRevokeAllStaffPermissions: (member: StaffMember) => void;
  handleSaveInlinePerms: (member: StaffMember) => Promise<void>;
  isSavingInlinePerms: boolean;
  inlineStaffPerms: PermissionKey[];
  setInlineStaffPerms: React.Dispatch<React.SetStateAction<PermissionKey[]>>;
  expandedStaffPermId: string | null;
  setExpandedStaffPermId: (id: string | null) => void;
  handleOpenInlinePerms: (member: StaffMember) => void;
  handleToggleInlinePerm: (permId: PermissionKey) => void;
  setEditingStaff: (member: StaffMember) => void;
  setIsStaffModalOpen: (open: boolean) => void;
  openStaffProfile: (member: StaffMember) => void;
}

export const StaffPermissionsMatrixTab: React.FC<StaffPermissionsMatrixTabProps> = ({
  staff,
  canManageAccess,
  previewRole,
  setPreviewRole,
  getRoleBaselinePermissions,
  isRoleCustomized,
  handleToggleRolePermission,
  handleGrantAllForRole,
  handleRevokeAllForRole,
  handleResetRoleToDefault,
  handleResetAllRolesToDefault,
  isSavingMatrix,
  hasAnyRoleCustomized,
  isStaffCustomized,
  getStaffPermissions,
  handleResetStaffPermissions,
  handleGrantAllStaffPermissions,
  handleRevokeAllStaffPermissions,
  handleSaveInlinePerms,
  isSavingInlinePerms,
  inlineStaffPerms,
  setInlineStaffPerms,
  expandedStaffPermId,
  setExpandedStaffPermId,
  handleOpenInlinePerms,
  handleToggleInlinePerm,
  setEditingStaff,
  setIsStaffModalOpen,
  openStaffProfile
}) => {
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(true);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<'All' | PermissionCategory>('All');
  const [matrixRoleFilter] = useState<'All' | UserRole>('All');
  const [matrixLayout, setMatrixLayout] = useState<'cards' | 'table'>('table');
  const [activeMobileRole, setActiveMobileRole] = useState<UserRole>('Employee');

  const [staffPermSearch, setStaffPermSearch] = useState('');
  const [staffRoleFilterInPerms, setStaffRoleFilterInPerms] = useState<string>('All');
  const [staffOverrideFilter, setStaffOverrideFilter] = useState<'All' | 'Custom' | 'Default'>('All');

  // Filter permissions for matrix
  const filteredPermissionsForMatrix = useMemo(() => {
    return ALL_PERMISSIONS.filter(p => {
      const matchSearch =
        matrixSearch.trim() === '' ||
        p.label.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(matrixSearch.toLowerCase());

      const matchCat =
        matrixCategoryFilter === 'All' || p.category === matrixCategoryFilter;

      return matchSearch && matchCat;
    });
  }, [matrixSearch, matrixCategoryFilter]);

  // Filter staff list for permissions table
  const filteredStaffForPermissions = useMemo(() => {
    return staff.filter(member => {
      const q = staffPermSearch.toLowerCase();
      const matchSearch =
        staffPermSearch.trim() === '' ||
        member.name.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.userId.toLowerCase().includes(q) ||
        (member.staffId && member.staffId.toLowerCase().includes(q));

      const matchRole =
        staffRoleFilterInPerms === 'All' || member.role === staffRoleFilterInPerms;

      const customized = isStaffCustomized(member);
      const matchOverride =
        staffOverrideFilter === 'All' ||
        (staffOverrideFilter === 'Custom' && customized) ||
        (staffOverrideFilter === 'Default' && !customized);

      return matchSearch && matchRole && matchOverride;
    });
  }, [staff, staffPermSearch, staffRoleFilterInPerms, staffOverrideFilter, isStaffCustomized]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Permission Management Header & Role-Based Security Notice */}
      {!canManageAccess ? (
        <div 
          className="rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-lg border border-amber-500/30 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3b1d11 0%, #25120a 55%, #190b06 100%)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
            <Lock className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Role-Based Read-Only Access
            </h4>
            <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
              You are viewing the hotel system function permissions and organizational role matrices in audit inspection mode. 
              Super Admin credentials or the <strong>"Manage Security &amp; Permissions"</strong> privilege is required to edit permissions or assign custom role overrides.
            </p>
          </div>
        </div>
      ) : (
        <div 
          className="rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-lg border border-fuchsia-400/30 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3d1246 0%, #260a2d 55%, #18071c 100%)' }}
        >
          <div 
            aria-hidden="true" 
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" 
          />
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-fuchsia-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Administrative Security &amp; Privilege Configuration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold btn-primary-gradient text-white border border-white/25 shadow-xs">Full Access</span>
            </h4>
            <p className="text-xs text-fuchsia-100/90 mt-1 leading-relaxed font-medium">
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
            {/* Live Role Simulation Bar */}
            {canManageAccess && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/30">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>Live Role Simulator &amp; Real-Time Tester</span>
                        {previewRole ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                            Simulating: {previewRole}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                            Normal Admin Mode
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click any role to test the entire portal (sidebar, buttons &amp; modules) as that role in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewRole(null)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        previewRole === null
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      Actual User
                    </button>
                    {SYSTEM_ROLES.map(r => (
                      <button
                        key={`sim-${r}`}
                        type="button"
                        onClick={() => setPreviewRole(previewRole === r ? null : r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          previewRole === r
                            ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Guidance / Tip Banner */}
            <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Interactive Permission Matrix:</strong> Administrators can mark or unmark any function for any role. Changes apply across the entire portal in real time.
                </span>
              </div>
              {isSavingMatrix && (
                <span className="text-[11px] font-bold text-indigo-600 animate-pulse flex items-center space-x-1 shrink-0 ml-2">
                  <span>Syncing...</span>
                </span>
              )}
            </div>

            {/* Matrix Filter, Search Bar & Layout Switcher */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search functions, keys, or descriptions..."
                  value={matrixSearch}
                  onChange={e => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-slate-800 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                {/* Category Filter Pills */}
                <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
                  {(['All', 'Items', 'Operations', 'Certificates', 'Media', 'Administration', 'Settings'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMatrixCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        matrixCategoryFilter === cat
                          ? 'btn-primary-gradient text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'All' ? 'All Modules' : cat}
                    </button>
                  ))}
                </div>

                {/* Layout Switcher (Mobile Role Cards vs Table View) */}
                <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMatrixLayout('cards')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                      matrixLayout === 'cards'
                        ? 'btn-primary-gradient text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                    title="Touch-friendly role cards view (ideal for mobile)"
                  >
                    <span>📱 Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixLayout('table')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                      matrixLayout === 'table'
                        ? 'btn-primary-gradient text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                    title="Full multi-column matrix table"
                  >
                    <span>📊 Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode 1: Mobile-Optimized Role Cards View */}
            {matrixLayout === 'cards' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {SYSTEM_ROLES.map(role => {
                    const rolePerms = getRoleBaselinePermissions(role);
                    const isSelected = activeMobileRole === role;
                    const isCustom = isRoleCustomized(role);

                    return (
                      <button
                        key={`tab-${role}`}
                        type="button"
                        onClick={() => setActiveMobileRole(role)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 shrink-0 border ${
                          isSelected
                            ? 'btn-primary-gradient text-white border-transparent shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span>{role}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {rolePerms.length}
                        </span>
                        {isCustom && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Custom Baseline Active" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const meta = ROLE_META[activeMobileRole];
                  const rolePerms = getRoleBaselinePermissions(activeMobileRole);
                  const isCustom = isRoleCustomized(activeMobileRole);

                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${meta.badgeBg} ${meta.badgeText} border ${meta.borderColor}`}>
                            {activeMobileRole}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {rolePerms.length} of {ALL_PERMISSIONS.length} Permissions Active
                            </span>
                            {isCustom && (
                              <span className="ml-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 px-1.5 py-0.5 rounded">
                                Customized
                              </span>
                            )}
                          </div>
                        </div>

                        {canManageAccess && (
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <button
                              type="button"
                              onClick={() => handleGrantAllForRole(activeMobileRole)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Grant All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeAllForRole(activeMobileRole)}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Revoke All
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleResetRoleToDefault(activeMobileRole)}
                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                ↺ Defaults
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPreviewRole(previewRole === activeMobileRole ? null : activeMobileRole)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                previewRole === activeMobileRole
                                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-500'
                                  : 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {previewRole === activeMobileRole ? '✓ Simulating Now' : `🎭 Test ${activeMobileRole}`}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                  {filteredPermissionsForMatrix.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                      No permissions match your search or category filter.
                    </div>
                  ) : (
                    filteredPermissionsForMatrix.map(perm => {
                      const rolePerms = getRoleBaselinePermissions(activeMobileRole);
                      const isMarked = rolePerms.includes(perm.id);

                      return (
                        <div
                          key={`card-${activeMobileRole}-${perm.id}`}
                          onClick={() => {
                            if (canManageAccess) {
                              handleToggleRolePermission(activeMobileRole, perm.id);
                            }
                          }}
                          className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isMarked
                              ? 'bg-fuchsia-50/70 dark:bg-fuchsia-950/30 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/45 border-fuchsia-300/80 dark:border-fuchsia-500/30 shadow-2xs'
                              : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <span className="text-xl shrink-0 mt-0.5">
                              {perm.category === 'Items' && '📦'}
                              {perm.category === 'Operations' && '🔄'}
                              {perm.category === 'Certificates' && '📜'}
                              {perm.category === 'Media' && '🖼️'}
                              {perm.category === 'Administration' && '👥'}
                              {perm.category === 'Settings' && '⚙️'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {perm.label}
                                </h4>
                                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                  {perm.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                {perm.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            <button
                              type="button"
                              disabled={!canManageAccess}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRolePermission(activeMobileRole, perm.id);
                              }}
                              aria-label={`${isMarked ? 'Revoke' : 'Grant'} ${perm.label} for ${activeMobileRole}`}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isMarked
                                  ? 'btn-primary-gradient text-white shadow-sm ring-2 ring-fuchsia-400/40 scale-105 border-0'
                                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isMarked ? (
                                <Check className="w-5 h-5 stroke-[3] text-white" />
                              ) : (
                                <Minus className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* View Mode 2: Multi-Column Matrix Table */}
            {matrixLayout === 'table' && (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-indigo-700 bg-indigo-50/90 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium">
                  <span className="flex items-center space-x-1.5">
                    <span className="text-indigo-600 font-bold">📌 Matrix Table:</span>
                    <span>Role column headers are sticky at top, and functions are sticky on left. Swipe horizontally on mobile to view all roles.</span>
                  </span>
                  <span className="text-indigo-600 font-semibold text-[10px] hidden md:inline shrink-0">
                    8 Roles • {filteredPermissionsForMatrix.length} Functions
                  </span>
                </div>

                <div className="overflow-auto max-h-[620px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs relative bg-white dark:bg-[#180F1A]">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-50 dark:bg-[#180F1A] text-slate-600 dark:text-fuchsia-200 uppercase tracking-wider font-semibold text-[11px] select-none">
                        <th className="py-3 px-4 w-1/3 min-w-[220px] sm:min-w-[260px] sticky top-0 left-0 bg-slate-50 dark:bg-[#180F1A] z-30 shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.08)] border-b border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-fuchsia-200">
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
                              className={`py-3 px-2 text-center transition-opacity min-w-[100px] sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.06)] ${
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
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPermissionsForMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={1 + SYSTEM_ROLES.length} className="py-8 text-center text-slate-400">
                            No permissions match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPermissionsForMatrix.map((perm, idx) => {
                          return (
                            <tr key={perm.id} className={idx % 2 === 0 ? 'bg-white dark:bg-[#180F1A]' : 'bg-slate-50/40 dark:bg-slate-900/40'}>
                              <td className={`py-3 px-4 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-b border-r border-slate-200/80 dark:border-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-[#180F1A]' : 'bg-slate-50 dark:bg-[#180F1A]'}`}>
                                <div className="flex items-start space-x-2.5">
                                  <span className="text-base mt-0.5">
                                    {perm.category === 'Items' && '📦'}
                                    {perm.category === 'Operations' && '🔄'}
                                    {perm.category === 'Certificates' && '📜'}
                                    {perm.category === 'Media' && '🖼️'}
                                    {perm.category === 'Administration' && '👥'}
                                    {perm.category === 'Settings' && '⚙️'}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-bold text-slate-900 dark:text-white leading-tight">{perm.label}</p>
                                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                        {perm.id}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
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
                                    className={`py-2.5 px-2 text-center align-middle transition-opacity border-b border-slate-100 dark:border-slate-800/80 ${
                                      isFiltered ? 'opacity-100' : 'opacity-40'
                                    }`}
                                  >
                                    <div className="flex justify-center items-center">
                                      <button
                                        type="button"
                                        disabled={!canManageAccess}
                                        onClick={() => handleToggleRolePermission(role, perm.id)}
                                        title={
                                          canManageAccess
                                            ? `${isMarked ? 'Click to unmark (revoke)' : 'Click to mark (grant)'} "${perm.label}" for role "${role}"`
                                            : `Baseline permission for ${role}`
                                        }
                                        aria-label={`${isMarked ? 'Revoke' : 'Grant'} ${perm.label} for ${role}`}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                          isMarked
                                            ? 'btn-primary-gradient text-white shadow-2xs hover:scale-105 active:scale-90 border-0 ring-1 ring-fuchsia-400/40'
                                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-90'
                                        } ${!canManageAccess ? 'cursor-not-allowed opacity-75' : ''}`}
                                      >
                                        {isMarked ? (
                                          <Check className="w-4 h-4 stroke-[3] text-white" />
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
              </>
            )}
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

        {/* Mobile Staff Permissions Cards */}
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
                                          ? 'btn-primary-gradient text-white border-fuchsia-500/80 shadow-xs ring-1 ring-fuchsia-400/40'
                                          : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-fuchsia-400'
                                      }`}
                                    >
                                      <div className="mt-0.5 flex-shrink-0">
                                        {isChecked ? (
                                          <CheckSquare className="w-4 h-4 text-white" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-1.5 flex-wrap">
                                          <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {perm.label}
                                          </p>
                                          <span className={`font-mono text-[9px] px-1 py-0.2 rounded ${isChecked ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'}`}>
                                            {perm.id}
                                          </span>
                                        </div>
                                        <p className={`text-[10px] line-clamp-1 mt-0.5 ${isChecked ? 'text-fuchsia-100' : 'text-slate-400 dark:text-slate-400'}`}>
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

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInlinePerms(member)}
                            disabled={isSavingInlinePerms}
                            className="px-4 py-1.5 text-xs font-semibold text-white btn-primary-gradient disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
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

        {/* Desktop Staff Permissions Table */}
        <div className="hidden md:block overflow-auto max-h-[640px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs relative bg-white dark:bg-[#180F1A]">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="bg-slate-50 dark:bg-[#180F1A] text-slate-600 dark:text-fuchsia-200 uppercase tracking-wider font-semibold text-[11px] select-none">
                <th className="py-3.5 px-5 sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Staff Identity</th>
                <th className="py-3.5 px-4 sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Role Baseline</th>
                <th className="py-3.5 px-4 sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Permission Status</th>
                <th className="py-3.5 px-4 sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Active Functions</th>
                <th className="py-3.5 px-5 text-right sticky top-0 bg-slate-50 dark:bg-[#180F1A] z-20 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Management Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.borderColor}`}>
                            {member.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {customized ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Custom Override</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                              <span>Role Default</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className="h-full btn-primary-gradient rounded-full transition-all"
                                style={{
                                  width: `${Math.round((currentPerms.length / ALL_PERMISSIONS.length) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-700">
                              {currentPerms.length}/{ALL_PERMISSIONS.length}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {canManageAccess ? (
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenInlinePerms(member)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
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
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {customized && (
                                <button
                                  type="button"
                                  onClick={() => handleResetStaffPermissions(member)}
                                  title="Reset permissions to role defaults"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleGrantAllStaffPermissions(member)}
                                title="Grant all function permissions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRevokeAllStaffPermissions(member)}
                                title="Revoke all permissions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
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
                        </td>
                      </tr>

                      {/* Expanded Drawer on Desktop */}
                      {isExpanded && canManageAccess && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-indigo-100 bg-slate-50/70">
                            <div className="p-5 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                    <span>Granular Permissions for {member.name}</span>
                                    <span className="font-mono text-indigo-600 font-bold">
                                      ({inlineStaffPerms.length} / {ALL_PERMISSIONS.length} Granted)
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Configure individual privilege overrides without modifying standard role defaults.
                                  </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setInlineStaffPerms(DEFAULT_ROLE_PERMISSIONS[member.role] || [])}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  >
                                    Reset to Role Baseline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineStaffPerms(ALL_PERMISSIONS.map(p => p.id))}
                                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                                  >
                                    Grant All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineStaffPerms([])}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                  >
                                    Revoke All
                                  </button>
                                </div>
                              </div>

                              {/* Matrix Cards for all 6 groups */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {PERMISSION_GROUPS.map(group => {
                                  const permsInGroup = ALL_PERMISSIONS.filter(p => p.category === group.category);

                                  return (
                                    <div key={group.category} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                                        <div className="flex items-center space-x-1.5 truncate">
                                          <span>{group.icon}</span>
                                          <span className="truncate">{group.title}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                          {permsInGroup.filter(p => inlineStaffPerms.includes(p.id)).length}/{permsInGroup.length}
                                        </span>
                                      </div>

                                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                                        {permsInGroup.map(perm => {
                                          const isChecked = inlineStaffPerms.includes(perm.id);

                                          return (
                                            <button
                                              key={perm.id}
                                              type="button"
                                              onClick={() => handleToggleInlinePerm(perm.id)}
                                              className={`w-full flex items-start space-x-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                isChecked
                                                  ? 'btn-primary-gradient text-white border-fuchsia-500/80 shadow-xs ring-1 ring-fuchsia-400/40'
                                                  : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-fuchsia-400'
                                              }`}
                                            >
                                              <div className="mt-0.5 flex-shrink-0">
                                                {isChecked ? (
                                                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                                                ) : (
                                                  <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                                )}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center space-x-1 flex-wrap">
                                                  <p className={`text-[11px] font-bold leading-tight ${isChecked ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {perm.label}
                                                  </p>
                                                  <span className={`font-mono text-[9px] px-1 py-0.2 rounded ${isChecked ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'}`}>
                                                    {perm.id}
                                                  </span>
                                                </div>
                                                <p className={`text-[10px] line-clamp-1 mt-0.5 ${isChecked ? 'text-fuchsia-100' : 'text-slate-400 dark:text-slate-400'}`}>
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

                              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
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
                                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlinePerms(member)}
                                    disabled={isSavingInlinePerms}
                                    className="px-4 py-1.5 text-xs font-semibold text-white btn-primary-gradient disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
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
  );
};
