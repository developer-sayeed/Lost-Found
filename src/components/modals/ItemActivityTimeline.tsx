import React, { useState } from 'react';
import {
  PlusCircle,
  Edit3,
  Truck,
  HeartHandshake,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  User,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  Tag,
  ArrowRight
} from 'lucide-react';
import { LostItem, ItemActivityEvent } from '../../types';

interface ItemActivityTimelineProps {
  item: LostItem;
}

export const ItemActivityTimeline: React.FC<ItemActivityTimelineProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  // Build complete events list (combining timeline + synthesizing missing legacy events if needed)
  const events: ItemActivityEvent[] = React.useMemo(() => {
    const rawEvents: ItemActivityEvent[] = Array.isArray(item.timeline) && item.timeline.length > 0
      ? [...item.timeline]
      : [];

    // If no timeline exists or registration event is missing, synthesize initial creation event
    const hasCreate = rawEvents.some(e => e.actionType === 'create' || e.action.toLowerCase().includes('create') || e.action.toLowerCase().includes('register'));
    if (!hasCreate && item.createdAt) {
      rawEvents.unshift({
        id: `tl-synth-create-${item.id}`,
        action: 'Item Registered & Stored',
        actionType: 'create',
        performedBy: item.recordedBy || item.employeeName || 'Staff Member',
        performedByRole: item.isApproved ? 'Admin' : 'Staff',
        timestamp: item.createdAt,
        notes: `Registered into system. Found by employee "${item.employeeName}" at location "${item.locationFound}". Initial storage: "${item.storeLocation}".`
      });
    }

    // If item is handed over and no handover event in timeline, synthesize it
    const hasHandover = rawEvents.some(e => e.actionType === 'handover' || e.action.toLowerCase().includes('handover') || e.action.toLowerCase().includes('handed over'));
    if (item.status === 'Handed Over' && item.handoverDetails && !hasHandover) {
      rawEvents.push({
        id: `tl-synth-handover-${item.id}`,
        action: 'Item Handed Over to Guest',
        actionType: 'handover',
        performedBy: item.handoverDetails.handedOverBy || item.recordedBy || 'Admin',
        performedByRole: 'Admin',
        timestamp: item.updatedAt || item.createdAt,
        notes: `Handed over to guest "${item.handoverDetails.receiverName}" (Contact: ${item.handoverDetails.contactNumber}). Handed over by ${item.handoverDetails.handedOverBy || 'Admin'}.${item.handoverDetails.remarks ? ' Remarks: ' + item.handoverDetails.remarks : ''}`
      });
    }

    // If item is dispatched and no dispatch event in timeline, synthesize it
    const hasDispatch = rawEvents.some(e => e.actionType === 'dispatch' || e.action.toLowerCase().includes('dispatch'));
    if (item.status === 'Dispatched' && item.dispatchDetails && !hasDispatch) {
      rawEvents.push({
        id: `tl-synth-dispatch-${item.id}`,
        action: 'Item Dispatched',
        actionType: 'dispatch',
        performedBy: item.dispatchDetails.dispatchedBy || item.recordedBy || 'Admin',
        performedByRole: 'Admin',
        timestamp: item.dispatchDetails.dispatchedAt || item.updatedAt || item.createdAt,
        notes: `Dispatched to "${item.dispatchDetails.dispatchedTo || item.dispatchDetails.destination || 'Finder Staff'}" (Auth/Ref: ${item.dispatchDetails.trackingNumber || 'N/A'}).`
      });
    }

    // Sort chronologically (latest first)
    return rawEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [item]);

  const filteredEvents = React.useMemo(() => {
    if (filterAction === 'all') return events;
    return events.filter(e => e.actionType === filterAction || e.action.toLowerCase().includes(filterAction.toLowerCase()));
  }, [events, filterAction]);

  const getActionBadge = (event: ItemActivityEvent) => {
    const type = event.actionType || 'update';
    switch (type) {
      case 'create':
        return {
          icon: PlusCircle,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'Creation'
        };
      case 'approve':
        return {
          icon: CheckCircle2,
          color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
          dot: 'bg-indigo-600',
          label: 'Approved'
        };
      case 'reject':
        return {
          icon: XCircle,
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          dot: 'bg-amber-600',
          label: 'Rejected'
        };
      case 'update':
        return {
          icon: Edit3,
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          dot: 'bg-blue-600',
          label: 'Update'
        };
      case 'handover':
        return {
          icon: HeartHandshake,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'Handover'
        };
      case 'dispatch':
        return {
          icon: Truck,
          color: 'bg-sky-100 text-sky-800 border-sky-300',
          dot: 'bg-sky-600',
          label: 'Dispatch'
        };
      case 'return_to_store':
        return {
          icon: RotateCcw,
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          dot: 'bg-purple-600',
          label: 'Return to Store'
        };
      case 'delete':
        return {
          icon: Trash2,
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          label: 'Removed'
        };
      case 'restore':
        return {
          icon: RotateCcw,
          color: 'bg-teal-100 text-teal-800 border-teal-300',
          dot: 'bg-teal-600',
          label: 'Restored'
        };
      default:
        return {
          icon: History,
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          label: 'Activity'
        };
    }
  };

  const formatEventDate = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(timestamp).getTime();
      const diffMs = now - past;
      if (diffMs < 0) return 'just now';
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 30) return `${diffDay}d ago`;
      return `${Math.floor(diffDay / 30)}mo ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden transition-all shadow-2xs">
      {/* Accordion Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-white hover:bg-slate-50/80 cursor-pointer flex items-center justify-between border-b border-slate-200 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                Activity & Custody Audit Trail
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Full accountability log: Creator, approver, edits, and dispatch trail
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            {isExpanded ? 'Hide History' : 'View Full History'}
          </span>
          <div className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Quick Filter Chips if > 2 events */}
          {events.length > 2 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                type="button"
                onClick={() => setFilterAction('all')}
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                  filterAction === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({events.length})
              </button>
              {events.some(e => e.actionType === 'create') && (
                <button
                  type="button"
                  onClick={() => setFilterAction('create')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                    filterAction === 'create'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Creation
                </button>
              )}
              {events.some(e => e.actionType === 'update') && (
                <button
                  type="button"
                  onClick={() => setFilterAction('update')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                    filterAction === 'update'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Updates
                </button>
              )}
              {events.some(e => e.actionType === 'handover' || e.actionType === 'dispatch') && (
                <button
                  type="button"
                  onClick={() => setFilterAction(events.some(e => e.actionType === 'handover') ? 'handover' : 'dispatch')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                    filterAction === 'handover' || filterAction === 'dispatch'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Handover / Dispatch
                </button>
              )}
            </div>
          )}

          {/* Timeline List */}
          {filteredEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No matching activity events found.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredEvents.map((event, index) => {
                const badge = getActionBadge(event);
                const IconComponent = badge.icon;
                const relTime = getRelativeTime(event.timestamp);

                return (
                  <div key={event.id || `event-${index}`} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${badge.dot}`}
                    >
                      <IconComponent className="w-2.5 h-2.5 text-white" />
                    </div>

                    {/* Event Card */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2">
                      {/* Top Bar: Action Title + Relative Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="text-xs font-bold text-slate-900">
                              {event.action}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{formatEventDate(event.timestamp)}</span>
                          </div>
                        </div>

                        {relTime && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium shrink-0">
                            {relTime}
                          </span>
                        )}
                      </div>

                      {/* Performer Information Tag */}
                      <div className="flex items-center space-x-2 text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-medium">
                          Logged by: <strong className="text-slate-900 font-semibold">{event.performedBy || 'System Staff'}</strong>
                        </span>
                        {event.performedByRole && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-2.5 h-2.5" />
                            <span>{event.performedByRole}</span>
                          </span>
                        )}
                      </div>

                      {/* Event Notes / Narrative */}
                      {event.notes && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-white pl-0.5">
                          {event.notes}
                        </p>
                      )}

                      {/* Changes Breakdown / Diffs */}
                      {Array.isArray(event.changes) && event.changes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>Field Modifications:</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                            {event.changes.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center space-x-1.5 p-1.5 rounded-md bg-slate-50 border border-slate-100 flex-wrap"
                              >
                                <span className="font-semibold text-slate-700 min-w-[100px]">
                                  {c.label}:
                                </span>
                                <span className="line-through text-rose-500 font-mono text-[10px] px-1 bg-rose-50 rounded">
                                  {String(c.from || 'None')}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-emerald-700 font-semibold font-mono text-[10px] px-1 bg-emerald-50 rounded">
                                  {String(c.to || 'None')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
