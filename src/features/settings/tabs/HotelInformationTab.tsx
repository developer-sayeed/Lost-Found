import React, { useState, useEffect } from 'react';
import {
  Upload,
  Building,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  Sliders,
  Check,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  LayoutTemplate,
  Scaling,
  Globe,
  Clock,
  X,
  Crown
} from 'lucide-react';
import { HotelLink, HotelSettings } from '../../../types';
import { DEFAULT_LIGHT_LOGO_SVG, DEFAULT_DARK_LOGO_SVG } from '../../../utils/logoHelper';
import { RecentFavicon, RecentLogo } from '../types/settings.feature.types';

interface HotelInformationTabProps {
  settings: HotelSettings;
  updateSettings: (settings: Partial<HotelSettings>) => Promise<any>;
  isSyncing: boolean;
  onNavigateToCategories: () => void;
  setSaveSuccess: (success: boolean) => void;
}

export const HotelInformationTab: React.FC<HotelInformationTabProps> = ({
  settings,
  updateSettings,
  isSyncing,
  onNavigateToCategories,
  setSaveSuccess
}) => {
  // Hotel Info State
  const [hotelName, setHotelName] = useState(settings.hotelName);
  const [hotelArabicName, setHotelArabicName] = useState(settings.hotelArabicName || '');
  const [hotelSubTitle, setHotelSubTitle] = useState(settings.hotelSubTitle || 'Hotels and Resorts');
  const [address, setAddress] = useState(settings.address);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [emailAddress, setEmailAddress] = useState(settings.emailAddress);
  const [website, setWebsite] = useState(settings.website);
  const [defaultDispatchDurationDays, setDefaultDispatchDurationDays] = useState(
    settings.defaultDispatchDurationDays || 90
  );
  const [defaultStoreLocation, setDefaultStoreLocation] = useState(
    settings.defaultStoreLocation || 'HK Office'
  );
  const [codePrefix, setCodePrefix] = useState(settings.codePrefix || 'LF');
  const [links, setLinks] = useState<HotelLink[]>(settings.additionalLinks || []);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);
  const [logoLightPreview, setLogoLightPreview] = useState<string>(settings.logoLightUrl || '');
  const [logoDarkPreview, setLogoDarkPreview] = useState<string>(settings.logoDarkUrl || '');
  const [previewThemeTab, setPreviewThemeTab] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  const [logoWidth, setLogoWidth] = useState<number>(settings.logoWidth || 140);
  const [logoHeight, setLogoHeight] = useState<number>(settings.logoHeight || 48);
  const [logoFit, setLogoFit] = useState<'contain' | 'cover' | 'fill'>(settings.logoFit || 'contain');
  const [liveSyncLogo, setLiveSyncLogo] = useState<boolean>(true);

  // Favicon & Collapsed Sidebar Icon State
  const [faviconPreview, setFaviconPreview] = useState<string>(settings.faviconUrl || '/icon.svg');
  const [customFaviconUrl, setCustomFaviconUrl] = useState<string>('');
  const [liveSyncFavicon, setLiveSyncFavicon] = useState<boolean>(true);

  const [showDepartmentProcessingShare, setShowDepartmentProcessingShare] = useState<boolean>(
    () => Boolean(settings.showDepartmentProcessingShare)
  );

  useEffect(() => {
    setHotelName(settings.hotelName);
    setHotelArabicName(settings.hotelArabicName || '');
    setHotelSubTitle(settings.hotelSubTitle || 'Hotels and Resorts');
    setAddress(settings.address);
    setPhoneNumber(settings.phoneNumber);
    setEmailAddress(settings.emailAddress);
    setWebsite(settings.website);
    setDefaultDispatchDurationDays(settings.defaultDispatchDurationDays || 90);
    setDefaultStoreLocation(settings.defaultStoreLocation || 'HK Office');
    setCodePrefix(settings.codePrefix || 'LF');
    setLinks(settings.additionalLinks || []);
    setLogoPreview(settings.logoUrl);
    setLogoLightPreview(settings.logoLightUrl || '');
    setLogoDarkPreview(settings.logoDarkUrl || '');
    setLogoWidth(settings.logoWidth || 140);
    setLogoHeight(settings.logoHeight || 48);
    setLogoFit(settings.logoFit || 'contain');
    setFaviconPreview(settings.faviconUrl || '/icon.svg');
    setShowDepartmentProcessingShare(Boolean(settings.showDepartmentProcessingShare));
  }, [settings]);

  // Recents management
  const [recentLogos, setRecentLogos] = useState<RecentLogo[]>(() => {
    try {
      const stored = localStorage.getItem('warwick_recent_logos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveRecentLogo = (url: string, name?: string) => {
    if (!url || !url.trim()) return;
    setRecentLogos(prev => {
      const filtered = prev.filter(f => f.url !== url);
      const newEntry: RecentLogo = {
        id: `logo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Logo Upload #${filtered.length + 1}`,
        url,
        uploadedAt: new Date().toISOString()
      };
      const updated = [newEntry, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('warwick_recent_logos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentLogo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentLogos(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('warwick_recent_logos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentLogos = () => {
    setRecentLogos([]);
    try {
      localStorage.removeItem('warwick_recent_logos');
    } catch {}
  };

  const handleApplyLogo = (url: string) => {
    setLogoPreview(url);
    updateSettings({ logoUrl: url });
  };

  const [recentFavicons, setRecentFavicons] = useState<RecentFavicon[]>(() => {
    try {
      const stored = localStorage.getItem('warwick_recent_favicons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveRecentFavicon = (url: string, name?: string) => {
    if (!url || !url.trim()) return;
    setRecentFavicons(prev => {
      const filtered = prev.filter(f => f.url !== url);
      const newEntry: RecentFavicon = {
        id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Favicon Upload #${filtered.length + 1}`,
        url,
        uploadedAt: new Date().toISOString()
      };
      const updated = [newEntry, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('warwick_recent_favicons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentFavicon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentFavicons(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('warwick_recent_favicons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentFavicons = () => {
    setRecentFavicons([]);
    try {
      localStorage.removeItem('warwick_recent_favicons');
    } catch {}
  };

  const handleApplyFavicon = (url: string, autoSave = liveSyncFavicon) => {
    setFaviconPreview(url);
    if (autoSave) {
      updateSettings({ faviconUrl: url });
    }
  };

  const handleFaviconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          handleApplyFavicon(dataUrl);
          saveRecentFavicon(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLightLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setLogoLightPreview(dataUrl);
          saveRecentLogo(dataUrl, `[Light] ${file.name}`);
          updateSettings({ logoLightUrl: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setLogoDarkPreview(dataUrl);
          saveRecentLogo(dataUrl, `[Dark] ${file.name}`);
          updateSettings({ logoDarkUrl: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLogoDimensions = (w: number, h: number, fit?: 'contain' | 'cover' | 'fill', autoSave = liveSyncLogo) => {
    const validW = Math.max(40, Math.min(220, Math.round(w)));
    const validH = Math.max(20, Math.min(100, Math.round(h)));
    const finalFit = fit || logoFit;
    setLogoWidth(validW);
    setLogoHeight(validH);
    if (fit) setLogoFit(fit);

    if (autoSave) {
      updateSettings({
        logoWidth: validW,
        logoHeight: validH,
        logoFit: finalFit
      });
    }
  };

  const addLink = () => {
    const newLink: HotelLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      url: 'https://'
    };
    setLinks([...links, newLink]);
  };

  const updateLink = (id: string, field: 'label' | 'url', val: string) => {
    setLinks(links.map(l => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    await updateSettings({
      hotelName,
      hotelArabicName,
      hotelSubTitle,
      address,
      phoneNumber,
      emailAddress,
      website,
      defaultDispatchDurationDays: Number(defaultDispatchDurationDays),
      defaultStoreLocation,
      codePrefix,
      additionalLinks: links,
      logoUrl: logoPreview,
      logoLightUrl: logoLightPreview,
      logoDarkUrl: logoDarkPreview,
      logoWidth: Number(logoWidth),
      logoHeight: Number(logoHeight),
      logoFit,
      faviconUrl: faviconPreview,
      showDepartmentProcessingShare
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6 animate-fade-in">
        {/* Dynamic Dual-Theme Brand Logos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white mb-1">
                <Upload className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                <h2 className="text-sm font-bold">Dynamic Hotel Brand Logos (Light Mode &amp; Dark Mode)</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                  Dual Theme Responsive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload separate logos tailored for Light Mode (bright background) and Dark Mode (dark/nighttime background). The system dynamically renders the matching logo in real-time.
              </p>
            </div>

            {/* Instant Theme Simulator Switch */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex-shrink-0">
              <button
                type="button"
                onClick={() => setPreviewThemeTab('light')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  previewThemeTab === 'light'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light View</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewThemeTab('dark')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  previewThemeTab === 'dark'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Dark View</span>
              </button>
            </div>
          </div>

          {/* Dual-Card Grid for Light and Dark Logos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* 1. LIGHT MODE LOGO CARD */}
            <div className={`p-5 rounded-2xl border transition-all ${
              previewThemeTab === 'light'
                ? 'border-fuchsia-400/60 ring-2 ring-fuchsia-400/20 bg-slate-50/70 dark:bg-slate-800/40'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Light Mode Logo
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Daytime Canvas
                </span>
              </div>

              <div className="w-full h-32 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 shadow-2xs relative group overflow-hidden">
                <img
                  src={logoLightPreview || logoPreview || DEFAULT_LIGHT_LOGO_SVG}
                  alt="Light Mode Logo Preview"
                  className="max-h-20 max-w-[90%] object-contain transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 text-[9px] font-bold text-amber-700 bg-amber-50/90 px-2 py-0.5 rounded-full border border-amber-200/80">
                  {logoLightPreview ? 'Custom Light' : logoPreview ? 'Fallback Primary' : 'Warwick Crest'}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-fuchsia-600" />
                    <span>{logoLightPreview ? 'Change Light Logo' : 'Upload Light Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLightLogoChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setLogoLightPreview(DEFAULT_LIGHT_LOGO_SVG);
                      updateSettings({ logoLightUrl: DEFAULT_LIGHT_LOGO_SVG });
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-semibold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/60 hover:bg-fuchsia-100 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 transition-all cursor-pointer"
                    title="Reset to Warwick Royal Plum & Gold vector emblem"
                  >
                    <Sparkles className="w-3 h-3 text-fuchsia-600" />
                    <span>Preset Crest</span>
                  </button>

                  {logoLightPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoLightPreview('');
                        updateSettings({ logoLightUrl: '' });
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Renders when the system is set to Light Mode. Transparent PNG or SVG recommended.
                </p>
              </div>
            </div>

            {/* 2. DARK MODE LOGO CARD */}
            <div className={`p-5 rounded-2xl border transition-all ${
              previewThemeTab === 'dark'
                ? 'border-fuchsia-400/60 ring-2 ring-fuchsia-400/20 bg-slate-900/40 dark:bg-slate-900/60'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dark Mode Logo
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-fuchsia-400 uppercase tracking-wider">
                  Obsidian Canvas
                </span>
              </div>

              <div className="w-full h-32 bg-[#0F0911] border border-fuchsia-900/40 rounded-xl flex flex-col items-center justify-center p-3 shadow-2xs relative group overflow-hidden">
                <img
                  src={logoDarkPreview || logoPreview || DEFAULT_DARK_LOGO_SVG}
                  alt="Dark Mode Logo Preview"
                  className="max-h-20 max-w-[90%] object-contain transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 text-[9px] font-bold text-fuchsia-300 bg-fuchsia-950/80 px-2 py-0.5 rounded-full border border-fuchsia-800">
                  {logoDarkPreview ? 'Custom Dark' : logoPreview ? 'Fallback Primary' : 'Luminescent Gold'}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>{logoDarkPreview ? 'Change Dark Logo' : 'Upload Dark Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleDarkLogoChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setLogoDarkPreview(DEFAULT_DARK_LOGO_SVG);
                      updateSettings({ logoDarkUrl: DEFAULT_DARK_LOGO_SVG });
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                    title="Reset to Warwick Luminescent Gold vector emblem"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Preset Crest</span>
                  </button>

                  {logoDarkPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoDarkPreview('');
                        updateSettings({ logoDarkUrl: '' });
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Renders when the system is set to Dark Mode. Crisp white, gold, or silver emblems work best.
                </p>
              </div>
            </div>
          </div>

          {/* Informational Intelligence Banner */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-fuchsia-50/60 dark:bg-fuchsia-950/30 border border-fuchsia-100 dark:border-fuchsia-900/50 text-xs text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Automatic Theme Switching:</strong> The navigation sidebar, header, and login portal automatically select the appropriate logo based on whether Light or Dark theme is active. If only one logo is uploaded, it is automatically shared across both themes.
            </p>
          </div>

          {/* DYNAMIC SIDEBAR LOGO WIDTH & HEIGHT CONTROLS */}
          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Sidebar Logo Dynamic Width &amp; Height Control
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Adjust the exact size, width, height, and display fit for the logo rendered in the navigation sidebar.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={liveSyncLogo}
                    onChange={e => setLiveSyncLogo(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Live Instant Update</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleApplyLogoDimensions(140, 48, 'contain')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-all cursor-pointer"
                  title="Reset logo size to default (140 × 48 px)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Quick Size Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { label: 'Compact', w: 110, h: 36, desc: '110 × 36 px' },
                  { label: 'Standard', w: 140, h: 48, desc: '140 × 48 px' },
                  { label: 'Wide', w: 165, h: 52, desc: '165 × 52 px' },
                  { label: 'Large Banner', w: 195, h: 60, desc: '195 × 60 px' },
                  { label: 'Square Emblem', w: 50, h: 50, desc: '50 × 50 px' },
                  { label: 'Full Width', w: 215, h: 65, desc: '215 × 65 px' }
                ].map(preset => {
                  const isSelected = logoWidth === preset.w && logoHeight === preset.h;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyLogoDimensions(preset.w, preset.h)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-900 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine Sliders & Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Scaling className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Logo Width</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={40}
                      max={220}
                      value={logoWidth}
                      onChange={e => handleApplyLogoDimensions(Number(e.target.value), logoHeight)}
                      className="w-16 px-2 py-0.5 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    />
                    <span className="text-[10px] font-semibold text-slate-500">px</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={40}
                  max={220}
                  step={2}
                  value={logoWidth}
                  onChange={e => handleApplyLogoDimensions(Number(e.target.value), logoHeight)}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>40px</span>
                  <span>Default: 140px</span>
                  <span>220px</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Scaling className="w-3.5 h-3.5 text-indigo-600 rotate-90" />
                    <span>Logo Height</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={20}
                      max={100}
                      value={logoHeight}
                      onChange={e => handleApplyLogoDimensions(logoWidth, Number(e.target.value))}
                      className="w-16 px-2 py-0.5 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    />
                    <span className="text-[10px] font-semibold text-slate-500">px</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={20}
                  max={100}
                  step={2}
                  value={logoHeight}
                  onChange={e => handleApplyLogoDimensions(logoWidth, Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>20px</span>
                  <span>Default: 48px</span>
                  <span>100px</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2 md:col-span-2 lg:col-span-1">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Aspect Ratio &amp; Fit Mode</span>
                </label>

                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {(['contain', 'cover', 'fill'] as const).map(fit => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => handleApplyLogoDimensions(logoWidth, logoHeight, fit)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        logoFit === fit
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500">
                  {logoFit === 'contain' && '• Contain: Preserves aspect ratio without cropping (Recommended)'}
                  {logoFit === 'cover' && '• Cover: Fills width and height, clipping overflow'}
                  {logoFit === 'fill' && '• Fill: Stretches image to exact dimensions'}
                </div>
              </div>
            </div>

            {/* Real-Time Live Sidebar Header Simulation Preview */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">Live Sidebar Header Preview</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-[10px] font-mono rounded-md border border-slate-700">
                  {logoWidth} × {logoHeight} px • {logoFit}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[100px]">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Expanded Sidebar (w-64)
                  </div>
                  <div
                    className="flex items-center justify-center overflow-hidden transition-all bg-slate-900/40 rounded-lg p-1 border border-slate-800"
                    style={{
                      width: `${logoWidth}px`,
                      height: `${logoHeight}px`,
                      maxWidth: '100%'
                    }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="w-full h-full"
                        style={{
                          objectFit: logoFit,
                          maxWidth: `${logoWidth}px`,
                          maxHeight: `${logoHeight}px`
                        }}
                      />
                    ) : (
                      <div className="flex items-center space-x-1 text-indigo-400">
                        <Crown className="w-6 h-6" />
                        <span className="text-xs font-serif font-bold text-white">WARWICK</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[100px]">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Collapsed Sidebar (w-20)
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-2xs">
                    {faviconPreview || logoPreview ? (
                      <img
                        src={faviconPreview || logoPreview}
                        alt="Favicon Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Crown className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Website Favicon & Collapsed Sidebar Icon Management */}
        <div id="settings-favicon-management" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-slate-900">
                <Globe className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold">Website Favicon &amp; Collapsed Sidebar Icon (w-20)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Dynamic System
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Control the browser tab favicon and the collapsed navigation icon (80px / <code className="text-indigo-600 font-mono">w-20</code> sidebar). Admins can change, reset, or upload a new favicon anytime.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={liveSyncFavicon}
                  onChange={e => setLiveSyncFavicon(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Instant Live Save</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Browser Tab Simulation</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Synced</span>
                </span>
              </div>

              <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800">
                <div className="flex items-center space-x-2 max-w-[260px] bg-slate-800 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700 shadow-sm">
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center overflow-hidden rounded bg-slate-900/60 p-0.5">
                    <img
                      src={faviconPreview || '/icon.svg'}
                      alt="Tab Favicon"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {hotelName || 'Warwick Hotel'} - Lost &amp; Found
                  </span>
                  <span className="text-slate-500 hover:text-slate-300 text-xs ml-auto font-bold cursor-default">×</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Updates the active browser window tab, bookmarks, and shortcuts in real-time.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Collapsed Sidebar Header (w-20)</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-300">80px Rail Mode</span>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center justify-center">
                <div className="w-20 bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 p-1.5 flex items-center justify-center shadow-inner border border-slate-700">
                    <img
                      src={faviconPreview || '/icon.svg'}
                      alt="Sidebar Favicon"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                    LF
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Displays prominently in the compact navigation bar when collapsed (<code className="text-indigo-300 font-mono">w-20</code>).
              </p>
            </div>
          </div>

          {/* Upload & Direct URL Controls */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Custom Favicon or Use Image Link</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Upload from Device (.svg, .png, .ico, .jpg)
                </label>
                <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs transition-colors">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Choose Favicon File</span>
                  <input
                    type="file"
                    accept="image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
                    onChange={handleFaviconFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quick Action
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleApplyFavicon(logoPreview || '/icon.svg')}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Use Main Hotel Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFavicon('/icon.svg')}
                    title="Reset to default Warwick Crest"
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Direct Image URL / Data URI
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="https://example.com/favicon.png or data:image/svg+xml;..."
                  value={customFaviconUrl}
                  onChange={e => setCustomFaviconUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white"
                />
                <button
                  type="button"
                  disabled={!customFaviconUrl.trim()}
                  onClick={() => {
                    if (customFaviconUrl.trim()) {
                      const url = customFaviconUrl.trim();
                      handleApplyFavicon(url);
                      saveRecentFavicon(url, 'Custom Favicon Link');
                      setCustomFaviconUrl('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  Apply URL
                </button>
              </div>
            </div>
          </div>

          {/* Recently Uploaded Favicons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recently Uploaded Favicons</span>
              </label>
              {recentFavicons.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllRecentFavicons}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                >
                  Clear Recent
                </button>
              )}
            </div>

            {recentFavicons.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No recently uploaded favicons</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload a favicon file from your device or apply an image URL above to save it here for instant switching.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentFavicons.map((item) => {
                  const isSelected = faviconPreview === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleApplyFavicon(item.url)}
                      className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 p-1.5 shadow-2xs">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => removeRecentFavicon(item.id, e)}
                              title="Remove from recents"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Uploaded Logos Section */}
          <div className="space-y-3 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recently Uploaded Logos</span>
              </label>
              {recentLogos.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllRecentLogos}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                >
                  Clear Recent
                </button>
              )}
            </div>

            {recentLogos.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No recently uploaded logos</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload a logo file from your device to save it here for instant switching across the portal, sidebar, and login screen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentLogos.map((item) => {
                  const isSelected = logoPreview === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleApplyLogo(item.url)}
                      className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 p-1 shadow-2xs overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => removeRecentLogo(item.id, e)}
                              title="Remove from recents"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Property & Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 mb-1">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold">Property &amp; Contact Information</h2>
          </div>
          <p className="text-xs text-slate-500">
            Official property contact info printed on receipts and export documents.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hotel Name (English)
              </label>
              <input
                id="input-settings-hotel-name"
                type="text"
                value={hotelName}
                onChange={e => setHotelName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hotel Name (Arabic)
              </label>
              <input
                id="input-settings-hotel-arabic-name"
                type="text"
                value={hotelArabicName}
                onChange={e => setHotelArabicName(e.target.value)}
                dir="rtl"
                placeholder="فندق وارويك"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Subtitle
              </label>
              <input
                id="input-settings-subtitle"
                type="text"
                value={hotelSubTitle}
                onChange={e => setHotelSubTitle(e.target.value)}
                placeholder="Hotels and Resorts"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code Prefix (Item IDs)
              </label>
              <input
                id="input-settings-code-prefix"
                type="text"
                value={codePrefix}
                onChange={e => setCodePrefix(e.target.value)}
                placeholder="LF"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                id="input-settings-phone"
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="input-settings-email"
                type="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Physical Address
              </label>
              <input
                id="input-settings-address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Website URL
              </label>
              <input
                id="input-settings-website"
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Default Retention Duration (Days)
                </label>
                <button
                  type="button"
                  onClick={onNavigateToCategories}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Configure Per-Category Policy &rarr;
                </button>
              </div>
              <input
                type="number"
                value={defaultDispatchDurationDays}
                onChange={e => setDefaultDispatchDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Fallback retention duration when an item doesn&apos;t match any custom category policy.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Storage Location
              </label>
              <input
                type="text"
                value={defaultStoreLocation}
                onChange={e => setDefaultStoreLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Additional Links Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 mb-1">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold">Portal &amp; Useful Links</h2>
              </div>
              <p className="text-xs text-slate-500">
                Quick reference links for staff directory, department resources, or courier tracking.
              </p>
            </div>

            <button
              type="button"
              id="btn-add-link"
              onClick={addLink}
              className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Link</span>
            </button>
          </div>

          {links.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No additional links added. Click &quot;Add Link&quot; to add one.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Concierge Resources)"
                    value={link.label}
                    onChange={e => updateLink(link.id, 'label', e.target.value)}
                    className="w-1/3 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={link.url}
                    onChange={e => updateLink(link.id, 'url', e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Processing Share Toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Processing Share (Staff Performance Page)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable the Department Processing Share chart on the Staff Performance dashboard. By default, it is hidden.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={showDepartmentProcessingShare}
                onChange={(e) => setShowDepartmentProcessingShare(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Save Hotel Information Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSyncing}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSyncing ? 'Saving Hotel Information...' : 'Save Hotel Information & Branding'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
