import { BuilderElement, BuilderElementType, CanvasSettings } from './types';
import {
  Award,
  Crown,
  Sparkles,
  Type,
  AlignLeft,
  Calendar,
  PenTool,
  QrCode,
  Shield,
  Star,
  CheckCircle2,
  FileBadge,
  Stamp,
  Image as ImageIcon,
  Building2,
  User,
  Quote,
  ListOrdered,
  Tag,
  Hash,
  Barcode,
  Lock,
  Layers,
  Sparkle,
  Compass,
  Check,
  LayoutGrid,
  Columns
} from 'lucide-react';

export interface ElementCatalogItem {
  type: BuilderElementType;
  name: string;
  category: 'Structural & Grid Containers' | 'Header & Brand' | 'Titles & Awards' | 'Recipient' | 'Citations & Content' | 'Signatures' | 'Seals & Medals' | 'Security & Codes' | 'Decorative';
  categoryKey: string;
  description: string;
  icon: any;
  defaultContent?: string;
  defaultSubContent?: string;
}

export const ELEMENT_CATALOG: ElementCatalogItem[] = [
  // 0. Structural & Grid Containers (Elementor Architecture)
  {
    type: 'container_grid',
    name: 'Flexbox Container / Grid Row',
    category: 'Structural & Grid Containers',
    categoryKey: 'layout',
    description: 'Certificate flexbox container for organizing elements into rows, columns, and auto-distributed grids',
    icon: LayoutGrid
  },

  // 1. Header & Brand
  {
    type: 'hotel_header',
    name: 'Hotel Brand Header',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Imperial luxury header with hotel crest, name and 5-star subtitle',
    icon: Crown
  },
  {
    type: 'hotel_logo',
    name: 'Standalone Hotel Logo',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Independent hotel emblem or custom uploaded brand insignia',
    icon: Building2
  },
  {
    type: 'hotel_crest_embossed',
    name: '3D Gold Warwick Crest',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Embossed metallic gold imperial crest with heraldic filigree',
    icon: Crown
  },
  {
    type: 'five_stars',
    name: '5-Star Hospitality Rating',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Polished 24K gold star rating cluster',
    icon: Star
  },
  {
    type: 'hotel_subtitle',
    name: 'Hotel & Resort Subtitle',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Secondary brand line, e.g. AL BAHA • HOTELS & RESORTS',
    icon: AlignLeft
  },
  {
    type: 'department_badge',
    name: 'Department Honor Tag',
    category: 'Header & Brand',
    categoryKey: 'header',
    description: 'Gold-bordered department pill badge (e.g., HOUSEKEEPING)',
    icon: Tag
  },

  // 2. Titles & Awards
  {
    type: 'certificate_title',
    name: 'Certificate Award Title',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'Grand primary certificate headline in classic typography',
    icon: Type
  },
  {
    type: 'presentation_text',
    name: 'Presentation Subtitle',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'Awarding line: "THIS CERTIFICATE IS PROUDLY PRESENTED TO"',
    icon: AlignLeft
  },
  {
    type: 'award_subtitle',
    name: 'Honorary Distinction Subtitle',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'Supplementary recognition tier, e.g. "For Distinguished Service"',
    icon: Sparkles
  },
  {
    type: 'arabic_bismillah',
    name: 'Bismillah Calligraphy',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ sacred calligraphic header',
    icon: Sparkle
  },
  {
    type: 'honorary_ribbon_banner',
    name: 'Royal Ribbon Banner',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'Curved gold banner band for awards and milestones',
    icon: FileBadge
  },
  {
    type: 'custom_heading',
    name: 'Custom Heading Text',
    category: 'Titles & Awards',
    categoryKey: 'title',
    description: 'Freeform stylized heading in any chosen font',
    icon: Type
  },

  // 3. Recipient & Personalization
  {
    type: 'recipient_name',
    name: 'Recipient Name',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Featured recipient name with elegant script/serif typography',
    icon: User
  },
  {
    type: 'recipient_arabic_name',
    name: 'Arabic Recipient Name',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Bilingual recipient name in Arabic Naskh/Thuluth font',
    icon: User
  },
  {
    type: 'recipient_meta',
    name: 'Role & Department Line',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Recipient title, department and award period with gold bullets',
    icon: AlignLeft
  },
  {
    type: 'recipient_photo',
    name: 'Staff Photo Frame',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Circular portrait badge with 24K gold foil trim',
    icon: ImageIcon
  },
  {
    type: 'recipient_badge_id',
    name: 'Staff Badge & Employee ID',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Official corporate employee ID chip, e.g. EMP #WH-8042',
    icon: Hash
  },
  {
    type: 'service_duration',
    name: 'Service Duration Tag',
    category: 'Recipient',
    categoryKey: 'recipient',
    description: 'Years of service milestone pill (e.g. "5 Years of Dedicated Service")',
    icon: Award
  },

  // 4. Citations & Content
  {
    type: 'citation',
    name: 'Commendation Citation',
    category: 'Citations & Content',
    categoryKey: 'content',
    description: 'Formal appreciation statement & tribute paragraph',
    icon: AlignLeft
  },
  {
    type: 'bullet_achievements',
    name: 'Key Achievements List',
    category: 'Citations & Content',
    categoryKey: 'content',
    description: '3 highlighted accomplishment points with gold checkmarks',
    icon: ListOrdered
  },
  {
    type: 'quote_box',
    name: 'General Manager Quote',
    category: 'Citations & Content',
    categoryKey: 'content',
    description: 'Executive leadership inspirational quote in serif blockquote',
    icon: Quote
  },
  {
    type: 'core_values_tag',
    name: 'Core Values Badges',
    category: 'Citations & Content',
    categoryKey: 'content',
    description: 'Hospitality pillars: Excellence • Integrity • Passion',
    icon: Tag
  },
  {
    type: 'custom_text',
    name: 'Paragraph Text Block',
    category: 'Citations & Content',
    categoryKey: 'content',
    description: 'Freeform customizable body copy or terms',
    icon: AlignLeft
  },

  // 5. Signatures & Endorsements
  {
    type: 'signatory_left',
    name: 'Signatory 1 (Left / HOD)',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'Department Head / Supervisor signature block',
    icon: PenTool
  },
  {
    type: 'signatory_right',
    name: 'Signatory 2 (Right / GM)',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'General Manager / Managing Director endorsement block',
    icon: PenTool
  },
  {
    type: 'signatory_center',
    name: 'Signatory 3 (Center / HR)',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'HR Director or Operations Director signature box',
    icon: PenTool
  },
  {
    type: 'signatory_witness',
    name: 'Signatory 4 (Security/Witness)',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'Loss Prevention or Safety Officer signature verification',
    icon: PenTool
  },
  {
    type: 'digital_stamp',
    name: 'Official Stamp Seal',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'Red or gold official circular rubber approved stamp',
    icon: Stamp
  },
  {
    type: 'signature_date',
    name: 'Date & Location Stamp',
    category: 'Signatures',
    categoryKey: 'signatures',
    description: 'Presentation date and hotel venue location',
    icon: Calendar
  },

  // 6. Seals & Medals
  {
    type: 'badge_seal',
    name: 'Rosette Ribbon Medal',
    category: 'Seals & Medals',
    categoryKey: 'badges',
    description: 'Official satin pleated rosette with ribbon tails',
    icon: Award
  },
  {
    type: 'gold_foil_seal',
    name: '24K Gold Foil Seal',
    category: 'Seals & Medals',
    categoryKey: 'badges',
    description: 'Serrated 24K embossed gold medallion seal',
    icon: Award
  },
  {
    type: 'laurel_crest',
    name: 'Imperial Laurel Wreath',
    category: 'Seals & Medals',
    categoryKey: 'badges',
    description: 'Classical Roman laurel wreath of excellence',
    icon: Award
  },
  {
    type: 'star_burst_medal',
    name: 'Diamond Starburst Medal',
    category: 'Seals & Medals',
    categoryKey: 'badges',
    description: 'Faceted radiant starburst honor medal',
    icon: Star
  },
  {
    type: 'shield_medal',
    name: 'Royal Heraldic Shield',
    category: 'Seals & Medals',
    categoryKey: 'badges',
    description: 'Warwick coat-of-arms shield of valor',
    icon: Shield
  },

  // 7. Security & Codes
  {
    type: 'qr_code',
    name: 'Cryptographic QR Code',
    category: 'Security & Codes',
    categoryKey: 'security',
    description: 'Live QR link to digital verification registry',
    icon: QrCode
  },
  {
    type: 'barcode_strip',
    name: 'Security Barcode 128',
    category: 'Security & Codes',
    categoryKey: 'security',
    description: 'High-density tracking barcode with human-readable code',
    icon: Barcode
  },
  {
    type: 'cert_number',
    name: 'Serial Number Holo Tag',
    category: 'Security & Codes',
    categoryKey: 'security',
    description: 'Unique holographic certificate registry number',
    icon: Hash
  },
  {
    type: 'watermark_text',
    name: 'Security Watermark Stamp',
    category: 'Security & Codes',
    categoryKey: 'security',
    description: 'Diagonal translucent "OFFICIAL • AUTHENTIC" security mark',
    icon: Shield
  },
  {
    type: 'security_microtext',
    name: 'Guilloche Microline',
    category: 'Security & Codes',
    categoryKey: 'security',
    description: 'Anti-counterfeiting microtext pattern rule',
    icon: Lock
  },

  // 8. Decorative
  {
    type: 'divider_flourish',
    name: 'Victorian Gold Filigree',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'Intricate 24K gold ornamental divider flourish',
    icon: Sparkles
  },
  {
    type: 'corner_accents',
    name: 'Four Corner Flourishes',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'Symmetric baroque corner filigrees for framing',
    icon: Sparkle
  },
  {
    type: 'gold_chain_divider',
    name: 'Gold Bead Chain Line',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'Subtle beaded gold divider separator',
    icon: Sparkles
  },
  {
    type: 'geometric_frame_accent',
    name: 'Art Deco Diamond Accent',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'Geometric 1920s luxury diamond motif',
    icon: Sparkle
  },
  {
    type: 'custom_image',
    name: 'Custom Image / Badge',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'Upload your own partner emblem, stamp, or sponsor logo',
    icon: ImageIcon
  },
  {
    type: 'asset_icon',
    name: 'Vector Symbol Icon',
    category: 'Decorative',
    categoryKey: 'decorative',
    description: 'High-resolution vector honor symbol from the centralized asset library',
    icon: Sparkles
  }
];

export function createNewElement(
  type: BuilderElementType,
  currentElements: BuilderElement[],
  settings: CanvasSettings
): BuilderElement {
  const nextZ = Math.max(10, ...currentElements.map((e) => e.zIndex || 10)) + 1;
  const id = `${type}_${Date.now()}`;
  const catalogItem = ELEMENT_CATALOG.find((item) => item.type === type);
  const name = catalogItem?.name || type;

  // Base element defaults
  const base: BuilderElement = {
    id,
    type,
    name,
    category: (catalogItem?.categoryKey as any) || 'custom',
    x: 50,
    y: 50,
    zIndex: nextZ,
    isVisible: true,
    isLocked: false,
    textColor: settings.primaryColor
  };

  switch (type) {
    case 'hotel_crest_embossed':
      return {
        ...base,
        y: 10,
        content: 'EXCELLENCE',
        meta: { crestStyle: 'royal_gold', size: 54 }
      };

    case 'five_stars':
      return {
        ...base,
        y: 20,
        fontSize: 16,
        textColor: settings.accentColor
      };

    case 'hotel_subtitle':
      return {
        ...base,
        y: 18,
        content: 'OFFICIAL RECOGNITION',
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        fontSize: 11,
        letterSpacing: 4,
        fontWeight: 700,
        textColor: settings.accentColor
      };

    case 'hotel_header':
      return {
        ...base,
        y: 12,
        content: 'ORGANIZATION NAME',
        subContent: 'OFFICIAL DISTINCTION',
        fontSize: 24,
        letterSpacing: 4,
        fontWeight: 800,
        textColor: settings.primaryColor,
        meta: { showLogo: false, showStars: false }
      };

    case 'recipient_name':
      return {
        ...base,
        y: 42,
        content: '{{staff_name}}',
        fontSize: 38,
        fontWeight: 800,
        fontStyle: 'italic',
        textColor: settings.primaryColor
      };

    case 'citation':
      return {
        ...base,
        y: 63,
        width: '78%',
        content: '{{citation_paragraph}}',
        fontSize: 14,
        fontStyle: 'italic',
        textColor: settings.textColor,
        lineHeight: 1.6
      };

    case 'recipient_meta':
      return {
        ...base,
        y: 50,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 12.5,
        fontWeight: 700,
        textColor: settings.primaryColor
      };

    case 'department_badge':
      return {
        ...base,
        y: 49,
        content: '{{staff_department}}',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 2,
        textColor: settings.accentColor,
        borderColor: settings.accentColor,
        borderWidth: 1,
        borderRadius: 20,
        padding: 6
      };

    case 'award_subtitle':
      return {
        ...base,
        y: 31,
        content: 'FOR DISTINGUISHED PROFESSIONAL EXCELLENCE',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 3,
        textColor: settings.accentColor,
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif"
      };

    case 'arabic_bismillah':
      return {
        ...base,
        y: 8,
        content: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        fontSize: 18,
        fontFamily: "'Amiri', 'Traditional Arabic', serif",
        textColor: settings.accentColor
      };

    case 'honorary_ribbon_banner':
      return {
        ...base,
        y: 26,
        content: 'HONORIS CAUSA • SUMMA CUM LAUDE',
        fontSize: 11,
        textColor: '#ffffff',
        backgroundColor: settings.primaryColor,
        borderColor: settings.accentColor,
        borderWidth: 2,
        borderRadius: 4
      };

    case 'recipient_arabic_name':
      return {
        ...base,
        y: 49,
        content: 'محمد أبو سعيد رضاي',
        fontSize: 28,
        fontFamily: "'Amiri', 'Traditional Arabic', serif",
        textColor: settings.primaryColor
      };

    case 'recipient_photo':
      return {
        ...base,
        x: 16,
        y: 44,
        imageUrl: '',
        meta: { frameStyle: 'gold_rim', size: 84 }
      };

    case 'recipient_badge_id':
      return {
        ...base,
        y: 56,
        content: 'EMPLOYEE ID: #WH-8042',
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 2,
        fontWeight: 700,
        textColor: settings.textColor,
        opacity: 0.8
      };

    case 'service_duration':
      return {
        ...base,
        x: 50,
        y: 57,
        content: '5 YEARS OF VALUED SERVICE',
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 2,
        textColor: '#ffffff',
        backgroundColor: settings.primaryColor,
        padding: 5,
        borderRadius: 20
      };

    case 'bullet_achievements':
      return {
        ...base,
        y: 72,
        width: '75%',
        items: [
          'Maintained a 99.4% cleanliness inspection rating across 140 luxury guest suites',
          'Trained 8 new hospitality room attendants to Forbes 5-Star luxury standards',
          'Zero safety and loss incidents recorded over consecutive quarters'
        ],
        fontSize: 12,
        lineHeight: 1.6,
        textColor: settings.textColor
      };

    case 'quote_box':
      return {
        ...base,
        y: 70,
        width: '70%',
        content: 'Dedication to excellence is not an act, but a habit of continuous distinction.',
        subContent: '— Executive Leadership',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: 'italic',
        fontSize: 13,
        textColor: settings.primaryColor
      };

    case 'core_values_tag':
      return {
        ...base,
        y: 76,
        items: ['INTEGRITY', 'EXCELLENCE', 'DEDICATION', 'DEVOTION'],
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        textColor: settings.accentColor
      };

    case 'signatory_witness':
      return {
        ...base,
        x: 50,
        y: 84,
        width: 190,
        content: 'Authorized Witness',
        subContent: 'Executive Board',
        fontSize: 12,
        fontWeight: 700,
        textColor: settings.primaryColor
      };

    case 'digital_stamp':
      return {
        ...base,
        x: 82,
        y: 76,
        content: 'OFFICIALLY APPROVED',
        subContent: 'DISTINGUISHED MERIT',
        meta: { stampColor: '#b91c1c', rotation: -12 }
      };

    case 'signature_date':
      return {
        ...base,
        x: 50,
        y: 93,
        content: '{{issue_date}}',
        subContent: 'Official Record',
        fontSize: 11,
        textColor: settings.textColor
      };

    case 'gold_foil_seal':
      return {
        ...base,
        x: 50,
        y: 82,
        content: 'OFFICIAL 24K GOLD SEAL',
        subContent: 'SEAL OF EXCELLENCE',
        meta: { style: 'gold_foil' }
      };

    case 'laurel_crest':
      return {
        ...base,
        x: 50,
        y: 82,
        content: 'DISTINGUISHED HONOR',
        subContent: 'MERIT & DEDICATION',
        meta: { style: 'roman_laurel' }
      };

    case 'star_burst_medal':
      return {
        ...base,
        x: 50,
        y: 82,
        content: 'STAR OF MERIT',
        subContent: '2026',
        meta: { style: 'star_burst' }
      };

    case 'shield_medal':
      return {
        ...base,
        x: 50,
        y: 82,
        content: 'SHIELD OF VALOR',
        subContent: 'WARWICK',
        meta: { style: 'heraldic_shield' }
      };

    case 'barcode_strip':
      return {
        ...base,
        x: 90,
        y: 94,
        content: 'WARWICK-8042-2026',
        fontSize: 9,
        textColor: settings.primaryColor
      };

    case 'watermark_text':
      return {
        ...base,
        x: 50,
        y: 50,
        zIndex: 5,
        content: 'WARWICK OFFICIAL VERIFIED',
        fontSize: 48,
        fontWeight: 900,
        letterSpacing: 8,
        opacity: 0.06,
        rotation: -30,
        textColor: settings.primaryColor
      };

    case 'security_microtext':
      return {
        ...base,
        x: 50,
        y: 97,
        content: 'WARWICK LUXURY HOTELS AND RESORTS • OFFICIAL ISSUANCE • VERIFIED RECORD • SECURE DOCUMENT •',
        fontSize: 7,
        letterSpacing: 2,
        textColor: settings.accentColor,
        opacity: 0.6
      };

    case 'corner_accents':
      return {
        ...base,
        x: 50,
        y: 50,
        zIndex: 6,
        meta: { style: 'baroque_gold' }
      };

    case 'gold_chain_divider':
      return {
        ...base,
        y: 38,
        width: '60%',
        textColor: settings.accentColor
      };

    case 'geometric_frame_accent':
      return {
        ...base,
        y: 35,
        textColor: settings.accentColor
      };

    case 'custom_image':
      return {
        ...base,
        x: 50,
        y: 50,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300',
        width: 120,
        height: 120
      };

    case 'asset_icon':
      return {
        ...base,
        x: 50,
        y: 50,
        iconName: 'Award',
        fontSize: 36,
        textColor: settings.accentColor
      };

    case 'container_grid':
      return {
        ...base,
        name: 'Flexbox Container Row',
        category: 'layout',
        x: 50,
        y: 84,
        width: '84%',
        height: 'auto',
        zIndex: 15,
        containerConfig: {
          direction: 'row',
          layoutMode: 'flex',
          columns: 2,
          columnRatios: 'equal',
          gap: 20,
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      };

    default:
      return {
        ...base,
        content: name
      };
  }
}
