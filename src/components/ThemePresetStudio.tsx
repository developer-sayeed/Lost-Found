import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  Sun,
  Moon,
  Monitor,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sliders,
  Type,
  Contrast,
  CheckCircle2,
  BookmarkPlus,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  Wand2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ThemePreset } from '../types';
import {
  DEFAULT_THEME_PRESETS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  calculateHoverColor,
  getContrastTextColor,
  applyDynamicTheme,
  ThemePresetManager
} from '../lib/themeEngine';

const PRIMARY_COLOR_PRESETS = [
  { hex: '#0f172a', name: 'Slate Navy (Default)' },
  { hex: '#1e1b4b', name: 'Royal Indigo' },
  { hex: '#064e3b', name: 'Emerald Green' },
  { hex: '#18181b', name: 'Rich Charcoal' },
  { hex: '#31103f', name: 'Imperial Plum' },
  { hex: '#1e293b', name: 'Midnight Steel' }
];

const SECONDARY_COLOR_PRESETS = [
  { hex: '#4f46e5', name: 'Indigo (Default)' },
  { hex: '#2563eb', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald Mint' },
  { hex: '#7c3aed', name: 'Vibrant Violet' },
  { hex: '#d97706', name: 'Warm Amber' },
  { hex: '#e11d48', name: 'Rose Red' }
];

export const ThemePresetStudio: React.FC = () => {
  const { settings, updateSettings, isSyncing } = useApp();
  const { user } = useAuth();

  // Local theme state initialized from settings
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'Plus Jakarta Sans');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || '#4f46e5');
  const [buttonColor, setButtonColor] = useState(settings.buttonColor || '#4f46e5');
  const [buttonHoverColor, setButtonHoverColor] = useState(
    settings.buttonHoverColor || calculateHoverColor(settings.buttonColor || '#4f46e5')
  );
  const [buttonTextColor, setButtonTextColor] = useState(
    settings.buttonTextColor || getContrastTextColor(settings.buttonColor || '#4f46e5')
  );
  const [headingColor, setHeadingColor] = useState(settings.headingColor || '#0f172a');
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#059669');
  const [buttonRadius, setButtonRadius] = useState(settings.buttonRadius || 'rounded-xl');
  const [activePresetId, setActivePresetId] = useState(settings.activePresetId || 'preset-royal-navy');
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>(settings.customPresets || []);
  const [customColors, setCustomColors] = useState<string[]>(
    settings.customColors && settings.customColors.length > 0
      ? settings.customColors
      : ['#0284c7', '#0d9488', '#ea580c', '#8b5cf6', '#d97706', '#ec4899']
  );
  const [newCustomHex, setNewCustomHex] = useState('#0284c7');

  // UI state
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    settings.themeMode || (settings.isDarkMode ? 'dark' : 'light')
  );
  const [isDarkMode, setIsDarkMode] = useState(Boolean(settings.isDarkMode));
  const [presetFilter, setPresetFilter] = useState<'all' | 'luxury' | 'modern' | 'heritage' | 'custom'>('all');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeSuccessNotice, setThemeSuccessNotice] = useState<string | null>(null);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [previewHoverActive, setPreviewHoverActive] = useState(false);

  // Synchronize when settings change from remote
  useEffect(() => {
    setFontFamily(settings.fontFamily || 'Plus Jakarta Sans');
    setPrimaryColor(settings.primaryColor || '#0f172a');
    setSecondaryColor(settings.secondaryColor || '#4f46e5');
    setButtonColor(settings.buttonColor || '#4f46e5');
    setButtonHoverColor(settings.buttonHoverColor || calculateHoverColor(settings.buttonColor || '#4f46e5'));
    setButtonTextColor(settings.buttonTextColor || getContrastTextColor(settings.buttonColor || '#4f46e5'));
    setHeadingColor(settings.headingColor || '#0f172a');
    setAccentColor(settings.accentColor || '#059669');
    setButtonRadius(settings.buttonRadius || 'rounded-xl');
    setActivePresetId(settings.activePresetId || 'preset-royal-navy');
    setCustomPresets(settings.customPresets || []);
    if (settings.customColors && settings.customColors.length > 0) {
      setCustomColors(settings.customColors);
    }
    setThemeMode(settings.themeMode || (settings.isDarkMode ? 'dark' : 'light'));
    setIsDarkMode(Boolean(settings.isDarkMode));
  }, [settings]);

  // Retrieve all presets using ThemePresetManager (memoized to prevent re-creation loops)
  const allPresets = useMemo(
    () => ThemePresetManager.getAllPresets(settings),
    [settings?.customPresets]
  );

  // Filter presets based on selected category
  const filteredPresets = allPresets.filter(preset => {
    if (!preset) return false;
    if (presetFilter === 'all') return true;
    if (presetFilter === 'custom') return Boolean(preset.isCustom);
    const badge = (preset.badge || '').toLowerCase();
    const name = (preset.name || '').toLowerCase();
    const desc = (preset.description || '').toLowerCase();
    if (presetFilter === 'luxury') return badge.includes('luxury') || badge.includes('royal') || name.includes('luxury') || desc.includes('luxury');
    if (presetFilter === 'modern') return badge.includes('modern') || badge.includes('executive') || badge.includes('nordic') || name.includes('modern') || badge.includes('tech');
    if (presetFilter === 'heritage') return badge.includes('heritage') || badge.includes('warm') || badge.includes('gulf') || name.includes('heritage') || badge.includes('saudi');
    return true;
  });

  // Handle instant theme mode toggle
  const handleInstantThemeModeChange = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    const darkEnabled = mode === 'dark';
    setIsDarkMode(darkEnabled);
    await updateSettings({
      themeMode: mode,
      isDarkMode: darkEnabled
    });
  };

  // Handle Preset selection with immediate live DOM styling via ThemePresetManager & applyDynamicTheme
  const handleSelectPreset = async (preset: ThemePreset, saveImmediately: boolean = false) => {
    setActivePresetId(preset.id);
    setFontFamily(preset.fontFamily);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setButtonColor(preset.buttonColor);
    setButtonHoverColor(preset.buttonHoverColor);
    setButtonTextColor(preset.buttonTextColor);
    setHeadingColor(preset.headingColor);
    setAccentColor(preset.accentColor);
    setButtonRadius(preset.buttonRadius);

    // Dynamic application via ThemePresetManager (which internally executes applyDynamicTheme)
    const { updatedSettings } = ThemePresetManager.switchPreset(settings, preset.id, { autoApplyDOM: true });

    if (saveImmediately) {
      setIsSavingTheme(true);
      try {
        await updateSettings(updatedSettings);
        setThemeSuccessNotice(`Preset "${preset.name}" applied & synchronized globally!`);
        setTimeout(() => setThemeSuccessNotice(null), 4000);
      } finally {
        setIsSavingTheme(false);
      }
    } else {
      setThemeSuccessNotice(`Live preview active for "${preset.name}". Click "Save & Sync Theme" to keep!`);
      setTimeout(() => setThemeSuccessNotice(null), 5000);
    }
  };

  // Handle live incremental property adjustments with instant feedback
  const handleLiveColorChange = (
    field: 'primary' | 'secondary' | 'button' | 'buttonHover' | 'buttonText' | 'heading' | 'accent' | 'font' | 'radius',
    value: string
  ) => {
    let nextPrimary = primaryColor;
    let nextSecondary = secondaryColor;
    let nextButton = buttonColor;
    let nextHover = buttonHoverColor;
    let nextText = buttonTextColor;
    let nextHeading = headingColor;
    let nextAccent = accentColor;
    let nextFont = fontFamily;
    let nextRadius = buttonRadius;

    if (field === 'primary') { setPrimaryColor(value); nextPrimary = value; }
    if (field === 'secondary') { setSecondaryColor(value); nextSecondary = value; }
    if (field === 'button') {
      setButtonColor(value);
      nextButton = value;
      // Auto-compute default hover and readable text contrast
      const autoHover = calculateHoverColor(value);
      const autoText = getContrastTextColor(value);
      setButtonHoverColor(autoHover);
      setButtonTextColor(autoText);
      nextHover = autoHover;
      nextText = autoText;
    }
    if (field === 'buttonHover') { setButtonHoverColor(value); nextHover = value; }
    if (field === 'buttonText') { setButtonTextColor(value); nextText = value; }
    if (field === 'heading') { setHeadingColor(value); nextHeading = value; }
    if (field === 'accent') { setAccentColor(value); nextAccent = value; }
    if (field === 'font') { setFontFamily(value); nextFont = value; }
    if (field === 'radius') { setButtonRadius(value); nextRadius = value; }

    setActivePresetId('custom-active');

    applyDynamicTheme({
      primaryColor: nextPrimary,
      secondaryColor: nextSecondary,
      buttonColor: nextButton,
      buttonHoverColor: nextHover,
      buttonTextColor: nextText,
      headingColor: nextHeading,
      accentColor: nextAccent,
      fontFamily: nextFont,
      buttonRadius: nextRadius,
      activePresetId: 'custom-active'
    });
  };

  // Auto-calculate hover color from button color
  const handleAutoCalculateHover = () => {
    const computedHover = calculateHoverColor(buttonColor);
    setButtonHoverColor(computedHover);
    handleLiveColorChange('buttonHover', computedHover);
  };

  // Save all current theme customizer settings to server
  const handleSaveAllSettings = async () => {
    setIsSavingTheme(true);
    setThemeSuccessNotice(null);
    try {
      await updateSettings({
        fontFamily,
        primaryColor,
        secondaryColor,
        buttonColor,
        buttonHoverColor,
        buttonTextColor,
        headingColor,
        accentColor,
        buttonRadius,
        activePresetId,
        customPresets,
        customColors,
        themeMode,
        isDarkMode
      });
      setThemeSuccessNotice('All theme customizations & button styles saved and synchronized!');
      setTimeout(() => setThemeSuccessNotice(null), 4500);
    } catch (err: any) {
      setThemeSuccessNotice('Failed to save settings: ' + (err.message || 'Error'));
    } finally {
      setIsSavingTheme(false);
    }
  };

  // Reset to default theme preset
  const handleResetToDefault = async () => {
    const defaultPreset = DEFAULT_THEME_PRESETS[0];
    await handleSelectPreset(defaultPreset, true);
  };

  // Save current styling as a new Custom Preset via ThemePresetManager
  const handleSaveAsCustomPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const { updatedSettings, newPreset } = ThemePresetManager.savePreset(settings, {
      name: newPresetName.trim(),
      description: `Custom preset created by ${user?.name || 'Administrator'}`,
      badge: 'Custom',
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonHoverColor,
      buttonTextColor,
      headingColor,
      accentColor,
      fontFamily,
      buttonRadius
    });

    setCustomPresets(updatedSettings.customPresets || []);
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowSavePresetModal(false);

    await updateSettings(updatedSettings);

    setThemeSuccessNotice(`Preset "${newPreset.name}" created and saved to preset library!`);
    setTimeout(() => setThemeSuccessNotice(null), 4000);
  };

  // Delete a custom preset via ThemePresetManager
  const handleDeleteCustomPreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { updatedSettings, success } = ThemePresetManager.deletePreset(settings, presetId);
    if (success) {
      setCustomPresets(updatedSettings.customPresets || []);
      if (updatedSettings.activePresetId) {
        setActivePresetId(updatedSettings.activePresetId);
      }
      await updateSettings(updatedSettings);
      setThemeSuccessNotice('Custom preset removed from library.');
      setTimeout(() => setThemeSuccessNotice(null), 3000);
    }
  };

  // Custom colors palette management
  const handleAddCustomColor = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    if (!customColors.includes(formatted)) {
      const updated = [...customColors, formatted];
      setCustomColors(updated);
      updateSettings({ customColors: updated });
    }
  };

  const handleRemoveCustomColor = (hex: string) => {
    const cleanHex = (hex || '').toLowerCase();
    const updated = customColors.filter(c => (c || '').toLowerCase() !== cleanHex);
    setCustomColors(updated);
    updateSettings({ customColors: updated });
  };

  // Find active preset metadata for header badge
  const currentActivePreset = allPresets.find(p => p.id === activePresetId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER ACTION & LIVE STATUS BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Custom Color Themes & Presets</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Live Dynamic Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select pre-configured luxury palettes or dynamically calibrate buttons, hover states, fonts, and accents in real time.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-save-as-custom-preset"
              onClick={() => setShowSavePresetModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save Current as Preset</span>
            </button>

            <button
              type="button"
              id="btn-reset-theme-default"
              onClick={handleResetToDefault}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
              title="Revert to Royal Warwick default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              id="btn-save-theme-global"
              disabled={isSavingTheme || isSyncing}
              onClick={handleSaveAllSettings}
              className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingTheme || isSyncing ? 'Synchronizing...' : 'Save & Sync Theme'}</span>
            </button>
          </div>
        </div>

        {/* Live sync notification banner */}
        {themeSuccessNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{themeSuccessNotice}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Real-Time Sync Active</span>
          </div>
        )}

        {/* Current status pill */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Active Theme Preset:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              {currentActivePreset ? currentActivePreset.name : 'Customized Configuration'}
            </span>
            {currentActivePreset && (
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {currentActivePreset.badge}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Font: <strong className="text-slate-800">{fontFamily}</strong></span>
            <span>Button: <strong className="font-mono text-slate-800">{buttonColor}</strong></span>
            <span>Hover: <strong className="font-mono text-slate-800">{buttonHoverColor}</strong></span>
            <span>Radius: <strong className="text-slate-800">{buttonRadius}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DISPLAY CONTRAST MODE (LIGHT / HIGH-CONTRAST DARK / AUTO) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <Contrast className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Theme Appearance & Contrast Mode</h3>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            {themeMode === 'dark' ? 'Dark Mode Active' : themeMode === 'system' ? 'Auto Mode' : 'Light Mode Active'}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Switch between high-contrast dark theme and crisp light theme. Updates all CSS variables and UI elements in real time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Light Mode */}
          <button
            type="button"
            id="btn-mode-light"
            onClick={() => handleInstantThemeModeChange('light')}
            className={`p-4 rounded-xl text-left border transition-all ${
              themeMode === 'light'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
              {themeMode === 'light' && <Check className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-xs font-bold text-slate-900">Crisp Light Mode</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Warm slate neutrals with clean high-contrast daytime readability.
            </p>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            id="btn-mode-dark"
            onClick={() => handleInstantThemeModeChange('dark')}
            className={`p-4 rounded-xl text-left border transition-all ${
              themeMode === 'dark'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-xs">
                <Moon className="w-4 h-4" />
              </div>
              {themeMode === 'dark' && <Check className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-xs font-bold text-slate-900">High-Contrast Dark Theme</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Deep obsidian canvas with high-contrast text and glowing accents.
            </p>
          </button>

          {/* System Default */}
          <button
            type="button"
            id="btn-mode-system"
            onClick={() => handleInstantThemeModeChange('system')}
            className={`p-4 rounded-xl text-left border transition-all ${
              themeMode === 'system'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Monitor className="w-4 h-4" />
              </div>
              {themeMode === 'system' && <Check className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-xs font-bold text-slate-900">System Match</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Automatically syncs with your operating system dark/light preference.
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRE-CONFIGURED LUXURY COLOR THEMES & PRESETS LIBRARY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold">Default Theme Presets</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any pre-configured luxury bundle. Includes button action color, button hover color, text contrast, and font styling.
            </p>
          </div>

          {/* Preset Category Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPresetFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                presetFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allPresets.length})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('luxury')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                presetFilter === 'luxury' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Luxury 5★
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('modern')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                presetFilter === 'modern' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('heritage')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                presetFilter === 'heritage' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heritage
            </button>
            {customPresets.length > 0 && (
              <button
                type="button"
                onClick={() => setPresetFilter('custom')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  presetFilter === 'custom' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom ({customPresets.length})
              </button>
            )}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset, false)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Preset Header: Name and Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                      {preset.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                          {preset.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {preset.isCustom && (
                        <button
                          type="button"
                          onClick={e => handleDeleteCustomPreset(preset.id, e)}
                          title="Delete Custom Preset"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isActive && (
                        <div className="flex items-center space-x-1 text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                          <Check className="w-3 h-3 text-indigo-600" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {preset.description}
                  </p>

                  {/* Swatches chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Brand Palette:</span>
                      <span className="font-mono">{preset.buttonColor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Primary */}
                      <div className="text-center" title={`Primary: ${preset.primaryColor}`}>
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                      </div>
                      {/* Secondary */}
                      <div className="text-center" title={`Secondary: ${preset.secondaryColor}`}>
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                      </div>
                      {/* Button Action */}
                      <div className="text-center" title={`Button Action: ${preset.buttonColor}`}>
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs ring-1 ring-slate-400/30"
                          style={{ backgroundColor: preset.buttonColor }}
                        />
                      </div>
                      {/* Button Hover */}
                      <div className="text-center" title={`Button Hover: ${preset.buttonHoverColor}`}>
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: preset.buttonHoverColor }}
                        />
                      </div>
                      {/* Accent */}
                      <div className="text-center" title={`Accent: ${preset.accentColor}`}>
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font and Radius tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium">
                      Font: {preset.fontFamily}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium">
                      Radius: {preset.buttonRadius.replace('rounded-', '')}
                    </span>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isActive ? 'Currently Active' : 'Click to preview'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(preset, true);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shadow-2xs ${
                      isActive
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isActive ? 'Saved Active' : 'Apply & Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEEP DYNAMIC THEME CUSTOMIZER (BUTTONS, HOVER, FONTS, COLORS) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Deep Dynamic Theme Customizer</h3>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Live updates DOM & CSS variables
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Fine-tune individual button colors, button hover states, text colors, fonts, and corner radii. All changes are dynamically applied immediately.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* SECTION A: BUTTON ACTION COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Button Action Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Controls primary buttons across all dialogs and views
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={e => handleLiveColorChange('button', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  title="Pick button color"
                />
                <input
                  type="text"
                  value={buttonColor}
                  onChange={e => handleLiveColorChange('button', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Quick palette pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SECONDARY_COLOR_PRESETS.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => handleLiveColorChange('button', c.hex)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                    (buttonColor || '').toLowerCase() === (c.hex || '').toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {(buttonColor || '').toLowerCase() === (c.hex || '').toLowerCase() && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION B: BUTTON HOVER COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Button Hover Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Appears when staff hovers the cursor over primary buttons
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={buttonHoverColor}
                  onChange={e => handleLiveColorChange('buttonHover', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  title="Pick hover color"
                />
                <input
                  type="text"
                  value={buttonHoverColor}
                  onChange={e => handleLiveColorChange('buttonHover', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">Need an optimal shade?</span>
              <button
                type="button"
                id="btn-auto-hover"
                onClick={handleAutoCalculateHover}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-all shadow-2xs"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Calculate Optimal Hover</span>
              </button>
            </div>
          </div>

          {/* SECTION C: BUTTON TEXT COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Button Text Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Typography color inside buttons for maximum contrast
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={buttonTextColor}
                  onChange={e => handleLiveColorChange('buttonText', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={buttonTextColor}
                  onChange={e => handleLiveColorChange('buttonText', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handleLiveColorChange('buttonText', '#FFFFFF')}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  buttonTextColor.toUpperCase() === '#FFFFFF'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                <span>Pure White (#FFFFFF)</span>
              </button>

              <button
                type="button"
                onClick={() => handleLiveColorChange('buttonText', '#0F172A')}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  buttonTextColor.toUpperCase() === '#0F172A'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
                <span>Deep Slate (#0F172A)</span>
              </button>
            </div>
          </div>

          {/* SECTION D: BUTTON CORNER RADIUS */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="text-xs font-bold text-slate-900 block">
                Button Corner Radius
              </label>
              <span className="text-[11px] text-slate-500">
                Determines curvature of action buttons across the interface
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {RADIUS_OPTIONS.map(r => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handleLiveColorChange('radius', r.id)}
                  className={`px-3 py-2 text-xs font-medium border text-center transition-all ${
                    buttonRadius === r.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  } ${r.class}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION E: PRIMARY THEME COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Primary Brand Surface Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Headers, brand highlights, and focus borders
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => handleLiveColorChange('primary', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => handleLiveColorChange('primary', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRIMARY_COLOR_PRESETS.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => handleLiveColorChange('primary', c.hex)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                    (primaryColor || '').toLowerCase() === (c.hex || '').toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {(primaryColor || '').toLowerCase() === (c.hex || '').toLowerCase() && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION F: SECONDARY ACCENT COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Secondary Accent Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Active navigation tabs, status badges, and pills
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => handleLiveColorChange('secondary', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={e => handleLiveColorChange('secondary', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {SECONDARY_COLOR_PRESETS.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => handleLiveColorChange('secondary', c.hex)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                    (secondaryColor || '').toLowerCase() === (c.hex || '').toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {(secondaryColor || '').toLowerCase() === (c.hex || '').toLowerCase() && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION G: HEADING COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Headings Typography Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Page titles, card headers, and modal typography
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={headingColor}
                  onChange={e => handleLiveColorChange('heading', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={headingColor}
                  onChange={e => handleLiveColorChange('heading', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-studio-heading-white"
                onClick={() => handleLiveColorChange('heading', '#ffffff')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  (headingColor || '').toLowerCase() === '#ffffff'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
                title="White (#ffffff)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
                <span>White (#ffffff)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLiveColorChange('heading', '#0f172a')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs"
              >
                Slate Dark (#0f172a)
              </button>
              <button
                type="button"
                onClick={() => handleLiveColorChange('heading', '#18181b')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs"
              >
                Charcoal (#18181b)
              </button>
              <button
                type="button"
                onClick={() => handleLiveColorChange('heading', '#1e1b4b')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs"
              >
                Royal Indigo (#1e1b4b)
              </button>
            </div>
          </div>

          {/* SECTION H: ACCENT INDICATOR COLOR */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Accent Indicator Color
                </label>
                <span className="text-[11px] text-slate-500">
                  Counters, live markers, and status indicators
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => handleLiveColorChange('accent', e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={e => handleLiveColorChange('accent', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handleLiveColorChange('accent', '#059669')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-slate-50 shadow-2xs"
              >
                Emerald (#059669)
              </button>
              <button
                type="button"
                onClick={() => handleLiveColorChange('accent', '#d97706')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-amber-700 hover:bg-slate-50 shadow-2xs"
              >
                Amber (#d97706)
              </button>
              <button
                type="button"
                onClick={() => handleLiveColorChange('accent', '#0284c7')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-sky-700 hover:bg-slate-50 shadow-2xs"
              >
                Sky Blue (#0284c7)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TYPOGRAPHY & FONT FAMILY SELECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <Type className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Typography & Font Family</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Current: {fontFamily}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Select a font family for the hotel portal. Dynamically alters headings, body copy, and dialogs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {FONT_OPTIONS.map(font => {
            const isFontActive = (fontFamily || '').toLowerCase() === (font.id || '').toLowerCase();
            return (
              <button
                type="button"
                key={font.id}
                onClick={() => handleLiveColorChange('font', font.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isFontActive
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-sm font-bold text-slate-900"
                    style={{ fontFamily: `"${font.id}", sans-serif` }}
                  >
                    {font.name}
                  </span>
                  {isFontActive && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  {font.desc}
                </p>
                <div
                  className="text-xs text-slate-700 mt-2 font-medium truncate"
                  style={{ fontFamily: `"${font.id}", sans-serif` }}
                >
                  Warwick Luxury Hospitality 12345
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CUSTOM BRAND PALETTE & COLOR PICKER */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span>Custom Color Palette</span>
              <span className="text-[10px] text-slate-400 font-normal">({customColors.length} saved)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Save reusable brand colors or hex codes and quickly assign them to buttons, primary surfaces, or accents.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={newCustomHex}
              onChange={e => setNewCustomHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              title="Pick custom color"
            />
            <input
              type="text"
              value={newCustomHex}
              onChange={e => setNewCustomHex(e.target.value)}
              placeholder="#0284c7"
              className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800"
            />
            <button
              type="button"
              onClick={() => handleAddCustomColor(newCustomHex)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Color</span>
            </button>
          </div>
        </div>

        {customColors.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {customColors.map(hex => (
              <div
                key={hex}
                className="group flex items-center space-x-2 p-1.5 pr-2 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs hover:bg-white transition-all"
              >
                <div
                  className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: hex }}
                />
                <span className="font-mono text-xs font-bold text-slate-700">
                  {hex}
                </span>

                <div className="flex items-center space-x-1 border-l border-slate-200 pl-1.5">
                  <button
                    type="button"
                    onClick={() => handleLiveColorChange('button', hex)}
                    title="Set as Button Color"
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-all"
                  >
                    Button
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveColorChange('primary', hex)}
                    title="Set as Primary Color"
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveColorChange('secondary', hex)}
                    title="Set as Accent Color"
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-all"
                  >
                    Accent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomColor(hex)}
                    title="Remove from palette"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE REAL-TIME TESTING SANDBOX */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Interactive Live Sandbox & Hover Tester</h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Dynamic DOM Active
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Hover over the action button below to test your button hover color and text contrast in real time before publishing.
        </p>

        {/* The Live Sandbox Card */}
        <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
              <div
                className="text-lg font-black tracking-tight"
                style={{ color: headingColor }}
              >
                {settings.hotelName || 'Warwick Hotels & Resorts'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Dynamic Font: <strong className="text-slate-800">{fontFamily}</strong> • Surface: <strong className="font-mono text-slate-800">{primaryColor}</strong>
              </div>
            </div>

            {/* Live Interactive Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                id="btn-live-preview-tester"
                onMouseEnter={() => setPreviewHoverActive(true)}
                onMouseLeave={() => setPreviewHoverActive(false)}
                className={`px-5 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center space-x-2 cursor-pointer ${buttonRadius}`}
                style={{
                  backgroundColor: previewHoverActive ? buttonHoverColor : buttonColor,
                  color: buttonTextColor
                }}
              >
                <span>Sample Action Button</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-white shadow-2xs"
                style={{ backgroundColor: secondaryColor }}
              >
                Accent Pill ({secondaryColor})
              </span>

              <span
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-white shadow-2xs"
                style={{ backgroundColor: accentColor }}
              >
                Status ({accentColor})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Normal State Action Button
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: buttonColor }}
                />
                <span className="font-mono text-xs font-bold text-slate-800">{buttonColor}</span>
                <span className="text-slate-400 text-[11px]">(Text: {buttonTextColor})</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hover State Action Button
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: buttonHoverColor }}
                />
                <span className="font-mono text-xs font-bold text-slate-800">{buttonHoverColor}</span>
                <span className="text-emerald-600 text-[11px] font-medium">✓ Active on mouseover</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. BOTTOM GLOBAL SAVE BAR */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <span>Ready to publish theme modifications?</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
              v{settings.version || 1}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Saves all button colors, hover shades, font family, and presets. Immediately syncs with all connected terminals.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            Revert to Default
          </button>

          <button
            type="button"
            id="btn-save-all-bottom"
            disabled={isSavingTheme || isSyncing}
            onClick={handleSaveAllSettings}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingTheme || isSyncing ? 'Saving & Synchronizing...' : 'Save & Publish Theme Globally'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW CUSTOM PRESET */}
      {/* ========================================================================= */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900">
                <BookmarkPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold">Save Current Styling as Preset</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This will capture your current button color, hover color, font family, corner radius, and accents into a reusable preset in your library.
            </p>

            <form onSubmit={handleSaveAsCustomPreset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Preset Name
                </label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="e.g. Al Baha Golden Oasis"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Preview chips */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-600">Preset Summary:</div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: primaryColor }} title="Primary" />
                  <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: secondaryColor }} title="Secondary" />
                  <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: buttonColor }} title="Button Action" />
                  <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: buttonHoverColor }} title="Button Hover" />
                  <span className="w-5 h-5 rounded-full shadow-2xs" style={{ backgroundColor: accentColor }} title="Accent" />
                  <span className="text-xs text-slate-500 pl-2 font-medium">• {fontFamily} • {buttonRadius}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preset to Library</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
