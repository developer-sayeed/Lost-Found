import React from 'react';
import { Clock } from 'lucide-react';
import { Translations } from '../../../context/LanguageContext';

interface ItemsPendingBannerProps {
  pendingApprovalsCount: number;
  t: Translations;
  onShowPending: () => void;
}

export const ItemsPendingBanner: React.FC<ItemsPendingBannerProps> = ({
  pendingApprovalsCount,
  t,
  onShowPending
}) => {
  if (pendingApprovalsCount <= 0) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
      <div className="flex items-center space-x-3 text-amber-900">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-xs text-amber-950 flex items-center space-x-2">
            <span>{pendingApprovalsCount} {t.pendingApproval || 'Staff Submissions Awaiting Approval'}</span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full">Review Required</span>
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Staff have logged items requiring approval before entering the active inventory. Once approved, the record will show you as &quot;Recorded By&quot;.
          </p>
        </div>
      </div>

      <button
        onClick={onShowPending}
        className="px-3.5 py-1.5 btn-primary-gradient text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
      >
        Show Pending ({pendingApprovalsCount})
      </button>
    </div>
  );
};
