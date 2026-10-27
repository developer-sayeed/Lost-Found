import React from 'react';
import { User, Sliders, KeyRound, Trash2 } from 'lucide-react';
import { StaffMember } from '../../../types';
import { ROLE_META } from '../utils/staffRoleHelper';

export interface StaffActionMenuState {
  member: StaffMember;
  top?: number;
  bottom?: number;
  right: number;
}

interface StaffActionMenuProps {
  activeActionMenu: StaffActionMenuState;
  onClose: () => void;
  canViewOtherProfiles: boolean;
  canEditStaff: boolean;
  canManageAccess: boolean;
  canDeleteStaff: boolean;
  isSuperAdmin: boolean;
  isCurrentStaffUser: (member?: StaffMember | null) => boolean;
  onOpenProfile: (member: StaffMember) => void;
  onEditStaff: (member: StaffMember) => void;
  onPasswordStaff: (member: StaffMember) => void;
  onRequestDelete: (member: StaffMember) => void;
}

export const StaffActionMenu: React.FC<StaffActionMenuProps> = ({
  activeActionMenu,
  onClose,
  canViewOtherProfiles,
  canEditStaff,
  canManageAccess,
  canDeleteStaff,
  isSuperAdmin,
  isCurrentStaffUser,
  onOpenProfile,
  onEditStaff,
  onPasswordStaff,
  onRequestDelete
}) => {
  const { member, top, bottom, right } = activeActionMenu;
  const isCurrentUser = isCurrentStaffUser(member);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />
      <div
        data-staff-menu-popover={member.id}
        style={{
          position: 'fixed',
          top: top !== undefined ? `${top}px` : undefined,
          bottom: bottom !== undefined ? `${bottom}px` : undefined,
          right: `${right}px`,
          zIndex: 50
        }}
        className="w-60 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">
              {member.name}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
              {member.staffId || member.userId || member.id}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
              ROLE_META[member.role]?.badgeBg || 'bg-slate-100'
            } ${
              ROLE_META[member.role]?.badgeText || 'text-slate-700'
            } ${
              ROLE_META[member.role]?.borderColor || 'border-slate-200'
            }`}
          >
            {member.role}
          </span>
        </div>

        <div className="p-1 space-y-0.5">
          {(canViewOtherProfiles || isCurrentUser) && (
            <button
              type="button"
              id={`btn-action-view-${member.id}`}
              onClick={() => {
                onOpenProfile(member);
                onClose();
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>View Profile & Items</span>
            </button>
          )}

          {(canEditStaff || canManageAccess) && (
            <button
              type="button"
              id={`btn-action-edit-${member.id}`}
              onClick={() => {
                onEditStaff(member);
                onClose();
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Edit Details & Permissions</span>
            </button>
          )}

          {(canEditStaff || canManageAccess || isSuperAdmin) && (
            <button
              type="button"
              id={`btn-action-pass-${member.id}`}
              onClick={() => {
                onPasswordStaff(member);
                onClose();
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50/70 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Change / 24-Hr Password</span>
            </button>
          )}

          {canDeleteStaff && !isCurrentUser && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                id={`btn-action-delete-${member.id}`}
                onClick={() => {
                  onClose();
                  onRequestDelete(member);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Remove Staff Member</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
