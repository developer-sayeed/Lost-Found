import React from 'react';
import { CheckSquare, Square, Clock, ArrowRight, ExternalLink, Trash2 } from 'lucide-react';
import { AuditLog } from '../../../types';
import { getActionBadge } from '../utils/auditLogBadgeHelper';

interface AuditLogTableViewProps {
  paginatedLogs: AuditLog[];
  selectedIds: Set<string>;
  onToggleSelectLog: (id: string) => void;
  onSelectAllPage: () => void;
  onSelectLogDetail: (log: AuditLog) => void;
  onRequestDelete: (log: AuditLog) => void;
  onOpenItem: (itemCode?: string) => void;
}

export const AuditLogTableView: React.FC<AuditLogTableViewProps> = ({
  paginatedLogs,
  selectedIds,
  onToggleSelectLog,
  onSelectAllPage,
  onSelectLogDetail,
  onRequestDelete,
  onOpenItem
}) => {
  const allSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.has(l.id));

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-[#5E1E6C]/40 dark:border-fuchsia-500/45 shadow-2xs overflow-hidden">
      <div className="overflow-auto max-h-[640px] relative">
        <table className="w-full text-left border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr className="bg-slate-50 text-slate-600 font-semibold tracking-wider uppercase text-[11px] select-none">
              <th className="py-3 px-3 w-8 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
                <button
                  type="button"
                  onClick={onSelectAllPage}
                  className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                  title="Select/Deselect all records on this page"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Date & Time</th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Action Event</th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Item / Entity</th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Status / Diff</th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Performed By</th>
              <th className="py-3 px-4 sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Details & Notes</th>
              <th className="py-3 px-4 text-right sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedLogs.map(log => {
              const badge = getActionBadge(log.action, log.actionType);
              const Icon = badge.icon;
              const isSelected = selectedIds.has(log.id);
              const formattedDate = new Date(log.timestamp).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              const hasStatusChange =
                (log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus) ||
                log.actionType === 'status_change';

              return (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                    isSelected ? 'bg-indigo-50/30' : ''
                  }`}
                  onClick={() => onSelectLogDetail(log)}
                >
                  <td className="py-3 px-3 align-top" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectLog(log.id)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap align-top">
                    <div className="font-mono text-slate-800 font-medium">{formattedDate}</div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.id.slice(0, 14)}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.className}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <div className="text-[11px] font-semibold text-slate-800 mt-1 max-w-[220px] truncate">
                      {log.action}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top">
                    {log.itemCode ? (
                      <div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenItem(log.itemCode);
                          }}
                          className="inline-flex items-center space-x-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="Click to view item details"
                        >
                          <span>{log.itemCode}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {log.itemName && (
                          <div className="text-[11px] text-slate-700 font-medium truncate max-w-[160px]">
                            {log.itemName}
                          </div>
                        )}
                        {log.category && (
                          <span className="text-[10px] text-slate-400">{log.category}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {log.entityType ? `[${log.entityType}]` : 'System / Non-item'}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top">
                    {hasStatusChange ? (
                      <div className="flex items-center space-x-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {log.previousStatus || 'Previous'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          {log.newStatus || 'New'}
                        </span>
                      </div>
                    ) : log.changes && log.changes.length > 0 ? (
                      <div className="space-y-1">
                        {log.changes.slice(0, 2).map((c, idx) => (
                          <div key={idx} className="text-[10px] text-slate-600">
                            <span className="font-semibold text-slate-700">{c.label || c.field}:</span>{' '}
                            <span className="line-through text-slate-400">{String(c.from).slice(0, 14)}</span>{' '}
                            ➔ <span className="text-emerald-600 font-semibold">{String(c.to).slice(0, 14)}</span>
                          </div>
                        ))}
                        {log.changes.length > 2 && (
                          <span className="text-[10px] text-indigo-600 font-medium">
                            +{log.changes.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : log.newStatus ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {log.newStatus}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.performedBy || 'System'}</div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        {log.userRole || log.performedByRole || 'Staff'}
                      </span>
                    </div>
                    {log.performedByEmail && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {log.performedByEmail}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top">
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {log.details || log.reason || 'No additional notes'}
                    </p>
                    {log.reason && log.details && log.details !== log.reason && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-amber-200">
                        Reason: {log.reason}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectLogDetail(log)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors min-h-[30px] cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDelete(log)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer"
                        title="Delete audit log record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
