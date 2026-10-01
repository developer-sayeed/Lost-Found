import { Certificate, CertificateBadgeStyle, CertificateBorderStyle, CertificateColors } from '../../../types';

export type BuilderElementType =
  // Structural Containers & Grids (Elementor Architecture)
  | 'container_grid'
  // Header & Branding
  | 'hotel_header'
  | 'hotel_logo'
  | 'hotel_crest_embossed'
  | 'five_stars'
  | 'hotel_subtitle'
  | 'department_badge'
  // Titles & Presentation
  | 'certificate_title'
  | 'presentation_text'
  | 'award_subtitle'
  | 'arabic_bismillah'
  | 'honorary_ribbon_banner'
  | 'custom_heading'
  // Recipient & Personalization
  | 'recipient_name'
  | 'recipient_arabic_name'
  | 'recipient_meta'
  | 'recipient_photo'
  | 'recipient_badge_id'
  | 'service_duration'
  // Commendations & Content
  | 'citation'
  | 'bullet_achievements'
  | 'quote_box'
  | 'core_values_tag'
  | 'custom_text'
  // Signatures & Endorsements
  | 'signatory_left'
  | 'signatory_right'
  | 'signatory_center'
  | 'signatory_witness'
  | 'digital_stamp'
  | 'date_location'
  | 'signature_date'
  // Seals, Badges & Medals
  | 'badge_seal'
  | 'gold_foil_seal'
  | 'laurel_crest'
  | 'star_burst_medal'
  | 'shield_medal'
  // Security & Verification
  | 'cert_number'
  | 'qr_code'
  | 'barcode_strip'
  | 'watermark_text'
  | 'security_microtext'
  // Decorative & Framing Accents
  | 'divider_flourish'
  | 'corner_accents'
  | 'gold_chain_divider'
  | 'geometric_frame_accent'
  | 'custom_image'
  | 'asset_icon';

export interface ContainerSlotConfig {
  id: string;
  label?: string;
  elementIds: string[];
}

export interface ContainerLayoutConfig {
  direction: 'row' | 'column';
  layoutMode: 'flex' | 'grid';
  columns: number; // 1 to 4
  columnRatios?: 'equal' | '30-70' | '70-30' | '25-50-25';
  gap: number;
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems: 'stretch' | 'flex-start' | 'center' | 'flex-end';
  slots?: ContainerSlotConfig[];
}

export interface BuilderElement {
  id: string;
  type: BuilderElementType;
  name: string;
  category: 'layout' | 'header' | 'title' | 'recipient' | 'content' | 'signatures' | 'badges' | 'security' | 'custom' | 'decorative';
  // Position (% of canvas: 0 - 100)
  x: number;
  y: number;
  width?: number | string;
  height?: number | string;
  zIndex: number;
  isVisible: boolean;
  isLocked?: boolean;
  // Container & Hierarchy
  containerId?: string;
  columnSlotIndex?: number;
  containerConfig?: ContainerLayoutConfig;
  // Content
  content?: string;
  subContent?: string;
  imageUrl?: string;
  iconName?: string;
  items?: string[]; // for bullet_achievements, tags, etc.
  // Typography CSS
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
  // Box Model: Margins & Paddings
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Borders & Radii CSS
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove';
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Backgrounds & Visual FX CSS
  backgroundColor?: string;
  backgroundGradient?: string;
  boxShadow?: string;
  backdropBlur?: number;
  opacity?: number;
  rotation?: number;
  meta?: Record<string, any>;
}

export interface LibraryAsset {
  id: string;
  name: string;
  category: 'crests' | 'seals' | 'stamps' | 'signatures' | 'textures' | 'icons' | 'custom';
  type: 'image' | 'svg' | 'icon';
  url?: string;
  svgContent?: string;
  iconName?: string;
  description?: string;
  tags: string[];
}

export interface CanvasSettings {
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  backgroundColor: string;
  borderStyle: CertificateBorderStyle;
  borderColor: string;
  accentColor: string;
  primaryColor: string;
  textColor: string;
  backgroundImage?: string;
  backgroundImageUrl?: string;
  showWatermark: boolean;
  watermarkOpacity: number;
}

export interface SavedCertificateTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  isCustom: boolean;
  thumbnailBadge?: string;
  settings: CanvasSettings;
  elements: BuilderElement[];
}

