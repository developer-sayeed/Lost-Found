import React, { useState, useMemo } from 'react';
import {
  Laptop,
  Ban,
  ShieldCheck,
  Zap,
  RefreshCw,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Smartphone,
  Tablet,
  Search,
  Check,
  Copy,
  LogOut,
  Plus,
  Lock,
  Clock,
  Unlock
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DeviceSession, BlockedDevice } from '../../../types';
import { SecurityActivityTab } from '../../../components/SecurityActivityTab';
import { DeviceBlockModals } from '../components/DeviceBlockModals';

interface ConnectedDevicesTabProps {
  onOpenClearCacheModal: () => void;
}

export const ConnectedDevicesTab: React.FC<ConnectedDevicesTabProps> = ({
  onOpenClearCacheModal
}) => {
  const {
    sessions,
    isLoadingSessions,
    fetchSessions,
    deleteSession,
    blockedDevices,
    isLoadingBlockedDevices,
    fetchBlockedDevices,
    blockDevice,
    unblockDevice,
    isSyncing,
    triggerSettingsSync,
    isClearingCache,
    isSyncPaused,
    simulateOfflineToggle
  } = useApp();

  const [connectedDevicesSubTab, setConnectedDevicesSubTab] = useState<'terminals' | 'blocked_devices' | 'security_activity'>('terminals');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'mobile' | 'desktop' | 'recent'>('all');
  const [deviceSearch, setDeviceSearch] = useState<string>('');

  // Modals state
  const [deviceToBlock, setDeviceToBlock] = useState<DeviceSession | null>(null);
  const [blockType, setBlockType] = useState<'temporary' | 'permanent'>('temporary');
  const [blockDurationHours, setBlockDurationHours] = useState<number>(24);
  const [blockReason, setBlockReason] = useState<string>('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState<boolean>(false);

  const [showCustomBlockModal, setShowCustomBlockModal] = useState<boolean>(false);
  const [customBlockIp, setCustomBlockIp] = useState<string>('');
  const [customBlockDeviceId, setCustomBlockDeviceId] = useState<string>('');
  const [customBlockUserName, setCustomBlockUserName] = useState<string>('');

  const [deviceToUnblock, setDeviceToUnblock] = useState<BlockedDevice | null>(null);
  const [isUnblocking, setIsUnblocking] = useState<boolean>(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [deviceNotice, setDeviceNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sessions calculations
  const valid24hSessions = useMemo(() => {
    const cutoff24h = Date.now() - 24 * 3600 * 1000;
    return sessions.filter(s => {
      if (!s || !s.lastSeen) return false;
      if (s.deviceId === 'dev-desktop-01' || s.deviceId === 'dev-mobile-02' || s.deviceId === 'dev-tablet-03') return false;
      const seenTime = new Date(s.lastSeen).getTime();
      return !isNaN(seenTime) && seenTime > cutoff24h;
    });
  }, [sessions]);

  const onlineSessions = useMemo(() => {
    return valid24hSessions.filter(s => {
      const diffSecs = Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 1000);
      return diffSecs < 180;
    });
  }, [valid24hSessions]);

  const mobileSessions = useMemo(() => {
    return valid24hSessions.filter(s => s.deviceType === 'Mobile');
  }, [valid24hSessions]);

  const desktopSessions = useMemo(() => {
    return valid24hSessions.filter(s => s.deviceType === 'Desktop' || s.deviceType === 'Tablet' || !s.deviceType);
  }, [valid24hSessions]);

  const idleSessions = useMemo(() => {
    return valid24hSessions.filter(s => {
      const diffSecs = Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 1000);
      return diffSecs >= 180;
    });
  }, [valid24hSessions]);

  const displayedSessions = useMemo(() => {
    let list = valid24hSessions;
    if (deviceFilter === 'online') {
      list = onlineSessions;
    } else if (deviceFilter === 'mobile') {
      list = mobileSessions;
    } else if (deviceFilter === 'desktop') {
      list = desktopSessions;
    } else if (deviceFilter === 'recent') {
      list = idleSessions;
    }
    if (deviceSearch.trim()) {
      const q = deviceSearch.toLowerCase().trim();
      list = list.filter(s =>
        (s.userName || '').toLowerCase().includes(q) ||
        (s.userEmail || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.ip || '').toLowerCase().includes(q) ||
        (s.os || '').toLowerCase().includes(q) ||
        (s.browser || '').toLowerCase().includes(q) ||
        (s.deviceId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [valid24hSessions, onlineSessions, mobileSessions, desktopSessions, idleSessions, deviceFilter, deviceSearch]);

  const handleOpenBlockModal = (session: DeviceSession) => {
    setDeviceToBlock(session);
    setBlockType('temporary');
    setBlockDurationHours(24);
    setBlockReason('Suspicious or unauthorized terminal access');
  };

  const handleConfirmBlockDevice = async () => {
    if (!deviceToBlock && !customBlockIp && !customBlockDeviceId) return;
    setIsSubmittingBlock(true);
    try {
      const targetDevId = deviceToBlock?.deviceId || customBlockDeviceId || undefined;
      const targetIp = deviceToBlock?.ip || customBlockIp || undefined;
      const targetUserName = deviceToBlock?.userName || customBlockUserName || undefined;

      const res = await blockDevice({
        deviceId: targetDevId,
        ip: targetIp,
        userName: targetUserName,
        blockType: blockType,
        durationHours: blockType === 'temporary' ? blockDurationHours : undefined,
        reason: blockReason || 'Manual administrator security block'
      });

      if (res) {
        setDeviceNotice({
          message: `Device (${targetUserName || targetDevId || targetIp}) blocked successfully.`,
          type: 'success'
        });
        setDeviceToBlock(null);
        setShowCustomBlockModal(false);
        setCustomBlockIp('');
        setCustomBlockDeviceId('');
        setCustomBlockUserName('');
        await fetchBlockedDevices();
        await fetchSessions();
        setTimeout(() => setDeviceNotice(null), 5000);
      } else {
        setDeviceNotice({
          message: 'Failed to block device',
          type: 'error'
        });
      }
    } catch (err: any) {
      setDeviceNotice({
        message: err.message || 'Error occurred while blocking device',
        type: 'error'
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleConfirmUnblockDevice = async (blocked: BlockedDevice) => {
    setIsUnblocking(true);
    try {
      const res = await unblockDevice({ deviceId: blocked.deviceId, ip: blocked.ip });
      if (res) {
        setDeviceNotice({
          message: `Device (${blocked.userName || blocked.deviceId || blocked.ip}) was unblocked successfully.`,
          type: 'success'
        });
        setDeviceToUnblock(null);
        await fetchBlockedDevices();
        await fetchSessions();
        setTimeout(() => setDeviceNotice(null), 5000);
      } else {
        setDeviceNotice({ message: 'Failed to unblock device', type: 'error' });
      }
    } catch (err: any) {
      setDeviceNotice({ message: err.message || 'Error unblocking device', type: 'error' });
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connected Devices Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#180F1A] p-2.5 rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="btn-subtab-connected-terminals"
            onClick={() => setConnectedDevicesSubTab('terminals')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              connectedDevicesSubTab === 'terminals'
                ? 'btn-primary-gradient text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Active Devices &amp; Terminals</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              connectedDevicesSubTab === 'terminals' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-[#251329] text-slate-700 dark:text-slate-300'
            }`}>
              {valid24hSessions.length}
            </span>
            {onlineSessions.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                {onlineSessions.length} Online Now
              </span>
            )}
          </button>

          <button
            type="button"
            id="btn-subtab-blocked-devices"
            onClick={() => setConnectedDevicesSubTab('blocked_devices')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              connectedDevicesSubTab === 'blocked_devices'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Blocked Devices</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              connectedDevicesSubTab === 'blocked_devices'
                ? 'bg-rose-700 text-white'
                : blockedDevices.length > 0
                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                : 'bg-slate-200 dark:bg-[#251329] text-slate-700 dark:text-slate-300'
            }`}>
              {blockedDevices.length}
            </span>
          </button>

          <button
            type="button"
            id="btn-subtab-security-activity"
            onClick={() => setConnectedDevicesSubTab('security_activity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              connectedDevicesSubTab === 'security_activity'
                ? 'btn-primary-gradient text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Activity</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              connectedDevicesSubTab === 'security_activity' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-[#251329] text-slate-700 dark:text-slate-300'
            }`}>
              Live History
            </span>
          </button>
        </div>

        {connectedDevicesSubTab === 'terminals' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-clear-cache-sync-tab"
              onClick={onOpenClearCacheModal}
              disabled={isClearingCache || isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800/40 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="Purge stale application cache and force real-time client synchronization"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${isClearingCache ? 'animate-bounce' : ''}`} />
              <span>{isClearingCache ? 'Purging Cache...' : 'Clear System Cache'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                fetchSessions();
                fetchBlockedDevices();
              }}
              disabled={isLoadingSessions}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#251329] dark:hover:bg-[#2f1934] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-transparent dark:border-fuchsia-900/30 transition-all cursor-pointer shadow-2xs"
              title="Refresh Connected Devices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              id="btn-simulate-offline-toggle"
              onClick={simulateOfflineToggle}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border shadow-2xs ${
                isSyncPaused
                  ? 'bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#251329] dark:hover:bg-[#2f1934] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-fuchsia-900/30'
              }`}
              title="Toggle simulated offline state to test the network banner & sync pause notification"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>{isSyncPaused ? 'Resume Online' : 'Simulate Offline'}</span>
            </button>
            <button
              type="button"
              id="btn-force-sync"
              onClick={triggerSettingsSync}
              disabled={isSyncing || isSyncPaused}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Device Notice Toast */}
      {deviceNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold animate-fade-in shadow-xs ${
            deviceNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {deviceNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{deviceNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeviceNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Tab 1: Connected Terminals */}
      {connectedDevicesSubTab === 'terminals' && (
        <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active Devices, Live Terminals &amp; Login Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time monitoring of all logged-in devices. Track currently online terminals, inspect hardware and IP data, or block suspicious devices.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomBlockModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block Custom IP / Device</span>
            </button>
          </div>

          {/* Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Online Right Now</span>
                </div>
                <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-1.5 flex items-baseline space-x-2">
                <span>{onlineSessions.length}</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">active terminal{onlineSessions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-1">
                Live heartbeat within last 3 minutes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/20 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Mobiles (24 Hours)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-800/40">24h Logins</span>
              </div>
              <div className="text-2xl font-extrabold text-sky-900 dark:text-sky-300 mt-1.5 flex items-baseline space-x-2">
                <span>{mobileSessions.length}</span>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">mobile device{mobileSessions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-400/80 mt-1">
                Logged in from smartphone within 24h
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#180F1A] border border-slate-200 dark:border-fuchsia-900/30 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Active (24h)
                </div>
                <Laptop className="w-4 h-4 text-slate-400 dark:text-fuchsia-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 flex items-baseline space-x-2">
                <span>{valid24hSessions.length}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">device{valid24hSessions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Real user logins in last 24 hours
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Blocked Devices
                </div>
                <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-300 mt-1.5">
                {blockedDevices.length}
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400/80 mt-1">
                Prohibited from system access
              </div>
            </div>
          </div>

          {/* Filter Controls & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDeviceFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  deviceFilter === 'all'
                    ? 'bg-slate-900 dark:bg-fuchsia-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-[#251329] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#301635] border border-transparent dark:border-fuchsia-900/30'
                }`}
              >
                All Real Logins ({valid24hSessions.length})
              </button>

              <button
                type="button"
                onClick={() => setDeviceFilter('online')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  deviceFilter === 'online'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online Now ({onlineSessions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceFilter('mobile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  deviceFilter === 'mobile'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobiles ({mobileSessions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceFilter('desktop')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  deviceFilter === 'desktop'
                    ? 'bg-indigo-600 dark:bg-fuchsia-600 text-white shadow-2xs'
                    : 'bg-indigo-50 dark:bg-fuchsia-950/30 text-indigo-800 dark:text-fuchsia-300 border border-indigo-200 dark:border-fuchsia-800/40 hover:bg-indigo-100 dark:hover:bg-fuchsia-900/40'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Desktop ({desktopSessions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceFilter('recent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  deviceFilter === 'recent'
                    ? 'bg-slate-900 dark:bg-fuchsia-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-[#251329] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#301635] border border-transparent dark:border-fuchsia-900/30'
                }`}
              >
                Idle ({idleSessions.length})
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
                placeholder="Filter device by user, IP, OS..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
              />
              {deviceSearch && (
                <button
                  type="button"
                  onClick={() => setDeviceSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Terminal Sessions List */}
          <div className="space-y-3 pt-1">
            {isLoadingSessions ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#140c16] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30">
                <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-fuchsia-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Refreshing live connected devices...</p>
              </div>
            ) : displayedSessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#140c16] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 space-y-2">
                <Laptop className="w-8 h-8 text-slate-300 dark:text-fuchsia-400/50 mx-auto" />
                <div className="text-sm font-bold text-slate-700 dark:text-white">No matching connected devices</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deviceFilter === 'online'
                    ? 'No devices currently online in the last 3 minutes.'
                    : deviceFilter === 'mobile'
                    ? 'No mobile smartphone logins recorded in the last 24 hours.'
                    : deviceFilter === 'desktop'
                    ? 'No desktop terminals recorded in the last 24 hours.'
                    : 'No real authenticated login sessions in the last 24 hours match the current criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedSessions.map(session => {
                  const isCurrent = session.isCurrent;
                  const DeviceIcon =
                    session.deviceType === 'Mobile'
                      ? Smartphone
                      : session.deviceType === 'Tablet'
                      ? Tablet
                      : Laptop;

                  const timeSinceSeen = Math.floor(
                    (Date.now() - new Date(session.lastSeen).getTime()) / 1000
                  );
                  const isOnlineNow = timeSinceSeen < 180;

                  return (
                    <div
                      key={session.deviceId}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCurrent
                          ? 'bg-indigo-50/40 dark:bg-[#200f24] border-indigo-200 dark:border-fuchsia-500/30 ring-1 ring-indigo-500/20 dark:ring-fuchsia-500/30'
                          : isOnlineNow
                          ? 'bg-emerald-50/30 dark:bg-[#181a1a] border-emerald-200/80 dark:border-emerald-800/30 hover:bg-emerald-50/50 dark:hover:bg-[#1e2420]'
                          : 'bg-slate-50/80 dark:bg-[#140c16] border-slate-200 dark:border-fuchsia-900/20 hover:bg-slate-50 dark:hover:bg-[#180F1A]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isCurrent
                                ? 'btn-primary-gradient text-white'
                                : isOnlineNow
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-[#251329] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <DeviceIcon className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {session.os || 'Desktop OS'} • {session.browser || 'Web Browser'}
                              </span>

                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-fuchsia-950/50 text-indigo-700 dark:text-fuchsia-300 text-[10px] font-bold rounded-md flex items-center space-x-1 border border-transparent dark:border-fuchsia-800/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Current Device (This Terminal)</span>
                                </span>
                              )}

                              {isOnlineNow ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                                  Online Now
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#251329] px-2 py-0.5 rounded-md border border-transparent dark:border-fuchsia-900/20">
                                  Idle ({Math.floor(timeSinceSeen / 60)}m ago)
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2">
                              <span>Session: <code className="font-mono text-slate-700 dark:text-fuchsia-300 font-bold">{session.deviceId}</code></span>
                              <span>•</span>
                              <span>Last Seen: {new Date(session.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          {!isCurrent ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenBlockModal(session)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 hover:text-rose-800 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 transition-all shadow-2xs cursor-pointer"
                                title="Block this device temporarily or permanently"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Block Device</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteSession(session.deviceId)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#251329] dark:hover:bg-[#2f1934] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-fuchsia-900/30 transition-all shadow-2xs cursor-pointer"
                                title="Terminate remote session"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Terminate</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-indigo-700 dark:text-fuchsia-300 bg-indigo-50 dark:bg-fuchsia-950/40 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-fuchsia-800/40">
                              Protected Active Terminal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full Login Device Information Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-fuchsia-900/30 text-xs">
                        {/* Logged in User */}
                        <div className="bg-white/80 dark:bg-[#1c0f20] p-2.5 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#2a1330] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-fuchsia-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {(session.userName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-fuchsia-300/70 block">Logged-in User</span>
                            <span className="font-bold text-slate-800 dark:text-white truncate block text-xs">
                              {session.userName || 'Unknown Staff'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize block">
                              {session.role || 'Staff'} {session.userEmail ? `• ${session.userEmail}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* IP Address */}
                        <div className="bg-white/80 dark:bg-[#1c0f20] p-2.5 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-fuchsia-300/70 block">IP Address</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-white text-xs truncate">
                              {session.ip || '192.168.1.45'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyClipboard(session.ip || '192.168.1.45')}
                              className="p-1 rounded text-slate-400 hover:text-fuchsia-500 hover:bg-slate-100 dark:hover:bg-[#251329] cursor-pointer"
                              title="Copy IP"
                            >
                              {copiedText === (session.ip || '192.168.1.45') ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block">Local / Network Terminal</span>
                        </div>

                        {/* Device Type & Platform */}
                        <div className="bg-white/80 dark:bg-[#1c0f20] p-2.5 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-fuchsia-300/70 block">Hardware &amp; Platform</span>
                          <span className="font-bold text-slate-800 dark:text-white truncate block text-xs mt-0.5">
                            {session.deviceType || 'Desktop'} ({session.os || 'Windows'})
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                            {session.browser || 'Google Chrome'}
                          </span>
                        </div>

                        {/* Connection & Device ID */}
                        <div className="bg-white/80 dark:bg-[#1c0f20] p-2.5 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-fuchsia-300/70 block">Device Identifier</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px] truncate">
                              {session.deviceId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyClipboard(session.deviceId)}
                              className="p-1 rounded text-slate-400 hover:text-fuchsia-500 hover:bg-slate-100 dark:hover:bg-[#251329] cursor-pointer"
                              title="Copy Device ID"
                            >
                              {copiedText === session.deviceId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate">
                            First active: {new Date(session.lastSeen).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Blocked Devices */}
      {connectedDevicesSubTab === 'blocked_devices' && (
        <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Blacklisted &amp; Blocked Terminals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prohibited hardware terminals and IPs. Blocked devices receive HTTP 403 Forbidden and cannot access or sync system data.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomBlockModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block Rule</span>
            </button>
          </div>

          {isLoadingBlockedDevices ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-[#140c16] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30">
              <RefreshCw className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading blocked devices...</p>
            </div>
          ) : blockedDevices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-[#140c16] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 space-y-2">
              <Ban className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-white">No blocked devices</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All authorized staff terminals have valid operational access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedDevices.map((blocked, idx) => {
                const isPermanent = blocked.blockType === 'permanent' || !blocked.blockedUntil;
                const remainingHours = blocked.blockedUntil
                  ? Math.max(0, Math.round((new Date(blocked.blockedUntil).getTime() - Date.now()) / (3600 * 1000)))
                  : 0;
                const remainingMins = blocked.blockedUntil
                  ? Math.max(0, Math.round((new Date(blocked.blockedUntil).getTime() - Date.now()) / (60 * 1000)))
                  : 0;

                return (
                  <div
                    key={blocked.deviceId || blocked.ip || idx}
                    className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                          <Ban className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {blocked.userName || 'Unknown Staff'}
                            </span>

                            {isPermanent ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/40 flex items-center space-x-1">
                                <Lock className="w-3 h-3" />
                                <span>Permanent Block</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/40 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Temporary Block ({remainingHours > 1 ? `${remainingHours}h remaining` : `${remainingMins}m remaining`})
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2">
                            <span>Device: <code className="font-mono font-bold text-slate-800 dark:text-fuchsia-300">{blocked.deviceId}</code></span>
                            <span>•</span>
                            <span>IP: <code className="font-mono font-bold text-slate-800 dark:text-fuchsia-300">{blocked.ip || 'All IPs'}</code></span>
                            <span>•</span>
                            <span>Platform: {blocked.deviceType || 'Desktop'} ({blocked.os || 'OS'})</span>
                          </div>

                          <div className="text-xs text-rose-800 dark:text-rose-400 font-medium mt-1">
                            Reason: {blocked.reason || 'Security policy enforcement'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setDeviceToUnblock(blocked)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unblock Device</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Blocked By: <strong>{blocked.blockedBy}</strong> ({blocked.blockedByRole || 'Super Admin'})</span>
                      <span>Blocked At: {new Date(blocked.blockedAt).toLocaleString()}</span>
                      {blocked.blockedUntil && (
                        <span>Expires: {new Date(blocked.blockedUntil).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Security Activity History */}
      {connectedDevicesSubTab === 'security_activity' && (
        <SecurityActivityTab />
      )}

      {/* Device Block & Unblock Modals */}
      <DeviceBlockModals
        deviceToBlock={deviceToBlock}
        setDeviceToBlock={setDeviceToBlock}
        blockType={blockType}
        setBlockType={setBlockType}
        blockDurationHours={blockDurationHours}
        setBlockDurationHours={setBlockDurationHours}
        blockReason={blockReason}
        setBlockReason={setBlockReason}
        isSubmittingBlock={isSubmittingBlock}
        onConfirmBlockDevice={handleConfirmBlockDevice}

        showCustomBlockModal={showCustomBlockModal}
        setShowCustomBlockModal={setShowCustomBlockModal}
        customBlockIp={customBlockIp}
        setCustomBlockIp={setCustomBlockIp}
        customBlockDeviceId={customBlockDeviceId}
        setCustomBlockDeviceId={setCustomBlockDeviceId}
        customBlockUserName={customBlockUserName}
        setCustomBlockUserName={setCustomBlockUserName}

        deviceToUnblock={deviceToUnblock}
        setDeviceToUnblock={setDeviceToUnblock}
        isUnblocking={isUnblocking}
        onConfirmUnblockDevice={handleConfirmUnblockDevice}
      />
    </div>
  );
};
