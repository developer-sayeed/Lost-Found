import React from 'react';
import { Package, Award, Users, HeartHandshake, BarChart3 } from 'lucide-react';
import { StaffPerformanceStats } from '../types/performance.types';

interface PerformanceKpisProps {
  totalProcessedOverall: number;
  totalLoggedOverall: number;
  totalHandedOverOverall: number;
  topPerformer: StaffPerformanceStats | null;
  activeStaffCount: number;
  totalStaffCount: number;
}

export const PerformanceKpis: React.FC<PerformanceKpisProps> = ({
  totalProcessedOverall,
  totalLoggedOverall,
  totalHandedOverOverall,
  topPerformer,
  activeStaffCount,
  totalStaffCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Items Processed */}
      <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Processed
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {totalProcessedOverall}
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span className="font-semibold text-indigo-600">{totalLoggedOverall} logged</span>
          <span>•</span>
          <span className="font-semibold text-emerald-600">{totalHandedOverOverall} returns</span>
        </div>
      </div>

      {/* 2. Top Performer (MVP) */}
      <div
        className="p-4.5 rounded-2xl bg-primary text-white border border-white/20 shadow-xs space-y-2 relative overflow-hidden"
        style={{
          background: 'var(--gradient-primary-cta, var(--color-primary, #5E1E6C))',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Top Contributor</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white backdrop-blur-xs border border-white/25 shadow-xs">
            🥇 #1
          </span>
        </div>
        <div className="text-base font-extrabold text-white truncate drop-shadow-xs">
          {topPerformer ? topPerformer.staffName : 'No activity yet'}
        </div>
        <div className="text-[11px] text-white/85 font-semibold truncate">
          {topPerformer ? `${topPerformer.totalProcessed} items (${topPerformer.department})` : 'Awaiting records'}
        </div>
      </div>

      {/* 3. Active Processors Rate */}
      <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Processors
          </span>
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {activeStaffCount} <span className="text-sm font-semibold text-slate-400">/ {totalStaffCount}</span>
        </div>
        <div className="text-[11px] text-sky-600 font-semibold">
          {totalStaffCount > 0 ? Math.round((activeStaffCount / totalStaffCount) * 100) : 0}% team participation
        </div>
      </div>

      {/* 4. Guest Returns / Handovers */}
      <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Guest Handovers
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {totalHandedOverOverall}
        </div>
        <div className="text-[11px] text-emerald-600 font-semibold">
          {totalLoggedOverall > 0 ? Math.round((totalHandedOverOverall / totalLoggedOverall) * 100) : 0}% guest return rate
        </div>
      </div>

      {/* 5. Average Output per Staff */}
      <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Throughput
          </span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {activeStaffCount > 0 ? (totalProcessedOverall / activeStaffCount).toFixed(1) : '0.0'}
        </div>
        <div className="text-[11px] text-purple-600 font-semibold">
          Items processed per active staff
        </div>
      </div>
    </div>
  );
};
