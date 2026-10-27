export interface BackgroundPreset {
  id: string;
  name: string;
  desc: string;
  bgClass: string;
  accentColor: string;
  cardBorder: string;
}

export const HEADER_BG_PRESETS = [
  { label: 'Plum Purple', color: '#491754' },
  { label: 'Luxury Navy', color: '#020617' },
  { label: 'Deep Slate', color: '#0f172a' },
  { label: 'Midnight Indigo', color: '#1e1b4b' },
  { label: 'Emerald Forest', color: '#064e3b' },
  { label: 'Wine Crimson', color: '#4c0519' },
  { label: 'Royal Sapphire', color: '#1e3a8a' },
  { label: 'Obsidian Black', color: '#000000' }
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'plum-violet',
    name: 'Royal Plum & Velvet Violet (5-Star Luxury)',
    desc: 'Royal plum (#180F1A / #491754) with radiant fuchsia & violet ambient aura',
    bgClass: 'bg-gradient-to-br from-[#180F1A] via-[#491754] to-[#0F0911]',
    accentColor: '#A32EB8',
    cardBorder: 'border-[#491754]'
  },
  {
    id: 'luxury-dark',
    name: 'Luxury Obsidian Dark',
    desc: 'Deep slate backdrop with gold & indigo glow',
    bgClass: 'bg-slate-950',
    accentColor: '#4F46E5',
    cardBorder: 'border-slate-800'
  },
  {
    id: 'royal-indigo',
    name: 'Royal Sapphire Indigo',
    desc: 'Midnight navy gradient with royal blue sheen',
    bgClass: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
    accentColor: '#6366F1',
    cardBorder: 'border-indigo-900/50'
  },
  {
    id: 'hotel-emerald',
    name: 'Emerald & Gold Prestige',
    desc: 'Dark forest emerald with rich amber warmth',
    bgClass: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
    accentColor: '#10B981',
    cardBorder: 'border-emerald-900/50'
  },
  {
    id: 'minimal-clean',
    name: 'Executive Light Slate',
    desc: 'Clean, high-contrast modern light backdrop',
    bgClass: 'bg-slate-100',
    accentColor: '#0F172A',
    cardBorder: 'border-slate-300'
  },
  {
    id: 'custom-color',
    name: 'Custom Solid Color',
    desc: 'Pick your own brand background tone or hex value',
    bgClass: '',
    accentColor: '#A32EB8',
    cardBorder: 'border-slate-800'
  },
  {
    id: 'custom-gradient',
    name: 'Custom Gradient Colors',
    desc: 'Blend two custom colors with directional flow controls',
    bgClass: '',
    accentColor: '#D946EF',
    cardBorder: 'border-fuchsia-800'
  },
  {
    id: 'custom-image',
    name: 'Custom Wallpaper Image (Photo / Upload)',
    desc: 'Use external high-res photo or direct upload from computer',
    bgClass: '',
    accentColor: '#A32EB8',
    cardBorder: 'border-slate-800'
  },
  {
    id: 'custom-video',
    name: 'Custom Cinematic Video Background (URL / Upload)',
    desc: 'Looping MP4/WebM video via URL or direct device upload',
    bgClass: 'bg-slate-950',
    accentColor: '#A32EB8',
    cardBorder: 'border-slate-800'
  }
];
