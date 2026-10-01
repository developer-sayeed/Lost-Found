import React, { useState, useEffect } from 'react';
import { SavedCertificateTemplate, BuilderElement, CanvasSettings } from './types';
import { PREBUILT_TEMPLATES, getSavedCustomTemplates, deleteSavedCustomTemplate } from './prebuiltTemplates';
import {
  X,
  Search,
  Sparkles,
  Layout,
  Bookmark,
  Trash2,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Plus
} from 'lucide-react';

interface ElementorTemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: SavedCertificateTemplate) => void;
  onSaveCurrentAsTemplate?: () => void;
  onOpenSaveModal?: () => void;
  currentElements?: BuilderElement[];
  currentSettings?: CanvasSettings;
}

export const ElementorTemplateLibraryModal: React.FC<ElementorTemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  onOpenSaveModal
}) => {
  const triggerSaveModal = onOpenSaveModal || onSaveCurrentAsTemplate;
  const [activeTab, setActiveTab] = useState<'prebuilt' | 'custom'>('prebuilt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customTemplates, setCustomTemplates] = useState<SavedCertificateTemplate[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCustomTemplates(getSavedCustomTemplates());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Hospitality & 5-Star',
    'Leadership & VIP',
    'Safety & Security',
    'Milestone & Loyalty'
  ];

  const currentList = activeTab === 'prebuilt' ? PREBUILT_TEMPLATES : customTemplates;

  const q = (searchQuery || '').toLowerCase().trim();
  const filteredTemplates = currentList.filter((tpl) => {
    const tplCategory = (tpl.category || 'Other').toLowerCase();
    const selCategory = (selectedCategory || 'All').toLowerCase();

    const matchesSearch =
      !q ||
      Boolean(tpl.name && tpl.name.toLowerCase().includes(q)) ||
      Boolean(tpl.description && tpl.description.toLowerCase().includes(q)) ||
      Boolean(tplCategory.includes(q));

    const matchesCategory =
      selCategory === 'all' || tplCategory === selCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom certificate template?')) {
      deleteSavedCustomTemplate(id);
      setCustomTemplates(getSavedCustomTemplates());
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Certificate Template Library
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  5-STAR WARWICK EDITIONS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse official pre-built layouts or load your saved custom designs with one click
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {triggerSaveModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerSaveModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Template</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Tabs & Search */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('prebuilt')}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'prebuilt'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Pre-built Layouts ({PREBUILT_TEMPLATES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'custom'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              My Saved Templates ({customTemplates.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Category Pills (for Prebuilt) */}
        {activeTab === 'prebuilt' && (
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Layout className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No templates found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {activeTab === 'custom'
                  ? "You haven't saved any custom templates yet. Click 'Save Current as Template' above to preserve your favorite canvas layouts!"
                  : 'Try adjusting your search or category filter.'}
              </p>
            </div>
          ) : (
            filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  if (tpl) {
                    onApplyTemplate(tpl);
                    onClose();
                  }
                }}
                className="group relative bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Miniature Visual Header preview */}
                  <div
                    className="w-full h-24 rounded-lg mb-3 border relative overflow-hidden flex flex-col items-center justify-center p-2 text-center transition-all group-hover:scale-[1.02]"
                    style={{
                      backgroundColor: tpl.settings?.backgroundColor || '#ffffff',
                      borderColor: tpl.settings?.borderColor || '#c4972a'
                    }}
                  >
                    <div
                      className="text-[10px] font-bold tracking-widest uppercase mb-0.5 truncate max-w-[85%]"
                      style={{ color: tpl.settings?.primaryColor || '#0f2338' }}
                    >
                      WARWICK HOTEL
                    </div>
                    <div
                      className="text-[11px] font-black tracking-wide uppercase truncate max-w-[90%]"
                      style={{ color: tpl.settings?.accentColor || '#c4972a' }}
                    >
                      {tpl.name}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1 w-8 rounded-full" style={{ backgroundColor: tpl.settings?.accentColor || '#c4972a' }} />
                      <span className="text-[8px]" style={{ color: tpl.settings?.accentColor || '#c4972a' }}>★</span>
                      <div className="h-1 w-8 rounded-full" style={{ backgroundColor: tpl.settings?.accentColor || '#c4972a' }} />
                    </div>

                    {tpl.thumbnailBadge && (
                      <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black tracking-wider">
                        {tpl.thumbnailBadge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      {tpl.name}
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700/60 whitespace-nowrap">
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {tpl.description || 'Pre-configured 5-star Warwick luxury certificate layout.'}
                  </p>
                </div>

                {/* Footer Meta & Action */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-sky-400" />
                      {tpl.elements?.length || 0} widgets
                    </span>
                    <span>•</span>
                    <span className="capitalize">{tpl.settings?.borderStyle?.replace('_', ' ') || 'Classic'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(tpl.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Delete saved template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Load <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Tip: Loading a template will preserve your changes in the Undo stack (Ctrl+Z to revert).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
