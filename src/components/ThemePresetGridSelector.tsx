import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Trash2,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Eye,
  ArrowRight,
  BookmarkPlus,
  Type,
  MousePointerClick,
  Undo2,
  RefreshCw,
  Hash,
  Layers,
  Sparkle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ThemePreset, HotelSettings, HeadingColorsConfig } from '../types';
import {
  DEFAULT_THEME_PRESETS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  calculateHoverColor,
  getContrastTextColor,
  applyDynamicTheme,
  getRadiusPixels,
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

const HEADING_COLOR_SWATCHES = [
  { hex: '#ffffff', label: 'Pure White' },
  { hex: '#f8fafc', label: 'Crisp Off-White' },
  { hex: '#f1f5f9', label: 'Bright Slate' },
  { hex: '#0f172a', label: 'Slate Navy' },
  { hex: '#1e1b4b', label: 'Royal Indigo' },
  { hex: '#064e3b', label: 'Deep Emerald' },
  { hex: '#831843', label: 'Crimson Wine' },
  { hex: '#78350f', label: 'Warm Bronze' },
  { hex: '#18181b', label: 'Rich Charcoal' },
  { hex: '#334155', label: 'Slate Grey' },
  { hex: '#4f46e5', label: 'Indigo Accent' },
  { hex: '#0284c7', label: 'Sapphire Blue' },
  { hex: '#059669', label: 'Teal Mint' },
  { hex: '#e11d48', label: 'Rose Red' },
  { hex: '#d97706', label: 'Warm Amber' }
];

function isLightColorHex(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return false;
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
}

interface ThemePresetGridSelectorProps {
  onPresetApplied?: (preset: ThemePreset) => void;
}

export const ThemePresetGridSelector: React.FC<ThemePresetGridSelectorProps> = ({
  onPresetApplied
}) => {
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

  // Custom Heading (H1-H6) Text Colors
  const [headingColors, setHeadingColors] = useState<HeadingColorsConfig>(() => ({
    h1: settings.headingColorH1 || settings.headingColors?.h1 || settings.headingColor || '#0f172a',
    h2: settings.headingColorH2 || settings.headingColors?.h2 || settings.headingColor || '#0f172a',
    h3: settings.headingColorH3 || settings.headingColors?.h3 || settings.headingColor || '#1e293b',
    h4: settings.headingColorH4 || settings.headingColors?.h4 || settings.headingColor || '#334155',
    h5: settings.headingColorH5 || settings.headingColors?.h5 || settings.headingColor || '#475569',
    h6: settings.headingColorH6 || settings.headingColors?.h6 || settings.headingColor || '#64748b'
  }));
  const [masterHeadingColorInput, setMasterHeadingColorInput] = useState('#0f172a');

  // Retrieve all presets using ThemePresetManager (memoized to prevent re-creation loops)
  const allPresets = useMemo(
    () => ThemePresetManager.getAllPresets(settings),
    [settings?.customPresets]
  );
  const currentActivePreset = useMemo(
    () => allPresets.find(p => p.id === activePresetId) || allPresets[0],
    [allPresets, activePresetId]
  );

  // Visual Preview Staging: Holds the currently selected style preset being previewed before official application
  const [selectedPresetForPreview, setSelectedPresetForPreview] = useState<ThemePreset>(
    currentActivePreset || DEFAULT_THEME_PRESETS[0]
  );
  const [isPreviewButtonHovered, setIsPreviewButtonHovered] = useState(false);
  const [previewTestClicks, setPreviewTestClicks] = useState(0);
  const [previewClickFeedback, setPreviewClickFeedback] = useState<string | null>(null);

  // UI state
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    settings.themeMode || (settings.isDarkMode ? 'dark' : 'light')
  );
  const [isDarkMode, setIsDarkMode] = useState(Boolean(settings.isDarkMode));
  const [presetFilter, setPresetFilter] = useState<'all' | 'luxury' | 'modern' | 'heritage' | 'custom'>('all');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [hoveredButtonPresetId, setHoveredButtonPresetId] = useState<string | null>(null);
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);
  const [showHeadingStudio, setShowHeadingStudio] = useState(true);

  // Sync local state whenever settings prop updates from remote
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

    setHeadingColors({
      h1: settings.headingColorH1 || settings.headingColors?.h1 || settings.headingColor || '#0f172a',
      h2: settings.headingColorH2 || settings.headingColors?.h2 || settings.headingColor || '#0f172a',
      h3: settings.headingColorH3 || settings.headingColors?.h3 || settings.headingColor || '#1e293b',
      h4: settings.headingColorH4 || settings.headingColors?.h4 || settings.headingColor || '#334155',
      h5: settings.headingColorH5 || settings.headingColors?.h5 || settings.headingColor || '#475569',
      h6: settings.headingColorH6 || settings.headingColors?.h6 || settings.headingColor || '#64748b'
    });
  }, [settings]);

  // Keep selectedPresetForPreview up to date with active theme when it matches and properties changed
  useEffect(() => {
    if (selectedPresetForPreview.id === activePresetId) {
      const active = allPresets.find(p => p.id === activePresetId);
      if (
        active &&
        (active.primaryColor !== selectedPresetForPreview.primaryColor ||
          active.secondaryColor !== selectedPresetForPreview.secondaryColor ||
          active.buttonColor !== selectedPresetForPreview.buttonColor ||
          active.buttonHoverColor !== selectedPresetForPreview.buttonHoverColor ||
          active.buttonTextColor !== selectedPresetForPreview.buttonTextColor ||
          active.headingColor !== selectedPresetForPreview.headingColor ||
          active.accentColor !== selectedPresetForPreview.accentColor ||
          active.fontFamily !== selectedPresetForPreview.fontFamily ||
          active.buttonRadius !== selectedPresetForPreview.buttonRadius ||
          active.name !== selectedPresetForPreview.name)
      ) {
        setSelectedPresetForPreview(active);
      }
    }
  }, [activePresetId, allPresets, selectedPresetForPreview]);

  // Filter presets based on selected category pill
  const filteredPresets = allPresets.filter(preset => {
    if (!preset) return false;
    if (presetFilter === 'all') return true;
    if (presetFilter === 'custom') return Boolean(preset.isCustom);
    const badge = (preset.badge || '').toLowerCase();
    const name = (preset.name || '').toLowerCase();
    const desc = (preset.description || '').toLowerCase();
    if (presetFilter === 'luxury')
      return (
        badge.includes('luxury') ||
        badge.includes('royal') ||
        name.includes('luxury') ||
        desc.includes('luxury') ||
        badge.includes('5★')
      );
    if (presetFilter === 'modern')
      return (
        badge.includes('modern') ||
        badge.includes('executive') ||
        badge.includes('nordic') ||
        name.includes('modern') ||
        badge.includes('tech')
      );
    if (presetFilter === 'heritage')
      return (
        badge.includes('heritage') ||
        badge.includes('warm') ||
        badge.includes('gulf') ||
        name.includes('heritage') ||
        badge.includes('saudi')
      );
    return true;
  });

  // Select a preset into the Visual Preview Card (Staging before applying)
  const handleSelectPresetForPreview = (preset: ThemePreset) => {
    setSelectedPresetForPreview(preset);
    setNoticeMessage(`Staged "${preset.name}" in visual preview card below. Click "Apply Preset Globally" to activate.`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Officially apply the staged preset to the application
  const handleApplyStagedPreset = async (presetToApply: ThemePreset = selectedPresetForPreview) => {
    await handleSwitchPreset(presetToApply, true);
  };

  // Revert staged preview back to the currently active applied preset
  const handleRevertStagedPreset = () => {
    setSelectedPresetForPreview(currentActivePreset);
    setNoticeMessage('Staged preview reset to active theme.');
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  // Switch preset handler using ThemePresetManager
  const handleSwitchPreset = async (preset: ThemePreset, autoPersist: boolean = true) => {
    setActivePresetId(preset.id);
    setSelectedPresetForPreview(preset);
    setFontFamily(preset.fontFamily);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setButtonColor(preset.buttonColor);
    setButtonHoverColor(preset.buttonHoverColor || calculateHoverColor(preset.buttonColor));
    setButtonTextColor(preset.buttonTextColor || getContrastTextColor(preset.buttonColor));
    setHeadingColor(preset.headingColor || preset.primaryColor);
    setAccentColor(preset.accentColor || preset.secondaryColor);
    setButtonRadius(preset.buttonRadius || 'rounded-xl');

    // Switch dynamically through ThemePresetManager (internally applies applyDynamicTheme)
    const { updatedSettings, appliedPreset } = ThemePresetManager.switchPreset(settings, preset.id, {
      autoApplyDOM: true
    });

    // Also preserve or merge heading colors
    const mergedSettings: Partial<HotelSettings> = {
      ...updatedSettings,
      headingColors,
      headingColorH1: headingColors.h1,
      headingColorH2: headingColors.h2,
      headingColorH3: headingColors.h3,
      headingColorH4: headingColors.h4,
      headingColorH5: headingColors.h5,
      headingColorH6: headingColors.h6
    };

    applyDynamicTheme(mergedSettings);

    if (autoPersist) {
      setIsSavingTheme(true);
      try {
        await updateSettings(mergedSettings);
        setNoticeMessage(`Applied and synchronized "${appliedPreset.name}" across all terminals!`);
        setTimeout(() => setNoticeMessage(null), 4000);
      } finally {
        setIsSavingTheme(false);
      }
    } else {
      setNoticeMessage(`Live preview active for "${appliedPreset.name}". Click "Save Theme & Sync" to persist.`);
      setTimeout(() => setNoticeMessage(null), 4000);
    }

    if (onPresetApplied) {
      onPresetApplied(appliedPreset);
    }
  };

  // Handler for testing button clicks on the live preview card
  const handleTestButtonClick = () => {
    const nextCount = previewTestClicks + 1;
    setPreviewTestClicks(nextCount);
    const radiusPx = getRadiusPixels(selectedPresetForPreview.buttonRadius);
    setPreviewClickFeedback(
      `Test Action Click #${nextCount}: Rendered with ${selectedPresetForPreview.buttonColor} (${radiusPx} radius, ${selectedPresetForPreview.fontFamily} font)`
    );
    setTimeout(() => setPreviewClickFeedback(null), 3500);
  };

  // Custom heading text color change handler (H1-H6)
  const handleHeadingColorChange = (level: keyof HeadingColorsConfig, color: string) => {
    const formatted = color.startsWith('#') ? color : `#${color}`;
    const updatedHeadingColors: HeadingColorsConfig = {
      ...headingColors,
      [level]: formatted
    };
    setHeadingColors(updatedHeadingColors);

    // Dynamically apply to the DOM in real time
    applyDynamicTheme({
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonHoverColor,
      buttonTextColor,
      headingColor,
      accentColor,
      fontFamily,
      buttonRadius,
      headingColors: updatedHeadingColors,
      headingColorH1: updatedHeadingColors.h1,
      headingColorH2: updatedHeadingColors.h2,
      headingColorH3: updatedHeadingColors.h3,
      headingColorH4: updatedHeadingColors.h4,
      headingColorH5: updatedHeadingColors.h5,
      headingColorH6: updatedHeadingColors.h6
    });
  };

  // Sync all H1-H6 heading levels to one unified color
  const handleSyncAllHeadings = (color: string) => {
    const formatted = color.startsWith('#') ? color : `#${color}`;
    const synchronized: HeadingColorsConfig = {
      h1: formatted,
      h2: formatted,
      h3: formatted,
      h4: formatted,
      h5: formatted,
      h6: formatted
    };
    setHeadingColors(synchronized);
    setHeadingColor(formatted);

    applyDynamicTheme({
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonHoverColor,
      buttonTextColor,
      headingColor: formatted,
      accentColor,
      fontFamily,
      buttonRadius,
      headingColors: synchronized,
      headingColorH1: formatted,
      headingColorH2: formatted,
      headingColorH3: formatted,
      headingColorH4: formatted,
      headingColorH5: formatted,
      headingColorH6: formatted
    });

    setNoticeMessage(`All heading levels (H1-H6) synchronized to ${formatted}!`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // Reset headings back to default theme heading color
  const handleResetHeadingsToDefault = () => {
    const baseColor = selectedPresetForPreview.headingColor || primaryColor || '#0f172a';
    handleSyncAllHeadings(baseColor);
  };

  // Save current styles as a new Preset via ThemePresetManager
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const { updatedSettings, newPreset } = ThemePresetManager.savePreset(settings, {
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `Custom style preset created by ${user?.name || 'Administrator'}`,
      badge: 'Custom',
      primaryColor: selectedPresetForPreview.primaryColor || primaryColor,
      secondaryColor: selectedPresetForPreview.secondaryColor || secondaryColor,
      buttonColor: selectedPresetForPreview.buttonColor || buttonColor,
      buttonHoverColor: selectedPresetForPreview.buttonHoverColor || buttonHoverColor,
      buttonTextColor: selectedPresetForPreview.buttonTextColor || buttonTextColor,
      headingColor: selectedPresetForPreview.headingColor || headingColor,
      headingColors,
      headingColorH1: headingColors.h1,
      headingColorH2: headingColors.h2,
      headingColorH3: headingColors.h3,
      headingColorH4: headingColors.h4,
      headingColorH5: headingColors.h5,
      headingColorH6: headingColors.h6,
      accentColor: selectedPresetForPreview.accentColor || accentColor,
      fontFamily: selectedPresetForPreview.fontFamily || fontFamily,
      buttonRadius: selectedPresetForPreview.buttonRadius || buttonRadius
    });

    setCustomPresets(updatedSettings.customPresets || []);
    setActivePresetId(newPreset.id);
    setSelectedPresetForPreview(newPreset);
    setNewPresetName('');
    setNewPresetDesc('');
    setShowSaveModal(false);

    await updateSettings(updatedSettings);
    setNoticeMessage(`Custom preset "${newPreset.name}" saved to library and active!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Delete preset handler via ThemePresetManager
  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { updatedSettings, success } = ThemePresetManager.deletePreset(settings, presetId);
    if (success) {
      setCustomPresets(updatedSettings.customPresets || []);
      if (updatedSettings.activePresetId) {
        setActivePresetId(updatedSettings.activePresetId);
        const fallback = allPresets.find(p => p.id === updatedSettings.activePresetId) || DEFAULT_THEME_PRESETS[0];
        setSelectedPresetForPreview(fallback);
        if (updatedSettings.primaryColor) setPrimaryColor(updatedSettings.primaryColor);
        if (updatedSettings.secondaryColor) setSecondaryColor(updatedSettings.secondaryColor);
        if (updatedSettings.buttonColor) setButtonColor(updatedSettings.buttonColor);
        if (updatedSettings.buttonHoverColor) setButtonHoverColor(updatedSettings.buttonHoverColor);
        if (updatedSettings.buttonTextColor) setButtonTextColor(updatedSettings.buttonTextColor);
        if (updatedSettings.headingColor) setHeadingColor(updatedSettings.headingColor);
        if (updatedSettings.accentColor) setAccentColor(updatedSettings.accentColor);
        if (updatedSettings.fontFamily) setFontFamily(updatedSettings.fontFamily);
        if (updatedSettings.buttonRadius) setButtonRadius(updatedSettings.buttonRadius);
      }
      await updateSettings(updatedSettings);
      setNoticeMessage('Custom preset removed from library.');
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  // Reset to default theme preset
  const handleResetToDefault = async () => {
    const defaultPreset = DEFAULT_THEME_PRESETS[0];
    await handleSwitchPreset(defaultPreset, true);
  };

  // Live adjustments for fine-tuning
  const handleLiveChange = (
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

    if (field === 'primary') {
      setPrimaryColor(value);
      nextPrimary = value;
    }
    if (field === 'secondary') {
      setSecondaryColor(value);
      nextSecondary = value;
    }
    if (field === 'button') {
      setButtonColor(value);
      nextButton = value;
      const autoHover = calculateHoverColor(value);
      const autoText = getContrastTextColor(value);
      setButtonHoverColor(autoHover);
      setButtonTextColor(autoText);
      nextHover = autoHover;
      nextText = autoText;
    }
    if (field === 'buttonHover') {
      setButtonHoverColor(value);
      nextHover = value;
    }
    if (field === 'buttonText') {
      setButtonTextColor(value);
      nextText = value;
    }
    if (field === 'heading') {
      setHeadingColor(value);
      nextHeading = value;
    }
    if (field === 'accent') {
      setAccentColor(value);
      nextAccent = value;
    }
    if (field === 'font') {
      setFontFamily(value);
      nextFont = value;
    }
    if (field === 'radius') {
      setButtonRadius(value);
      nextRadius = value;
    }

    setActivePresetId('custom-active');

    // Update staged preset preview card as well so changes are visible instantly
    setSelectedPresetForPreview(prev => ({
      ...prev,
      primaryColor: nextPrimary,
      secondaryColor: nextSecondary,
      buttonColor: nextButton,
      buttonHoverColor: nextHover,
      buttonTextColor: nextText,
      headingColor: nextHeading,
      accentColor: nextAccent,
      fontFamily: nextFont,
      buttonRadius: nextRadius,
      name: 'Custom Active Live Adjustments'
    }));

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
      activePresetId: 'custom-active',
      headingColors,
      headingColorH1: headingColors.h1,
      headingColorH2: headingColors.h2,
      headingColorH3: headingColors.h3,
      headingColorH4: headingColors.h4,
      headingColorH5: headingColors.h5,
      headingColorH6: headingColors.h6
    });
  };

  // Save all customizer values to server
  const handleSaveAllSettings = async () => {
    setIsSavingTheme(true);
    setNoticeMessage(null);
    try {
      await updateSettings({
        fontFamily,
        primaryColor,
        secondaryColor,
        buttonColor,
        buttonHoverColor,
        buttonTextColor,
        headingColor,
        headingColors,
        headingColorH1: headingColors.h1,
        headingColorH2: headingColors.h2,
        headingColorH3: headingColors.h3,
        headingColorH4: headingColors.h4,
        headingColorH5: headingColors.h5,
        headingColorH6: headingColors.h6,
        accentColor,
        buttonRadius,
        activePresetId,
        customPresets,
        customColors,
        themeMode,
        isDarkMode
      });
      setNoticeMessage('All theme customizations, custom heading text colors, and button styles saved and synchronized!');
      setTimeout(() => setNoticeMessage(null), 4500);
    } catch (err: any) {
      setNoticeMessage('Failed to save settings: ' + (err.message || 'Error'));
    } finally {
      setIsSavingTheme(false);
    }
  };

  // Instant light/dark/system appearance toggle
  const handleInstantThemeModeChange = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    const darkEnabled = mode === 'dark';
    setIsDarkMode(darkEnabled);
    await updateSettings({
      themeMode: mode,
      isDarkMode: darkEnabled
    });
  };

  // Custom colors management
  const handleAddCustomColor = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    if (!customColors.includes(formatted)) {
      const updated = [...customColors, formatted];
      setCustomColors(updated);
      updateSettings({ customColors: updated });
    }
  };

  const handleRemoveCustomColor = (hex: string) => {
    const updated = customColors.filter(c => (c || '').toLowerCase() !== (hex || '').toLowerCase());
    setCustomColors(updated);
    updateSettings({ customColors: updated });
  };

  // Staging comparison: Is the currently previewed preset already applied live?
  const isStagedPresetActive = selectedPresetForPreview.id === activePresetId;
  const stagedRadiusPixels = getRadiusPixels(selectedPresetForPreview.buttonRadius);
  const stagedHoverColor =
    selectedPresetForPreview.buttonHoverColor || calculateHoverColor(selectedPresetForPreview.buttonColor);

  return (
    <div className="space-y-6 animate-fade-in" id="theme-preset-manager-container">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & STATUS BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold">Theme Style Presets & Visual Customization Suite</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Preview style presets with live button styling, custom typography, and granular H1-H6 heading text colors before officially applying them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-save-new-preset-modal-open"
              onClick={() => setShowSaveModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save Current as Preset</span>
            </button>

            <button
              type="button"
              id="btn-reset-to-default-theme"
              onClick={handleResetToDefault}
              disabled={isSavingTheme || isSyncing}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Default</span>
            </button>

            <button
              type="button"
              id="btn-save-and-sync-theme"
              onClick={handleSaveAllSettings}
              disabled={isSavingTheme || isSyncing}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingTheme || isSyncing ? 'Saving & Syncing...' : 'Save Theme & Sync'}</span>
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {noticeMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Dynamic Theme Active</span>
          </div>
        )}

        {/* Active Preset Status Indicator */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Current Active Preset:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              {currentActivePreset ? currentActivePreset.name : 'Custom Style Configuration'}
            </span>
            {currentActivePreset && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {currentActivePreset.badge || 'Active'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="text-slate-400">Font:</span>
              <strong className="text-slate-800 font-medium">{fontFamily}</strong>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-400">Button:</span>
              <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: buttonColor }} />
              <strong className="font-mono text-slate-800">{buttonColor}</strong>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-400">Radius:</span>
              <strong className="text-slate-800">{buttonRadius} ({getRadiusPixels(buttonRadius)})</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISUAL PREVIEW CARD: LIVE RENDERING BEFORE OFFICIAL APPLICATION */}
      {/* ========================================================================= */}
      <div
        id="visual-theme-preview-card"
        className="bg-white rounded-2xl border-2 border-indigo-200/80 shadow-md p-6 space-y-5 relative overflow-hidden"
      >
        {/* Subtle accent backdrop */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-5 pointer-events-none blur-2xl"
          style={{ backgroundColor: selectedPresetForPreview.buttonColor }}
        />

        {/* Card Header & Comparison Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: selectedPresetForPreview.buttonColor, color: selectedPresetForPreview.buttonTextColor }}
            >
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Visual Theme Preview: {selectedPresetForPreview.name}
                </h3>
                {selectedPresetForPreview.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700">
                    {selectedPresetForPreview.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPresetForPreview.description || 'Live interactive simulation of button reactions, palette balance, and heading colors.'}
              </p>
            </div>
          </div>

          {/* Staging Status Badge & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isStagedPresetActive ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Currently Active Live</span>
              </span>
            ) : (
              <>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 animate-pulse">
                  <Sparkle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Staged Preview (Unapplied)</span>
                </span>

                <button
                  type="button"
                  id="btn-revert-staged-preview"
                  onClick={handleRevertStagedPreset}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  title="Revert preview to current active theme"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Revert Preview</span>
                </button>

                <button
                  type="button"
                  id="btn-apply-staged-preset-globally"
                  onClick={() => handleApplyStagedPreset(selectedPresetForPreview)}
                  disabled={isSavingTheme || isSyncing}
                  className="flex items-center space-x-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: selectedPresetForPreview.buttonColor,
                    color: selectedPresetForPreview.buttonTextColor
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Preset Globally</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Staging Stage Container */}
        <div
          className="p-5 rounded-2xl border border-slate-200/90 space-y-6 transition-all"
          style={{
            backgroundColor: '#ffffff',
            fontFamily: selectedPresetForPreview.fontFamily
          }}
        >
          {/* Sub-section 1: Typography & Hotel Identity Simulation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center space-x-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-500" />
                <span>Simulated Brand Header (Font: {selectedPresetForPreview.fontFamily})</span>
              </div>
              <h2
                className="text-lg sm:text-xl font-extrabold tracking-tight"
                style={{ color: headingColors.h1 || selectedPresetForPreview.headingColor || '#0f172a' }}
              >
                {settings.hotelName || 'Warwick Hotel & Luxury Resort'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Front Office Concierge, Housekeeping Dispatch, & VIP Lost & Found Terminal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow-2xs transition-all"
                style={{ backgroundColor: selectedPresetForPreview.secondaryColor }}
              >
                Secondary Brand Pill
              </span>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow-2xs transition-all"
                style={{ backgroundColor: selectedPresetForPreview.accentColor }}
              >
                Accent Tag
              </span>
            </div>
          </div>

          {/* Sub-section 2: Interactive Button Reactions & Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
                <span>Interactive Button Styles & Hover Reactions</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Corner Radius: {selectedPresetForPreview.buttonRadius} ({stagedRadiusPixels})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Primary Theme Action Button */}
              <button
                type="button"
                id="preview-primary-action-button"
                onClick={handleTestButtonClick}
                onMouseEnter={() => setIsPreviewButtonHovered(true)}
                onMouseLeave={() => setIsPreviewButtonHovered(false)}
                className="px-4 py-3 text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2 text-center"
                style={{
                  backgroundColor: isPreviewButtonHovered ? stagedHoverColor : selectedPresetForPreview.buttonColor,
                  color: selectedPresetForPreview.buttonTextColor,
                  borderRadius: stagedRadiusPixels,
                  fontFamily: selectedPresetForPreview.fontFamily,
                  transform: isPreviewButtonHovered ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <span>Primary Action (Hover Me)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Secondary Clean Action Button */}
              <button
                type="button"
                id="preview-secondary-action-button"
                onClick={handleTestButtonClick}
                className="px-4 py-3 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                style={{
                  borderRadius: stagedRadiusPixels,
                  fontFamily: selectedPresetForPreview.fontFamily
                }}
              >
                <span>Secondary Action</span>
              </button>

              {/* Outline Accent Button */}
              <button
                type="button"
                id="preview-outline-action-button"
                onClick={handleTestButtonClick}
                className="px-4 py-3 text-xs font-semibold bg-white border-2 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                style={{
                  borderColor: selectedPresetForPreview.secondaryColor,
                  color: selectedPresetForPreview.secondaryColor,
                  borderRadius: stagedRadiusPixels,
                  fontFamily: selectedPresetForPreview.fontFamily
                }}
              >
                <span>Outline Action</span>
              </button>

              {/* Form Input Field Preview */}
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value="Sample Form Field"
                  className="w-full px-3.5 py-3 text-xs bg-slate-50/70 border border-slate-200 text-slate-700 focus:outline-none"
                  style={{
                    borderRadius: stagedRadiusPixels,
                    fontFamily: selectedPresetForPreview.fontFamily
                  }}
                />
              </div>
            </div>

            {previewClickFeedback && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-mono text-[11px]">{previewClickFeedback}</span>
              </div>
            )}
          </div>

          {/* Sub-section 3: Preset Colorway Swatches */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Colorway Palette Swatches in Staged Preset</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedPresetForPreview.primaryColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Primary</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                    {selectedPresetForPreview.primaryColor}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedPresetForPreview.secondaryColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Secondary</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                    {selectedPresetForPreview.secondaryColor}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedPresetForPreview.buttonColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Button</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                    {selectedPresetForPreview.buttonColor}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: stagedHoverColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Button Hover</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">{stagedHoverColor}</div>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedPresetForPreview.headingColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Heading</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                    {selectedPresetForPreview.headingColor}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center space-x-2">
                <span
                  className="w-5 h-5 rounded-lg border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedPresetForPreview.accentColor }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">Accent</div>
                  <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
                    {selectedPresetForPreview.accentColor}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-section 4: Heading Hierarchy Showcase (H1-H6) in Staged Preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>Headings Hierarchy (H1 - H6) Live Rendering</span>
              </span>
              <button
                type="button"
                onClick={() => setShowHeadingStudio(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Customize Heading Colors &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H1 ({headingColors.h1})
                </span>
                <h1
                  className="text-lg font-extrabold truncate"
                  style={{ color: headingColors.h1 || '#0f172a', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H1 Page Master Title
                </h1>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H2 ({headingColors.h2})
                </span>
                <h2
                  className="text-base font-bold truncate"
                  style={{ color: headingColors.h2 || '#0f172a', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H2 Section Operations
                </h2>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H3 ({headingColors.h3})
                </span>
                <h3
                  className="text-sm font-bold truncate"
                  style={{ color: headingColors.h3 || '#1e293b', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H3 Card & Table Header
                </h3>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H4 ({headingColors.h4})
                </span>
                <h4
                  className="text-xs font-bold truncate"
                  style={{ color: headingColors.h4 || '#334155', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H4 Component Subheading
                </h4>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H5 ({headingColors.h5})
                </span>
                <h5
                  className="text-xs font-semibold truncate"
                  style={{ color: headingColors.h5 || '#475569', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H5 Fieldset Legend Title
                </h5>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  H6 ({headingColors.h6})
                </span>
                <h6
                  className="text-[11px] font-semibold truncate uppercase tracking-wider"
                  style={{ color: headingColors.h6 || '#64748b', fontFamily: selectedPresetForPreview.fontFamily }}
                >
                  H6 Meta Status Tag
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUSTOM HEADING (H1-H6) TEXT COLOR CHANGE OPTIONS STUDIO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5" id="heading-colors-studio">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Hash className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold">Custom Heading (H1 - H6) Text Color Studio</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize text colors for individual heading levels (H1 to H6) across your hotel operations system. Changes dynamically update headers in real time.
            </p>
          </div>

          {/* Quick Master Tools: Set All White, Custom Color, or Reset */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click White Color Master Button */}
            <button
              type="button"
              id="btn-sync-all-headings-white"
              onClick={() => handleSyncAllHeadings('#ffffff')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer hover:border-slate-400"
              title="Set all headings (H1 to H6) to Pure White (#ffffff)"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 shadow-2xs inline-block" />
              <span>White (#FFFFFF) All</span>
            </button>

            {/* Custom Color Master Tool with picker and hex input */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 px-1">Custom:</span>
              <input
                type="color"
                value={masterHeadingColorInput}
                onChange={e => setMasterHeadingColorInput(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                title="Pick custom color"
              />
              <input
                type="text"
                value={masterHeadingColorInput}
                onChange={e => setMasterHeadingColorInput(e.target.value)}
                placeholder="#000000"
                className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                id="btn-sync-all-headings"
                onClick={() => handleSyncAllHeadings(masterHeadingColorInput)}
                className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all cursor-pointer"
              >
                Set All (H1-H6)
              </button>
            </div>

            <button
              type="button"
              id="btn-reset-all-headings"
              onClick={handleResetHeadingsToDefault}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Headings</span>
            </button>
          </div>
        </div>

        {/* Granular Grid of 6 Heading Level Cards (H1 - H6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              level: 'h1' as keyof HeadingColorsConfig,
              label: 'H1 Heading',
              desc: 'Main Page Titles, Brand Masthead & Top-Level Headers (24px)',
              sample: 'Front Desk Operations Console'
            },
            {
              level: 'h2' as keyof HeadingColorsConfig,
              label: 'H2 Heading',
              desc: 'Section Titles, Modal Dialog Titles & Major Panels (20px)',
              sample: 'Guest Item Dispatch & Retention'
            },
            {
              level: 'h3' as keyof HeadingColorsConfig,
              label: 'H3 Heading',
              desc: 'Sub-section Headers, Card Titles & Table Headers (16px)',
              sample: 'High-Value Vault Items'
            },
            {
              level: 'h4' as keyof HeadingColorsConfig,
              label: 'H4 Heading',
              desc: 'Component Headings, Filter Blocks & Widget Groups (14px)',
              sample: 'Department Performance Breakdown'
            },
            {
              level: 'h5' as keyof HeadingColorsConfig,
              label: 'H5 Heading',
              desc: 'Block Subheadings & Form Fieldset Legends (13px)',
              sample: 'Security & Access Verification'
            },
            {
              level: 'h6' as keyof HeadingColorsConfig,
              label: 'H6 Heading',
              desc: 'Metadata Headers, Micro-labels & Category Headers (12px)',
              sample: 'TERMINAL SYNC PROTOCOL'
            }
          ].map(h => {
            const currentColor = (headingColors[h.level] as string) || '#0f172a';
            const isLight = isLightColorHex(currentColor);

            return (
              <div
                key={h.level}
                id={`heading-color-card-${h.level}`}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                      {h.level}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{h.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600">{currentColor}</span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-1">{h.desc}</p>

                {/* Dedicated White Color and Custom Color Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id={`btn-white-heading-${h.level}`}
                      onClick={() => handleHeadingColorChange(h.level, '#ffffff')}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        (currentColor || '').toLowerCase() === '#ffffff'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                      title={`Set ${h.label} to Pure White (#ffffff)`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
                      <span>White</span>
                    </button>
                    
                    <button
                      type="button"
                      id={`btn-offwhite-heading-${h.level}`}
                      onClick={() => handleHeadingColorChange(h.level, '#f8fafc')}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        (currentColor || '').toLowerCase() === '#f8fafc'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                      title={`Set ${h.label} to Crisp Off-White (#f8fafc)`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-400" />
                      <span>Off-White</span>
                    </button>
                  </div>
                </div>

                {/* Swatches palette */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {HEADING_COLOR_SWATCHES.map(swatch => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => handleHeadingColorChange(h.level, swatch.hex)}
                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                        (currentColor || '').toLowerCase() === (swatch.hex || '').toLowerCase()
                          ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={`${swatch.label} (${swatch.hex})`}
                    />
                  ))}
                </div>

                {/* Custom Color Input Controls */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Custom Color Picker & HEX:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id={`input-color-picker-${h.level}`}
                      value={currentColor}
                      onChange={e => handleHeadingColorChange(h.level, e.target.value)}
                      className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 shrink-0"
                      title="Custom Color Picker"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id={`input-hex-${h.level}`}
                        value={currentColor}
                        onChange={e => handleHeadingColorChange(h.level, e.target.value)}
                        placeholder="#ffffff"
                        className="w-full px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Sample Text Preview with smart contrast backdrop */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1">
                    <span>Live Text Rendering:</span>
                    {isLight && (
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Dark contrast box for white text
                      </span>
                    )}
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border truncate transition-colors ${
                      isLight
                        ? 'bg-slate-950 border-slate-800 shadow-inner'
                        : 'bg-white border-slate-200'
                    }`}
                    style={{
                      color: currentColor,
                      fontFamily: selectedPresetForPreview.fontFamily
                    }}
                  >
                    {h.level === 'h1' && <h1 className="text-base font-extrabold truncate">{h.sample}</h1>}
                    {h.level === 'h2' && <h2 className="text-sm font-bold truncate">{h.sample}</h2>}
                    {h.level === 'h3' && <h3 className="text-xs font-bold truncate">{h.sample}</h3>}
                    {h.level === 'h4' && <h4 className="text-xs font-semibold truncate">{h.sample}</h4>}
                    {h.level === 'h5' && <h5 className="text-[11px] font-semibold truncate">{h.sample}</h5>}
                    {h.level === 'h6' && (
                      <h6 className="text-[10px] font-semibold uppercase tracking-wider truncate">{h.sample}</h6>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. GRID-BASED PRESET SELECTOR LIBRARY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Palette className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Preset Style Library ({allPresets.length} Curated Options)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any card to load its live simulation into the Visual Preview Card above, or click Apply to activate globally.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPresetFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                presetFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allPresets.length})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('luxury')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                presetFilter === 'luxury'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Luxury 5★
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('modern')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                presetFilter === 'modern'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter('heritage')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                presetFilter === 'heritage'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heritage
            </button>
            {customPresets.length > 0 && (
              <button
                type="button"
                onClick={() => setPresetFilter('custom')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  presetFilter === 'custom'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom ({customPresets.length})
              </button>
            )}
          </div>
        </div>

        {/* The Grid: 3-column responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map(preset => {
            const isActive = activePresetId === preset.id;
            const isStaged = selectedPresetForPreview.id === preset.id;
            const isHovered = hoveredButtonPresetId === preset.id;
            const radiusPx = getRadiusPixels(preset.buttonRadius);

            return (
              <div
                key={preset.id}
                id={`preset-card-${preset.id}`}
                onClick={() => handleSelectPresetForPreview(preset)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                    : isStaged
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Preset Name & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{preset.name}</h4>
                        {preset.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      {preset.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {preset.isCustom && (
                        <button
                          type="button"
                          id={`btn-delete-preset-${preset.id}`}
                          onClick={e => handleDeletePreset(preset.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete custom preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isActive ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : isStaged ? (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs" title="Currently previewing in visual card">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Swatch Strip: Primary, Secondary, Button, Hover, Accent */}
                  <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.primaryColor }}
                      title={`Primary: ${preset.primaryColor}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.secondaryColor }}
                      title={`Secondary: ${preset.secondaryColor}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.buttonColor }}
                      title={`Button: ${preset.buttonColor}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                      style={{
                        backgroundColor: preset.buttonHoverColor || calculateHoverColor(preset.buttonColor)
                      }}
                      title={`Button Hover: ${preset.buttonHoverColor || calculateHoverColor(preset.buttonColor)}`}
                    />
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.accentColor }}
                      title={`Accent: ${preset.accentColor}`}
                    />
                    <div className="text-[10px] font-mono text-slate-400 pl-1.5 truncate">
                      {preset.buttonColor}
                    </div>
                  </div>

                  {/* Live Interactive Button Preview Inside Card */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredButtonPresetId(preset.id)}
                      onMouseLeave={() => setHoveredButtonPresetId(null)}
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectPresetForPreview(preset);
                      }}
                      className="w-full py-2 px-3 text-xs font-bold shadow-2xs transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer"
                      style={{
                        backgroundColor: isHovered
                          ? preset.buttonHoverColor || calculateHoverColor(preset.buttonColor)
                          : preset.buttonColor,
                        color: preset.buttonTextColor,
                        borderRadius: radiusPx,
                        fontFamily: preset.fontFamily,
                        transform: isHovered ? 'scale(1.01)' : 'scale(1)'
                      }}
                    >
                      <span>Action Preview</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Card Footer: Font & Radius Metadata + Action Buttons */}
                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="space-y-0.5">
                    <span className="block font-medium text-slate-700">{preset.fontFamily}</span>
                    <span className="block text-[10px] text-slate-400">Radius: {radiusPx}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectPresetForPreview(preset);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        isStaged
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isStaged ? 'Previewing' : 'Preview'}
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleSwitchPreset(preset, true);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                      }`}
                    >
                      {isActive ? 'Active' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. GRANULAR CUSTOMIZER CONTROLS (EXPANDABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Fine-Tuning & Individual Style Customizer</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedCustomizer(!showAdvancedCustomizer)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            {showAdvancedCustomizer ? 'Hide Advanced Options' : 'Show Advanced Color & Font Controls'}
          </button>
        </div>

        {showAdvancedCustomizer && (
          <div className="pt-4 border-t border-slate-100 space-y-6 animate-fade-in">
            {/* Appearance Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Display Contrast Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleInstantThemeModeChange('light')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    themeMode === 'light'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sun className="w-4 h-4 text-amber-500" />
                    {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">Crisp Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantThemeModeChange('dark')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    themeMode === 'dark'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">High-Contrast Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantThemeModeChange('system')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    themeMode === 'system'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Monitor className="w-4 h-4 text-slate-600" />
                    {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">System Auto</span>
                </button>
              </div>
            </div>

            {/* Typography Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Web Font Typography (Dynamic CSS Font-Family)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {FONT_OPTIONS.map(font => {
                  const isFontActive = (fontFamily || '').toLowerCase() === (font.id || '').toLowerCase();
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => handleLiveChange('font', font.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isFontActive
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900" style={{ fontFamily: font.id }}>
                          {font.id}
                        </span>
                        {isFontActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{font.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Button Corner Radius */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Button Corner Radius</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {RADIUS_OPTIONS.map(r => {
                  const isRadiusActive = buttonRadius === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleLiveChange('radius', r.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isRadiusActive
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{r.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors customizer: Primary, Secondary, Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Primary Theme Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => handleLiveChange('primary', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => handleLiveChange('primary', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Secondary Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => handleLiveChange('secondary', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => handleLiveChange('secondary', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Button Action Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={e => handleLiveChange('button', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={buttonColor}
                    onChange={e => handleLiveChange('button', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Custom Hex Color Swatches */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Custom Palette Swatches</label>
              <div className="flex flex-wrap items-center gap-2">
                {customColors.map(hex => (
                  <div key={hex} className="flex items-center space-x-1 p-1 rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => handleLiveChange('button', hex)}
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                      title={`Click to set as button color: ${hex}`}
                    />
                    <span className="text-[11px] font-mono text-slate-600">{hex}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomColor(hex)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                      title="Remove custom swatch"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-1.5">
                  <input
                    type="color"
                    value={newCustomHex}
                    onChange={e => setNewCustomHex(e.target.value)}
                    className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomColor(newCustomHex)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                  >
                    + Add Swatch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: SAVE NEW CUSTOM STYLE PRESET */}
      {/* ========================================================================= */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookmarkPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Save Custom Style Preset</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Save your current colors, typography, and button corner radius as a reusable preset in your hotel settings library.
            </p>

            <form onSubmit={handleSavePreset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preset Name *</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="e.g. Royal Golden Gala, Executive Winter..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  placeholder="Brief description of the style atmosphere and use case..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              {/* Quick Preview of What is Being Saved */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Attributes Captured in Preset:
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Font:</span>
                  <strong>{selectedPresetForPreview.fontFamily}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Button Radius:</span>
                  <strong>{selectedPresetForPreview.buttonRadius}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Colors:</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: selectedPresetForPreview.primaryColor }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: selectedPresetForPreview.secondaryColor }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: selectedPresetForPreview.buttonColor }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Preset to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePresetGridSelector;
