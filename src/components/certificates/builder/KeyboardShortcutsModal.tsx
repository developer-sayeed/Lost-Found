import React from 'react';
import { X, Keyboard, Scissors, Copy, Clipboard, Trash2, Undo, Redo, Move, ArrowRight, CornerDownLeft } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      action: 'Undo',
      actionBn: 'পূর্বাবস্থায় ফিরুন (Undo)',
      keys: ['Ctrl / ⌘', 'Z'],
      icon: Undo,
      color: 'text-sky-400'
    },
    {
      action: 'Redo',
      actionBn: 'পুনরায় করুন (Redo)',
      keys: ['Ctrl / ⌘', 'Y', 'or', 'Ctrl+Shift+Z'],
      icon: Redo,
      color: 'text-emerald-400'
    },
    {
      action: 'Copy Element',
      actionBn: 'উপাদান কপি করুন (Copy)',
      keys: ['Ctrl / ⌘', 'C'],
      icon: Copy,
      color: 'text-amber-400'
    },
    {
      action: 'Cut Element',
      actionBn: 'উপাদান কাট করুন (Cut)',
      keys: ['Ctrl / ⌘', 'X'],
      icon: Scissors,
      color: 'text-rose-400'
    },
    {
      action: 'Paste Element',
      actionBn: 'কপি/কাট উপাদান পেস্ট করুন (Paste)',
      keys: ['Ctrl / ⌘', 'V'],
      icon: Clipboard,
      color: 'text-purple-400'
    },
    {
      action: 'Delete Element',
      actionBn: 'উপাদান মুছুন (Delete)',
      keys: ['Delete', 'or', 'Backspace'],
      icon: Trash2,
      color: 'text-red-500'
    },
    {
      action: 'Duplicate Element',
      actionBn: 'হুবহু প্রতিলিপি (Duplicate)',
      keys: ['Ctrl / ⌘', 'D'],
      icon: Copy,
      color: 'text-cyan-400'
    },
    {
      action: 'Nudge Position',
      actionBn: 'ধীরে ধীরে অবস্থান পরিবর্তন (Nudge)',
      keys: ['↑', '↓', '←', '→'],
      icon: Move,
      color: 'text-slate-300'
    },
    {
      action: 'Fast Nudge Position',
      actionBn: 'দ্রুত অবস্থান পরিবর্তন (Fast Nudge)',
      keys: ['Shift', '+', 'Arrow Keys'],
      icon: Move,
      color: 'text-blue-300'
    },
    {
      action: 'Deselect Element',
      actionBn: 'নির্বাচন বাতিল করুন (Deselect)',
      keys: ['Escape'],
      icon: CornerDownLeft,
      color: 'text-slate-400'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Keyboard Shortcuts (শর্টকাট কীসমূহ)
              </h3>
              <p className="text-[11px] text-slate-400">
                Work faster with full keyboard controls in Certificate Builder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-[65vh] overflow-y-auto space-y-2">
          {shortcuts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-slate-800/80 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.action}</div>
                    <div className="text-[10px] text-slate-400">{item.actionBn}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {item.keys.map((k, kIdx) => {
                    if (k === 'or' || k === '+') {
                      return (
                        <span key={kIdx} className="text-[10px] text-slate-500 px-0.5">
                          {k}
                        </span>
                      );
                    }
                    return (
                      <kbd
                        key={kIdx}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-slate-200 shadow-xs"
                      >
                        {k}
                      </kbd>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>💡 Tip: Select any element on canvas to use Cut, Copy, Duplicate, or Delete.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
