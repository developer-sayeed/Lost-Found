import React from 'react';
import { Search, X, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import { QUICK_FILTER_OPTIONS } from '../utils/auditLogBadgeHelper';

interface AuditLogFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (v: boolean) => void;
  selectedActionType: string;
  setSelectedActionType: (val: string) => void;
  selectedRole: string;
  setSelectedRole: (val: string) => void;
  selectedDateRange: string;
  setSelectedDateRange: (val: string) => void;
  activeFiltersCount: number;
  filteredLogsCount: number;
  totalLogsCount: number;
  currentPage: number;
  itemsPerPage: number;
  paginatedLogsCount: number;
  selectedIds: Set<string>;
  allOnPageSelected: boolean;
  onSelectAllPage: () => void;
  onSelectAllAcrossPages: () => void;
  onResetFilters: () => void;
}

export const AuditLogFilterBar: React.FC<AuditLogFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  isFiltersOpen,
  setIsFiltersOpen,
  selectedActionType,
  setSelectedActionType,
  selectedRole,
  setSelectedRole,
  selectedDateRange,
  setSelectedDateRange,
  activeFiltersCount,
  filteredLogsCount,
  totalLogsCount,
  currentPage,
  itemsPerPage,
  paginatedLogsCount,
  selectedIds,
  allOnPageSelected,
  onSelectAllPage,
  onSelectAllAcrossPages,
  onResetFilters
}) => {
  const startRecord = filteredLogsCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredLogsCount);

  return (
    <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 shadow-2xs space-y-3">
      {/* Search Row + Filter Toggle on Mobile */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-audit-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search code, action, staff, email, reason..."
            className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          id="btn-toggle-audit-filters"
          type="button"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className={`md:hidden flex items-center space-x-1.5 px-3 py-2 sm:py-2.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 min-h-[40px] cursor-pointer ${
            isFiltersOpen || activeFiltersCount > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Filter Horizontal Scroll Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Action:
        </span>
        {QUICK_FILTER_OPTIONS.map(opt => {
          const isActive = selectedActionType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedActionType(opt.value)}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 border min-h-[30px] cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Extended Filter Dropdowns */}
      <div className={`${isFiltersOpen ? 'block' : 'hidden md:block'} pt-2 border-t border-slate-100`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div>
            <label htmlFor="select-audit-action-type" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Action Type
            </label>
            <select
              id="select-audit-action-type"
              value={selectedActionType}
              onChange={e => setSelectedActionType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Action Types</option>
              <option value="create">Item Registration</option>
              <option value="update">Item Information Edits</option>
              <option value="status_change">Status Lifecycle Changes</option>
              <option value="handover">Handovers to Guest</option>
              <option value="dispatch">Dispatches / Couriers</option>
              <option value="return_to_store">Returns to Store</option>
              <option value="approval">Item Approvals</option>
              <option value="rejection">Item Rejections</option>
              <option value="permission_change">Staff Permission Changes</option>
              <option value="role_change">User Role Changes</option>
              <option value="user_update">Staff Profile Edits</option>
              <option value="delete">Item & Record Deletions</option>
              <option value="certificate">Certificates & Awards</option>
            </select>
          </div>

          <div>
            <label htmlFor="select-audit-role" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Performed By Role
            </label>
            <select
              id="select-audit-role"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Staff Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Employee">Staff / Employee</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label htmlFor="select-audit-date-range" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Time Period
            </label>
            <select
              id="select-audit-date-range"
              value={selectedDateRange}
              onChange={e => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Recorded Dates</option>
              <option value="today">Today Only (24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counter, Select All, and Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Showing <strong className="text-slate-800 font-mono">{startRecord}–{endRecord}</strong> of{' '}
            <strong className="text-slate-800 font-mono">{filteredLogsCount}</strong> records
            {filteredLogsCount !== totalLogsCount && (
              <span className="text-slate-400 text-[11px] ml-1">({totalLogsCount} total)</span>
            )}
          </span>
          {filteredLogsCount > 0 && (
            <button
              type="button"
              onClick={onSelectAllPage}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              title="Select / deselect all records on this page"
            >
              {allOnPageSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deselect Page</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select Page ({paginatedLogsCount})</span>
                </>
              )}
            </button>
          )}
          {selectedIds.size > 0 && selectedIds.size < filteredLogsCount && (
            <button
              type="button"
              onClick={onSelectAllAcrossPages}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer"
            >
              Select all {filteredLogsCount} matching
            </button>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Reset filters ({activeFiltersCount})
          </button>
        )}
      </div>
    </div>
  );
};
