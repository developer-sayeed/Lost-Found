import { ThemePreset, HotelSettings } from '../types';

export const DEFAULT_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'preset-royal-navy',
    name: 'Royal Warwick Navy',
    badge: 'Default',
    description: 'Official deep navy & indigo palette crafted for prestigious hotel operations.',
    primaryColor: '#0f172a',
    secondaryColor: '#4f46e5',
    buttonColor: '#4f46e5',
    buttonHoverColor: '#4338ca',
    buttonTextColor: '#ffffff',
    headingColor: '#0f172a',
    accentColor: '#059669',
    fontFamily: 'Plus Jakarta Sans',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-imperial-gold',
    name: 'Imperial Prestige Gold',
    badge: 'Luxury 5★',
    description: 'Warm obsidian black, burnished amber and gold tailored for 5-star luxury resorts.',
    primaryColor: '#1c1917',
    secondaryColor: '#b45309',
    buttonColor: '#d97706',
    buttonHoverColor: '#b45309',
    buttonTextColor: '#ffffff',
    headingColor: '#1c1917',
    accentColor: '#78350f',
    fontFamily: 'Playfair Display',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-emerald-palace',
    name: 'Emerald Palace Heritage',
    badge: 'Heritage',
    description: 'Regal emerald green & deep forest tones reflecting royal hospitality and gardens.',
    primaryColor: '#064e3b',
    secondaryColor: '#059669',
    buttonColor: '#059669',
    buttonHoverColor: '#047857',
    buttonTextColor: '#ffffff',
    headingColor: '#064e3b',
    accentColor: '#d97706',
    fontFamily: 'Plus Jakarta Sans',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-midnight-exec',
    name: 'Midnight Executive Sapphire',
    badge: 'Executive',
    description: 'Crisp sapphire blue on dark slate for razor-sharp executive clarity.',
    primaryColor: '#090d16',
    secondaryColor: '#2563eb',
    buttonColor: '#2563eb',
    buttonHoverColor: '#1d4ed8',
    buttonTextColor: '#ffffff',
    headingColor: '#0f172a',
    accentColor: '#0284c7',
    fontFamily: 'Inter',
    buttonRadius: 'rounded-lg',
    isCustom: false
  },
  {
    id: 'preset-burgundy-velvet',
    name: 'Burgundy Velvet & Violet',
    badge: 'Elegance',
    description: 'Rich royal purple & violet tones symbolizing elegance and fine dining.',
    primaryColor: '#3b0764',
    secondaryColor: '#7c3aed',
    buttonColor: '#7c3aed',
    buttonHoverColor: '#6d28d9',
    buttonTextColor: '#ffffff',
    headingColor: '#3b0764',
    accentColor: '#f59e0b',
    fontFamily: 'Playfair Display',
    buttonRadius: 'rounded-2xl',
    isCustom: false
  },
  {
    id: 'preset-nordic-teal',
    name: 'Nordic Slate & Teal',
    badge: 'Minimal',
    description: 'Clean Scandinavian teal and slate grey with high contrast and modern balance.',
    primaryColor: '#1e293b',
    secondaryColor: '#0d9488',
    buttonColor: '#0d9488',
    buttonHoverColor: '#0f766e',
    buttonTextColor: '#ffffff',
    headingColor: '#0f172a',
    accentColor: '#06b6d4',
    fontFamily: 'Outfit',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-sunset-amber',
    name: 'Sunset Amber & Coral',
    badge: 'Warm Hospitality',
    description: 'Welcoming terra-cotta, amber, and coral notes for warm guest reception.',
    primaryColor: '#1c1917',
    secondaryColor: '#ea580c',
    buttonColor: '#ea580c',
    buttonHoverColor: '#c2410c',
    buttonTextColor: '#ffffff',
    headingColor: '#1c1917',
    accentColor: '#f59e0b',
    fontFamily: 'Outfit',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-arabian-oasis',
    name: 'Arabian Oasis & Palm',
    badge: 'Saudi / Gulf',
    description: 'Traditional Gulf palm green with golden brass accents and bilingual typography.',
    primaryColor: '#14281d',
    secondaryColor: '#15803d',
    buttonColor: '#16a34a',
    buttonHoverColor: '#15803d',
    buttonTextColor: '#ffffff',
    headingColor: '#14281d',
    accentColor: '#ca8a04',
    fontFamily: 'Cairo',
    buttonRadius: 'rounded-xl',
    isCustom: false
  },
  {
    id: 'preset-cyber-cyan',
    name: 'Cyber Neo Cyan',
    badge: 'Modern Tech',
    description: 'Ultra-modern cyan electric accents on jet obsidian with high-tech appeal.',
    primaryColor: '#030712',
    secondaryColor: '#0891b2',
    buttonColor: '#06b6d4',
    buttonHoverColor: '#0891b2',
    buttonTextColor: '#030712',
    headingColor: '#0891b2',
    accentColor: '#10b981',
    fontFamily: 'Plus Jakarta Sans',
    buttonRadius: 'rounded-lg',
    isCustom: false
  },
  {
    id: 'preset-crimson-rose',
    name: 'Crimson Rose & Ruby',
    badge: 'Boutique',
    description: 'Chic crimson and deep ruby tones tailored for luxury boutique hospitality suites.',
    primaryColor: '#4c0519',
    secondaryColor: '#e11d48',
    buttonColor: '#e11d48',
    buttonHoverColor: '#be123c',
    buttonTextColor: '#ffffff',
    headingColor: '#4c0519',
    accentColor: '#f43f5e',
    fontFamily: 'Playfair Display',
    buttonRadius: 'rounded-xl',
    isCustom: false
  }
];

export const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Modern Clean)', style: 'Sans-serif', desc: 'Contemporary geometric sans designed for premium digital experiences.' },
  { id: 'Inter', name: 'Inter (Technical High-Precision)', style: 'Sans-serif', desc: 'Hyper-legible interface typeface with crisp clarity across displays.' },
  { id: 'Outfit', name: 'Outfit (Geometric Contemporary)', style: 'Sans-serif', desc: 'Sophisticated luxury geometric sans with soft humanist proportions.' },
  { id: 'Playfair Display', name: 'Playfair Display (Luxury Editorial Serif)', style: 'Serif', desc: 'High-contrast editorial serif conveying 5-star prestige & heritage.' },
  { id: 'Cairo', name: 'Cairo (Bilingual Arabic & Latin Sans)', style: 'Bilingual', desc: 'Distinguished contemporary sans with native Arabic typographic harmony.' },
  { id: 'Cinzel', name: 'Cinzel (Classical Roman Architectural)', style: 'Display', desc: 'Inspired by first-century Roman inscriptions for classical authority.' }
];

export const RADIUS_OPTIONS = [
  { id: 'rounded-none', label: 'Sharp (0px)', pixels: '0px', class: 'rounded-none' },
  { id: 'rounded-md', label: 'Subtle (6px)', pixels: '6px', class: 'rounded-md' },
  { id: 'rounded-lg', label: 'Medium (8px)', pixels: '8px', class: 'rounded-lg' },
  { id: 'rounded-xl', label: 'Modern (12px)', pixels: '12px', class: 'rounded-xl' },
  { id: 'rounded-2xl', label: 'Soft (16px)', pixels: '16px', class: 'rounded-2xl' },
  { id: 'rounded-full', label: 'Pill (9999px)', pixels: '9999px', class: 'rounded-full' }
];

export function getRadiusPixels(radiusId?: string): string {
  const match = RADIUS_OPTIONS.find(r => r.id === radiusId);
  return match ? match.pixels : '12px';
}

/**
 * Calculates a slightly darker hex for hover states if not explicitly set
 */
export function calculateHoverColor(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#3730a3';
  try {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    
    // Darken by 15%
    r = Math.max(0, Math.floor(r * 0.85));
    g = Math.max(0, Math.floor(g * 0.85));
    b = Math.max(0, Math.floor(b * 0.85));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

/**
 * Determines whether white or dark text offers better contrast against a hex color
 */
export function getContrastTextColor(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#ffffff';
  try {
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    // Perceived luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#0f172a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

const STYLE_ELEMENT_ID = 'warwick-dynamic-theme-runtime';

/**
 * Instantly applies the clean default system theme to the DOM:
 * 1. Sets standard system CSS Custom Properties on document.documentElement
 * 2. Removes any previous invasive runtime style overrides to ensure pure, crisp Tailwind styling
 * 3. Maintains typography and dark mode compatibility
 */
export function applyDynamicTheme(settings?: Partial<HotelSettings> | null | undefined): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  // Default system color values (Warwick slate & indigo signature)
  const primary = '#0f172a';
  const secondary = '#4f46e5';
  const button = '#4f46e5';
  const buttonHover = '#4338ca';
  const buttonText = '#ffffff';
  const heading = '#0f172a';
  const accent = '#059669';
  const fontFamily = settings?.fontFamily || 'Plus Jakarta Sans';
  const radius = '0.75rem';

  // 1. Set standard CSS Custom Properties
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-btn', button);
  root.style.setProperty('--color-btn-hover', buttonHover);
  root.style.setProperty('--color-btn-text', buttonText);
  root.style.setProperty('--color-heading', heading);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--btn-radius', radius);
  root.style.setProperty('--theme-font', `"${fontFamily}", system-ui, -apple-system, sans-serif`);

  // 2. Remove any previous invasive runtime custom style element that overrode Tailwind button/heading classes
  const styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }

  // 3. Ensure body font-family is clean
  if (document.body) {
    document.body.style.fontFamily = `"${fontFamily}", system-ui, -apple-system, sans-serif`;
  }
}

export { ThemePresetManager } from '../utils/themePresetManager';
