import React from 'react';
import { CertificateColors } from '../../types';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorPaletteSelectorProps {
  colors?: CertificateColors;
  onChange: (colors: CertificateColors) => void;
  templateType?: string;
}

interface PresetTheme {
  name: string;
  badgeColor: string;
  colors: CertificateColors;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    name: 'Warwick Royal Navy & Gold',
    badgeColor: '#0b1b2d',
    colors: {
      primaryColor: '#0b1b2d',
      accentColor: '#c4972a',
      borderColor: '#c4972a',
      backgroundColor: '#ffffff',
      textColor: '#1e293b'
    }
  },
  {
    name: 'Emerald & Warm Gold',
    badgeColor: '#0c3823',
    colors: {
      primaryColor: '#0c3823',
      accentColor: '#d4af37',
      borderColor: '#d4af37',
      backgroundColor: '#fbfdfc',
      textColor: '#153322'
    }
  },
  {
    name: 'Imperial Burgundy & Champagne',
    badgeColor: '#4a0e17',
    colors: {
      primaryColor: '#4a0e17',
      accentColor: '#dfba73',
      borderColor: '#dfba73',
      backgroundColor: '#fefcfb',
      textColor: '#331317'
    }
  },
  {
    name: 'Midnight & Platinum',
    badgeColor: '#111827',
    colors: {
      primaryColor: '#111827',
      accentColor: '#94a3b8',
      borderColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    }
  },
  {
    name: 'Sapphire & Amber',
    badgeColor: '#1e3a8a',
    colors: {
      primaryColor: '#1e3a8a',
      accentColor: '#d97706',
      borderColor: '#d97706',
      backgroundColor: '#ffffff',
      textColor: '#1e293b'
    }
  }
];

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  colors,
  onChange,
  templateType = 'employee_of_month'
}) => {
  const currentColors: CertificateColors = {
    primaryColor: colors?.primaryColor || (templateType === 'appreciation' ? '#142638' : '#0b1b2d'),
    accentColor: colors?.accentColor || (templateType === 'appreciation' ? '#d4af37' : '#c4972a'),
    borderColor: colors?.borderColor || (templateType === 'appreciation' ? '#1e293b' : '#c4972a'),
    backgroundColor: colors?.backgroundColor || '#ffffff',
    textColor: colors?.textColor || '#1e293b'
  };

  const handleColorChange = (key: keyof CertificateColors, value: string) => {
    onChange({
      ...currentColors,
      [key]: value
    });
  };

  const handleReset = () => {
    onChange(PRESET_THEMES[0].colors);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-slate-800">Custom Color System</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          title="Reset to default palette"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Theme Chips */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Preset Luxury Themes</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_THEMES.map((theme) => {
            const isActive = currentColors.primaryColor === theme.colors.primaryColor &&
                             currentColors.accentColor === theme.colors.accentColor;
            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => onChange(theme.colors)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                  isActive
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex -space-x-1 shrink-0">
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: theme.colors.primaryColor }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: theme.colors.accentColor }}
                  />
                </div>
                <span className="truncate font-medium text-slate-700">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Color Pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Primary Tone</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColors.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-xs font-mono text-slate-700 uppercase">{currentColors.primaryColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Accent Gold</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColors.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
              className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-xs font-mono text-slate-700 uppercase">{currentColors.accentColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Border Frame</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColors.borderColor}
              onChange={(e) => handleColorChange('borderColor', e.target.value)}
              className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-xs font-mono text-slate-700 uppercase">{currentColors.borderColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColors.textColor}
              onChange={(e) => handleColorChange('textColor', e.target.value)}
              className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-xs font-mono text-slate-700 uppercase">{currentColors.textColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
