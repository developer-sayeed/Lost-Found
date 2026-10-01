import React, { useState } from 'react';
import { BuilderElement } from './types';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Search,
  Type,
  Award,
  Crown,
  Sparkles,
  PenTool,
  QrCode,
  Shield,
  Star,
  Tag,
  Hash,
  Barcode,
  Edit2,
  Check
} from 'lucide-react';

interface ElementorLayerPanelProps {
  elements: BuilderElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElements: (newElements: BuilderElement[]) => void;
}

export const ElementorLayerPanel: React.FC<ElementorLayerPanelProps> = ({
  elements = [],
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements
}) => {
  const safeElements = Array.isArray(elements) ? elements : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Sort elements by zIndex descending (top visual layer first in layer panel)
  const sortedElements = [...safeElements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  const q = (searchQuery || '').toLowerCase().trim();
  const filteredElements = sortedElements.filter(
    (el) =>
      !q ||
      Boolean(el.name && el.name.toLowerCase().includes(q)) ||
      Boolean(el.type && el.type.toLowerCase().includes(q)) ||
      (typeof el.content === 'string' && el.content.toLowerCase().includes(q))
  );

  // Reorder helpers
  const handleMoveUp = (id: string) => {
    // In sorted order (descending zIndex), "Move Up" means increasing zIndex (moving toward index 0 in sorted)
    const idx = sortedElements.findIndex((e) => e.id === id);
    if (idx <= 0) return;
    const target = sortedElements[idx];
    const above = sortedElements[idx - 1];

    const tempZ = target.zIndex;
    target.zIndex = Math.max(above.zIndex + 1, tempZ + 1);

    onReorderElements([...safeElements]);
  };

  const handleMoveDown = (id: string) => {
    const idx = sortedElements.findIndex((e) => e.id === id);
    if (idx >= sortedElements.length - 1) return;
    const target = sortedElements[idx];
    const below = sortedElements[idx + 1];

    const tempZ = target.zIndex;
    target.zIndex = Math.min(below.zIndex - 1, tempZ - 1);

    onReorderElements([...safeElements]);
  };

  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...safeElements.map((e) => e.zIndex || 0), 10);
    onUpdateElement(id, { zIndex: maxZ + 2 });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...safeElements.map((e) => e.zIndex || 0), 10);
    onUpdateElement(id, { zIndex: Math.max(1, minZ - 2) });
  };

  // Batch actions
  const handleShowAll = () => {
    const updated = safeElements.map((e) => ({ ...e, isVisible: true }));
    onReorderElements(updated);
  };

  const handleHideAll = () => {
    const updated = safeElements.map((e) => ({ ...e, isVisible: false }));
    onReorderElements(updated);
  };

  const handleUnlockAll = () => {
    const updated = safeElements.map((e) => ({ ...e, isLocked: false }));
    onReorderElements(updated);
  };

  const getElementIcon = (type: string) => {
    if (type.includes('header') || type.includes('crest')) return Crown;
    if (type.includes('seal') || type.includes('medal') || type.includes('badge') || type.includes('laurel'))
      return Award;
    if (type.includes('star')) return Star;
    if (type.includes('title') || type.includes('heading') || type.includes('text')) return Type;
    if (type.includes('signatory')) return PenTool;
    if (type.includes('qr')) return QrCode;
    if (type.includes('shield')) return Shield;
    if (type.includes('barcode')) return Barcode;
    if (type.includes('cert_number') || type.includes('id')) return Hash;
    if (type.includes('divider') || type.includes('flourish')) return Sparkles;
    return Tag;
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Layer Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Layer Navigator ({safeElements.length})
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={handleShowAll}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            title="Make all layers visible"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={handleUnlockAll}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            title="Unlock all layers"
          >
            Unlock All
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
        />
      </div>

      {/* Layer Items List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filteredElements.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No matching layers found.</div>
        ) : (
          filteredElements.map((elem) => {
            const isSelected = selectedElementId === elem.id;
            const Icon = getElementIcon(elem.type);

            return (
              <div
                key={elem.id}
                onClick={() => onSelectElement(elem.id)}
                className={`group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-500/80 text-white shadow-sm'
                    : 'bg-slate-950/90 hover:bg-slate-850 border-slate-800/80 text-slate-300'
                }`}
              >
                {/* Left: Icon, Name, Z-Index */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {editingNameId === elem.id ? (
                    <div
                      className="flex items-center gap-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs text-white w-full"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempName.trim()) {
                            onUpdateElement(elem.id, { name: tempName.trim() });
                          }
                          setEditingNameId(null);
                        }}
                        className="p-1 text-sky-400 hover:text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate max-w-[125px]">{elem.name}</span>
                        {elem.isLocked && (
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        )}
                        {!elem.isVisible && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        z: {elem.zIndex} • {elem.category}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions (Visibility, Lock, Order, Delete) */}
                <div
                  className="flex items-center gap-0.5 shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(elem.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Bring forward (Move Up)"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(elem.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Send backward (Move Down)"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => onUpdateElement(elem.id, { isVisible: !elem.isVisible })}
                    className={`p-1 rounded transition ${
                      elem.isVisible
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                    title={elem.isVisible ? 'Hide element' : 'Show element'}
                  >
                    {elem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock toggle */}
                  <button
                    type="button"
                    onClick={() => onUpdateElement(elem.id, { isLocked: !elem.isLocked })}
                    className={`p-1 rounded transition ${
                      elem.isLocked
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={elem.isLocked ? 'Unlock element' : 'Lock element position'}
                  >
                    {elem.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Rename button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(elem.name);
                      setEditingNameId(elem.id);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition"
                    title="Rename layer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDeleteElement(elem.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Element Fast Ordering Toolbar */}
      {selectedElementId && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Arrange selected:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleBringToFront(selectedElementId)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition"
              title="Bring to Very Top"
            >
              <ArrowUpToLine className="w-3 h-3 text-sky-400" />
              Front
            </button>
            <button
              type="button"
              onClick={() => handleSendToBack(selectedElementId)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition"
              title="Send to Very Bottom"
            >
              <ArrowDownToLine className="w-3 h-3 text-sky-400" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
