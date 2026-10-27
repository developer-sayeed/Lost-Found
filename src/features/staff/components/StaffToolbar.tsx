import React from 'react';
import { Search } from 'lucide-react';

interface StaffToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dep: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  departmentsList: string[];
  onFilterChangeResetPage: () => void;
}

export const StaffToolbar: React.FC<StaffToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  departmentsList,
  onFilterChangeResetPage
}) => {
  return (
    <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
      <div className="relative w-full lg:max-w-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
        <input
          id="input-staff-search"
          type="text"
          placeholder="Search staff, ID, department..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            onFilterChangeResetPage();
          }}
          className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 min-h-[38px]"
        />
      </div>

      <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full lg:w-auto">
        {/* Department Filter */}
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Dept:</span>
          <select
            value={departmentFilter}
            onChange={e => {
              setDepartmentFilter(e.target.value);
              onFilterChangeResetPage();
            }}
            className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
          >
            <option value="All">All Depts</option>
            {departmentsList.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Role:</span>
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              onFilterChangeResetPage();
            }}
            className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Manager">Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              onFilterChangeResetPage();
            }}
            className="w-full sm:w-auto px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 min-h-[38px] font-medium"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
};
