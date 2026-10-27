import React from 'react';
import { Trash2, Package, Info, ShieldAlert } from 'lucide-react';

interface RemovedItemsHeaderProps {
  removedCount: number;
  canManageTrash: boolean;
  onNavigateToActiveItems: () => void;
  onOpenEmptyTrashModal: () => void;
}

export const RemovedItemsHeader: React.FC<RemovedItemsHeaderProps> = ({
  removedCount,
  canManageTrash,
  onNavigateToActiveItems,
  onOpenEmptyTrashModal
}) => {
  return (
    <>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Removed Items
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#251329] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-fuchsia-300 font-semibold">
                  {removedCount} {removedCount === 1 ? 'item' : 'items'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Items removed from inventory are retained for 60 days before auto-purge
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToActiveItems}
            className="px-3.5 py-2 text-xs font-semibold text-white btn-primary-gradient rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4 text-white" />
            <span>Active Inventory</span>
          </button>

          {canManageTrash && removedCount > 0 && (
            <button
              type="button"
              id="btn-empty-trash"
              onClick={onOpenEmptyTrashModal}
              className="px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Empty Recycle Bin</span>
            </button>
          )}
        </div>
      </div>

      {/* 60-Day Retention Notice Card */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100 text-sm mb-0.5">
            60-Day Data Retention &amp; Automatic Purge Policy
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Soft-deleted records remain securely in the system for{' '}
            <strong className="font-semibold text-amber-950 dark:text-amber-100">60 days</strong> from the
            deletion date. During this retention window, authorized staff can restore items back to the
            active catalog with full audit logs intact. Items exceeding 60 days are automatically purged
            during database sync.
          </p>
        </div>
      </div>
    </>
  );
};

export const RemovedItemsAccessRestricted: React.FC<{
  userName?: string;
  userRole?: string;
  onReturnToDashboard: () => void;
}> = ({ userName, userRole, onReturnToDashboard }) => {
  return (
    <div className="p-6 sm:p-12 max-w-3xl mx-auto text-center animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          Removed Items and Recycle Bin access is restricted. Only users who have been granted explicit
          permission by the Administrator can view or restore removed items.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl mb-6">
          Current Account: {userName || 'Staff'} ({userRole || 'Employee'})
        </div>
        <div>
          <button
            type="button"
            onClick={onReturnToDashboard}
            className="px-5 py-2.5 btn-primary-gradient text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
