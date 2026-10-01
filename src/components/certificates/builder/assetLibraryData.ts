import { LibraryAsset } from './types';

// Pre-built vector SVG assets encoded as high-fidelity data URIs or raw SVGs
export const PREBUILT_ASSETS: LibraryAsset[] = [
  // 1. Crests & Logos
  {
    id: 'asset_crest_warwick',
    name: 'Warwick Imperial Gold Crest',
    category: 'crests',
    type: 'svg',
    description: 'Embossed metallic gold crown crest with heraldic filigree',
    tags: ['hotel', 'crown', 'gold', 'warwick', 'luxury', 'crest'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 8L62 32L88 36L68 54L74 80L50 66L26 80L32 54L12 36L38 32L50 8Z" fill="#D97706" stroke="#FDE68A" stroke-width="2"/>
      <circle cx="50" cy="50" r="22" fill="#78350F" stroke="#F59E0B" stroke-width="2"/>
      <path d="M50 34L53 43L62 45L55 51L57 60L50 55L43 60L45 51L38 45L47 43L50 34Z" fill="#FCD34D"/>
      <path d="M30 84C42 80 58 80 70 84" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'asset_crest_royal_crown',
    name: 'Royal Crown of Honor',
    category: 'crests',
    type: 'svg',
    description: 'Polished 5-star monarchial crown for grand awards',
    tags: ['crown', 'royal', 'honor', 'gold', 'monarch'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 68L22 34L38 52L50 20L62 52L78 34L85 68H15Z" fill="#B45309" stroke="#FBBF24" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="15" y="68" width="70" height="12" rx="3" fill="#D97706" stroke="#FDE68A" stroke-width="2"/>
      <circle cx="15" cy="32" r="4.5" fill="#FDE68A" stroke="#78350F"/>
      <circle cx="50" cy="18" r="5.5" fill="#FDE68A" stroke="#78350F"/>
      <circle cx="85" cy="32" r="4.5" fill="#FDE68A" stroke="#78350F"/>
      <circle cx="35" cy="74" r="2.5" fill="#FEF08A"/>
      <circle cx="50" cy="74" r="3" fill="#EF4444"/>
      <circle cx="65" cy="74" r="2.5" fill="#FEF08A"/>
    </svg>`
  },
  {
    id: 'asset_crest_golden_lion',
    name: 'Imperial Heraldic Lion',
    category: 'crests',
    type: 'svg',
    description: 'Noble rampant lion emblem symbolizing fortitude and leadership',
    tags: ['lion', 'heraldic', 'crest', 'gold', 'leadership'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" fill="#451A03" stroke="#F59E0B" stroke-width="3"/>
      <path d="M46 22C43 25 43 30 47 33C48 34 46 38 49 41C48 43 45 44 47 47C49 50 53 49 54 46C56 46 59 49 57 53C56 56 53 55 52 58C51 61 54 64 57 66C59 67 62 64 64 66C66 68 64 74 61 76C57 78 51 77 47 75C42 72 40 68 38 63C36 57 37 50 40 45C42 41 43 36 41 32C40 28 42 24 46 22Z" fill="#FBBF24"/>
      <path d="M60 28L63 32L68 30L65 35L69 38L64 39L63 44L60 41L56 43L58 38L54 36L59 34L60 28Z" fill="#FDE68A"/>
      <circle cx="50" cy="50" r="40" stroke="#FBBF24" stroke-width="1" stroke-dasharray="3 3"/>
    </svg>`
  },
  {
    id: 'asset_crest_monogram',
    name: 'Luxury Monogram Insignia',
    category: 'crests',
    type: 'svg',
    description: 'Classical Roman floral monogram shield for 5-star brand identity',
    tags: ['monogram', 'shield', 'roman', 'crest', 'gold'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10C65 10 82 18 82 45C82 72 50 90 50 90C50 90 18 72 18 45C18 18 35 10 50 10Z" fill="#1E293B" stroke="#F59E0B" stroke-width="3"/>
      <path d="M50 18C61 18 74 24 74 46C74 67 50 82 50 82C50 82 26 67 26 46C26 24 39 18 50 18Z" stroke="#FDE68A" stroke-width="1.5"/>
      <text x="50" y="58" font-family="'Cinzel', serif" font-size="32" font-weight="bold" fill="#FCD34D" text-anchor="middle">W</text>
      <circle cx="50" cy="28" r="3" fill="#F59E0B"/>
    </svg>`
  },

  // 2. Seals & Medals
  {
    id: 'asset_seal_gold_foil_24k',
    name: '24K Embossed Gold Foil Seal',
    category: 'seals',
    type: 'svg',
    description: 'Star-toothed official 24K gold foil seal with serrated borders',
    tags: ['seal', 'gold', 'foil', 'official', '24k', 'serrated'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#D97706" stroke="#FDE68A" stroke-width="2"/>
      <circle cx="50" cy="50" r="40" fill="#B45309" stroke="#F59E0B" stroke-width="2"/>
      <circle cx="50" cy="50" r="34" stroke="#FDE68A" stroke-width="1.5" stroke-dasharray="2 2"/>
      <path d="M50 26L54 38L66 40L57 48L60 60L50 53L40 60L43 48L34 40L46 38L50 26Z" fill="#FEF08A"/>
      <path d="M50 64C42 64 36 68 32 74L40 92L50 86L60 92L68 74C64 68 58 64 50 64Z" fill="#DC2626" opacity="0.9"/>
    </svg>`
  },
  {
    id: 'asset_seal_laurel_honor',
    name: 'Imperial Laurel Wreath of Honor',
    category: 'seals',
    type: 'svg',
    description: 'Roman victory laurel wreath embracing a golden star',
    tags: ['laurel', 'wreath', 'victory', 'honor', 'medal', 'roman'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#0F172A" stroke="#EAB308" stroke-width="2.5"/>
      <path d="M26 48C26 62 36 74 50 76C42 72 36 62 36 48C36 34 44 26 50 24C36 26 26 36 26 48Z" fill="#FBBF24"/>
      <path d="M74 48C74 62 64 74 50 76C58 72 64 62 64 48C64 34 56 26 50 24C64 26 74 36 74 48Z" fill="#FBBF24"/>
      <polygon points="50,32 55,42 66,44 58,52 60,63 50,57 40,63 42,52 34,44 45,42" fill="#FEF08A"/>
      <text x="50" y="86" font-family="'Cinzel', serif" font-size="8" font-weight="bold" fill="#FDE68A" text-anchor="middle" letter-spacing="1">EXCELLENCE</text>
    </svg>`
  },
  {
    id: 'asset_seal_rosette_ribbon',
    name: 'Satin Pleated Rosette & Ribbon',
    category: 'seals',
    type: 'svg',
    description: 'Royal crimson rosette with twin swallowtail hanging ribbons',
    tags: ['rosette', 'ribbon', 'crimson', 'satin', 'medal', 'award'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 55L30 95L48 88L52 95L62 55Z" fill="#991B1B"/>
      <path d="M60 55L70 95L52 88L48 95L38 55Z" fill="#B91C1C"/>
      <circle cx="50" cy="42" r="32" fill="#DC2626" stroke="#FBBF24" stroke-width="3"/>
      <circle cx="50" cy="42" r="24" fill="#991B1B" stroke="#FDE68A" stroke-width="2"/>
      <circle cx="50" cy="42" r="18" fill="#F59E0B"/>
      <polygon points="50,30 53,38 62,39 55,45 57,54 50,49 43,54 45,45 38,39 47,38" fill="#FEF08A"/>
    </svg>`
  },

  // 3. Official Stamps & Watermarks
  {
    id: 'asset_stamp_official_hotel',
    name: 'Official Hotel Approved Rubber Stamp',
    category: 'stamps',
    type: 'svg',
    description: 'Authentic circular red verified certification stamp',
    tags: ['stamp', 'red', 'approved', 'verified', 'official', 'hotel'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="#DC2626" stroke-width="3.5" stroke-dasharray="6 2"/>
      <circle cx="50" cy="50" r="36" stroke="#DC2626" stroke-width="1.5"/>
      <path d="M24 50H76" stroke="#DC2626" stroke-width="2"/>
      <path d="M28 42H72" stroke="#DC2626" stroke-width="1"/>
      <path d="M28 58H72" stroke="#DC2626" stroke-width="1"/>
      <text x="50" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="7" font-weight="900" fill="#DC2626" text-anchor="middle" letter-spacing="2">WARWICK HOTELS</text>
      <text x="50" y="52" font-family="'Cinzel', serif" font-size="11" font-weight="900" fill="#DC2626" text-anchor="middle" letter-spacing="3">VERIFIED</text>
      <text x="50" y="68" font-family="'Plus Jakarta Sans', sans-serif" font-size="7" font-weight="800" fill="#DC2626" text-anchor="middle" letter-spacing="1">OFFICIAL SEAL</text>
    </svg>`
  },
  {
    id: 'asset_stamp_arabic_certified',
    name: 'Traditional Arabic Approval Stamp',
    category: 'stamps',
    type: 'svg',
    description: 'Royal emerald Arabic seal with authenticated certificate text (ختم معتمد)',
    tags: ['stamp', 'arabic', 'certified', 'emerald', 'traditional'],
    svgContent: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="#059669" stroke-width="3" stroke-dasharray="4 2"/>
      <circle cx="50" cy="50" r="37" stroke="#10B981" stroke-width="1.5"/>
      <polygon points="50,18 82,50 50,82 18,50" stroke="#059669" stroke-width="1" fill="none"/>
      <text x="50" y="47" font-family="'Amiri', serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">معتمد رسمياً</text>
      <text x="50" y="63" font-family="'Amiri', serif" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">فندق وارويك</text>
      <circle cx="50" cy="27" r="2.5" fill="#059669"/>
      <circle cx="50" cy="73" r="2.5" fill="#059669"/>
    </svg>`
  },

  // 4. Signatures & Flourishes
  {
    id: 'asset_sig_gm_executive',
    name: 'Executive GM Calligraphy Signature',
    category: 'signatures',
    type: 'svg',
    description: 'Executive fountain-pen cursive ink flourish signature',
    tags: ['signature', 'cursive', 'ink', 'executive', 'gm'],
    svgContent: `<svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 42C24 16 38 8 46 22C54 36 62 48 76 28C84 16 94 22 104 38C114 54 128 32 142 20C148 15 152 24 146 36C140 48 116 54 90 50C64 46 42 48 20 54" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 28C60 26 78 22 92 24" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'asset_flourish_gold_divider',
    name: 'Victorian Gold Flourish Divider',
    category: 'signatures',
    type: 'svg',
    description: 'Symmetric Victorian filigree ornament for separating certificate sections',
    tags: ['flourish', 'divider', 'gold', 'victorian', 'filigree', 'separator'],
    svgContent: `<svg viewBox="0 0 240 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20H85M155 20H230" stroke="#D97706" stroke-width="2" stroke-linecap="round"/>
      <circle cx="120" cy="20" r="5" fill="#F59E0B" stroke="#FDE68A" stroke-width="1.5"/>
      <circle cx="108" cy="20" r="2.5" fill="#F59E0B"/>
      <circle cx="132" cy="20" r="2.5" fill="#F59E0B"/>
      <path d="M92 20C100 12 110 12 120 16C130 12 140 12 148 20" stroke="#B45309" stroke-width="1.5" fill="none"/>
      <path d="M92 20C100 28 110 28 120 24C130 28 140 28 148 20" stroke="#B45309" stroke-width="1.5" fill="none"/>
    </svg>`
  },

  // 5. Background Textures
  {
    id: 'asset_bg_parchment_gold',
    name: 'Luxury Ivory Parchment Texture',
    category: 'textures',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
    description: 'High-resolution natural antique ivory paper parchment',
    tags: ['background', 'parchment', 'paper', 'ivory', 'texture']
  },
  {
    id: 'asset_bg_marble_warm',
    name: 'Warm Imperial Marble Texture',
    category: 'textures',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&auto=format&fit=crop&q=80',
    description: 'Subtle alabaster marble veins ideal for 5-star diplomas',
    tags: ['background', 'marble', 'stone', 'white', 'texture']
  },
  {
    id: 'asset_bg_navy_luxury',
    name: 'Midnight Navy Fine Damask',
    category: 'textures',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    description: 'Dark blue luxury executive background for dark mode certificates',
    tags: ['background', 'navy', 'dark', 'damask', 'luxury']
  },
  {
    id: 'asset_bg_gold_shimmer',
    name: '24K Golden Bokeh Texture',
    category: 'textures',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'Warm gold light particles for celebratory grand awards',
    tags: ['background', 'gold', 'bokeh', 'shimmer', 'celebration']
  }
];

// Vector Icon Keys available for instant insertion
export const ICON_CATALOG_KEYS: Array<{ key: string; label: string; category: string }> = [
  // Awards & Recognition
  { key: 'Award', label: 'Honor Award', category: 'awards' },
  { key: 'Crown', label: 'Imperial Crown', category: 'awards' },
  { key: 'Shield', label: 'Shield of Trust', category: 'awards' },
  { key: 'Star', label: '5-Star Rating', category: 'awards' },
  { key: 'Trophy', label: 'Grand Trophy', category: 'awards' },
  { key: 'Medal', label: 'Service Medal', category: 'awards' },
  { key: 'Sparkles', label: 'Excellence Sparkles', category: 'awards' },
  { key: 'Gem', label: 'Diamond Diamond', category: 'awards' },
  { key: 'Flame', label: 'Passion & Devotion', category: 'awards' },

  // Hospitality & Service
  { key: 'Building2', label: 'Luxury Hotel', category: 'hospitality' },
  { key: 'Hotel', label: 'Resort & Suites', category: 'hospitality' },
  { key: 'UtensilsCrossed', label: 'Fine Dining F&B', category: 'hospitality' },
  { key: 'Coffee', label: 'Executive Lounge', category: 'hospitality' },
  { key: 'Sparkle', label: 'Pristine Cleanliness', category: 'hospitality' },
  { key: 'HeartHandshake', label: 'Guest Service Care', category: 'hospitality' },
  { key: 'Compass', label: 'Concierge Guidance', category: 'hospitality' },
  { key: 'Clock', label: 'Punctuality & Tenure', category: 'hospitality' },

  // Leadership & Certifications
  { key: 'UserCheck', label: 'Employee of Month', category: 'corporate' },
  { key: 'GraduationCap', label: 'Certified Diploma', category: 'corporate' },
  { key: 'Briefcase', label: 'Management Executive', category: 'corporate' },
  { key: 'CheckCircle2', label: 'Verified Qualified', category: 'corporate' },
  { key: 'Bookmark', label: 'Honorary Milestone', category: 'corporate' },
  { key: 'Landmark', label: 'Heritage Institution', category: 'corporate' },
  { key: 'ScrollText', label: 'Official Ordinance', category: 'corporate' },
  { key: 'Feather', label: 'Signatory Pen', category: 'corporate' },
  { key: 'QrCode', label: 'Digital Scan QR', category: 'corporate' },
  { key: 'Lock', label: 'Security Verified', category: 'corporate' },
  { key: 'Globe', label: 'International Standard', category: 'corporate' }
];

const CUSTOM_ASSETS_KEY = 'cert_builder_user_custom_assets';

export function getStoredCustomAssets(): LibraryAsset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ASSETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load custom assets:', e);
    return [];
  }
}

export function saveCustomAssetToStorage(asset: LibraryAsset): void {
  try {
    const current = getStoredCustomAssets();
    const updated = [asset, ...current.filter((a) => a.id !== asset.id)];
    localStorage.setItem(CUSTOM_ASSETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom asset:', e);
  }
}

export function deleteCustomAssetFromStorage(id: string): void {
  try {
    const current = getStoredCustomAssets();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(CUSTOM_ASSETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete custom asset:', e);
  }
}
