import React from 'react';
import { Users, UserCheck, Shield, UserCheck2 } from 'lucide-react';
import { StaffMember } from '../../../types';

interface StaffStatsCardsProps {
  staff: StaffMember[];
}

export const StaffStatsCards: React.FC<StaffStatsCardsProps> = ({ staff }) => {
  const totalStaffCount = staff.length;
  const activeCount = staff.filter(s => s.status === 'Active').length;
  const managerCount = staff.filter(s => s.role === 'Manager' || s.department === 'Manager').length;
  const employeeCount = staff.filter(s => s.role === 'Employee' || s.role === 'Supervisor').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {/* Total Staff */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
            TOTAL STAFF
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {totalStaffCount}
          </p>
          <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-indigo-600 font-medium truncate">
            <span className="mr-1">•</span>Registered personnel
          </div>
        </div>
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 ml-2">
          <Users className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Active */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
            ACTIVE USERS
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            {activeCount}
          </p>
          <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-emerald-600 font-medium truncate">
            <span className="mr-1">•</span>Operational
          </div>
        </div>
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 ml-2">
          <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Manager */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
            MANAGERS
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {managerCount}
          </p>
          <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-amber-600 font-medium truncate">
            <span className="mr-1">•</span>Elevated access
          </div>
        </div>
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 ml-2">
          <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
            EMPLOYEES
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {employeeCount}
          </p>
          <div className="mt-1 sm:mt-2 flex items-center text-[11px] sm:text-xs text-sky-600 font-medium truncate">
            <span className="mr-1">•</span>Frontline team
          </div>
        </div>
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 ml-2">
          <UserCheck2 className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};
