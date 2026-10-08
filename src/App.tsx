import React from 'react';
import { ShieldAlert } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuth();
  const { activeTab, setActiveTab, settings } = useApp();

  // Initialize global desktop keyboard shortcut manager
  useKeyboardShortcuts();

  // Dynamically apply custom font, button colors, presets, and theme variables in real-time
  React.useEffect(() => {
    if (settings) {
      applyDynamicTheme(settings);

      // Dark Mode & High Contrast Theme handling
      const isDark =
        settings.isDarkMode === true ||
        settings.themeMode === 'dark' ||
        (settings.themeMode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#090d16');
        document.documentElement.style.setProperty('--theme-bg-surface', '#111827');
        document.documentElement.style.setProperty('--theme-text-primary', '#f8fafc');
        document.documentElement.style.setProperty('--theme-border', '#2d3748');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.setProperty('--theme-bg-canvas', '#f8fafc');
        document.documentElement.style.setProperty('--theme-bg-surface', '#ffffff');
        document.documentElement.style.setProperty('--theme-text-primary', '#0f172a');
        document.documentElement.style.setProperty('--theme-border', '#e2e8f0');
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

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'items':
        return <ItemsView />;
      case 'dispatch':
        return <PendingDispatchView />;
      case 'staff':
        return <StaffManagementView />;
      case 'performance':
        return <StaffPerformanceView />;
      case 'certificates':
        return <CertificatesView />;
      case 'audit_logs':
        if (user?.role !== 'Super Admin' && user?.role !== 'Admin') {
          return (
            <div className="p-8 max-w-md mx-auto mt-16 bg-white rounded-2xl border border-red-200 text-center shadow-sm">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
              <p className="text-slate-600 text-xs leading-relaxed mb-6">
                Only Administrators and Super Admins have permission to view the Audit & Activity Logs.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          );
        }
        return <AuditLogsView />;
      case 'databases':
        return <SettingsView initialTab="database" />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <UserProfileView />;
      case 'removed':
        return <RemovedItemsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-16 md:pb-0">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <NetworkStatusBanner />
        <main className="flex-1 pb-16">
          {renderActiveView()}
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
