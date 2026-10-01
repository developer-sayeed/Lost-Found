import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export interface ShortcutDefinition {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'navigation' | 'actions' | 'tools';
  macKeys: string[];
  winKeys: string[];
  permission?: string;
  requiresAdmin?: boolean;
}

export const isMacOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
};

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  {
    id: 'command-palette',
    title: 'Command Palette & Quick Search',
    description: 'Search items, codes, guests, or trigger operational actions',
    category: 'core',
    macKeys: ['⌘', 'K'],
    winKeys: ['Ctrl', 'K']
  },
  {
    id: 'add-item',
    title: 'Register New Lost & Found Item',
    description: 'Open new item registration form immediately',
    category: 'core',
    macKeys: ['⌘', '⇧', 'N'],
    winKeys: ['Ctrl', 'Shift', 'N'],
    permission: 'create'
  },
  {
    id: 'escape',
    title: 'Close Modal / Dismiss',
    description: 'Dismiss open palette, scanner, or active modal window',
    category: 'core',
    macKeys: ['Esc'],
    winKeys: ['Esc']
  },
  {
    id: 'shortcuts-help',
    title: 'Keyboard Shortcuts Cheat Sheet',
    description: 'View all keyboard shortcuts and desktop operational controls',
    category: 'core',
    macKeys: ['?'],
    winKeys: ['?']
  },
  {
    id: 'toggle-sidebar',
    title: 'Toggle Navigation Sidebar',
    description: 'Collapse or expand the left sidebar to maximize workspace',
    category: 'tools',
    macKeys: ['⌘', 'B'],
    winKeys: ['Ctrl', 'B']
  },
  {
    id: 'qr-scanner',
    title: 'Quick QR / Barcode Scanner',
    description: 'Open camera scanner to instantly scan item or luggage tag',
    category: 'tools',
    macKeys: ['⌘', '⇧', 'Q'],
    winKeys: ['Ctrl', 'Shift', 'Q']
  },
  {
    id: 'refresh-sync',
    title: 'Refresh & Sync Database',
    description: 'Fetch latest items and sync settings from server',
    category: 'tools',
    macKeys: ['⌘', '⇧', 'R'],
    winKeys: ['Ctrl', 'Shift', 'R']
  },
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    description: 'Switch to live metrics and recent activity overview',
    category: 'navigation',
    macKeys: ['⌘', '1'],
    winKeys: ['Ctrl', '1']
  },
  {
    id: 'nav-items',
    title: 'Go to Lost & Found Items',
    description: 'Open full searchable inventory catalog and item table',
    category: 'navigation',
    macKeys: ['⌘', '2'],
    winKeys: ['Ctrl', '2']
  },
  {
    id: 'nav-dispatch',
    title: 'Go to Pending Dispatch',
    description: 'Manage items approaching retention deadline or queue',
    category: 'navigation',
    macKeys: ['⌘', '3'],
    winKeys: ['Ctrl', '3'],
    permission: 'dispatch'
  },
  {
    id: 'nav-staff',
    title: 'Go to Staff Management',
    description: 'View staff directory, roles, and access credentials',
    category: 'navigation',
    macKeys: ['⌘', '4'],
    winKeys: ['Ctrl', '4'],
    permission: 'staff_management'
  },
  {
    id: 'nav-performance',
    title: 'Go to Staff Performance',
    description: 'Audit logs, team leaderboards, and custody reports',
    category: 'navigation',
    macKeys: ['⌘', '5'],
    winKeys: ['Ctrl', '5'],
    permission: 'performance'
  },
  {
    id: 'nav-settings',
    title: 'Go to System Settings',
    description: 'Hotel property details, categories, and permissions',
    category: 'navigation',
    macKeys: ['⌘', '6'],
    winKeys: ['Ctrl', '6'],
    permission: 'settings'
  }
];

export const useKeyboardShortcuts = () => {
  const {
    setActiveTab,
    toggleSidebarCollapse,
    openQrScanner,
    refreshData,
    triggerSettingsSync,
    // Modal states
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    isShortcutsModalOpen,
    openShortcutsModal,
    closeShortcutsModal,
    isAddModalOpen,
    setIsAddModalOpen,
    setEditingItem,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    setSelectedItem,
    isHandoverModalOpen,
    setIsHandoverModalOpen,
    isDispatchModalOpen,
    setIsDispatchModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isReturnToStoreModalOpen,
    setIsReturnToStoreModalOpen,
    isPrintModalOpen,
    setIsPrintModalOpen,
    isStaffModalOpen,
    setIsStaffModalOpen,
    isQrScannerOpen,
    setIsQrScannerOpen,
    isItemQrModalOpen,
    setIsItemQrModalOpen,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useApp();

  const { user, hasPermission } = useAuth();
  const isMac = isMacOS();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (!e.key) return;
      const key = e.key.toLowerCase();

      // =========================================================================
      // 1. ESCAPE: Close foremost open modal or palette
      // =========================================================================
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          closeShortcutsModal();
          return;
        }
        if (isCommandPaletteOpen) {
          e.preventDefault();
          closeCommandPalette();
          return;
        }
        if (isAddModalOpen) {
          e.preventDefault();
          setIsAddModalOpen(false);
          setEditingItem(null);
          return;
        }
        if (isDetailsModalOpen) {
          e.preventDefault();
          setIsDetailsModalOpen(false);
          setSelectedItem(null);
          return;
        }
        if (isHandoverModalOpen) {
          e.preventDefault();
          setIsHandoverModalOpen(false);
          return;
        }
        if (isDispatchModalOpen) {
          e.preventDefault();
          setIsDispatchModalOpen(false);
          return;
        }
        if (isDeleteModalOpen) {
          e.preventDefault();
          setIsDeleteModalOpen(false);
          return;
        }
        if (isReturnToStoreModalOpen) {
          e.preventDefault();
          setIsReturnToStoreModalOpen(false);
          return;
        }
        if (isPrintModalOpen) {
          e.preventDefault();
          setIsPrintModalOpen(false);
          return;
        }
        if (isStaffModalOpen) {
          e.preventDefault();
          setIsStaffModalOpen(false);
          return;
        }
        if (isQrScannerOpen) {
          e.preventDefault();
          setIsQrScannerOpen(false);
          return;
        }
        if (isItemQrModalOpen) {
          e.preventDefault();
          setIsItemQrModalOpen(false);
          return;
        }
        if (isBroadcastModalOpen) {
          e.preventDefault();
          setIsBroadcastModalOpen(false);
          return;
        }
        if (isMobileSidebarOpen) {
          e.preventDefault();
          setIsMobileSidebarOpen(false);
          return;
        }
        return;
      }

      // =========================================================================
      // 2. COMMAND PALETTE & SEARCH: Cmd+K / Ctrl+K
      // =========================================================================
      if (isModifierPressed && key === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          // Close other modals if any, then open command palette
          closeShortcutsModal();
          openCommandPalette();
        }
        return;
      }

      // =========================================================================
      // 3. REGISTER NEW ITEM: Ctrl+Shift+N / Cmd+Shift+N (and Ctrl+N)
      // =========================================================================
      const isRegisterShortcut =
        ((isModifierPressed || e.ctrlKey || e.metaKey) && e.shiftKey && key === 'n') ||
        (isModifierPressed && key === 'n' && !e.altKey);

      if (isRegisterShortcut) {
        e.preventDefault();
        const canCreate =
          user?.role === 'Super Admin' ||
          user?.role === 'Admin' ||
          user?.role === 'Manager' ||
          hasPermission('create');

        if (!canCreate) {
          toast.warning('You do not have permission to register new items.');
          return;
        }

        // Close search palette if open
        if (isCommandPaletteOpen) closeCommandPalette();
        if (isShortcutsModalOpen) closeShortcutsModal();

        setEditingItem(null);
        setIsAddModalOpen(true);
        return;
      }

      // =========================================================================
      // 3B. GLOBAL TYPE-TO-SEARCH: Typing on keyboard from Home or any page opens Search
      // =========================================================================
      const isAnyModalActive =
        isShortcutsModalOpen ||
        isCommandPaletteOpen ||
        isAddModalOpen ||
        isDetailsModalOpen ||
        isHandoverModalOpen ||
        isDispatchModalOpen ||
        isDeleteModalOpen ||
        isReturnToStoreModalOpen ||
        isPrintModalOpen ||
        isStaffModalOpen ||
        isQrScannerOpen ||
        isItemQrModalOpen ||
        isBroadcastModalOpen ||
        isMobileSidebarOpen;

      if (!isEditable && !isAnyModalActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '/') {
          e.preventDefault();
          openCommandPalette('');
          return;
        }

        // Single printable character (letters, numbers, etc.) but excluding spacebar and help query
        if (e.key.length === 1 && e.key !== ' ' && e.key !== '?') {
          e.preventDefault();
          openCommandPalette(e.key);
          return;
        }
      }

      // =========================================================================
      // 4. TOGGLE SIDEBAR: Cmd+B / Ctrl+B
      // =========================================================================
      if (isModifierPressed && key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleSidebarCollapse();
        return;
      }

      // =========================================================================
      // 5. QUICK QR SCANNER: Cmd+Shift+Q / Ctrl+Shift+Q or Alt+Q
      // =========================================================================
      if ((isModifierPressed && e.shiftKey && key === 'q') || (e.altKey && key === 'q')) {
        e.preventDefault();
        if (isCommandPaletteOpen) closeCommandPalette();
        if (isShortcutsModalOpen) closeShortcutsModal();
        openQrScanner();
        return;
      }

      // =========================================================================
      // 6. REFRESH & CLOUD SYNC: Cmd+Shift+R / Ctrl+Shift+R
      // =========================================================================
      if (isModifierPressed && e.shiftKey && key === 'r') {
        e.preventDefault();
        toast.info('Refreshing inventory and system records...');
        Promise.all([refreshData(), triggerSettingsSync()]).then(() => {
          toast.success('Database and settings synchronized successfully.');
        });
        return;
      }

      // =========================================================================
      // 7. KEYBOARD SHORTCUTS CHEAT SHEET: '?' or Cmd+/ or Ctrl+/
      // =========================================================================
      if ((e.key === '?' && !isEditable) || (isModifierPressed && (e.key === '/' || key === '/'))) {
        e.preventDefault();
        if (isShortcutsModalOpen) {
          closeShortcutsModal();
        } else {
          if (isCommandPaletteOpen) closeCommandPalette();
          openShortcutsModal();
        }
        return;
      }

      // =========================================================================
      // 8. DIRECT NAVIGATION: Cmd+1..6 or Alt+1..6
      // =========================================================================
      const isAltNav = e.altKey && !e.ctrlKey && !e.metaKey;
      const isModNav = isModifierPressed && !e.shiftKey;

      if (isAltNav || (isModNav && !isEditable)) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('dashboard');
          if (isCommandPaletteOpen) closeCommandPalette();
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setActiveTab('items');
          if (isCommandPaletteOpen) closeCommandPalette();
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          if (hasPermission('dispatch') || hasPermission('view') || user?.role === 'Super Admin') {
            setActiveTab('dispatch');
            if (isCommandPaletteOpen) closeCommandPalette();
          }
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          if (hasPermission('staff_management') || user?.role === 'Super Admin') {
            setActiveTab('staff');
            if (isCommandPaletteOpen) closeCommandPalette();
          }
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          if (hasPermission('performance') || ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '')) {
            setActiveTab('performance');
            if (isCommandPaletteOpen) closeCommandPalette();
          }
          return;
        }
        if (e.key === '6') {
          e.preventDefault();
          setActiveTab('settings');
          if (isCommandPaletteOpen) closeCommandPalette();
          return;
        }
        if (e.key === '7' && (hasPermission('removed_items') || user?.role === 'Super Admin')) {
          e.preventDefault();
          setActiveTab('removed');
          if (isCommandPaletteOpen) closeCommandPalette();
          return;
        }
        if (e.key === '8') {
          e.preventDefault();
          setActiveTab('profile');
          if (isCommandPaletteOpen) closeCommandPalette();
          return;
        }
      }
    },
    [
      isMac,
      isCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      isShortcutsModalOpen,
      openShortcutsModal,
      closeShortcutsModal,
      isAddModalOpen,
      setIsAddModalOpen,
      setEditingItem,
      isDetailsModalOpen,
      setIsDetailsModalOpen,
      setSelectedItem,
      isHandoverModalOpen,
      setIsHandoverModalOpen,
      isDispatchModalOpen,
      setIsDispatchModalOpen,
      isDeleteModalOpen,
      setIsDeleteModalOpen,
      isReturnToStoreModalOpen,
      setIsReturnToStoreModalOpen,
      isPrintModalOpen,
      setIsPrintModalOpen,
      isStaffModalOpen,
      setIsStaffModalOpen,
      isQrScannerOpen,
      setIsQrScannerOpen,
      isItemQrModalOpen,
      setIsItemQrModalOpen,
      isBroadcastModalOpen,
      setIsBroadcastModalOpen,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      toggleSidebarCollapse,
      openQrScanner,
      refreshData,
      triggerSettingsSync,
      setActiveTab,
      user,
      hasPermission
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isMac,
    shortcuts: SHORTCUT_REGISTRY
  };
};
