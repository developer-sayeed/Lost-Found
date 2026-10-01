import React, { useState, useEffect, useRef } from 'react';
import {
  Certificate,
  CertificateColors,
  CertificateBorderStyle,
  CertificateBadgeStyle,
  CustomCertificateTemplate,
  Staff
} from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Award,
  Download,
  FileText,
  Printer,
  X,
  Plus,
  CheckCircle2,
  Sliders,
  Palette,
  Eye,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Building2,
  Shield,
  Crown,
  Sparkles,
  Upload,
  Type,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  FileCheck,
  RotateCcw,
  Check,
  PenTool,
  Save,
  Bold,
  Italic,
  Bookmark,
  Search
} from 'lucide-react';
import { AddTemplateModal } from './AddTemplateModal';
import { ColorPaletteSelector } from './ColorPaletteSelector';
import { CertificatePreviewStage } from './CertificatePreviewStage';
import { SignaturePadModal } from './SignaturePadModal';
import { RichTextControl } from './RichTextControl';
import { VisualLiveEditorStage } from './VisualLiveEditorStage';
import { DirectCertificatePrintPortal } from './DirectCertificatePrintPortal';
import { CertificatePrintPage } from './CertificatePrintPage';
import { HOTEL_STAFF_CERTIFICATE_PRESETS, CertificatePreset } from './certificatePresets';
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  printCertificate
} from './CertificateActions';

interface CertificateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCertificateSaved?: (cert: Certificate) => void;
  initialCertificate?: Certificate | null;
}

export const CertificateGeneratorModal: React.FC<CertificateGeneratorModalProps> = ({
  isOpen,
  onClose,
  onCertificateSaved,
  initialCertificate
}) => {
  const { staff, settings } = useApp();
  const { user, hasPermission } = useAuth();
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Granular Permissions
  const canSaveCertificates =
    user?.role === 'Super Admin' ||
    user?.role === 'Admin' ||
    hasPermission('certificates_save') ||
    hasPermission('certificates');

  const canPrintCertificates =
    user?.role === 'Super Admin' ||
    user?.role === 'Admin' ||
    hasPermission('certificates_print') ||
    hasPermission('certificates') ||
    hasPermission('print');

  // Direct/Preview Print State & Editor Mode
  const [editorMode, setEditorMode] = useState<'visual_editor' | 'form'>('form');
  const [directPrintCert, setDirectPrintCert] = useState<Certificate | null>(null);
  const [previewPrintCert, setPreviewPrintCert] = useState<Certificate | null>(null);
  const isPreviewMode = settings.certificatePrintBehavior === 'preview' || settings.certificateEnablePrintPreview === true;

  // Template Search & Category Filter State
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'all' | 'presets' | 'classic' | 'custom'>('all');
  const [templateSearch, setTemplateSearch] = useState<string>('');

  // Always reset to form mode with template options when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditorMode('form');
      setPreviewTab('form');
    }
  }, [isOpen]);

  // Template state (6 Five-Star Standard templates + custom)
  const [template, setTemplate] = useState<string>(
    initialCertificate?.template || 'employee_of_month'
  );
  const [customTemplates, setCustomTemplates] = useState<CustomCertificateTemplate[]>([]);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<CustomCertificateTemplate | null>(null);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);

  // Custom Colors state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState<CertificateColors | undefined>(
    initialCertificate?.customColors
  );

  // Custom Template Fine-tuning state
  const [customBackgroundImage, setCustomBackgroundImage] = useState<string>(
    initialCertificate?.customBackgroundImage || ''
  );
  const [textMode, setTextMode] = useState<'fill_in_blanks' | 'full'>(
    initialCertificate?.textMode || 'fill_in_blanks'
  );
  const [nameOffsetY, setNameOffsetY] = useState<number>(
    initialCertificate?.nameOffsetY || 46
  );
  const [nameFontSize, setNameFontSize] = useState<number>(
    initialCertificate?.nameFontSize || 36
  );

  // -------------------------------------------------------------
  // Hotel Branding & Logo Customization State
  // -------------------------------------------------------------
  const [hotelName, setHotelName] = useState<string>(
    initialCertificate?.hotelName !== undefined
      ? initialCertificate.hotelName
      : (settings.certificateHotelName || settings.hotelName || 'WARWICK')
  );
  const [hotelSubtitle, setHotelSubtitle] = useState<string>(
    initialCertificate?.hotelSubtitle !== undefined
      ? initialCertificate.hotelSubtitle
      : (settings.certificateHotelSubtitle || settings.hotelSubTitle || 'HOTEL AL BAHA • HOTELS & RESORTS')
  );
  const [hotelLogoUrl, setHotelLogoUrl] = useState<string>(
    initialCertificate?.hotelLogoUrl || ''
  );
  const [hotelLogoPreset, setHotelLogoPreset] = useState<
    'warwick_crest' | 'grand_star' | 'royal_crown' | 'luxury_monogram' | 'none'
  >(initialCertificate?.hotelLogoPreset || 'warwick_crest');
  const [hotelLogoSize, setHotelLogoSize] = useState<number>(
    initialCertificate?.hotelLogoSize || 50
  );
  const [showHotelLogo, setShowHotelLogo] = useState<boolean>(
    initialCertificate?.showHotelLogo !== false
  );
  const [showHotelBranding, setShowHotelBranding] = useState<boolean>(
    initialCertificate?.showHotelBranding !== false
  );
  const [showFiveStars, setShowFiveStars] = useState<boolean>(
    initialCertificate?.showFiveStars !== false
  );
  const [hotelNameFontSize, setHotelNameFontSize] = useState<number>(
    initialCertificate?.hotelNameFontSize || 28
  );
  const [hotelNameIsBold, setHotelNameIsBold] = useState<boolean>(
    initialCertificate?.hotelNameIsBold !== false
  );
  const [hotelNameIsItalic, setHotelNameIsItalic] = useState<boolean>(
    Boolean(initialCertificate?.hotelNameIsItalic)
  );

  // -------------------------------------------------------------
  // Typography, Titles & Presentation State
  // -------------------------------------------------------------
  const getDefaultTitle = (tpl: string) => {
    switch (tpl) {
      case 'appreciation':
      case 'star_appreciation':
        return 'CERTIFICATE OF APPRECIATION';
      case 'star_leadership':
        return 'LEADERSHIP & SUPERVISORY EXCELLENCE';
      case 'star_hospitality':
        return '5-STAR HOSPITALITY HERO AWARD';
      case 'star_milestone':
        return 'LONG SERVICE & LOYALTY MILESTONE';
      case 'star_mastery':
        return 'CERTIFIED HOSPITALITY & SKILL MASTERY';
      case 'employee_of_month':
      case 'star_eom':
      default:
        return 'EMPLOYEE OF THE MONTH';
    }
  };

  const [title, setTitle] = useState<string>(
    initialCertificate?.title || getDefaultTitle(initialCertificate?.template || 'employee_of_month')
  );

  const getDefaultPresentation = (tpl: string) => {
    switch (tpl) {
      case 'star_leadership':
        return 'THIS PRESTIGIOUS ACCREDITATION IS CONFERRED UPON';
      case 'star_hospitality':
        return 'PRESENTED IN RECOGNITION OF EXEMPLARY SERVICE TO';
      case 'star_milestone':
        return 'WITH DEEP GRATITUDE & HONOR CONFERRED UPON';
      case 'star_mastery':
        return 'THIS FORMAL ACCREDITATION CERTIFIES THAT';
      default:
        return 'THIS CERTIFICATE IS PROUDLY PRESENTED TO';
    }
  };

  const [presentationText, setPresentationText] = useState<string>(
    initialCertificate?.presentationText || getDefaultPresentation(initialCertificate?.template || 'employee_of_month')
  );

  const [fontFamilyChoice, setFontFamilyChoice] = useState<'playfair' | 'cinzel' | 'sans' | 'serif'>(
    initialCertificate?.fontFamilyChoice || 'serif'
  );
  const [fontFamily, setFontFamily] = useState<string>(
    initialCertificate?.fontFamily || 'serif'
  );
  const [borderStyle, setBorderStyle] = useState<CertificateBorderStyle>(
    initialCertificate?.borderStyle || 'royal_frame'
  );
  const [citationFontSize, setCitationFontSize] = useState<number>(
    initialCertificate?.citationFontSize || 14
  );
  const [citationAlignment, setCitationAlignment] = useState<'left' | 'center' | 'right' | 'justify'>(
    initialCertificate?.citationAlignment || 'center'
  );

  // -------------------------------------------------------------
  // Recipient and certificate content state
  // -------------------------------------------------------------
  const [recipientName, setRecipientName] = useState<string>(
    initialCertificate?.recipientName || 'MD ABU SAYEED RIDAY'
  );
  const [recipientNameIsBold, setRecipientNameIsBold] = useState<boolean>(
    initialCertificate?.recipientNameIsBold !== false
  );
  const [recipientNameIsItalic, setRecipientNameIsItalic] = useState<boolean>(
    initialCertificate?.recipientNameIsItalic !== false
  );
  const [recipientStaffId, setRecipientStaffId] = useState<string>(
    initialCertificate?.recipientStaffId || ''
  );
  const [recipientPosition, setRecipientPosition] = useState<string>(
    initialCertificate?.recipientPosition || 'Housekeeping Supervisor'
  );
  const [recipientDepartment, setRecipientDepartment] = useState<string>(
    initialCertificate?.recipientDepartment || 'Housekeeping'
  );
  const [awardPeriod, setAwardPeriod] = useState<string>(
    initialCertificate?.awardPeriod || 'June 2026'
  );
  const [awardDate, setAwardDate] = useState<string>(
    initialCertificate?.awardDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [location, setLocation] = useState<string>(
    initialCertificate?.location || 'Al Baha, Saudi Arabia'
  );

  const getDefaultCitation = (tpl: string, name: string, pos: string) => {
    switch (tpl) {
      case 'appreciation':
      case 'star_appreciation':
        return `This certificate is proudly presented to ${name || 'MD ABU SAYEED RIDAY'}, ${pos || 'Housekeeping Supervisor'}, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.`;
      case 'star_leadership':
        return 'In distinguished recognition of exemplary leadership, operational mastery, and uncompromised dedication to hospitality excellence. Your visionary guidance, mentorship, and high standards have inspired team performance and elevated hotel guest satisfaction.';
      case 'star_hospitality':
        return 'For exceptional warmth, genuine courtesy, and unwavering commitment to crafting unforgettable 5-star guest journeys. Your attention to detail, heartfelt care, and superior guest satisfaction have made an enduring positive impression upon visitors to Warwick Hotel Baha.';
      case 'star_milestone':
        return 'In tribute and profound appreciation for your unwavering fidelity, integrity, and dedicated years of distinguished service. Your loyal commitment, loyalty, and invaluable experience have fortified our hotel culture and stand as a beacon of pride for Warwick Hotels & Resorts.';
      case 'star_mastery':
        return 'Having successfully demonstrated exemplary competency, high professional rigor, and comprehensive mastery in hotel operational procedures, hygiene safety, and international 5-star hospitality standards. In witness whereof, this professional credential is authenticated.';
      case 'employee_of_month':
      case 'star_eom':
      default:
        return 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!';
    }
  };

  const [citationText, setCitationText] = useState<string>(
    initialCertificate?.citationText || getDefaultCitation(initialCertificate?.template || 'employee_of_month', initialCertificate?.recipientName || 'MD ABU SAYEED RIDAY', initialCertificate?.recipientPosition || 'Housekeeping Supervisor')
  );
  const [citationIsBold, setCitationIsBold] = useState<boolean>(
    Boolean(initialCertificate?.citationIsBold)
  );
  const [citationIsItalic, setCitationIsItalic] = useState<boolean>(
    Boolean(initialCertificate?.citationIsItalic)
  );

  // -------------------------------------------------------------
  // Signatories state (Up to 3 signatories supported)
  // -------------------------------------------------------------
  const [signatory1Title, setSignatory1Title] = useState<string>(
    initialCertificate?.signatory1Title || (initialCertificate?.template === 'appreciation' ? 'Housekeeping Manager' : 'Housekeeping')
  );
  const [signatory1Name, setSignatory1Name] = useState<string>(
    initialCertificate?.signatory1Name || ''
  );
  const [signatory1Signature, setSignatory1Signature] = useState<string>(
    initialCertificate?.signatory1Signature || ''
  );

  const [signatory2Title, setSignatory2Title] = useState<string>(
    initialCertificate?.signatory2Title || 'General Manager'
  );
  const [signatory2Name, setSignatory2Name] = useState<string>(
    initialCertificate?.signatory2Name || ''
  );
  const [signatory2Signature, setSignatory2Signature] = useState<string>(
    initialCertificate?.signatory2Signature || ''
  );

  const [showSignatory3, setShowSignatory3] = useState<boolean>(
    Boolean(initialCertificate?.showSignatory3 || initialCertificate?.template === 'star_leadership')
  );
  const [signatory3Title, setSignatory3Title] = useState<string>(
    initialCertificate?.signatory3Title || 'Director of Operations'
  );
  const [signatory3Name, setSignatory3Name] = useState<string>(
    initialCertificate?.signatory3Name || ''
  );
  const [signatory3Signature, setSignatory3Signature] = useState<string>(
    initialCertificate?.signatory3Signature || ''
  );

  // Digital Signature Pad modal state
  const [signaturePadOpen, setSignaturePadOpen] = useState<boolean>(false);
  const [activeSignatoryTarget, setActiveSignatoryTarget] = useState<1 | 2 | 3 | null>(null);

  // -------------------------------------------------------------
  // Seals, Medallions & Watermark
  // -------------------------------------------------------------
  const [showBadge, setShowBadge] = useState<boolean>(
    initialCertificate?.showBadge !== false
  );
  const [badgeStyle, setBadgeStyle] = useState<CertificateBadgeStyle>(
    (initialCertificate?.badgeStyle as CertificateBadgeStyle) || 'rosette'
  );
  const [badgeText, setBadgeText] = useState<string>(
    initialCertificate?.badgeText || 'SEAL OF EXCELLENCE'
  );
  const [badgeSubtext, setBadgeSubtext] = useState<string>(
    initialCertificate?.badgeSubtext || ''
  );
  const [showWatermark, setShowWatermark] = useState<boolean>(
    initialCertificate?.showWatermark !== false
  );
  const [watermarkText, setWatermarkText] = useState<string>(
    initialCertificate?.watermarkText || 'WARWICK HOTEL AL BAHA'
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(
    initialCertificate?.watermarkOpacity ?? 0.08
  );

  // Certificate Body Background & Frame Customization Studio
  const [frameColor, setFrameColor] = useState<string>(
    initialCertificate?.frameColor || ''
  );
  const [frameWidth, setFrameWidth] = useState<number>(
    initialCertificate?.frameWidth ?? 8
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    initialCertificate?.backgroundColor || ''
  );
  const [backgroundGradient, setBackgroundGradient] = useState<string>(
    initialCertificate?.backgroundGradient || ''
  );
  const [showFrameCustomizer, setShowFrameCustomizer] = useState<boolean>(true);
  const bgTextureInputRef = useRef<HTMLInputElement>(null);
  const initialCertLoadedRef = useRef<string | null>(null);

  const [notes, setNotes] = useState<string>(initialCertificate?.notes || '');
  const [layoutCoordinates, setLayoutCoordinates] = useState<Record<string, { x: number; y: number }>>(
    initialCertificate?.layoutCoordinates || {}
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('preview');

  // Active accordion section for organized editing
  const [activeSection, setActiveSection] = useState<
    'template' | 'hotel_branding' | 'typography' | 'recipient' | 'dates' | 'citation' | 'signatories' | 'seals' | 'colors'
  >('template');

  // Load custom templates on open
  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates();
    }
  }, [isOpen]);

  // Synchronize when initialCertificate changes (e.g. user clicks Edit on a certificate)
  useEffect(() => {
    if (!isOpen) {
      initialCertLoadedRef.current = null;
      return;
    }

    const currentKey = initialCertificate ? (initialCertificate.id || 'editing-cert') : 'new-cert';
    if (initialCertLoadedRef.current === currentKey) {
      return; // Already initialized for this modal session, do not overwrite user inputs!
    }
    initialCertLoadedRef.current = currentKey;

    if (initialCertificate) {
      setTemplate(initialCertificate.template || 'employee_of_month');
      setTitle(initialCertificate.title || 'CERTIFICATE OF EXCELLENCE');
      setPresentationText(initialCertificate.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO');
      setRecipientName(initialCertificate.recipientName || '');
      setRecipientStaffId(initialCertificate.recipientStaffId || '');
      setRecipientPosition(initialCertificate.recipientPosition || '');
      setRecipientDepartment(initialCertificate.recipientDepartment || '');
      setAwardPeriod(initialCertificate.awardPeriod || '');
      setAwardDate(initialCertificate.awardDate || new Date().toISOString().split('T')[0]);
      setLocation(initialCertificate.location || 'Al Baha, Saudi Arabia');
      setCitationText(initialCertificate.citationText || '');
      setCitationAlignment(initialCertificate.citationAlignment || 'center');
      setCitationFontSize(initialCertificate.citationFontSize || 13.5);
      setNameFontSize(initialCertificate.nameFontSize || 36);
      setHotelName(initialCertificate.hotelName !== undefined ? initialCertificate.hotelName : (settings.certificateHotelName || settings.hotelName || ''));
      setHotelSubtitle(initialCertificate.hotelSubtitle !== undefined ? initialCertificate.hotelSubtitle : (settings.certificateHotelSubtitle || settings.hotelSubTitle || ''));
      setHotelLogoUrl(initialCertificate.hotelLogoUrl || settings.certificateLogoUrl || settings.logoUrl || '');
      setHotelLogoPreset(initialCertificate.hotelLogoPreset || 'warwick_crest');
      setHotelLogoSize(initialCertificate.hotelLogoSize || 50);
      setShowHotelLogo(initialCertificate.showHotelLogo !== false);
      setShowHotelBranding(initialCertificate.showHotelBranding !== false);
      setShowFiveStars(initialCertificate.showFiveStars !== false);
      setHotelNameFontSize(initialCertificate.hotelNameFontSize || 28);
      setHotelNameIsBold(initialCertificate.hotelNameIsBold !== false);
      setHotelNameIsItalic(Boolean(initialCertificate.hotelNameIsItalic));
      setBadgeStyle((initialCertificate.badgeStyle as CertificateBadgeStyle) || 'rosette');
      setBadgeText(initialCertificate.badgeText || 'SEAL OF EXCELLENCE');
      setBadgeSubtext(initialCertificate.badgeSubtext || '');
      setShowBadge(initialCertificate.showBadge !== false);
      setShowWatermark(initialCertificate.showWatermark !== false);
      setBorderStyle(initialCertificate.borderStyle || 'royal_frame');
      setFrameColor(initialCertificate.frameColor || '');
      setFrameWidth(initialCertificate.frameWidth ?? 8);
      setBackgroundColor(initialCertificate.backgroundColor || '');
      setBackgroundGradient(initialCertificate.backgroundGradient || '');
      setWatermarkText(initialCertificate.watermarkText || 'WARWICK HOTEL AL BAHA');
      setWatermarkOpacity(initialCertificate.watermarkOpacity ?? 0.08);
      const fc = initialCertificate.fontFamilyChoice as string | undefined;
      if (fc === 'cinzel' || fc === 'Cinzel') {
        setFontFamilyChoice('cinzel');
      } else if (fc === 'sans' || fc === 'Plus Jakarta Sans') {
        setFontFamilyChoice('sans');
      } else if (fc === 'serif') {
        setFontFamilyChoice('serif');
      } else {
        setFontFamilyChoice('playfair');
      }
      setSignatory1Title(initialCertificate.signatory1Title || initialCertificate.signatoryLeftTitle || 'Human Resources Director');
      setSignatory1Name(initialCertificate.signatory1Name || initialCertificate.signatoryLeftName || '');
      setSignatory1Signature(initialCertificate.signatory1Signature || '');
      setSignatory2Title(initialCertificate.signatory2Title || initialCertificate.signatoryRightTitle || 'General Manager');
      setSignatory2Name(initialCertificate.signatory2Name || initialCertificate.signatoryRightName || '');
      setSignatory2Signature(initialCertificate.signatory2Signature || '');
      setShowSignatory3(Boolean(initialCertificate.showSignatory3 || initialCertificate.enableThirdSignatory));
      setSignatory3Title(initialCertificate.signatory3Title || initialCertificate.signatoryCenterTitle || 'Operations Director');
      setSignatory3Name(initialCertificate.signatory3Name || initialCertificate.signatoryCenterName || '');
      setSignatory3Signature(initialCertificate.signatory3Signature || '');
      setNotes(initialCertificate.notes || '');
      setCustomColors(initialCertificate.customColors || { primary: '#1e3a8a', accent: '#d97706' });
      setCustomBackgroundImage(initialCertificate.customBackgroundImage || '');
      setTextMode(initialCertificate.textMode || 'fill_in_blanks');
      setNameOffsetY(initialCertificate.nameOffsetY ?? 46);
      setLayoutCoordinates(initialCertificate.layoutCoordinates || {});
    }
  }, [initialCertificate, isOpen]);

  const loadCustomTemplates = async () => {
    try {
      const res = await api.getCertificateTemplates(user);
      if (res && res.templates) {
        setCustomTemplates(res.templates);
        if (initialCertificate?.customTemplateId) {
          const match = res.templates.find(t => t.id === initialCertificate.customTemplateId);
          if (match) setSelectedCustomTemplate(match);
        }
      }
    } catch (err) {
      console.warn('Could not load custom templates list:', err);
    }
  };

  const handleSwitchTemplate = (tplKey: string) => {
    setTemplate(tplKey);
    setSelectedCustomTemplate(null);
    setCustomBackgroundImage('');

    // Update default title, presentation, and citation when switching templates if using defaults
    setTitle(getDefaultTitle(tplKey));
    setPresentationText(getDefaultPresentation(tplKey));
    setCitationText(getDefaultCitation(tplKey, recipientName, recipientPosition));

    // Preset appropriate badge style
    if (tplKey === 'star_leadership') {
      setBadgeStyle('laurel_crest');
      setShowSignatory3(true);
      setHotelLogoPreset('grand_star');
    } else if (tplKey === 'star_hospitality') {
      setBadgeStyle('gold_seal');
      setHotelLogoPreset('royal_crown');
    } else if (tplKey === 'star_milestone') {
      setBadgeStyle('star_medallion');
      setHotelLogoPreset('luxury_monogram');
    } else if (tplKey === 'star_mastery') {
      setBadgeStyle('gold_seal');
      setHotelLogoPreset('grand_star');
    } else if (tplKey === 'appreciation') {
      setBadgeStyle('gold_seal');
      setHotelLogoPreset('warwick_crest');
    } else {
      setBadgeStyle('rosette');
      setHotelLogoPreset('warwick_crest');
    }
  };

  const handleSelectCustomTemplate = (customTpl: CustomCertificateTemplate) => {
    setSelectedCustomTemplate(customTpl);
    setTemplate(customTpl.id);
    setCustomBackgroundImage(customTpl.backgroundImageUrl || '');
    setTextMode(customTpl.textMode || 'fill_in_blanks');
    setNameOffsetY(customTpl.nameOffsetY ?? 46);
    setNameFontSize(customTpl.nameFontSize ?? 36);
    if (customTpl.defaultCitation) {
      setCitationText(customTpl.defaultCitation);
    }
    if (customTpl.customColors) {
      setCustomColors(customTpl.customColors);
    }
    toast.info(`Selected custom template: ${customTpl.name}`);
  };

  const handleSelectHotelPreset = (preset: CertificatePreset) => {
    setSelectedCustomTemplate(null);
    setTemplate(preset.id);
    setCustomBackgroundImage('');
    setTextMode('full');
    setTitle(preset.defaultTitle);
    setPresentationText(preset.defaultPresentationText);
    setCitationText(preset.defaultCitation);
    setBadgeStyle(preset.badgeStyle);
    setBadgeText(preset.badgeText);
    setBadgeSubtext(preset.badgeSubtext);
    setBorderStyle(preset.borderStyle);
    setSignatory1Title(preset.signatoryLeftTitle);
    setSignatory1Name(preset.signatoryLeftName);
    setSignatory2Title(preset.signatoryRightTitle);
    setSignatory2Name(preset.signatoryRightName);
    if (preset.signatoryCenterTitle) {
      setSignatory3Title(preset.signatoryCenterTitle);
    }
    if (preset.signatoryCenterName) {
      setSignatory3Name(preset.signatoryCenterName);
    }
    setShowSignatory3(Boolean(preset.enableThirdSignatory));
    if (preset.colors) {
      setCustomColors(preset.colors);
    }
    if (preset.fontFamily === 'Cinzel') {
      setFontFamilyChoice('cinzel');
      setFontFamily('Cinzel');
    } else if (preset.fontFamily === 'Plus Jakarta Sans') {
      setFontFamilyChoice('sans');
      setFontFamily('Plus Jakarta Sans');
    } else {
      setFontFamilyChoice('playfair');
      setFontFamily('Playfair Display');
    }
    toast.success(`Selected template: ${preset.name}`);
  };

  const handleSelectStaff = (staffId: string) => {
    setRecipientStaffId(staffId);
    if (!staffId) return;
    const s = staff.find((m) => String(m.id) === String(staffId));
    if (s) {
      setRecipientName(s.name);
      if (s.role) setRecipientPosition(s.role);
      if (s.department) setRecipientDepartment(s.department);
      setCitationText(getDefaultCitation(template, s.name, s.role || recipientPosition));
      toast.success(`Selected staff: ${s.name}`);
    }
  };

  const handleTemplateAdded = (newTemplate: CustomCertificateTemplate) => {
    setCustomTemplates(prev => [newTemplate, ...prev]);
    handleSelectCustomTemplate(newTemplate);
    toast.success(`Template "${newTemplate.name}" added and selected!`);
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteCertificateTemplate(templateId, user);
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      if (template === templateId) {
        handleSwitchTemplate('employee_of_month');
      }
      toast.info('Template removed.');
    } catch (err) {
      toast.error('Failed to remove template.');
    }
  };

  const handleResetCitation = () => {
    setCitationText(getDefaultCitation(template, recipientName, recipientPosition));
    toast.info('Citation reset to template standard.');
  };

  // Logo upload processing
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setHotelLogoUrl(result);
      setHotelLogoPreset('none'); // custom uploaded takes precedence
      setShowHotelLogo(true);
      toast.success('Hotel logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setHotelLogoUrl('');
    setHotelLogoPreset('warwick_crest');
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
    toast.info('Custom logo removed. Reverted to Warwick crest preset.');
  };

  // Saved draft management
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const DRAFT_STORAGE_KEY = 'warwick_certificate_draft';

  useEffect(() => {
    if (isOpen && !initialCertificate) {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.recipientName || parsed.citationText)) {
            setHasSavedDraft(true);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen, initialCertificate]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        ...certData,
        savedAt: new Date().toISOString()
      }));
      toast.success('Certificate draft saved! You can resume it anytime.');
      setHasSavedDraft(true);
    } catch (e) {
      toast.error('Failed to save draft.');
    }
  };

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.template) setTemplate(draft.template);
      if (draft.recipientName) setRecipientName(draft.recipientName);
      if (draft.recipientPosition) setRecipientPosition(draft.recipientPosition);
      if (draft.recipientDepartment) setRecipientDepartment(draft.recipientDepartment);
      if (draft.awardPeriod) setAwardPeriod(draft.awardPeriod);
      if (draft.awardDate) setAwardDate(draft.awardDate);
      if (draft.location) setLocation(draft.location);
      if (draft.title) setTitle(draft.title);
      if (draft.presentationText) setPresentationText(draft.presentationText);
      if (draft.citationText) setCitationText(draft.citationText);
      if (draft.citationFontSize) setCitationFontSize(draft.citationFontSize);
      if (draft.citationAlignment) setCitationAlignment(draft.citationAlignment);
      if (draft.hotelName) setHotelName(draft.hotelName);
      if (draft.hotelSubtitle) setHotelSubtitle(draft.hotelSubtitle);
      if (draft.hotelLogoUrl !== undefined) setHotelLogoUrl(draft.hotelLogoUrl);
      if (draft.hotelLogoPreset) setHotelLogoPreset(draft.hotelLogoPreset);
      if (draft.hotelLogoSize) setHotelLogoSize(draft.hotelLogoSize);
      if (draft.hotelNameFontSize) setHotelNameFontSize(draft.hotelNameFontSize);
      if (draft.hotelNameIsBold !== undefined) setHotelNameIsBold(draft.hotelNameIsBold);
      if (draft.hotelNameIsItalic !== undefined) setHotelNameIsItalic(draft.hotelNameIsItalic);
      if (draft.recipientNameIsBold !== undefined) setRecipientNameIsBold(draft.recipientNameIsBold);
      if (draft.recipientNameIsItalic !== undefined) setRecipientNameIsItalic(draft.recipientNameIsItalic);
      if (draft.citationIsBold !== undefined) setCitationIsBold(draft.citationIsBold);
      if (draft.citationIsItalic !== undefined) setCitationIsItalic(draft.citationIsItalic);
      if (draft.signatory1Title) setSignatory1Title(draft.signatory1Title);
      if (draft.signatory1Name) setSignatory1Name(draft.signatory1Name);
      if (draft.signatory1Signature) setSignatory1Signature(draft.signatory1Signature);
      if (draft.signatory2Title) setSignatory2Title(draft.signatory2Title);
      if (draft.signatory2Name) setSignatory2Name(draft.signatory2Name);
      if (draft.signatory2Signature) setSignatory2Signature(draft.signatory2Signature);
      if (draft.signatory3Title) setSignatory3Title(draft.signatory3Title);
      if (draft.signatory3Name) setSignatory3Name(draft.signatory3Name);
      if (draft.signatory3Signature) setSignatory3Signature(draft.signatory3Signature);
      if (draft.showSignatory3 !== undefined) setShowSignatory3(draft.showSignatory3);
      if (draft.customColors) setCustomColors(draft.customColors);
      setHasSavedDraft(false);
      toast.success('Certificate draft restored!');
    } catch (e) {
      toast.error('Failed to restore draft.');
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasSavedDraft(false);
    toast.info('Saved draft removed.');
  };

  const openSignaturePad = (target: 1 | 2 | 3) => {
    setActiveSignatoryTarget(target);
    setSignaturePadOpen(true);
  };

  const handleSaveSignature = (sigDataUrl: string) => {
    if (activeSignatoryTarget === 1) {
      setSignatory1Signature(sigDataUrl);
    } else if (activeSignatoryTarget === 2) {
      setSignatory2Signature(sigDataUrl);
    } else if (activeSignatoryTarget === 3) {
      setSignatory3Signature(sigDataUrl);
    }
    setSignaturePadOpen(false);
    toast.success('Digital signature attached to certificate!');
  };

  // Compile full cert payload for live rendering & saving
  const certData: Partial<Certificate> = {
    id: initialCertificate?.id,
    certificateNumber: initialCertificate?.certificateNumber,
    template,
    customTemplateId: selectedCustomTemplate?.id,
    customBackgroundImage,
    customColors,
    textMode,
    nameOffsetY,
    nameFontSize,
    title,
    presentationText,
    fontFamilyChoice,
    fontFamily,
    borderStyle,
    citationFontSize,
    citationAlignment,
    hotelName: showHotelBranding ? hotelName : '',
    hotelSubtitle: showHotelBranding ? hotelSubtitle : '',
    hotelLogoUrl,
    hotelLogoPreset,
    hotelLogoSize,
    showHotelLogo,
    showHotelBranding,
    showFiveStars,
    hotelNameFontSize,
    hotelNameIsBold,
    hotelNameIsItalic,
    badgeStyle,
    badgeText,
    badgeSubtext,
    showBadge,
    showWatermark,
    watermarkText: watermarkText || undefined,
    watermarkOpacity: watermarkOpacity ?? 0.08,
    frameColor: frameColor || undefined,
    frameWidth: frameWidth ?? 8,
    backgroundColor: backgroundColor || undefined,
    backgroundGradient: backgroundGradient || undefined,
    recipientName,
    recipientNameIsBold,
    recipientNameIsItalic,
    recipientStaffId: recipientStaffId || undefined,
    recipientPosition,
    recipientDepartment,
    awardPeriod,
    citationText,
    citationIsBold,
    citationIsItalic,
    location,
    awardDate,
    signatory1Title,
    signatory1Name,
    signatory1Signature,
    signatory2Title,
    signatory2Name,
    signatory2Signature,
    showSignatory3,
    signatory3Title,
    signatory3Name,
    signatory3Signature,
    layoutCoordinates: Object.keys(layoutCoordinates || {}).length > 0 ? layoutCoordinates : undefined,
    notes
  };

  const handleSave = async () => {
    if (!recipientName.trim()) {
      toast.error('Please specify the recipient name.');
      return;
    }

    try {
      setIsSaving(true);
      if (initialCertificate?.id) {
        const res = await api.updateCertificate(initialCertificate.id, certData, user);
        if (res.success) {
          toast.success('Certificate updated successfully!');
          const updatedCert = {
            ...initialCertificate,
            ...certData,
            ...res.certificate,
            signatory1Signature: res.certificate?.signatory1Signature || certData.signatory1Signature,
            signatory2Signature: res.certificate?.signatory2Signature || certData.signatory2Signature,
            signatory3Signature: res.certificate?.signatory3Signature || certData.signatory3Signature
          } as Certificate;
          onCertificateSaved?.(updatedCert);
          onClose();
        } else {
          toast.error(res.message || 'Failed to update certificate');
        }
      } else {
        const res = await api.createCertificate(certData, user);
        if (res.success) {
          toast.success('Certificate generated and added to history!');
          const savedCert = {
            ...certData,
            ...res.certificate,
            signatory1Signature: res.certificate?.signatory1Signature || certData.signatory1Signature,
            signatory2Signature: res.certificate?.signatory2Signature || certData.signatory2Signature,
            signatory3Signature: res.certificate?.signatory3Signature || certData.signatory3Signature
          } as Certificate;
          onCertificateSaved?.(savedCert);
          onClose();
        } else {
          toast.error(res.message || 'Failed to create certificate');
        }
      }
    } catch (err: any) {
      console.error('Error saving certificate:', err);
      toast.error(err.message || 'Error occurred while saving certificate');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printableCert: Certificate = {
      id: certData.id || `print-${Date.now()}`,
      certificateNumber: certData.certificateNumber || `WRW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: certData.recipientName?.trim() || 'Valued Recipient',
      recipientStaffId: certData.recipientStaffId,
      recipientPosition: certData.recipientPosition || 'Valued Team Member',
      recipientDepartment: certData.recipientDepartment || 'Hospitality & Operations',
      title: certData.title || 'CERTIFICATE OF EXCELLENCE',
      presentationText: certData.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
      awardPeriod: certData.awardPeriod || `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      awardDate: certData.awardDate || new Date().toISOString().split('T')[0],
      location: certData.location || 'Al Baha, Saudi Arabia',
      citationText: certData.citationText || '',
      citationAlignment: certData.citationAlignment || 'center',
      citationFontSize: certData.citationFontSize || 13.5,
      template: certData.template || 'employee_of_month',
      customTemplateId: certData.customTemplateId,
      customBackgroundImage: certData.customBackgroundImage,
      customColors: certData.customColors,
      fontFamilyChoice: certData.fontFamilyChoice || 'playfair',
      fontFamily: certData.fontFamily || 'Playfair Display',
      borderStyle: certData.borderStyle || 'royal_frame',
      frameColor: certData.frameColor,
      frameWidth: certData.frameWidth,
      backgroundColor: certData.backgroundColor,
      backgroundGradient: certData.backgroundGradient,
      watermarkText: certData.watermarkText,
      watermarkOpacity: certData.watermarkOpacity,
      hotelName: certData.hotelName || 'WARWICK',
      hotelSubtitle: certData.hotelSubtitle || 'HOTEL AL BAHA • HOTELS & RESORTS',
      hotelLogoUrl: certData.hotelLogoUrl,
      hotelLogoPreset: certData.hotelLogoPreset || 'warwick_crest',
      hotelLogoSize: certData.hotelLogoSize || 50,
      showHotelLogo: certData.showHotelLogo !== false,
      showHotelBranding: certData.showHotelBranding !== false,
      showFiveStars: certData.showFiveStars !== false,
      hotelNameFontSize: certData.hotelNameFontSize || 28,
      hotelNameIsBold: certData.hotelNameIsBold !== false,
      hotelNameIsItalic: Boolean(certData.hotelNameIsItalic),
      badgeStyle: certData.badgeStyle || 'rosette',
      badgeText: certData.badgeText || 'SEAL OF EXCELLENCE',
      badgeSubtext: certData.badgeSubtext || '',
      showBadge: certData.showBadge !== false,
      showWatermark: certData.showWatermark !== false,
      signatory1Title: certData.signatory1Title || 'Human Resources Director',
      signatory1Name: certData.signatory1Name || '',
      signatory1Signature: certData.signatory1Signature || '',
      signatory2Title: certData.signatory2Title || 'General Manager',
      signatory2Name: certData.signatory2Name || '',
      signatory2Signature: certData.signatory2Signature || '',
      showSignatory3: Boolean(certData.showSignatory3),
      signatory3Title: certData.signatory3Title,
      signatory3Name: certData.signatory3Name,
      signatory3Signature: certData.signatory3Signature,
      issuedBy: certData.issuedBy || user?.name || 'System',
      issuedByRole: certData.issuedByRole || user?.role || 'Admin',
      issuedAt: certData.issuedAt || new Date().toISOString(),
      createdAt: certData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (isPreviewMode) {
      setPreviewPrintCert(printableCert);
    } else {
      setDirectPrintCert(printableCert);
    }
  };

  const handleVisualUpdates = (updates: Partial<Certificate>) => {
    if (updates.template !== undefined) setTemplate(updates.template);
    if (updates.title !== undefined) setTitle(updates.title);
    if (updates.presentationText !== undefined) setPresentationText(updates.presentationText);
    if (updates.recipientName !== undefined) setRecipientName(updates.recipientName);
    if (updates.recipientPosition !== undefined) setRecipientPosition(updates.recipientPosition);
    if (updates.recipientDepartment !== undefined) setRecipientDepartment(updates.recipientDepartment);
    if (updates.awardPeriod !== undefined) setAwardPeriod(updates.awardPeriod);
    if (updates.awardDate !== undefined) setAwardDate(updates.awardDate);
    if (updates.location !== undefined) setLocation(updates.location);
    if (updates.citationText !== undefined) setCitationText(updates.citationText);
    if (updates.citationAlignment !== undefined) setCitationAlignment(updates.citationAlignment);
    if (updates.fontFamily !== undefined) setFontFamily(updates.fontFamily);
    if (updates.hotelName !== undefined) setHotelName(updates.hotelName);
    if (updates.hotelSubtitle !== undefined) setHotelSubtitle(updates.hotelSubtitle);
    if (updates.hotelLogoUrl !== undefined) setHotelLogoUrl(updates.hotelLogoUrl);
    if (updates.showHotelLogo !== undefined) setShowHotelLogo(updates.showHotelLogo);
    if (updates.showFiveStars !== undefined) setShowFiveStars(updates.showFiveStars);
    if (updates.badgeStyle !== undefined) setBadgeStyle(updates.badgeStyle);
    if (updates.badgeText !== undefined) setBadgeText(updates.badgeText);
    if (updates.badgeSubtext !== undefined) setBadgeSubtext(updates.badgeSubtext);
    if (updates.showBadge !== undefined) setShowBadge(updates.showBadge);
    if (updates.borderStyle !== undefined) setBorderStyle(updates.borderStyle);
    if (updates.signatoryLeftTitle !== undefined) setSignatory1Title(updates.signatoryLeftTitle);
    if (updates.signatoryLeftName !== undefined) setSignatory1Name(updates.signatoryLeftName);
    if (updates.signatoryRightTitle !== undefined) setSignatory2Title(updates.signatoryRightTitle);
    if (updates.signatoryRightName !== undefined) setSignatory2Name(updates.signatoryRightName);
    if (updates.signatory1Title !== undefined) setSignatory1Title(updates.signatory1Title);
    if (updates.signatory1Name !== undefined) setSignatory1Name(updates.signatory1Name);
    if (updates.signatory1Signature !== undefined) setSignatory1Signature(updates.signatory1Signature);
    if (updates.signatory2Title !== undefined) setSignatory2Title(updates.signatory2Title);
    if (updates.signatory2Name !== undefined) setSignatory2Name(updates.signatory2Name);
    if (updates.signatory2Signature !== undefined) setSignatory2Signature(updates.signatory2Signature);
    if (updates.signatory3Title !== undefined) setSignatory3Title(updates.signatory3Title);
    if (updates.signatory3Name !== undefined) setSignatory3Name(updates.signatory3Name);
    if (updates.signatory3Signature !== undefined) setSignatory3Signature(updates.signatory3Signature);
    if (updates.showSignatory3 !== undefined) setShowSignatory3(updates.showSignatory3);
    if (updates.customColors !== undefined) setCustomColors(updates.customColors);
    if (updates.customBackgroundImage !== undefined) setCustomBackgroundImage(updates.customBackgroundImage);
    if (updates.layoutCoordinates !== undefined) setLayoutCoordinates(updates.layoutCoordinates);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const cleanName = recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatePdf('generator-certificate-container', `Warwick_Certificate_${cleanName}.pdf`);
      toast.success('Certificate PDF downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloadingPng(true);
      const cleanName = recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatePng('generator-certificate-container', `Warwick_Certificate_${cleanName}.png`);
      toast.success('Certificate PNG image downloaded!');
    } catch (err) {
      toast.error('Failed to download image.');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="certificate-generator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-7xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden">
        {/* ------------------------------------------------------------- */}
        {/* Modal Top Header */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {initialCertificate ? 'Edit Certificate' : '5-Star Certificate Studio'}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Full Element Customizer
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Customize hotel logo, 5-star templates, seals, fonts, citations & signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-50"
              title={isPreviewMode ? 'Open Printable Preview First' : 'Direct Print to Printer'}
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>{isPreviewMode ? 'Print Preview' : 'Direct Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50"
            >
              {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-red-600" />}
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-50"
            >
              {isDownloadingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Mode Header Switcher */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditorMode('form')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                editorMode === 'form'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>⚙️ Choose Template & Generate</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('visual_editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                editorMode === 'visual_editor'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎨 Certificate Builder (Drag & Drop)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>25 Hotel Staff Award Types Available</span>
          </div>
        </div>

        {editorMode === 'visual_editor' ? (
          <div className="flex-1 overflow-hidden h-[calc(96vh-140px)]">
            <VisualLiveEditorStage
              cert={certData}
              onChange={handleVisualUpdates}
              onOpenSignaturePad={(idx) => {
                setActiveSignatoryTarget(idx);
                setSignaturePadOpen(true);
              }}
              onOpenDirectPrint={handlePrint}
              canPrint={canPrintCertificates}
              canSave={canSaveCertificates}
            />
          </div>
        ) : (
          <>
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setPreviewTab('form')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
                  previewTab === 'form'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Customization Controls
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
                  previewTab === 'preview'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Eye className="w-4 h-4" />
                Live Preview
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Main Body: Form (Left) & Live Preview Stage (Right) */}
            {/* ------------------------------------------------------------- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Form Controls */}
          <div
            className={`lg:col-span-5 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[calc(96vh-130px)] space-y-4 ${
              previewTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Auto-Save / Draft notification */}
            {hasSavedDraft && !initialCertificate && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">Previous certificate draft found in browser storage.</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 text-[11px] transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Section 1: Template Selection & Style Options */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Certificate Template Options (31+ Available)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTemplateOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload Custom Picture</span>
                </button>
              </div>

              {/* Template Search Bar & Quick Filters */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates by title, department, award..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                  {templateSearch && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTemplateCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      templateCategoryFilter === 'all'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All ({HOTEL_STAFF_CERTIFICATE_PRESETS.length + 6 + customTemplates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateCategoryFilter('presets')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      templateCategoryFilter === 'presets'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Hotel Presets ({HOTEL_STAFF_CERTIFICATE_PRESETS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateCategoryFilter('classic')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      templateCategoryFilter === 'classic'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Classic (6)
                  </button>
                  {customTemplates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTemplateCategoryFilter('custom')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        templateCategoryFilter === 'custom'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Custom ({customTemplates.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Templates Grid List */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto">
                {/* 1. Classic 6 Templates */}
                {(templateCategoryFilter === 'all' || templateCategoryFilter === 'classic') && (
                  <>
                    {/* Employee of the Month */}
                    {(!templateSearch || 'employee of the month luxury navy gold eom'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('employee_of_month')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'employee_of_month' || template === 'star_eom'
                            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {(template === 'employee_of_month' || template === 'star_eom') && (
                          <span className="absolute top-2 right-2 text-amber-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0b1b2d] border border-amber-400 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">1. EOM Luxury</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Navy & 24K Gold Waves
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          With rosette medal & crest
                        </div>
                      </button>
                    )}

                    {/* Appreciation */}
                    {(!templateSearch || 'certificate of appreciation roman arch filigree milestone'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('appreciation')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'appreciation' || template === 'star_appreciation'
                            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {(template === 'appreciation' || template === 'star_appreciation') && (
                          <span className="absolute top-2 right-2 text-amber-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#c4972a] border border-amber-300 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">2. Appreciation</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Roman Arch & Filigree
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Hotel opening & milestones
                        </div>
                      </button>
                    )}

                    {/* Leadership */}
                    {(!templateSearch || 'leadership supervisory distinction emerald gold'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('star_leadership')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'star_leadership'
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {template === 'star_leadership' && (
                          <span className="absolute top-2 right-2 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#073e2a] border border-emerald-400 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">3. Leadership</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Imperial Emerald & Gold
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          3 executive sign-offs & shield
                        </div>
                      </button>
                    )}

                    {/* Hospitality Hero */}
                    {(!templateSearch || 'hospitality hero burgundy guest delight service'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('star_hospitality')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'star_hospitality'
                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {template === 'star_hospitality' && (
                          <span className="absolute top-2 right-2 text-rose-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4b1222] border border-rose-300 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">4. Hospitality Hero</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Burgundy Wine & Rose Gold
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Guest delight & service award
                        </div>
                      </button>
                    )}

                    {/* Loyalty Milestone */}
                    {(!templateSearch || 'loyalty milestone midnight sapphire silver tenure'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('star_milestone')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'star_milestone'
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {template === 'star_milestone' && (
                          <span className="absolute top-2 right-2 text-blue-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0a1626] border border-blue-400 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">5. Loyalty Milestone</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Midnight Sapphire & Silver
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Guilloche frame & tenure seal
                        </div>
                      </button>
                    )}

                    {/* Skill Mastery */}
                    {(!templateSearch || 'professional skill mastery cobalt sunburst certification'.includes(templateSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTemplate('star_mastery')}
                        className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between ${
                          template === 'star_mastery'
                            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {template === 'star_mastery' && (
                          <span className="absolute top-2 right-2 text-amber-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0c2340] border border-amber-300 shrink-0" />
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">6. Skill Mastery</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ml-auto mr-4">Classic</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          Royal Cobalt & Sunburst
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Pillar columns & certification
                        </div>
                      </button>
                    )}
                  </>
                )}

                {/* 2. Hotel Staff Presets (25 Unique Templates) */}
                {(templateCategoryFilter === 'all' || templateCategoryFilter === 'presets') && (
                  <>
                    {HOTEL_STAFF_CERTIFICATE_PRESETS.filter((p) => {
                      if (!templateSearch) return true;
                      const s = templateSearch.toLowerCase();
                      return (
                        (p.name && p.name.toLowerCase().includes(s)) ||
                        (p.subtitle && p.subtitle.toLowerCase().includes(s)) ||
                        (p.category && p.category.toLowerCase().includes(s)) ||
                        (p.defaultTitle && p.defaultTitle.toLowerCase().includes(s))
                      );
                    }).map((p) => {
                      const isSelected = template === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectHotelPreset(p)}
                          className={`p-2.5 rounded-xl border-2 text-left transition relative flex flex-col justify-between group ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 text-amber-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                              style={{ backgroundColor: p.primaryColor }}
                            />
                            <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                              {p.name}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                            {p.subtitle}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                            <span className="font-medium truncate max-w-[130px]">{p.category}</span>
                            <span
                              className="px-1.5 py-0.2 rounded font-mono font-bold"
                              style={{
                                color: p.accentColor,
                                backgroundColor: `${p.primaryColor}15`
                              }}
                            >
                              {p.badgeLabel || 'Preset'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* 3. Custom Uploaded Templates */}
                {(templateCategoryFilter === 'all' || templateCategoryFilter === 'custom') && (
                  <>
                    {customTemplates.filter((ct) => {
                      if (!templateSearch) return true;
                      const s = templateSearch.toLowerCase();
                      return (
                        (ct.name && ct.name.toLowerCase().includes(s)) ||
                        (ct.category && ct.category.toLowerCase().includes(s))
                      );
                    }).map((ct) => {
                      const isSelected = template === ct.id;
                      return (
                        <div
                          key={ct.id}
                          onClick={() => handleSelectCustomTemplate(ct)}
                          className={`relative p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between group ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              <ImageIcon className="w-3 h-3" /> Custom
                            </span>
                            <div className="flex items-center gap-1">
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(ct.id, e)}
                                className="text-slate-400 hover:text-red-500 p-0.5 rounded transition opacity-0 group-hover:opacity-100"
                                title="Delete template"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                            {ct.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {ct.category || 'Uploaded Certificate'}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Active Template Status Bar */}
              <div className="p-2.5 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between text-xs px-3">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px]">Selected: <strong className="font-bold">{title || 'Certificate'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorMode('visual_editor')}
                  className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Customize in Builder →</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 2: Hotel Branding & Logo Customizer */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Hotel Logo & Branding
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Toggle hotel brand name and subtitle text">
                    <input
                      type="checkbox"
                      checked={showHotelBranding}
                      onChange={(e) => setShowHotelBranding(e.target.checked)}
                      className="rounded text-amber-600 accent-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hotel Branding</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Toggle emblem/logo graphic">
                    <input
                      type="checkbox"
                      checked={showHotelLogo}
                      onChange={(e) => setShowHotelLogo(e.target.checked)}
                      className="rounded text-amber-600 accent-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Toggle 5-star rating icon row">
                    <input
                      type="checkbox"
                      checked={showFiveStars}
                      onChange={(e) => setShowFiveStars(e.target.checked)}
                      className="rounded text-amber-600 accent-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">5-Stars</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 space-y-3">
                {/* Hotel Name & Subtitle inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Hotel Brand Name <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(Optional)</span>
                      </label>
                      {hotelName && (
                        <button
                          type="button"
                          onClick={() => setHotelName('')}
                          className="text-[10px] text-slate-400 hover:text-red-500 transition underline"
                          title="Clear hotel brand name"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      placeholder="Optional (e.g. WARWICK or leave blank)"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold tracking-wider placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Hotel Subtitle / Tagline <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(Optional)</span>
                      </label>
                      {hotelSubtitle && (
                        <button
                          type="button"
                          onClick={() => setHotelSubtitle('')}
                          className="text-[10px] text-slate-400 hover:text-red-500 transition underline"
                          title="Clear hotel subtitle"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={hotelSubtitle}
                      onChange={(e) => setHotelSubtitle(e.target.value)}
                      placeholder="Optional (e.g. HOTEL AL BAHA or leave blank)"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Quick actions for optional branding */}
                <div className="flex items-center justify-between px-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHotelName('WARWICK');
                        setHotelSubtitle('HOTEL AL BAHA • HOTELS & RESORTS');
                        setShowHotelBranding(true);
                      }}
                      className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Fill Default Warwick
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHotelName('');
                        setHotelSubtitle('');
                      }}
                      className="text-[10px] font-medium text-slate-500 hover:text-red-500 hover:underline transition"
                    >
                      Clear Brand & Subtitle
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">Leave empty to hide from certificate</span>
                </div>

                {/* Hotel Brand Typography Controls */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hotel Name Style:</span>
                    <button
                      type="button"
                      onClick={() => setHotelNameIsBold(!hotelNameIsBold)}
                      className={`px-2 py-1 rounded-lg border font-bold text-xs flex items-center gap-1 transition ${
                        hotelNameIsBold
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                      title="Toggle Bold"
                    >
                      <Bold className="w-3 h-3" />
                      <span className="text-[10px]">Bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHotelNameIsItalic(!hotelNameIsItalic)}
                      className={`px-2 py-1 rounded-lg border italic text-xs flex items-center gap-1 transition ${
                        hotelNameIsItalic
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                      title="Toggle Italic"
                    >
                      <Italic className="w-3 h-3" />
                      <span className="text-[10px]">Italic</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Size:</span>
                    <input
                      type="range"
                      min="18"
                      max="44"
                      value={hotelNameFontSize}
                      onChange={(e) => setHotelNameFontSize(Number(e.target.value))}
                      className="w-20 accent-amber-600"
                    />
                    <span className="text-[10px] font-mono text-amber-600 font-bold">{hotelNameFontSize}px</span>
                  </div>
                </div>

                {/* Hotel Logo Source: Presets or Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Logo Preset or Upload Custom Picture
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHotelLogoPreset('warwick_crest');
                        setHotelLogoUrl('');
                        setShowHotelLogo(true);
                      }}
                      className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                        hotelLogoPreset === 'warwick_crest' && !hotelLogoUrl
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Warwick Crest</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHotelLogoPreset('grand_star');
                        setHotelLogoUrl('');
                        setShowHotelLogo(true);
                      }}
                      className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                        hotelLogoPreset === 'grand_star' && !hotelLogoUrl
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-[10px] font-bold">5-Star Shield</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHotelLogoPreset('royal_crown');
                        setHotelLogoUrl('');
                        setShowHotelLogo(true);
                      }}
                      className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                        hotelLogoPreset === 'royal_crown' && !hotelLogoUrl
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Royal Crown</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHotelLogoPreset('luxury_monogram');
                        setHotelLogoUrl('');
                        setShowHotelLogo(true);
                      }}
                      className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                        hotelLogoPreset === 'luxury_monogram' && !hotelLogoUrl
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Monogram</span>
                    </button>
                  </div>

                  {/* Upload Hotel Logo file control */}
                  <div className="p-2.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center gap-2.5 truncate">
                      {hotelLogoUrl ? (
                        <img
                          src={hotelLogoUrl}
                          alt="Custom Hotel Logo"
                          className="w-9 h-9 object-contain rounded-md border border-amber-300 bg-white p-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {hotelLogoUrl ? 'Custom Hotel Logo Active' : 'Upload Any Hotel Logo'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          PNG, JPG, SVG with transparent background
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hotelLogoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCustomLogo}
                          className="text-[11px] px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
                      >
                        {hotelLogoUrl ? 'Change' : 'Upload File'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo Size Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Logo Scale Size</span>
                    <span className="font-mono text-amber-600">{hotelLogoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={hotelLogoSize}
                    onChange={(e) => setHotelLogoSize(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 3: Typography, Presentation & Custom Title */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    3. Certificate Titles & Typography
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-3">
                {/* Title and presentation text inputs */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Certificate Header Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. EMPLOYEE OF THE MONTH"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Presentation Text (Subtitle Line)
                  </label>
                  <input
                    type="text"
                    value={presentationText}
                    onChange={(e) => setPresentationText(e.target.value)}
                    placeholder="THIS CERTIFICATE IS PROUDLY PRESENTED TO"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase tracking-widest text-[11px]"
                  />
                </div>

                {/* Font Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFontFamilyChoice('serif')}
                    className={`p-2 rounded-lg border text-center transition ${
                      fontFamilyChoice === 'serif' || fontFamilyChoice === 'playfair'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 font-serif'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-serif'
                    }`}
                  >
                    <span className="text-xs font-bold italic">Playfair</span>
                    <div className="text-[10px] text-slate-400">Classic Serif</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontFamilyChoice('cinzel')}
                    className={`p-2 rounded-lg border text-center transition ${
                      fontFamilyChoice === 'cinzel'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 font-serif'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-serif'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Cinzel</span>
                    <div className="text-[10px] text-slate-400">Imperial Roman</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontFamilyChoice('sans')}
                    className={`p-2 rounded-lg border text-center transition ${
                      fontFamilyChoice === 'sans'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 font-sans'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-sans'
                    }`}
                  >
                    <span className="text-xs font-bold">Jakarta Sans</span>
                    <div className="text-[10px] text-slate-400">Modern Clean</div>
                  </button>
                </div>

                {/* Name Size Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Recipient Name Size</span>
                    <span className="font-mono text-amber-600">{nameFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="52"
                    value={nameFontSize}
                    onChange={(e) => setNameFontSize(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 4: Recipient Details */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  4. Recipient Information
                </span>
              </div>

              <div className="p-3.5 space-y-3">
                {/* Quick staff directory selector */}
                {staff && staff.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-semibold">
                      Quick Pick from Hotel Staff Directory
                    </label>
                    <select
                      value={recipientStaffId}
                      onChange={(e) => handleSelectStaff(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose Hotel Staff Member (Optional) --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role} - {s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Recipient Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRecipientNameIsBold(!recipientNameIsBold)}
                        className={`p-1 px-1.5 rounded border text-[10px] font-bold flex items-center gap-1 transition ${
                          recipientNameIsBold
                            ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                        title="Toggle Bold"
                      >
                        <Bold className="w-2.5 h-2.5" />
                        <span>B</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientNameIsItalic(!recipientNameIsItalic)}
                        className={`p-1 px-1.5 rounded border text-[10px] italic flex items-center gap-1 transition ${
                          recipientNameIsItalic
                            ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                        title="Toggle Italic"
                      >
                        <Italic className="w-2.5 h-2.5" />
                        <span>I</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. MD ABU SAYEED RIDAY"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold tracking-wide"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Supports inline formatting like <code className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">**bold**</code> and <code className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">*italic*</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation / Position
                    </label>
                    <input
                      type="text"
                      value={recipientPosition}
                      onChange={(e) => setRecipientPosition(e.target.value)}
                      placeholder="e.g. Housekeeping Supervisor"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={recipientDepartment}
                      onChange={(e) => setRecipientDepartment(e.target.value)}
                      placeholder="e.g. Housekeeping"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 5: Citation / Recognition Paragraph */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  5. Citation & Recognition Wording
                </span>
                <button
                  type="button"
                  onClick={handleResetCitation}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Text</span>
                </button>
              </div>

              <div className="p-3.5 space-y-2.5">
                <textarea
                  rows={4}
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  className="w-full px-3 py-2 text-xs leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Align:</span>
                    <button
                      type="button"
                      onClick={() => setCitationAlignment('left')}
                      className={`p-1 rounded ${citationAlignment === 'left' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitationAlignment('center')}
                      className={`p-1 rounded ${citationAlignment === 'center' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitationAlignment('justify')}
                      className={`p-1 rounded ${citationAlignment === 'justify' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => setCitationIsBold(!citationIsBold)}
                      className={`p-1 px-1.5 rounded border text-[10px] font-bold flex items-center gap-1 transition ${
                        citationIsBold
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                      title="Make whole citation bold"
                    >
                      <Bold className="w-2.5 h-2.5" />
                      <span>B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCitationIsItalic(!citationIsItalic)}
                      className={`p-1 px-1.5 rounded border text-[10px] italic flex items-center gap-1 transition ${
                        citationIsItalic
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                      title="Make whole citation italic"
                    >
                      <Italic className="w-2.5 h-2.5" />
                      <span>I</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Size:</span>
                    <input
                      type="range"
                      min="11"
                      max="17"
                      step="0.5"
                      value={citationFontSize}
                      onChange={(e) => setCitationFontSize(Number(e.target.value))}
                      className="w-20 accent-amber-600"
                    />
                    <span className="text-[10px] font-mono text-slate-600">{citationFontSize}px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 6: Award Dates, Location & Metadata */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  6. Award Period & Location
                </span>
              </div>

              <div className="p-3.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Award Period (Month & Year)
                    </label>
                    <input
                      type="text"
                      value={awardPeriod}
                      onChange={(e) => setAwardPeriod(e.target.value)}
                      placeholder="e.g. June 2026"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Award Date
                    </label>
                    <input
                      type="text"
                      value={awardDate}
                      onChange={(e) => setAwardDate(e.target.value)}
                      placeholder="e.g. 15 June 2026"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Al Baha, Saudi Arabia"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 7: Signatories (Support 2 or 3 Signatories) */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  7. Signatories & Sign-offs
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={showSignatory3}
                    onChange={(e) => setShowSignatory3(e.target.checked)}
                    className="rounded text-amber-600 accent-amber-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Add 3rd Signatory</span>
                </label>
              </div>

              <div className="p-3.5 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Left Signatory</span>
                    <input
                      type="text"
                      value={signatory1Title}
                      onChange={(e) => setSignatory1Title(e.target.value)}
                      placeholder="Title: Housekeeping Manager"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={signatory1Name}
                      onChange={(e) => setSignatory1Name(e.target.value)}
                      placeholder="Signatory Name (Optional)"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic"
                    />

                    {/* Left Signatory Digital Signature */}
                    {signatory1Signature ? (
                      <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-1.5">
                        <div className="h-7 w-20 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 rounded">
                          <img
                            src={signatory1Signature}
                            alt="Signature"
                            className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-screen"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSignaturePad(1)}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                            title="Redraw / Change Signature"
                          >
                            <PenTool className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatory1Signature('')}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Remove Signature"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSignaturePad(1)}
                        className="w-full py-1 px-2 border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 rounded-lg text-amber-700 dark:text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <PenTool className="w-2.5 h-2.5" />
                        <span>Draw / Embed Signature</span>
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Right Signatory</span>
                    <input
                      type="text"
                      value={signatory2Title}
                      onChange={(e) => setSignatory2Title(e.target.value)}
                      placeholder="Title: General Manager"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={signatory2Name}
                      onChange={(e) => setSignatory2Name(e.target.value)}
                      placeholder="Signatory Name (Optional)"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic"
                    />

                    {/* Right Signatory Digital Signature */}
                    {signatory2Signature ? (
                      <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-1.5">
                        <div className="h-7 w-20 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 rounded">
                          <img
                            src={signatory2Signature}
                            alt="Signature"
                            className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-screen"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSignaturePad(2)}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                            title="Redraw / Change Signature"
                          >
                            <PenTool className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatory2Signature('')}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Remove Signature"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSignaturePad(2)}
                        className="w-full py-1 px-2 border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 rounded-lg text-amber-700 dark:text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <PenTool className="w-2.5 h-2.5" />
                        <span>Draw / Embed Signature</span>
                      </button>
                    )}
                  </div>
                </div>

                {showSignatory3 && (
                  <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
                      Center / 3rd Executive Signatory
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={signatory3Title}
                        onChange={(e) => setSignatory3Title(e.target.value)}
                        placeholder="Title: Director of Operations"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={signatory3Name}
                        onChange={(e) => setSignatory3Name(e.target.value)}
                        placeholder="Signatory Name (Optional)"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic"
                      />
                    </div>

                    {/* Center Signatory Digital Signature */}
                    {signatory3Signature ? (
                      <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-1.5 max-w-[240px]">
                        <div className="h-7 w-20 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 rounded">
                          <img
                            src={signatory3Signature}
                            alt="Signature"
                            className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-screen"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSignaturePad(3)}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                            title="Redraw / Change Signature"
                          >
                            <PenTool className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatory3Signature('')}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Remove Signature"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSignaturePad(3)}
                        className="w-full py-1 px-2 border border-dashed border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-slate-900/60 hover:bg-white rounded-lg text-amber-700 dark:text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <PenTool className="w-2.5 h-2.5" />
                        <span>Draw / Embed Center Signature</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 8: Badges, Wax Seals & Rosettes */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  8. Seal & Award Medallion
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={showBadge}
                    onChange={(e) => setShowBadge(e.target.checked)}
                    className="rounded text-amber-600 accent-amber-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Show Seal</span>
                </label>
              </div>

              {showBadge && (
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Medal / Badge Style
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBadgeStyle('rosette')}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          badgeStyle === 'rosette'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Rosette</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeStyle('gold_seal')}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          badgeStyle === 'gold_seal'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Gold Seal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeStyle('laurel_crest')}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          badgeStyle === 'laurel_crest'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Laurel Crest</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeStyle('star_medallion')}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          badgeStyle === 'star_medallion'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">5-Star Medal</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Seal Header Text
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="e.g. SEAL OF EXCELLENCE"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Seal Subtext
                      </label>
                      <input
                        type="text"
                        value={badgeSubtext}
                        onChange={(e) => setBadgeSubtext(e.target.value)}
                        placeholder="e.g. June 2026"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Section 9: Custom Colors System */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      9. Custom Color Palette System
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {customColors ? 'Custom palette active' : 'Click to customize colors (Navy, Emerald, Burgundy...)'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600">
                  {showColorPicker ? 'Hide' : 'Customize'}
                </span>
              </button>

              {showColorPicker && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                  <ColorPaletteSelector
                    colors={customColors}
                    onChange={setCustomColors}
                    templateType={template}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Right Column: Live Scaled Preview Stage */}
          {/* ------------------------------------------------------------- */}
          <div
            className={`lg:col-span-7 bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto max-h-[calc(96vh-130px)] flex flex-col items-center justify-start ${
              previewTab === 'preview' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="w-full mb-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-600" />
                Live Certificate Preview (Exact 5-Star Print Spooler)
              </span>
              <span className="text-[11px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                1000 × 700 px (Landscape)
              </span>
            </div>

            <CertificatePreviewStage
              cert={certData}
              idPrefix="generator"
              showToolbar={true}
              onDirectPrintPage={handlePrint}
              onPrintSuccess={() => toast.success('Print job sent.')}
              onDownloadSuccess={() => toast.success('Download completed.')}
            />
          </div>
        </div>
      </>
    )}

        {/* ------------------------------------------------------------- */}
        {/* Modal Bottom Action Footer */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
            {initialCertificate ? `Editing ${initialCertificate.certificateNumber}` : 'Certificate will be stored in hotel history'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 transition flex items-center gap-1.5 shadow-xs"
              title="Save current customizations as draft in local browser storage"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Save Draft</span>
            </button>
            {canPrintCertificates && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
                  title={isPreviewMode ? 'Open Printable Preview First' : 'Direct Print to Printer'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPreviewMode ? 'Print Preview' : 'Direct Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloadingPng}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>PNG</span>
                </button>
              </>
            )}
            {canSaveCertificates && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !recipientName.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{initialCertificate ? 'Update Certificate' : 'Issue Certificate'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Template Modal */}
      <AddTemplateModal
        isOpen={isAddTemplateOpen}
        onClose={() => setIsAddTemplateOpen(false)}
        currentUser={user}
        onTemplateAdded={handleTemplateAdded}
      />

      {/* Signature Pad Modal for Drawing / Embedding Signatures */}
      <SignaturePadModal
        isOpen={signaturePadOpen}
        onClose={() => setSignaturePadOpen(false)}
        onSaveSignature={handleSaveSignature}
        signatoryTitle={
          activeSignatoryTarget === 1
            ? signatory1Title
            : activeSignatoryTarget === 2
            ? signatory2Title
            : signatory3Title
        }
        signatoryName={
          activeSignatoryTarget === 1
            ? signatory1Name
            : activeSignatoryTarget === 2
            ? signatory2Name
            : signatory3Name
        }
        currentSignature={
          activeSignatoryTarget === 1
            ? signatory1Signature
            : activeSignatoryTarget === 2
            ? signatory2Signature
            : signatory3Signature
        }
      />

      {/* Certificate Printable Preview Page */}
      {previewPrintCert && (
        <div className="fixed inset-0 z-[75] bg-slate-950 overflow-y-auto">
          <CertificatePrintPage
            certificate={previewPrintCert}
            onBack={() => setPreviewPrintCert(null)}
            canSave={canSaveCertificates}
          />
        </div>
      )}

      {/* Direct Certificate Print Portal (Immediate to Printer) */}
      {directPrintCert && (
        <DirectCertificatePrintPortal
          certificate={directPrintCert}
          onDone={() => setDirectPrintCert(null)}
        />
      )}
    </div>
  );
};
