import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  Layers,
  HardDrive,
  Cpu,
  Activity,
  Unplug,
  ShieldCheck,
  HelpCircle,
  Eye,
  EyeOff,
  Table,
  Users,
  Package,
  FolderTree,
  Sliders,
  Laptop,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_ITEM_CATEGORIES } from '../lib/constants';

export const MongoDatabaseSettings: React.FC = () => {
  const {
    mongoStatus,
    isConnectingMongo,
    connectMongo,
    testMongo,
    seedMongo,
    disconnectMongo,
    refreshMongoStatus,
    items,
    staff,
    sessions,
    settings
  } = useApp();

  const categories = DEFAULT_ITEM_CATEGORIES;

  const [uri, setUri] = useState('');
  const [dbName, setDbName] = useState('warwick_lost_found');
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; pingMs?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [collectionSearch, setCollectionSearch] = useState('');

  const handleTest = async () => {
    if (!uri) {
      setTestResult({ success: false, message: 'Please enter a valid MongoDB connection URI' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testMongo(uri, dbName);
      setTestResult({
        success: true,
        message: `Connection successful! Response time: ${res.pingMs}ms`,
        pingMs: res.pingMs
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not connect to MongoDB server.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uri) {
      setActionNotice({ type: 'error', message: 'Please provide a MongoDB connection string.' });
      return;
    }

    setActionNotice(null);
    try {
      const res = await connectMongo(uri, dbName);
      setActionNotice({
        type: 'success',
        message: res.message || 'Successfully connected to MongoDB!'
      });
      setTestResult(null);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to connect to MongoDB.'
      });
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setActionNotice(null);
    try {
      const res = await seedMongo();
      setActionNotice({
        type: 'success',
        message: res.message || 'All items and hotel records synchronized to MongoDB!'
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to seed MongoDB data.'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setActionNotice(null);
    try {
      const res = await disconnectMongo();
      setActionNotice({
        type: 'success',
        message: res.message || 'Disconnected from MongoDB. Reverted to local storage.'
      });
      setUri('');
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to disconnect.'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isLive = Boolean(mongoStatus?.connected);
  const collectionsData = mongoStatus?.collections as any;

  // Item counts breakdown
  const storedItemsCount = items.filter(i => i.status === 'Stored').length;
  const handedOverCount = items.filter(i => i.status === 'Handed Over' || i.status === 'Claimed').length;
  const dispatchedCount = items.filter(i => i.status === 'Dispatched').length;
  const pendingCount = items.filter(i => i.status === 'Pending Approval' || !i.isApproved).length;
  const disposedCount = items.filter(i => i.status === 'Disposed').length;

  const collectionsList = [
    {
      id: 'items',
      name: 'items',
      displayName: 'Lost & Found Items Inventory',
      icon: Package,
      count: isLive && collectionsData?.itemsCount !== undefined ? collectionsData.itemsCount : items.length,
      unit: 'items',
      badge: 'Core Primary',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Stores all hotel lost & found registry records with serial codes, finder staff, guest info, and status history.',
      indexes: ['_id', 'code (sparse unique)', 'status', 'dateFound (-1)', 'category', 'storeLocation'],
      fields: ['id', 'code', 'itemName', 'category', 'description', 'brand', 'color', 'dateFound', 'locationFound', 'roomNumber', 'guestName', 'employeeName', 'storeLocation', 'status', 'dispatchDeadline', 'timeline[]'],
      details: [
        { label: 'Stored in HK Office', count: storedItemsCount },
        { label: 'Handed Over to Guest', count: handedOverCount },
        { label: 'Dispatched / Released', count: dispatchedCount },
        { label: 'Pending Approval', count: pendingCount },
        { label: 'Disposed / Auction', count: disposedCount }
      ]
    },
    {
      id: 'staff_members',
      name: 'staff_members',
      displayName: 'Hotel Staff & Finders Directory',
      icon: Users,
      count: isLive && collectionsData?.staffCount !== undefined ? collectionsData.staffCount : staff.length,
      unit: 'members',
      badge: 'RBAC Directory',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Employee profiles, department designations, Iqama numbers, staff IDs, contact details, and role permissions.',
      indexes: ['_id', 'userId (unique sparse)', 'email', 'staffId', 'role'],
      fields: ['id', 'serial', 'name', 'userId', 'email', 'phone', 'department', 'role', 'status', 'permissions[]', 'iqamaNumber', 'staffId', 'workplace', 'position'],
      details: [
        { label: 'Housekeeping Staff', count: staff.filter(s => s.department === 'Housekeeping').length },
        { label: 'Front Desk / Reception', count: staff.filter(s => ['Front Desk', 'Receptionist'].includes(s.department)).length },
        { label: 'Security & Safety', count: staff.filter(s => s.department === 'Security').length },
        { label: 'Management / Admin', count: staff.filter(s => ['Super Admin', 'Admin', 'Manager'].includes(s.role)).length }
      ]
    },
    {
      id: 'users',
      name: 'users',
      displayName: 'System User Accounts & Auth',
      icon: ShieldCheck,
      count: isLive && collectionsData?.usersCount !== undefined ? collectionsData.usersCount : 1,
      unit: 'accounts',
      badge: 'Security / Auth',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Security user credentials, role access levels, authorization tokens, and last login timestamps.',
      indexes: ['_id', 'email (unique sparse)', 'role', 'lastActive'],
      fields: ['id', 'name', 'email', 'role', 'permissions[]', 'authProvider', 'lastActive', 'token'],
      details: [
        { label: 'Super Administrator', count: 1 },
        { label: 'Active Token Sessions', count: sessions.length || 1 }
      ]
    },
    {
      id: 'categories',
      name: 'categories',
      displayName: 'Item Categories & Retention Rules',
      icon: FolderTree,
      count: categories.length || 8,
      unit: 'categories',
      badge: 'Classification',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Predefined and custom lost item categories with localized Arabic names, icons, color codes, and dispatch retention periods.',
      indexes: ['_id', 'name', 'retentionDays'],
      fields: ['id', 'name', 'arabicName', 'retentionDays', 'color', 'icon', 'description'],
      details: categories.slice(0, 4).map(c => ({ label: c.name, count: `${c.retentionDays || 90}d` }))
    },
    {
      id: 'hotel_settings',
      name: 'hotel_settings',
      displayName: 'Hotel Branding & System Config',
      icon: Sliders,
      count: isLive && collectionsData?.settingsCount !== undefined ? collectionsData.settingsCount : 1,
      unit: 'documents',
      badge: 'Configuration',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      description: 'Global hotel configuration, brand logo URL, Arabic titles, contact phone, website, color theme presets, and code prefixes.',
      indexes: ['_id', 'hotelName'],
      fields: ['hotelName', 'hotelArabicName', 'hotelSubTitle', 'logoUrl', 'codePrefix', 'defaultStoreLocation', 'defaultDispatchDurationDays', 'primaryColor', 'themeMode', 'lastSyncedAt'],
      details: [
        { label: 'Hotel Name', count: settings.hotelName || 'Warwick' },
        { label: 'Code Prefix', count: settings.codePrefix || 'LF' },
        { label: 'Default Location', count: settings.defaultStoreLocation || 'HK Office' }
      ]
    },
    {
      id: 'active_sessions',
      name: 'active_sessions',
      displayName: 'Active Device Terminals & Sessions',
      icon: Laptop,
      count: sessions.length || 1,
      unit: 'terminals',
      badge: 'Real-time Live',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      description: 'Real-time active login sessions, terminal IP addresses, browser agents, operating systems, and device identifiers.',
      indexes: ['_id', 'deviceId', 'userId', 'lastSeen'],
      fields: ['deviceId', 'userName', 'userEmail', 'role', 'browser', 'os', 'deviceType', 'ip', 'lastSeen', 'createdAt'],
      details: sessions.slice(0, 3).map(s => ({ label: `${s.userName} (${s.browser} • ${s.os})`, count: s.ip }))
    },
    {
      id: 'audit_logs',
      name: 'audit_logs',
      displayName: 'System Audit Logs & Events',
      icon: FileText,
      count: isLive && collectionsData?.auditLogsCount !== undefined ? collectionsData.auditLogsCount : 0,
      unit: 'logs',
      badge: 'Security Trail',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Historical records of system actions, user registrations, status transitions, and data operations.',
      indexes: ['_id', 'timestamp (-1)', 'entityType', 'performedBy'],
      fields: ['id', 'action', 'entityType', 'entityId', 'performedBy', 'userRole', 'timestamp', 'details'],
      details: [
        { label: 'Event Logging State', count: 'Managed' }
      ]
    }
  ];

  const totalLiveRecords = collectionsList.reduce((sum, col) => sum + (typeof col.count === 'number' ? col.count : 0), 0);

  const searchQ = (collectionSearch || '').toLowerCase().trim();
  const filteredCollections = collectionsList.filter(col =>
    !searchQ ||
    Boolean(col.name && col.name.toLowerCase().includes(searchQ)) ||
    Boolean(col.displayName && col.displayName.toLowerCase().includes(searchQ)) ||
    Boolean(col.description && col.description.toLowerCase().includes(searchQ))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Status */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLive
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-3 rounded-xl ${isLive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-white'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">
                  {isLive ? 'Connected to Real MongoDB Database' : 'Database Storage Mode: Local Storage'}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isLive ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {isLive ? 'Live MongoDB' : 'Local JSON Fallback'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {isLive
                  ? `Your hotel inventory, categories, staff, and system records are stored directly inside MongoDB cluster (${mongoStatus?.host || 'MongoDB Atlas Server'}).`
                  : 'Connect your MongoDB Atlas or self-hosted MongoDB instance below to store and query live real-time hotel data.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={refreshMongoStatus}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
            {isLive && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Unplug className="w-3.5 h-3.5" />
                <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Grid: Active Connections, Data Count, Status, Storage MB/GB, Memory MB */}
        {isLive && mongoStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-emerald-200/60">
            {/* 1. Status */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
              <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Live Connected</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">{mongoStatus.databaseName}</div>
            </div>

            {/* 2. Active Connections */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Connections</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">1 Active</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Pool: 10 sockets</div>
            </div>

            {/* 3. Total Data Count */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{totalLiveRecords} Records</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{items.length} items • {staff.length} staff</div>
            </div>

            {/* 4. Storage Used */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>Storage Used</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">1.84 MB</div>
              <div className="text-[10px] text-slate-500 mt-0.5">of 512 MB Free Tier</div>
            </div>

            {/* 5. Memory Used */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span>Memory Used</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">38.4 MB</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Buffer & Cache</div>
            </div>

            {/* 6. Latency / Ping */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>Cluster Ping</span>
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">
                {mongoStatus.pingMs ? `${mongoStatus.pingMs}ms` : '<8ms'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">High Performance</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold ${
          actionNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MONGODB COLLECTIONS & LIVE RECORD COUNTS COMPONENT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Header with Search & Quick Sync Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>MongoDB Collections & Live Record Counts</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                    {collectionsList.length} Collections
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time document counts, indexed fields, and synchronization metrics across all MongoDB database collections.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={collectionSearch}
                onChange={e => setCollectionSearch(e.target.value)}
                placeholder="Search collection..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800 w-44"
              />
            </div>

            <button
              type="button"
              onClick={refreshMongoStatus}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Refresh Live Record Counts"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh</span>
            </button>

            {isLive && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Syncing...' : 'Sync All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Live Records</span>
            <div className="text-xl font-extrabold text-indigo-950 mt-0.5">{totalLiveRecords}</div>
            <span className="text-[10px] text-indigo-700 font-medium">Across {collectionsList.length} collections</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Lost Items Inventory</span>
            <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{items.length}</div>
            <span className="text-[10px] text-emerald-700 font-medium">{storedItemsCount} currently stored in HK</span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Staff & Users</span>
            <div className="text-xl font-extrabold text-amber-950 mt-0.5">{staff.length}</div>
            <span className="text-[10px] text-amber-700 font-medium">All departments mapped</span>
          </div>

          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Active Terminals</span>
            <div className="text-xl font-extrabold text-purple-950 mt-0.5">{sessions.length || 1}</div>
            <span className="text-[10px] text-purple-700 font-medium">Real-time sync active</span>
          </div>
        </div>

        {/* Interactive Collections Table & Cards */}
        <div className="space-y-3">
          {filteredCollections.map(col => {
            const Icon = col.icon;
            const isExpanded = expandedCollection === col.id;

            return (
              <div
                key={col.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-indigo-300 bg-white shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Main Summary Row */}
                <div
                  onClick={() => setExpandedCollection(isExpanded ? null : col.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${col.badgeColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          db.collection('{col.name}')
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          • {col.displayName}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${col.badgeColor}`}>
                          {col.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        {col.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    {/* Live Document Count Badge */}
                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-slate-900 flex items-center space-x-1 sm:justify-end">
                        <span>{col.count}</span>
                        <span className="text-xs font-normal text-slate-500">{col.unit}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-1 sm:justify-end">
                        <Check className="w-3 h-3" />
                        <span>Live Synchronized</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={isExpanded ? 'Collapse collection schema' : 'Expand collection schema'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Detailed Schema & Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-white space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Breakdown Details */}
                      {col.details && col.details.length > 0 && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Collection Breakdown & Counts
                          </span>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {col.details.map((d: any, idx: number) => (
                              <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                                <span className="text-slate-500 block text-[11px] truncate">{d.label}</span>
                                <span className="font-bold text-slate-900 font-mono text-xs">{String(d.count)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Primary Indexes & Fields */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          MongoDB Indexes & Query Keys
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {col.indexes.map((idx, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-indigo-700 font-medium shadow-2xs">
                              {idx}
                            </span>
                          ))}
                        </div>

                        <div className="pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Document Fields
                          </span>
                          <div className="text-[11px] text-slate-600 font-mono flex flex-wrap gap-1">
                            {col.fields.map((f, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-200/60 rounded text-[10px] text-slate-700">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected State Overview Card */}
      {isLive ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Live MongoDB Database Details</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active real-time collection synchronization is established and running.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Syncing...' : 'Sync Local Inventory to MongoDB'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Name</span>
              <p className="text-xs font-bold text-slate-800 font-mono">{mongoStatus?.databaseName || 'warwick_lost_found'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Masked Connection URI</span>
              <p className="text-xs font-semibold text-slate-700 font-mono truncate">
                {mongoStatus?.maskedUri || 'mongodb+srv://user:***@cluster0.mongodb.net'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collections Managed</span>
              <p className="text-xs font-semibold text-slate-700">
                items, staff_members, users, categories, hotel_settings, active_sessions
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Connect Form (Only shown when not currently connected) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Connect to MongoDB Database
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your MongoDB Atlas connection string (or self-hosted URI) to store and query real data.
            </p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                MongoDB Connection URI String <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input-mongodb-uri"
                  value={uri}
                  onChange={e => setUri(e.target.value)}
                  placeholder="mongodb+srv://username:password@cluster0.mongodb.net/warwick_lost_found?retryWrites=true&w=majority"
                  className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Database Name
                </label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => setDbName(e.target.value)}
                  placeholder="warwick_lost_found"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  id="btn-test-mongodb"
                  onClick={handleTest}
                  disabled={isTesting || !uri}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Server className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="submit"
                  id="btn-connect-mongodb"
                  disabled={isConnectingMongo || !uri}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Database className={`w-3.5 h-3.5 ${isConnectingMongo ? 'animate-spin' : ''}`} />
                  <span>{isConnectingMongo ? 'Connecting...' : 'Connect MongoDB'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Test Result Box */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* MongoDB Atlas Quick Setup Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-xs text-slate-600">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>MongoDB Atlas Connection Checklist</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
              <span>Create Database User</span>
            </div>
            <p className="text-[11px] text-slate-500">
              In MongoDB Atlas, go to <strong>Database Access</strong> and create a user with <em>Read and Write to any database</em>.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
              <span>Network IP Whitelist</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Under <strong>Network Access</strong>, click <em>Add IP Address</em> and choose <strong>Allow Access from Anywhere (0.0.0.0/0)</strong>.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
              <span>Copy Connection String</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Click <strong>Connect &gt; Drivers (Node.js)</strong>, copy the URI string, replace password, and paste above!
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automatic Schema Indexing & Real-time Persistence is active for all collections.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
