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
 * 5-Star Certificate of Appreciation
 * Monumental Roman arches with gold filigree corner ornaments, dual-tier borders,
 * 5-star rating arch, formal presentation citation, and customizable signatories.
 */
export const AppreciationCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'app', className = '' }, ref) => {
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Housekeeping Supervisor';
    const department = cert.recipientDepartment || 'Housekeeping';
    const title = cert.title || 'CERTIFICATE OF APPRECIATION';
    const presentationText = cert.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO';
    const citation =
      cert.citationText ||
      `This certificate is proudly presented to ${recipientName}, ${position}, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.`;
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 13.5;
    const nameFontSize = cert.nameFontSize || 36;

    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sign1Title = cert.signatory1Title || 'Housekeeping Manager';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'Hotel Operations Director';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = Boolean(cert.showSignatory3);

    // Color palette
    const primaryColor = cert.customColors?.primaryColor || '#0b1b2d';
    const accentColor = cert.customColors?.accentColor || '#c4972a';
    const borderColor = cert.frameColor || cert.customColors?.borderColor || '#c4972a';
    const backgroundColor = cert.backgroundColor || cert.customColors?.backgroundColor || '#ffffff';
    const textColor = cert.customColors?.textColor || '#1e293b';

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
        {/* Outer Heavy Gold Double Border Frame */}
        <div
          className="absolute inset-[10px] pointer-events-none z-20"
          style={{
            borderWidth: `${cert.frameWidth ?? 7}px`,
            borderStyle: 'solid',
            borderColor: borderColor
          }}
        />
        <div
          className="absolute inset-[20px] pointer-events-none border-[1.5px] z-20"
          style={{ borderColor: accentColor }}
        />

        {/* 4 Classical Corner Ornaments */}
        <div className="absolute top-[22px] left-[22px] w-10 h-10 border-t-2 border-l-2 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute top-[22px] right-[22px] w-10 h-10 border-t-2 border-r-2 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute bottom-[22px] left-[22px] w-10 h-10 border-b-2 border-l-2 pointer-events-none z-20" style={{ borderColor: accentColor }} />
        <div className="absolute bottom-[22px] right-[22px] w-10 h-10 border-b-2 border-r-2 pointer-events-none z-20" style={{ borderColor: accentColor }} />

        {/* Main Certificate Inner Layout */}
        <div className="absolute inset-[24px] p-8 flex flex-col justify-between items-center text-center overflow-hidden">
          {/* Header Hotel Branding */}
          <div className="flex flex-col items-center">
            <HotelLogoDisplay
              hotelName={cert.hotelName ?? ''}
              hotelSubtitle={cert.hotelSubtitle ?? ''}
              hotelLogoUrl={cert.hotelLogoUrl}
              hotelLogoPreset={cert.hotelLogoPreset ?? 'warwick_crest'}
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

          {/* Certificate Title Banner */}
          <div className="my-1">
            <h1
              className="text-[36px] font-black uppercase tracking-[0.16em]"
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
              <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accentColor }} />
              <div className="w-16 h-[1.5px]" style={{ backgroundColor: accentColor }} />
            </div>
          </div>

          {/* Recipient & Presentation Details */}
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
                className="h-[2px] w-full mt-1.5"
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
              className="mt-2.5 leading-[1.68] max-w-[750px] font-normal"
              style={{ textAlign: citationAlignment }}
              as="p"
            />
          </div>

          {/* Seal / Rosette Badge (if enabled) */}
          {cert.showBadge !== false && (
            <div className="absolute right-10 top-[260px] z-10 w-[110px] h-[160px]">
              <CertificateSealMedal
                style={cert.badgeStyle ?? 'gold_seal'}
                badgeText={cert.badgeText ?? 'SEAL OF EXCELLENCE'}
                badgeSubtext={cert.badgeSubtext ?? 'HOTEL OPENING'}
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
              {/* Signatory 1 (Left) */}
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
                    <div className="font-serif italic">Date: <span className="font-semibold text-slate-900 not-italic">{awardDate}</span></div>
                  </div>
                )}
              </div>

              {/* Signatory 2 (Right) */}
              <SignatoryBox
                title={sign2Title}
                name={sign2Name}
                signatureUrl={cert.signatory2Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="200px"
              />
            </div>

            {/* Certificate ID Number */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest mt-2 px-6">
              <span>{cert.certificateNumber || 'WRW-APPR-CERT'}</span>
              <span>{cert.showHotelBranding !== false ? (cert.hotelName || cert.hotelSubtitle || '') : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AppreciationCertificate.displayName = 'AppreciationCertificate';
