import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { isMacOS, SHORTCUT_REGISTRY, ShortcutDefinition } from '../../hooks/useKeyboardShortcuts';
import {
  Keyboard,
  X,
  Search,
  Zap,
  Navigation,
  Sliders,
  Sparkles,
  Command,
  CornerDownLeft,
  ArrowRight
} from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, closeShortcutsModal, openCommandPalette } = useApp();
  const { t, isRTL } = useLanguage();
  const [filterQuery, setFilterQuery] = useState('');
  const isMac = isMacOS();

  if (!isShortcutsModalOpen) return null;

  const categories = [
    { key: 'core', label: 'Core & Search', icon: Zap },
    { key: 'tools', label: 'Operations & Tools', icon: Sliders },
    { key: 'navigation', label: 'Direct View Navigation', icon: Navigation }
  ];

  const filteredShortcuts = SHORTCUT_REGISTRY.filter(item => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const keysStr = (isMac ? item.macKeys : item.winKeys).join(' ').toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      keysStr.includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={closeShortcutsModal}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Desktop Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500">
                Accelerate your daily workflow with hotel operational hotkeys
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeShortcutsModal}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Awareness & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              {isMac ? 'Apple macOS layout detected (⌘ Command)' : 'Windows / Linux layout detected (Ctrl)'}
            </span>
          </div>

          {/* Quick Filter */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter shortcuts..."
              className="w-full text-xs pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Shortcuts List by Categories */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 divide-y divide-slate-100">
          {categories.map(cat => {
            const itemsInCat = filteredShortcuts.filter(s => s.category === cat.key);
            if (itemsInCat.length === 0) return null;
            const Icon = cat.icon;

            return (
              <div key={cat.key} className="pt-4 first:pt-0">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                  <Icon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {cat.label}
                  </h3>
                </div>

                <div className="space-y-2">
                  {itemsInCat.map(shortcut => {
                    const keys = isMac ? shortcut.macKeys : shortcut.winKeys;

                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-colors"
                      >
                        <div className="min-w-0 pr-4 rtl:pr-0 rtl:pl-4">
                          <h4 className="text-xs font-bold text-slate-900">
                            {shortcut.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {shortcut.description}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5 rtl:space-x-reverse flex-shrink-0">
                          {keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              <kbd className="min-w-[24px] px-2 py-1 text-center text-xs font-mono font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs">
                                {k}
                              </kbd>
                              {idx < keys.length - 1 && (
                                <span className="text-slate-300 text-xs font-bold">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs font-semibold text-slate-600">
                No shortcuts found for "{filterQuery}"
              </p>
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              closeShortcutsModal();
              openCommandPalette();
            }}
            className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Open Command Palette ({isMac ? '⌘K' : 'Ctrl+K'})</span>
          </button>

          <button
            type="button"
            onClick={closeShortcutsModal}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
