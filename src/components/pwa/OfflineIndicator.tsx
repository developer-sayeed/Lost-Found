import React, { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, Clock, CloudOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, offlineQueue, syncOfflineQueue, isProcessingQueue, lastSyncTime } = useApp();
  const [showQueueDetails, setShowQueueDetails] = useState(false);

  const pendingCount = offlineQueue ? offlineQueue.length : 0;

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-40 max-w-md animate-in slide-in-from-bottom-3 duration-300 ${className}`}>
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white p-3.5 shadow-2xl backdrop-blur-md border border-amber-500/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400" />
            )}
            
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : null}
                {!isOnline ? 'Spotty Wi-Fi / Offline Mode' : 'Online — Syncing Data'}
              </span>
              <span className="text-[11px] text-slate-300">
                {!isOnline
                  ? 'Showing cached items. You can still log new items.'
                  : `${pendingCount} item(s) ready to sync`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {pendingCount > 0 && (
              <button
                onClick={() => setShowQueueDetails(!showQueueDetails)}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30"
              >
                {pendingCount} Pending
              </button>
            )}

            <button
              onClick={() => syncOfflineQueue()}
              disabled={isProcessingQueue}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition active:scale-95 disabled:opacity-50"
              title="Try syncing now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
              <span>{isProcessingQueue ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Detailed queue drawer when clicked */}
        {showQueueDetails && pendingCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700/60 text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
              <span>Offline Logged Queue</span>
              <span>Auto-syncs on Wi-Fi</span>
            </div>
            {offlineQueue.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl text-[11px] border border-slate-700/50"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-white">
                      {act.type === 'CREATE_ITEM'
                        ? `New Item: ${act.payload?.itemName || act.localCode || 'Lost Item'}`
                        : act.type === 'HANDOVER_ITEM'
                        ? `Handover: ${act.itemId}`
                        : act.type === 'UPDATE_ITEM'
                        ? `Update: ${act.itemId}`
                        : act.type}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                  Queued
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
