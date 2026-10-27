import React from 'react';
import { Users, Search, Printer, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../../../../lib/avatarHelper';
import { StaffMember } from '../../../../types';
import { StaffPerformanceStats, DEPT_COLORS } from '../types/performance.types';

interface PerformanceLeaderboardTableProps {
  filteredStaffStats: StaffPerformanceStats[];
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  departmentsList: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortField: 'itemsLogged' | 'itemsHandedOver' | 'totalProcessed';
  setSortField: (field: 'itemsLogged' | 'itemsHandedOver' | 'totalProcessed') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onInspectStaff: (staff: StaffPerformanceStats) => void;
  onPrintStaff: (staff: StaffPerformanceStats) => void;
  onOpenStaffProfile: (staff: StaffMember) => void;
}

export const PerformanceLeaderboardTable: React.FC<PerformanceLeaderboardTableProps> = ({
  filteredStaffStats,
  selectedDept,
  setSelectedDept,
  departmentsList,
  searchQuery,
  setSearchQuery,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  onInspectStaff,
  onPrintStaff,
  onOpenStaffProfile
}) => {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Supervisor Staff Processing Leaderboard ({filteredStaffStats.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Individual staff performance breakdown with click-through item verification and audit trail.
          </p>
        </div>

        {/* Department Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
          >
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-indigo-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3.5 text-center w-12">Rank</th>
              <th className="py-3 px-3.5">Staff Member</th>
              <th className="py-3 px-3.5">Department &amp; Role</th>
              <th
                className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none"
                onClick={() => {
                  setSortField('itemsLogged');
                  setSortOrder(sortField === 'itemsLogged' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Logged (30d)</span>
                  {sortField === 'itemsLogged' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                </div>
              </th>
              <th
                className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none"
                onClick={() => {
                  setSortField('itemsHandedOver');
                  setSortOrder(sortField === 'itemsHandedOver' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Handovers</span>
                  {sortField === 'itemsHandedOver' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                </div>
              </th>
              <th className="py-3 px-3.5 text-center">Dispatched</th>
              <th
                className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none font-extrabold text-slate-900"
                onClick={() => {
                  setSortField('totalProcessed');
                  setSortOrder(sortField === 'totalProcessed' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Total Processed</span>
                  {sortField === 'totalProcessed' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                </div>
              </th>
              <th className="py-3 px-3.5 text-center">Team Share</th>
              <th className="py-3 px-3.5">Last Activity</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-medium">
            {filteredStaffStats.length > 0 ? (
              filteredStaffStats.map((s, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                return (
                  <tr
                    key={s.staff.id || s.email}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3.5 text-center font-bold">
                      {medal ? (
                        <span className="text-base" title={`Rank #${idx + 1}`}>{medal}</span>
                      ) : (
                        <span className="text-xs text-slate-400">#{idx + 1}</span>
                      )}
                    </td>

                    {/* Staff Member Details */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          name={s.staffName}
                          avatarUrl={s.avatar}
                          sizeClassName="w-8 h-8"
                          className="shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {s.staffName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {s.staffId} • {s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3.5 px-3.5">
                      <div className="space-y-0.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: DEPT_COLORS[s.department] || '#64748b' }}
                        >
                          {s.department}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {s.role}
                        </div>
                      </div>
                    </td>

                    {/* Items Logged */}
                    <td className="py-3.5 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.itemsLogged > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'
                      }`}>
                        {s.itemsLogged}
                      </span>
                    </td>

                    {/* Handovers */}
                    <td className="py-3.5 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.itemsHandedOver > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                      }`}>
                        {s.itemsHandedOver}
                      </span>
                    </td>

                    {/* Dispatched */}
                    <td className="py-3.5 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.itemsDispatched > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'
                      }`}>
                        {s.itemsDispatched}
                      </span>
                    </td>

                    {/* Total Processed */}
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="text-sm font-black text-slate-900">
                        {s.totalProcessed}
                      </span>
                    </td>

                    {/* Processing Share Bar */}
                    <td className="py-3.5 px-3.5">
                      <div className="space-y-1 w-24">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>{s.processingShare}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${Math.min(100, s.processingShare)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {s.lastActivityDate ? (
                        <span>{new Date(s.lastActivityDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      ) : (
                        <span className="text-slate-300 italic">No activity</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {s.totalProcessed > 0 && (
                          <button
                            type="button"
                            onClick={() => onInspectStaff(s)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            title="Inspect Items Processed by this staff"
                          >
                            Inspect Items
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPrintStaff(s)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title={`Print ${s.staffName}'s Performance Record`}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenStaffProfile(s.staff)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Staff Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                  No staff records match your selected department or search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
