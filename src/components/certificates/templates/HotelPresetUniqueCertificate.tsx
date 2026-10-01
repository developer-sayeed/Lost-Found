import React, { forwardRef } from 'react';
import { Certificate } from '../../../types';
import { HotelLogoDisplay } from '../HotelLogoDisplay';
import { CertificateSealMedal } from '../CertificateSealMedal';
import { RichTextRenderer } from '../RichTextRenderer';
import { SignatoryBox } from '../SignatoryBox';
import { HOTEL_STAFF_CERTIFICATE_PRESETS } from '../certificatePresets';

export interface CertificateTemplateProps {
  cert: Partial<Certificate>;
  idPrefix?: string;
  className?: string;
}

/**
 * Unique 5-Star Hotel Staff Certificate Renderer
 * Renders distinct luxury visual aesthetics for all 25 hotel staff presets
 * Supports custom drag-and-drop coordinates (layoutCoordinates).
 */
export const HotelPresetUniqueCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'unique-cert', className = '' }, ref) => {
    // Check if matching preset exists
    const certTitleLower = (cert.title || '').toLowerCase().trim();
    const matchingPreset = HOTEL_STAFF_CERTIFICATE_PRESETS.find(
      (p) =>
        p.id === cert.template ||
        Boolean(certTitleLower && p.name && p.name.toLowerCase().trim() === certTitleLower) ||
        Boolean(certTitleLower && p.defaultTitle && p.defaultTitle.toLowerCase().trim() === certTitleLower) ||
        (cert.template && cert.template.startsWith('hotel-staff-') && p.id === cert.template)
    );

    // Resolve Colors
    const primaryColor =
      cert.customColors?.primaryColor ||
      cert.customColors?.primary ||
      matchingPreset?.colors.primary ||
      '#0f2338';

    const accentColor =
      cert.customColors?.accentColor ||
      cert.customColors?.accent ||
      matchingPreset?.colors.accent ||
      '#c4972a';

    const borderColor =
      cert.frameColor ||
      cert.customColors?.borderColor ||
      cert.customColors?.border ||
      matchingPreset?.colors.border ||
      accentColor;

    const backgroundColor =
      cert.backgroundColor ||
      cert.customColors?.backgroundColor ||
      cert.customColors?.background ||
      matchingPreset?.colors.background ||
      '#ffffff';

    const textColor =
      cert.customColors?.textColor ||
      cert.customColors?.text ||
      matchingPreset?.colors.text ||
      '#0f172a';

    // Content fields
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Supervisor';
    const department = cert.recipientDepartment || 'Hotel Operations';
    const title = cert.title || matchingPreset?.defaultTitle || 'CERTIFICATE OF EXCELLENCE';
    const presentationText =
      cert.presentationText ||
      matchingPreset?.defaultPresentationText ||
      'THIS CERTIFICATE IS PROUDLY PRESENTED TO';
    const citation =
      cert.citationText ||
      matchingPreset?.defaultCitation ||
      'In high esteem and official recognition of outstanding dedication, exceptional work ethic, and distinguished service excellence that exemplifies the true spirit of 5-star luxury hospitality.';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 13.5;
    const nameFontSize = cert.nameFontSize || 36;
    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate =
      cert.awardDate ||
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const badgeStyle = cert.badgeStyle || matchingPreset?.badgeStyle || 'gold_seal';
    const badgeText = cert.badgeText || matchingPreset?.badgeText || 'SEAL OF EXCELLENCE';
    const badgeSubtext = cert.badgeSubtext || matchingPreset?.badgeSubtext || 'WARWICK HOTELS';
    const borderStyle = cert.borderStyle || matchingPreset?.borderStyle || 'ornate_gold';

    // Signatures
    const sign1Title = cert.signatory1Title || cert.signatoryLeftTitle || matchingPreset?.signatoryLeftTitle || 'Department Head';
    const sign1Name = cert.signatory1Name || cert.signatoryLeftName || matchingPreset?.signatoryLeftName || '';
    const sign1Sig = cert.signatory1Signature;

    const sign2Title = cert.signatory2Title || cert.signatoryRightTitle || matchingPreset?.signatoryRightTitle || 'General Manager';
    const sign2Name = cert.signatory2Name || cert.signatoryRightName || matchingPreset?.signatoryRightName || 'Dr. Faisal Al-Ghamdi';
    const sign2Sig = cert.signatory2Signature;

    const showSign3 = Boolean(cert.showSignatory3 || cert.enableThirdSignatory || matchingPreset?.enableThirdSignatory);
    const sign3Title = cert.signatory3Title || cert.signatoryCenterTitle || matchingPreset?.signatoryCenterTitle || 'Operations Director';
    const sign3Name = cert.signatory3Name || cert.signatoryCenterName || matchingPreset?.signatoryCenterName || '';
    const sign3Sig = cert.signatory3Signature;

    // Font family
    const getFontFamily = () => {
      const choice = cert.fontFamilyChoice || matchingPreset?.fontFamily;
      if (choice === 'Cinzel' || choice === 'cinzel') return "'Cinzel', Georgia, serif";
      if (choice === 'Plus Jakarta Sans' || choice === 'sans') return "'Plus Jakarta Sans', Arial, sans-serif";
      return "'Playfair Display', Georgia, serif";
    };

    // Drag-and-drop Coordinates helper (supports Elementor builder layoutCoordinates)
    const coords = cert.layoutCoordinates || {};
    const getElementStyle = (key: string, defaultStyle: React.CSSProperties = {}): React.CSSProperties => {
      const aliasMap: Record<string, string[]> = {
        hotel_header: ['hotel_header', 'header_logo'],
        title_block: ['title_block', 'certificate_title', 'presentation_text'],
        recipient_block: ['recipient_block', 'recipient_name', 'recipient_meta'],
        citation_block: ['citation_block', 'citation'],
        badge_block: ['badge_block', 'badge_seal'],
        signatories_block: ['signatories_block', 'signatory_left', 'signatory_right', 'signatory_center']
      };

      const candidates = [key, ...(aliasMap[key] || [])];
      let targetCoord: { x: number; y: number; isVisible?: boolean } | null = null;
      for (const c of candidates) {
        if (coords[c] && coords[c].x !== undefined && coords[c].y !== undefined) {
          targetCoord = coords[c];
          break;
        }
      }

      if (targetCoord) {
        if (targetCoord.isVisible === false) {
          return { display: 'none' };
        }
        return {
          position: 'absolute',
          left: `${targetCoord.x}%`,
          top: `${targetCoord.y}%`,
          transform: 'translate(-50%, -50%)',
          margin: 0,
          zIndex: 30,
          textAlign: 'center',
          ...defaultStyle
        };
      }
      return defaultStyle;
    };

    // Render Border Archetypes
    const renderBorder = () => {
      switch (borderStyle) {
        case 'baroque_filigree':
          return (
            <>
              <div className="absolute inset-[10px] pointer-events-none border-[6px] z-20" style={{ borderColor }} />
              <div className="absolute inset-[18px] pointer-events-none border border-dashed z-20" style={{ borderColor: accentColor }} />
              <div className="absolute inset-[24px] pointer-events-none border-2 z-20" style={{ borderColor }} />
              {/* Baroque Corner Scrollwork */}
              <svg className="absolute top-2 left-2 w-28 h-28 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
                <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z M 16 16 Q 44 16 44 44 Q 16 44 16 16 Z" fill={accentColor} opacity="0.85" />
                <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
                <circle cx="28" cy="28" r="6" fill={accentColor} />
              </svg>
              <svg className="absolute top-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
                <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
                <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
                <circle cx="28" cy="28" r="6" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 left-2 w-28 h-28 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
                <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
                <circle cx="28" cy="28" r="6" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
                <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
                <circle cx="28" cy="28" r="6" fill={accentColor} />
              </svg>
            </>
          );

        case 'geometric_gold':
          return (
            <>
              <div className="absolute inset-[10px] pointer-events-none border-[4px] z-20" style={{ borderColor: primaryColor }} />
              <div className="absolute inset-[18px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
              {/* Art Deco Diamond Corner Brackets */}
              <svg className="absolute top-2 left-2 w-24 h-24 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
                <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
                <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
                <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
                <polygon points="25,25 35,15 45,25 35,35" fill={accentColor} />
              </svg>
              <svg className="absolute top-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
                <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
                <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
                <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
                <polygon points="25,25 35,15 45,25 35,35" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 left-2 w-24 h-24 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
                <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
                <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
                <polygon points="25,25 35,15 45,25 35,35" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
                <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
                <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
                <polygon points="25,25 35,15 45,25 35,35" fill={accentColor} />
              </svg>
            </>
          );

        case 'ivy_laurel':
          return (
            <>
              <div className="absolute inset-[12px] pointer-events-none border-[3px] rounded-lg z-20" style={{ borderColor }} />
              <div className="absolute inset-[18px] pointer-events-none border z-20" style={{ borderColor: accentColor }} />
              {/* Botanical Laurel Vine Corners */}
              <svg className="absolute top-2 left-2 w-28 h-28 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
                <path d="M 15 80 C 15 40 40 15 80 15" stroke={borderColor} strokeWidth="2.5" />
                <circle cx="22" cy="50" r="5" fill={accentColor} />
                <circle cx="34" cy="34" r="5" fill={accentColor} />
                <circle cx="50" cy="22" r="5" fill={accentColor} />
                <path d="M 15 80 L 15 15 L 80 15" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" />
              </svg>
              <svg className="absolute top-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
                <path d="M 15 80 C 15 40 40 15 80 15" stroke={borderColor} strokeWidth="2.5" />
                <circle cx="22" cy="50" r="5" fill={accentColor} />
                <circle cx="34" cy="34" r="5" fill={accentColor} />
                <circle cx="50" cy="22" r="5" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 left-2 w-28 h-28 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 15 80 C 15 40 40 15 80 15" stroke={borderColor} strokeWidth="2.5" />
                <circle cx="22" cy="50" r="5" fill={accentColor} />
                <circle cx="34" cy="34" r="5" fill={accentColor} />
                <circle cx="50" cy="22" r="5" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 15 80 C 15 40 40 15 80 15" stroke={borderColor} strokeWidth="2.5" />
                <circle cx="22" cy="50" r="5" fill={accentColor} />
                <circle cx="34" cy="34" r="5" fill={accentColor} />
                <circle cx="50" cy="22" r="5" fill={accentColor} />
              </svg>
            </>
          );

        case 'shield_crest_frame':
          return (
            <>
              <div className="absolute inset-[10px] pointer-events-none border-[8px] z-20" style={{ borderColor: primaryColor }} />
              <div className="absolute inset-[20px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
              {/* Corner Security Shield Rivets */}
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full border-2 z-25 flex items-center justify-center" style={{ borderColor: accentColor, background: primaryColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              </div>
              <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 z-25 flex items-center justify-center" style={{ borderColor: accentColor, background: primaryColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              </div>
              <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full border-2 z-25 flex items-center justify-center" style={{ borderColor: accentColor, background: primaryColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              </div>
              <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full border-2 z-25 flex items-center justify-center" style={{ borderColor: accentColor, background: primaryColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              </div>
            </>
          );

        case 'imperial_black_gold':
          return (
            <>
              <div className="absolute inset-[8px] pointer-events-none border-[5px] z-20" style={{ borderColor: accentColor }} />
              <div className="absolute inset-[15px] pointer-events-none border z-20" style={{ borderColor: '#fef08a' }} />
              <div className="absolute inset-[20px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
              {/* Crown Corner Motifs */}
              <svg className="absolute top-3 left-3 w-20 h-20 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="25" cy="25" r="4" fill={accentColor} />
              </svg>
              <svg className="absolute top-3 right-3 w-20 h-20 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="25" cy="25" r="4" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-3 left-3 w-20 h-20 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="25" cy="25" r="4" fill={accentColor} />
              </svg>
              <svg className="absolute bottom-3 right-3 w-20 h-20 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="25" cy="25" r="4" fill={accentColor} />
              </svg>
            </>
          );

        case 'double_border':
          return (
            <>
              <div className="absolute inset-[12px] pointer-events-none border-[3px] z-20" style={{ borderColor: primaryColor }} />
              <div className="absolute inset-[18px] pointer-events-none border z-20" style={{ borderColor: accentColor }} />
              <div className="absolute top-3 left-3 w-6 h-6 z-25" style={{ background: primaryColor }} />
              <div className="absolute top-3 right-3 w-6 h-6 z-25" style={{ background: primaryColor }} />
              <div className="absolute bottom-3 left-3 w-6 h-6 z-25" style={{ background: primaryColor }} />
              <div className="absolute bottom-3 right-3 w-6 h-6 z-25" style={{ background: primaryColor }} />
            </>
          );

        case 'royal_frame':
        default:
          return (
            <>
              <div className="absolute inset-[10px] pointer-events-none border-[5px] z-20" style={{ borderColor: accentColor }} />
              <div className="absolute inset-[16px] pointer-events-none border z-20" style={{ borderColor: primaryColor }} />
              <div className="absolute inset-[20px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
              {/* Classical Filigree Corner Pieces */}
              <svg className="absolute top-2 left-2 w-28 h-28 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
                <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="22" cy="22" r="5" fill={accentColor} />
                <path d="M 10 10 Q 40 10 40 40 Q 10 40 10 10" fill={accentColor} opacity="0.2" />
              </svg>
              <svg className="absolute top-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
                <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="22" cy="22" r="5" fill={accentColor} />
                <path d="M 10 10 Q 40 10 40 40 Q 10 40 10 10" fill={accentColor} opacity="0.2" />
              </svg>
              <svg className="absolute bottom-2 left-2 w-28 h-28 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
                <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="22" cy="22" r="5" fill={accentColor} />
                <path d="M 10 10 Q 40 10 40 40 Q 10 40 10 10" fill={accentColor} opacity="0.2" />
              </svg>
              <svg className="absolute bottom-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
                <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
                <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
                <circle cx="22" cy="22" r="5" fill={accentColor} />
                <path d="M 10 10 Q 40 10 40 40 Q 10 40 10 10" fill={accentColor} opacity="0.2" />
              </svg>
            </>
          );
      }
    };

    return (
      <div
        ref={ref}
        id={`${idPrefix}-certificate-container`}
        data-certificate-root="true"
        style={{
          width: '1000px',
          height: '700px',
          backgroundColor: cert.backgroundGradient ? undefined : backgroundColor,
          backgroundImage: cert.customBackgroundImage
            ? `url(${cert.customBackgroundImage})`
            : cert.backgroundGradient || undefined,
          backgroundSize: cert.customBackgroundImage ? 'cover' : undefined,
          backgroundPosition: 'center',
          color: textColor,
          fontFamily: getFontFamily()
        }}
        className={`relative box-border overflow-hidden select-none print:shadow-none shadow-2xl ${className}`}
      >
        {/* Background Gradient / Guilloche Pattern Texture */}
        {!cert.customBackgroundImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, transparent 60%, ${primaryColor}15 100%), linear-gradient(135deg, ${accentColor}08 25%, transparent 25%), linear-gradient(225deg, ${accentColor}08 25%, transparent 25%)`,
              backgroundSize: '100% 100%, 40px 40px, 40px 40px'
            }}
          />
        )}

        {/* Subtle Watermark in Center */}
        {cert.showWatermark !== false && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5 opacity-[0.04]">
            <svg viewBox="0 0 300 300" className="w-[420px] h-[420px]" fill={primaryColor}>
              <circle cx="150" cy="150" r="130" stroke={primaryColor} strokeWidth="8" fill="none" />
              <path d="M 100 90 L 150 180 L 200 90 L 230 220 L 70 220 Z" />
              <polygon points="150,40 160,70 190,70 165,90 175,120 150,100 125,120 135,90 110,70 140,70" />
            </svg>
          </div>
        )}

        {/* Decorative Luxury Border */}
        {renderBorder()}

        {/* Certificate Internal Container */}
        <div className="relative w-full h-full z-10 flex flex-col justify-between px-16 py-10 box-border">
          {/* 1. Header / Hotel Brand Block */}
          <div
            id={`${idPrefix}-element-hotel_header`}
            style={getElementStyle('hotel_header')}
            className="flex flex-col items-center text-center mt-1"
          >
            <HotelLogoDisplay
              hotelName={cert.hotelName}
              hotelSubtitle={cert.hotelSubtitle}
              hotelLogoUrl={cert.hotelLogoUrl}
              hotelLogoPreset={cert.hotelLogoPreset}
              hotelLogoSize={cert.hotelLogoSize ?? 52}
              showHotelLogo={cert.showHotelLogo !== false}
              showHotelBranding={cert.showHotelBranding !== false}
              showFiveStars={cert.showFiveStars !== false}
              accentColor={accentColor}
              primaryColor={primaryColor}
              textColor={textColor}
            />
          </div>

          {/* 2. Award Title & Proclamation */}
          <div
            id={`${idPrefix}-element-title_block`}
            style={getElementStyle('title_block')}
            className="flex flex-col items-center text-center my-1"
          >
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-[0.22em] uppercase transition-all drop-shadow-xs"
              style={{ color: primaryColor }}
            >
              {title}
            </h2>
            <div className="flex items-center justify-center gap-3 w-full my-2">
              <div className="h-[1.5px] w-24 rounded-full" style={{ background: accentColor }} />
              <span className="text-xs" style={{ color: accentColor }}>★ ★ ★</span>
              <div className="h-[1.5px] w-24 rounded-full" style={{ background: accentColor }} />
            </div>
            <p
              className="text-xs sm:text-[13px] font-semibold tracking-[0.25em] uppercase opacity-85"
              style={{ color: textColor }}
            >
              {presentationText}
            </p>
          </div>

          {/* 3. Recipient Name & Department Block */}
          <div
            id={`${idPrefix}-element-recipient_block`}
            style={getElementStyle('recipient_block')}
            className="flex flex-col items-center text-center my-1"
          >
            <div className="relative inline-block px-8 py-1">
              <h1
                className="font-bold tracking-wide italic capitalize transition-all drop-shadow-sm"
                style={{
                  fontSize: `${nameFontSize}px`,
                  color: primaryColor,
                  fontFamily: "'Playfair Display', Georgia, serif"
                }}
              >
                <RichTextRenderer
                  text={recipientName}
                  isBold={cert.recipientNameIsBold}
                  isItalic={cert.recipientNameIsItalic}
                />
              </h1>
              {/* Elegant Gold Underline Swash */}
              <div
                className="h-[2px] w-full rounded-full mx-auto mt-1"
                style={{
                  background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 mt-1 text-xs font-semibold tracking-wider uppercase opacity-90">
              <span style={{ color: primaryColor }}>{position}</span>
              <span style={{ color: accentColor }}>•</span>
              <span style={{ color: primaryColor }}>{department}</span>
              {cert.awardPeriod && (
                <>
                  <span style={{ color: accentColor }}>•</span>
                  <span className="font-bold" style={{ color: accentColor }}>
                    {cert.awardPeriod}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 4. Citation Commendation Statement */}
          <div
            id={`${idPrefix}-element-citation_block`}
            style={getElementStyle('citation_block')}
            className="max-w-2xl mx-auto text-center my-1 px-4"
          >
            <p
              className="leading-relaxed font-serif opacity-90 italic"
              style={{
                fontSize: `${citationFontSize}px`,
                textAlign: citationAlignment,
                color: textColor
              }}
            >
              "{citation}"
            </p>
          </div>

          {/* 5. Bottom Row: Signatories & Badge */}
          <div
            id={`${idPrefix}-element-signatories_block`}
            style={getElementStyle('signatories_block')}
            className="flex items-end justify-between w-full px-4 mb-2 gap-4"
          >
            {/* Left Signatory */}
            <div className="flex-1 max-w-[210px] text-center">
              <SignatoryBox
                title={sign1Title}
                name={sign1Name}
                signatureUrl={sign1Sig}
                lineColor={accentColor}
                textColor={primaryColor}
              />
            </div>

            {/* Center Medal / Seal or Middle Signatory */}
            <div
              id={`${idPrefix}-element-badge_block`}
              style={getElementStyle('badge_block')}
              className="flex flex-col items-center justify-center shrink-0 px-2"
            >
              {showSign3 ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 text-center">
                    <SignatoryBox
                      title={sign3Title}
                      name={sign3Name}
                      signatureUrl={sign3Sig}
                      lineColor={accentColor}
                      textColor={primaryColor}
                    />
                  </div>
                  {cert.showBadge !== false && badgeStyle !== 'none' && (
                    <div className="w-20 h-24 flex items-center justify-center">
                      <CertificateSealMedal
                        style={badgeStyle}
                        badgeText={badgeText}
                        badgeSubtext={badgeSubtext}
                        awardPeriod={cert.awardPeriod}
                        primaryColor={primaryColor}
                        accentColor={accentColor}
                      />
                    </div>
                  )}
                </div>
              ) : (
                cert.showBadge !== false && badgeStyle !== 'none' && (
                  <div className="w-28 h-28 flex items-center justify-center">
                    <CertificateSealMedal
                      style={badgeStyle}
                      badgeText={badgeText}
                      badgeSubtext={badgeSubtext}
                      awardPeriod={cert.awardPeriod}
                      primaryColor={primaryColor}
                      accentColor={accentColor}
                    />
                  </div>
                )
              )}
            </div>

            {/* Right Signatory */}
            <div className="flex-1 max-w-[210px] text-center">
              <SignatoryBox
                title={sign2Title}
                name={sign2Name}
                signatureUrl={sign2Sig}
                lineColor={accentColor}
                textColor={primaryColor}
              />
            </div>
          </div>

          {/* 6. Footer Details: Date, Location, Certificate Number */}
          <div
            id={`${idPrefix}-element-date_location_block`}
            style={{
              borderColor: `${accentColor}30`,
              color: textColor,
              ...getElementStyle('date_location_block')
            }}
            className="flex items-center justify-between text-[10px] tracking-wider uppercase opacity-70 px-4 pt-1 border-t"
          >
            <span>Date: {awardDate}</span>
            <span className="font-mono font-bold tracking-widest" style={{ color: primaryColor }}>
              {cert.certificateNumber || 'WARWICK-5STAR-CERT'}
            </span>
            <span>{location}</span>
          </div>
        </div>
      </div>
    );
  }
);

HotelPresetUniqueCertificate.displayName = 'HotelPresetUniqueCertificate';
