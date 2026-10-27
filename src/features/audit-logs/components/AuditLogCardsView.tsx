import React from 'react';
import { CheckSquare, Square, Clock, Trash2, Package, ExternalLink, ArrowRight, User } from 'lucide-react';
import { AuditLog } from '../../../types';
import { getActionBadge } from '../utils/auditLogBadgeHelper';

interface AuditLogCardsViewProps {
  paginatedLogs: AuditLog[];
  selectedIds: Set<string>;
  onToggleSelectLog: (id: string, e?: React.MouseEvent) => void;
  onSelectLogDetail: (log: AuditLog) => void;
  onRequestDelete: (log: AuditLog) => void;
  onOpenItem: (itemCode?: string) => void;
}

export const AuditLogCardsView: React.FC<AuditLogCardsViewProps> = ({
  paginatedLogs,
  selectedIds,
  onToggleSelectLog,
  onSelectLogDetail,
  onRequestDelete,
  onOpenItem
}) => {
  return (
    <div className="space-y-3">
      {paginatedLogs.map(log => {
        const badge = getActionBadge(log.action, log.actionType);
        const Icon = badge.icon;
        const isSelected = selectedIds.has(log.id);
        const formattedDate = new Date(log.timestamp).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const hasStatusChange =
          (log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus) ||
          log.actionType === 'status_change';

        return (
          <div
            key={log.id}
            onClick={() => onSelectLogDetail(log)}
            className={`bg-white dark:bg-slate-900/90 rounded-xl border p-3.5 sm:p-4 shadow-2xs hover:border-[#5E1E6C]/70 dark:hover:border-fuchsia-400 hover:shadow-xs transition-all active:bg-slate-50/80 cursor-pointer space-y-2.5 relative ${
              isSelected
                ? 'border-[#5E1E6C] dark:border-fuchsia-400 bg-fuchsia-50/20 dark:bg-fuchsia-950/20'
                : 'border-[#5E1E6C]/35 dark:border-fuchsia-500/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={e => onToggleSelectLog(log.id, e)}
                  className="text-slate-400 hover:text-indigo-600 p-1 -m-1 rounded transition-colors cursor-pointer"
                  aria-label="Select log"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.className}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onRequestDelete(log);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete audit record"
                  aria-label="Delete audit record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
              {log.action}
            </div>

            {log.itemCode && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                <div className="flex items-center space-x-2 min-w-0">
                  <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onOpenItem(log.itemCode);
                    }}
                    className="font-mono font-bold text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1 shrink-0 cursor-pointer"
                    title="Open item details"
                  >
                    <span>{log.itemCode}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {log.itemName && (
                    <span className="text-xs text-slate-700 truncate font-medium">
                      {log.itemName}
                    </span>
                  )}
                </div>
                {log.category && (
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 ml-1">
                    {log.category}
                  </span>
                )}
              </div>
            )}

            {hasStatusChange && (
              <div className="flex items-center space-x-1.5 bg-amber-50/70 p-2 rounded-lg border border-amber-200/70 text-xs">
                <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-slate-700 font-medium text-[11px] shadow-2xs">
                  {log.previousStatus || 'Previous'}
                </span>
                <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[11px] shadow-2xs">
                  {log.newStatus || 'New'}
                </span>
              </div>
            )}

            {log.changes && log.changes.length > 0 && !hasStatusChange && (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60 space-y-1 text-xs">
                {log.changes.slice(0, 2).map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">{c.label || c.field}:</span>
                    <div className="flex items-center space-x-1 font-mono">
                      <span className="line-through text-slate-400 truncate max-w-[90px]">{String(c.from)}</span>
                      <span>➔</span>
                      <span className="text-emerald-700 font-bold truncate max-w-[100px]">{String(c.to)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {log.details && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100">
                {log.details}
              </p>
            )}

            <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{log.performedBy || 'System'}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium shrink-0">
                  {log.userRole || log.performedByRole || 'Staff'}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectLogDetail(log);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
                >
                  Inspect &rarr;
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
