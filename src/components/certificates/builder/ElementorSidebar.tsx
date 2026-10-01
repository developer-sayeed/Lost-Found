import React, { useState } from 'react';
import { BuilderElement, CanvasSettings, BuilderElementType } from './types';
import { CertificateBorderStyle, CertificateBadgeStyle } from '../../../types';
import { ELEMENT_CATALOG } from './elementCatalog';
import { ElementorLayerPanel } from './ElementorLayerPanel';
import { CSSStyleControlPanel } from './CSSStyleControlPanel';
import { ContainerLayoutControl } from './ContainerLayoutControl';
import {
  Layers,
  Layout,
  Sliders,
  Type,
  Palette,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  RotateCcw,
  Sparkles,
  Search,
  Bookmark,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  LayoutGrid,
  Award,
  X
} from 'lucide-react';

interface ElementorSidebarProps {
  elements: BuilderElement[];
  settings: CanvasSettings;
  selectedElement: BuilderElement | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddElement: (type: BuilderElementType) => void;
  onUpdateSettings: (updates: Partial<CanvasSettings>) => void;
  onReorderElements: (newElements: BuilderElement[]) => void;
  onOpenTemplates?: () => void;
  onOpenAssetLibrary?: () => void;
  onAssignElementToSlot?: (elementId: string, containerId: string, slotIndex: number) => void;
  onRemoveElementFromContainer?: (elementId: string) => void;
  onCloseMobile?: () => void;
}

export const ElementorSidebar: React.FC<ElementorSidebarProps> = ({
  elements,
  settings,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddElement,
  onUpdateSettings,
  onReorderElements,
  onOpenTemplates,
  onOpenAssetLibrary,
  onAssignElementToSlot,
  onRemoveElementFromContainer,
  onCloseMobile
}) => {
  const [mainTab, setMainTab] = useState<'widgets' | 'settings' | 'layers'>('widgets');
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [widgetCategory, setWidgetCategory] = useState<string>('All');
  const [widgetSearch, setWidgetSearch] = useState<string>('');

  const widgetCategories = [
    'All',
    'Structural & Grid Containers',
    'Header & Brand',
    'Titles & Awards',
    'Recipient',
    'Citations & Content',
    'Signatures',
    'Seals & Medals',
    'Security & Codes',
    'Decorative'
  ];

  const filteredWidgets = ELEMENT_CATALOG.filter((w) => {
    const matchesCat = widgetCategory === 'All' || w.category === widgetCategory;
    const search = (widgetSearch || '').toLowerCase().trim();
    if (!search) return matchesCat;
    const matchesSearch =
      Boolean(w.name && w.name.toLowerCase().includes(search)) ||
      Boolean(w.description && w.description.toLowerCase().includes(search));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full shrink-0 select-none shadow-2xl lg:shadow-none">
      {/* Certificate Builder Brand Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white">CERTIFICATE</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              BUILDER PRO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAssetLibrary && (
            <button
              type="button"
              onClick={onOpenAssetLibrary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/40 text-sky-300 text-[11px] font-bold transition"
              title="Open Central Asset Library"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Assets</span>
            </button>
          )}

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition lg:hidden"
              title="Close Tools Panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Switcher Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setMainTab('widgets');
            onSelectElement(null);
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
            mainTab === 'widgets' && !selectedElement
              ? 'border-b-2 border-sky-500 text-sky-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Elements
        </button>
        <button
          type="button"
          onClick={() => {
            setMainTab('settings');
            onSelectElement(null);
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
            mainTab === 'settings' && !selectedElement
              ? 'border-b-2 border-sky-500 text-sky-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Page Style
        </button>
        <button
          type="button"
          onClick={() => setMainTab('layers')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
            mainTab === 'layers'
              ? 'border-b-2 border-sky-500 text-sky-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Navigator
        </button>
      </div>

      {/* Main Body Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* If an element is selected -> Elementor 3-Tab Inspector */}
        {selectedElement ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-sky-400">EDIT:</span>
                <span className="text-xs font-semibold text-white truncate max-w-[140px]">{selectedElement.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectElement(null)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Done
              </button>
            </div>

            {/* 3 Inspector Tabs: Content | Style | Advanced */}
            <div className="flex bg-slate-950 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInspectorTab('content')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  inspectorTab === 'content' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('style')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  inspectorTab === 'style' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Style
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('advanced')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  inspectorTab === 'advanced' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>

            {/* 1. CONTENT TAB */}
            {inspectorTab === 'content' && (
              <div className="space-y-3 text-xs">
                {/* Elementor Container Grid Architecture Control */}
                {selectedElement.type === 'container_grid' ? (
                  <ContainerLayoutControl
                    element={selectedElement}
                    allElements={elements}
                    settings={settings}
                    onUpdateElement={onUpdateElement}
                    onAssignElementToSlot={onAssignElementToSlot || (() => {})}
                    onRemoveElementFromContainer={onRemoveElementFromContainer || (() => {})}
                    onOpenAssetLibrary={onOpenAssetLibrary}
                  />
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-semibold">Primary Text Content</label>
                        <span className="text-[10px] text-amber-400/80 font-mono">Dynamic Tokens Supported</span>
                      </div>
                      {selectedElement.type === 'citation' ? (
                        <textarea
                          rows={4}
                          value={selectedElement.content || ''}
                          onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      ) : (
                        <input
                          type="text"
                          value={selectedElement.content || ''}
                          onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      )}

                      {/* Dynamic Template Placeholders Quick Insertion */}
                      <div className="mt-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between mb-1 text-[10px]">
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Insert Dynamic Tag
                          </span>
                          <span className="text-slate-500">Auto-filled for staff</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: 'Staff Name', tag: '{{staff_name}}' },
                            { label: 'Position', tag: '{{staff_position}}' },
                            { label: 'Department', tag: '{{staff_department}}' },
                            { label: 'Citation', tag: '{{citation_paragraph}}' },
                            { label: 'Issue Date', tag: '{{issue_date}}' },
                            { label: 'Cert No.', tag: '{{certificate_no}}' }
                          ].map((item) => (
                            <button
                              key={item.tag}
                              type="button"
                              onClick={() => {
                                const current = selectedElement.content || '';
                                const nextVal = current.trim() ? `${current} ${item.tag}` : item.tag;
                                onUpdateElement(selectedElement.id, { content: nextVal });
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-[10px] font-mono transition"
                              title={`Append ${item.tag}`}
                            >
                              +{item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sub-content (Subtitle, Dept, etc.) */}
                    {selectedElement.subContent !== undefined && (
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Subtitle / Secondary Label</label>
                        <input
                          type="text"
                          value={selectedElement.subContent || ''}
                          onChange={(e) => onUpdateElement(selectedElement.id, { subContent: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Asset Library Picker for Images & Icons */}
                    {(selectedElement.type === 'custom_image' || selectedElement.type === 'asset_icon') && onOpenAssetLibrary && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-bold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                            Central Asset Library
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">100+ Assets</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Choose official crests, 24K gold seals, wax stamps, ribbons, or custom uploaded logos.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenAssetLibrary}
                          className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Browse Central Asset Gallery</span>
                        </button>
                      </div>
                    )}

                    {/* Badge Seal Style Picker */}
                    {selectedElement.type === 'badge_seal' && (
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Seal & Ribbon Archetype</label>
                        <select
                          value={selectedElement.meta?.badgeStyle || 'rosette'}
                          onChange={(e) =>
                            onUpdateElement(selectedElement.id, {
                              meta: { ...selectedElement.meta, badgeStyle: e.target.value as CertificateBadgeStyle }
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="rosette">Satin Pleated Rosette</option>
                          <option value="gold_seal">24K Embossed Gold Seal</option>
                          <option value="laurel_crest">Imperial Laurel Wreath</option>
                          <option value="star_medallion">Star Medallion</option>
                          <option value="shield_crest">Shield of Honor</option>
                        </select>
                      </div>
                    )}

                    {/* Alignment */}
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Alignment</label>
                      <div className="flex bg-slate-950 rounded border border-slate-700 p-0.5">
                        {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => onUpdateElement(selectedElement.id, { textAlign: align })}
                            className={`flex-1 py-1 flex items-center justify-center rounded text-xs transition ${
                              selectedElement.textAlign === align ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                            {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                            {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                            {align === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. STYLE TAB: CSS Style Control Panel */}
            {inspectorTab === 'style' && (
              <CSSStyleControlPanel
                element={selectedElement}
                settings={settings}
                onUpdateElement={onUpdateElement}
              />
            )}

            {/* 3. ADVANCED TAB */}
            {inspectorTab === 'advanced' && (
              <div className="space-y-3 text-xs">
                {/* Horizontal Position (X%) */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-semibold">Horizontal Position (X)</span>
                    <span>{selectedElement.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="0.5"
                    value={selectedElement.x}
                    onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                {/* Vertical Position (Y%) */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-semibold">Vertical Position (Y)</span>
                    <span>{selectedElement.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="0.5"
                    value={selectedElement.y}
                    onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                {/* Quick Align Buttons */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Quick Alignments</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { x: 50 })}
                      className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-medium transition"
                    >
                      ↔️ Center X (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { y: 50 })}
                      className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-medium transition"
                    >
                      ↕️ Center Y (50%)
                    </button>
                  </div>
                </div>

                {/* Layer Security & Stacking */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Lock Position
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedElement.isLocked
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {selectedElement.isLocked ? 'Locked' : 'Unlocked'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      Visibility
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { isVisible: !selectedElement.isVisible })}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedElement.isVisible
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {selectedElement.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>

                {/* Stacking Z-Index */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-semibold">Layer Depth (Z-Index)</span>
                    <span className="font-mono">{selectedElement.zIndex}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { zIndex: Math.max(1, selectedElement.zIndex - 1) })}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                    >
                      ↓ Send Backward
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { zIndex: selectedElement.zIndex + 1 })}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                    >
                      ↑ Bring Forward
                    </button>
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-semibold">Element Opacity</span>
                    <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => onDuplicateElement(selectedElement.id)}
                    className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    Duplicate Element
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteElement(selectedElement.id)}
                    className="w-full py-2 px-3 rounded bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 font-medium flex items-center justify-center gap-2 transition border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Element
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : mainTab === 'widgets' ? (
          /* WIDGETS CATALOG (44+ ELEMENTS) */
          <div className="space-y-3">
            {/* Template Library Quick Banner */}
            {onOpenTemplates && (
              <button
                type="button"
                onClick={onOpenTemplates}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 border border-amber-500/40 hover:border-amber-400 text-left flex items-center justify-between group transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      Template Library
                    </h5>
                    <p className="text-[10px] text-slate-400">Pre-built 5-star certificate layouts</p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </button>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search 44+ elements..."
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>

            {/* Category Scroll Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {widgetCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setWidgetCategory(cat)}
                  className={`px-2 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                    widgetCategory === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Elements Grid */}
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span>{filteredWidgets.length} Elements</span>
                <span className="text-slate-500">Click to add to canvas</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {filteredWidgets.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => onAddElement(item.type)}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-sky-500 hover:bg-slate-850 transition group text-left cursor-pointer shadow-xs"
                    >
                      <div className="w-full flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white flex items-center justify-center transition">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <Plus className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1 leading-tight">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : mainTab === 'settings' ? (
          /* PAGE / CANVAS SETTINGS */
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Orientation</label>
              <div className="flex bg-slate-950 rounded p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ orientation: 'landscape', width: 1000, height: 700 })}
                  className={`flex-1 py-1.5 rounded font-semibold transition ${
                    settings.orientation === 'landscape' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Landscape (A4)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ orientation: 'portrait', width: 700, height: 1000 })}
                  className={`flex-1 py-1.5 rounded font-semibold transition ${
                    settings.orientation === 'portrait' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portrait
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Luxury Frame Border</label>
              <select
                value={settings.borderStyle}
                onChange={(e) => onUpdateSettings({ borderStyle: e.target.value as CertificateBorderStyle })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="royal_frame">Royal Frame (Classic Filigree)</option>
                <option value="baroque_filigree">Baroque Filigree Corners</option>
                <option value="geometric_gold">Art Deco Geometric Gold</option>
                <option value="double_border">Double Border Minimalist</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Frame / Accent Gold Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => onUpdateSettings({ accentColor: e.target.value, borderColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => onUpdateSettings({ accentColor: e.target.value, borderColor: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Brand Navy Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Background Canvas Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          /* NAVIGATOR (FULL ELEMENTOR LAYER PANEL) */
          <ElementorLayerPanel
            elements={elements}
            selectedElementId={selectedElement?.id || null}
            onSelectElement={onSelectElement}
            onUpdateElement={onUpdateElement}
            onReorderElements={onReorderElements}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
          />
        )}
      </div>
    </div>
  );
};
