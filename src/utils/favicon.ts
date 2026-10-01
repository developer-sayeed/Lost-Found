/**
 * Dynamic Favicon Utilities & Luxury Hotel Presets
 * Allows updating document <head> favicon in real-time and provides luxury presets
 */

export interface FaviconPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
}

// Crisp inline SVG data URIs for luxury hotel presets
export const LUXURY_FAVICON_PRESETS: FaviconPreset[] = [
  {
    id: 'warwick-crest',
    name: 'Warwick Royal Crest',
    description: 'Gold & wine shield crest with monogram',
    category: 'Brand Heritage',
    url: '/icon.svg'
  },
  {
    id: 'imperial-crown',
    name: 'Imperial Crown',
    description: 'Radiant five-point royal gold crown emblem',
    category: 'Luxury Hospitality',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fae08c"/><stop offset="50%" stop-color="%23dfb76c"/><stop offset="100%" stop-color="%239a7432"/></linearGradient><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%231e1b2e"/><stop offset="100%" stop-color="%230f0d17"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23bg)"/><path d="M22 68 L26 34 L40 50 L50 24 L60 50 L74 34 L78 68 Z" fill="url(%23g)" stroke="%23ffe89e" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="22" r="4.5" fill="%23fff" stroke="%23dfb76c" stroke-width="1.5"/><circle cx="26" cy="32" r="3.5" fill="%23fff"/><circle cx="74" cy="32" r="3.5" fill="%23fff"/><rect x="22" y="68" width="56" height="7" rx="3.5" fill="url(%23g)"/><circle cx="36" cy="71.5" r="1.5" fill="%23fff"/><circle cx="50" cy="71.5" r="1.5" fill="%23fff"/><circle cx="64" cy="71.5" r="1.5" fill="%23fff"/></svg>'
  },
  {
    id: 'golden-key',
    name: 'Concierge Golden Key',
    description: 'Classic antique gold hotel room key',
    category: 'Concierge & Keys',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fde68a"/><stop offset="50%" stop-color="%23d97706"/><stop offset="100%" stop-color="%2378350f"/></linearGradient><linearGradient id="kbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23kbg)"/><circle cx="38" cy="38" r="16" fill="none" stroke="url(%23kg)" stroke-width="6"/><circle cx="38" cy="38" r="7" fill="url(%23kg)"/><path d="M49 49 L76 76 L70 82 L65 77 L60 82 L55 77 L57 73 L49 65" fill="none" stroke="url(%23kg)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="72" r="2" fill="%23fff"/></svg>'
  },
  {
    id: 'bellhop-bell',
    name: 'Service Calling Bell',
    description: 'High-polish brass service bell symbol',
    category: 'Front Desk',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%2331103f"/></linearGradient><linearGradient id="bell" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="50%" stop-color="%23fef08a"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23bg2)"/><ellipse cx="50" cy="72" rx="32" ry="5" fill="%23475569"/><path d="M22 68 C22 44 34 38 47 36 L47 30 L45 30 L45 25 L55 25 L55 30 L53 30 L53 36 C66 38 78 44 78 68 Z" fill="url(%23bell)"/><rect x="18" y="68" width="64" height="6" rx="3" fill="url(%23bell)"/><circle cx="50" cy="22" r="4" fill="%23fef08a"/></svg>'
  },
  {
    id: 'diamond-star',
    name: '5-Star Prestige Star',
    description: 'Emerald and platinum star emblem',
    category: 'Excellence',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="ebg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23064e3b"/><stop offset="100%" stop-color="%23022c22"/></linearGradient><linearGradient id="goldStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fde047"/><stop offset="100%" stop-color="%23ca8a04"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23ebg)"/><polygon points="50,18 59,38 81,39 64,53 70,74 50,61 30,74 36,53 19,39 41,38" fill="url(%23goldStar)" stroke="%23fff" stroke-width="1.5"/><circle cx="50" cy="50" r="5" fill="%23fff"/></svg>'
  },
  {
    id: 'monogram-w',
    name: 'Serif W Monogram',
    description: 'Prestige typographic monogram in deep navy',
    category: 'Brand Heritage',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="nbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(%23nbg)"/><rect x="8" y="8" width="84" height="84" rx="18" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-opacity="0.3"/><text x="50" y="68" font-family="Cinzel, Georgia, serif" font-size="46" font-weight="bold" fill="%23f8fafc" text-anchor="middle" letter-spacing="2">W</text></svg>'
  }
];

/**
 * Updates all browser favicon references in document head
 */
export function updateDocumentFavicon(rawUrl?: string): void {
  if (typeof document === 'undefined') return;

  const targetUrl = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : '/icon.svg';

  // Identify MIME type if possible
  let mimeType = 'image/x-icon';
  if (targetUrl.startsWith('data:image/svg+xml') || targetUrl.endsWith('.svg')) {
    mimeType = 'image/svg+xml';
  } else if (targetUrl.startsWith('data:image/png') || targetUrl.endsWith('.png')) {
    mimeType = 'image/png';
  } else if (targetUrl.startsWith('data:image/jpeg') || targetUrl.endsWith('.jpg') || targetUrl.endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (targetUrl.startsWith('data:image/webp') || targetUrl.endsWith('.webp')) {
    mimeType = 'image/webp';
  }

  // 1. Standard icon link
  let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.type = mimeType;
  iconLink.href = targetUrl;

  // 2. Shortcut icon link
  let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
  if (!shortcutLink) {
    shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    document.head.appendChild(shortcutLink);
  }
  shortcutLink.href = targetUrl;

  // 3. Apple Touch Icon
  let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = targetUrl;
}
