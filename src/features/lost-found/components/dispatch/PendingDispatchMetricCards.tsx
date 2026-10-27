import React from 'react';
import { Package, AlertTriangle, Clock, CalendarCheck } from 'lucide-react';
import { DispatchCategoryFilter, ItemWithDiff } from '../../types/dispatch.feature.types';
import { Translations } from '../../../../context/LanguageContext';

interface PendingDispatchMetricCardsProps {
  activeCategoryFilter: DispatchCategoryFilter;
  setActiveCategoryFilter: (filter: DispatchCategoryFilter) => void;
  setCurrentPage: (page: number) => void;
  pendingItems: ItemWithDiff[];
  overdueItems: ItemWithDiff[];
  todayDueItems: ItemWithDiff[];
  upcomingDueItems: ItemWithDiff[];
  t: Translations;
}

export const PendingDispatchMetricCards: React.FC<PendingDispatchMetricCardsProps> = ({
  activeCategoryFilter,
  setActiveCategoryFilter,
  setCurrentPage,
  pendingItems,
  overdueItems,
  todayDueItems,
  upcomingDueItems,
  t
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Pending */}
      <div
        onClick={() => {
          setActiveCategoryFilter('all');
          setCurrentPage(1);
        }}
        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          activeCategoryFilter === 'all'
            ? 'bg-fuchsia-50/90 dark:bg-fuchsia-950/50 border-fuchsia-300 dark:border-fuchsia-600 ring-2 ring-fuchsia-500/20 shadow-xs'
            : 'bg-gradient-to-br from-fuchsia-50/50 via-white/80 to-purple-50/40 dark:from-[#241328]/70 dark:via-[#1a0c1d]/70 dark:to-[#120815]/70 border-fuchsia-200/70 dark:border-fuchsia-500/20 shadow-sm hover:border-fuchsia-400 dark:hover:border-fuchsia-400'
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.pendingDispatchMetric || 'TOTAL PENDING'}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingItems.length}</p>
          <div className="mt-2 flex items-center text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium">
            <span className="mr-1">•</span>
            {t.awaitingFulfillment || 'Awaiting fulfillment'}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <Package className="w-6 h-6" />
        </div>
      </div>

      {/* Overdue */}
      <div
        onClick={() => {
          setActiveCategoryFilter('overdue');
          setCurrentPage(1);
        }}
        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          activeCategoryFilter === 'overdue'
            ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
            : 'bg-gradient-to-br from-rose-50/40 via-white/80 to-purple-50/30 dark:from-[#28131d]/70 dark:via-[#1a0c1d]/70 dark:to-[#120815]/70 border-rose-200/70 dark:border-rose-500/20 shadow-sm hover:border-rose-300 dark:hover:border-rose-400'
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.overdue || 'OVERDUE'}
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueItems.length}</p>
          <div className="mt-2 flex items-center text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span className="mr-1">•</span>
            {t.pastPolicyWindow || 'Past policy window'}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* Due Today */}
      <div
        onClick={() => {
          setActiveCategoryFilter('today');
          setCurrentPage(1);
        }}
        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          activeCategoryFilter === 'today'
            ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
            : 'bg-gradient-to-br from-amber-50/40 via-white/80 to-purple-50/30 dark:from-[#281d13]/70 dark:via-[#1a0c1d]/70 dark:to-[#120815]/70 border-amber-200/70 dark:border-amber-500/20 shadow-sm hover:border-amber-300 dark:hover:border-amber-400'
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.dueToday || 'DUE TODAY'}
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{todayDueItems.length}</p>
          <div className="mt-2 flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span className="mr-1">•</span>
            {t.immediateAction || 'Immediate action'}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Due in 1-3 Days */}
      <div
        onClick={() => {
          setActiveCategoryFilter('upcoming');
          setCurrentPage(1);
        }}
        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          activeCategoryFilter === 'upcoming'
            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
            : 'bg-gradient-to-br from-blue-50/40 via-white/80 to-purple-50/30 dark:from-[#131d28]/70 dark:via-[#1a0c1d]/70 dark:to-[#120815]/70 border-blue-200/70 dark:border-blue-500/20 shadow-sm hover:border-blue-300 dark:hover:border-blue-400'
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.dueIn3Days || 'DUE IN 1-3 DAYS'}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingDueItems.length}</p>
          <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span className="mr-1">•</span>
            {t.upcomingCutoff || 'Upcoming cutoff'}
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <CalendarCheck className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
