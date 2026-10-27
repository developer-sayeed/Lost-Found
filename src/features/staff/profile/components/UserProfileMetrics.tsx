import React from 'react';
import { Package, Layers, Clock, CheckCircle2, Truck } from 'lucide-react';

interface UserProfileMetricsProps {
  displayName: string;
  totalItemsAdded: number;
  storedItemsCount: number;
  itemsPending: number;
  successfulHandovers: number;
  successRate: number;
  dispatchedItemsCount: number;
}

export const UserProfileMetrics: React.FC<UserProfileMetricsProps> = ({
  displayName,
  totalItemsAdded,
  storedItemsCount,
  itemsPending,
  successfulHandovers,
  successRate,
  dispatchedItemsCount
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Card 1: Total Items Added */}
      <div className="bg-white dark:bg-[#180F1A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-fuchsia-500/20 shadow-sm hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 flex flex-col justify-between transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mr-1">
            TOTAL ADDED
          </span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/25 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalItemsAdded}
          </p>
          <p className="text-[10px] sm:text-[11px] text-fuchsia-600 dark:text-fuchsia-400 font-medium mt-1 truncate">
            Deposited by {displayName.split(' ')[0]}
          </p>
        </div>
      </div>

      {/* Card 2: Currently Stored */}
      <div className="bg-white dark:bg-[#180F1A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-blue-500/20 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/50 flex flex-col justify-between transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mr-1">
            STORED ITEMS
          </span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {storedItemsCount}
          </p>
          <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
            In custody / warehouse
          </p>
        </div>
      </div>

      {/* Card 3: Items Pending */}
      <div className="bg-white dark:bg-[#180F1A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-amber-500/20 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 flex flex-col justify-between transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider truncate mr-1">
            ITEMS PENDING
          </span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {itemsPending}
          </p>
          <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 truncate">
            Approval &amp; dispatch
          </p>
        </div>
      </div>

      {/* Card 4: Successful Handovers */}
      <div className="bg-white dark:bg-[#180F1A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-emerald-500/20 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500/50 flex flex-col justify-between transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate mr-1">
            HANDOVERS
          </span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-1.5 flex-wrap">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {successfulHandovers}
            </p>
            {totalItemsAdded > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                {successRate}% rate
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate">
            Returned to guests
          </p>
        </div>
      </div>

      {/* Card 5: Total Dispatched */}
      <div className="bg-white dark:bg-[#180F1A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-purple-500/20 shadow-sm hover:border-purple-400 dark:hover:border-purple-500/50 flex flex-col justify-between transition-all col-span-2 sm:col-span-1 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider truncate mr-1">
            DISPATCHED
          </span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {dispatchedItemsCount}
          </p>
          <p className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1 truncate">
            Handed to finder staff
          </p>
        </div>
      </div>
    </div>
  );
};
