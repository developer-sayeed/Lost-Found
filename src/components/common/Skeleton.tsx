import React from 'react';

/**
 * Base atomic Skeleton component with smooth shimmer wave
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle = false, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-skeleton ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      {...props}
    />
  );
};

/**
 * Single Metric Card Skeleton
 */
export const MetricCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-3 w-36 rounded-md" />
      </div>
    </div>
  );
};

/**
 * Full Dashboard Skeleton View
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Greeting Banner Skeleton */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(idx => (
          <MetricCardSkeleton key={idx} />
        ))}
      </div>

      {/* Quick Status Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs flex items-center justify-between gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map(idx => (
          <div key={idx} className="flex items-center space-x-2 min-w-[120px]">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2 pt-6">
            {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-lg"
                  style={{ height: `${height}%` }}
                />
                <Skeleton className="h-3 w-6 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Donut / Category Distribution (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex items-center justify-center py-4">
            <Skeleton className="w-44 h-44 rounded-full border-8 border-transparent" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(idx => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-3.5 w-10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Items Activity Table Skeleton */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map(idx => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40"
            >
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Data Table Skeleton View (For ItemsView, PendingDispatchView, RemovedItemsView, AuditLogsView)
 */
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasFilterBar?: boolean;
  hasMetricCards?: boolean;
  metricCardsCount?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 8,
  columns = 7,
  hasFilterBar = true,
  hasMetricCards = false,
  metricCardsCount = 4
}) => {
  return (
    <div className="space-y-5 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Metric Cards if requested */}
      {hasMetricCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: metricCardsCount }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Filter and Search Bar Skeleton */}
      {hasFilterBar && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pt-1">
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <Skeleton key={idx} className="h-7 w-20 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      )}

      {/* Main Table Container Skeleton */}
      <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-[#5E1E6C]/35 dark:border-fuchsia-500/40 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-6 rounded" />
          {Array.from({ length: columns - 1 }).map((_, idx) => (
            <Skeleton
              key={idx}
              className={`h-4 rounded ${
                idx === 0 ? 'w-24' : idx === 1 ? 'w-32' : idx === columns - 2 ? 'w-20' : 'w-28'
              }`}
            />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="p-3.5 sm:px-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors"
            >
              {/* Checkbox placeholder */}
              <Skeleton className="h-4 w-4 rounded shrink-0" />

              {/* Column 1: Code / Badge */}
              <div className="flex items-center space-x-2 w-28 shrink-0">
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>

              {/* Column 2: Name / Title + Subtitle */}
              <div className="space-y-1.5 flex-1 min-w-[120px]">
                <Skeleton className="h-4 w-36 sm:w-48 rounded" />
                <Skeleton className="h-3 w-24 sm:w-32 rounded" />
              </div>

              {/* Column 3: Category / Department */}
              <div className="hidden md:block w-28 shrink-0">
                <Skeleton className="h-4 w-20 rounded" />
              </div>

              {/* Column 4: Status Pill */}
              <div className="w-24 shrink-0">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Column 5: Date */}
              <div className="hidden sm:block w-24 shrink-0">
                <Skeleton className="h-3.5 w-18 rounded" />
              </div>

              {/* Column 6: Action Buttons */}
              <div className="flex items-center justify-end space-x-1.5 w-20 shrink-0">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="flex items-center space-x-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Staff Management Skeleton View
 */
export const StaffManagementSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(idx => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <div className="flex space-x-1.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Staff Performance & Leaderboard Skeleton View
 */
export const StaffPerformanceSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Top 3 Performers Podium Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(idx => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs flex flex-col items-center text-center space-y-3"
          >
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        ))}
      </div>

      {/* Leaderboard Table Skeleton */}
      <TableSkeleton rows={6} columns={6} hasFilterBar={false} />
    </div>
  );
};

/**
 * User Profile Skeleton View
 */
export const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <Skeleton className="h-6 w-48 rounded-md mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-36 rounded-md mx-auto sm:mx-0" />
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Skeleton View
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Tab Nav Pills Skeleton */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/25 dark:border-fuchsia-500/30 shadow-xs flex items-center space-x-2 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
          <Skeleton key={idx} className="h-9 w-28 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Main Settings Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#5E1E6C]/30 dark:border-fuchsia-500/35 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

