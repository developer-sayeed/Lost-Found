import React from 'react';
import { BadgeCheck, Edit3, Camera } from 'lucide-react';
import { UserAvatar } from '../../../../lib/avatarHelper';

interface UserProfileHeaderProps {
  displayName: string;
  avatarUrl?: string;
  displayPosition?: string;
  displayDept?: string;
  displayWorkplace?: string;
  displayRole?: string;
  displayStaffId?: string;
  displayIqama?: string;
  totalItemsAdded: number;
  successfulHandovers: number;
  itemsPending: number;
  canEditCurrentProfile: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeAvatar?: () => void;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  displayName,
  avatarUrl,
  displayPosition,
  displayDept,
  displayWorkplace,
  displayRole,
  displayStaffId,
  displayIqama,
  totalItemsAdded,
  successfulHandovers,
  itemsPending,
  canEditCurrentProfile,
  isEditing,
  onStartEdit,
  onChangeAvatar
}) => {
  return (
    <div
      className="p-5 sm:p-7 lg:p-9 text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3d1246 0%, #260a2d 55%, #18071c 100%)'
      }}
    >
      {/* Ambient Fuchsia Glow */}
      <div 
        aria-hidden="true" 
        className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" 
        />

      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 sm:gap-7">
        <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-5 w-full xl:w-auto">
          {/* Avatar with Interactive Change Overlay */}
          <div className="relative group shrink-0">
            <UserAvatar
              name={displayName || 'User'}
              avatarUrl={avatarUrl}
              sizeClassName="w-16 h-16 sm:w-20 sm:h-20"
              className="rounded-2xl border-2 border-fuchsia-400/40 shadow-xl shadow-fuchsia-950/40 flex-shrink-0"
            />
            {canEditCurrentProfile && onChangeAvatar && (
              <>
                <button
                  type="button"
                  onClick={onChangeAvatar}
                  className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-all backdrop-blur-[2px] cursor-pointer"
                  title="Change Profile Photo (মিডিয়া / লোকাল আপলোড)"
                >
                  <Camera className="w-5 h-5 mb-0.5 text-fuchsia-300" />
                  <span>Change</span>
                </button>
                <button
                  type="button"
                  onClick={onChangeAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-95 text-white rounded-xl shadow-lg border-2 border-[#260a2d] transition-all cursor-pointer"
                  title="Upload Photo / ছবি পরিবর্তন করুন"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                id="user-profile-card-name"
                className="text-lg sm:text-2xl font-bold !text-white user-profile-name flex items-center gap-2 break-words tracking-tight"
                style={{ color: '#ffffff' }}
              >
                <span className="!text-white user-profile-name" style={{ color: '#ffffff' }}>
                  {displayName}
                </span>
                <BadgeCheck className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />
              </h1>

              {/* Pen / Edit Icon for modifying staff data */}
              {canEditCurrentProfile && !isEditing && (
                <button
                  type="button"
                  id="btn-edit-profile-pen"
                  onClick={onStartEdit}
                  title="Edit Staff Profile"
                  aria-label="Edit Staff Profile"
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white hover:text-fuchsia-200 border border-white/15 backdrop-blur-md transition-all shadow-xs cursor-pointer group"
                >
                  <Edit3 className="w-3.5 h-3.5 text-fuchsia-300 group-hover:text-white transition-colors" />
                  <span className="text-xs font-semibold text-white ml-1.5 hidden sm:inline">
                    Edit Profile
                  </span>
                </button>
              )}
            </div>

            {/* Department + Position prominently under User Name (System Role hidden per specification) */}
            <p className="text-xs sm:text-sm text-fuchsia-200/90 flex flex-wrap items-center gap-1.5 mt-1 break-words font-semibold">
              <span className="text-white">{displayDept || 'Housekeeping'}</span>
              {displayPosition && (
                <>
                  <span className="text-fuchsia-400">•</span>
                  <span>{displayPosition}</span>
                </>
              )}
              {displayWorkplace && (
                <>
                  <span className="text-fuchsia-400">•</span>
                  <span className="text-fuchsia-200/75 font-normal">{displayWorkplace}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 backdrop-blur-sm whitespace-nowrap">
                {displayDept} {displayPosition ? `• ${displayPosition}` : ''}
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] sm:text-[11px] font-mono text-fuchsia-100 border border-white/10">
                Staff ID: {displayStaffId}
              </span>
              {displayIqama && (
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] sm:text-[11px] font-mono text-fuchsia-100 border border-white/10">
                  Iqama: {displayIqama}
                </span>
              )}
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] sm:text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Staff Member</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Performance Badge Banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10 w-full xl:w-auto shadow-inner">
          <div className="text-center px-2">
            <p className="text-[10px] sm:text-xs text-fuchsia-200/80 leading-tight uppercase font-semibold tracking-wider whitespace-nowrap">Total Items</p>
            <p className="text-lg sm:text-2xl font-extrabold text-white mt-1">{totalItemsAdded}</p>
          </div>
          <div className="text-center px-2 border-x border-white/10">
            <p className="text-[10px] sm:text-xs text-fuchsia-200/80 leading-tight uppercase font-semibold tracking-wider whitespace-nowrap">Handover</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-400 mt-1">{successfulHandovers}</p>
          </div>
          <div className="text-center px-2">
            <p className="text-[10px] sm:text-xs text-fuchsia-200/80 leading-tight uppercase font-semibold tracking-wider whitespace-nowrap">Pending</p>
            <p className="text-lg sm:text-2xl font-extrabold text-amber-400 mt-1">{itemsPending}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
