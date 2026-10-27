import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Server, Cloud, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsSkeleton } from '../../components/common/Skeleton';
import { MongoDatabaseSettings } from '../../components/MongoDatabaseSettings';
import { GoogleDriveBackupManager } from '../../components/GoogleDriveBackupManager';
import { CategorySettings } from '../../components/CategorySettings';
import { DataImportExportSettings } from '../../components/DataImportExportSettings';
import { AlertsValidationSettings } from '../../components/AlertsValidationSettings';
import { LoginPageCustomizer } from '../../components/LoginPageCustomizer';
import { KeyboardShortcutsSettings } from '../../components/KeyboardShortcutsSettings';
import { CertificateSettingsTab } from '../../components/certificates/CertificateSettingsTab';

import { SettingsHeader } from './components/SettingsHeader';
import { SettingsNavTabs } from './components/SettingsNavTabs';
import { SecurityTab } from './tabs/SecurityTab';
import { HotelInformationTab } from './tabs/HotelInformationTab';
import { ConnectedDevicesTab } from './tabs/ConnectedDevicesTab';
import { SettingsTab } from './types/settings.feature.types';

export interface SettingsViewProps {
  initialTab?: SettingsTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab }) => {
  const {
    settings,
    updateSettings,
    isSyncing,
    isClearingCache,
    clearSystemCache,
    items,
    mongoStatus,
    sessions,
    isLoading
  } = useApp();
  const { user, hasPermission, previewRole, effectiveRole } = useAuth();

  const currentRole = effectiveRole || user?.role || '';
  const isMasterAdmin = (currentRole === 'Super Admin') && !previewRole;
  const isSuperAdmin = currentRole === 'Super Admin';
  const isManager = ['Manager', 'Admin', 'Super Admin'].includes(currentRole);
  const canAccessHotel = isMasterAdmin || hasPermission('settings') || hasPermission('manage_staff_access');

  const navigate = useNavigate();
  const { subTab: urlSubTab } = useParams<{ subTab?: string }>();

  const tabSlugMap: Record<string, SettingsTab> = {
    'hotel': 'hotel',
    'hotel-information': 'hotel',
    'certificate': 'certificate',
    'logo': 'certificate',
    'categories': 'categories',
    'security': 'security',
    'password': 'security',
    'database': 'database',
    'databases': 'database',
    'google-drive': 'google_drive',
    'google_drive': 'google_drive',
    'sync': 'sync',
    'connected-devices': 'sync',
    'import': 'import_data',
    'import-data': 'import_data',
    'alerts': 'alerts_validation',
    'alerts-validation': 'alerts_validation',
    'login': 'login_page',
    'login-page': 'login_page',
    'shortcuts': 'shortcuts'
  };

  const getTabFromUrl = (sub?: string) => {
    if (!sub) return null;
    return tabSlugMap[sub.toLowerCase()] || null;
  };

  const [activeTab, setActiveTabState] = useState<SettingsTab>(() => {
    const fromUrl = getTabFromUrl(urlSubTab);
    if (fromUrl) return fromUrl;
    if (initialTab && initialTab !== ('theme' as any)) return initialTab;
    return canAccessHotel ? 'hotel' : 'security';
  });

  const setActiveTab = (newTab: SettingsTab) => {
    setActiveTabState(newTab);
    const slug = newTab.replace('_', '-');
    navigate(`/settings/${slug}`, { replace: true });
  };

  useEffect(() => {
    const resolved = getTabFromUrl(urlSubTab);
    if (resolved && resolved !== activeTab) {
      setActiveTabState(resolved);
    }
  }, [urlSubTab]);

  useEffect(() => {
    if (initialTab && !urlSubTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab, urlSubTab]);

  const [databaseSubTab, setDatabaseSubTab] = useState<'mongodb' | 'gdrive'>('mongodb');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (settings.themeMode) return settings.themeMode;
    return settings.isDarkMode ? 'dark' : 'light';
  });

  useEffect(() => {
    setThemeMode(settings.themeMode === 'dark' || settings.isDarkMode ? 'dark' : 'light');
  }, [settings.themeMode, settings.isDarkMode]);

  const handleInstantThemeModeChange = async (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    const darkEnabled = mode === 'dark';
    await updateSettings({
      themeMode: mode,
      isDarkMode: darkEnabled
    });
  };

  const handleClearCache = async () => {
    try {
      const res = await clearSystemCache();
      setCacheNotice(res.message || 'System cache purged and all clients updated!');
      setShowClearCacheModal(false);
      setTimeout(() => setCacheNotice(null), 6000);
    } catch (err: any) {
      setCacheNotice(err.message || 'Failed to clear system cache');
      setTimeout(() => setCacheNotice(null), 6000);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      if (isManager && !['hotel', 'certificate', 'security', 'alerts_validation', 'categories', 'login_page', 'shortcuts', 'database', 'google_drive'].includes(activeTab)) {
        setActiveTab('hotel');
      } else if (!isManager && !['hotel', 'certificate', 'security', 'shortcuts'].includes(activeTab)) {
        setActiveTab(canAccessHotel ? 'hotel' : 'shortcuts');
      }
    }
  }, [isSuperAdmin, isManager, canAccessHotel, activeTab]);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Top Header */}
      <SettingsHeader
        canAccessHotel={canAccessHotel}
        isClearingCache={isClearingCache}
        isSyncing={isSyncing}
        themeMode={themeMode}
        saveSuccess={saveSuccess}
        cacheNotice={cacheNotice}
        onOpenClearCacheModal={() => setShowClearCacheModal(true)}
        onInstantThemeModeChange={handleInstantThemeModeChange}
        onDismissCacheNotice={() => setCacheNotice(null)}
      />

      {/* Navigation Tabs */}
      <SettingsNavTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canAccessHotel={canAccessHotel}
        isSuperAdmin={isSuperAdmin}
        mongoConnected={Boolean(mongoStatus?.connected)}
        googleDriveAutoBackupEnabled={Boolean(settings.googleDriveBackup?.autoBackupEnabled)}
        sessionsCount={sessions.length}
      />

      {/* Tab: Hotel Information */}
      {activeTab === 'hotel' && canAccessHotel && (
        <HotelInformationTab
          settings={settings}
          updateSettings={updateSettings}
          isSyncing={isSyncing}
          onNavigateToCategories={() => setActiveTab('categories')}
          setSaveSuccess={setSaveSuccess}
        />
      )}

      {/* Tab: 5-Star Certificate Branding */}
      {activeTab === 'certificate' && canAccessHotel && (
        <div className="animate-fade-in">
          <CertificateSettingsTab />
        </div>
      )}

      {/* Tab: Item Categories & Policy */}
      {activeTab === 'categories' && (
        <CategorySettings />
      )}

      {/* Tab: Password & Security */}
      {activeTab === 'security' && (
        <SecurityTab />
      )}

      {/* Tab: Alerts & Validation Controls */}
      {activeTab === 'alerts_validation' && (
        <AlertsValidationSettings />
      )}

      {/* Tab: Login Page Customizer */}
      {activeTab === 'login_page' && (
        <LoginPageCustomizer onNavigateToAlerts={() => setActiveTab('alerts_validation')} />
      )}

      {/* Tab: Keyboard Shortcuts */}
      {activeTab === 'shortcuts' && (
        <KeyboardShortcutsSettings />
      )}

      {/* Tab: Database Integrations */}
      {activeTab === 'database' && isSuperAdmin && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-subtab-mongodb"
                onClick={() => setDatabaseSubTab('mongodb')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  databaseSubTab === 'mongodb'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>MongoDB Atlas Setup &amp; Collections</span>
              </button>

              <button
                type="button"
                id="btn-subtab-gdrive"
                onClick={() => setDatabaseSubTab('gdrive')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  databaseSubTab === 'gdrive'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Google Drive Auto Backup</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 px-2">
              <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-700">
                {mongoStatus?.connected ? 'MongoDB Atlas Live' : 'Local Storage Active'}
              </span>
            </div>
          </div>

          {databaseSubTab === 'mongodb' ? (
            <MongoDatabaseSettings />
          ) : (
            <GoogleDriveBackupManager />
          )}
        </div>
      )}

      {/* Tab: Google Drive Auto Backup */}
      {activeTab === 'google_drive' && (isSuperAdmin || canAccessHotel) && (
        <div className="space-y-6 max-w-6xl animate-fade-in">
          <GoogleDriveBackupManager />
        </div>
      )}

      {/* Tab: Data Import & Export */}
      {activeTab === 'import_data' && isSuperAdmin && (
        <DataImportExportSettings />
      )}

      {/* Tab: Connected Devices */}
      {activeTab === 'sync' && isSuperAdmin && (
        <ConnectedDevicesTab
          onOpenClearCacheModal={() => setShowClearCacheModal(true)}
        />
      )}

      {/* Clear System Cache Confirmation Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#180F1A] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-fuchsia-900/40 space-y-5 animate-scale-up">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-2xl shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clear System Cache?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This will purge all server memory buffers, clean inactive device sessions, and broadcast an immediate refresh event to all connected employee terminals and dashboards.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#200f24] border border-slate-200 dark:border-fuchsia-900/30 text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between font-medium">
                <span>Current Sync Build:</span>
                <span className="font-bold text-slate-800 dark:text-white">v{settings.version || 1}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Active Cached Items:</span>
                <span className="font-bold text-slate-800 dark:text-white">{items.length} records</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Connected Terminals:</span>
                <span className="font-bold text-slate-800 dark:text-white">{sessions.length || 1} devices</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                disabled={isClearingCache}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#251329] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-purge-cache"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="flex items-center space-x-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isClearingCache ? 'animate-bounce' : ''}`} />
                <span>{isClearingCache ? 'Purging Cache...' : 'Confirm Cache Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
