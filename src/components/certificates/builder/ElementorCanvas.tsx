import React, { useRef, useState, useEffect } from 'react';
import { BuilderElement, CanvasSettings } from './types';
import { HotelLogoDisplay } from '../HotelLogoDisplay';
import { CertificateSealMedal } from '../CertificateSealMedal';
import { RichTextRenderer } from '../RichTextRenderer';
import { SignatoryBox } from '../SignatoryBox';
import {
  Trash2,
  Copy,
  Move,
  Check,
  Edit2,
  Maximize2,
  Lock,
  Crown,
  Star,
  Shield,
  Award,
  Sparkles,
  Barcode,
  CheckCircle2,
  Quote,
  Scissors,
  LayoutGrid,
  Columns,
  Plus
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ElementorCanvasProps {
  elements: BuilderElement[];
  settings: CanvasSettings;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onCopyElement?: (id: string) => void;
  onCutElement?: (id: string) => void;
  onDragEnd?: () => void;
  zoomLevel: number;
  showGrid: boolean;
  previewMode: boolean;
  liveStaffPreview?: boolean;
  sampleStaffData?: {
    name?: string;
    position?: string;
    department?: string;
    citation?: string;
    date?: string;
    certNo?: string;
    location?: string;
  };
}

export const ElementorCanvas: React.FC<ElementorCanvasProps> = ({
  elements,
  settings,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onCopyElement,
  onCutElement,
  onDragEnd,
  zoomLevel,
  showGrid,
  previewMode,
  liveStaffPreview = false,
  sampleStaffData
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Helper to dynamically resolve template tokens like {{staff_name}} and {{citation_paragraph}}
  const resolveTokens = (text: string | undefined, defaultVal: string = ''): string => {
    const raw = text !== undefined && text !== null ? text : defaultVal;
    if (!liveStaffPreview && !previewMode) return raw;
    return raw
      .replace(/\{\{staff_name\}\}/gi, sampleStaffData?.name || 'MD Abu Sayeed')
      .replace(/\{\{staff_position\}\}/gi, sampleStaffData?.position || 'Guest Services Supervisor')
      .replace(/\{\{staff_department\}\}/gi, sampleStaffData?.department || 'Front Office & Hospitality')
      .replace(
        /\{\{citation_paragraph\}\}/gi,
        sampleStaffData?.citation ||
          'In recognition of exemplary commitment, unwavering dedication, and continuous excellence in service standards.'
      )
      .replace(
        /\{\{issue_date\}\}/gi,
        sampleStaffData?.date ||
          new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      )
      .replace(/\{\{certificate_no\}\}/gi, sampleStaffData?.certNo || 'CERT-2026-0428')
      .replace(/\{\{location\}\}/gi, sampleStaffData?.location || 'Grand Convention Hall');
  };

  // Mouse & Touch Drag handlers for elements on canvas
  const handleMouseDown = (e: React.MouseEvent, elem: BuilderElement) => {
    if (previewMode) return;
    e.stopPropagation();
    onSelectElement(elem.id);

    // If element is locked, select it but do not drag
    if (elem.isLocked) return;

    setDraggingId(elem.id);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y
    });
  };

  const handleTouchStart = (e: React.TouchEvent, elem: BuilderElement) => {
    if (previewMode) return;
    e.stopPropagation();
    onSelectElement(elem.id);

    if (elem.isLocked) return;
    const touch = e.touches[0];
    if (!touch) return;

    setDraggingId(elem.id);
    setDragStartPos({
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      elemX: elem.x,
      elemY: elem.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !dragStartPos || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartPos.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartPos.mouseY) / rect.height) * 100;

      let newX = Math.round((dragStartPos.elemX + deltaX) * 10) / 10;
      let newY = Math.round((dragStartPos.elemY + deltaY) * 10) / 10;

      // Bound within 2% - 98%
      newX = Math.max(2, Math.min(98, newX));
      newY = Math.max(2, Math.min(98, newY));

      onUpdateElement(draggingId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (draggingId) {
        setDraggingId(null);
        setDragStartPos(null);
        if (onDragEnd) onDragEnd();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingId || !dragStartPos || !containerRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((touch.clientX - dragStartPos.mouseX) / rect.width) * 100;
      const deltaY = ((touch.clientY - dragStartPos.mouseY) / rect.height) * 100;

      let newX = Math.round((dragStartPos.elemX + deltaX) * 10) / 10;
      let newY = Math.round((dragStartPos.elemY + deltaY) * 10) / 10;

      newX = Math.max(2, Math.min(98, newX));
      newY = Math.max(2, Math.min(98, newY));

      onUpdateElement(draggingId, { x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      if (draggingId) {
        setDraggingId(null);
        setDragStartPos(null);
        if (onDragEnd) onDragEnd();
      }
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draggingId, dragStartPos, zoomLevel, onUpdateElement, onDragEnd]);

  // Luxury Border rendering
  const renderBorder = () => {
    const { borderColor, accentColor, primaryColor, borderStyle } = settings;
    switch (borderStyle) {
      case 'baroque_filigree':
        return (
          <>
            <div className="absolute inset-[10px] pointer-events-none border-[5px] z-20" style={{ borderColor }} />
            <div className="absolute inset-[18px] pointer-events-none border border-dashed z-20" style={{ borderColor: accentColor }} />
            <div className="absolute inset-[24px] pointer-events-none border-2 z-20" style={{ borderColor }} />
            <svg className="absolute top-2 left-2 w-28 h-28 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
              <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
              <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
              <circle cx="28" cy="28" r="6" fill={accentColor} />
            </svg>
            <svg className="absolute top-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
              <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
              <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
              <circle cx="28" cy="28" r="6" fill={accentColor} />
            </svg>
            <svg className="absolute bottom-2 left-2 w-28 h-28 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
              <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
              <circle cx="28" cy="28" r="6" fill={accentColor} />
            </svg>
            <svg className="absolute bottom-2 right-2 w-28 h-28 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <path d="M 12 12 Q 50 12 50 50 Q 12 50 12 12 Z" fill={accentColor} opacity="0.85" />
              <path d="M 12 12 L 85 12 M 12 12 L 12 85" stroke={borderColor} strokeWidth="3" />
              <circle cx="28" cy="28" r="6" fill={accentColor} />
            </svg>
          </>
        );

      case 'geometric_gold':
        return (
          <>
            <div className="absolute inset-[10px] pointer-events-none border-[4px] z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute inset-[18px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
            <svg className="absolute top-2 left-2 w-24 h-24 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
              <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
              <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
              <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
            </svg>
            <svg className="absolute top-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
              <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
              <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
              <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
            </svg>
            <svg className="absolute bottom-2 left-2 w-24 h-24 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
              <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
              <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
            </svg>
            <svg className="absolute bottom-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <polygon points="12,12 50,12 12,50" fill={accentColor} opacity="0.3" />
              <line x1="12" y1="12" x2="80" y2="12" stroke={accentColor} strokeWidth="3" />
              <line x1="12" y1="12" x2="12" y2="80" stroke={accentColor} strokeWidth="3" />
            </svg>
          </>
        );

      case 'double_border':
        return (
          <>
            <div className="absolute inset-[12px] pointer-events-none border-[3px] z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute inset-[18px] pointer-events-none border z-20" style={{ borderColor: accentColor }} />
          </>
        );

      case 'royal_frame':
      default:
        return (
          <>
            <div className="absolute inset-[10px] pointer-events-none border-[5px] z-20" style={{ borderColor: accentColor }} />
            <div className="absolute inset-[16px] pointer-events-none border z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute inset-[20px] pointer-events-none border-2 z-20" style={{ borderColor: accentColor }} />
            <svg className="absolute top-2 left-2 w-24 h-24 pointer-events-none z-25" viewBox="0 0 100 100" fill="none">
              <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
              <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
              <circle cx="22" cy="22" r="5" fill={accentColor} />
            </svg>
            <svg className="absolute top-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100" viewBox="0 0 100 100" fill="none">
              <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
              <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
              <circle cx="22" cy="22" r="5" fill={accentColor} />
            </svg>
            <svg className="absolute bottom-2 left-2 w-24 h-24 pointer-events-none z-25 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
              <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
              <circle cx="22" cy="22" r="5" fill={accentColor} />
            </svg>
            <svg className="absolute bottom-2 right-2 w-24 h-24 pointer-events-none z-25 -scale-x-100 -scale-y-100" viewBox="0 0 100 100" fill="none">
              <path d="M 10 10 L 60 10 M 10 10 L 10 60" stroke={accentColor} strokeWidth="3" />
              <path d="M 15 15 L 45 15 M 15 15 L 15 45" stroke={accentColor} strokeWidth="1.5" />
              <circle cx="22" cy="22" r="5" fill={accentColor} />
            </svg>
          </>
        );
    }
  };

  // Compute complete CSS styles for an element (box model, typography, borders, effects)
  const computeElementStyle = (elem: BuilderElement, isAbsolute: boolean = true): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};

    if (isAbsolute) {
      baseStyle.position = 'absolute';
      baseStyle.left = `${elem.x}%`;
      baseStyle.top = `${elem.y}%`;
      baseStyle.transform = `translate(-50%, -50%) rotate(${elem.rotation || 0}deg)`;
      baseStyle.zIndex = selectedElementId === elem.id ? 50 : elem.zIndex;
      baseStyle.cursor = previewMode ? 'default' : (elem.isLocked ? 'default' : 'grab');
    } else {
      if (elem.rotation) {
        baseStyle.transform = `rotate(${elem.rotation}deg)`;
      }
    }

    // Dimensions
    if (elem.width) {
      baseStyle.width = typeof elem.width === 'number' ? `${elem.width}px` : elem.width;
    }
    if (elem.height) {
      baseStyle.height = typeof elem.height === 'number' ? `${elem.height}px` : elem.height;
    }

    // Box Model: Margins
    if (elem.marginTop !== undefined) baseStyle.marginTop = `${elem.marginTop}px`;
    if (elem.marginRight !== undefined) baseStyle.marginRight = `${elem.marginRight}px`;
    if (elem.marginBottom !== undefined) baseStyle.marginBottom = `${elem.marginBottom}px`;
    if (elem.marginLeft !== undefined) baseStyle.marginLeft = `${elem.marginLeft}px`;

    // Box Model: Padding
    const pTop = elem.paddingTop ?? elem.padding;
    const pRight = elem.paddingRight ?? elem.padding;
    const pBottom = elem.paddingBottom ?? elem.padding;
    const pLeft = elem.paddingLeft ?? elem.padding;
    if (pTop !== undefined) baseStyle.paddingTop = `${pTop}px`;
    if (pRight !== undefined) baseStyle.paddingRight = `${pRight}px`;
    if (pBottom !== undefined) baseStyle.paddingBottom = `${pBottom}px`;
    if (pLeft !== undefined) baseStyle.paddingLeft = `${pLeft}px`;

    // Borders & Corners
    if (elem.borderStyle && elem.borderStyle !== 'none') {
      baseStyle.borderStyle = elem.borderStyle;
      baseStyle.borderWidth = `${elem.borderWidth ?? 1}px`;
      baseStyle.borderColor = elem.borderColor || settings.accentColor;
    }
    if (elem.borderRadius) {
      baseStyle.borderRadius = `${elem.borderRadius}px`;
    }

    // Backgrounds & Gradients
    if (elem.backgroundGradient && elem.backgroundGradient !== 'none') {
      baseStyle.backgroundImage = elem.backgroundGradient;
    } else if (elem.backgroundColor && elem.backgroundColor !== 'transparent') {
      baseStyle.backgroundColor = elem.backgroundColor;
    }

    // Visual Effects
    if (elem.boxShadow && elem.boxShadow !== 'none') {
      baseStyle.boxShadow = elem.boxShadow;
    }
    if (elem.opacity !== undefined) {
      baseStyle.opacity = elem.opacity;
    }

    // Typography
    if (elem.fontFamily) baseStyle.fontFamily = elem.fontFamily;
    if (elem.fontSize) baseStyle.fontSize = `${elem.fontSize}px`;
    if (elem.fontWeight) baseStyle.fontWeight = elem.fontWeight;
    if (elem.fontStyle) baseStyle.fontStyle = elem.fontStyle;
    if (elem.textAlign) baseStyle.textAlign = elem.textAlign;
    if (elem.textTransform) baseStyle.textTransform = elem.textTransform;
    if (elem.textDecoration) baseStyle.textDecoration = elem.textDecoration;
    if (elem.letterSpacing) baseStyle.letterSpacing = `${elem.letterSpacing}px`;
    if (elem.lineHeight) baseStyle.lineHeight = elem.lineHeight;
    if (elem.textColor) baseStyle.color = elem.textColor;

    return baseStyle;
  };

  // Render individual builder widget content
  const renderWidgetContent = (elem: BuilderElement) => {
    switch (elem.type) {
      case 'hotel_header':
        return (
          <HotelLogoDisplay
            hotelName={elem.content || 'WARWICK'}
            hotelSubtitle={elem.subContent || 'HOTEL AL BAHA • HOTELS & RESORTS'}
            hotelLogoUrl={elem.meta?.logoUrl}
            hotelLogoPreset={elem.meta?.logoPreset || 'warwick_crest'}
            showHotelLogo={elem.meta?.showLogo !== false}
            showFiveStars={elem.meta?.showStars !== false}
            accentColor={settings.accentColor}
            primaryColor={elem.textColor || settings.primaryColor}
            textColor={settings.textColor}
          />
        );

      case 'certificate_title':
        return (
          <div className="flex flex-col items-center">
            <h2
              className="font-extrabold uppercase drop-shadow-xs transition-all tracking-[0.22em]"
              style={{
                fontFamily: elem.fontFamily || "'Playfair Display', Georgia, serif",
                fontSize: `${elem.fontSize || 30}px`,
                color: elem.textColor || settings.primaryColor,
                letterSpacing: `${elem.letterSpacing || 4}px`
              }}
            >
              {elem.content}
            </h2>
            <div className="flex items-center justify-center gap-3 w-full my-1.5">
              <div className="h-[1.5px] w-20 rounded-full" style={{ background: settings.accentColor }} />
              <span className="text-xs" style={{ color: settings.accentColor }}>★ ★ ★</span>
              <div className="h-[1.5px] w-20 rounded-full" style={{ background: settings.accentColor }} />
            </div>
          </div>
        );

      case 'presentation_text':
        return (
          <p
            className="font-semibold uppercase tracking-[0.25em]"
            style={{
              fontFamily: elem.fontFamily || "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: `${elem.fontSize || 12}px`,
              color: elem.textColor || settings.textColor,
              letterSpacing: `${elem.letterSpacing || 3}px`,
              opacity: elem.opacity ?? 0.85
            }}
          >
            {elem.content}
          </p>
        );

      case 'recipient_name':
        return (
          <div className="relative inline-block px-6 py-0.5">
            <h1
              className="font-bold tracking-wide italic capitalize transition-all drop-shadow-sm"
              style={{
                fontFamily: elem.fontFamily || "'Playfair Display', Georgia, serif",
                fontSize: `${elem.fontSize || 38}px`,
                color: elem.textColor || settings.primaryColor
              }}
            >
              <RichTextRenderer text={resolveTokens(elem.content, '{{staff_name}}')} isBold isItalic />
            </h1>
            <div
              className="h-[2px] w-full rounded-full mx-auto mt-1"
              style={{
                background: `linear-gradient(to right, transparent, ${settings.accentColor}, transparent)`
              }}
            />
          </div>
        );

      case 'recipient_meta':
        return (
          <div
            className="flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-xs"
            style={{ color: elem.textColor || settings.primaryColor }}
          >
            <span>{resolveTokens(elem.content, '{{staff_position}}')}</span>
            <span style={{ color: settings.accentColor }}>•</span>
            <span>{resolveTokens(elem.subContent, '{{staff_department}}')}</span>
            {elem.meta?.awardPeriod && (
              <>
                <span style={{ color: settings.accentColor }}>•</span>
                <span className="font-bold" style={{ color: settings.accentColor }}>
                  {elem.meta.awardPeriod}
                </span>
              </>
            )}
          </div>
        );

      case 'citation':
        return (
          <div className="max-w-2xl mx-auto px-4">
            <p
              className="leading-relaxed font-serif italic"
              style={{
                fontSize: `${elem.fontSize || 14}px`,
                textAlign: elem.textAlign || 'center',
                color: elem.textColor || settings.textColor,
                lineHeight: elem.lineHeight || 1.6
              }}
            >
              "{resolveTokens(elem.content, '{{citation_paragraph}}')}"
            </p>
          </div>
        );

      case 'badge_seal':
        return (
          <CertificateSealMedal
            style={elem.meta?.badgeStyle || 'rosette'}
            accentColor={settings.accentColor}
            primaryColor={settings.primaryColor}
            badgeText={resolveTokens(elem.content, 'SEAL OF EXCELLENCE')}
            badgeSubtext={resolveTokens(elem.subContent, '')}
          />
        );

      case 'signatory_left':
      case 'signatory_right':
      case 'signatory_center':
        return (
          <div style={{ width: typeof elem.width === 'number' ? `${elem.width}px` : (elem.width || '190px') }}>
            <SignatoryBox
              title={elem.content || 'Executive'}
              name={elem.subContent || ''}
              signatureUrl={elem.imageUrl}
              lineColor={settings.accentColor}
              textColor={elem.textColor || settings.primaryColor}
            />
          </div>
        );

      case 'date_location':
        return (
          <div
            className="flex items-center justify-center gap-3 text-xs font-semibold tracking-wider"
            style={{ color: elem.textColor || settings.textColor, opacity: elem.opacity ?? 0.8 }}
          >
            <span>📅 {elem.content}</span>
            <span style={{ color: settings.accentColor }}>•</span>
            <span>📍 {elem.subContent}</span>
          </div>
        );

      case 'cert_number':
        return (
          <div
            className="font-mono text-[10px] tracking-widest uppercase font-bold"
            style={{ color: elem.textColor || settings.primaryColor, opacity: elem.opacity ?? 0.75 }}
          >
            CERT ID: #{elem.content}
          </div>
        );

      case 'qr_code':
        return (
          <div className="p-1.5 rounded-lg bg-white shadow-md border border-slate-200 flex flex-col items-center">
            <svg viewBox="0 0 100 100" className="w-14 h-14" fill={settings.primaryColor}>
              <path d="M10 10 h30 v30 h-30 z M15 15 v20 h20 v-20 z M20 20 h10 v10 h-10 z" />
              <path d="M60 10 h30 v30 h-30 z M65 15 v20 h20 v-20 z M70 20 h10 v10 h-10 z" />
              <path d="M10 60 h30 v30 h-30 z M15 65 v20 h20 v-20 z M20 70 h10 v10 h-10 z" />
              <rect x="50" y="50" width="10" height="10" />
              <rect x="70" y="60" width="10" height="20" />
              <rect x="60" y="80" width="20" height="10" />
            </svg>
            <span className="text-[8px] font-mono text-slate-600 mt-0.5">VERIFY</span>
          </div>
        );

      case 'hotel_crest_embossed':
        return (
          <div className="flex flex-col items-center select-none">
            <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-md" fill="none">
              <circle cx="50" cy="50" r="46" stroke={settings.accentColor} strokeWidth="3" fill={`${settings.primaryColor}10`} />
              <circle cx="50" cy="50" r="38" stroke={settings.accentColor} strokeWidth="1" strokeDasharray="3 3" />
              {/* Heraldic Crown */}
              <path d="M 32 60 L 30 42 L 40 50 L 50 35 L 60 50 L 70 42 L 68 60 Z" fill={settings.accentColor} />
              <rect x="32" y="62" width="36" height="4" rx="2" fill={settings.accentColor} />
              <circle cx="50" cy="32" r="3" fill={settings.accentColor} />
              <circle cx="30" cy="39" r="2.5" fill={settings.accentColor} />
              <circle cx="70" cy="39" r="2.5" fill={settings.accentColor} />
            </svg>
            <span
              className="text-[10px] font-black tracking-[0.3em] uppercase mt-1"
              style={{ color: settings.accentColor, fontFamily: "'Cinzel', Georgia, serif" }}
            >
              {elem.content || 'WARWICK'}
            </span>
          </div>
        );

      case 'five_stars':
        return (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-amber-400 text-amber-500 drop-shadow-xs"
                style={{ color: settings.accentColor }}
              />
            ))}
          </div>
        );

      case 'hotel_subtitle':
        return (
          <p
            className="font-bold tracking-[0.3em] uppercase text-center"
            style={{
              fontFamily: elem.fontFamily || "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: `${elem.fontSize || 11}px`,
              color: elem.textColor || settings.accentColor,
              letterSpacing: `${elem.letterSpacing || 4}px`
            }}
          >
            {elem.content || 'HOTEL AL BAHA • HOTELS & RESORTS'}
          </p>
        );

      case 'department_badge':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full uppercase font-bold tracking-widest text-[10px] border shadow-xs"
            style={{
              color: elem.textColor || settings.accentColor,
              borderColor: elem.borderColor || settings.accentColor,
              backgroundColor: elem.backgroundColor || `${settings.accentColor}10`
            }}
          >
            <Award className="w-3 h-3" />
            <span>{elem.content || 'DEPARTMENT OF EXCELLENCE'}</span>
          </div>
        );

      case 'award_subtitle':
        return (
          <p
            className="font-bold uppercase tracking-[0.25em] text-center"
            style={{
              fontFamily: elem.fontFamily || "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: `${elem.fontSize || 12}px`,
              color: elem.textColor || settings.accentColor,
              letterSpacing: `${elem.letterSpacing || 3}px`
            }}
          >
            {elem.content}
          </p>
        );

      case 'arabic_bismillah':
        return (
          <div className="text-center py-1">
            <span
              className="text-lg leading-relaxed drop-shadow-xs font-serif"
              style={{
                color: elem.textColor || settings.accentColor,
                fontFamily: "'Amiri', 'Traditional Arabic', serif"
              }}
            >
              {elem.content || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
            </span>
          </div>
        );

      case 'honorary_ribbon_banner':
        return (
          <div
            className="px-6 py-1.5 rounded-sm shadow-md font-bold uppercase tracking-widest text-xs border text-center flex items-center justify-center gap-2"
            style={{
              backgroundColor: elem.backgroundColor || settings.primaryColor,
              borderColor: elem.borderColor || settings.accentColor,
              color: elem.textColor || '#ffffff'
            }}
          >
            <span>⚜</span>
            <span>{elem.content || 'HONORARY DISTINCTION'}</span>
            <span>⚜</span>
          </div>
        );

      case 'recipient_arabic_name':
        return (
          <h2
            dir="rtl"
            className="font-serif font-bold text-center drop-shadow-sm py-1"
            style={{
              fontSize: `${elem.fontSize || 28}px`,
              color: elem.textColor || settings.primaryColor,
              fontFamily: "'Amiri', 'Traditional Arabic', serif"
            }}
          >
            {elem.content || 'محمد أبو سعيد رضاي'}
          </h2>
        );

      case 'recipient_photo':
        return (
          <div className="relative flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center bg-slate-100"
              style={{ borderColor: settings.accentColor }}
            >
              {elem.imageUrl ? (
                <img src={elem.imageUrl} alt="Recipient" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Crown className="w-6 h-6 text-amber-500 mb-1" />
                  <span className="text-[8px] font-bold uppercase">Staff Photo</span>
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase shadow-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              HONOREE
            </div>
          </div>
        );

      case 'recipient_badge_id':
        return (
          <div
            className="font-mono text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded border flex items-center gap-1"
            style={{
              color: elem.textColor || settings.textColor,
              borderColor: `${settings.accentColor}60`,
              backgroundColor: `${settings.accentColor}08`
            }}
          >
            <span>EMP ID:</span>
            <strong style={{ color: settings.primaryColor }}>{elem.content || '#WH-8042'}</strong>
          </div>
        );

      case 'service_duration':
        return (
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: elem.backgroundColor || settings.primaryColor }}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{elem.content || '5 YEARS OF SERVICE'}</span>
          </div>
        );

      case 'bullet_achievements':
        return (
          <div className="w-full px-4 text-left" style={{ width: typeof elem.width === 'number' ? `${elem.width}px` : (elem.width || '75%') }}>
            <ul className="space-y-1.5 text-xs" style={{ color: elem.textColor || settings.textColor }}>
              {(elem.items || [
                'Maintained an exceptional 99.4% quality inspection record',
                'Demonstrated leadership in VIP suite guest preparations',
                'Exemplified five-star Warwick standards of cordial hospitality'
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: settings.accentColor }} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'quote_box':
        return (
          <div
            className="w-full px-6 py-2.5 rounded-lg border-l-4 text-center font-serif italic relative"
            style={{
              borderColor: settings.accentColor,
              backgroundColor: `${settings.accentColor}06`,
              width: typeof elem.width === 'number' ? `${elem.width}px` : (elem.width || '70%')
            }}
          >
            <Quote className="w-5 h-5 mx-auto mb-1 opacity-30" style={{ color: settings.accentColor }} />
            <p className="text-xs leading-relaxed" style={{ color: elem.textColor || settings.primaryColor }}>
              "{elem.content || 'True hospitality is the silent devotion to perfection in every single detail.'}"
            </p>
            {elem.subContent && (
              <p className="text-[10px] font-sans font-bold tracking-wider uppercase mt-1 opacity-80" style={{ color: settings.accentColor }}>
                {elem.subContent}
              </p>
            )}
          </div>
        );

      case 'core_values_tag':
        return (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(elem.items || ['EXCELLENCE', 'INTEGRITY', 'HOSPITALITY', 'DEVOTION']).map((val, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border"
                style={{
                  color: settings.accentColor,
                  borderColor: `${settings.accentColor}50`,
                  backgroundColor: `${settings.accentColor}08`
                }}
              >
                {val}
              </span>
            ))}
          </div>
        );

      case 'signatory_witness':
        return (
          <div style={{ width: typeof elem.width === 'number' ? `${elem.width}px` : (elem.width || '190px') }}>
            <SignatoryBox
              title={elem.content || 'Witness / Safety Officer'}
              name={elem.subContent || 'Capt. Tariq Al-Zahrani'}
              signatureUrl={elem.imageUrl}
              lineColor={settings.accentColor}
              textColor={elem.textColor || settings.primaryColor}
            />
          </div>
        );

      case 'digital_stamp':
        return (
          <div
            className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 text-center font-bold tracking-wider select-none shadow-xs"
            style={{
              borderColor: elem.meta?.stampColor || '#dc2626',
              color: elem.meta?.stampColor || '#dc2626',
              transform: `rotate(${elem.meta?.rotation || -12}deg)`
            }}
          >
            <div className="w-full h-full rounded-full border border-current flex flex-col items-center justify-center p-1">
              <span className="text-[8px] tracking-widest uppercase">★ WARWICK ★</span>
              <span className="text-[9px] font-black uppercase my-0.5 leading-tight">{elem.content || 'OFFICIALLY APPROVED'}</span>
              <span className="text-[7px] font-mono tracking-widest">{elem.subContent || 'HOTELS & RESORTS'}</span>
            </div>
          </div>
        );

      case 'signature_date':
        return (
          <div
            className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider"
            style={{ color: elem.textColor || settings.textColor }}
          >
            <span>📅 {elem.content || '15 September 2026'}</span>
            <span style={{ color: settings.accentColor }}>•</span>
            <span>📍 {elem.subContent || 'Al Baha, Saudi Arabia'}</span>
          </div>
        );

      case 'gold_foil_seal':
        return (
          <div className="relative flex flex-col items-center select-none">
            <div
              className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-center shadow-lg border-2"
              style={{
                background: `radial-gradient(circle, #fef08a 0%, ${settings.accentColor} 70%, #854d0e 100%)`,
                borderColor: '#fef08a'
              }}
            >
              <Award className="w-6 h-6 text-slate-900 drop-shadow-xs" />
              <span className="text-[7px] font-black text-slate-950 uppercase tracking-wider leading-none mt-0.5">
                24K GOLD
              </span>
            </div>
            {/* Satin Ribbons */}
            <div className="flex justify-center -mt-1 gap-1">
              <div className="w-3 h-5 bg-amber-600 rounded-b-xs shadow-xs -rotate-12" />
              <div className="w-3 h-5 bg-amber-600 rounded-b-xs shadow-xs rotate-12" />
            </div>
          </div>
        );

      case 'laurel_crest':
        return (
          <div className="flex flex-col items-center select-none py-1">
            <svg viewBox="0 0 120 70" className="w-24 h-14" fill="none">
              <path
                d="M 20 60 C 10 30 35 15 60 15 C 85 15 110 30 100 60"
                stroke={settings.accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="60" cy="15" r="4" fill={settings.accentColor} />
              <path d="M 52 35 L 60 25 L 68 35 Z" fill={settings.accentColor} />
            </svg>
            <span className="text-[9px] font-bold tracking-widest uppercase -mt-2" style={{ color: settings.accentColor }}>
              {elem.content || 'IMPERIAL MERIT'}
            </span>
          </div>
        );

      case 'star_burst_medal':
        return (
          <div className="flex flex-col items-center select-none">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md border"
              style={{
                backgroundColor: settings.primaryColor,
                borderColor: settings.accentColor
              }}
            >
              <Star className="w-7 h-7 fill-amber-400 text-amber-400 drop-shadow-sm" />
            </div>
            <span className="text-[8px] font-black tracking-widest uppercase mt-1" style={{ color: settings.accentColor }}>
              {elem.content || 'STAR OF MERIT'}
            </span>
          </div>
        );

      case 'shield_medal':
        return (
          <div className="flex flex-col items-center select-none">
            <div
              className="w-14 h-16 flex items-center justify-center rounded-b-2xl shadow-md border-2"
              style={{
                backgroundColor: settings.primaryColor,
                borderColor: settings.accentColor
              }}
            >
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <span className="text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: settings.accentColor }}>
              {elem.content || 'SHIELD OF VALOR'}
            </span>
          </div>
        );

      case 'barcode_strip':
        return (
          <div className="flex flex-col items-center p-1 bg-white/90 rounded border border-slate-300 shadow-xs">
            <div className="flex items-center gap-[2px] h-6 px-1">
              {[3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (
                <div key={i} className="bg-slate-950 h-full" style={{ width: `${w}px` }} />
              ))}
            </div>
            <span className="text-[8px] font-mono tracking-widest text-slate-700 mt-0.5">
              {elem.content || 'WARWICK-8042-2026'}
            </span>
          </div>
        );

      case 'watermark_text':
        return (
          <div
            className="font-black tracking-[0.4em] uppercase select-none pointer-events-none"
            style={{
              fontSize: `${elem.fontSize || 48}px`,
              color: elem.textColor || settings.primaryColor,
              opacity: elem.opacity ?? 0.06,
              transform: `rotate(${elem.rotation || -30}deg)`
            }}
          >
            {elem.content || 'WARWICK OFFICIAL VERIFIED'}
          </div>
        );

      case 'security_microtext':
        return (
          <div
            className="font-mono text-[7px] tracking-widest uppercase text-center select-none w-full truncate"
            style={{
              color: elem.textColor || settings.accentColor,
              opacity: elem.opacity ?? 0.6
            }}
          >
            {elem.content || 'WARWICK LUXURY HOTELS AND RESORTS • OFFICIAL ISSUANCE • VERIFIED RECORD • SECURE DOCUMENT •'}
          </div>
        );

      case 'corner_accents':
        return (
          <div className="pointer-events-none w-full h-full">
            <div className="text-center font-serif text-xs font-bold" style={{ color: settings.accentColor }}>
              ⚜ ORNAMENTAL CORNER FLOURISHES ⚜
            </div>
          </div>
        );

      case 'gold_chain_divider':
        return (
          <div className="flex items-center justify-center gap-1.5 w-full my-1">
            <div className="h-[1px] flex-1" style={{ backgroundColor: settings.accentColor }} />
            <div className="flex items-center gap-1 text-[8px]" style={{ color: settings.accentColor }}>
              ◆ ◆ ◆
            </div>
            <div className="h-[1px] flex-1" style={{ backgroundColor: settings.accentColor }} />
          </div>
        );

      case 'geometric_frame_accent':
        return (
          <div className="flex items-center justify-center gap-2" style={{ color: settings.accentColor }}>
            <span>◇</span>
            <div className="w-8 h-[1px]" style={{ backgroundColor: settings.accentColor }} />
            <span>◆</span>
            <div className="w-8 h-[1px]" style={{ backgroundColor: settings.accentColor }} />
            <span>◇</span>
          </div>
        );

      case 'custom_image':
        return (
          <div className="rounded border shadow-md overflow-hidden bg-white/50 p-1" style={{ borderColor: settings.accentColor }}>
            <img
              src={elem.imageUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200'}
              alt="Custom Element"
              className="object-contain max-h-24 max-w-24 rounded"
            />
          </div>
        );

      case 'asset_icon': {
        const IconComponent = (LucideIcons as any)[elem.iconName || 'Award'] || Award;
        return (
          <div className="flex items-center justify-center p-1">
            <IconComponent
              style={{
                width: `${elem.fontSize || 36}px`,
                height: `${elem.fontSize || 36}px`,
                color: elem.textColor || settings.accentColor,
                filter: elem.textShadow && elem.textShadow !== 'none' ? `drop-shadow(${elem.textShadow})` : undefined
              }}
            />
          </div>
        );
      }

      case 'container_grid': {
        const cfg = elem.containerConfig || {
          direction: 'row',
          layoutMode: 'flex',
          columns: 2,
          columnRatios: 'equal',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center'
        };

        const colCount = cfg.columns || 2;
        const getColWidth = (colIdx: number) => {
          if (cfg.direction === 'column') return '100%';
          if (cfg.columnRatios === '30-70') return colIdx === 0 ? '30%' : '70%';
          if (cfg.columnRatios === '70-30') return colIdx === 0 ? '70%' : '30%';
          if (cfg.columnRatios === '25-50-25') return colIdx === 1 ? '50%' : '25%';
          return `${100 / colCount}%`;
        };

        return (
          <div
            className="w-full h-full flex transition-all relative"
            style={{
              flexDirection: cfg.direction || 'row',
              justifyContent: cfg.justifyContent || 'space-between',
              alignItems: cfg.alignItems || 'center',
              gap: `${cfg.gap ?? 16}px`,
              width: elem.width ? (typeof elem.width === 'number' ? `${elem.width}px` : elem.width) : '100%',
              minHeight: '64px'
            }}
          >
            {Array.from({ length: colCount }).map((_, colIdx) => {
              const slotElements = elements.filter(
                (el) => el.isVisible && el.containerId === elem.id && (el.columnSlotIndex ?? 0) === colIdx
              );

              return (
                <div
                  key={colIdx}
                  style={{ width: getColWidth(colIdx) }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition min-h-[60px] ${
                    !previewMode
                      ? 'border border-dashed border-sky-500/30 hover:border-sky-400/70 bg-sky-950/10'
                      : ''
                  }`}
                >
                  {slotElements.length > 0 ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      {slotElements.map((child) => {
                        const isChildSelected = selectedElementId === child.id;
                        return (
                          <div
                            key={child.id}
                            onMouseDown={(e) => {
                              if (previewMode) return;
                              e.stopPropagation();
                              onSelectElement(child.id);
                            }}
                            onTouchStart={(e) => {
                              if (previewMode) return;
                              e.stopPropagation();
                              onSelectElement(child.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!previewMode) {
                                onSelectElement(child.id);
                              }
                            }}
                            style={computeElementStyle(child, false)}
                            className={`transition-all rounded cursor-pointer ${
                              !previewMode && isChildSelected
                                ? 'ring-2 ring-amber-400 shadow-md'
                                : !previewMode
                                ? 'hover:ring-1 hover:ring-sky-400'
                                : ''
                            }`}
                          >
                            {renderWidgetContent(child)}
                          </div>
                        );
                      })}
                    </div>
                  ) : !previewMode ? (
                    <div className="text-center p-2 text-[10px] text-sky-400/70 font-mono flex items-center gap-1">
                      <LayoutGrid className="w-3 h-3" />
                      <span>Col {colIdx + 1} ({getColWidth(colIdx)})</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      }

      case 'custom_heading':
        return (
          <h3
            className="font-bold tracking-wide"
            style={{
              fontFamily: elem.fontFamily || "'Playfair Display', Georgia, serif",
              fontSize: `${elem.fontSize || 22}px`,
              color: elem.textColor || settings.primaryColor,
              textAlign: elem.textAlign || 'center'
            }}
          >
            {elem.content || 'Custom Heading'}
          </h3>
        );

      case 'custom_text':
      default:
        return (
          <p
            style={{
              fontFamily: elem.fontFamily || "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: `${elem.fontSize || 13}px`,
              color: elem.textColor || settings.textColor,
              textAlign: elem.textAlign || 'center',
              lineHeight: elem.lineHeight || 1.5
            }}
          >
            {elem.content || 'Custom Text Block'}
          </p>
        );
    }
  };

  const canvasWidth = settings.orientation === 'portrait' ? 700 : 1000;
  const canvasHeight = settings.orientation === 'portrait' ? 1000 : 700;

  return (
    <div
      onClick={(e) => {
        // Only deselect if clicked directly on the dark workspace canvas background
        if (e.target === e.currentTarget) {
          onSelectElement(null);
        }
      }}
      className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative select-none touch-pan-x touch-pan-y"
    >
      {/* Scaled Responsive Wrapper to keep bounding box matching zoom level */}
      <div
        style={{
          width: `${Math.round(canvasWidth * zoomLevel)}px`,
          height: `${Math.round(canvasHeight * zoomLevel)}px`,
          transition: draggingId ? 'none' : 'width 0.15s ease-out, height 0.15s ease-out',
        }}
        className="relative flex items-center justify-center shrink-0 my-auto mx-auto"
      >
        <div
          ref={containerRef}
          id="generator-certificate-container"
          data-certificate-root="true"
          onClick={(e) => {
            // If clicked directly on the certificate paper background, deselect active element
            if (e.target === e.currentTarget) {
              onSelectElement(null);
            }
          }}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: draggingId ? 'none' : 'transform 0.15s ease-out',
            backgroundColor: settings.backgroundColor,
            color: settings.textColor
          }}
          className="relative shadow-2xl overflow-hidden box-border shrink-0 print:shadow-none"
        >
        {/* Grid Overlay Guide */}
        {showGrid && !previewMode && (
          <div
            className="absolute inset-0 pointer-events-none z-40 opacity-25"
            style={{
              backgroundImage: 'linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-sky-500/50" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sky-500/50" />
          </div>
        )}

        {/* Custom Uploaded Background Image */}
        {settings.backgroundImage && (
          <img
            src={settings.backgroundImage}
            alt="Certificate Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        )}

        {/* Luxury Background Guilloche Texture */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 60%, ${settings.primaryColor}15 100%), linear-gradient(135deg, ${settings.accentColor}08 25%, transparent 25%), linear-gradient(225deg, ${settings.accentColor}08 25%, transparent 25%)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px'
          }}
        />

        {/* Watermark */}
        {settings.showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
            style={{ opacity: settings.watermarkOpacity }}
          >
            <svg viewBox="0 0 300 300" className="w-[420px] h-[420px]" fill={settings.primaryColor}>
              <circle cx="150" cy="150" r="130" stroke={settings.primaryColor} strokeWidth="8" fill="none" />
              <path d="M 100 90 L 150 180 L 200 90 L 230 220 L 70 220 Z" />
            </svg>
          </div>
        )}

        {/* Luxury Border */}
        {renderBorder()}

        {/* Render Builder Elements */}
        {elements
          .filter(el => el.isVisible && !el.containerId)
          .map(elem => {
            const isSelected = selectedElementId === elem.id;
            const isCurrentlyDragging = draggingId === elem.id;

            return (
              <div
                key={elem.id}
                id={`builder-element-${elem.id}`}
                onMouseDown={(e) => handleMouseDown(e, elem)}
                onTouchStart={(e) => handleTouchStart(e, elem)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!previewMode) {
                    onSelectElement(elem.id);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(elem.id);
                }}
                style={computeElementStyle(elem, true)}
                className={`group transition-shadow cursor-pointer ${
                  !previewMode && isSelected
                    ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-transparent shadow-lg'
                    : !previewMode
                    ? 'hover:ring-1 hover:ring-sky-400/60'
                    : ''
                }`}
              >
                {/* Elementor Action Toolbar (When Selected) */}
                {!previewMode && isSelected && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-sky-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md pointer-events-auto z-50 animate-fade-in"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {elem.isLocked ? (
                      <Lock className="w-3 h-3 text-amber-300" />
                    ) : (
                      <Move className="w-3 h-3 cursor-grab" />
                    )}
                    <span className="truncate max-w-[120px]">{elem.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement(elem.id, { isLocked: !elem.isLocked });
                      }}
                      className={`p-0.5 rounded transition ${
                        elem.isLocked ? 'bg-amber-500 text-slate-950 font-black' : 'hover:bg-sky-700 text-white'
                      }`}
                      title={elem.isLocked ? 'Unlock element' : 'Lock element position'}
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </button>
                    {onCopyElement && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyElement(elem.id);
                        }}
                        className="p-0.5 hover:bg-sky-700 rounded transition"
                        title="Copy (Ctrl+C)"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {onCutElement && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCutElement(elem.id);
                        }}
                        className="p-0.5 hover:bg-sky-700 rounded transition text-rose-200"
                        title="Cut (Ctrl+X)"
                      >
                        <Scissors className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(elem.id);
                      }}
                      className="p-0.5 hover:bg-sky-700 rounded transition"
                      title="Duplicate (Ctrl+D)"
                    >
                      <Copy className="w-2.5 h-2.5 opacity-80" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(elem.id);
                      }}
                      className="p-0.5 hover:bg-rose-600 rounded transition"
                      title="Delete (Del / Backspace)"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Inline Editing Support */}
                {editingTextId === elem.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={elem.content || ''}
                    onChange={(e) => onUpdateElement(elem.id, { content: e.target.value })}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTextId(null);
                    }}
                    className="px-2 py-1 bg-white/95 text-slate-900 border border-sky-500 rounded font-semibold text-center shadow-lg focus:outline-hidden"
                  />
                ) : (
                  renderWidgetContent(elem)
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
