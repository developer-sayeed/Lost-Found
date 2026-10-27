import React from 'react';
import { Zap, Sun, Moon, CheckCircle2 } from 'lucide-react';

interface SettingsHeaderProps {
  canAccessHotel: boolean;
  isClearingCache: boolean;
  isSyncing: boolean;
  themeMode: 'light' | 'dark';
  saveSuccess: boolean;
  cacheNotice: string | null;
  onOpenClearCacheModal: () => void;
  onInstantThemeModeChange: (mode: 'light' | 'dark') => void;
  onDismissCacheNotice: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  canAccessHotel,
  isClearingCache,
  isSyncing,
  themeMode,
  saveSuccess,
  cacheNotice,
  onOpenClearCacheModal,
  onInstantThemeModeChange,
  onDismissCacheNotice
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System & Account Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel branding, personal employee profile, password security, and theme appearance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canAccessHotel && (
            <button
              type="button"
              id="btn-clear-system-cache-header"
              onClick={onOpenClearCacheModal}
              disabled={isClearingCache || isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="Purge stale cache and force real-time client synchronization"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 ${isClearingCache ? 'animate-bounce' : ''}`} />
              <span>{isClearingCache ? 'Purging Cache...' : 'Clear System Cache'}</span>
            </button>
          )}

          {/* Quick Dark Mode Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onInstantThemeModeChange('light')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Light Theme"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onInstantThemeModeChange('dark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'dark'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to High-Contrast Dark Theme"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-200" />
              <span>Dark</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved!</span>
            </div>
          )}
        </div>
      </div>

      {cacheNotice && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-medium rounded-xl shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cacheNotice}</span>
          </div>
          <button
            type="button"
            onClick={onDismissCacheNotice}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};
