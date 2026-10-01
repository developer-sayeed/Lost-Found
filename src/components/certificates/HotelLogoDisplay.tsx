import React from 'react';
import { HotelLogoPreset } from '../../types';
import { WarwickEmblem } from './WarwickEmblem';
import { useApp } from '../../context/AppContext';
import { RichTextRenderer } from './RichTextRenderer';

interface HotelLogoDisplayProps {
  hotelName?: string;
  hotelSubtitle?: string;
  hotelLogoUrl?: string;
  hotelLogoPreset?: HotelLogoPreset;
  hotelLogoSize?: number;
  showHotelLogo?: boolean;
  showHotelBranding?: boolean;
  showFiveStars?: boolean;
  accentColor?: string;
  primaryColor?: string;
  textColor?: string;
  className?: string;
  layout?: 'stacked' | 'horizontal';
  hotelNameFontSize?: number;
  hotelNameIsBold?: boolean;
  hotelNameIsItalic?: boolean;
}

export const HotelLogoDisplay: React.FC<HotelLogoDisplayProps> = ({
  hotelName,
  hotelSubtitle,
  hotelLogoUrl,
  hotelLogoPreset = 'warwick_crest',
  hotelLogoSize = 52,
  showHotelLogo = true,
  showHotelBranding = true,
  showFiveStars = true,
  accentColor = '#c59b27',
  textColor = '#0f172a',
  className = '',
  layout = 'stacked',
  hotelNameFontSize,
  hotelNameIsBold,
  hotelNameIsItalic
}) => {
  let appSettings: any = null;
  try {
    const appContext = useApp();
    appSettings = appContext?.settings;
  } catch {
    // Graceful fallback if rendered outside AppContext provider (e.g. headless canvas clone)
  }

  // If both logo and branding are hidden, do not render anything
  if (!showHotelLogo && !showHotelBranding) {
    return null;
  }

  // Resolve dynamic branding values with priority: Prop -> Settings -> Default
  const resolvedHotelName =
    hotelName && hotelName.trim()
      ? hotelName
      : appSettings?.certificateHotelName || appSettings?.hotelName || 'WARWICK';

  const resolvedHotelSubtitle =
    hotelSubtitle && hotelSubtitle.trim()
      ? hotelSubtitle
      : appSettings?.certificateHotelSubtitle ||
        appSettings?.hotelSubTitle ||
        'HOTEL AL BAHA • HOTELS & RESORTS';

  const resolvedLogoUrl =
    (hotelLogoUrl && hotelLogoUrl.trim())
      ? hotelLogoUrl
      : (appSettings?.certificateLogoUrl || appSettings?.logoUrl || '');

  const sizePx = Math.max(20, Math.min(hotelLogoSize, 160));

  // Render the selected vector emblem or uploaded image
  const renderLogoGraphic = () => {
    if (!showHotelLogo) return null;

    // 1. User uploaded custom logo image (from cert prop or dynamic system settings)
    if (resolvedLogoUrl && resolvedLogoUrl.trim()) {
      return (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: `${sizePx}px`, minHeight: `${sizePx}px`, maxHeight: `${sizePx}px` }}
        >
          <img
            src={resolvedLogoUrl}
            alt={resolvedHotelName || 'Hotel Logo'}
            style={{
              height: `${sizePx}px`,
              maxHeight: `${sizePx}px`,
              width: 'auto',
              maxWidth: `${sizePx * 3.5}px`,
              objectFit: 'contain'
            }}
            className="filter drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    // 2. Preset: Warwick Crown Monogram
    if (hotelLogoPreset === 'warwick_crest') {
      return (
        <div style={{ width: `${sizePx * 1.3}px`, height: `${sizePx}px` }}>
          <WarwickEmblem
            className="w-full h-full"
            color={accentColor}
            strokeWidth={3.8}
          />
        </div>
      );
    }

    // 3. Preset: Grand 5-Star Hotel Shield Crest
    if (hotelLogoPreset === 'grand_star') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
          className="drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="grandShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff2be" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#8d610c" />
            </linearGradient>
          </defs>
          {/* Shield Outer Outline */}
          <path
            d="M 50 10 L 82 22 C 82 58, 50 88, 50 88 C 50 88, 18 58, 18 22 Z"
            fill="none"
            stroke="url(#grandShieldGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Inset Shield */}
          <path
            d="M 50 18 L 76 28 C 76 54, 50 78, 50 78 C 50 78, 24 54, 24 28 Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.5"
            opacity="0.75"
          />
          {/* Center 5-pointed star */}
          <path
            d="M 50 34 L 54 44 L 64 45 L 56 52 L 59 62 L 50 56 L 41 62 L 44 52 L 36 45 L 46 44 Z"
            fill="url(#grandShieldGrad)"
            stroke={accentColor}
            strokeWidth="1"
          />
          {/* Crown Top Accent */}
          <path
            d="M 38 12 L 44 5 L 50 9 L 56 5 L 62 12"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // 4. Preset: Royal Crown with Laurel Wreath
    if (hotelLogoPreset === 'royal_crown') {
      return (
        <svg
          viewBox="0 0 110 80"
          style={{ width: `${sizePx * 1.3}px`, height: `${sizePx}px` }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Royal Crown */}
          <path
            d="M 30 52 L 24 28 L 40 40 L 55 18 L 70 40 L 86 28 L 80 52 Z"
            fill={accentColor}
            opacity="0.18"
          />
          <path
            d="M 30 52 L 24 28 L 40 40 L 55 18 L 70 40 L 86 28 L 80 52 Z"
            stroke={accentColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Crown Jewels on tips */}
          <circle cx="24" cy="26" r="3" fill={accentColor} />
          <circle cx="55" cy="16" r="3.5" fill={accentColor} />
          <circle cx="86" cy="26" r="3" fill={accentColor} />
          {/* Crown Base */}
          <rect x="28" y="52" width="54" height="6" rx="2" fill={accentColor} />
          {/* Laurel arcs beneath */}
          <path
            d="M 16 48 C 16 66, 36 74, 55 74 C 74 74, 94 66, 94 48"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    // 5. Preset: Luxury Intertwined Monogram
    if (hotelLogoPreset === 'luxury_monogram') {
      return (
        <div
          style={{ width: `${sizePx}px`, height: `${sizePx}px`, borderColor: accentColor }}
          className="rounded-full border-2 border-double flex items-center justify-center p-1 relative shadow-2xs"
        >
          <span
            className="font-serif font-black tracking-tighter"
            style={{
              color: accentColor,
              fontSize: `${Math.round(sizePx * 0.42)}px`,
              lineHeight: 1
            }}
          >
            WH
          </span>
          {/* Diamond accents top and bottom */}
          <div
            className="absolute -top-1 w-1.5 h-1.5 rotate-45"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute -bottom-1 w-1.5 h-1.5 rotate-45"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex select-none ${
        layout === 'horizontal'
          ? 'flex-row items-center gap-3.5'
          : 'flex-col items-center justify-center'
      } ${className}`}
    >
      {/* Emblem Graphic */}
      {renderLogoGraphic()}

      {/* Hotel Typography */}
      {showHotelBranding && (
        <div
          className={`flex flex-col ${
            layout === 'horizontal' ? 'items-start text-left' : 'items-center text-center'
          } ${showHotelLogo && layout !== 'horizontal' ? 'mt-1.5' : ''}`}
        >
          {/* Hotel Name */}
          {hotelName && hotelName.trim() && (
            <h2
              className={`font-serif tracking-[0.28em] uppercase leading-none transition-colors ${
                hotelNameIsBold !== false ? 'font-black' : 'font-normal'
              } ${hotelNameIsItalic ? 'italic' : 'not-italic'}`}
              style={{
                color: textColor,
                fontSize: hotelNameFontSize ? `${hotelNameFontSize}px` : '18px',
                textShadow: '0 0.5px 1px rgba(0,0,0,0.05)'
              }}
            >
              <RichTextRenderer
                text={hotelName}
                isBold={hotelNameIsBold}
                isItalic={hotelNameIsItalic}
                fontSize={hotelNameFontSize}
              />
            </h2>
          )}

          {/* 5 Stars Rating Display */}
          {showFiveStars && (
            <div className="flex items-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className="w-2.5 h-2.5 fill-current"
                  style={{ color: accentColor }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}

          {/* Subtitle / Tagline */}
          {hotelSubtitle && hotelSubtitle.trim() && (
            <p
              className="font-serif text-[8.5px] tracking-[0.24em] uppercase font-semibold transition-colors mt-0.5"
              style={{ color: accentColor }}
            >
              {hotelSubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
