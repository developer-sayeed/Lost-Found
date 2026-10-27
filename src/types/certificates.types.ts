export type CertificateTemplateType =
  | 'employee_of_month'
  | 'appreciation'
  | 'star_eom'
  | 'star_appreciation'
  | 'star_leadership'
  | 'star_hospitality'
  | 'star_milestone'
  | 'star_mastery'
  | 'custom'
  | string;

export interface CertificateColors {
  primary?: string;
  primaryColor?: string;
  accent?: string;
  accentColor?: string;
  border?: string;
  borderColor?: string;
  text?: string;
  textColor?: string;
  background?: string;
  backgroundColor?: string;
}

export type HotelLogoPreset =
  | 'warwick_crest'
  | 'grand_star'
  | 'royal_crown'
  | 'luxury_monogram'
  | 'none';

export type CertificateBadgeStyle =
  | 'rosette'
  | 'gold_seal'
  | 'laurel_crest'
  | 'star_medallion'
  | 'shield_crest'
  | 'crown_crest'
  | 'none';

export type CertificateBorderStyle =
  | 'royal_frame'
  | 'geometric_gold'
  | 'baroque_filigree'
  | 'double_border'
  | 'ornate_gold'
  | 'classic_gold'
  | 'ivy_laurel'
  | 'shield_crest_frame'
  | 'modern_minimalist'
  | 'imperial_black_gold';

export interface CustomCertificateTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  backgroundImageUrl: string;
  isCustom: boolean;
  defaultTitle?: string;
  defaultCitation?: string;
  textMode?: 'full' | 'fill_in_blanks';
  textColor?: string;
  accentColor?: string;
  nameOffsetY?: number;
  nameFontSize?: number;
  citationOffsetY?: number;
  customColors?: CertificateColors;
  layoutCoordinates?: Record<string, { x: number; y: number; isVisible?: boolean }>;
  elements?: any[];
  settings?: any;
  thumbnailBadge?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  template: CertificateTemplateType;
  customTemplateId?: string;
  customTemplateName?: string;
  customBackgroundImage?: string;
  customColors?: CertificateColors;
  textMode?: 'full' | 'fill_in_blanks';
  nameOffsetY?: number;
  nameFontSize?: number;
  title: string;
  presentationText?: string;
  recipientName: string;
  recipientStaffId?: string;
  recipientPosition?: string;
  recipientDepartment?: string;
  awardPeriod?: string;
  citationText: string;
  citationAlignment?: 'center' | 'left' | 'justify' | 'right';
  citationFontSize?: number;
  location?: string;
  awardDate: string;
  signatory1Title: string;
  signatory1Name?: string;
  signatory2Title: string;
  signatory2Name?: string;
  signatory3Title?: string;
  signatory3Name?: string;
  showSignatory3?: boolean;
  signatoryLeftTitle?: string;
  signatoryLeftName?: string;
  signatoryRightTitle?: string;
  signatoryRightName?: string;
  signatoryCenterTitle?: string;
  signatoryCenterName?: string;
  enableThirdSignatory?: boolean;
  signatory1Signature?: string;
  signatory2Signature?: string;
  signatory3Signature?: string;
  notes?: string;

  // Hotel branding & Logo options
  hotelName?: string;
  hotelSubtitle?: string;
  hotelLogoUrl?: string;
  hotelLogoPreset?: HotelLogoPreset;
  hotelLogoSize?: number;
  showHotelLogo?: boolean;
  showHotelBranding?: boolean;
  showFiveStars?: boolean;
  hotelNameFontSize?: number;
  hotelNameIsBold?: boolean;
  hotelNameIsItalic?: boolean;

  // Rich text formatting overrides
  recipientNameIsBold?: boolean;
  recipientNameIsItalic?: boolean;
  citationIsBold?: boolean;
  citationIsItalic?: boolean;

  // Seal & Medal customizations
  showBadge?: boolean;
  badgeStyle?: CertificateBadgeStyle;
  badgeText?: string;
  badgeSubtext?: string;

  // Frame, Typography & Watermark customizations
  borderStyle?: CertificateBorderStyle;
  frameColor?: string;
  frameWidth?: number;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundTexture?: string;
  fontFamily?: string;
  fontFamilyChoice?: 'serif' | 'playfair' | 'cinzel' | 'sans';
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;

  // Drag-and-drop Visual Layout Coordinates
  layoutCoordinates?: Record<string, { x: number; y: number; isVisible?: boolean }>;

  // Elementor Layout definitions
  elements?: any[];
  settings?: any;

  issuedBy: string;
  issuedByRole?: string;
  issuedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecentUserSignature {
  id: string;
  dataUrl: string;
  title?: string;
  name?: string;
  type: 'pen' | 'upload' | 'digital';
  createdAt: string;
  lastUsedAt: string;
}
