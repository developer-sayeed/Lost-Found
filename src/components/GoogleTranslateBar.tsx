import React, { useEffect, useState, useRef } from 'react';
import { Globe, ChevronDown, Check, Sparkles, X } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit?: () => void;
  }
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  googleCode?: string;
  badge?: string;
}

export const POPULAR_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English (UK / US)', nativeName: 'English', flag: '🇬🇧', googleCode: 'en' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', flag: '🇸🇦', googleCode: 'ar', badge: 'Saudi' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', flag: '🇪🇬', googleCode: 'ar', badge: 'Egypt' },
  { code: 'ar-AE', name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)', flag: '🇦🇪', googleCode: 'ar', badge: 'UAE' },
  { code: 'ar', name: 'Arabic (Standard)', nativeName: 'العربية (الفصحى)', flag: '🌐', googleCode: 'ar', badge: 'Standard' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', googleCode: 'bn' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', googleCode: 'hi' },
  { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Filipino', flag: '🇵🇭', googleCode: 'tl' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', googleCode: 'fr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', googleCode: 'es' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', googleCode: 'de' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', googleCode: 'it' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', googleCode: 'tr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', googleCode: 'id' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', googleCode: 'ms' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', googleCode: 'zh-CN' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', googleCode: 'ru' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', googleCode: 'ja' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', googleCode: 'ko' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', googleCode: 'sw' }
];

interface GoogleTranslateBarProps {
  className?: string;
  variant?: 'header' | 'compact' | 'full';
}

export const GoogleTranslateBar: React.FC<GoogleTranslateBarProps> = ({
  className = '',
  variant = 'header'
}) => {
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Google Translate Script
  useEffect(() => {
    // Check saved language from cookie or localStorage
    const cookieMatch = document.cookie.match(/googtrans=\/en\/([a-zA-Z_-]+)/);
    const cookieLang = cookieMatch ? cookieMatch[1] : null;
    const savedLang = localStorage.getItem('warwick_preferred_language') || cookieLang || 'en';
    setCurrentLang(savedLang);

    // Setup global callback for Google Translate Element Init
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          if (window.google?.translate?.TranslateElement) {
            const uniqueIncluded = Array.from(
              new Set(POPULAR_LANGUAGES.map(l => l.googleCode || l.code))
            ).join(',');

            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: uniqueIncluded,
                autoDisplay: false,
                multilanguagePage: true
              },
              'google_translate_element'
            );
          }
        } catch (e) {
          console.warn('[Google Translate] Init error:', e);
        }
      };
    }

    // Load Google Translate script dynamically if not present
    const SCRIPT_ID = 'google-translate-script';
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    // Continuously suppress any Google banner frames or balloon popups injected by Google Translate
    const suppressGoogleBanner = () => {
      document.body.style.top = '0px';
      document.body.style.position = 'static';
      const iframes = document.querySelectorAll('iframe.goog-te-banner-frame, .goog-te-banner-frame, #goog-gt-tt');
      iframes.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.visibility = 'hidden';
      });
    };

    const observer = new MutationObserver(() => {
      suppressGoogleBanner();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      observer.disconnect();
    };
  }, []);

  // Change language via Google Website Translator engine
  const handleSelectLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('warwick_preferred_language', langCode);
    setIsOpen(false);
    setIsTranslating(true);

    const targetObj = POPULAR_LANGUAGES.find(l => l.code === langCode);
    const targetGoogleCode = targetObj?.googleCode || (langCode.startsWith('ar') ? 'ar' : langCode);

    // 1. Direct googtrans cookie manipulation (Standard Google Translate Client Engine Protocol)
    const hostname = window.location.hostname;

    if (targetGoogleCode === 'en') {
      // Clear cookie to restore English original
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      if (hostname !== 'localhost') {
        document.cookie = `googtrans=; path=/; domain=.${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        document.cookie = `googtrans=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      }
    } else {
      const cookieVal = `/en/${targetGoogleCode}`;
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      if (hostname !== 'localhost') {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
        document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
      }
    }

    // 2. Trigger Google Translate dropdown element if rendered in DOM
    try {
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = targetGoogleCode;
        selectEl.dispatchEvent(new Event('change'));
      }
    } catch {}

    // 3. Fallback reload if needed to force immediate full-page translation
    setTimeout(() => {
      setIsTranslating(false);
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (!selectEl && targetGoogleCode !== 'en') {
        window.location.reload();
      }
    }, 600);
  };

  const currentObj =
    POPULAR_LANGUAGES.find(l => l.code === currentLang) ||
    (currentLang.startsWith('ar') ? POPULAR_LANGUAGES.find(l => l.code === 'ar-SA' || l.code === 'ar') : null) ||
    POPULAR_LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Hidden target container where Google Translate Widget mounts */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      {/* Modern Custom UI Button */}
      <button
        type="button"
        id="btn-google-translate"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-fuchsia-950/60 bg-white dark:bg-[#180F1A] hover:bg-slate-50 dark:hover:bg-[#241328] active:bg-slate-100 dark:active:bg-[#2c1731] text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500 transition-all cursor-pointer group"
        title="Translate Website (Google Translate Engine)"
        aria-expanded={isOpen}
      >
        <span className="text-sm select-none" role="img" aria-label="flag">
          {currentObj.flag}
        </span>
        <span className="flex items-center space-x-1">
          <Globe className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline font-bold text-slate-800 dark:text-slate-100">
            {currentObj.nativeName}
          </span>
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        {isTranslating && (
          <span className="w-2 h-2 rounded-full bg-fuchsia-600 animate-ping" />
        )}
      </button>

      {/* Language Selection Modal / Dropdown - Fully Responsive on Mobile, Tablet & Desktop */}
      {isOpen && (
        <>
          {/* Backdrop on mobile and small tablet */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-[60] md:hidden animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed md:absolute inset-x-3 bottom-3 top-auto md:top-full md:bottom-auto md:inset-x-auto md:right-0 md:mt-2 w-auto md:w-80 max-h-[82vh] md:max-h-[30rem] bg-white dark:bg-[#180F1A] rounded-2xl shadow-2xl md:shadow-xl border border-slate-200/90 dark:border-fuchsia-950/60 z-[70] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 md:zoom-in-95 duration-200"
          >
            {/* Header: Styled with Primary Brand Color / Gradient */}
            <div
              className="px-4 py-3.5 flex items-center justify-between shrink-0 relative overflow-hidden border-b border-white/15"
              style={{ background: 'var(--gradient-primary-cta, linear-gradient(135deg, #4A1755 0%, #A21CAF 55%, #C026D3 100%))' }}
            >
              {/* Subtle top shimmer bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/30 via-white/80 to-white/30 opacity-70" />

              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-xs shrink-0 border border-white/25">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-2xs">
                    Language Switcher
                  </p>
                  <p className="text-[10px] text-fuchsia-100/90 font-medium">
                    Google Translate Client Engine
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="hidden xs:inline-flex items-center px-2 py-0.5 bg-white/20 backdrop-blur-xs text-white rounded-full text-[10px] font-bold border border-white/25 shadow-2xs">
                  Free
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Languages List (No search input to prevent unwanted click/focus/virtual keyboard) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 overscroll-contain">
              {POPULAR_LANGUAGES.map(lang => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-fuchsia-50/90 dark:bg-fuchsia-950/50 text-fuchsia-950 dark:text-fuchsia-200 font-bold border-fuchsia-300/80 dark:border-fuchsia-800/60 shadow-2xs'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#251429] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl select-none leading-none drop-shadow-2xs">{lang.flag}</span>
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight">
                            {lang.nativeName}
                          </span>
                          {lang.badge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/40">
                              {lang.badge}
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {lang.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* Footer Restore Original Button */}
            {currentLang !== 'en' && (
              <div className="p-2.5 bg-slate-50 dark:bg-[#140b17] border-t border-slate-200/70 dark:border-fuchsia-950/50 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className="w-full py-2 px-3 bg-white dark:bg-[#221226] hover:bg-slate-100 dark:hover:bg-[#2c1731] border border-slate-200 dark:border-fuchsia-900/40 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  Reset to Original (English)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
