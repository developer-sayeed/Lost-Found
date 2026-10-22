import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { DashboardView } from './components/DashboardView';
import { ItemsView } from './components/ItemsView';
import { PendingDispatchView } from './components/PendingDispatchView';
import { StaffManagementView } from './components/StaffManagementView';
import { StaffPerformanceView } from './components/StaffPerformanceView';
import { CertificatesView } from './components/certificates/CertificatesView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { UserProfileView } from './components/UserProfileView';
import { RemovedItemsView } from './components/RemovedItemsView';
import { MobileFooterNav } from './components/MobileFooterNav';
import { AddItemModal } from './components/modals/AddItemModal';
import { ItemDetailsModal } from './components/modals/ItemDetailsModal';
import { HandoverModal } from './components/modals/HandoverModal';
import { DispatchModal } from './components/modals/DispatchModal';
import { DeleteModal } from './components/modals/DeleteModal';
import { ReturnToStoreModal } from './components/modals/ReturnToStoreModal';
import { PrintReportModal } from './components/modals/PrintReportModal';
import { StaffModal } from './components/modals/StaffModal';
import { AuthModal } from './components/modals/AuthModal';
import { QrScannerModal } from './components/modals/QrScannerModal';
import { ItemQrCodeModal } from './components/modals/ItemQrCodeModal';
import { BroadcastModal } from './components/modals/BroadcastModal';
import { NoticeDetailModal } from './components/modals/NoticeDetailModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { applyDynamicTheme } from './lib/themeEngine';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, hasPermission, isSuperAdmin, previewRole, setPreviewRole, effectiveRole } = useAuth();
  const { activeTab, setActiveTab, settings } = useApp();

  const isMasterAdmin = isSuperAdmin && !previewRole;

  // Initialize global desktop keyboard shortcut manager
  useKeyboardShortcuts();

  const location = useLocation();

  // Keep activeTab in sync with current URL route
  React.useEffect(() => {
    const p = location.pathname.toLowerCase();
    if (p === '/' || p === '/dashboard') setActiveTab('dashboard');
    else if (p.startsWith('/items')) setActiveTab('items');
    else if (p.startsWith('/dispatch')) setActiveTab('dispatch');
    else if (p.startsWith('/staff')) setActiveTab('staff');
    else if (p.startsWith('/performance')) setActiveTab('performance');
    else if (p.startsWith('/certificates')) setActiveTab('certificates');
    else if (p.startsWith('/audit-logs') || p.startsWith('/audit_logs')) setActiveTab('audit_logs');
    else if (p.startsWith('/databases')) setActiveTab('databases');
    else if (p.startsWith('/settings')) setActiveTab('settings');
    else if (p.startsWith('/profile')) setActiveTab('profile');
    else if (p.startsWith('/removed')) setActiveTab('removed');
  }, [location.pathname, setActiveTab]);

  // Dynamically apply custom font, button colors, presets, and theme variables in real-time
  React.useEffect(() => {
    if (settings) {
      applyDynamicTheme(settings);

      // Determine theme mode: Respect user setting, fallback to system preference if unspecified
      let isDark = false;
      if (settings.themeMode === 'dark' || settings.isDarkMode === true) {
        isDark = true;
      } else if (settings.themeMode === 'light' || settings.isDarkMode === false) {
        isDark = false;
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#0F0911');
        document.documentElement.style.setProperty('--theme-bg-surface', '#180F1A');
        document.documentElement.style.setProperty('--theme-text-primary', '#F7F3F7');
        document.documentElement.style.setProperty('--theme-border', '#2E2032');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#FDFCFD');
        document.documentElement.style.setProperty('--theme-bg-surface', '#FFFFFF');
        document.documentElement.style.setProperty('--theme-text-primary', '#1A0C1D');
        document.documentElement.style.setProperty('--theme-border', '#E7DDE9');
      }
    } else {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#0F0911');
        document.documentElement.style.setProperty('--theme-bg-surface', '#180F1A');
        document.documentElement.style.setProperty('--theme-text-primary', '#F7F3F7');
        document.documentElement.style.setProperty('--theme-border', '#2E2032');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#FDFCFD');
        document.documentElement.style.setProperty('--theme-bg-surface', '#FFFFFF');
        document.documentElement.style.setProperty('--theme-text-primary', '#1A0C1D');
        document.documentElement.style.setProperty('--theme-border', '#E7DDE9');
      }
    }
  }, [
    settings?.fontFamily,
    settings?.primaryColor,
    settings?.secondaryColor,
    settings?.buttonColor,
    settings?.buttonHoverColor,
    settings?.buttonTextColor,
    settings?.headingColor,
    settings?.accentColor,
    settings?.buttonRadius,
    settings?.activePresetId,
    settings?.isDarkMode,
    settings?.themeMode
  ]);

  if (!isAuthenticated || !user) {
    return (
      <>
        <NetworkStatusBanner />
        <AuthModal />
      </>
    );
  }

  const renderAccessRestricted = (moduleName: string) => (
    <div className="p-8 max-w-md mx-auto mt-16 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 text-center shadow-sm">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6">
        You do not currently have permission to access the <strong>{moduleName}</strong> module. Please contact an administrator to grant access via the Security Permission Matrix.
      </p>
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
      >
        Return to Dashboard
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-16 md:pb-0">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <NetworkStatusBanner />

        {/* Live Role Simulation Warning / Switcher Banner */}
        {previewRole && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm sticky top-0 z-30 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-base">🎭</span>
              <span>
                Simulating Role: <span className="underline decoration-2 font-black">{previewRole}</span> — All navigation, modules, item actions &amp; buttons strictly reflect active permissions for <strong>{previewRole}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewRole(null)}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer ml-3 shrink-0"
            >
              Exit Simulator
            </button>
          </div>
        )}

        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route
              path="/items"
              element={
                !isMasterAdmin && !hasPermission('view')
                  ? renderAccessRestricted('Lost & Found Items')
                  : <ItemsView />
              }
            />
            <Route
              path="/dispatch"
              element={
                !isMasterAdmin && !hasPermission('dispatch')
                  ? renderAccessRestricted('Pending Dispatch')
                  : <PendingDispatchView />
              }
            />
            <Route
              path="/staff"
              element={
                !isMasterAdmin && !hasPermission('staff_management')
                  ? renderAccessRestricted('Staff Management')
                  : <StaffManagementView />
              }
            />
            <Route
              path="/performance"
              element={
                !isMasterAdmin && !hasPermission('performance')
                  ? renderAccessRestricted('Staff Performance Analytics')
                  : <StaffPerformanceView />
              }
            />
            <Route
              path="/certificates"
              element={
                !isMasterAdmin && !hasPermission('certificates_view') && !hasPermission('certificates')
                  ? renderAccessRestricted('Certificates & Awards')
                  : <CertificatesView />
              }
            />
            <Route
              path="/audit-logs"
              element={
                !isMasterAdmin && !hasPermission('audit_logs')
                  ? renderAccessRestricted('Audit & Activity Logs')
                  : <AuditLogsView />
              }
            />
            <Route
              path="/audit_logs"
              element={<Navigate to="/audit-logs" replace />}
            />
            <Route
              path="/databases"
              element={
                !isMasterAdmin && !hasPermission('settings')
                  ? renderAccessRestricted('Database Settings')
                  : <SettingsView initialTab="database" />
              }
            />
            <Route
              path="/settings"
              element={
                !isMasterAdmin && !hasPermission('settings') && !hasPermission('manage_staff_access')
                  ? renderAccessRestricted('System Settings')
                  : <SettingsView />
              }
            />
            <Route
              path="/settings/:subTab"
              element={
                !isMasterAdmin && !hasPermission('settings') && !hasPermission('manage_staff_access')
                  ? renderAccessRestricted('System Settings')
                  : <SettingsView />
              }
            />
            <Route path="/profile" element={<UserProfileView />} />
            <Route path="/profile/:staffId" element={<UserProfileView />} />
            <Route
              path="/removed"
              element={
                !isMasterAdmin && !hasPermission('removed_items')
                  ? renderAccessRestricted('Removed Items')
                  : <RemovedItemsView />
              }
            />
            {/* Fallback to dashboard for unknown routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Fixed Mobile Bottom Footer Navigation */}
      <MobileFooterNav />

      {/* Interactive Modals */}
      <AddItemModal />
      <ItemDetailsModal />
      <HandoverModal />
      <DispatchModal />
      <DeleteModal />
      <ReturnToStoreModal />
      <PrintReportModal />
      <StaffModal />
      <QrScannerModal />
      <ItemQrCodeModal />
      <BroadcastModal />
      <NoticeDetailModal />
      <CommandPaletteModal />
      <KeyboardShortcutsModal />
      <OfflineIndicator />
    </div>
  );
};

const ConfiguredToastContainer: React.FC = () => {
  const { settings } = useApp();
  const toastConfig = settings.toastConfig;
  if (toastConfig?.enableToasts === false) {
    return null;
  }
  return (
    <ToastContainer
      position={toastConfig?.position || 'top-right'}
      autoClose={toastConfig?.autoClose ?? 4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={toastConfig?.theme || 'colored'}
    />
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AppProvider>
            <MainLayout />
            <ConfiguredToastContainer />
          </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
