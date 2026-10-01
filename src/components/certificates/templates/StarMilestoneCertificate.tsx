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
 * 5-Star Long Service & Loyalty Milestone Certificate
 * Midnight Sapphire & Platinum Diamond / Polished Gold theme,
 * intricate guilloche security borders, commemorative tenure seal, and executive signatures.
 */
export const StarMilestoneCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'mile', className = '' }, ref) => {
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Senior Staff';
    const department = cert.recipientDepartment || 'Housekeeping';
    const title = cert.title || 'LONG SERVICE & LOYALTY MILESTONE';
    const presentationText = cert.presentationText || 'WITH DEEP GRATITUDE & HONOR CONFERRED UPON';
    const citation =
      cert.citationText ||
      'In tribute and profound appreciation for your unwavering fidelity, integrity, and dedicated years of distinguished service. Your loyal commitment, loyalty, and invaluable experience have fortified our hotel culture and stand as a beacon of pride for Warwick Hotels & Resorts.';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 13.5;
    const nameFontSize = cert.nameFontSize || 36;

    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sign1Title = cert.signatory1Title || 'Human Resources Director';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'Regional Vice President';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = Boolean(cert.showSignatory3);

    // Midnight Sapphire & Gold Palette
    const primaryColor = cert.customColors?.primaryColor || '#0a1626'; // Midnight Sapphire
    const accentColor = cert.customColors?.accentColor || '#c9a84c'; // Antique Gold
    const borderColor = cert.frameColor || cert.customColors?.borderColor || '#0a1626';
    const backgroundColor = cert.backgroundColor || cert.customColors?.backgroundColor || '#ffffff';
    const textColor = cert.customColors?.textColor || '#121f31';

    const getFontFamily = () => {
      switch (cert.fontFamilyChoice) {
        case 'playfair':
          return "'Playfair Display', Georgia, serif";
        case 'sans':
          return "'Plus Jakarta Sans', Arial, sans-serif";
        case 'cinzel':
        case 'serif':
        default:
          return "'Cinzel', Georgia, serif";
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
        {/* Outer Heavy Sapphire Border */}
        <div
          className="absolute inset-[10px] pointer-events-none z-20"
          style={{
            borderWidth: `${cert.frameWidth ?? 8}px`,
            borderStyle: 'solid',
            borderColor
          }}
        />
        {/* Double Guilloche / Fine Gold Accent Borders */}
        <div
          className="absolute inset-[19px] pointer-events-none border-[2px] z-20"
          style={{ borderColor: accentColor }}
        />
        <div
          className="absolute inset-[25px] pointer-events-none border-[1px] opacity-75 z-20"
          style={{ borderColor: accentColor }}
        />

        {/* 4 Fine Diamond Corner Insets */}
        <div className="absolute top-[28px] left-[28px] w-3 h-3 rotate-45 pointer-events-none z-20" style={{ backgroundColor: accentColor }} />
        <div className="absolute top-[28px] right-[28px] w-3 h-3 rotate-45 pointer-events-none z-20" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-[28px] left-[28px] w-3 h-3 rotate-45 pointer-events-none z-20" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-[28px] right-[28px] w-3 h-3 rotate-45 pointer-events-none z-20" style={{ backgroundColor: accentColor }} />

        {/* Inner Content Area */}
        <div className="absolute inset-[28px] p-8 flex flex-col justify-between items-center text-center overflow-hidden z-10">
          {/* Header Hotel Branding */}
          <div className="flex flex-col items-center">
            <HotelLogoDisplay
              hotelName={cert.hotelName ?? ''}
              hotelSubtitle={cert.hotelSubtitle ?? ''}
              hotelLogoUrl={cert.hotelLogoUrl}
              hotelLogoPreset={cert.hotelLogoPreset ?? 'luxury_monogram'}
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
              <span className="text-[10px] font-serif font-black tracking-widest uppercase" style={{ color: accentColor }}>
                HONOR & LOYALTY ACCREDITATION
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

          {/* Medal / Seal on Side */}
          {cert.showBadge !== false && (
            <div className="absolute right-9 top-[250px] z-10 w-[110px] h-[160px]">
              <CertificateSealMedal
                style={cert.badgeStyle ?? 'star_medallion'}
                badgeText={cert.badgeText ?? 'LOYALTY MEDAL'}
                badgeSubtext={cert.badgeSubtext ?? 'TENURE HONOR'}
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

              {/* Center Details / Optional Signatory 3 */}
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
                    <div className="font-serif italic">Conferred On: <span className="font-semibold text-slate-900 not-italic">{awardDate}</span></div>
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
              <span>{cert.certificateNumber || 'WRW-MILE-CERT'}</span>
              <span>{cert.showHotelBranding !== false ? (cert.hotelName || cert.hotelSubtitle || '') : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StarMilestoneCertificate.displayName = 'StarMilestoneCertificate';
