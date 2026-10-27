import React from 'react';
import { ShieldCheck, Trash2, X, ArrowRight, ExternalLink } from 'lucide-react';
import { AuditLog } from '../../../types';

interface AuditLogDetailModalProps {
  selectedLogDetail: AuditLog | null;
  onClose: () => void;
  onRequestDelete: (log: AuditLog) => void;
  onInspectItem: (itemCode?: string) => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  selectedLogDetail,
  onClose,
  onRequestDelete,
  onInspectItem
}) => {
  if (!selectedLogDetail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        {/* Mobile Drag/Handle indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                Accountability Audit Record
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">
                ID: {selectedLogDetail.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onRequestDelete(selectedLogDetail)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete record"
              aria-label="Delete this audit record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Touch-Friendly Scrolling */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 text-xs">
          {/* Event Overview */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-500 font-medium">Action Event</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedLogDetail.action}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-500 font-medium">Timestamp</span>
              <span className="font-mono text-slate-800">
                {new Date(selectedLogDetail.timestamp).toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-500 font-medium">Action Category</span>
              <span className="uppercase font-mono font-bold text-indigo-600">
                {selectedLogDetail.actionType || 'standard'}
              </span>
            </div>
            {selectedLogDetail.entityType && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500 font-medium">Target Entity</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {selectedLogDetail.entityType}
                </span>
              </div>
            )}
          </div>

          {/* Status Change Progression */}
          {(selectedLogDetail.previousStatus || selectedLogDetail.newStatus) && (
            <div className="p-3.5 sm:p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <div className="font-bold text-amber-900 text-xs">Status Progression</div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm">
                <div className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 font-semibold text-slate-700 shadow-2xs">
                  {selectedLogDetail.previousStatus || 'None'}
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold shadow-2xs">
                  {selectedLogDetail.newStatus || 'Updated'}
                </div>
              </div>
            </div>
          )}

          {/* Item Info if present */}
          {selectedLogDetail.itemCode && (
            <div className="p-3.5 sm:p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-indigo-600">Associated Lost Item</div>
                <div className="font-mono font-bold text-indigo-900 text-xs sm:text-sm truncate">
                  {selectedLogDetail.itemCode} {selectedLogDetail.itemName ? `— ${selectedLogDetail.itemName}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onInspectItem(selectedLogDetail.itemCode);
                  onClose();
                }}
                className="self-start sm:self-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs text-xs flex items-center space-x-1.5 min-h-[36px] cursor-pointer"
              >
                <span>Inspect Item</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Field Diffs */}
          {selectedLogDetail.changes && selectedLogDetail.changes.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-slate-800 text-xs">Field Changes Detected</div>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedLogDetail.changes.map((c, i) => (
                  <div key={i} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs bg-white">
                    <span className="font-semibold text-slate-700">{c.label || c.field}</span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="line-through text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        {String(c.from)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        {String(c.to)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performed By & Audit Metadata */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-xs">Actor & Security Metadata</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Performed By:</span>{' '}
                <span className="font-semibold text-slate-800">{selectedLogDetail.performedBy}</span>
              </div>
              <div>
                <span className="text-slate-500">Role:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {selectedLogDetail.userRole || selectedLogDetail.performedByRole}
                </span>
              </div>
              {selectedLogDetail.performedByEmail && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-mono text-slate-800 break-all">{selectedLogDetail.performedByEmail}</span>
                </div>
              )}
              {selectedLogDetail.ip && (
                <div>
                  <span className="text-slate-500">IP Address:</span>{' '}
                  <span className="font-mono text-slate-800">{selectedLogDetail.ip}</span>
                </div>
              )}
              {selectedLogDetail.deviceType && (
                <div>
                  <span className="text-slate-500">Device:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedLogDetail.deviceType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Full Description & Reason */}
          <div>
            <div className="font-bold text-slate-800 text-xs mb-1">Audit Log Description</div>
            <p className="p-3 bg-slate-100 rounded-lg text-slate-700 leading-relaxed text-xs">
              {selectedLogDetail.details || 'No narrative description provided.'}
            </p>
          </div>

          {selectedLogDetail.reason && (
            <div>
              <div className="font-bold text-slate-800 text-xs mb-1">Official Stated Reason</div>
              <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed text-xs">
                {selectedLogDetail.reason}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRequestDelete(selectedLogDetail)}
            className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold rounded-lg text-xs min-h-[44px] flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Record</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
