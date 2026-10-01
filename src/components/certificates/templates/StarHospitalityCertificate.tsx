import React, { forwardRef } from 'react';
import { Certificate } from '../../../types';
import { HotelLogoDisplay } from '../HotelLogoDisplay';
import { CertificateSealMedal } from '../CertificateSealMedal';
import { RichTextRenderer } from '../RichTextRenderer';
import { SignatoryBox } from '../SignatoryBox';

export interface CertificateTemplateProps {
  cert: Partial<Certificate>;
  idPrefix?: string;
  className?: string;
}

/**
 * 5-Star Hospitality Hero & Guest Delight Award Certificate
 * Deep Royal Burgundy / Crimson Wine & Warm Rose Gold theme,
 * graceful luxury arcs, guest satisfaction citation, and 5-star service badge.
 */
export const StarHospitalityCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'hosp', className = '' }, ref) => {
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Guest Relations & Concierge';
    const department = cert.recipientDepartment || 'Front Office & Housekeeping';
    const title = cert.title || '5-STAR HOSPITALITY HERO AWARD';
    const presentationText = cert.presentationText || 'PRESENTED IN RECOGNITION OF EXEMPLARY SERVICE TO';
    const citation =
      cert.citationText ||
      'For exceptional warmth, genuine courtesy, and unwavering commitment to crafting unforgettable 5-star guest journeys. Your attention to detail, heartfelt care, and superior guest satisfaction have made an enduring positive impression upon visitors to Warwick Hotel Baha.';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 13.5;
    const nameFontSize = cert.nameFontSize || 36;

    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sign1Title = cert.signatory1Title || 'Director of Guest Services';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'Hotel Operations Manager';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = Boolean(cert.showSignatory3);

    // Deep Royal Burgundy Wine & Rose Gold
    const primaryColor = cert.customColors?.primaryColor || '#4b1222';
    const accentColor = cert.customColors?.accentColor || '#d59a58';
    const borderColor = cert.frameColor || cert.customColors?.borderColor || '#4b1222';
    const backgroundColor = cert.backgroundColor || cert.customColors?.backgroundColor || '#fffdfa';
    const textColor = cert.customColors?.textColor || '#261117';

    const getFontFamily = () => {
      switch (cert.fontFamilyChoice) {
        case 'cinzel':
          return "'Cinzel', Georgia, serif";
        case 'sans':
          return "'Plus Jakarta Sans', Arial, sans-serif";
        case 'serif':
        case 'playfair':
        default:
          return "'Playfair Display', Georgia, serif";
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
          backgroundImage: cert.backgroundGradient || undefined
        }}
        className={`relative text-slate-900 box-border overflow-hidden select-none font-sans print:shadow-none shadow-2xl ${className}`}
      >
        {/* Outer Heavy Burgundy Frame with Gold Inner Stripe */}
        <div
          className="absolute inset-[10px] pointer-events-none z-20"
          style={{
            borderWidth: `${cert.frameWidth ?? 8}px`,
            borderStyle: 'solid',
            borderColor
          }}
        />
        <div
          className="absolute inset-[20px] pointer-events-none border-2 z-20"
          style={{ borderColor: accentColor }}
        />

        {/* Top-Left & Bottom-Right Flowing Floral/Geometric Corner Accents */}
        <svg
          className="absolute top-0 left-0 w-44 h-44 pointer-events-none z-10"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path d="M 0 0 L 80 0 C 40 10, 10 40, 0 80 Z" fill={primaryColor} opacity="0.12" />
          <path d="M 0 0 L 60 0 C 30 10, 10 30, 0 60 Z" fill={accentColor} opacity="0.25" />
        </svg>

        <svg
          className="absolute bottom-0 right-0 w-44 h-44 pointer-events-none z-10 rotate-180"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path d="M 0 0 L 80 0 C 40 10, 10 40, 0 80 Z" fill={primaryColor} opacity="0.12" />
          <path d="M 0 0 L 60 0 C 30 10, 10 30, 0 60 Z" fill={accentColor} opacity="0.25" />
        </svg>

        {/* Content Area */}
        <div className="absolute inset-[24px] p-8 flex flex-col justify-between items-center text-center overflow-hidden z-10">
          {/* Header Hotel Branding */}
          <div className="flex flex-col items-center">
            <HotelLogoDisplay
              hotelName={cert.hotelName ?? ''}
              hotelSubtitle={cert.hotelSubtitle ?? ''}
              hotelLogoUrl={cert.hotelLogoUrl}
              hotelLogoPreset={cert.hotelLogoPreset ?? 'royal_crown'}
              hotelLogoSize={cert.hotelLogoSize ?? 50}
              showHotelLogo={cert.showHotelLogo !== false}
              showHotelBranding={cert.showHotelBranding !== false}
              showFiveStars={cert.showFiveStars !== false}
              hotelNameFontSize={cert.hotelNameFontSize}
              hotelNameIsBold={cert.hotelNameIsBold}
              hotelNameIsItalic={cert.hotelNameIsItalic}
              accentColor={accentColor}
              primaryColor={primaryColor}
              textColor={primaryColor}
              layout="stacked"
            />
          </div>

          {/* Certificate Title */}
          <div className="my-1">
            <h1
              className="text-[35px] font-black uppercase tracking-[0.14em]"
              style={{
                color: primaryColor,
                fontFamily: getFontFamily(),
                letterSpacing: '0.14em'
              }}
            >
              {title}
            </h1>
            <div className="flex items-center justify-center gap-2.5 mt-1">
              <div className="w-16 h-[1.5px]" style={{ backgroundColor: accentColor }} />
              <span className="text-[10.5px] font-serif font-bold tracking-widest uppercase" style={{ color: accentColor }}>
                GUEST EXCELLENCE & DELIGHT
              </span>
              <div className="w-16 h-[1.5px]" style={{ backgroundColor: accentColor }} />
            </div>
          </div>

          {/* Presentation & Recipient Details */}
          <div className="w-full max-w-[820px] flex flex-col items-center">
            <div
              className="text-[12px] font-bold uppercase tracking-[0.24em] select-none"
              style={{ color: accentColor }}
            >
              {presentationText}
            </div>

            {/* Recipient Name */}
            <div className="mt-1 relative inline-block">
              <RichTextRenderer
                text={recipientName}
                isBold={cert.recipientNameIsBold}
                isItalic={cert.recipientNameIsItalic}
                fontSize={nameFontSize}
                fontFamily={getFontFamily()}
                color={primaryColor}
                className="font-bold tracking-wide italic leading-none capitalize"
                as="h2"
              />
              {/* Gold Underline */}
              <div
                className="h-[2px] w-full mt-1.5"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, #ffd978, ${accentColor})`
                }}
              />
            </div>

            {/* Position & Department */}
            {position && (
              <div
                className="text-[13.5px] font-bold uppercase tracking-wider mt-1"
                style={{ color: primaryColor }}
              >
                {position} {department && department !== position ? `• ${department}` : ''}
              </div>
            )}

            {/* Citation Paragraph */}
            <RichTextRenderer
              text={citation}
              isBold={cert.citationIsBold}
              isItalic={cert.citationIsItalic}
              fontSize={citationFontSize}
              fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
              color={textColor}
              className="mt-2.5 leading-[1.68] max-w-[760px] font-normal"
              style={{ textAlign: citationAlignment }}
              as="p"
            />
          </div>

          {/* Badge / Rosette Medal on Side */}
          {cert.showBadge !== false && (
            <div className="absolute right-9 top-[250px] z-10 w-[110px] h-[160px]">
              <CertificateSealMedal
                style={cert.badgeStyle ?? 'gold_seal'}
                badgeText={cert.badgeText ?? '5-STAR SERVICE'}
                badgeSubtext={cert.badgeSubtext ?? 'HOSPITALITY'}
                awardPeriod={cert.awardPeriod || '2026'}
                primaryColor={primaryColor}
                accentColor={accentColor}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Signatures & Location Row */}
          <div className="w-full max-w-[880px] mt-1">
            <div className="flex items-end justify-between px-6">
              {/* Signatory 1 */}
              <SignatoryBox
                title={sign1Title}
                name={sign1Name}
                signatureUrl={cert.signatory1Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="200px"
              />

              {/* Center Info / Optional Signatory 3 */}
              <div className="text-center">
                {showSign3 ? (
                  <SignatoryBox
                    title={sign3Title}
                    name={sign3Name}
                    signatureUrl={cert.signatory3Signature}
                    lineColor={primaryColor}
                    textColor={primaryColor}
                    width="180px"
                  />
                ) : (
                  <div className="text-[12px] text-slate-700 space-y-0.5">
                    <div>Location: <span className="font-semibold text-slate-900">{location}</span></div>
                    <div className="font-serif italic">Awarded On: <span className="font-semibold text-slate-900 not-italic">{awardDate}</span></div>
                  </div>
                )}
              </div>

              {/* Signatory 2 */}
              <SignatoryBox
                title={sign2Title}
                name={sign2Name}
                signatureUrl={cert.signatory2Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="200px"
              />
            </div>

            {/* Certificate ID */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest mt-2 px-6">
              <span>{cert.certificateNumber || 'WRW-HOSP-CERT'}</span>
              <span>{cert.showHotelBranding !== false ? (cert.hotelName || cert.hotelSubtitle || '') : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StarHospitalityCertificate.displayName = 'StarHospitalityCertificate';
