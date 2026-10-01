import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  Search,
  PlusCircle,
  QrCode,
  RotateCw,
  PanelLeftClose,
  LayoutDashboard,
  Package,
  Clock,
  Users,
  Award,
  Settings,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Command,
  Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { isMacOS, SHORTCUT_REGISTRY } from '../hooks/useKeyboardShortcuts';

export const KeyboardShortcutsSettings: React.FC = () => {
  const { openShortcutsModal, openCommandPalette, setIsAddModalOpen, setEditingItem } = useApp();
  const { user } = useAuth();
  const isMac = isMacOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'tools' | 'navigation'>('all');

  const categories = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'core', label: 'Core & Search' },
    { id: 'tools', label: 'Operational Tools' },
    { id: 'navigation', label: 'Direct Navigation' }
  ];

  const filteredShortcuts = useMemo(() => {
    return SHORTCUT_REGISTRY.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = (searchQuery || '').toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        Boolean(item.title && item.title.toLowerCase().includes(query)) ||
        Boolean(item.description && item.description.toLowerCase().includes(query)) ||
        Boolean(item.winKeys && item.winKeys.join(' ').toLowerCase().includes(query)) ||
        Boolean(item.macKeys && item.macKeys.join(' ').toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getIconForShortcut = (id: string) => {
    switch (id) {
      case 'command-palette':
        return <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'add-item':
        return <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'escape':
        return <Keyboard className="w-4 h-4 text-slate-500" />;
      case 'shortcuts-help':
        return <Keyboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'toggle-sidebar':
        return <PanelLeftClose className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'qr-scanner':
        return <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'refresh-sync':
        return <RotateCw className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'nav-dashboard':
        return <LayoutDashboard className="w-4 h-4 text-indigo-500" />;
      case 'nav-items':
        return <Package className="w-4 h-4 text-indigo-500" />;
      case 'nav-dispatch':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'nav-staff':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'nav-performance':
        return <Award className="w-4 h-4 text-purple-500" />;
      case 'nav-settings':
        return <Settings className="w-4 h-4 text-slate-500" />;
      default:
        return <Keyboard className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="keyboard-shortcuts-settings-section">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Operational Controls</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hotkeys & Speed Navigation
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Master rapid hotel operations without leaving the keyboard. Press keys from any page to register items, search inventory, and toggle toolbars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
              <span>Layout: <strong className="text-white">{isMac ? 'macOS (⌘)' : 'Windows / PC (Ctrl)'}</strong></span>
            </div>
            <button
              type="button"
              onClick={openShortcutsModal}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Cheat Sheet Modal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pro-Tip on Global Search */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-300 text-xs">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block text-amber-950 dark:text-amber-200">
            Global Type-to-Search Active
          </strong>
          <span>
            You don't need a search icon in the header bar! Simply start typing any letters or words on your keyboard from Home or any page, or press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-mono font-bold">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>{' '}
            or <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[11px] font-mono font-bold">/</kbd> to instantly search items, staff, guests, and operational commands.
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter shortcuts..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredShortcuts.map(item => {
          const keys = isMac ? item.macKeys : item.winKeys;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl p-4 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-colors">
                  {getIconForShortcut(item.id)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    {item.id === 'add-item' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        Updated (Ctrl+Shift+N)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Key badges */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {keys.map((k, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-400 text-[10px] font-bold">+</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredShortcuts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Keyboard className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No shortcuts matching "{searchQuery}"
          </p>
          <p className="text-xs text-slate-500">
            Try clearing the search filter or switching categories.
          </p>
        </div>
      )}

      {/* Interactive Quick Actions Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Need to test action triggers? Try clicking these test buttons:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all cursor-pointer"
          >
            Launch Command Palette ({isMac ? '⌘K' : 'Ctrl+K'})
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            Register Item ({isMac ? '⌘⇧N' : 'Ctrl+Shift+N'})
          </button>
        </div>
      </div>
    </div>
  );
};
