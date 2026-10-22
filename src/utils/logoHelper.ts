import { HotelSettings } from '../types';

/**
 * Premium default vector SVG emblems for Warwick Hotels & Resorts
 * Crafted for crisp rendering across high-DPI displays.
 */

// Light Theme Logo: Royal Plum & Gold Crest optimized for white/light canvas
export const DEFAULT_LIGHT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="plumLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4A1755"/>
      <stop offset="100%" stop-color="#1A0C1D"/>
    </linearGradient>
  </defs>
  <!-- Left Crest Icon -->
  <g transform="translate(15, 15)">
    <!-- Crown Shield -->
    <path d="M 45 6 L 75 22 L 75 58 C 75 75 45 88 45 88 C 45 88 15 75 15 58 L 15 22 Z" fill="#FBF7FC" stroke="url(#goldLight)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 45 16 L 65 28 L 65 54 C 65 67 45 76 45 76 C 45 76 25 67 25 54 L 25 28 Z" fill="none" stroke="#E5D6EA" stroke-width="1.5"/>
    <!-- 5-Point Crown -->
    <path d="M 28 48 L 33 34 L 40 44 L 45 28 L 50 44 L 57 34 L 62 48 Z" fill="url(#goldLight)"/>
    <!-- Central Star -->
    <circle cx="45" cy="58" r="4.5" fill="#4A1755"/>
  </g>
  <!-- Text Brand -->
  <text x="120" y="55" font-family="'Cinzel', 'Playfair Display', 'Times New Roman', serif" font-size="34" font-weight="800" fill="url(#plumLight)" letter-spacing="4">WARWICK</text>
  <text x="122" y="78" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="700" fill="#B45309" letter-spacing="5">HOTELS &amp; RESORTS</text>
  <!-- 5 Star Accents -->
  <g transform="translate(122, 90)" fill="#D97706">
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(14,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(28,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(42,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(56,0) scale(0.8)"/>
  </g>
</svg>
`)}`;

// Dark Theme Logo: Luminescent Gold & Radiant Fuchsia-White Crest optimized for obsidian/plum canvas
export const DEFAULT_DARK_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="goldDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="crestGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E879F9"/>
      <stop offset="100%" stop-color="#C026D3"/>
    </linearGradient>
  </defs>
  <!-- Left Crest Icon -->
  <g transform="translate(15, 15)">
    <!-- Outer Glow Shield -->
    <path d="M 45 6 L 75 22 L 75 58 C 75 75 45 88 45 88 C 45 88 15 75 15 58 L 15 22 Z" fill="#180F1A" stroke="url(#goldDark)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 45 16 L 65 28 L 65 54 C 65 67 45 76 45 76 C 45 76 25 67 25 54 L 25 28 Z" fill="none" stroke="url(#crestGlow)" stroke-width="1.5" opacity="0.6"/>
    <!-- 5-Point Crown -->
    <path d="M 28 48 L 33 34 L 40 44 L 45 28 L 50 44 L 57 34 L 62 48 Z" fill="url(#goldDark)"/>
    <!-- Central Radiant Star -->
    <circle cx="45" cy="58" r="4.5" fill="#FFFFFF"/>
  </g>
  <!-- Text Brand -->
  <text x="120" y="55" font-family="'Cinzel', 'Playfair Display', 'Times New Roman', serif" font-size="34" font-weight="800" fill="#FFFFFF" letter-spacing="4">WARWICK</text>
  <text x="122" y="78" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="700" fill="#FDE68A" letter-spacing="5">HOTELS &amp; RESORTS</text>
  <!-- 5 Star Accents -->
  <g transform="translate(122, 90)" fill="url(#goldDark)">
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(14,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(28,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(42,0) scale(0.8)"/>
    <polygon points="5,0 6.5,3.5 10,3.5 7,6 8,9.5 5,7.5 2,9.5 3,6 0,3.5 3.5,3.5" transform="translate(56,0) scale(0.8)"/>
  </g>
</svg>
`)}`;

/**
 * Determines whether dark mode is currently active.
 * Prioritizes the DOM documentElement 'dark' class, then settings.themeMode or settings.isDarkMode.
 */
export const isDarkModeActive = (settings?: HotelSettings | null): boolean => {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return true;
  }
  if (settings) {
    if (settings.themeMode === 'dark' || settings.isDarkMode === true) return true;
    if (settings.themeMode === 'light' || settings.isDarkMode === false) return false;
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/**
 * Resolves the appropriate hotel brand logo dynamically based on current theme mode.
 * - In Dark Mode: prefers settings.logoDarkUrl, then settings.logoUrl, then DEFAULT_DARK_LOGO_SVG.
 * - In Light Mode: prefers settings.logoLightUrl, then settings.logoUrl, then DEFAULT_LIGHT_LOGO_SVG.
 */
export const resolveHotelLogo = (
  settings?: HotelSettings | null,
  forceTheme?: 'dark' | 'light'
): { url: string; mode: 'dark' | 'light'; isCustom: boolean } => {
  const isDark = forceTheme ? forceTheme === 'dark' : isDarkModeActive(settings);

  if (isDark) {
    if (settings?.logoDarkUrl && settings.logoDarkUrl.trim()) {
      return { url: settings.logoDarkUrl.trim(), mode: 'dark', isCustom: true };
    }
    if (settings?.logoUrl && settings.logoUrl.trim()) {
      return { url: settings.logoUrl.trim(), mode: 'dark', isCustom: true };
    }
    return { url: DEFAULT_DARK_LOGO_SVG, mode: 'dark', isCustom: false };
  } else {
    if (settings?.logoLightUrl && settings.logoLightUrl.trim()) {
      return { url: settings.logoLightUrl.trim(), mode: 'light', isCustom: true };
    }
    if (settings?.logoUrl && settings.logoUrl.trim()) {
      return { url: settings.logoUrl.trim(), mode: 'light', isCustom: true };
    }
    return { url: DEFAULT_LIGHT_LOGO_SVG, mode: 'light', isCustom: false };
  }
};

/**
 * Resolves the appropriate login portal logo dynamically based on atmosphere or dark mode.
 */
export const resolveLoginLogo = (
  settings?: HotelSettings | null,
  isDarkAtmosphere = true
): { url: string; mode: 'dark' | 'light'; isCustom: boolean } => {
  if (isDarkAtmosphere) {
    if (settings?.loginLogoDarkUrl && settings.loginLogoDarkUrl.trim()) {
      return { url: settings.loginLogoDarkUrl.trim(), mode: 'dark', isCustom: true };
    }
    if (settings?.loginLogoUrl && settings.loginLogoUrl.trim()) {
      return { url: settings.loginLogoUrl.trim(), mode: 'dark', isCustom: true };
    }
    return resolveHotelLogo(settings, 'dark');
  } else {
    if (settings?.loginLogoLightUrl && settings.loginLogoLightUrl.trim()) {
      return { url: settings.loginLogoLightUrl.trim(), mode: 'light', isCustom: true };
    }
    if (settings?.loginLogoUrl && settings.loginLogoUrl.trim()) {
      return { url: settings.loginLogoUrl.trim(), mode: 'light', isCustom: true };
    }
    return resolveHotelLogo(settings, 'light');
  }
};
