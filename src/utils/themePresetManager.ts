import { ThemePreset, HotelSettings, HeadingColorsConfig } from '../types';
import {
  DEFAULT_THEME_PRESETS,
  applyDynamicTheme,
  calculateHoverColor,
  getContrastTextColor
} from '../lib/themeEngine';

export interface SavePresetInput {
  name: string;
  description?: string;
  badge?: string;
  primaryColor?: string;
  secondaryColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonTextColor?: string;
  headingColor?: string;
  headingColors?: HeadingColorsConfig;
  headingColorH1?: string;
  headingColorH2?: string;
  headingColorH3?: string;
  headingColorH4?: string;
  headingColorH5?: string;
  headingColorH6?: string;
  accentColor?: string;
  fontFamily?: string;
  buttonRadius?: string;
}

/**
 * ThemePresetManager
 * Comprehensive utility for managing theme style presets (colors, fonts, radii)
 * stored in the HotelSettings state.
 */
export class ThemePresetManager {
  private settings?: HotelSettings;
  private updateSettingsFn?: (newSettings: Partial<HotelSettings>) => Promise<any> | void;

  constructor(
    settings?: HotelSettings,
    updateSettingsFn?: (newSettings: Partial<HotelSettings>) => Promise<any> | void
  ) {
    this.settings = settings;
    this.updateSettingsFn = updateSettingsFn;
  }

  /**
   * Retrieves all available presets: default built-in presets + custom user presets
   */
  static getAllPresets(settings?: Partial<HotelSettings> | null): ThemePreset[] {
    const custom = settings?.customPresets || [];
    return [...DEFAULT_THEME_PRESETS, ...custom];
  }

  /**
   * Retrieves a preset by its unique ID
   */
  static getPresetById(
    presetId: string,
    settings?: Partial<HotelSettings> | null
  ): ThemePreset | undefined {
    const all = ThemePresetManager.getAllPresets(settings);
    return all.find(p => p.id === presetId);
  }

  /**
   * Finds the currently active preset based on settings.activePresetId or style attributes
   */
  static getActivePreset(settings?: Partial<HotelSettings> | null): ThemePreset {
    const all = ThemePresetManager.getAllPresets(settings);
    if (settings?.activePresetId) {
      const match = all.find(p => p.id === settings.activePresetId);
      if (match) return match;
    }
    // Fallback: match by primary & secondary color
    const matchByColor = all.find(
      p =>
        (p.primaryColor || '').toLowerCase() === (settings?.primaryColor || '').toLowerCase() &&
        (p.secondaryColor || '').toLowerCase() === (settings?.secondaryColor || '').toLowerCase()
    );
    return matchByColor || DEFAULT_THEME_PRESETS[0];
  }

  /**
   * Switches to a target preset, formats the settings payload,
   * and dynamically updates the DOM via applyDynamicTheme.
   */
  static switchPreset(
    settings: HotelSettings,
    presetId: string,
    options: { autoApplyDOM?: boolean } = { autoApplyDOM: true }
  ): {
    updatedSettings: Partial<HotelSettings>;
    appliedPreset: ThemePreset;
  } {
    const all = ThemePresetManager.getAllPresets(settings);
    const targetPreset = all.find(p => p.id === presetId) || DEFAULT_THEME_PRESETS[0];

    const updatedSettings: Partial<HotelSettings> = {
      activePresetId: targetPreset.id,
      primaryColor: targetPreset.primaryColor,
      secondaryColor: targetPreset.secondaryColor,
      buttonColor: targetPreset.buttonColor,
      buttonHoverColor: targetPreset.buttonHoverColor || calculateHoverColor(targetPreset.buttonColor),
      buttonTextColor: targetPreset.buttonTextColor || getContrastTextColor(targetPreset.buttonColor),
      headingColor: targetPreset.headingColor || targetPreset.primaryColor,
      headingColors: targetPreset.headingColors || (settings as any).headingColors,
      headingColorH1: targetPreset.headingColorH1 || (settings as any).headingColorH1,
      headingColorH2: targetPreset.headingColorH2 || (settings as any).headingColorH2,
      headingColorH3: targetPreset.headingColorH3 || (settings as any).headingColorH3,
      headingColorH4: targetPreset.headingColorH4 || (settings as any).headingColorH4,
      headingColorH5: targetPreset.headingColorH5 || (settings as any).headingColorH5,
      headingColorH6: targetPreset.headingColorH6 || (settings as any).headingColorH6,
      accentColor: targetPreset.accentColor || targetPreset.secondaryColor,
      fontFamily: targetPreset.fontFamily || 'Plus Jakarta Sans',
      buttonRadius: targetPreset.buttonRadius || 'rounded-xl'
    };

    if (options.autoApplyDOM !== false) {
      applyDynamicTheme(updatedSettings);
    }

    return {
      updatedSettings,
      appliedPreset: targetPreset
    };
  }

  /**
   * Creates and saves a new custom preset into settings.customPresets,
   * sets it as active, and applies it dynamically to the DOM.
   */
  static savePreset(
    settings: HotelSettings,
    input: SavePresetInput
  ): {
    updatedSettings: Partial<HotelSettings>;
    newPreset: ThemePreset;
  } {
    const trimmedName = (input.name || 'Custom Theme').trim();
    const primary = input.primaryColor || settings.primaryColor || '#0f172a';
    const secondary = input.secondaryColor || settings.secondaryColor || '#4f46e5';
    const button = input.buttonColor || settings.buttonColor || secondary;
    const buttonHover =
      input.buttonHoverColor || settings.buttonHoverColor || calculateHoverColor(button);
    const buttonText =
      input.buttonTextColor || settings.buttonTextColor || getContrastTextColor(button);
    const heading = input.headingColor || settings.headingColor || primary;
    const accent = input.accentColor || settings.accentColor || secondary;
    const font = input.fontFamily || settings.fontFamily || 'Plus Jakarta Sans';
    const radius = input.buttonRadius || settings.buttonRadius || 'rounded-xl';

    const newPreset: ThemePreset = {
      id: `preset-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      badge: input.badge || 'Custom',
      description: input.description || `Custom theme preset created on ${new Date().toLocaleDateString()}`,
      primaryColor: primary,
      secondaryColor: secondary,
      buttonColor: button,
      buttonHoverColor: buttonHover,
      buttonTextColor: buttonText,
      headingColor: heading,
      headingColors: input.headingColors || (settings as any).headingColors,
      headingColorH1: input.headingColorH1 || (settings as any).headingColorH1,
      headingColorH2: input.headingColorH2 || (settings as any).headingColorH2,
      headingColorH3: input.headingColorH3 || (settings as any).headingColorH3,
      headingColorH4: input.headingColorH4 || (settings as any).headingColorH4,
      headingColorH5: input.headingColorH5 || (settings as any).headingColorH5,
      headingColorH6: input.headingColorH6 || (settings as any).headingColorH6,
      accentColor: accent,
      fontFamily: font,
      buttonRadius: radius,
      isCustom: true
    };

    const existingCustom = settings.customPresets || [];
    const updatedCustomPresets = [...existingCustom, newPreset];

    const updatedSettings: Partial<HotelSettings> = {
      customPresets: updatedCustomPresets,
      activePresetId: newPreset.id,
      primaryColor: newPreset.primaryColor,
      secondaryColor: newPreset.secondaryColor,
      buttonColor: newPreset.buttonColor,
      buttonHoverColor: newPreset.buttonHoverColor,
      buttonTextColor: newPreset.buttonTextColor,
      headingColor: newPreset.headingColor,
      headingColors: newPreset.headingColors,
      headingColorH1: newPreset.headingColorH1,
      headingColorH2: newPreset.headingColorH2,
      headingColorH3: newPreset.headingColorH3,
      headingColorH4: newPreset.headingColorH4,
      headingColorH5: newPreset.headingColorH5,
      headingColorH6: newPreset.headingColorH6,
      accentColor: newPreset.accentColor,
      fontFamily: newPreset.fontFamily,
      buttonRadius: newPreset.buttonRadius
    };

    applyDynamicTheme(updatedSettings);

    return {
      updatedSettings,
      newPreset
    };
  }

  /**
   * Deletes a custom preset from settings.customPresets.
   * If the deleted preset was active, rolls back to DEFAULT_THEME_PRESETS[0].
   */
  static deletePreset(
    settings: HotelSettings,
    presetId: string
  ): {
    updatedSettings: Partial<HotelSettings>;
    success: boolean;
    error?: string;
  } {
    const existingCustom = settings.customPresets || [];
    const isCustom = existingCustom.some(p => p.id === presetId);

    if (!isCustom) {
      return {
        updatedSettings: {},
        success: false,
        error: 'Cannot delete built-in system presets.'
      };
    }

    const updatedCustomPresets = existingCustom.filter(p => p.id !== presetId);
    const updatedSettings: Partial<HotelSettings> = {
      customPresets: updatedCustomPresets
    };

    // If the active preset was deleted, fall back to default
    if (settings.activePresetId === presetId) {
      const fallback = DEFAULT_THEME_PRESETS[0];
      Object.assign(updatedSettings, {
        activePresetId: fallback.id,
        primaryColor: fallback.primaryColor,
        secondaryColor: fallback.secondaryColor,
        buttonColor: fallback.buttonColor,
        buttonHoverColor: fallback.buttonHoverColor,
        buttonTextColor: fallback.buttonTextColor,
        headingColor: fallback.headingColor,
        accentColor: fallback.accentColor,
        fontFamily: fallback.fontFamily,
        buttonRadius: fallback.buttonRadius
      });
      applyDynamicTheme(updatedSettings);
    }

    return {
      updatedSettings,
      success: true
    };
  }

  /**
   * Directly triggers applyDynamicTheme on a preset or partial settings object
   */
  static applyPreset(preset: ThemePreset | Partial<HotelSettings>): void {
    applyDynamicTheme(preset);
  }

  // --- Instance Methods for state-bound usage ---

  getAllPresets(): ThemePreset[] {
    return ThemePresetManager.getAllPresets(this.settings);
  }

  getPresetById(presetId: string): ThemePreset | undefined {
    return ThemePresetManager.getPresetById(presetId, this.settings);
  }

  getActivePreset(): ThemePreset {
    return ThemePresetManager.getActivePreset(this.settings);
  }

  async switchPreset(presetId: string): Promise<ThemePreset | undefined> {
    if (!this.settings) return undefined;
    const { updatedSettings, appliedPreset } = ThemePresetManager.switchPreset(this.settings, presetId);
    if (this.updateSettingsFn) {
      await this.updateSettingsFn(updatedSettings);
    }
    return appliedPreset;
  }

  async savePreset(input: SavePresetInput): Promise<ThemePreset | undefined> {
    if (!this.settings) return undefined;
    const { updatedSettings, newPreset } = ThemePresetManager.savePreset(this.settings, input);
    if (this.updateSettingsFn) {
      await this.updateSettingsFn(updatedSettings);
    }
    return newPreset;
  }

  async deletePreset(presetId: string): Promise<boolean> {
    if (!this.settings) return false;
    const { updatedSettings, success } = ThemePresetManager.deletePreset(this.settings, presetId);
    if (success && this.updateSettingsFn) {
      await this.updateSettingsFn(updatedSettings);
    }
    return success;
  }
}

// Standalone function exports for flexible import styles
export const getAllPresets = ThemePresetManager.getAllPresets;
export const getPresetById = ThemePresetManager.getPresetById;
export const getActivePreset = ThemePresetManager.getActivePreset;
export const switchPreset = ThemePresetManager.switchPreset;
export const savePreset = ThemePresetManager.savePreset;
export const deletePreset = ThemePresetManager.deletePreset;
export const applyPreset = ThemePresetManager.applyPreset;

export default ThemePresetManager;
