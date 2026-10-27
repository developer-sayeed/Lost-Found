import React from 'react';
import {
  ArrowUpDown,
  PackageCheck,
  Shield,
  CheckCircle2,
  KeyRound,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StaffMember, DEFAULT_ROLE_PERMISSIONS } from '../../../types';
import { UserAvatar as AvatarHelper } from '../../../lib/avatarHelper';

export type SortField = 'name' | 'department' | 'role' | 'itemsCount' | 'status';

interface StaffTableProps {
  paginatedStaff: (StaffMember & { computedItemsCount: number })[];
  processedStaffCount: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  totalPages: number;
  onSort: (field: SortField) => void;
  canViewOtherProfiles: boolean;
  canEditStaff: boolean;
  canDeleteStaff: boolean;
  canManageAccess: boolean;
  isSuperAdmin: boolean;
  isCurrentStaffUser: (member?: StaffMember | null) => boolean;
  onOpenProfile: (member: StaffMember) => void;
  onOpenActionMenu: (e: React.MouseEvent<HTMLButtonElement>, member: StaffMember) => void;
  activeActionMenuId?: string;
  onOpenPasswordModal: (member: StaffMember) => void;
  onRequestDelete: (member: StaffMember) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  paginatedStaff,
  processedStaffCount,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  onSort,
  canViewOtherProfiles,
  canEditStaff,
  canDeleteStaff,
  canManageAccess,
  isSuperAdmin,
  isCurrentStaffUser,
  onOpenProfile,
  onOpenActionMenu,
  activeActionMenuId,
  onOpenPasswordModal,
  onRequestDelete
}) => {
  return (
    <>
      {/* Mobile Staff Cards Feed (< md) */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {paginatedStaff.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs px-4">
            No staff records found matching your filters.
          </div>
        ) : (
          paginatedStaff.map(member => {
            const isCurrentUser = isCurrentStaffUser(member);
            const permissions = member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || [];
            const isMemberSuperAdmin = member.role === 'Super Admin';
            const submittedItemsCount = member.computedItemsCount;

            return (
              <div key={`mobile-card-${member.id}`} className="p-3.5 space-y-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (canViewOtherProfiles || isCurrentUser) {
                          onOpenProfile(member);
                        }
                      }}
                      className={`shrink-0 ${canViewOtherProfiles || isCurrentUser ? 'cursor-pointer' : ''}`}
                    >
                      <AvatarHelper
                        name={member.name}
                        avatarUrl={member.avatar}
                        sizeClassName="w-10 h-10"
                        className="hover:ring-2 hover:ring-indigo-400 transition-all"
                      />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => (canViewOtherProfiles || isCurrentUser) && onOpenProfile(member)}
                          className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors truncate text-left cursor-pointer"
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

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      member.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                    {isMemberSuperAdmin && <Shield className="w-3 h-3 mr-1 text-indigo-600" />}
                    {member.role}
                  </span>

                  <button
                    type="button"
                    onClick={() => (canViewOtherProfiles || isCurrentUser) && onOpenProfile(member)}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>{submittedItemsCount} item{submittedItemsCount !== 1 ? 's' : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={e => onOpenActionMenu(e, member)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Data Table (md+) */}
      <div className="hidden md:block overflow-x-auto relative">
        <table className="w-full text-left border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3.5 px-5 text-center w-12 sticky top-0 bg-slate-50 z-20 border-b border-slate-200">#</th>
              <th onClick={() => onSort('name')} className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                <div className="flex items-center space-x-1">
                  <span>Staff Member</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => onSort('department')} className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                <div className="flex items-center space-x-1">
                  <span>Department</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => onSort('role')} className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                <div className="flex items-center space-x-1">
                  <span>Role</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => onSort('itemsCount')} className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                <div className="flex items-center space-x-1">
                  <span>Items Logged (Real Data)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-5 sticky top-0 bg-slate-50 z-20 border-b border-slate-200">Granted Permissions</th>
              <th onClick={() => onSort('status')} className="py-3.5 px-5 cursor-pointer hover:text-indigo-600 transition-colors sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-5 text-right sticky top-0 bg-slate-50 z-20 border-b border-slate-200">Actions</th>
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
                const isCurrentUser = isCurrentStaffUser(member);
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
                        <button
                          type="button"
                          onClick={() => {
                            if (canViewOtherProfiles || isCurrentUser) {
                              onOpenProfile(member);
                            }
                          }}
                          className={`shrink-0 ${canViewOtherProfiles || isCurrentUser ? 'cursor-pointer' : ''}`}
                        >
                          <AvatarHelper
                            name={member.name}
                            avatarUrl={member.avatar}
                            sizeClassName="w-9 h-9"
                            className="hover:ring-2 hover:ring-indigo-400 transition-all"
                          />
                        </button>
                        <div>
                          {canViewOtherProfiles || isCurrentUser ? (
                            <button
                              type="button"
                              onClick={() => onOpenProfile(member)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left block cursor-pointer"
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
                          type="button"
                          onClick={() => onOpenProfile(member)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
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
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                          member.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right relative" data-staff-menu-container>
                      <div className="flex items-center justify-end space-x-1">
                        {(canEditStaff || canManageAccess || isSuperAdmin) && (
                          <button
                            id={`btn-staff-pass-quick-${member.id}`}
                            onClick={() => onOpenPasswordModal(member)}
                            title="Change password or generate 24-hr pass"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}

                        {canDeleteStaff && !isCurrentUser && (
                          <button
                            id={`btn-staff-delete-quick-${member.id}`}
                            onClick={() => onRequestDelete(member)}
                            title="Remove staff member"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          id={`btn-staff-menu-${member.id}`}
                          data-staff-menu-btn={member.id}
                          onClick={e => onOpenActionMenu(e, member)}
                          aria-label={`Actions for ${member.name}`}
                          title="More Staff Actions"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeActionMenuId === member.id
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Counter Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span>
            Showing <strong className="text-slate-800 font-mono">{processedStaffCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, processedStaffCount)}</strong> of{' '}
            <strong className="text-slate-800 font-mono">{processedStaffCount}</strong> staff entries
          </span>
          <span>•</span>
          <select
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium cursor-pointer"
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
    </>
  );
};
