import React, { useState } from 'react';
import { BuilderElement, CanvasSettings } from './types';
import {
  Type,
  Maximize2,
  Minimize2,
  Box,
  Palette,
  Sparkles,
  Link2,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  RotateCcw,
  Sun,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface CSSStyleControlPanelProps {
  element: BuilderElement;
  settings: CanvasSettings;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
}

export const CSSStyleControlPanel: React.FC<CSSStyleControlPanelProps> = ({
  element,
  settings,
  onUpdateElement
}) => {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<{
    typography: boolean;
    boxModel: boolean;
    borders: boolean;
    background: boolean;
    effects: boolean;
  }>({
    typography: true,
    boxModel: true,
    borders: true,
    background: true,
    effects: false
  });

  // Link/Unlink state for margins and padding
  const [isMarginLinked, setIsMarginLinked] = useState<boolean>(true);
  const [isPaddingLinked, setIsPaddingLinked] = useState<boolean>(true);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Typography helpers
  const currentFont = element.fontFamily || "'Playfair Display', Georgia, serif";
  const currentSize = element.fontSize || 16;
  const currentWeight = element.fontWeight || 400;
  const currentStyle = element.fontStyle || 'normal';
  const currentAlign = element.textAlign || 'center';
  const currentTransform = element.textTransform || 'none';
  const currentDecoration = element.textDecoration || 'none';
  const currentLetterSpacing = element.letterSpacing || 0;
  const currentLineHeight = element.lineHeight || 1.4;
  const currentTextColor = element.textColor || settings.textColor || '#1E293B';
  const currentTextShadow = element.textShadow || 'none';

  // Box model helpers
  const mTop = element.marginTop ?? 0;
  const mRight = element.marginRight ?? 0;
  const mBottom = element.marginBottom ?? 0;
  const mLeft = element.marginLeft ?? 0;

  const pTop = element.paddingTop ?? (element.padding ?? 0);
  const pRight = element.paddingRight ?? (element.padding ?? 0);
  const pBottom = element.paddingBottom ?? (element.padding ?? 0);
  const pLeft = element.paddingLeft ?? (element.padding ?? 0);

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    if (isMarginLinked) {
      onUpdateElement(element.id, {
        marginTop: val,
        marginRight: val,
        marginBottom: val,
        marginLeft: val
      });
    } else {
      const key = `margin${side.charAt(0).toUpperCase() + side.slice(1)}` as
        | 'marginTop'
        | 'marginRight'
        | 'marginBottom'
        | 'marginLeft';
      onUpdateElement(element.id, { [key]: val });
    }
  };

  const handlePaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    if (isPaddingLinked) {
      onUpdateElement(element.id, {
        paddingTop: val,
        paddingRight: val,
        paddingBottom: val,
        paddingLeft: val,
        padding: val
      });
    } else {
      const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}` as
        | 'paddingTop'
        | 'paddingRight'
        | 'paddingBottom'
        | 'paddingLeft';
      onUpdateElement(element.id, { [key]: val, padding: undefined });
    }
  };

  // Border helpers
  const currentBorderStyle = element.borderStyle || 'none';
  const currentBorderWidth = element.borderWidth ?? 0;
  const currentBorderColor = element.borderColor || settings.accentColor || '#D97706';
  const currentBorderRadius = element.borderRadius ?? 0;

  // Background & Shadow
  const currentBgColor = element.backgroundColor || 'transparent';
  const currentBgGradient = element.backgroundGradient || 'none';
  const currentBoxShadow = element.boxShadow || 'none';
  const currentOpacity = element.opacity ?? 1;
  const currentRotation = element.rotation ?? 0;

  const gradientPresets = [
    { label: 'None', val: 'none' },
    { label: '24K Gold Shimmer', val: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.3) 100%)' },
    { label: 'Imperial Gold Solid', val: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)' },
    { label: 'Midnight Navy', val: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.95) 100%)' },
    { label: 'Royal Crimson', val: 'linear-gradient(135deg, rgba(153, 27, 27, 0.15) 0%, rgba(185, 28, 28, 0.35) 100%)' },
    { label: 'Emerald Seal', val: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(4, 120, 87, 0.3) 100%)' },
    { label: 'Soft Alabaster', val: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)' }
  ];

  const shadowPresets = [
    { label: 'None', val: 'none' },
    { label: 'Subtle 3D', val: '0 2px 4px rgba(0, 0, 0, 0.08)' },
    { label: 'Medium Float', val: '0 8px 16px -2px rgba(0, 0, 0, 0.15)' },
    { label: '24K Gold Glow', val: '0 0 16px rgba(245, 158, 11, 0.45)' },
    { label: 'Heavy Executive', val: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' },
    { label: 'Letterpress Inset', val: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)' }
  ];

  const textShadowPresets = [
    { label: 'None', val: 'none' },
    { label: 'Soft Contrast', val: '0 1px 2px rgba(0, 0, 0, 0.2)' },
    { label: '24K Gold Foil Glow', val: '0 0 8px rgba(245, 158, 11, 0.6)' },
    { label: 'Crisp Roman Drop', val: '1px 1px 0 rgba(0, 0, 0, 0.4)' },
    { label: 'Deep Letterpress', val: '0 2px 4px rgba(0, 0, 0, 0.5)' }
  ];

  return (
    <div className="space-y-3 text-xs select-none">
      {/* 1. TYPOGRAPHY SECTION */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('typography')}
          className="w-full p-2.5 bg-slate-900/90 flex items-center justify-between font-bold text-slate-200 hover:text-white transition"
        >
          <div className="flex items-center gap-2 text-sky-400">
            <Type className="w-4 h-4" />
            <span className="text-white text-xs">Typography & Text Effects</span>
          </div>
          {openSections.typography ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {openSections.typography && (
          <div className="p-3 space-y-3 border-t border-slate-800/80">
            {/* Font Family */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Font Family</label>
              <select
                value={currentFont}
                onChange={(e) => onUpdateElement(element.id, { fontFamily: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="'Playfair Display', Georgia, serif">Playfair Display (Luxury Serif)</option>
                <option value="'Cinzel', Georgia, serif">Cinzel (Imperial Roman Classical)</option>
                <option value="'Plus Jakarta Sans', Arial, sans-serif">Plus Jakarta Sans (Modern Clean)</option>
                <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond (Graceful Editorial)</option>
                <option value="'Montserrat', sans-serif">Montserrat (Geometric Bold)</option>
                <option value="'Great Vibes', cursive">Great Vibes (Calligraphic Script)</option>
                <option value="'Amiri', 'Traditional Arabic', serif">Amiri (Traditional Arabic)</option>
                <option value="monospace">Monospace (Serial & Security Code)</option>
              </select>
            </div>

            {/* Font Size & Weight row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Size</span>
                  <span className="font-mono text-sky-400">{currentSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="96"
                  value={currentSize}
                  onChange={(e) => onUpdateElement(element.id, { fontSize: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Weight</label>
                <select
                  value={String(currentWeight)}
                  onChange={(e) => onUpdateElement(element.id, { fontWeight: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-hidden"
                >
                  <option value="300">300 - Light</option>
                  <option value="400">400 - Regular</option>
                  <option value="500">500 - Medium</option>
                  <option value="600">600 - Semi-Bold</option>
                  <option value="700">700 - Bold</option>
                  <option value="900">900 - Black</option>
                </select>
              </div>
            </div>

            {/* Text Color & Style (Italic / Underline) */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Text Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={currentTextColor}
                    onChange={(e) => onUpdateElement(element.id, { textColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTextColor}
                    onChange={(e) => onUpdateElement(element.id, { textColor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Style & Decor</label>
                <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(element.id, {
                        fontStyle: currentStyle === 'italic' ? 'normal' : 'italic'
                      })
                    }
                    className={`flex-1 py-1 rounded text-xs font-serif font-bold italic transition ${
                      currentStyle === 'italic' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(element.id, {
                        textDecoration: currentDecoration === 'underline' ? 'none' : 'underline'
                      })
                    }
                    className={`flex-1 py-1 rounded text-xs underline font-bold transition ${
                      currentDecoration === 'underline' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Underline"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(element.id, {
                        textTransform: currentTransform === 'uppercase' ? 'none' : 'uppercase'
                      })
                    }
                    className={`flex-1 py-1 rounded text-xs font-bold transition ${
                      currentTransform === 'uppercase' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="UPPERCASE"
                  >
                    AA
                  </button>
                </div>
              </div>
            </div>

            {/* Letter Spacing & Line Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Spacing</span>
                  <span className="font-mono text-sky-400">{currentLetterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="16"
                  step="0.5"
                  value={currentLetterSpacing}
                  onChange={(e) => onUpdateElement(element.id, { letterSpacing: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Line Height</span>
                  <span className="font-mono text-sky-400">{currentLineHeight}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={currentLineHeight}
                  onChange={(e) => onUpdateElement(element.id, { lineHeight: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>

            {/* Text Shadow Preset */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Text Shadow Glow</label>
              <select
                value={currentTextShadow}
                onChange={(e) => onUpdateElement(element.id, { textShadow: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-hidden"
              >
                {textShadowPresets.map((sp) => (
                  <option key={sp.label} value={sp.val}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. BOX MODEL (MARGINS & PADDING) */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('boxModel')}
          className="w-full p-2.5 bg-slate-900/90 flex items-center justify-between font-bold text-slate-200 hover:text-white transition"
        >
          <div className="flex items-center gap-2 text-amber-400">
            <Box className="w-4 h-4" />
            <span className="text-white text-xs">Box Model (Margins & Padding)</span>
          </div>
          {openSections.boxModel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {openSections.boxModel && (
          <div className="p-3 space-y-3.5 border-t border-slate-800/80">
            {/* Margins */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  Margin (px)
                </span>
                <button
                  type="button"
                  onClick={() => setIsMarginLinked(!isMarginLinked)}
                  className={`p-1 rounded text-[11px] flex items-center gap-1 transition ${
                    isMarginLinked ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={isMarginLinked ? 'Linked values (All sides sync)' : 'Unlinked values (Individual sides)'}
                >
                  {isMarginLinked ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                  <span className="text-[10px]">{isMarginLinked ? 'Linked' : 'Custom'}</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div>
                  <input
                    type="number"
                    value={mTop}
                    onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Top</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={mRight}
                    onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Right</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={mBottom}
                    onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Bottom</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={mLeft}
                    onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Left</span>
                </div>
              </div>
            </div>

            {/* Padding */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  Padding (px)
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaddingLinked(!isPaddingLinked)}
                  className={`p-1 rounded text-[11px] flex items-center gap-1 transition ${
                    isPaddingLinked ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={isPaddingLinked ? 'Linked values (All sides sync)' : 'Unlinked values (Individual sides)'}
                >
                  {isPaddingLinked ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                  <span className="text-[10px]">{isPaddingLinked ? 'Linked' : 'Custom'}</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div>
                  <input
                    type="number"
                    value={pTop}
                    onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Top</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={pRight}
                    onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Right</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={pBottom}
                    onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Bottom</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={pLeft}
                    onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Left</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BORDERS & CORNERS */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('borders')}
          className="w-full p-2.5 bg-slate-900/90 flex items-center justify-between font-bold text-slate-200 hover:text-white transition"
        >
          <div className="flex items-center gap-2 text-rose-400">
            <Maximize2 className="w-4 h-4" />
            <span className="text-white text-xs">Borders & Corner Radius</span>
          </div>
          {openSections.borders ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {openSections.borders && (
          <div className="p-3 space-y-3 border-t border-slate-800/80">
            {/* Border Style */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Border Style</label>
                <select
                  value={currentBorderStyle}
                  onChange={(e) => onUpdateElement(element.id, { borderStyle: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-hidden"
                >
                  <option value="none">None</option>
                  <option value="solid">Solid Line</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double Luxury</option>
                  <option value="groove">Groove 3D</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Width</span>
                  <span className="font-mono text-rose-400">{currentBorderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={currentBorderWidth}
                  onChange={(e) => onUpdateElement(element.id, { borderWidth: Number(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            {/* Border Color */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Border Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentBorderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={currentBorderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="font-semibold">Corner Radius (Curvature)</span>
                <span className="font-mono text-rose-400">{currentBorderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={currentBorderRadius}
                onChange={(e) => onUpdateElement(element.id, { borderRadius: Number(e.target.value) })}
                className="w-full accent-rose-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[0, 4, 8, 16, 24, 999].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onUpdateElement(element.id, { borderRadius: r })}
                    className="flex-1 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 font-mono"
                  >
                    {r === 999 ? 'Pill' : `${r}px`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. BACKGROUND & VISUAL EFFECTS */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('background')}
          className="w-full p-2.5 bg-slate-900/90 flex items-center justify-between font-bold text-slate-200 hover:text-white transition"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Palette className="w-4 h-4" />
            <span className="text-white text-xs">Background, Gradients & Shadows</span>
          </div>
          {openSections.background ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {openSections.background && (
          <div className="p-3 space-y-3 border-t border-slate-800/80">
            {/* Background Color */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentBgColor.startsWith('#') ? currentBgColor : '#ffffff'}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="transparent or #ffffff"
                  value={currentBgColor}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => onUpdateElement(element.id, { backgroundColor: 'transparent' })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Gradient Preset */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">CSS Gradient Fill</label>
              <select
                value={currentBgGradient}
                onChange={(e) => onUpdateElement(element.id, { backgroundGradient: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-hidden"
              >
                {gradientPresets.map((gp) => (
                  <option key={gp.label} value={gp.val}>
                    {gp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Box Shadow Preset */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Box Shadow Effect</label>
              <select
                value={currentBoxShadow}
                onChange={(e) => onUpdateElement(element.id, { boxShadow: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-hidden"
              >
                {shadowPresets.map((sp) => (
                  <option key={sp.label} value={sp.val}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Element Opacity & Rotation */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Opacity</span>
                  <span className="font-mono text-purple-400">{Math.round(currentOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={currentOpacity}
                  onChange={(e) => onUpdateElement(element.id, { opacity: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-semibold">Rotation</span>
                  <span className="font-mono text-purple-400">{currentRotation}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={currentRotation}
                  onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
