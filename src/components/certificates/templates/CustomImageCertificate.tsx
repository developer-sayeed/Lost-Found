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
 * Custom Uploaded Picture Certificate
 * Renders any certificate picture/image uploaded by admin as the background!
 * Supports:
 * - "full": Overlays hotel branding header, certificate title, recipient name, citation, and signatures
 * - "fill_in_blanks": Overlays recipient name, citation, date, and signatures in custom position (ideal for pre-printed templates!)
 */
export const CustomImageCertificate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix = 'custom', className = '' }, ref) => {
    const recipientName = cert.recipientName || 'MD ABU SAYEED RIDAY';
    const position = cert.recipientPosition || 'Staff Member';
    const location = cert.location || 'Al Baha, Saudi Arabia';
    const awardDate = cert.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const citation = cert.citationText || 'In recognition of outstanding dedication and exemplary performance at Warwick Hotel Baha.';
    const citationAlignment = cert.citationAlignment || 'center';
    const citationFontSize = cert.citationFontSize || 14;

    const sign1Title = cert.signatory1Title || 'Department Head';
    const sign1Name = cert.signatory1Name || '';
    const sign2Title = cert.signatory2Title || 'General Manager';
    const sign2Name = cert.signatory2Name || '';
    const sign3Title = cert.signatory3Title || 'Operations Lead';
    const sign3Name = cert.signatory3Name || '';
    const showSign3 = Boolean(cert.showSignatory3);

    const textMode = cert.textMode || 'fill_in_blanks';
    const nameOffsetY = typeof cert.nameOffsetY === 'number' ? cert.nameOffsetY : 46;
    const nameFontSize = typeof cert.nameFontSize === 'number' ? cert.nameFontSize : 38;

    // Color palette resolution
    const primaryColor = cert.customColors?.primaryColor || '#0f2338';
    const accentColor = cert.customColors?.accentColor || '#c4972a';
    const textColor = cert.customColors?.textColor || '#1a2e40';
    const bgImage = cert.customBackgroundImage || '';

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
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#ffffff'
        }}
        className={`relative text-slate-900 box-border overflow-hidden select-none font-sans print:shadow-none shadow-2xl ${className}`}
      >
        {/* If no image provided, show elegant placeholder frame */}
        {!bgImage && (
          <div className="absolute inset-4 border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
            <span className="text-xl font-bold">Uploaded Certificate Image Placeholder</span>
            <span className="text-sm mt-1">Upload any certificate picture to see it rendered here</span>
          </div>
        )}

        {textMode === 'full' ? (
          /* Full Overlay Layout */
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-16 pt-8 pb-8 text-center bg-white/25 backdrop-blur-[0.5px]">
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

            {/* Title */}
            <div className="mt-2">
              <h1
                className="text-[35px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: primaryColor, fontFamily: getFontFamily() }}
              >
                {cert.title || 'CERTIFICATE OF RECOGNITION'}
              </h1>
              <div className="w-24 h-1 mx-auto mt-1" style={{ backgroundColor: accentColor }} />
            </div>

            {/* Recipient */}
            <div className="w-full max-w-[720px] flex flex-col items-center">
              <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-600">
                {cert.presentationText || 'THIS IS PROUDLY PRESENTED TO'}
              </div>
              <div className="mt-1">
                <RichTextRenderer
                  text={recipientName}
                  isBold={cert.recipientNameIsBold}
                  isItalic={cert.recipientNameIsItalic}
                  fontSize={nameFontSize}
                  fontFamily={getFontFamily()}
                  color={primaryColor}
                  className="font-bold italic tracking-wide"
                />
              </div>
              <div className="w-[450px] h-[1.5px] mt-1" style={{ backgroundColor: primaryColor }} />
              {position && (
                <div className="text-[13px] font-semibold uppercase tracking-wider mt-1 text-slate-700">
                  {position} {cert.recipientDepartment ? `• ${cert.recipientDepartment}` : ''}
                </div>
              )}
              <RichTextRenderer
                text={citation}
                isBold={cert.citationIsBold}
                isItalic={cert.citationIsItalic}
                fontSize={citationFontSize}
                fontFamily="'Plus Jakarta Sans', sans-serif"
                color="#1e293b"
                className="mt-3 leading-[1.6] max-w-[650px] font-normal text-slate-800"
                style={{ textAlign: citationAlignment }}
                as="p"
              />
            </div>

            {/* Bottom Signatures */}
            <div className="w-full max-w-[850px]">
              <div className="flex items-end justify-between px-6">
                <SignatoryBox
                  title={sign1Title}
                  name={sign1Name}
                  signatureUrl={cert.signatory1Signature}
                  lineColor={primaryColor}
                  textColor={primaryColor}
                  width="200px"
                />

                {showSign3 && (
                  <SignatoryBox
                    title={sign3Title}
                    name={sign3Name}
                    signatureUrl={cert.signatory3Signature}
                    lineColor={primaryColor}
                    textColor={primaryColor}
                    width="180px"
                  />
                )}

                <SignatoryBox
                  title={sign2Title}
                  name={sign2Name}
                  signatureUrl={cert.signatory2Signature}
                  lineColor={primaryColor}
                  textColor={primaryColor}
                  width="200px"
                />
              </div>
              <div className="flex items-center justify-between text-[12px] text-slate-700 px-6 mt-3">
                <div>Location: <span className="font-semibold">{location}</span></div>
                <div>Date: <span className="font-semibold">{awardDate}</span></div>
              </div>
            </div>
          </div>
        ) : (
          /* Fill-in-the-blanks Mode: Overlays text accurately over pre-printed certificate image */
          <div className="absolute inset-0 z-10 pointer-events-none select-none">
            {/* Recipient Name positioned at nameOffsetY */}
            <div
              className="absolute left-0 right-0 flex flex-col items-center justify-center text-center px-12"
              style={{ top: `${nameOffsetY}%`, transform: 'translateY(-50%)' }}
            >
              <RichTextRenderer
                text={recipientName}
                isBold={cert.recipientNameIsBold}
                isItalic={cert.recipientNameIsItalic}
                fontSize={nameFontSize}
                fontFamily={getFontFamily()}
                color={primaryColor}
                className="font-bold italic tracking-wide"
                style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
              />
              {position && (
                <div
                  className="text-[13px] font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: textColor }}
                >
                  {position}
                </div>
              )}
            </div>

            {/* Citation Paragraph */}
            <div
              className="absolute left-0 right-0 flex justify-center text-center px-20"
              style={{ top: `${Math.min(nameOffsetY + 14, 68)}%`, transform: 'translateY(-50%)' }}
            >
              <RichTextRenderer
                text={citation}
                isBold={cert.citationIsBold}
                isItalic={cert.citationIsItalic}
                fontSize={citationFontSize}
                fontFamily="'Plus Jakarta Sans', sans-serif"
                color={textColor}
                className="max-w-[650px] leading-[1.6] font-medium"
                style={{
                  textAlign: citationAlignment,
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)'
                }}
                as="p"
              />
            </div>

            {/* Signatures & Date in bottom section */}
            <div className="absolute bottom-9 left-16 right-16 flex items-end justify-between">
              {/* Left Signature */}
              <SignatoryBox
                title={sign1Title}
                name={sign1Name}
                signatureUrl={cert.signatory1Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="210px"
              />

              {/* Date & Location in Center */}
              <div className="text-center text-[12px] font-medium" style={{ color: textColor }}>
                <div>{location}</div>
                <div className="font-serif italic">{awardDate}</div>
              </div>

              {/* Right Signature */}
              <SignatoryBox
                title={sign2Title}
                name={sign2Name}
                signatureUrl={cert.signatory2Signature}
                lineColor={primaryColor}
                textColor={primaryColor}
                width="210px"
              />
            </div>
          </div>
        )}

        {/* Certificate Reference Number */}
        {cert.certificateNumber && (
          <div className="absolute bottom-2 left-6 text-[10px] text-slate-400 font-mono tracking-widest z-20">
            {cert.certificateNumber}
          </div>
        )}
      </div>
    );
  }
);

CustomImageCertificate.displayName = 'CustomImageCertificate';
