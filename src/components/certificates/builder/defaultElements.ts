import { Certificate } from '../../../types';
import { BuilderElement, CanvasSettings } from './types';

export function getInitialCanvasSettings(cert?: Partial<Certificate> | null): CanvasSettings {
  const safeCert = cert || {};
  const isPortrait = false;
  return {
    orientation: isPortrait ? 'portrait' : 'landscape',
    width: 1000,
    height: 700,
    backgroundColor: safeCert.customColors?.backgroundColor || safeCert.customColors?.background || '#ffffff',
    borderStyle: safeCert.borderStyle || 'royal_frame',
    borderColor: safeCert.customColors?.borderColor || safeCert.customColors?.border || '#c4972a',
    accentColor: safeCert.customColors?.accentColor || safeCert.customColors?.accent || '#c4972a',
    primaryColor: safeCert.customColors?.primaryColor || safeCert.customColors?.primary || '#0f2338',
    textColor: safeCert.customColors?.textColor || safeCert.customColors?.text || '#0f172a',
    backgroundImage: safeCert.customBackgroundImage || '',
    showWatermark: safeCert.showWatermark !== false,
    watermarkOpacity: 0.05
  };
}

export function buildElementsFromCert(cert?: Partial<Certificate> | null): BuilderElement[] {
  const safeCert = cert || {};
  const primaryColor = safeCert.customColors?.primaryColor || safeCert.customColors?.primary || '#0f2338';
  const accentColor = safeCert.customColors?.accentColor || safeCert.customColors?.accent || '#c4972a';
  const textColor = safeCert.customColors?.textColor || safeCert.customColors?.text || '#0f172a';
  const coords = safeCert.layoutCoordinates || {};

  const elements: BuilderElement[] = [];

  // ONLY include a brand/organization header if explicitly supplied by caller with a custom name
  if (safeCert.hotelName && safeCert.hotelName !== 'WARWICK') {
    elements.push({
      id: 'brand_header',
      type: 'hotel_header',
      name: 'Organization / Brand Header',
      category: 'header',
      x: coords['hotel_header']?.x ?? 50,
      y: coords['hotel_header']?.y ?? 13,
      zIndex: 10,
      isVisible: coords['hotel_header']?.isVisible ?? true,
      content: cert.hotelName,
      subContent: cert.hotelSubtitle || '',
      fontFamily: "'Cinzel', Georgia, serif",
      fontSize: cert.hotelNameFontSize || 26,
      fontWeight: 800,
      textColor: primaryColor,
      letterSpacing: 4,
      textAlign: 'center',
      meta: {
        logoPreset: cert.hotelLogoPreset || 'none',
        logoUrl: cert.hotelLogoUrl || '',
        showLogo: Boolean(cert.hotelLogoUrl || cert.hotelLogoPreset),
        showStars: cert.showFiveStars === true
      }
    });
  }

  elements.push(
    {
      id: 'certificate_title',
      type: 'certificate_title',
      name: 'Certificate Award Title',
      category: 'title',
      x: coords['title_block']?.x ?? 50,
      y: coords['title_block']?.y ?? 20,
      zIndex: 11,
      isVisible: coords['title_block']?.isVisible ?? true,
      content: cert.title || 'CERTIFICATE OF EXCELLENCE',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: 32,
      fontWeight: 800,
      textColor: primaryColor,
      letterSpacing: 4,
      textTransform: 'uppercase',
      textAlign: 'center'
    },
    {
      id: 'presentation_text',
      type: 'presentation_text',
      name: 'Presentation Subtitle',
      category: 'title',
      x: 50,
      y: 29,
      zIndex: 12,
      isVisible: true,
      content: cert.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      fontSize: 12,
      fontWeight: 600,
      textColor: textColor,
      letterSpacing: 3,
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.85
    },
    {
      id: 'recipient_name',
      type: 'recipient_name',
      name: 'Recipient Staff Name',
      category: 'recipient',
      x: coords['recipient_block']?.x ?? 50,
      y: coords['recipient_block']?.y ?? 42,
      zIndex: 15,
      isVisible: coords['recipient_block']?.isVisible ?? true,
      content: cert.recipientName || '{{staff_name}}',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: cert.nameFontSize || 38,
      fontWeight: 800,
      fontStyle: 'italic',
      textColor: primaryColor,
      textAlign: 'center'
    },
    {
      id: 'recipient_meta',
      type: 'recipient_meta',
      name: 'Role, Department & Period',
      category: 'recipient',
      x: 50,
      y: 51,
      zIndex: 14,
      isVisible: true,
      content: cert.recipientPosition || '{{staff_position}}',
      subContent: cert.recipientDepartment || '{{staff_department}}',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      fontSize: 12.5,
      fontWeight: 700,
      textColor: primaryColor,
      textAlign: 'center',
      meta: {
        awardPeriod: cert.awardPeriod || 'Annual Honors'
      }
    },
    {
      id: 'citation',
      type: 'citation',
      name: 'Commendation Citation',
      category: 'content',
      x: coords['citation_block']?.x ?? 50,
      y: coords['citation_block']?.y ?? 63,
      width: '78%',
      zIndex: 13,
      isVisible: coords['citation_block']?.isVisible ?? true,
      content:
        cert.citationText || '{{citation_paragraph}}',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: cert.citationFontSize || 14,
      fontStyle: 'italic',
      fontWeight: 400,
      textColor: textColor,
      textAlign: cert.citationAlignment || 'center',
      lineHeight: 1.6
    },
    {
      id: 'badge_seal',
      type: 'badge_seal',
      name: 'Official Seal / Rosette',
      category: 'badges',
      x: coords['badge_block']?.x ?? 50,
      y: coords['badge_block']?.y ?? 82,
      zIndex: 20,
      isVisible: cert.showBadge !== false && (coords['badge_block']?.isVisible ?? true),
      content: cert.badgeText || 'SEAL OF EXCELLENCE',
      subContent: cert.badgeSubtext || 'OFFICIAL RECOGNITION',
      meta: {
        badgeStyle: cert.badgeStyle || 'rosette'
      }
    },
    {
      id: 'signatory_left',
      type: 'signatory_left',
      name: 'Signatory 1 (Left)',
      category: 'signatures',
      x: 23,
      y: 84,
      width: 200,
      zIndex: 16,
      isVisible: true,
      content: cert.signatory1Title || cert.signatoryLeftTitle || 'Department Head',
      subContent: cert.signatory1Name || cert.signatoryLeftName || '',
      imageUrl: cert.signatory1Signature || '',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      fontSize: 12,
      fontWeight: 700,
      textColor: primaryColor,
      textAlign: 'center'
    },
    {
      id: 'signatory_right',
      type: 'signatory_right',
      name: 'Signatory 2 (Right)',
      category: 'signatures',
      x: 77,
      y: 84,
      width: 200,
      zIndex: 16,
      isVisible: true,
      content: cert.signatory2Title || cert.signatoryRightTitle || 'Executive Director',
      subContent: cert.signatory2Name || cert.signatoryRightName || '',
      imageUrl: cert.signatory2Signature || '',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      fontSize: 12,
      fontWeight: 700,
      textColor: primaryColor,
      textAlign: 'center'
    },
    {
      id: 'date_location',
      type: 'date_location',
      name: 'Date & Location',
      category: 'security',
      x: 50,
      y: 93,
      zIndex: 12,
      isVisible: true,
      content: cert.awardDate || '{{issue_date}}',
      subContent: cert.location || '',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      fontSize: 11,
      fontWeight: 600,
      textColor: textColor,
      textAlign: 'center',
      opacity: 0.8
    },
    {
      id: 'cert_number',
      type: 'cert_number',
      name: 'Serial & Verification Code',
      category: 'security',
      x: 10,
      y: 94,
      zIndex: 12,
      isVisible: true,
      content: cert.certificateNumber || '{{certificate_no}}',
      fontFamily: "monospace",
      fontSize: 10,
      fontWeight: 600,
      textColor: primaryColor,
      textAlign: 'left',
      opacity: 0.75
    }
  );

  return elements;
}
