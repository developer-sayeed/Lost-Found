import React from 'react';
import {
  Building,
  Shield,
  KeyRound,
  Database,
  Cloud,
  FileSpreadsheet,
  Laptop,
  Tags,
  Bell,
  LogIn,
  Keyboard
} from 'lucide-react';
import { SettingsTab } from '../types/settings.feature.types';

interface SettingsNavTabsProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  canAccessHotel: boolean;
  isSuperAdmin: boolean;
  mongoConnected: boolean;
  googleDriveAutoBackupEnabled?: boolean;
  sessionsCount: number;
}

export const SettingsNavTabs: React.FC<SettingsNavTabsProps> = ({
  activeTab,
  setActiveTab,
  canAccessHotel,
  isSuperAdmin,
  mongoConnected,
  googleDriveAutoBackupEnabled,
  sessionsCount
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-fuchsia-900/30 pb-3 transition-colors">
      {canAccessHotel && (
        <button
          type="button"
          onClick={() => setActiveTab('hotel')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'hotel'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Hotel Information</span>
        </button>
      )}

      {canAccessHotel && (
        <button
          type="button"
          id="btn-settings-tab-certificate"
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'certificate'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Certificate Settings</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            5-Star
          </span>
        </button>
      )}

      {canAccessHotel && (
        <button
          type="button"
          id="btn-settings-tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Tags className="w-3.5 h-3.5" />
          <span>Item Categories &amp; Policy</span>
        </button>
      )}

      <button
        type="button"
        id="btn-settings-tab-security"
        onClick={() => setActiveTab('security')}
        className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
          activeTab === 'security'
            ? 'btn-primary-gradient !text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>Password &amp; Security</span>
      </button>

      {canAccessHotel && (
        <button
          type="button"
          id="btn-settings-tab-alerts"
          onClick={() => setActiveTab('alerts_validation')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'alerts_validation'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts &amp; Disclaimers</span>
        </button>
      )}

      {canAccessHotel && (
        <button
          type="button"
          id="btn-settings-tab-login-page"
          onClick={() => setActiveTab('login_page')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'login_page'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Login Page Customizer</span>
        </button>
      )}

      <button
        type="button"
        id="btn-settings-tab-shortcuts"
        onClick={() => setActiveTab('shortcuts')}
        className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
          activeTab === 'shortcuts'
            ? 'btn-primary-gradient !text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>Keyboard Shortcuts</span>
      </button>

      {isSuperAdmin && (
        <button
          type="button"
          id="btn-settings-tab-database"
          onClick={() => setActiveTab('database')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>MongoDB Atlas Database</span>
          <span className={`w-2 h-2 rounded-full ${mongoConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
        </button>
      )}

      {(isSuperAdmin || canAccessHotel) && (
        <button
          type="button"
          id="btn-settings-tab-google-drive"
          onClick={() => setActiveTab('google_drive')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'google_drive'
              ? 'btn-primary-gradient !text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-blue-300" />
          <span>Google Drive Backup</span>
          {googleDriveAutoBackupEnabled ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
          )}
        </button>
      )}

      {isSuperAdmin && (
        <>
          <button
            type="button"
            onClick={() => setActiveTab('import_data')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'import_data'
                ? 'btn-primary-gradient !text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Data Import &amp; Export</span>
          </button>

          <button
            type="button"
            id="btn-settings-tab-connected-devices"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'btn-primary-gradient !text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#251329] hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Connected Devices</span>
            {sessionsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'sync'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-fuchsia-950/70 text-slate-700 dark:text-fuchsia-300 border border-slate-300/80 dark:border-fuchsia-800/50'
              }`}>
                {sessionsCount}
              </span>
            )}
          </button>
        </>
      )}
    </div>
  );
};
