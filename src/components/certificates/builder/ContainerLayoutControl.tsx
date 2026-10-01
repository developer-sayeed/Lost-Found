import React from 'react';
import { BuilderElement, CanvasSettings, ContainerLayoutConfig } from './types';
import {
  LayoutGrid,
  Columns,
  Rows,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ArrowRight,
  ArrowDown,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Move,
  CornerDownRight,
  Maximize2
} from 'lucide-react';

interface ContainerLayoutControlProps {
  element: BuilderElement;
  allElements: BuilderElement[];
  settings: CanvasSettings;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onAssignElementToSlot: (elementId: string, containerId: string, slotIndex: number) => void;
  onRemoveElementFromContainer: (elementId: string) => void;
  onOpenAssetLibrary?: () => void;
}

export const ContainerLayoutControl: React.FC<ContainerLayoutControlProps> = ({
  element,
  allElements = [],
  settings,
  onUpdateElement,
  onAssignElementToSlot,
  onRemoveElementFromContainer,
  onOpenAssetLibrary
}) => {
  const safeAllElements = Array.isArray(allElements) ? allElements : [];
  const config: ContainerLayoutConfig = element.containerConfig || {
    direction: 'row',
    layoutMode: 'flex',
    columns: 2,
    columnRatios: 'equal',
    gap: 16,
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const updateConfig = (updates: Partial<ContainerLayoutConfig>) => {
    const updated = { ...config, ...updates };
    onUpdateElement(element.id, { containerConfig: updated });
  };

  // Preset Column Architectures
  const columnPresets = [
    { cols: 1, ratio: 'equal', label: '1 Col (100%)', icon: '1' },
    { cols: 2, ratio: 'equal', label: '2 Col (50/50)', icon: '2' },
    { cols: 2, ratio: '30-70', label: '2 Col (30/70)', icon: '⅓ ⅔' },
    { cols: 2, ratio: '70-30', label: '2 Col (70/30)', icon: '⅔ ⅓' },
    { cols: 3, ratio: 'equal', label: '3 Col (33/33/33)', icon: '3' },
    { cols: 4, ratio: 'equal', label: '4 Col (25/25/25/25)', icon: '4' }
  ];

  // Child elements assigned to this container
  const childElements = safeAllElements.filter((el) => el.containerId === element.id);

  // Unassigned elements that can be moved into this container
  const candidateElements = safeAllElements.filter(
    (el) => el.id !== element.id && el.type !== 'container_grid' && el.containerId !== element.id
  );

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Container Architecture Overview */}
      <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <LayoutGrid className="w-4 h-4" />
            <span className="text-white text-xs">Certificate Container Grid</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
            {config.columns} COL • {config.direction.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Manage flexbox rows, columns, alignment, and auto-distributed layout slots for your certificate components.
        </p>
      </div>

      {/* Preset Column Layouts */}
      <div>
        <label className="block text-slate-400 mb-1.5 font-semibold">Column Structure Preset</label>
        <div className="grid grid-cols-3 gap-1.5">
          {columnPresets.map((p) => {
            const isSelected = config.columns === p.cols && (config.columnRatios || 'equal') === p.ratio;
            return (
              <button
                key={`${p.cols}-${p.ratio}`}
                type="button"
                onClick={() =>
                  updateConfig({
                    columns: p.cols,
                    columnRatios: p.ratio as any
                  })
                }
                className={`py-2 px-1.5 rounded-lg border text-center font-bold text-xs transition flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-xs">{p.icon}</span>
                <span className="text-[10px] font-medium leading-none">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direction: Row vs Column */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Direction</label>
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => updateConfig({ direction: 'row' })}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                config.direction === 'row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Row ↔
            </button>
            <button
              type="button"
              onClick={() => updateConfig({ direction: 'column' })}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                config.direction === 'column' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Col ↕
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span className="font-semibold">Gap / Spacing</span>
            <span className="font-mono text-sky-400">{config.gap}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="48"
            step="2"
            value={config.gap}
            onChange={(e) => updateConfig({ gap: Number(e.target.value) })}
            className="w-full accent-sky-500 mt-1"
          />
        </div>
      </div>

      {/* Justify Content */}
      <div>
        <label className="block text-slate-400 mb-1 font-semibold">Justify Content (Main Axis)</label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'flex-start', label: 'Start' },
            { id: 'center', label: 'Center' },
            { id: 'flex-end', label: 'End' },
            { id: 'space-between', label: 'Space Between' },
            { id: 'space-around', label: 'Space Around' },
            { id: 'space-evenly', label: 'Space Evenly' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateConfig({ justifyContent: item.id as any })}
              className={`py-1 px-1 rounded text-[10px] font-semibold transition truncate ${
                config.justifyContent === item.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Align Items */}
      <div>
        <label className="block text-slate-400 mb-1 font-semibold">Align Items (Cross Axis)</label>
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'stretch', label: 'Stretch' },
            { id: 'flex-start', label: 'Top / Start' },
            { id: 'center', label: 'Center' },
            { id: 'flex-end', label: 'Bottom' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateConfig({ alignItems: item.id as any })}
              className={`py-1 px-1 rounded text-[10px] font-semibold transition truncate ${
                config.alignItems === item.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column Slots & Content Assignment */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="block text-slate-300 font-bold">
          Container Column Slots ({config.columns})
        </label>

        <div className="space-y-2">
          {Array.from({ length: config.columns }).map((_, slotIdx) => {
            const slotElements = childElements.filter((el) => (el.columnSlotIndex ?? 0) === slotIdx);

            return (
              <div
                key={slotIdx}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5" />
                    Column Slot {slotIdx + 1}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {slotElements.length} element{slotElements.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Elements currently in this slot */}
                {slotElements.length > 0 ? (
                  <div className="space-y-1">
                    {slotElements.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded text-xs text-slate-200 border border-slate-800"
                      >
                        <span className="truncate max-w-[170px] font-medium">{child.name}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveElementFromContainer(child.id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition"
                          title="Eject from container"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic py-1 text-center bg-slate-900/40 rounded border border-dashed border-slate-800">
                    Empty slot — drag element here or select from dropdown below
                  </div>
                )}

                {/* Quick Add Existing Element into this slot */}
                {candidateElements.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <CornerDownRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignElementToSlot(e.target.value, element.id, slotIdx);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-300 text-[11px] focus:outline-hidden"
                    >
                      <option value="" disabled>
                        + Place an element in Slot {slotIdx + 1}...
                      </option>
                      {candidateElements.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
