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
}

export const POPULAR_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' }
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Google Translate Script
  useEffect(() => {
    // Check saved language cookie/localStorage
    const savedLang = localStorage.getItem('warwick_preferred_language') || 'en';
    setCurrentLang(savedLang);

    // Setup global callback for Google Translate Element Init
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          if (window.google?.translate?.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: POPULAR_LANGUAGES.map(l => l.code).join(','),
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
    setSearchQuery('');
    setIsTranslating(true);

    // 1. Direct googtrans cookie manipulation (Standard Google Translate Client Engine Protocol)
    const hostname = window.location.hostname;
    const cookieVal = `/en/${langCode}`;
    
    // Set for current domain and root path
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
    }

    // 2. Trigger Google Translate dropdown element if rendered in DOM
    try {
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event('change'));
      }
    } catch {}

    // 3. Fallback reload if needed to force immediate full-page translation
    setTimeout(() => {
      setIsTranslating(false);
      // If combo wasn't ready yet or page wasn't translated, reload with googtrans cookie active
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (!selectEl && langCode !== 'en') {
        window.location.reload();
      }
    }, 600);
  };

  const currentObj = POPULAR_LANGUAGES.find(l => l.code === currentLang) || POPULAR_LANGUAGES[0];

  const filteredLanguages = POPULAR_LANGUAGES.filter(
    l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
        title="Translate Website (Google Translate Engine)"
        aria-expanded={isOpen}
      >
        <span className="text-sm select-none" role="img" aria-label="flag">
          {currentObj.flag}
        </span>
        <span className="flex items-center space-x-1">
          <Globe className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline font-bold text-slate-800">
            {currentObj.nativeName}
          </span>
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        {isTranslating && (
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
        )}
      </button>

      {/* Language Selection Modal / Dropdown - Fully Responsive on Mobile, Tablet & Desktop */}
      {isOpen && (
        <>
          {/* Backdrop on mobile and small tablet */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-[60] md:hidden animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed md:absolute inset-x-3 bottom-3 top-auto md:top-full md:bottom-auto md:inset-x-auto md:right-0 md:mt-2 w-auto md:w-80 max-h-[80vh] md:max-h-[30rem] bg-white rounded-2xl shadow-2xl md:shadow-xl border border-slate-200 z-[70] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 md:zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Website Translation</p>
                  <p className="text-[10px] text-slate-500">Google Translate Client Engine</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="hidden xs:inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  Free
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search language (e.g. বাংলা, Arabic)..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                autoFocus
              />
            </div>

            {/* Languages List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 overscroll-contain">
              {filteredLanguages.map(lang => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'hover:bg-slate-100 text-slate-700 active:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg select-none">{lang.flag}</span>
                      <div className="text-left">
                        <span className="block font-semibold text-slate-900 text-xs sm:text-sm leading-tight">
                          {lang.nativeName}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-normal">
                          {lang.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching language found.
                </div>
              )}
            </div>

            {/* Footer Restore Original Button */}
            {currentLang !== 'en' && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors shadow-2xs"
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
