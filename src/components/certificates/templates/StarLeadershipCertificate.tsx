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
 * 5-Star Leadership & Supervisory Distinction Certificate
 * Imperial Emerald & 24K Polished Gold theme, baroque corner laurels,
 * executive 3-signatory layout, and high-prestige leadership citation.
 */
export const StarLeadershipCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'lead', className = '' }, ref) => {
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Supervisor';
    const department = cert.recipientDepartment || 'Housekeeping';
    const title = cert.title || 'LEADERSHIP & SUPERVISORY EXCELLENCE';
    const presentationText = cert.presentationText || 'THIS PRESTIGIOUS ACCREDITATION IS CONFERRED UPON';
    const citation =
      cert.citationText ||
      'In distinguished recognition of exemplary leadership, operational mastery, and uncompromised dedication to hospitality excellence. Your visionary guidance, mentorship, and high standards have inspired team performance and elevated hotel guest satisfaction.';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 13.5;
    const nameFontSize = cert.nameFontSize || 36;

    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sign1Title = cert.signatory1Title || 'Department Head';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'Director of Operations';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = cert.showSignatory3 !== false; // Default true for leadership award

    // Imperial Emerald & Gold Theme
    const primaryColor = cert.customColors?.primaryColor || '#073e2a'; // Deep Emerald Green
    const accentColor = cert.customColors?.accentColor || '#d4af37'; // 24K Gold
    const borderColor = cert.frameColor || cert.customColors?.borderColor || '#073e2a';
    const backgroundColor = cert.backgroundColor || cert.customColors?.backgroundColor || '#fcfbf7'; // Warm ivory pearl
    const textColor = cert.customColors?.textColor || '#112217';

    const getFontFamily = () => {
      switch (cert.fontFamilyChoice) {
        case 'playfair':
          return "'Playfair Display', Georgia, serif";
        case 'sans':
          return "'Plus Jakarta Sans', Arial, sans-serif";
        case 'cinzel':
        case 'serif':
        default:
          return "'Cinzel', 'Playfair Display', Georgia, serif";
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
        {/* Outer Heavy Emerald & Gold Border */}
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
        <div
          className="absolute inset-[24px] pointer-events-none border-[1px] border-dashed opacity-60 z-20"
          style={{ borderColor: accentColor }}
        />

        {/* 4 Regal Baroque Corner Flairs */}
        <div className="absolute top-[26px] left-[26px] w-12 h-12 border-t-4 border-l-4 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute top-[26px] right-[26px] w-12 h-12 border-t-4 border-r-4 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute bottom-[26px] left-[26px] w-12 h-12 border-b-4 border-l-4 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute bottom-[26px] right-[26px] w-12 h-12 border-b-4 border-r-4 pointer-events-none z-20" style={{ borderColor: accentColor }} />

        {/* Subtle Background Watermark */}
        {cert.showWatermark !== false && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none z-0">
            <svg viewBox="0 0 100 100" className="w-[450px] h-[450px]" fill={primaryColor}>
              <circle cx="50" cy="50" r="45" fill="none" stroke={primaryColor} strokeWidth="2" />
              <polygon points="50,10 62,35 90,38 70,58 75,85 50,72 25,85 30,58 10,38 38,35" />
            </svg>
          </div>
        )}

        {/* Content Container */}
        <div className="absolute inset-[28px] p-8 flex flex-col justify-between items-center text-center overflow-hidden z-10">
          {/* Header Hotel Branding */}
          <div className="flex flex-col items-center">
            <HotelLogoDisplay
              hotelName={cert.hotelName ?? ''}
              hotelSubtitle={cert.hotelSubtitle ?? ''}
              hotelLogoUrl={cert.hotelLogoUrl}
              hotelLogoPreset={cert.hotelLogoPreset ?? 'grand_star'}
              hotelLogoSize={cert.hotelLogoSize ?? 52}
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
              className="text-[34px] font-black uppercase tracking-[0.16em]"
              style={{
                color: primaryColor,
                fontFamily: getFontFamily(),
                letterSpacing: '0.15em'
              }}
            >
              {title}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-20 h-[1.5px]" style={{ backgroundColor: accentColor }} />
              <span className="text-[11px] font-serif font-black tracking-widest uppercase" style={{ color: accentColor }}>
                EXECUTIVE DISTINCTION
              </span>
              <div className="w-20 h-[1.5px]" style={{ backgroundColor: accentColor }} />
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
              {/* Bronze/Gold Gradient Underline */}
              <div
                className="h-[2.5px] w-full mt-1.5"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, #ffd978, ${accentColor})`
                }}
              />
            </div>

            {/* Designation & Department */}
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

          {/* Laurel Medal / Badge on Side */}
          {cert.showBadge !== false && (
            <div className="absolute right-9 top-[250px] z-10 w-[110px] h-[160px]">
              <CertificateSealMedal
                style={cert.badgeStyle ?? 'laurel_crest'}
                badgeText={cert.badgeText ?? 'LEADERSHIP SEAL'}
                badgeSubtext={cert.badgeSubtext ?? 'EXECUTIVE'}
                awardPeriod={cert.awardPeriod || '2026'}
                primaryColor={primaryColor}
                accentColor={accentColor}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Bottom Row: 3 Executive Signatures & Location */}
          <div className="w-full max-w-[900px] mt-1">
            <div className="flex items-end justify-between px-4">
              {/* Signatory 1 */}
              <SignatoryBox
                title={sign1Title}
                name={sign1Name}
                signatureUrl={cert.signatory1Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="200px"
              />

              {/* Signatory 3 (Center) or Location info */}
              {showSign3 ? (
                <SignatoryBox
                  title={sign3Title}
                  name={sign3Name}
                  signatureUrl={cert.signatory3Signature}
                  lineColor={primaryColor}
                  textColor={primaryColor}
                  width="200px"
                />
              ) : (
                <div className="text-center text-[12px] text-slate-700">
                  <div>Location: <span className="font-semibold text-slate-900">{location}</span></div>
                  <div className="font-serif italic">Conferred On: <span className="font-semibold text-slate-900 not-italic">{awardDate}</span></div>
                </div>
              )}

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

            {/* Footer Metadata */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest mt-2.5 px-4">
              <span>{cert.certificateNumber || 'WRW-LEAD-CERT'}</span>
              <span>{location} • {awardDate}</span>
              <span>{cert.showHotelBranding !== false ? (cert.hotelName || cert.hotelSubtitle || '') : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StarLeadershipCertificate.displayName = 'StarLeadershipCertificate';
