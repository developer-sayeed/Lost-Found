import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isMacOS } from '../../hooks/useKeyboardShortcuts';
import {
  Search,
  Package,
  PlusCircle,
  QrCode,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
  RefreshCw,
  Keyboard,
  Send,
  LayoutDashboard,
  Clock,
  Users,
  TrendingUp,
  Settings,
  User,
  Trash2,
  X,
  CornerDownLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  MapPin,
  Calendar,
  History,
  Building
} from 'lucide-react';
import { LostItem, ActiveTab } from '../../types';

interface PaletteCommand {
  id: string;
  title: string;
  description?: string;
  category: 'action' | 'navigation';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  badge?: string;
  permission?: string;
}

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    commandPaletteInitialQuery,
    openShortcutsModal,
    activeItems,
    items,
    openItemDetails,
    setIsAddModalOpen,
    setEditingItem,
    openQrScanner,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    refreshData,
    triggerSettingsSync,
    setActiveTab,
    setIsBroadcastModalOpen,
    settings
  } = useApp();

  const { user, hasPermission } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const isMac = isMacOS();
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'items' | 'actions' | 'nav'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Auto focus input whenever the palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      const initialText = commandPaletteInitialQuery || '';
      setQuery(initialText);
      setFilterType('all');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = initialText.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCommandPaletteOpen, commandPaletteInitialQuery]);

  // Operational Commands List
  const allCommands = useMemo<PaletteCommand[]>(() => {
    const isAdminRole = ['Super Admin', 'Admin', 'Manager'].includes(user?.role || '');
    const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '');

    const cmds: PaletteCommand[] = [
      // Actions
      {
        id: 'action-add-item',
        title: 'Register New Lost Item',
        description: 'Open registration form to log a newly found guest article',
        category: 'action',
        icon: PlusCircle,
        shortcut: isMac ? '⌘⇧N' : 'Ctrl+Shift+N',
        action: () => {
          closeCommandPalette();
          setEditingItem(null);
          setIsAddModalOpen(true);
        }
      },
      {
        id: 'action-qr-scanner',
        title: 'Quick QR / Barcode Scanner',
        description: 'Scan item QR codes, room tags, or guest claim tickets',
        category: 'action',
        icon: QrCode,
        shortcut: `${modKey}⇧Q`,
        action: () => {
          closeCommandPalette();
          openQrScanner();
        }
      },
      {
        id: 'action-toggle-sidebar',
        title: isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar',
        description: 'Toggle the left menu bar to widen table views',
        category: 'action',
        icon: isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
        shortcut: `${modKey}B`,
        action: () => {
          closeCommandPalette();
          toggleSidebarCollapse();
        }
      },
      {
        id: 'action-switch-language',
        title: language === 'en' ? 'Switch to Arabic (العربية)' : 'Switch to English',
        description: language === 'en' ? 'تفعيل الواجهة العربية بالكامل' : 'Change interface language to English',
        category: 'action',
        icon: Languages,
        action: () => {
          closeCommandPalette();
          setLanguage(language === 'en' ? 'ar' : 'en');
        }
      },
      {
        id: 'action-refresh-sync',
        title: 'Refresh & Synchronize Data',
        description: 'Fetch latest database updates and sync offline cache',
        category: 'action',
        icon: RefreshCw,
        shortcut: `${modKey}⇧R`,
        action: () => {
          closeCommandPalette();
          refreshData();
          triggerSettingsSync();
        }
      },
      {
        id: 'action-shortcuts-guide',
        title: 'Keyboard Shortcuts Cheat Sheet',
        description: 'View full guide of keyboard shortcuts for desktop power users',
        category: 'action',
        icon: Keyboard,
        shortcut: '?',
        action: () => {
          closeCommandPalette();
          openShortcutsModal();
        }
      }
    ];

    if (isAdminTier) {
      cmds.push({
        id: 'action-broadcast',
        title: 'Broadcast Notice to Staff',
        description: 'Send high-priority alert or notice to hotel personnel',
        category: 'action',
        icon: Send,
        action: () => {
          closeCommandPalette();
          setIsBroadcastModalOpen(true);
        }
      });
    }

    // Navigation Commands
    cmds.push(
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        description: 'View live key performance indicators, charts, and metrics',
        category: 'navigation',
        icon: LayoutDashboard,
        shortcut: `${modKey}1`,
        action: () => {
          closeCommandPalette();
          setActiveTab('dashboard');
        }
      },
      {
        id: 'nav-items',
        title: 'Go to Lost & Found Items',
        description: 'Browse complete inventory catalog and filter item records',
        category: 'navigation',
        icon: Package,
        shortcut: `${modKey}2`,
        action: () => {
          closeCommandPalette();
          setActiveTab('items');
        }
      }
    );

    if (hasPermission('dispatch') || hasPermission('view') || user?.role === 'Super Admin') {
      cmds.push({
        id: 'nav-dispatch',
        title: 'Go to Pending Dispatch',
        description: 'Review items scheduled for courier dispatch or disposal',
        category: 'navigation',
        icon: Clock,
        shortcut: `${modKey}3`,
        action: () => {
          closeCommandPalette();
          setActiveTab('dispatch');
        }
      });
    }

    if (hasPermission('staff_management') || user?.role === 'Super Admin') {
      cmds.push({
        id: 'nav-staff',
        title: 'Go to Staff Management',
        description: 'Manage staff credentials, department assignments, and roles',
        category: 'navigation',
        icon: Users,
        shortcut: `${modKey}4`,
        action: () => {
          closeCommandPalette();
          setActiveTab('staff');
        }
      });
    }

    if (hasPermission('performance') || isAdminTier) {
      cmds.push({
        id: 'nav-performance',
        title: 'Go to Staff Performance',
        description: 'Analyze team recovery rankings, handovers, and audit logs',
        category: 'navigation',
        icon: TrendingUp,
        shortcut: `${modKey}5`,
        action: () => {
          closeCommandPalette();
          setActiveTab('performance');
        }
      });
    }

    if (hasPermission('audit_logs') || isAdminTier) {
      cmds.push({
        id: 'nav-audit-logs',
        title: 'Go to Audit & Accountability Logs',
        description: 'Track all status transitions, custody releases, and staff activity records',
        category: 'navigation',
        icon: History,
        action: () => {
          closeCommandPalette();
          setActiveTab('audit_logs');
        }
      });
    }

    cmds.push({
      id: 'nav-settings',
      title: 'Go to System Settings',
      description: 'Configure hotel information, category retention, and backups',
      category: 'navigation',
      icon: Settings,
      shortcut: `${modKey}6`,
      action: () => {
        closeCommandPalette();
        setActiveTab('settings');
      }
    });

    cmds.push({
      id: 'nav-profile',
      title: 'Go to My Staff Profile',
      description: 'View personal deposited item records and activity statistics',
      category: 'navigation',
      icon: User,
      action: () => {
        closeCommandPalette();
        setActiveTab('profile');
      }
    });

    if (hasPermission('removed_items') || user?.role === 'Super Admin') {
      cmds.push({
        id: 'nav-removed',
        title: 'Go to Removed Items & Trash',
        description: 'View deleted records with restore and purge capabilities',
        category: 'navigation',
        icon: Trash2,
        action: () => {
          closeCommandPalette();
          setActiveTab('removed');
        }
      });
    }

    return cmds;
  }, [
    user,
    hasPermission,
    isSidebarCollapsed,
    language,
    modKey,
    closeCommandPalette,
    setIsAddModalOpen,
    setEditingItem,
    openQrScanner,
    toggleSidebarCollapse,
    setLanguage,
    refreshData,
    triggerSettingsSync,
    openShortcutsModal,
    setIsBroadcastModalOpen,
    setActiveTab
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      if (filterType === 'items') return [];
      if (filterType === 'actions') return allCommands.filter(c => c.category === 'action');
      if (filterType === 'nav') return allCommands.filter(c => c.category === 'navigation');
      return allCommands;
    }

    return allCommands.filter(c => {
      if (filterType === 'items') return false;
      if (filterType === 'actions' && c.category !== 'action') return false;
      if (filterType === 'nav' && c.category !== 'navigation') return false;

      return (
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [allCommands, query, filterType]);

  // Search Inventory Items
  const filteredItems = useMemo(() => {
    if (filterType === 'actions' || filterType === 'nav') return [];
    const q = query.toLowerCase().trim();
    const sourceItems = activeItems && activeItems.length > 0 ? activeItems : items;

    if (!q) {
      if (filterType === 'items') {
        // Return first 15 recent items
        return sourceItems.slice(0, 15);
      }
      // When query is empty and filter is 'all', show recent 5 items
      return sourceItems.slice(0, 5);
    }

    // Search across code, itemName, description, category, locationFound, roomNumber, guestName, employeeName, storeLocation, status
    return sourceItems
      .filter(item => {
        const code = (item.code || (item as any).trackingNumber || '').toLowerCase();
        const name = (item.itemName || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const loc = (item.locationFound || '').toLowerCase();
        const room = (item.roomNumber || '').toLowerCase();
        const guest = (item.guestName || '').toLowerCase();
        const employee = (item.employeeName || (item as any).finderName || '').toLowerCase();
        const store = (item.storeLocation || '').toLowerCase();
        const status = (item.status || '').toLowerCase();

        return (
          code.includes(q) ||
          name.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          loc.includes(q) ||
          room.includes(q) ||
          guest.includes(q) ||
          employee.includes(q) ||
          store.includes(q) ||
          status.includes(q)
        );
      })
      .slice(0, 15);
  }, [activeItems, items, query, filterType]);

  // Combined selectable list for keyboard navigation
  type SelectableEntry =
    | { type: 'command'; command: PaletteCommand }
    | { type: 'item'; item: LostItem };

  const allSelectables = useMemo<SelectableEntry[]>(() => {
    const list: SelectableEntry[] = [];
    filteredCommands.forEach(command => list.push({ type: 'command', command }));
    filteredItems.forEach(item => list.push({ type: 'item', item }));
    return list;
  }, [filteredCommands, filteredItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filterType]);

  // Auto scroll active item into view
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector(
      `[data-palette-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard Navigation inside Palette (ArrowDown, ArrowUp, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allSelectables.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allSelectables.length - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const current = allSelectables[selectedIndex];
      if (!current) return;

      if (current.type === 'command') {
        current.command.action();
      } else {
        closeCommandPalette();
        openItemDetails(current.item);
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  const statusColorMap: Record<string, string> = {
    Stored: 'bg-sky-100 text-sky-800 border-sky-200',
    'Handed Over': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Claimed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Dispatched: 'bg-purple-100 text-purple-800 border-purple-200',
    'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-200',
    'Under Review': 'bg-amber-100 text-amber-800 border-amber-200',
    Disposed: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={closeCommandPalette}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] transition-all transform animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center space-x-3 rtl:space-x-reverse bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items, tracking code, guest, room, or commands..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeCommandPalette}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-bold border border-slate-300">
              Esc
            </span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Results
          </button>
          <button
            type="button"
            onClick={() => setFilterType('items')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 rtl:space-x-reverse ${
              filterType === 'items'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Items ({activeItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('actions')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 rtl:space-x-reverse ${
              filterType === 'actions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Actions</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nav')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 rtl:space-x-reverse ${
              filterType === 'nav'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>
        </div>

        {/* Scrollable Results List */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4">
          {allSelectables.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching results found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No items, commands, or records matched "{query}". Try searching by tracking code (e.g. LF-), room number, or category.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    closeCommandPalette();
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register "{query}" as New Item</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Commands & Actions Section */}
              {filteredCommands.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quick Commands & Actions</span>
                    <span>{filteredCommands.length}</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredCommands.map(cmd => {
                      const selectableIdx = allSelectables.findIndex(
                        s => s.type === 'command' && s.command.id === cmd.id
                      );
                      const isSelected = selectableIdx === selectedIndex;
                      const IconComponent = cmd.icon;

                      return (
                        <div
                          key={cmd.id}
                          data-palette-index={selectableIdx}
                          onClick={() => cmd.action()}
                          onMouseEnter={() => setSelectedIndex(selectableIdx)}
                          className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200/80 text-indigo-950 shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-indigo-950' : 'text-slate-900'
                                }`}
                              >
                                {cmd.title}
                              </p>
                              {cmd.description && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0 ml-2">
                            {cmd.shortcut && (
                              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items Section */}
              {filteredItems.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Matching Inventory Items</span>
                    <span>{filteredItems.length}</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredItems.map(item => {
                      const selectableIdx = allSelectables.findIndex(
                        s => s.type === 'item' && s.item.id === item.id
                      );
                      const isSelected = selectableIdx === selectedIndex;
                      const itemCode =
                        item.code || (item as any).trackingNumber || 'LF-2026';
                      const statusClass =
                        statusColorMap[item.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <div
                          key={item.id}
                          data-palette-index={selectableIdx}
                          onClick={() => {
                            closeCommandPalette();
                            openItemDetails(item);
                          }}
                          onMouseEnter={() => setSelectedIndex(selectableIdx)}
                          className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200/80 text-indigo-950 shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-indigo-600 border-slate-200 group-hover:border-indigo-300'
                              }`}
                            >
                              <Package className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <span className="font-mono font-bold text-xs text-indigo-600">
                                  {itemCode}
                                </span>
                                <span
                                  className="text-xs font-bold text-slate-900 truncate capitalize"
                                  style={{ textTransform: 'capitalize' }}
                                >
                                  {item.itemName}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${statusClass}`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div className="flex items-center space-x-3 rtl:space-x-reverse text-[11px] text-slate-500 mt-0.5">
                                <span className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="truncate max-w-[140px]">
                                    {item.locationFound || 'Hotel Property'}
                                  </span>
                                </span>
                                {item.roomNumber && (
                                  <span>Room: {item.roomNumber}</span>
                                )}
                                {item.guestName && (
                                  <span className="truncate max-w-[120px]">
                                    Guest: {item.guestName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0 ml-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium hidden sm:inline">
                              {item.category}
                            </span>
                            {isSelected ? (
                              <CornerDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Operational Footer with Shortcuts Guide */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">
                Esc
              </kbd>
              <span>dismiss</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              closeCommandPalette();
              openShortcutsModal();
            }}
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts Cheat Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
