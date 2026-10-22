import React, { useState, useRef } from 'react';
import {
  LogIn,
  Upload,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Shield,
  Eye,
  Sliders,
  Palette,
  Image as ImageIcon,
  Type,
  Lock,
  Phone,
  Mail,
  PartyPopper,
  Info,
  HelpCircle,
  Layers,
  ArrowRight,
  Video,
  Film,
  Play
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { HotelSettings, ToastConfig } from '../types';
import { triggerConfetti } from '../utils/confetti';

const HEADER_BG_PRESETS = [
  { label: 'Plum Purple', color: '#491754' },
  { label: 'Luxury Navy', color: '#020617' },
  { label: 'Deep Slate', color: '#0f172a' },
  { label: 'Midnight Indigo', color: '#1e1b4b' },
  { label: 'Emerald Forest', color: '#064e3b' },
  { label: 'Wine Crimson', color: '#4c0519' },
  { label: 'Royal Sapphire', color: '#1e3a8a' },
  { label: 'Sleek Charcoal', color: '#18181b' },
  { label: 'Deep Teal', color: '#134e4a' },
  { label: 'Pure Black', color: '#000000' }
];

const BG_THEMES = [
  {
    id: 'plum-violet',
    name: 'Plum, Fuchsia & Violet (Signature)',
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

export const LoginPageCustomizer: React.FC<{ onNavigateToAlerts?: () => void }> = ({ onNavigateToAlerts }) => {
  const { settings, updateSettings, isSyncing } = useApp();
  const { user } = useAuth();

  // Branding & Logo
  const [loginLogoUrl, setLoginLogoUrl] = useState<string>(settings.loginLogoUrl || settings.logoUrl || '');
  const [loginLogoWidth, setLoginLogoWidth] = useState<number>(settings.loginLogoWidth || settings.logoWidth || 140);
  const [loginLogoHeight, setLoginLogoHeight] = useState<number>(settings.loginLogoHeight || settings.logoHeight || 48);
  const [loginLogoFit, setLoginLogoFit] = useState<'contain' | 'cover' | 'fill'>(settings.loginLogoFit || settings.logoFit || 'contain');
  const [showLoginCrownBadge, setShowLoginCrownBadge] = useState<boolean>(settings.showLoginCrownBadge !== false);

  // Typography & Titles (Default empty - no hardcoded defaults)
  const [loginPageTitle, setLoginPageTitle] = useState<string>(settings.loginPageTitle || '');
  const [loginPageSubtitle, setLoginPageSubtitle] = useState<string>(settings.loginPageSubtitle || '');
  const [loginPageTagline, setLoginPageTagline] = useState<string>(settings.loginPageTagline || '');
  const [loginFooterText, setLoginFooterText] = useState<string>(settings.loginFooterText || '');

  // Atmosphere & Background
  const [loginBackgroundStyle, setLoginBackgroundStyle] = useState<
    'luxury-dark' | 'royal-indigo' | 'hotel-emerald' | 'minimal-clean' | 'custom-color' | 'custom-gradient' | 'custom-image' | 'custom-video' | 'plum-violet'
  >(settings.loginBackgroundStyle || 'luxury-dark');
  const [loginBgColor, setLoginBgColor] = useState<string>(settings.loginBgColor || '#020617');
  const [loginGradientStart, setLoginGradientStart] = useState<string>(settings.loginGradientStart || '#180F1A');
  const [loginGradientEnd, setLoginGradientEnd] = useState<string>(settings.loginGradientEnd || '#491754');
  const [loginGradientDirection, setLoginGradientDirection] = useState<'to right' | 'to bottom' | 'to bottom right' | 'to top right' | 'radial'>(
    settings.loginGradientDirection || 'to bottom right'
  );
  const [loginHeaderBgColor, setLoginHeaderBgColor] = useState<string>(settings.loginHeaderBgColor || '#020617');
  const [loginBgImageUrl, setLoginBgImageUrl] = useState<string>(
    settings.loginBgImageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80'
  );
  const [loginBgVideoUrl, setLoginBgVideoUrl] = useState<string>(
    settings.loginBgVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-lobby-with-chandelier-42777-large.mp4'
  );
  const [loginVideoBlurEnabled, setLoginVideoBlurEnabled] = useState<boolean>(
    settings.loginVideoBlurEnabled ?? false
  );
  const [loginVideoBlurAmount, setLoginVideoBlurAmount] = useState<number>(
    settings.loginVideoBlurAmount !== undefined ? settings.loginVideoBlurAmount : 40
  );
  const [loginCardBlur, setLoginCardBlur] = useState<boolean>(settings.loginCardBlur !== false);

  // File input refs for image & video upload
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);

  // Security Notice & Announcements
  const [loginBannerNotice, setLoginBannerNotice] = useState<string>(
    settings.loginBannerNotice || ''
  );
  const [loginBannerType, setLoginBannerType] = useState<'none' | 'info' | 'warning' | 'shield'>(
    settings.loginBannerType || 'none'
  );

  // Support & Help Desk
  const [showForgotPasswordHelp, setShowForgotPasswordHelp] = useState<boolean>(settings.showForgotPasswordHelp !== false);
  const [loginSupportPhone, setLoginSupportPhone] = useState<string>(settings.loginSupportPhone || settings.phoneNumber || '017 512 2070');
  const [loginSupportEmail, setLoginSupportEmail] = useState<string>(settings.loginSupportEmail || settings.emailAddress || 'warwickhotelbaha@gmail.com');

  // Quick Staff Demo Assistant
  const [showQuickLoginHelper, setShowQuickLoginHelper] = useState<boolean>(settings.showQuickLoginHelper || false);

  // Toast customization for login
  const [loginSuccessToast, setLoginSuccessToast] = useState<string>(
    settings.toastConfig?.loginSuccess || '🔐 Authentication validated. Welcome {name} to {hotel}!'
  );
  const [loginErrorToast, setLoginErrorToast] = useState<string>(
    settings.toastConfig?.loginError || '⚠️ Access Denied: Invalid credentials. Verification failed.'
  );
  const [loginSuccessConfetti, setLoginSuccessConfetti] = useState<boolean>(
    settings.toastConfig?.loginSuccessConfetti !== false
  );
  const [loginSuccessAutoClose, setLoginSuccessAutoClose] = useState<number>(
    settings.toastConfig?.loginSuccessAutoClose || 3500
  );
  const [loginSuccessPosition, setLoginSuccessPosition] = useState<
    'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  >(settings.toastConfig?.loginSuccessPosition || 'top-right');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'theme' | 'security' | 'toast'>('branding');

  // Handle Logo Upload from Local Device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLoginLogoUrl(result);
        toast.success('📷 New Login Logo uploaded! Click "Save Changes" to commit to database.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Background Wallpaper Image Upload from Computer
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLoginBgImageUrl(result);
        setLoginBackgroundStyle('custom-image');
        toast.success('🖼️ Custom wallpaper image uploaded and applied!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Background Video Upload from Computer
  const handleBgVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file (MP4, WebM, Ogg)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Direct video upload is limited to 25MB. For longer videos, paste an MP4 URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLoginBgVideoUrl(result);
        setLoginBackgroundStyle('custom-video');
        toast.success('🎬 Custom background video uploaded and applied!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync with main hotel logo
  const handleSyncMainLogo = () => {
    if (settings.logoUrl) {
      setLoginLogoUrl(settings.logoUrl);
      setLoginLogoWidth(settings.logoWidth || 140);
      setLoginLogoHeight(settings.logoHeight || 48);
      setLoginLogoFit(settings.logoFit || 'contain');
      toast.info('✨ Applied Main Hotel Logo to Login Page!');
    } else {
      toast.warning('No Main Hotel Logo is configured in Hotel Settings.');
    }
  };

  // Test Login Toast & Confetti
  const handleTestLoginToast = () => {
    let formatted = loginSuccessToast
      .replace(/\{name\}/g, user?.name || 'MD ABU SAYEED RIDAY')
      .replace(/\{role\}/g, user?.role || 'Super Admin')
      .replace(/\{hotel\}/g, loginPageTitle || settings.hotelName || 'Warwick Hotels and Resorts');

    toast.success(formatted, {
      position: loginSuccessPosition,
      autoClose: loginSuccessAutoClose,
      theme: settings.toastConfig?.theme || 'colored'
    });

    if (loginSuccessConfetti) {
      triggerConfetti();
    }
  };

  // Reset to default Warwick styling
  const handleResetDefaults = () => {
    if (window.confirm('Reset all Login Page branding and styling to default Warwick Hotel settings?')) {
      setLoginLogoUrl(settings.logoUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80');
      setLoginLogoWidth(140);
      setLoginLogoHeight(48);
      setLoginLogoFit('contain');
      setShowLoginCrownBadge(true);
      setLoginPageTitle('');
      setLoginPageSubtitle('');
      setLoginPageTagline('');
      setLoginFooterText('');
      setLoginBackgroundStyle('plum-violet');
      setLoginBgColor('#020617');
      setLoginGradientStart('#180F1A');
      setLoginGradientEnd('#491754');
      setLoginGradientDirection('to bottom right');
      setLoginBgVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-lobby-with-chandelier-42777-large.mp4');
      setLoginVideoBlurEnabled(false);
      setLoginVideoBlurAmount(40);
      setLoginCardBlur(true);
      setLoginBannerNotice('');
      setLoginBannerType('none');
      setShowForgotPasswordHelp(true);
      setShowQuickLoginHelper(false);
      setLoginSuccessToast('🔐 Authentication validated. Welcome {name} to {hotel}!');
      setLoginErrorToast('⚠️ Access Denied: Invalid credentials. Verification failed.');
      setLoginSuccessConfetti(true);
      setLoginSuccessAutoClose(3500);
      setLoginSuccessPosition('top-right');
      toast.info('Reset fields to defaults. Click "Save Login Settings" to persist.');
    }
  };

  // Save all login settings to server database
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedToastConfig: ToastConfig = {
        ...(settings.toastConfig || {}),
        loginSuccess: loginSuccessToast,
        loginError: loginErrorToast,
        loginSuccessConfetti,
        loginSuccessAutoClose,
        loginSuccessPosition
      };

      const updatedSettings: Partial<HotelSettings> = {
        // Logo & Branding
        loginLogoUrl,
        loginLogoWidth,
        loginLogoHeight,
        loginLogoFit,
        showLoginCrownBadge,
        // Titles & Text
        loginPageTitle,
        loginPageSubtitle,
        loginPageTagline,
        loginFooterText,
        // Atmosphere & Background
        loginBackgroundStyle,
        loginBgColor,
        loginGradientStart,
        loginGradientEnd,
        loginGradientDirection,
        loginHeaderBgColor,
        loginBgImageUrl,
        loginBgVideoUrl,
        loginVideoBlurEnabled,
        loginVideoBlurAmount,
        loginCardBlur,
        // Security Notice
        loginBannerNotice,
        loginBannerType,
        // Support Desk
        showForgotPasswordHelp,
        loginSupportPhone,
        loginSupportEmail,
        // Staff Assistant
        showQuickLoginHelper,
        // Toast Config
        toastConfig: updatedToastConfig
      };

      await updateSettings(updatedSettings);
      setSaveMessage('Login page branding and security settings saved to database & synchronized!');
      toast.success('🎉 Login page controls updated successfully in database!');
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      toast.error(`Failed to save login settings: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in" id="login-page-customizer-container">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#180F1A] rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-xs p-6 sm:p-7 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-fuchsia-900/20">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl btn-primary-gradient text-white flex items-center justify-center shadow-xs shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Login Page &amp; Security Portal Customizer
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Database Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Full administrative control over the staff login gateway. Dynamically configure hotel logo, branding typography, luxury themes, security banners, and login success alerts directly from the database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 hover:bg-slate-50 dark:hover:bg-[#251329] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || isSyncing}
              className="px-5 py-2 rounded-xl btn-primary-gradient text-white text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving || isSyncing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Login Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {saveMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{saveMessage}</span>
            </span>
            <button
              type="button"
              onClick={() => setSaveMessage(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('branding')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'branding'
                ? 'bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-900 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-800/60 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#251329]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Logo &amp; Brand Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('theme')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'theme'
                ? 'bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-900 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-800/60 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#251329]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme &amp; Background</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'security'
                ? 'bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-900 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-800/60 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#251329]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Notices &amp; Support</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('toast')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'toast'
                ? 'bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-900 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-800/60 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#251329]'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Login Success Toast &amp; Alerts</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Mini Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* SUB-TAB 1: LOGO & BRAND TEXT */}
          {activeSubTab === 'branding' && (
            <div className="space-y-6 animate-fade-in">
              {/* Dynamic Database Logo Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>Dynamic Hotel Brand Logo (Database Driven)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The logo shown on the login screen is loaded directly from the database and updates in real-time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncMainLogo}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Use Main Hotel Logo</span>
                  </button>
                </div>

                {/* Current Dynamic Logo Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950 text-white border border-slate-800">
                  <div className="w-48 h-24 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 relative overflow-hidden shrink-0">
                    {loginLogoUrl ? (
                      <img
                        src={loginLogoUrl}
                        alt="Login Logo Preview"
                        className="max-h-16 max-w-full"
                        style={{ objectFit: loginLogoFit }}
                        onError={(e) => {
                          e.currentTarget.src = '/icon.svg';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon className="w-6 h-6 text-indigo-400 mb-1" />
                        <span className="text-[10px] font-bold">Portal Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-left flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">Active Database Logo</span>
                      <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                        {loginLogoUrl.startsWith('data:') ? 'Custom Uploaded' : 'Cloud Stored URL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rendered on login screen with dimensions: {loginLogoWidth}px × {loginLogoHeight}px ({loginLogoFit}).
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {loginLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setLoginLogoUrl('')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Clear to Monogram
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Logo URL Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Logo Image URL (Direct Database Link)
                  </label>
                  <input
                    type="url"
                    value={loginLogoUrl}
                    onChange={(e) => setLoginLogoUrl(e.target.value)}
                    placeholder="https://... or data:image/..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    You can paste any web image URL or upload an image above.
                  </p>
                </div>

                {/* Dynamic Login Header Section Color Customizer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Login Card Header Background Color</span>
                        <span className="text-[11px] text-slate-500">Dynamically customize the top banner background color of the login portal card</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: loginHeaderBgColor }}
                      />
                      <input
                        type="color"
                        value={loginHeaderBgColor}
                        onChange={(e) => setLoginHeaderBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                        title="Pick custom header color"
                      />
                    </div>
                  </div>

                  {/* Header Color Quick Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 block">Quick Color Presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {HEADER_BG_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setLoginHeaderBgColor(preset.color)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                            (loginHeaderBgColor || '').toLowerCase() === (preset.color || '').toLowerCase()
                              ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-500/20 text-slate-900 font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">Hex Code:</span>
                    <input
                      type="text"
                      value={loginHeaderBgColor}
                      onChange={(e) => setLoginHeaderBgColor(e.target.value)}
                      placeholder="#020617"
                      className="w-28 text-xs font-mono px-2 py-1 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Dimension & Fit Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">Max Width</span>
                      <span className="text-xs font-mono text-indigo-600 font-bold">{loginLogoWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={320}
                      step={4}
                      value={loginLogoWidth}
                      onChange={(e) => setLoginLogoWidth(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">Max Height</span>
                      <span className="text-xs font-mono text-indigo-600 font-bold">{loginLogoHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={120}
                      step={2}
                      value={loginLogoHeight}
                      onChange={(e) => setLoginLogoHeight(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1">Object Fit</span>
                    <select
                      value={loginLogoFit}
                      onChange={(e) => setLoginLogoFit(e.target.value as any)}
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="contain">Contain (Preserve Aspect Ratio)</option>
                      <option value="cover">Cover (Fill Frame)</option>
                      <option value="fill">Fill (Stretch)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Typography & Titles Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>Login Screen Headings &amp; Typography</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brand Name / Main Heading
                    </label>
                    <input
                      type="text"
                      value={loginPageTitle}
                      onChange={(e) => setLoginPageTitle(e.target.value)}
                      placeholder="e.g. WARWICK"
                      className="w-full text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brand Subtitle
                    </label>
                    <input
                      type="text"
                      value={loginPageSubtitle}
                      onChange={(e) => setLoginPageSubtitle(e.target.value)}
                      placeholder="e.g. Hotels and Resorts"
                      className="w-full text-xs font-semibold tracking-wide bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Portal Tagline (Arabic / Location)
                    </label>
                    <input
                      type="text"
                      value={loginPageTagline}
                      onChange={(e) => setLoginPageTagline(e.target.value)}
                      placeholder="e.g. AL BAHA • HOTEL MANAGEMENT PORTAL"
                      className="w-full text-xs font-medium uppercase tracking-wider bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bottom Security Gateway Footer
                    </label>
                    <input
                      type="text"
                      value={loginFooterText}
                      onChange={(e) => setLoginFooterText(e.target.value)}
                      placeholder="e.g. Warwick Hotels and Resorts Security Gateway"
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: THEME & BACKGROUND */}
          {activeSubTab === 'theme' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Login Gateway Atmosphere &amp; Atmosphere Presets</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a luxury backdrop ambiance or configure custom brand colors.
                  </p>
                </div>

                {/* Preset Themes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BG_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLoginBackgroundStyle(t.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        loginBackgroundStyle === t.id
                          ? 'border-fuchsia-500 bg-fuchsia-950/40 dark:bg-fuchsia-950/60 ring-2 ring-fuchsia-500/30'
                          : 'border-slate-200 dark:border-fuchsia-900/30 hover:border-slate-300 dark:hover:border-fuchsia-700/50 hover:bg-slate-50 dark:hover:bg-[#200f24]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</span>
                        {loginBackgroundStyle === t.id && (
                          <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Solid Color Picker & Presets */}
                {loginBackgroundStyle === 'custom-color' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 bg-slate-50/70 dark:bg-[#1f0e24] space-y-3 animate-fade-in transition-colors">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Custom Background Solid Color</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        value={loginBgColor}
                        onChange={(e) => setLoginBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs bg-transparent"
                      />
                      <input
                        type="text"
                        value={loginBgColor}
                        onChange={(e) => setLoginBgColor(e.target.value)}
                        className="w-36 text-xs font-mono font-bold bg-white dark:bg-[#140817] border border-slate-300 dark:border-fuchsia-900/40 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100"
                        placeholder="#020617"
                      />
                      <div
                        className="w-20 h-9 rounded-lg border border-slate-300 dark:border-fuchsia-900/40 shadow-2xs"
                        style={{ backgroundColor: loginBgColor }}
                      />
                    </div>
                    {/* Quick Color Swatches */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-fuchsia-900/30">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Brand &amp; Luxury Color Swatches:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Plum Royale', hex: '#491754' },
                          { name: 'Deep Violet', hex: '#2E1065' },
                          { name: 'Electric Fuchsia', hex: '#A32EB8' },
                          { name: 'Obsidian Black', hex: '#020617' },
                          { name: 'Slate Midnight', hex: '#0F172A' },
                          { name: 'Imperial Emerald', hex: '#064E3B' },
                          { name: 'Velvet Wine', hex: '#4C0519' },
                          { name: 'Pure Charcoal', hex: '#18181B' }
                        ].map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setLoginBgColor(c.hex)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-slate-400 flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Multi-Color Gradient Background Controls */}
                {loginBackgroundStyle === 'custom-gradient' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 bg-slate-50/70 dark:bg-[#1f0e24] space-y-3.5 animate-fade-in transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                        <span>Custom Dual-Tone Gradient Background</span>
                      </span>
                      <span className="text-[10px] bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-800 dark:text-fuchsia-300 font-bold px-2 py-0.5 rounded-full border border-fuchsia-200/50 dark:border-fuchsia-800/40">
                        Linear & Radial Flow
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Gradient Start Color */}
                      <div className="p-3 bg-white dark:bg-[#140817] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          Start Color (From)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={loginGradientStart}
                            onChange={(e) => setLoginGradientStart(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                          />
                          <input
                            type="text"
                            value={loginGradientStart}
                            onChange={(e) => setLoginGradientStart(e.target.value)}
                            className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-[#180F1A] border border-slate-300 dark:border-fuchsia-900/40 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100"
                            placeholder="#180F1A"
                          />
                        </div>
                      </div>

                      {/* Gradient End Color */}
                      <div className="p-3 bg-white dark:bg-[#140817] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          End Color (To)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={loginGradientEnd}
                            onChange={(e) => setLoginGradientEnd(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                          />
                          <input
                            type="text"
                            value={loginGradientEnd}
                            onChange={(e) => setLoginGradientEnd(e.target.value)}
                            className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-[#180F1A] border border-slate-300 dark:border-fuchsia-900/40 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100"
                            placeholder="#491754"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gradient Direction */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Gradient Direction:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: '↘ Diagonal', value: 'to bottom right' as const },
                          { label: '→ Right', value: 'to right' as const },
                          { label: '↓ Down', value: 'to bottom' as const },
                          { label: '↗ Top Right', value: 'to top right' as const },
                          { label: '◎ Radial', value: 'radial' as const }
                        ].map((dir) => (
                          <button
                            key={dir.value}
                            type="button"
                            onClick={() => setLoginGradientDirection(dir.value)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              loginGradientDirection === dir.value
                                ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-2xs font-bold'
                                : 'bg-white dark:bg-[#140817] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-fuchsia-900/40 hover:bg-slate-100 dark:hover:bg-[#251329]'
                            }`}
                          >
                            {dir.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Gradient Preview Swatch */}
                    <div
                      className="h-14 w-full rounded-xl border border-slate-300 dark:border-fuchsia-900/40 shadow-inner flex items-center justify-center text-white text-xs font-bold transition-all"
                      style={{
                        background:
                          loginGradientDirection === 'radial'
                            ? `radial-gradient(circle, ${loginGradientStart}, ${loginGradientEnd})`
                            : `linear-gradient(${loginGradientDirection}, ${loginGradientStart}, ${loginGradientEnd})`
                      }}
                    >
                      <span className="bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full text-[11px]">
                        Live Gradient Blend
                      </span>
                    </div>

                    {/* Quick Gradient Presets */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-fuchsia-900/30">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Curated Gradient Presets:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Plum & Violet', start: '#180F1A', end: '#491754', dir: 'to bottom right' as const },
                          { name: 'Neon Fuchsia', start: '#4A044E', end: '#C026D3', dir: 'to right' as const },
                          { name: 'Midnight Indigo', start: '#020617', end: '#1E1B4B', dir: 'to bottom right' as const },
                          { name: 'Royal Sapphire', start: '#0F172A', end: '#1D4ED8', dir: 'to right' as const },
                          { name: 'Emerald Velvet', start: '#022C22', end: '#064E3B', dir: 'to bottom' as const },
                          { name: 'Cyber Magenta', start: '#2E1065', end: '#BE185D', dir: 'to bottom right' as const }
                        ].map((gp) => (
                          <button
                            key={gp.name}
                            type="button"
                            onClick={() => {
                              setLoginGradientStart(gp.start);
                              setLoginGradientEnd(gp.end);
                              setLoginGradientDirection(gp.dir);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#140817] border border-slate-200 dark:border-fuchsia-900/40 rounded-lg hover:border-fuchsia-400 flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ background: `linear-gradient(to right, ${gp.start}, ${gp.end})` }}
                            />
                            <span>{gp.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Wallpaper Image (URL or Direct File Upload) */}
                {loginBackgroundStyle === 'custom-image' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 bg-slate-50/70 dark:bg-[#1f0e24] space-y-3 animate-fade-in transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-fuchsia-400" />
                        <span>Wallpaper Image (URL or Custom Upload)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => bgImageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo from Computer</span>
                      </button>
                      <input
                        type="file"
                        ref={bgImageInputRef}
                        onChange={handleBgImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Image URL:</span>
                      <input
                        type="url"
                        value={loginBgImageUrl}
                        onChange={(e) => setLoginBgImageUrl(e.target.value)}
                        className="w-full text-xs font-mono bg-white dark:bg-[#140817] border border-slate-300 dark:border-fuchsia-900/40 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    {/* Quick Wallpaper Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mr-1">Presets:</span>
                      {[
                        { label: 'Luxury Grand Lobby', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80' },
                        { label: 'Penthouse Suite', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80' },
                        { label: 'Hotel Evening Lights', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80' },
                        { label: 'Minimalist Architecture', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80' }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setLoginBgImageUrl(p.url)}
                          className="px-2 py-1 bg-white dark:bg-[#140817] hover:bg-slate-100 dark:hover:bg-[#251329] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-slate-200 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-300 dark:border-fuchsia-900/40 relative shadow-inner">
                      <img
                        src={loginBgImageUrl}
                        alt="Wallpaper Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                        Preview: Dimmed backdrop with modal overlay
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Cinematic Video Background (URL or Direct File Upload) */}
                {loginBackgroundStyle === 'custom-video' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 bg-slate-50/70 dark:bg-[#1f0e24] space-y-3.5 animate-fade-in transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-fuchsia-400" />
                        <span>Cinematic Video (URL or Custom Upload)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => bgVideoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Video File (MP4/WebM)</span>
                      </button>
                      <input
                        type="file"
                        ref={bgVideoInputRef}
                        onChange={handleBgVideoUpload}
                        accept="video/mp4,video/webm,video/ogg"
                        className="hidden"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Video Stream URL (MP4 / WebM):</span>
                      <input
                        type="url"
                        value={loginBgVideoUrl}
                        onChange={(e) => setLoginBgVideoUrl(e.target.value)}
                        className="w-full text-xs font-mono bg-white dark:bg-[#140817] border border-slate-300 dark:border-fuchsia-900/40 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://assets.mixkit.co/videos/preview/..."
                      />
                    </div>

                    {/* Quick Video Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mr-1">Presets:</span>
                      {[
                        { label: 'Hotel Chandelier Lobby', url: 'https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-lobby-with-chandelier-42777-large.mp4' },
                        { label: 'Evening City Lights', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4' },
                        { label: 'Serene Luxury Resort', url: 'https://assets.mixkit.co/videos/preview/mixkit-curved-swimming-pool-in-a-luxury-hotel-42784-large.mp4' }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setLoginBgVideoUrl(p.url)}
                          className="px-2 py-1 bg-white dark:bg-[#140817] hover:bg-slate-100 dark:hover:bg-[#251329] border border-slate-200 dark:border-fuchsia-900/40 text-slate-700 dark:text-slate-200 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Media Player Background Blur Controls (Toggle + 0-100% Intensity Slider) */}
                    <div className="p-3.5 bg-white dark:bg-[#140817] rounded-xl border border-slate-200 dark:border-fuchsia-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              Enable Video Background Blur
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {loginVideoBlurEnabled
                                ? 'Blur active: Video playback is softened with customizable diffusion'
                                : 'Disabled: Video plays sharp, clear & unaffected without any blur'}
                            </span>
                          </div>
                        </div>

                        {/* Enable Blur Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loginVideoBlurEnabled}
                            onChange={(e) => setLoginVideoBlurEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-600"></div>
                        </label>
                      </div>

                      {/* Intensity Slider - Only Active when Toggle is ON */}
                      <div className={`space-y-1.5 transition-all duration-200 ${loginVideoBlurEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span>Blur Intensity:</span>
                            <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold font-mono">
                              {loginVideoBlurEnabled ? `${loginVideoBlurAmount}%` : '0% (Disabled)'}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {loginVideoBlurEnabled ? `${Math.round((loginVideoBlurAmount * 0.2) * 10) / 10}px filter` : 'Clear Video'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] text-slate-400 font-semibold">0% (Clear)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            disabled={!loginVideoBlurEnabled}
                            value={loginVideoBlurAmount}
                            onChange={(e) => setLoginVideoBlurAmount(Number(e.target.value))}
                            className="w-full accent-fuchsia-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">100% (Dense)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {loginVideoBlurEnabled
                            ? 'Adjust the slider to increase or reduce video playback diffusion in real time.'
                            : 'Switch the toggle above to enable this intensity slider.'}
                        </p>
                      </div>
                    </div>

                    {/* Video Player Preview Window */}
                    <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-300 dark:border-fuchsia-900/40 relative shadow-inner bg-black">
                      {loginBgVideoUrl ? (
                        <video
                          src={loginBgVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover transition-all duration-300"
                          style={{
                            filter: loginVideoBlurEnabled ? `blur(${(loginVideoBlurAmount || 40) * 0.2}px)` : 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                          No video URL provided
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-white text-xs font-semibold">
                        <span>
                          {loginVideoBlurEnabled
                            ? `Video Preview: Filtered with ${loginVideoBlurAmount}% blur`
                            : 'Video Preview: Playing sharp & normal without blur'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Glassmorphism Blur Toggle */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-fuchsia-900/40 bg-slate-50/60 dark:bg-[#1f0e24] flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Glassmorphism Backdrop Blur</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Applies frosted glass diffusion behind the login card</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loginCardBlur}
                      onChange={(e) => setLoginCardBlur(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: NOTICES & SUPPORT */}
          {activeSubTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              {/* Announcements & Security Banner Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Security Announcements &amp; Welcome Notice</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1">Notice Banner Type</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'None (Hidden)' },
                        { id: 'info', label: 'ℹ️ Information' },
                        { id: 'warning', label: '⚠️ Security Alert' },
                        { id: 'shield', label: '🛡️ Audit Shield' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setLoginBannerType(type.id as any)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            loginBannerType === type.id
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loginBannerType !== 'none' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="block text-xs font-bold text-slate-700">
                        Notice Message Text
                      </label>
                      <textarea
                        rows={2}
                        value={loginBannerNotice}
                        onChange={(e) => setLoginBannerNotice(e.target.value)}
                        placeholder="e.g. Authorized Staff Personnel Only. All actions and sessions are logged for audit compliance."
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Support & Forgot Password Admin Desk Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Support Desk &amp; Forgot Password Help</span>
                </h3>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enable "Forgot Password?" Assistance Link</span>
                    <span className="text-[11px] text-slate-500">Allows staff to view administrator contact info to request password resets</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showForgotPasswordHelp}
                      onChange={(e) => setShowForgotPasswordHelp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Support Desk Email</span>
                    </label>
                    <input
                      type="email"
                      value={loginSupportEmail}
                      onChange={(e) => setLoginSupportEmail(e.target.value)}
                      placeholder="admin@warwickhotels.com"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Support Desk Phone</span>
                    </label>
                    <input
                      type="text"
                      value={loginSupportPhone}
                      onChange={(e) => setLoginSupportPhone(e.target.value)}
                      placeholder="017 512 2070"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Staff Demo / Credential Assistant Switch */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Quick Staff Test Assistant (Demo Switcher)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                      When enabled, convenient 1-click test credentials buttons appear below the login form. Disable for production live environments.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQuickLoginHelper}
                      onChange={(e) => setShowQuickLoginHelper(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: LOGIN SUCCESS TOAST & ALERTS */}
          {activeSubTab === 'toast' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <PartyPopper className="w-4 h-4 text-amber-500" />
                      <span>Login Success Toast &amp; Celebration Controls</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customize the exact celebration message, auto-dismiss timing, and confetti effects triggered when staff logs in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestLoginToast}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <PartyPopper className="w-3.5 h-3.5 text-amber-600" />
                    <span>Test Login Toast</span>
                  </button>
                </div>

                {/* Success Message Template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Login Success Message Template
                    </label>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                      <span>Available tokens:</span>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{name}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{role}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{hotel}'}</code>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={loginSuccessToast}
                    onChange={(e) => setLoginSuccessToast(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="🔐 Authentication validated. Welcome {name} to {hotel}!"
                  />
                  <p className="text-[11px] text-slate-500">
                    Live example: "🔐 Authentication validated. Welcome {user?.name || 'MD ABU SAYEED RIDAY'} to {loginPageTitle || 'Warwick Hotels and Resorts'}!"
                  </p>
                </div>

                {/* Login Error Message Template */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block">
                    Access Denied / Invalid Credentials Error Message
                  </label>
                  <input
                    type="text"
                    value={loginErrorToast}
                    onChange={(e) => setLoginErrorToast(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="⚠️ Access Denied: Invalid credentials. Verification failed."
                  />
                </div>

                {/* Toast Behavior: Confetti, Duration, Position */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Celebration Confetti</span>
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loginSuccessConfetti}
                        onChange={(e) => setLoginSuccessConfetti(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {loginSuccessConfetti ? '🎉 Enabled' : '🚫 Disabled'}
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Bursts golden celebratory confetti particles upon success.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Notification Position</span>
                    <select
                      value={loginSuccessPosition}
                      onChange={(e) => setLoginSuccessPosition(e.target.value as any)}
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="top-right">Top Right (Default)</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-center">Bottom Center</option>
                    </select>
                    <p className="text-[10px] text-slate-500">Screen corner for the alert.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Auto Close: {(loginSuccessAutoClose / 1000).toFixed(1)}s
                    </span>
                    <select
                      value={loginSuccessAutoClose}
                      onChange={(e) => setLoginSuccessAutoClose(Number(e.target.value))}
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={2000}>2.0s (Fast)</option>
                      <option value={3000}>3.0s (Normal)</option>
                      <option value={3500}>3.5s (Standard)</option>
                      <option value={5000}>5.0s (Extended)</option>
                    </select>
                    <p className="text-[10px] text-slate-500">Dismissal duration.</p>
                  </div>
                </div>

                {onNavigateToAlerts && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={onNavigateToAlerts}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                    >
                      <span>Open Global Alerts &amp; Validation Controls</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Mini Preview Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Real-Time Login Screen Preview</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Live Dynamic Rendering
              </span>
            </div>

            {/* Scaled Visual Representation of AuthModal */}
            <div
              className={`rounded-2xl p-4 sm:p-5 transition-all shadow-xl relative overflow-hidden border ${
                loginBackgroundStyle === 'plum-violet'
                  ? 'bg-gradient-to-br from-[#180F1A] via-[#491754] to-[#0F0911] border-[#491754]'
                  : loginBackgroundStyle === 'luxury-dark'
                  ? 'bg-slate-950 border-slate-800'
                  : loginBackgroundStyle === 'royal-indigo'
                  ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-indigo-900'
                  : loginBackgroundStyle === 'hotel-emerald'
                  ? 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-emerald-900'
                  : loginBackgroundStyle === 'minimal-clean'
                  ? 'bg-slate-100 border-slate-300'
                  : loginBackgroundStyle === 'custom-gradient'
                  ? 'border-fuchsia-800'
                  : loginBackgroundStyle === 'custom-video'
                  ? 'bg-slate-950 border-slate-800'
                  : loginBackgroundStyle === 'custom-image'
                  ? 'border-slate-800'
                  : 'border-slate-800'
              }`}
              style={{
                backgroundColor: loginBackgroundStyle === 'custom-color' ? loginBgColor : undefined,
                background:
                  loginBackgroundStyle === 'custom-gradient'
                    ? (loginGradientDirection === 'radial'
                        ? `radial-gradient(circle, ${loginGradientStart}, ${loginGradientEnd})`
                        : `linear-gradient(${loginGradientDirection}, ${loginGradientStart}, ${loginGradientEnd})`)
                    : undefined,
                backgroundImage:
                  loginBackgroundStyle === 'custom-image' ? `url("${loginBgImageUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Optional Video Background in Preview */}
              {loginBackgroundStyle === 'custom-video' && loginBgVideoUrl && (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-300"
                  style={{
                    filter: loginVideoBlurEnabled
                      ? `blur(${((loginVideoBlurAmount ?? 40) / 100) * 16}px)`
                      : 'none'
                  }}
                  src={loginBgVideoUrl}
                />
              )}

              {/* Optional Dimming Overlay for custom image or video (No forced blur unless enabled) */}
              {loginBackgroundStyle === 'custom-image' && (
                <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
              )}
              {loginBackgroundStyle === 'custom-video' && (
                <div
                  className="absolute inset-0 bg-slate-950/50 pointer-events-none transition-all duration-300"
                  style={{
                    backdropFilter: loginVideoBlurEnabled
                      ? `blur(${((loginVideoBlurAmount ?? 40) / 100) * 12}px)`
                      : 'none'
                  }}
                />
              )}

              {/* Login Modal Box in Preview */}
              <div className="relative z-10 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-sm mx-auto">
                {/* Header in Preview */}
                <div
                  className="text-white p-4 text-center border-b border-slate-800 transition-colors"
                  style={{ backgroundColor: loginHeaderBgColor || '#020617' }}
                >
                  {/* Dynamic Logo from DB */}
                  {loginLogoUrl ? (
                    <div className="flex justify-center mb-1.5">
                      <div
                        className="flex items-center justify-center overflow-hidden rounded-lg"
                        style={{
                          width: `${Math.min(loginLogoWidth, 180)}px`,
                          height: `${Math.min(loginLogoHeight, 52)}px`
                        }}
                      >
                        <img
                          src={loginLogoUrl}
                          alt="Brand Logo"
                          className="w-full h-full"
                          style={{ objectFit: loginLogoFit }}
                          onError={(e) => {
                            e.currentTarget.src = '/icon.svg';
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="font-serif tracking-widest text-sm font-bold uppercase mt-1">
                    {loginPageTitle || 'WARWICK'}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-indigo-400 uppercase font-semibold">
                    {loginPageSubtitle || 'Hotels and Resorts'}
                  </div>
                  <div className="text-[8px] tracking-wider text-slate-400 mt-0.5 uppercase">
                    {loginPageTagline || 'AL BAHA • HOTEL MANAGEMENT PORTAL'}
                  </div>
                </div>

                {/* Form Body in Preview */}
                <div className="p-4 space-y-3">
                  {/* Security Notice Banner if enabled */}
                  {loginBannerType !== 'none' && loginBannerNotice && (
                    <div
                      className={`p-2 rounded-lg text-[10px] flex items-start space-x-1.5 ${
                        loginBannerType === 'warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : loginBannerType === 'shield'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="leading-tight">{loginBannerNotice}</span>
                    </div>
                  )}

                  {/* Dummy Inputs */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Staff ID or Email Address
                      </div>
                      <div className="h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center px-2 text-[10px] text-slate-400">
                        <Mail className="w-3 h-3 mr-1.5" />
                        <span>abusayeedriday@gmail.com</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        <span>Password</span>
                        {showForgotPasswordHelp && (
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400">
                            Forgot Password?
                          </span>
                        )}
                      </div>
                      <div className="h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center px-2 text-[10px] text-slate-400">
                        <Lock className="w-3 h-3 mr-1.5" />
                        <span>••••••••</span>
                      </div>
                    </div>
                  </div>

                  {/* Dummy Button */}
                  <div className="h-8 rounded-lg btn-primary-gradient text-white flex items-center justify-center space-x-1 text-[11px] font-bold shadow-xs">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Validate &amp; Enter Dashboard</span>
                  </div>

                  {/* Quick Helper preview if enabled */}
                  {showQuickLoginHelper && (
                    <div className="pt-2 border-t border-slate-100 text-center space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">
                        Quick Staff Demo Pass
                      </span>
                      <div className="flex justify-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-medium">
                          Super Admin
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-medium">
                          Housekeeping
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer in Preview - only if configured */}
                  {loginFooterText && (
                    <div className="pt-1 text-center text-[9px] text-slate-400 dark:text-slate-500">
                      {loginFooterText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Changes reflect immediately on the login modal after saving to database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
