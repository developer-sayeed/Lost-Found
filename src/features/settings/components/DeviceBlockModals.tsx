import React from 'react';
import { Ban, AlertTriangle, Unlock } from 'lucide-react';
import { DeviceSession, BlockedDevice } from '../../../types';

interface DeviceBlockModalsProps {
  deviceToBlock: DeviceSession | null;
  setDeviceToBlock: (session: DeviceSession | null) => void;
  blockType: 'temporary' | 'permanent';
  setBlockType: (type: 'temporary' | 'permanent') => void;
  blockDurationHours: number;
  setBlockDurationHours: (hours: number) => void;
  blockReason: string;
  setBlockReason: (reason: string) => void;
  isSubmittingBlock: boolean;
  onConfirmBlockDevice: () => Promise<void>;

  showCustomBlockModal: boolean;
  setShowCustomBlockModal: (show: boolean) => void;
  customBlockIp: string;
  setCustomBlockIp: (ip: string) => void;
  customBlockDeviceId: string;
  setCustomBlockDeviceId: (id: string) => void;
  customBlockUserName: string;
  setCustomBlockUserName: (name: string) => void;

  deviceToUnblock: BlockedDevice | null;
  setDeviceToUnblock: (device: BlockedDevice | null) => void;
  isUnblocking: boolean;
  onConfirmUnblockDevice: (device: BlockedDevice) => Promise<void>;
}

export const DeviceBlockModals: React.FC<DeviceBlockModalsProps> = ({
  deviceToBlock,
  setDeviceToBlock,
  blockType,
  setBlockType,
  blockDurationHours,
  setBlockDurationHours,
  blockReason,
  setBlockReason,
  isSubmittingBlock,
  onConfirmBlockDevice,

  showCustomBlockModal,
  setShowCustomBlockModal,
  customBlockIp,
  setCustomBlockIp,
  customBlockDeviceId,
  setCustomBlockDeviceId,
  customBlockUserName,
  setCustomBlockUserName,

  deviceToUnblock,
  setDeviceToUnblock,
  isUnblocking,
  onConfirmUnblockDevice
}) => {
  return (
    <>
      {/* MODAL 1: Block Active Device (Temporary & Permanent) */}
      {deviceToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 space-y-5 animate-scale-up">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Block Device &amp; Terminal Access
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Prohibit this device from logging in or syncing data. Its current active session will be immediately destroyed.
                </p>
              </div>
            </div>

            {/* Device Info Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#200f24] border border-slate-200 dark:border-fuchsia-900/30 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-fuchsia-300/70 font-semibold">User:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deviceToBlock.userName} ({deviceToBlock.role || 'Staff'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-fuchsia-300/70 font-semibold">IP Address:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-fuchsia-300">{deviceToBlock.ip || '192.168.1.45'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-fuchsia-300/70 font-semibold">Platform:</span>
                <span className="text-slate-700 dark:text-slate-300">{deviceToBlock.deviceType || 'Desktop'} • {deviceToBlock.os || 'Windows'} ({deviceToBlock.browser || 'Chrome'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-fuchsia-300/70 font-semibold">Device ID:</span>
                <code className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{deviceToBlock.deviceId}</code>
              </div>
            </div>

            {/* Block Type Selection */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-white block">Select Block Mode:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    blockType === 'temporary'
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-1 ring-amber-500/20 text-amber-950 dark:text-amber-200'
                      : 'bg-white dark:bg-[#120815] border-slate-200 dark:border-fuchsia-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f0f22]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="blockTypeRadio"
                      checked={blockType === 'temporary'}
                      onChange={() => setBlockType('temporary')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold">⏱️ Temporary Block</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                    Automatically unblocks after specified duration
                  </span>
                </label>

                <label
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    blockType === 'permanent'
                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-1 ring-rose-500/20 text-rose-950 dark:text-rose-200'
                      : 'bg-white dark:bg-[#120815] border-slate-200 dark:border-fuchsia-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f0f22]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="blockTypeRadio"
                      checked={blockType === 'permanent'}
                      onChange={() => setBlockType('permanent')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold">🚫 Permanent Block</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                    Remains blacklisted until admin explicitly unblocks
                  </span>
                </label>
              </div>
            </div>

            {/* Temporary Duration Selector */}
            {blockType === 'temporary' && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-800 dark:text-white block">Block Duration:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: '15 Min', hours: 0.25 },
                    { label: '1 Hour', hours: 1 },
                    { label: '6 Hours', hours: 6 },
                    { label: '24 Hours', hours: 24 },
                    { label: '3 Days', hours: 72 },
                    { label: '7 Days', hours: 168 }
                  ].map(d => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setBlockDurationHours(d.hours)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        blockDurationHours === d.hours
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-[#200f24] hover:bg-slate-200 dark:hover:bg-[#281329] text-slate-700 dark:text-slate-300 border border-transparent dark:border-fuchsia-900/30'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Block Reason */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-white block">Reason for Block:</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[
                  'Suspicious login activity',
                  'Unauthorized staff terminal',
                  'Security policy audit',
                  'Lost or stolen device'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBlockReason(r)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#200f24] hover:bg-slate-200 dark:hover:bg-[#281329] text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-transparent dark:border-fuchsia-900/30 transition-all cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Enter block reason or security note..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p>
                The active session for this terminal will be destroyed immediately and future requests from this device or IP will be rejected with HTTP 403 Forbidden.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeviceToBlock(null)}
                disabled={isSubmittingBlock}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-device"
                onClick={onConfirmBlockDevice}
                disabled={isSubmittingBlock}
                className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Ban className={`w-3.5 h-3.5 ${isSubmittingBlock ? 'animate-spin' : ''}`} />
                <span>{isSubmittingBlock ? 'Blocking Device...' : 'Confirm & Block Device'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Block Custom IP / Device ID */}
      {showCustomBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Block Custom IP or Device Identifier
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Blacklist a specific IP address or terminal hardware ID from accessing the system.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">IP Address to Block:</label>
                <input
                  type="text"
                  value={customBlockIp}
                  onChange={e => setCustomBlockIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or 46.240.73.235"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Device ID (Optional):</label>
                <input
                  type="text"
                  value={customBlockDeviceId}
                  onChange={e => setCustomBlockDeviceId(e.target.value)}
                  placeholder="e.g. dev-suspicious-01"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Staff / Label Description:</label>
                <input
                  type="text"
                  value={customBlockUserName}
                  onChange={e => setCustomBlockUserName(e.target.value)}
                  placeholder="e.g. Unknown Remote Terminal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Block Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockType('temporary')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      blockType === 'temporary'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-[#200f24] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#281329] border border-transparent dark:border-fuchsia-900/30'
                    }`}
                  >
                    ⏱️ Temporary (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType('permanent')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      blockType === 'permanent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-[#200f24] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#281329] border border-transparent dark:border-fuchsia-900/30'
                    }`}
                  >
                    🚫 Permanent
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reason:</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Rogue terminal security block"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/30 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomBlockModal(false)}
                disabled={isSubmittingBlock}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmBlockDevice}
                disabled={isSubmittingBlock || (!customBlockIp && !customBlockDeviceId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBlock ? 'Adding Block...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Unblock Device Confirmation */}
      {deviceToUnblock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unblock Device?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to unblock this terminal? It will regain access to connect and authenticate.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#200f24] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div className="font-bold text-slate-900 dark:text-white">{deviceToUnblock.userName || 'Device'}</div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-fuchsia-300">ID: {deviceToUnblock.deviceId}</div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-fuchsia-300">IP: {deviceToUnblock.ip || 'N/A'}</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeviceToUnblock(null)}
                disabled={isUnblocking}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#251329] rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-unblock-modal"
                onClick={() => onConfirmUnblockDevice(deviceToUnblock)}
                disabled={isUnblocking}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isUnblocking ? 'Unblocking...' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
