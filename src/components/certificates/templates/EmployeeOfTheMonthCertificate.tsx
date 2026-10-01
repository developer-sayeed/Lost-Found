import React, { forwardRef } from 'react';
import { Certificate } from '../../../types';
import { WarwickEmblem } from '../WarwickEmblem';
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
 * 5-Star Employee of the Month Certificate
 * Signature luxury royal navy waves + 24k gold ribbon swooshes, pleated rosette medal,
 * custom hotel logo & name, customizable recipient typography, and 2-3 signatories.
 */
export const EmployeeOfTheMonthCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'eom', className = '' }, ref) => {
    const period = (cert.awardPeriod || 'June 2026').trim();
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Housekeeping';
    const department = cert.recipientDepartment || 'Housekeeping';
    const title = cert.title || 'EMPLOYEE OF THE MONTH';
    const presentationText = cert.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO';
    const citation =
      cert.citationText ||
      'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 14;
    const nameFontSize = cert.nameFontSize || 38;

    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sign1Title = cert.signatory1Title || 'Housekeeping';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'HR Director';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = Boolean(cert.showSignatory3);

    // Color palette resolution with fallbacks
    const primaryColor = cert.customColors?.primaryColor || '#0b1b2d';
    const accentColor = cert.customColors?.accentColor || '#c4972a';
    const borderColor = cert.frameColor || cert.customColors?.borderColor || '#c4972a';
    const backgroundColor = cert.backgroundColor || cert.customColors?.backgroundColor || '#ffffff';
    const textColor = cert.customColors?.textColor || '#1e293b';

    const gradId = `${idPrefix}-grad`;

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
        {/* Outer Heavy Border (solid frame with inset) */}
        <div
          className="absolute inset-[10px] pointer-events-none rounded-[2px] z-20"
          style={{
            borderWidth: `${cert.frameWidth ?? 8}px`,
            borderStyle: 'solid',
            borderColor: borderColor,
            boxShadow: `inset 0 0 0 2px #fff, inset 0 0 0 4px ${accentColor}`
          }}
        />

        {/* Inner Content Area */}
        <div
          className="absolute inset-[24px] overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: cert.backgroundGradient ? 'transparent' : backgroundColor
          }}
        >
          {/* Top-Right Curved Wave Background with Golden Swoosh Ribbons */}
          <svg
            className="absolute top-0 right-0 w-[680px] h-[360px] pointer-events-none overflow-visible z-0"
            viewBox="0 0 680 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`${gradId}-GoldWave`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff1ba" />
                <stop offset="40%" stopColor={accentColor} />
                <stop offset="100%" stopColor="#8d6210" />
              </linearGradient>
              <linearGradient id={`${gradId}-PrimaryDeep`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="60%" stopColor={primaryColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#050b12" />
              </linearGradient>
            </defs>

            {/* Back Accent Wave Layer */}
            <path
              d="M 680 0 L 100 0 C 160 90, 240 180, 420 220 C 530 245, 620 290, 680 350 Z"
              fill={`url(#${gradId}-GoldWave)`}
            />

            {/* Secondary Accent Ribbon Swoosh */}
            <path
              d="M 680 0 L 130 0 C 185 85, 260 170, 440 210 C 540 232, 630 270, 680 330 Z"
              fill={accentColor}
              opacity="0.85"
            />

            {/* Main Primary Deep Swooping Area */}
            <path
              d="M 680 0 L 170 0 C 220 80, 290 160, 470 195 C 570 215, 635 245, 680 290 Z"
              fill={`url(#${gradId}-PrimaryDeep)`}
            />
          </svg>

          {/* Top-Right Title Text (Inside Wave Area) */}
          <div className="absolute top-7 right-9 text-right z-10 select-none">
            <h1
              className="text-[42px] font-extrabold uppercase tracking-[0.14em] leading-tight"
              style={{
                color: accentColor,
                textShadow: '0 2px 5px rgba(0,0,0,0.5)',
                fontFamily: getFontFamily()
              }}
            >
              CERTIFICATE
            </h1>
            <h2
              className="text-[19px] font-bold text-white uppercase tracking-[0.2em] mt-1"
              style={{
                letterSpacing: '0.22em',
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif"
              }}
            >
              {title}
            </h2>
          </div>

          {/* Top Left Hotel Branding & Logo Section */}
          <div className="relative z-10 pt-5 pl-7">
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

          {/* Main Body Section */}
          <div className="relative z-10 px-12 max-w-[660px]">
            {/* Presentation Wording */}
            <div
              className="text-[12px] font-bold tracking-[0.24em] uppercase select-none"
              style={{
                color: accentColor,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {presentationText}
            </div>

            {/* Recipient Name with dynamic font size */}
            <div className="mt-1 relative inline-block">
              <RichTextRenderer
                text={recipientName}
                isBold={cert.recipientNameIsBold}
                isItalic={cert.recipientNameIsItalic}
                fontSize={nameFontSize}
                fontFamily={getFontFamily()}
                color={primaryColor}
                className="font-bold tracking-wide italic leading-none capitalize"
                as="h3"
              />
              {/* Bronze/Gold Gradient Underline */}
              <div
                className="h-[2.5px] w-full mt-1.5"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, #ffd978, ${accentColor})`
                }}
              />
            </div>

            {/* Position & Department */}
            {position && (
              <div
                className="text-[13.5px] font-bold uppercase tracking-wider mt-1.5"
                style={{ color: primaryColor }}
              >
                {position} {department && department !== position ? `• ${department}` : ''}
              </div>
            )}

            {/* Citation Text */}
            <RichTextRenderer
              text={citation}
              isBold={cert.citationIsBold}
              isItalic={cert.citationIsItalic}
              fontSize={citationFontSize}
              fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
              color={textColor}
              className="mt-3 leading-[1.65]"
              style={{ textAlign: citationAlignment }}
              as="p"
            />
          </div>

          {/* Rosette Medal / Seal Positioned on Mid-Right */}
          {cert.showBadge !== false && (
            <div className="absolute right-12 top-[240px] z-10 w-[130px] h-[190px]">
              <CertificateSealMedal
                style={cert.badgeStyle ?? 'rosette'}
                badgeText={cert.badgeText ?? 'SEAL OF EXCELLENCE'}
                badgeSubtext={cert.badgeSubtext ?? period}
                awardPeriod={period}
                primaryColor={primaryColor}
                accentColor={accentColor}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Bottom Footer: Signatures & Details */}
          <div className="relative z-10 px-10 pb-4">
            <div className="flex items-end justify-between">
              {/* Signatory 1 (Left) */}
              <SignatoryBox
                title={sign1Title}
                name={sign1Name}
                signatureUrl={cert.signatory1Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="200px"
              />

              {/* Center Emblem / Optional Signatory 3 / Location & Date */}
              <div className="flex flex-col items-center justify-center text-center">
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
                  <div className="flex flex-col items-center">
                    <WarwickEmblem className="w-10 h-7" color={accentColor} strokeWidth={3.8} />
                    <div className="text-[11px] font-medium text-slate-600 mt-1">
                      {location} • <span className="font-semibold">{awardDate}</span>
                    </div>
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

            {/* Sub-footer: Certificate Ref Number */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tracking-widest mt-2 px-2">
              <span>{cert.certificateNumber || 'WRW-EOM-CERT'}</span>
              <span>{period}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EmployeeOfTheMonthCertificate.displayName = 'EmployeeOfTheMonthCertificate';
