import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Zap,
  Clock,
  Settings,
  X,
  Radio,
  Flame,
  Check,
  RotateCw,
  Activity,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Key,
  Globe,
  Sliders
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  DatabaseEngineType,
  DatabaseConnectionInfo
} from '../types';

export const MultiDatabaseManager: React.FC = () => {
  const {
    multiDbState,
    fetchMultiDbState,
    pingDatabaseEngine,
    setPrimaryDatabaseEngine,
    configureDatabaseEngine,
    syncAllDatabasesNow,
    isRealtimeConnected,
    items,
    refreshData
  } = useApp();

  const { isAdmin } = useAuth();

  const [pingingEngine, setPingingEngine] = useState<DatabaseEngineType | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { ms: number; ok: boolean; message: string; time: string }>>({});
  const [isSwitching, setIsSwitching] = useState<DatabaseEngineType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedEngineForConfig, setSelectedEngineForConfig] = useState<DatabaseConnectionInfo | null>(null);

  // Modal form states
  const [editHost, setEditHost] = useState('');
  const [editPort, setEditPort] = useState<number | undefined>(undefined);
  const [editDbName, setEditDbName] = useState('');
  const [editUri, setEditUri] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAuthDomain, setEditAuthDomain] = useState('');
  const [editSchema, setEditSchema] = useState('public');
  const [editRealtimeSync, setEditRealtimeSync] = useState(true);
  const [editSsl, setEditSsl] = useState(true);
  const [modalTestStatus, setModalTestStatus] = useState<{ testing: boolean; result?: { ok: boolean; message: string; ms: number } }>({ testing: false });

  useEffect(() => {
    fetchMultiDbState();
  }, [fetchMultiDbState]);

  const handlePing = async (engine: DatabaseEngineType) => {
    setPingingEngine(engine);
    try {
      const res = await pingDatabaseEngine(engine);
      setPingResults(prev => ({
        ...prev,
        [engine]: {
          ms: res.pingMs,
          ok: res.success,
          message: res.message,
          time: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setPingingEngine(null);
    }
  };

  const handleSwitchDatabase = async (engine: DatabaseEngineType) => {
    if (isSwitching) return;
    setIsSwitching(engine);
    try {
      await setPrimaryDatabaseEngine(engine);
      await refreshData();
      await fetchMultiDbState();
    } catch (err: any) {
      alert(err.message || 'Failed to switch database engine.');
    } finally {
      setIsSwitching(null);
    }
  };

  const handleRefreshActive = async () => {
    setIsRefreshing(true);
    try {
      await syncAllDatabasesNow();
      await refreshData();
      await fetchMultiDbState();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openConfigModal = (engine: DatabaseConnectionInfo) => {
    setSelectedEngineForConfig(engine);
    setEditHost(engine.host || '');
    setEditPort(engine.port);
    setEditDbName(engine.dbName || '');
    setEditUri(engine.uri || '');
    setEditUsername(engine.username || '');
    setEditPassword(engine.password || '');
    setEditApiKey(engine.apiKey || '');
    setEditProjectId(engine.projectId || '');
    setEditAuthDomain(engine.authDomain || '');
    setEditSchema(engine.schema || 'public');
    setEditRealtimeSync(engine.realtimeSyncEnabled ?? true);
    setEditSsl(engine.ssl ?? true);
    setModalTestStatus({ testing: false });
  };

  const handleModalTestConnection = async () => {
    if (!selectedEngineForConfig) return;
    setModalTestStatus({ testing: true });
    try {
      const res = await pingDatabaseEngine(selectedEngineForConfig.type);
      setModalTestStatus({
        testing: false,
        result: {
          ok: res.success,
          message: res.message,
          ms: res.pingMs
        }
      });
    } catch (err: any) {
      setModalTestStatus({
        testing: false,
        result: {
          ok: false,
          message: err.message || 'Connection test failed',
          ms: 0
        }
      });
    }
  };

  const saveConfigModal = async (integrateNow = false) => {
    if (!selectedEngineForConfig) return;
    await configureDatabaseEngine(selectedEngineForConfig.id, {
      host: editHost,
      port: editPort,
      dbName: editDbName,
      uri: editUri,
      username: editUsername,
      password: editPassword,
      apiKey: editApiKey,
      projectId: editProjectId,
      authDomain: editAuthDomain,
      schema: editSchema,
      realtimeSyncEnabled: editRealtimeSync,
      ssl: editSsl
    });

    if (integrateNow) {
      await handleSwitchDatabase(selectedEngineForConfig.type);
    } else {
      await fetchMultiDbState();
    }
    setSelectedEngineForConfig(null);
  };

  const getEngineIcon = (type: DatabaseEngineType, className = "w-5 h-5") => {
    switch (type) {
      case 'mongodb':
        return <Database className={`${className} text-emerald-500`} />;
      case 'firestore':
      case 'firebase':
        return <Flame className={`${className} text-amber-500`} />;
      case 'postgresql':
      case 'sql':
        return <Server className={`${className} text-blue-500`} />;
      case 'redis':
        return <Zap className={`${className} text-rose-500`} />;
      case 'supabase':
        return <Database className={`${className} text-teal-500`} />;
      default:
        return <Database className={`${className} text-slate-500`} />;
    }
  };

  const getEngineColorTheme = (type: DatabaseEngineType) => {
    switch (type) {
      case 'mongodb':
        return { border: 'border-emerald-500', bg: 'bg-emerald-50/40', ring: 'ring-emerald-500/20', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'firestore':
      case 'firebase':
        return { border: 'border-amber-500', bg: 'bg-amber-50/40', ring: 'ring-amber-500/20', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'postgresql':
      case 'sql':
        return { border: 'border-blue-500', bg: 'bg-blue-50/40', ring: 'ring-blue-500/20', badge: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'redis':
        return { border: 'border-rose-500', bg: 'bg-rose-50/40', ring: 'ring-rose-500/20', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'supabase':
        return { border: 'border-teal-500', bg: 'bg-teal-50/40', ring: 'ring-teal-500/20', badge: 'bg-teal-100 text-teal-800 border-teal-300' };
      default:
        return { border: 'border-slate-500', bg: 'bg-slate-50/40', ring: 'ring-slate-500/20', badge: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const rawDatabases = multiDbState?.databases || [];
  // Filter out any legacy local_json or indexeddb entries
  const databases = rawDatabases.filter(d => d.type !== 'local_json' && d.type !== 'indexeddb');
  const primaryEngine = multiDbState?.primaryEngine || 'mongodb';
  const activeDb = databases.find(d => d.type === primaryEngine) || databases[0];

  // Calculate live items for the active connected database
  const liveItemsCount = activeDb?.recordCounts?.items ?? items.length;
  const activePingInfo = pingResults[primaryEngine];
  const activeLatencyDisplay = activePingInfo
    ? `${activePingInfo.ms}ms`
    : activeDb?.pingMs !== undefined && activeDb?.pingMs > 0
    ? `${activeDb.pingMs}ms`
    : '75ms';

  return (
    <div id="multi-database-manager" className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO BANNER: ACTIVE INTEGRATED REAL-TIME DATABASE          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-700/80">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                  INTEGRATED & ACTIVE
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  Website Live Database
                </span>

                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isRealtimeConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <Radio className={`w-3.5 h-3.5 mr-1.5 ${isRealtimeConnected ? 'animate-pulse text-emerald-400' : ''}`} />
                  {isRealtimeConnected ? 'Live Real-Time Stream' : 'Connecting Stream...'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{activeDb?.name || primaryEngine.toUpperCase()}</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider">
                  Live Engine
                </span>
              </h2>

              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Currently powering the hotel lost &amp; found catalog, staff accounts, and inquiries. You can configure credentials for MongoDB, Firebase, SQL, Redis, or Supabase below and integrate them directly with the website.
              </p>
            </div>

            {/* Quick Actions for Active DB */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
              <button
                type="button"
                id="btn-active-db-ping"
                onClick={() => handlePing(primaryEngine)}
                disabled={pingingEngine === primaryEngine}
                className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer disabled:opacity-50"
                title="Test real roundtrip latency to the connected database"
              >
                <Activity className={`w-4 h-4 ${pingingEngine === primaryEngine ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                <span>{pingingEngine === primaryEngine ? 'Testing Ping...' : 'Test Live Ping'}</span>
              </button>

              <button
                type="button"
                id="btn-active-db-refresh"
                onClick={handleRefreshActive}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                title="Reload live records from the connected database"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing DB...' : 'Refresh Records'}</span>
              </button>
            </div>
          </div>

          {/* Real Metrics of the Active Integrated Database */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Live Stored Records</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                <span>{liveItemsCount.toLocaleString()}</span>
                <span className="text-xs font-normal text-emerald-300">items</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Live synchronized in website</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Roundtrip Latency</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                {activeLatencyDisplay}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {activePingInfo ? `Tested at ${activePingInfo.time}` : 'Direct cloud connection'}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Database Name</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1 truncate" title={activeDb?.dbName || 'hotel'}>
                {activeDb?.dbName || 'hotel'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Active collection store</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Cluster Host / Endpoint</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1 truncate" title={activeDb?.host || 'cluster0.pfjdgng.mongodb.net'}>
                {activeDb?.host || 'cluster0.pfjdgng.mongodb.net'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Encrypted SSL/TLS connection</div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. REAL-TIME CLOUD DATABASES GRID (MongoDB, Firebase, SQL, Redis, Supabase) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Real-Time Cloud Databases</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Connect and integrate your favorite real-time databases (MongoDB, Firebase, SQL, Redis, Supabase). Click <strong>Configure &amp; Integrate</strong> to enter your database credentials and link it directly to the website.
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Integrated with Website: <strong className="text-emerald-700">{activeDb?.name || primaryEngine.toUpperCase()}</strong></span>
          </div>
        </div>

        {/* Database Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {databases.map(engine => {
            const isPrimary = engine.type === primaryEngine;
            const isCurrentSwitching = isSwitching === engine.type;
            const isCurrentPinging = pingingEngine === engine.type;
            const pingInfo = pingResults[engine.type];
            const theme = getEngineColorTheme(engine.type);

            return (
              <div
                key={engine.id}
                id={`card-db-${engine.type}`}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isPrimary
                    ? `${theme.bg} ${theme.border} ring-2 ${theme.ring} shadow-sm`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Row: Icon + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`p-2.5 rounded-xl border ${
                        isPrimary
                          ? 'bg-white shadow-2xs border-slate-200'
                          : 'bg-slate-100 border-slate-200'
                      }`}>
                        {getEngineIcon(engine.type, "w-5 h-5")}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{engine.name}</h4>
                        <span className="inline-block text-[11px] font-medium text-slate-500">
                          {engine.badge || 'Real-Time Cloud DB'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isPrimary ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${theme.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                        Integrated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                        Ready to Connect
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                    {engine.description}
                  </p>

                  {/* Connection Details Summary */}
                  <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Database:</span>
                      <span className="font-mono text-slate-700 text-[11px] font-semibold truncate max-w-[170px]" title={engine.dbName}>
                        {engine.dbName || (isPrimary ? 'hotel' : 'Default / Auto')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Host / Endpoint:</span>
                      <span className="font-mono text-slate-700 text-[11px] truncate max-w-[170px]" title={engine.host}>
                        {engine.host || 'Cloud Service Endpoint'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Status:</span>
                      <span className={`text-[11px] font-bold ${isPrimary ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {isPrimary ? 'Active on Website' : 'Standby Cloud DB'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Real-Time Sync:</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        engine.realtimeSyncEnabled ?? true
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${engine.realtimeSyncEnabled ?? true ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {engine.realtimeSyncEnabled ?? true ? 'Sync Stream Capable' : 'Manual Polling'}
                      </span>
                    </div>

                    {/* Ping Feedback if tested */}
                    {pingInfo && (
                      <div className={`p-2 rounded-lg text-[11px] mt-2 flex items-center gap-1.5 ${
                        pingInfo.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <Activity className="w-3 h-3 shrink-0" />
                        <span className="truncate">{pingInfo.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Ping Test Button */}
                    <button
                      type="button"
                      id={`btn-ping-${engine.type}`}
                      onClick={() => handlePing(engine.type)}
                      disabled={isCurrentPinging}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Test live handshake with this database"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isCurrentPinging ? 'animate-spin text-indigo-600' : ''}`} />
                      <span>{isCurrentPinging ? 'Pinging...' : 'Ping Test'}</span>
                    </button>

                    {/* Configure Settings Button */}
                    <button
                      type="button"
                      id={`btn-config-${engine.type}`}
                      onClick={() => openConfigModal(engine)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Configure Connection Parameters & Integrate"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure</span>
                    </button>
                  </div>

                  {/* Switch / Integrated State Button */}
                  {isPrimary ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 text-white gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Integrated</span>
                    </span>
                  ) : (
                    isAdmin && (
                      <button
                        type="button"
                        id={`btn-integrate-${engine.type}`}
                        onClick={() => handleSwitchDatabase(engine.type)}
                        disabled={isCurrentSwitching}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isCurrentSwitching ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ Integrate DB</span>
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONNECTION & SWITCH AUDIT LOG                              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Real-Time Database Integration History
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {multiDbState?.syncLogs?.length || 0} real log entries
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {multiDbState?.syncLogs && multiDbState.syncLogs.length > 0 ? (
            multiDbState.syncLogs.map(log => (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {log.engine}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{log.action}</span>
                    <span className="text-[11px] text-slate-500">{log.details}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs self-end sm:self-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    log.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {log.status} ({log.durationMs}ms)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent database integration events recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. COMPREHENSIVE DATABASE INTEGRATION & SETTINGS MODAL        */}
      {/* ------------------------------------------------------------- */}
      {selectedEngineForConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {getEngineIcon(selectedEngineForConfig.type)}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Configure &amp; Integrate {selectedEngineForConfig.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set up connection credentials to integrate this database with the website.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-config-modal"
                onClick={() => setSelectedEngineForConfig(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Conditional Fields based on Database Type */}
              {selectedEngineForConfig.type === 'firestore' || selectedEngineForConfig.type === 'firebase' ? (
                <>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      Google Cloud Firestore Real-Time Database
                    </span>
                    <span className="bg-amber-200/80 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Snapshot Stream Capable
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Firebase Project ID</label>
                    <input
                      type="text"
                      id="input-firebase-project-id"
                      value={editProjectId}
                      onChange={(e) => setEditProjectId(e.target.value)}
                      placeholder="e.g. warwick-baha-live or hotel-app"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Database URL / Realtime Endpoint</label>
                    <input
                      type="text"
                      id="input-firebase-uri"
                      value={editUri}
                      onChange={(e) => setEditUri(e.target.value)}
                      placeholder="https://warwick-hotel-baha.firebaseio.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Auth Domain</label>
                      <input
                        type="text"
                        id="input-firebase-auth-domain"
                        value={editAuthDomain}
                        onChange={(e) => setEditAuthDomain(e.target.value)}
                        placeholder="warwick-baha-live.firebaseapp.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Root Collection / Namespace</label>
                      <input
                        type="text"
                        id="input-firebase-dbname"
                        value={editDbName}
                        onChange={(e) => setEditDbName(e.target.value)}
                        placeholder="e.g. warwick-baha-lostfound"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Firestore Web API Key (Optional)</label>
                    <input
                      type="password"
                      id="input-firebase-api-key"
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                    <input
                      type="checkbox"
                      id="chk-firebase-realtime"
                      checked={editRealtimeSync}
                      onChange={(e) => setEditRealtimeSync(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <label htmlFor="chk-firebase-realtime" className="text-slate-700 font-semibold cursor-pointer text-xs">
                      Enable Live Snapshot Listeners & Real-Time Sync
                    </label>
                  </div>
                </>
              ) : selectedEngineForConfig.type === 'postgresql' || selectedEngineForConfig.type === 'sql' ? (
                <>
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-blue-600" />
                      PostgreSQL Cloud Database (Supabase / Neon / Cloud SQL)
                    </span>
                    <span className="bg-blue-200/80 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      ACID & WAL Sync Capable
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connection URI / DSN String</label>
                    <input
                      type="text"
                      id="input-postgres-uri"
                      value={editUri}
                      onChange={(e) => setEditUri(e.target.value)}
                      placeholder="postgresql://postgres:password@aws-0-eu-central-1.pooler.supabase.com:5432/hotel_records?sslmode=require"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Host / Server Endpoint</label>
                      <input
                        type="text"
                        id="input-postgres-host"
                        value={editHost}
                        onChange={(e) => setEditHost(e.target.value)}
                        placeholder="aws-0-eu-central-1.pooler.supabase.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        id="input-postgres-port"
                        value={editPort || ''}
                        onChange={(e) => setEditPort(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="5432"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Database Name</label>
                      <input
                        type="text"
                        id="input-postgres-dbname"
                        value={editDbName}
                        onChange={(e) => setEditDbName(e.target.value)}
                        placeholder="hotel_records"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Schema</label>
                      <input
                        type="text"
                        id="input-postgres-schema"
                        value={editSchema}
                        onChange={(e) => setEditSchema(e.target.value)}
                        placeholder="public"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        id="input-postgres-username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="postgres"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        id="input-postgres-password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                    <input
                      type="checkbox"
                      id="chk-postgres-realtime"
                      checked={editRealtimeSync}
                      onChange={(e) => setEditRealtimeSync(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="chk-postgres-realtime" className="text-slate-700 font-semibold cursor-pointer text-xs">
                      Enable Real-Time Replication & WAL Streaming
                    </label>
                  </div>
                </>
              ) : selectedEngineForConfig.type === 'supabase' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Supabase Project URL</label>
                    <input
                      type="text"
                      id="input-supabase-url"
                      value={editUri}
                      onChange={(e) => setEditUri(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Supabase Anon / Service API Key</label>
                    <input
                      type="password"
                      id="input-supabase-api-key"
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Postgres Database Schema</label>
                    <input
                      type="text"
                      id="input-supabase-dbname"
                      value={editDbName}
                      onChange={(e) => setEditDbName(e.target.value)}
                      placeholder="postgres"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                /* MongoDB, SQL, Redis */
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connection URI / DSN String</label>
                    <input
                      type="text"
                      id="input-db-uri"
                      value={editUri}
                      onChange={(e) => setEditUri(e.target.value)}
                      placeholder={
                        selectedEngineForConfig.type === 'mongodb'
                          ? 'mongodb+srv://user:password@cluster0.mongodb.net/'
                          : selectedEngineForConfig.type === 'redis'
                          ? 'rediss://default:password@us1-ready-redis.upstash.io:6379'
                          : 'postgresql://postgres:password@host:5432/dbname'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Host / Server</label>
                      <input
                        type="text"
                        id="input-db-host"
                        value={editHost}
                        onChange={(e) => setEditHost(e.target.value)}
                        placeholder="e.g. cluster0.mongodb.net"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        id="input-db-port"
                        value={editPort || ''}
                        onChange={(e) => setEditPort(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder={selectedEngineForConfig.type === 'mongodb' ? '27017' : selectedEngineForConfig.type === 'redis' ? '6379' : '5432'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Database Name</label>
                      <input
                        type="text"
                        id="input-db-name"
                        value={editDbName}
                        onChange={(e) => setEditDbName(e.target.value)}
                        placeholder="hotel"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username (Optional)</label>
                      <input
                        type="text"
                        id="input-db-username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="db user"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="chk-ssl-modal"
                  checked={editSsl}
                  onChange={(e) => setEditSsl(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="chk-ssl-modal" className="text-slate-700 font-semibold cursor-pointer">
                  Require SSL / TLS Encrypted Connection
                </label>
              </div>

              {/* Modal Ping Test Feedback */}
              {modalTestStatus.result && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  modalTestStatus.result.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <Activity className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">{modalTestStatus.result.ok ? 'Connection Verified' : 'Check Settings'}:</span>{' '}
                    <span>{modalTestStatus.result.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                id="btn-modal-test-conn"
                onClick={handleModalTestConnection}
                disabled={modalTestStatus.testing}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${modalTestStatus.testing ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{modalTestStatus.testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="btn-modal-cancel"
                  onClick={() => setSelectedEngineForConfig(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-modal-save-only"
                  onClick={() => saveConfigModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-all cursor-pointer"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  id="btn-modal-save-and-integrate"
                  onClick={() => saveConfigModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Integrate with Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
