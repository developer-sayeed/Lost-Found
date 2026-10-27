import React from 'react';
import { FileText, ArrowRight, HeartHandshake, Clock } from 'lucide-react';
import { AuditLog } from '../../../types';

interface AuditLogStatsCardsProps {
  stats: any;
  logs: AuditLog[];
}

export const AuditLogStatsCards: React.FC<AuditLogStatsCardsProps> = ({ stats, logs }) => {
  const totalCount = stats?.total ?? logs.length;
  const statusChangesCount = stats?.statusChanges ?? logs.filter(l => l.actionType === 'status_change').length;
  const releasesCount =
    (stats?.handovers || 0) + (stats?.dispatches || 0) ||
    logs.filter(l => l.actionType === 'handover' || l.actionType === 'dispatch').length;
  const past24hCount =
    stats?.recent24h ??
    logs.filter(l => Date.now() - new Date(l.timestamp).getTime() <= 86400000).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 hover:border-[#5E1E6C]/70 dark:hover:border-fuchsia-400 transition-all shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500">Total Recorded</span>
          <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono">
          {totalCount}
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-400">Total audit events</span>
      </div>

      <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 hover:border-[#5E1E6C]/70 dark:hover:border-fuchsia-400 transition-all shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500">Status Changes</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-700 font-mono">
          {statusChangesCount}
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-400">Lifecycle shifts</span>
      </div>

      <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 hover:border-[#5E1E6C]/70 dark:hover:border-fuchsia-400 transition-all shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500">Handovers / Dispatches</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
          {releasesCount}
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-400">Verified releases</span>
      </div>

      <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 hover:border-[#5E1E6C]/70 dark:hover:border-fuchsia-400 transition-all shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500">Past 24 Hours</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-indigo-700 font-mono">
          {past24hCount}
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-400">Recent activities</span>
      </div>
    </div>
  );
};
