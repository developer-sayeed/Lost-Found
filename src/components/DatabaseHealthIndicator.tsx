import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Clock,
  Server,
  Activity,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DatabaseEngineType } from '../types';

export const DatabaseHealthIndicator: React.FC = () => {
  const {
    dbHealth,
    isCheckingDbHealth,
    checkDatabaseHealth,
    multiDbState,
    setActiveTab
  } = useApp();
  const { isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [simulatedDrop, setSimulatedDrop] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeEngine: DatabaseEngineType = multiDbState?.primaryEngine || dbHealth?.engine || 'mongodb';
  const activeDbInfo = multiDbState?.databases?.find(d => d.type === activeEngine);

  // Determine effective health state (accounting for optional test simulation)
  const isDropOrTimeout = simulatedDrop || (dbHealth && (!dbHealth.success || dbHealth.status === 'timeout' || dbHealth.status === 'error' || dbHealth.status === 'disconnected'));
  const isDegraded = !isDropOrTimeout && dbHealth && (dbHealth.status === 'degraded' || dbHealth.pingMs > 450);
  const isHealthy = !isDropOrTimeout && !isDegraded && dbHealth?.success;

  const latencyMs = simulatedDrop ? 0 : (dbHealth?.pingMs ?? (activeEngine === 'local_json' ? 1 : 0));
  const engineName = activeDbInfo?.name || dbHealth?.name || (activeEngine === 'mongodb' ? 'MongoDB Atlas' : 'Active DB');

  const handleManualPing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setSimulatedDrop(false);
    try {
      await checkDatabaseHealth();
    } finally {
      setIsPinging(false);
    }
  };

  const toggleSimulateDrop = () => {
    setSimulatedDrop(prev => !prev);
  };

  const getStatusBadge = () => {
    if (isDropOrTimeout) {
      return {
        label: simulatedDrop ? 'Simulated Drop' : (dbHealth?.status === 'timeout' ? 'Timed Out' : 'Connection Dropped'),
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        dotClass: 'bg-rose-500',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
      };
    }
    if (isDegraded) {
      return {
        label: 'High Latency',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    return {
      label: 'Connected',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
      icon: <Activity className="w-3.5 h-3.5 text-emerald-600" />
    };
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Real-time Indicator Button in Header */}
      <button
        type="button"
        id="btn-db-health-indicator"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center space-x-2 rtl:space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs select-none ${
          isDropOrTimeout
            ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 ring-2 ring-rose-300/40 animate-pulse'
            : isDegraded
            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
        }`}
        title={
          isDropOrTimeout
            ? `WARNING: Connection to ${engineName} dropped or timed out!`
            : `Active DB: ${engineName} | Latency: ${latencyMs}ms`
        }
      >
        {/* Warning Icon if connection drops or times out; otherwise Database icon */}
        {isDropOrTimeout ? (
          <span className="flex items-center space-x-1 text-rose-600">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          </span>
        ) : isDegraded ? (
          <span className="flex items-center space-x-1 text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 text-emerald-600">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </span>
        )}

        {/* Database Name (Shortened on smaller screens) */}
        <span className="hidden md:inline font-medium">
          {activeEngine === 'mongodb' ? 'MongoDB' : activeEngine === 'local_json' ? 'Local DB' : engineName}
        </span>

        {/* Real-time Latency (ms) Pill */}
        <div
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
            isDropOrTimeout
              ? 'bg-rose-200/90 text-rose-900'
              : isDegraded
              ? 'bg-amber-200/80 text-amber-900'
              : 'bg-emerald-200/80 text-emerald-900'
          }`}
        >
          {isPinging || isCheckingDbHealth ? (
            <RefreshCw className="w-3 h-3 animate-spin text-current" />
          ) : isDropOrTimeout ? (
            <span className="flex items-center space-x-1">
              <WifiOff className="w-3 h-3 text-rose-700" />
              <span>Drop</span>
            </span>
          ) : (
            <span>{latencyMs > 0 ? `${latencyMs}ms` : '<1ms'}</span>
          )}
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Database Health Popover Details */}
      {isOpen && (
        <div
          id="popover-db-health"
          className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className={`p-2 rounded-xl ${isDropOrTimeout ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {isDropOrTimeout ? <AlertTriangle className="w-4 h-4" /> : <Server className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Database Connection Health</h4>
                <p className="text-[11px] text-slate-500">Real-time latency & heartbeat monitor</p>
              </div>
            </div>

            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </span>
          </div>

          {/* Warning Banner if Connection Dropped or Timed Out */}
          {isDropOrTimeout && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold">Database Connection Warning</p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {simulatedDrop
                    ? 'Simulated connection drop active. Live database queries are suspended for testing.'
                    : dbHealth?.message || 'Connection to the active database dropped or timed out. Please check network connectivity or switch database engine.'}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-3 space-y-2.5">
            {/* Active Engine */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Database:</span>
              </span>
              <span className="font-semibold text-slate-800">{engineName}</span>
            </div>

            {/* Real-Time Latency Meter */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Real-time Ping Latency:</span>
                </span>
                <span className={`font-mono font-bold text-sm ${
                  isDropOrTimeout ? 'text-rose-600' : isDegraded ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {isDropOrTimeout ? 'Timed Out (0ms)' : `${latencyMs}ms`}
                </span>
              </div>

              {/* Visual Latency Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isDropOrTimeout
                      ? 'w-full bg-rose-500'
                      : latencyMs <= 150
                      ? 'bg-emerald-500'
                      : latencyMs <= 450
                      ? 'bg-indigo-500'
                      : 'bg-amber-500'
                  }`}
                  style={{
                    width: isDropOrTimeout
                      ? '100%'
                      : `${Math.min(100, Math.max(10, (latencyMs / 600) * 100))}%`
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0ms (Instant)</span>
                <span>200ms (Good)</span>
                <span>450ms+ (Slow)</span>
              </div>
            </div>

            {/* Heartbeat / Last Checked */}
            <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Last heartbeat:</span>
              </span>
              <span className="font-mono">
                {dbHealth?.checkedAt ? new Date(dbHealth.checkedAt).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Test Ping Now */}
              <button
                type="button"
                id="btn-ping-active-db"
                onClick={handleManualPing}
                disabled={isPinging || isCheckingDbHealth}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging || isCheckingDbHealth ? 'animate-spin' : ''}`} />
                <span>{isPinging || isCheckingDbHealth ? 'Measuring...' : 'Ping Live Now'}</span>
              </button>

              {/* Simulate Drop / Warning Icon Test */}
              <button
                type="button"
                id="btn-simulate-db-drop"
                onClick={toggleSimulateDrop}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  simulatedDrop
                    ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Toggle simulated connection drop to verify alert state and warning icon"
              >
                <span className="flex items-center space-x-1">
                  <Radio className="w-3 h-3" />
                  <span>{simulatedDrop ? 'Resume Normal' : 'Simulate Drop'}</span>
                </span>
              </button>
            </div>

            {/* If Admin: Link to Database Settings */}
            {isAdmin && (
              <button
                type="button"
                id="btn-goto-database-settings"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('settings');
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Open Database Settings</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
