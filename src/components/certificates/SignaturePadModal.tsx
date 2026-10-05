import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  RotateCcw,
  Check,
  PenTool,
  Upload,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Feather,
  ZoomIn,
  ZoomOut,
  Sliders,
  Move,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crop,
  Maximize2,
  RotateCw,
  Palette,
  Scissors,
  Wand2,
  Clock,
  History,
  Search,
  AlertCircle,
  Hand,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { RecentUserSignature } from '../../types';
import { api } from '../../lib/api';
import { SignatureCropModal, CropRect } from './SignatureCropModal';
import {
  getRecentSignatures,
  saveRecentSignature,
  deleteRecentSignature,
  clearAllRecentSignatures,
  syncRecentSignatures,
  RECENT_SIGNATURES_EVENT
} from './recentSignaturesService';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  currentSignature?: string;
  signatoryTitle?: string;
  signatoryName?: string;
  initialMode?: 'upload' | 'draw' | 'recent';
}

interface Point {
  x: number;
  y: number;
}

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PEN_COLORS = [
  { label: 'Executive Navy', value: '#0b1b2d', colorClass: 'bg-[#0b1b2d]' },
  { label: 'Royal Blue', value: '#1d4ed8', colorClass: 'bg-blue-700' },
  { label: 'Luxury Gold', value: '#9a7016', colorClass: 'bg-amber-600' },
  { label: 'Fountain Black', value: '#000000', colorClass: 'bg-black' }
];

const INK_PRESETS = [
  { label: 'Original Ink', value: 'original', bgClass: 'bg-slate-200 text-slate-800' },
  { label: 'Navy Blue', value: '#0b1b2d', bgClass: 'bg-[#0b1b2d] text-white' },
  { label: 'Deep Black', value: '#111827', bgClass: 'bg-slate-900 text-white' },
  { label: 'Royal Blue', value: '#1d4ed8', bgClass: 'bg-blue-700 text-white' },
  { label: 'Luxury Gold', value: '#9a7016', bgClass: 'bg-amber-600 text-white' }
];

const PEN_WIDTHS = [
  { label: 'Fine', value: 1.8 },
  { label: 'Medium', value: 2.8 },
  { label: 'Broad', value: 4.2 }
];

/**
 * Automatically detects dark ink bounding box on an image to strip away empty paper borders
 */
const detectInkBoundingBox = (
  image: HTMLImageElement,
  threshold: number = 210
): CropBounds | null => {
  const maxDim = 800;
  let scale = 1;
  if (image.width > maxDim || image.height > maxDim) {
    scale = maxDim / Math.max(image.width, image.height);
  }
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, w, h);
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    let foundInk = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 30) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < threshold) {
            foundInk = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }

    if (!foundInk || maxX <= minX || maxY <= minY) {
      return null;
    }

    // Add 6% margin padding
    const paddingX = Math.round((maxX - minX) * 0.06);
    const paddingY = Math.round((maxY - minY) * 0.06);

    const origX = Math.max(0, Math.round((minX - paddingX) / scale));
    const origY = Math.max(0, Math.round((minY - paddingY) / scale));
    const origW = Math.min(
      image.width - origX,
      Math.round((maxX - minX + paddingX * 2) / scale)
    );
    const origH = Math.min(
      image.height - origY,
      Math.round((maxY - minY + paddingY * 2) / scale)
    );

    return { x: origX, y: origY, width: origW, height: origH };
  } catch {
    return null;
  }
};

interface ProcessPhotoOptions {
  imageSrc: string;
  scalePercent: number; // e.g. 100
  scaleWidthPercent: number; // 50 - 200
  scaleHeightPercent: number; // 50 - 200
  offsetX: number;
  offsetY: number;
  rotationDeg: number;
  transparentBg: boolean;
  bgThreshold: number; // 150 - 245
  inkColor: string;
  cropBounds?: CropBounds | null;
}

/**
 * High-definition signature processor: scales, rotates, crops, recolors, and strips paper background
 */
const processUploadedSignature = (opts: ProcessPhotoOptions): Promise<string> => {
  return new Promise((resolve) => {
    if (!opts.imageSrc) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // High-res output canvas (600x200 standard aspect ratio for certificates)
      const targetWidth = 600;
      const targetHeight = 200;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(opts.imageSrc);
        return;
      }

      // Source image or cropped region
      const crop = opts.cropBounds;
      const srcX = crop ? Math.max(0, crop.x) : 0;
      const srcY = crop ? Math.max(0, crop.y) : 0;
      const srcW = crop && crop.width > 10 ? Math.min(img.width - srcX, crop.width) : img.width;
      const srcH = crop && crop.height > 10 ? Math.min(img.height - srcY, crop.height) : img.height;

      // Base fitted size inside 600x200
      const aspect = srcW / srcH;
      let drawW = targetWidth * 0.72;
      let drawH = drawW / aspect;

      if (drawH > targetHeight * 0.75) {
        drawH = targetHeight * 0.75;
        drawW = drawH * aspect;
      }

      // Multipliers: overall scale, width scale, height scale
      const overallFactor = Math.max(0.15, Math.min(opts.scalePercent / 100, 4.0));
      const widthFactor = Math.max(0.4, Math.min(opts.scaleWidthPercent / 100, 2.5));
      const heightFactor = Math.max(0.4, Math.min(opts.scaleHeightPercent / 100, 2.5));

      drawW = drawW * overallFactor * widthFactor;
      drawH = drawH * overallFactor * heightFactor;

      ctx.save();
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Rotation & Center
      const centerX = targetWidth / 2 + opts.offsetX;
      const centerY = targetHeight / 2 + opts.offsetY;

      ctx.translate(centerX, centerY);
      if (opts.rotationDeg !== 0) {
        ctx.rotate((opts.rotationDeg * Math.PI) / 180);
      }

      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcW,
        srcH,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );

      ctx.restore();

      // Transparency & Ink enhancement
      if (opts.transparentBg || (opts.inkColor && opts.inkColor !== 'original')) {
        try {
          const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imgData.data;

          // Target ink color if specified
          let targetR = 15,
            targetG = 23,
            targetB = 42; // Deep executive slate
          const shouldRecolor = Boolean(opts.inkColor && opts.inkColor !== 'original');
          if (shouldRecolor && opts.inkColor) {
            if (opts.inkColor.startsWith('#')) {
              const hex = opts.inkColor.slice(1);
              if (hex.length === 6) {
                targetR = parseInt(hex.substring(0, 2), 16);
                targetG = parseInt(hex.substring(2, 4), 16);
                targetB = parseInt(hex.substring(4, 6), 16);
              }
            }
          }

          // Sample paper background:
          // Find dominant background paper color and brightness across perimeter margins
          let sumBgR = 0,
            sumBgG = 0,
            sumBgB = 0,
            countBg = 0;
          const lumSamples: number[] = [];

          for (let y = 0; y < targetHeight; y += 3) {
            for (let x = 0; x < targetWidth; x += 3) {
              const idx = (y * targetWidth + x) * 4;
              const a = data[idx + 3];
              if (a > 30) {
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                lumSamples.push(lum);

                // Perimeter margins are almost exclusively paper background
                if (x < 25 || x > targetWidth - 25 || y < 15 || y > targetHeight - 15) {
                  sumBgR += r;
                  sumBgG += g;
                  sumBgB += b;
                  countBg++;
                }
              }
            }
          }

          lumSamples.sort((a, b) => a - b);
          // 85th percentile of brightness gives the true paper background brightness
          const p85Lum = lumSamples.length > 0 ? lumSamples[Math.floor(lumSamples.length * 0.85)] : 235;

          const refR = countBg > 0 ? sumBgR / countBg : 240;
          const refG = countBg > 0 ? sumBgG / countBg : 240;
          const refB = countBg > 0 ? sumBgB / countBg : 240;
          const refLum = 0.299 * refR + 0.587 * refG + 0.114 * refB;

          // Estimate the true paper background luminance (bound between 165 and 255)
          const paperBgLum = Math.max(165, Math.min(255, Math.max(p85Lum, refLum)));
          // Cutoff point: anything within 22 of the paper background is 100% paper
          const bgCutoff = paperBgLum - 22;
          // Full ink darkness: anything 75+ darker than paper background is solid ink
          const solidInkLum = Math.max(20, paperBgLum - 75);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 0) {
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              const colorDistToPaper = Math.hypot(r - refR, g - refG, b - refB);

              if (opts.transparentBg) {
                // If it matches paper luminance or is close to background paper color
                if (lum >= bgCutoff || (colorDistToPaper < 32 && lum > paperBgLum - 45)) {
                  data[i + 3] = 0; // Pure 100% transparent background!
                  continue;
                }

                // If darkness is very slight (faint paper shadow / paper fiber)
                const darkness = paperBgLum - lum;
                if (darkness < 22) {
                  data[i + 3] = 0; // Transparent paper shadow
                  continue;
                }

                // Smooth anti-aliased ink stroke edge
                const inkFactor = Math.min(1.0, (darkness - 22) / Math.max(1, paperBgLum - solidInkLum - 22));
                const calculatedAlpha = Math.round(255 * (0.35 + 0.65 * inkFactor));
                data[i + 3] = Math.min(a, calculatedAlpha);
              }

              // Ink Enhancement & Recoloring
              if (data[i + 3] > 0) {
                if (shouldRecolor) {
                  data[i] = targetR;
                  data[i + 1] = targetG;
                  data[i + 2] = targetB;
                } else {
                  // Natural ink enhancement
                  // Check if it's blue ink
                  if (b > r + 12 && b > g) {
                    data[i] = Math.max(10, Math.round(r * 0.75));
                    data[i + 1] = Math.max(25, Math.round(g * 0.8));
                    data[i + 2] = Math.min(225, Math.round(b * 1.15));
                  } else {
                    // Deep rich black/dark charcoal ink
                    const lumFactor = Math.min(1.0, lum / Math.max(1, paperBgLum - 30));
                    data[i] = Math.round(r * lumFactor * 0.65);
                    data[i + 1] = Math.round(g * lumFactor * 0.65);
                    data[i + 2] = Math.round(b * lumFactor * 0.7);
                  }
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
        } catch {
          // If browser restricts pixel manipulation on foreign domains
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(opts.imageSrc);
    };

    img.src = opts.imageSrc;
  });
};

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  currentSignature,
  signatoryTitle = 'General Manager',
  signatoryName = 'Dr. Faisal Al-Ghamdi',
  initialMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'upload' | 'draw' | 'recent'>(initialMode || 'recent');

  // Recent User Signatures State
  const [recentSignatures, setRecentSignatures] = useState<RecentUserSignature[]>([]);
  const [selectedRecentId, setSelectedRecentId] = useState<string | null>(null);
  const [searchRecentQuery, setSearchRecentQuery] = useState<string>('');

  // Drawing state
  const [penColor, setPenColor] = useState<string>('#0b1b2d');
  const [penWidth, setPenWidth] = useState<number>(2.8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Overall Signature State
  const [hasSignature, setHasSignature] = useState<boolean>(Boolean(currentSignature));
  const [previewDataUrl, setPreviewDataUrl] = useState<string>(currentSignature || '');
  const [uploadedRawImage, setUploadedRawImage] = useState<string>(currentSignature || '');

  // Photo Signature Resizing & Fine-tuning State
  const [photoScale, setPhotoScale] = useState<number>(100);
  const [scaleWidth, setScaleWidth] = useState<number>(100);
  const [scaleHeight, setScaleHeight] = useState<number>(100);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [bgThreshold, setBgThreshold] = useState<number>(210);
  const [inkColor, setInkColor] = useState<string>('original');
  const [cropBounds, setCropBounds] = useState<CropBounds | null>(null);

  // AI Verification State for Uploaded Photo Signatures
  const [isVerifyingSignature, setIsVerifyingSignature] = useState<boolean>(false);
  const [signatureVerifyStatus, setSignatureVerifyStatus] = useState<'idle' | 'scanning' | 'verified' | 'rejected'>('idle');
  const [signatureVerifyMessage, setSignatureVerifyMessage] = useState<string>('');
  const [signatureConfidence, setSignatureConfidence] = useState<number | null>(null);
  const [detectedSignaturesList, setDetectedSignaturesList] = useState<Array<{ ymin: number; xmin: number; ymax: number; xmax: number; label?: string }>>([]);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  // Dragging interaction state on preview canvas
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);

  // Synchronize state when modal opens or currentSignature prop updates
  useEffect(() => {
    if (isOpen) {
      const existingSig = currentSignature || '';
      setPreviewDataUrl(existingSig);
      setUploadedRawImage(existingSig);
      setPhotoScale(100);
      setScaleWidth(100);
      setScaleHeight(100);
      setLockAspect(true);
      setPhotoOffsetX(0);
      setPhotoOffsetY(0);
      setRotationDeg(0);
      setRemoveBg(true);
      setBgThreshold(210);
      setInkColor('original');
      setCropBounds(null);
      setHasSignature(Boolean(existingSig));
      setStrokes([]);
      setCurrentStroke(null);
      setSelectedRecentId(null);
      setSearchRecentQuery('');
      setIsVerifyingSignature(false);
      setSignatureVerifyStatus(existingSig ? 'verified' : 'idle');
      setSignatureVerifyMessage('');
      setSignatureConfidence(null);

      // Load recent signatures from local and server
      const localSigs = getRecentSignatures();
      setRecentSignatures(localSigs);
      syncRecentSignatures().then((list) => {
        if (list && list.length > 0) setRecentSignatures(list);
      });

      if (initialMode) {
        setMode(initialMode);
      } else if (existingSig) {
        setMode('upload');
      } else if (localSigs.length > 0) {
        setMode('recent');
      } else {
        setMode('draw');
      }
    }
  }, [isOpen, currentSignature, initialMode]);

  // Real-time synchronization event listener
  useEffect(() => {
    const handleUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        setRecentSignatures(e.detail);
      } else {
        setRecentSignatures(getRecentSignatures());
      }
    };
    window.addEventListener(RECENT_SIGNATURES_EVENT, handleUpdated);
    return () => window.removeEventListener(RECENT_SIGNATURES_EVENT, handleUpdated);
  }, []);

  // Recalculate processed signature preview whenever sizing/controls update
  const refreshPhotoSignature = useCallback(
    async (override?: Partial<ProcessPhotoOptions>) => {
      const source = override?.imageSrc || uploadedRawImage || previewDataUrl;
      if (!source) return;

      const opts: ProcessPhotoOptions = {
        imageSrc: source,
        scalePercent: override?.scalePercent ?? photoScale,
        scaleWidthPercent: override?.scaleWidthPercent ?? scaleWidth,
        scaleHeightPercent: override?.scaleHeightPercent ?? scaleHeight,
        offsetX: override?.offsetX ?? photoOffsetX,
        offsetY: override?.offsetY ?? photoOffsetY,
        rotationDeg: override?.rotationDeg ?? rotationDeg,
        transparentBg: override?.transparentBg ?? removeBg,
        bgThreshold: override?.bgThreshold ?? bgThreshold,
        inkColor: override?.inkColor ?? inkColor,
        cropBounds: override?.cropBounds !== undefined ? override.cropBounds : cropBounds
      };

      const result = await processUploadedSignature(opts);
      setPreviewDataUrl(result);
      setHasSignature(true);
    },
    [
      uploadedRawImage,
      previewDataUrl,
      photoScale,
      scaleWidth,
      scaleHeight,
      photoOffsetX,
      photoOffsetY,
      rotationDeg,
      removeBg,
      bgThreshold,
      inkColor,
      cropBounds
    ]
  );

  // Setup canvas high-DPI scaling once when modal is opened in draw mode
  useEffect(() => {
    if (!isOpen || mode !== 'draw') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawAllStrokes(strokes, ctx);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, mode]);

  const redrawAllStrokes = (strokesToDraw: Stroke[], context?: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = context || canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Draw baseline guideline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 35);
    ctx.lineTo(rect.width - 30, rect.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw all completed strokes
    strokesToDraw.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      if (stroke.points.length > 1) {
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  // Validate finger signature quality and completeness
  const validateFingerSignature = (currentStrokes: Stroke[]): { valid: boolean; reason?: string } => {
    if (!currentStrokes || currentStrokes.length === 0) {
      return { valid: false, reason: 'স্বাক্ষর খালি — অনুগ্রহ করে আঙুল দিয়ে স্বাক্ষর করুন (Signature is empty).' };
    }
    let totalPoints = 0;
    let totalLength = 0;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const s of currentStrokes) {
      totalPoints += s.points.length;
      for (let i = 0; i < s.points.length; i++) {
        const p = s.points[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (i > 0) {
          totalLength += Math.hypot(p.x - s.points[i - 1].x, p.y - s.points[i - 1].y);
        }
      }
    }
    const w = maxX - minX;
    const h = maxY - minY;

    // Refuse if just an accidental tap, single dot, or tiny smudge
    if (totalPoints < 12 || w < 32 || h < 14 || totalLength < 50) {
      return {
        valid: false,
        reason: 'স্বাক্ষরটি খুব ছোট বা অসম্পূর্ণ। অনুগ্রহ করে আঙুল দিয়ে স্পষ্ট ও পূর্ণাঙ্গ স্বাক্ষর করুন (Signature is too short or incomplete).'
      };
    }
    return { valid: true };
  };

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return null;
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (e.cancelable) e.preventDefault();
    if ('pointerId' in e && canvasRef.current) {
      try {
        canvasRef.current.setPointerCapture((e as React.PointerEvent).pointerId);
      } catch {}
    }
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !currentStroke) return;
    if (e.cancelable) e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const newStroke = [...currentStroke, coords];
    setCurrentStroke(newStroke);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Smooth curve interpolation for natural finger calligraphy
    if (newStroke.length >= 3) {
      const pPrev = newStroke[newStroke.length - 2];
      const pPrevPrev = newStroke[newStroke.length - 3];
      const mid1 = { x: (pPrevPrev.x + pPrev.x) / 2, y: (pPrevPrev.y + pPrev.y) / 2 };
      const mid2 = { x: (pPrev.x + coords.x) / 2, y: (pPrev.y + coords.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(mid1.x, mid1.y);
      ctx.quadraticCurveTo(pPrev.x, pPrev.y, mid2.x, mid2.y);
      ctx.stroke();
    } else {
      const p1 = newStroke[newStroke.length - 2];
      const p2 = coords;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const stopDrawing = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (e && 'pointerId' in e && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture((e as React.PointerEvent).pointerId);
      } catch {}
    }
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    if (currentStroke.length >= 1) {
      const updated = [
        ...strokes,
        {
          points: currentStroke,
          color: penColor,
          width: penWidth
        }
      ];
      setStrokes(updated);
      setHasSignature(true);
      updateDrawingDataUrl(updated);
      redrawAllStrokes(updated);
    }
    setCurrentStroke(null);
  };

  const updateDrawingDataUrl = (currentStrokes: Stroke[]): string => {
    const canvas = canvasRef.current;
    if (!canvas || currentStrokes.length === 0) {
      setPreviewDataUrl('');
      return '';
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(rect.width * dpr, 400);
    offscreen.height = Math.max(rect.height * dpr, 160);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.scale(dpr, dpr);

    currentStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    });

    const dataUrl = offscreen.toDataURL('image/png');
    setPreviewDataUrl(dataUrl);
    setUploadedRawImage(dataUrl);
    return dataUrl;
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setHasSignature(false);
    setPreviewDataUrl('');
    setUploadedRawImage('');
    setPhotoScale(100);
    setScaleWidth(100);
    setScaleHeight(100);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setRotationDeg(0);
    setCropBounds(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawAllStrokes([], ctx);
      }
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawAllStrokes(newStrokes);
    const url = updateDrawingDataUrl(newStrokes);
    setUploadedRawImage(url);
    if (newStrokes.length === 0) {
      setHasSignature(false);
    }
  };

  // Convert drawing into photo editor so user can resize their hand-drawn signature
  const handleTransferDrawingToResizer = () => {
    if (!previewDataUrl && strokes.length > 0) {
      updateDrawingDataUrl(strokes);
    }
    setMode('upload');
    toast.info('Drawing loaded into Resizer tool! Use sliders below to make it smaller or larger.');
  };

  // Image Upload handler with AI Handwritten Signature Verification & Isolation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image (PNG, JPG, or SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (!res) return;

      setUploadedRawImage(res);
      setPhotoScale(100);
      setScaleWidth(100);
      setScaleHeight(100);
      setPhotoOffsetX(0);
      setPhotoOffsetY(0);
      setRotationDeg(0);
      setCropBounds(null);
      setIsVerifyingSignature(true);
      setSignatureVerifyStatus('scanning');
      setSignatureVerifyMessage('ডকুমেন্টে হ্যান্ডরাইটিন সিগনেচার যাচাই করা হচ্ছে...');

      try {
        // Call AI forensic verification endpoint
        const verifyRes = await api.extractHandwrittenSignature(res);

        if (verifyRes.allSignatures && verifyRes.allSignatures.length > 0) {
          setDetectedSignaturesList(verifyRes.allSignatures);
        } else if (verifyRes.boundingBox) {
          setDetectedSignaturesList([verifyRes.boundingBox]);
        } else {
          setDetectedSignaturesList([]);
        }

        if (!verifyRes.hasHandwrittenSignature) {
          setIsVerifyingSignature(false);
          setSignatureVerifyStatus('rejected');
          setSignatureVerifyMessage('হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)');
          setPreviewDataUrl('');
          setHasSignature(false);
          toast.error('হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)');
          return;
        }

        // Authentic handwritten signature confirmed!
        setSignatureVerifyStatus('verified');
        setSignatureVerifyMessage('✓ হ্যান্ডরাইটিন সিগনেচার সফলভাবে শনাক্ত ও আইসোলেট করা হয়েছে');
        if (typeof verifyRes.confidence === 'number') {
          setSignatureConfidence(verifyRes.confidence);
        }

        let calculatedCrop: CropBounds | null = null;
        if (verifyRes.boundingBox) {
          const testImg = new Image();
          testImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            testImg.onload = () => resolve();
            testImg.onerror = () => resolve();
            testImg.src = res;
          });

          if (testImg.naturalWidth > 0 && testImg.naturalHeight > 0) {
            const nw = testImg.naturalWidth;
            const nh = testImg.naturalHeight;
            const bb = verifyRes.boundingBox;
            const cropX = Math.max(0, Math.round((bb.xmin / 1000) * nw));
            const cropY = Math.max(0, Math.round((bb.ymin / 1000) * nh));
            const cropW = Math.min(nw - cropX, Math.round(((bb.xmax - bb.xmin) / 1000) * nw));
            const cropH = Math.min(nh - cropY, Math.round(((bb.ymax - bb.ymin) / 1000) * nh));

            if (cropW > 20 && cropH > 10) {
              calculatedCrop = { x: cropX, y: cropY, width: cropW, height: cropH };
              setCropBounds(calculatedCrop);
            }
          }
        }

        // Automatic ink isolation removing paper background & machine printed text
        const processed = await processUploadedSignature({
          imageSrc: res,
          scalePercent: 100,
          scaleWidthPercent: 100,
          scaleHeightPercent: 100,
          offsetX: 0,
          offsetY: 0,
          rotationDeg: 0,
          transparentBg: true,
          bgThreshold: 215,
          inkColor: 'original',
          cropBounds: calculatedCrop
        });

        setPreviewDataUrl(processed);
        setHasSignature(true);
        setIsVerifyingSignature(false);
        toast.success('হ্যান্ডরাইটিন সিগনেচার সফলভাবে শনাক্ত ও ব্যাকগ্রাউন্ড টেক্সট অপসারিত হয়েছে!');
      } catch (err) {
        setIsVerifyingSignature(false);
        setSignatureVerifyStatus('rejected');
        setSignatureVerifyMessage('হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)');
        setPreviewDataUrl('');
        setHasSignature(false);
        toast.error('হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)');
      }
    };
    reader.readAsDataURL(file);
  };

  // Open visual Crop Studio modal
  const handleOpenCropModal = () => {
    if (!uploadedRawImage) {
      toast.info('অনুগ্রহ করে প্রথমে ছবি আপলোড করুন');
      return;
    }
    setIsCropModalOpen(true);
  };

  // Callback when user confirms crop from visual Crop Studio modal
  const handleApplyCropFromModal = async (crop: CropRect) => {
    if (!uploadedRawImage) return;
    setCropBounds(crop);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setPhotoScale(100);

    const processed = await processUploadedSignature({
      imageSrc: uploadedRawImage,
      scalePercent: 100,
      scaleWidthPercent: 100,
      scaleHeightPercent: 100,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      transparentBg: true,
      bgThreshold: bgThreshold || 215,
      inkColor,
      cropBounds: crop
    });

    setPreviewDataUrl(processed);
    setHasSignature(true);
    setSignatureVerifyStatus('verified');
    setSignatureVerifyMessage('✓ হ্যান্ডরাইটিন সিগনেচার সফলভাবে ক্রপ ও আইসোলেট করা হয়েছে');
    toast.success('স্বাক্ষর সফলভাবে ক্রপ ও ব্যাকগ্রাউন্ড টেক্সট অপসারিত হয়েছে!');
  };

  // Quick select an AI detected signature candidate from the document
  const handleSelectDetectedSignature = async (sig: { ymin: number; xmin: number; ymax: number; xmax: number }) => {
    if (!uploadedRawImage) return;
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      testImg.onload = () => resolve();
      testImg.onerror = () => resolve();
      testImg.src = uploadedRawImage;
    });

    if (testImg.naturalWidth > 0 && testImg.naturalHeight > 0) {
      const nw = testImg.naturalWidth;
      const nh = testImg.naturalHeight;
      const cropX = Math.max(0, Math.round((sig.xmin / 1000) * nw));
      const cropY = Math.max(0, Math.round((sig.ymin / 1000) * nh));
      const cropW = Math.min(nw - cropX, Math.round(((sig.xmax - sig.xmin) / 1000) * nw));
      const cropH = Math.min(nh - cropY, Math.round(((sig.ymax - sig.ymin) / 1000) * nh));

      const newBounds: CropBounds = { x: cropX, y: cropY, width: cropW, height: cropH };
      await handleApplyCropFromModal(newBounds);
    }
  };

  // Resize: Scale Change (Resize & Scale)
  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(20, Math.min(350, Math.round(newScale)));
    setPhotoScale(clamped);
    if (lockAspect) {
      setScaleWidth(100);
      setScaleHeight(100);
    }
    refreshPhotoSignature({ scalePercent: clamped });
  };

  // Aspect Ratio / Independent Width & Height scaling
  const handleWidthScaleChange = (val: number) => {
    const clamped = Math.max(40, Math.min(250, val));
    setScaleWidth(clamped);
    if (lockAspect) {
      setScaleHeight(clamped);
      refreshPhotoSignature({ scaleWidthPercent: clamped, scaleHeightPercent: clamped });
    } else {
      refreshPhotoSignature({ scaleWidthPercent: clamped });
    }
  };

  const handleHeightScaleChange = (val: number) => {
    const clamped = Math.max(40, Math.min(250, val));
    setScaleHeight(clamped);
    if (lockAspect) {
      setScaleWidth(clamped);
      refreshPhotoSignature({ scaleWidthPercent: clamped, scaleHeightPercent: clamped });
    } else {
      refreshPhotoSignature({ scaleHeightPercent: clamped });
    }
  };

  // Position Nudge
  const handleOffsetChange = (deltaX: number, deltaY: number) => {
    const newX = Math.max(-200, Math.min(200, photoOffsetX + deltaX));
    const newY = Math.max(-100, Math.min(100, photoOffsetY + deltaY));
    setPhotoOffsetX(newX);
    setPhotoOffsetY(newY);
    refreshPhotoSignature({ offsetX: newX, offsetY: newY });
  };

  // Rotation: 90 deg step or fine angle
  const handleRotateStep = (deltaDeg: number) => {
    const newRot = (rotationDeg + deltaDeg) % 360;
    setRotationDeg(newRot);
    refreshPhotoSignature({ rotationDeg: newRot });
  };

  const handleAngleChange = (newAngle: number) => {
    setRotationDeg(newAngle);
    refreshPhotoSignature({ rotationDeg: newAngle });
  };

  // Auto-Crop / Auto-Trim signature bounds
  const handleAutoTrimInk = () => {
    const src = uploadedRawImage || previewDataUrl;
    if (!src) return;

    setIsAutoDetecting(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const bounds = detectInkBoundingBox(img, bgThreshold);
      setIsAutoDetecting(false);
      if (bounds && bounds.width > 20 && bounds.height > 10) {
        setCropBounds(bounds);
        setPhotoOffsetX(0);
        setPhotoOffsetY(0);
        refreshPhotoSignature({
          cropBounds: bounds,
          offsetX: 0,
          offsetY: 0
        });
        toast.success('Signature isolated! Empty paper margins automatically removed.');
      } else {
        toast.info('Could not isolate ink boundary automatically. You can adjust zoom and position manually.');
      }
    };
    img.onerror = () => {
      setIsAutoDetecting(false);
      toast.error('Unable to scan image for auto-trim.');
    };
    img.src = src;
  };

  // Reset all size and position transformations
  const handleResetTransform = () => {
    setPhotoScale(100);
    setScaleWidth(100);
    setScaleHeight(100);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setRotationDeg(0);
    setCropBounds(null);
    setLockAspect(true);
    refreshPhotoSignature({
      scalePercent: 100,
      scaleWidthPercent: 100,
      scaleHeightPercent: 100,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      cropBounds: null
    });
    toast.info('Signature reset to standard 100% dimensions.');
  };

  // Interactive mouse/touch dragging to reposition photo signature
  const handleMouseDownPreview = (e: React.MouseEvent) => {
    setIsDraggingPhoto(true);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMovePreview = (e: React.MouseEvent) => {
    if (!isDraggingPhoto || !dragStartPoint) return;
    const dx = e.clientX - dragStartPoint.x;
    const dy = e.clientY - dragStartPoint.y;
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    handleOffsetChange(Math.round(dx * 1.2), Math.round(dy * 1.2));
  };

  const handleMouseUpPreview = () => {
    setIsDraggingPhoto(false);
    setDragStartPoint(null);
  };

  // Wheel zoom on preview canvas
  const handleWheelPreview = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleScaleChange(photoScale + 5);
    } else {
      handleScaleChange(photoScale - 5);
    }
  };

  // Select or Apply a Recent User Signature
  const handleSelectRecentSignature = (sig: RecentUserSignature, autoEmbed = false) => {
    setUploadedRawImage(sig.dataUrl);
    setPreviewDataUrl(sig.dataUrl);
    setPhotoScale(100);
    setScaleWidth(100);
    setScaleHeight(100);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setRotationDeg(0);
    setCropBounds(null);
    setHasSignature(true);
    setSelectedRecentId(sig.id);

    // Bump to top of recent list
    saveRecentSignature({
      dataUrl: sig.dataUrl,
      title: sig.title || signatoryTitle,
      name: sig.name || signatoryName,
      type: sig.type
    });

    if (autoEmbed) {
      onSaveSignature(sig.dataUrl);
      toast.success(`Signature applied for ${sig.title || signatoryTitle || 'Signatory'}!`);
      onClose();
    } else {
      toast.info('Signature loaded. You can embed it directly or adjust scale/ink in the Resizer.');
    }
  };

  // Final Save to certificate & save to Recent Signatures
  const handleSave = () => {
    if (mode === 'draw') {
      const validation = validateFingerSignature(strokes);
      if (!validation.valid) {
        toast.error(`❌ স্বাক্ষর প্রত্যাখ্যাত (Signature Refused): ${validation.reason || 'আঙুল দিয়ে স্পষ্ট ও পূর্ণাঙ্গ স্বাক্ষর করুন'}`);
        return;
      }
    }

    if (mode === 'upload' && signatureVerifyStatus === 'rejected') {
      toast.error('❌ হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)');
      return;
    }

    let finalDataUrl = previewDataUrl;
    if (!finalDataUrl && strokes.length > 0) {
      finalDataUrl = updateDrawingDataUrl(strokes);
    }
    if (!finalDataUrl) {
      toast.error('Please draw or upload a valid signature before saving.');
      return;
    }

    const sigType: 'pen' | 'upload' | 'digital' =
      mode === 'draw' ? 'pen' : mode === 'upload' ? 'upload' : 'digital';

    saveRecentSignature({
      dataUrl: finalDataUrl,
      title: signatoryTitle,
      name: signatoryName,
      type: sigType
    });

    onSaveSignature(finalDataUrl);
    toast.success('Signature successfully embedded into certificate and saved to Recent Signatures!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Executive Signature Studio</h3>
              <p className="text-[11px] text-slate-300">
                Official Signature & Resizing for <span className="text-amber-300 font-semibold">{signatoryTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              mode === 'upload'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Resize Photo</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">AI Detect</span>
          </button>

          <button
            type="button"
            id="tab-draw-with-fingers"
            onClick={() => setMode('draw')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              mode === 'draw'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-amber-600" />
            <span>Draw with Fingers</span>
            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Touch</span>
          </button>

          <button
            type="button"
            id="tab-recent-user-signatures"
            onClick={() => setMode('recent')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              mode === 'recent'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent User Signatures</span>
            {recentSignatures.length > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                {recentSignatures.length}
              </span>
            )}
          </button>
        </div>

        {/* Body Container */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* ======================================================== */}
          {/* TAB 1: UPLOAD & PHOTO RESIZER (MAIN USER FOCUS)           */}
          {/* ======================================================== */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Scanning status banner */}
              {isVerifyingSignature && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl flex items-center justify-between text-xs animate-pulse shadow-xs">
                  <div className="flex items-center gap-2.5 text-amber-900 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>AI ভেরিফিকেশন: ডকুমেন্টে হ্যান্ডরাইটিন সিগনেচার যাচাই ও ব্যাকগ্রাউন্ড টেক্সট অপসারণ করা হচ্ছে...</span>
                  </div>
                  <span className="text-[10.5px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Scanning
                  </span>
                </div>
              )}

              {/* Refusal / Not Found Error Banner */}
              {signatureVerifyStatus === 'rejected' && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex flex-col gap-2.5 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <span>হ্যান্ডরাইটিন সিগনেচার ইজ নট ফাউন্ড (Handwritten signature is not found)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px] border border-red-200 uppercase">
                      Rejected
                    </span>
                  </div>
                  <p className="text-red-700 leading-relaxed">
                    আপলোডকৃত ছবিতে কোনো পেন দিয়ে করা আসল হাতে লেখা স্বাক্ষর (Handwritten Signature) পাওয়া যায়নি। সাধারণ টাইপ করা কম্পিউটার টেক্সট, ডকুমেন্টের লেখা বা অপ্রাসঙ্গিক ছবি গ্রহণযোগ্য নয়।
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenCropModal}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="কাগজ বা ডকুমেন্ট থেকে নির্দিষ্ট সিগনেচার অংশ ম্যানুয়ালি ক্রপ করুন"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>ম্যানুয়ালি ক্রপ করুন (Crop Signature)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>অন্য ছবি আপলোড করুন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('draw')}
                      className="px-3.5 py-1.5 bg-white hover:bg-red-100 text-red-800 border border-red-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Hand className="w-3.5 h-3.5 text-red-600" />
                      <span>আঙুল দিয়ে আঁকুন (Draw with Fingers)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verified success banner */}
              {signatureVerifyStatus === 'verified' && uploadedRawImage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ হ্যান্ডরাইটিন সিগনেচার সফলভাবে শনাক্ত ও আইসোলেট করা হয়েছে</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleOpenCropModal}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-semibold text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                      title="Adjust crop rectangle"
                    >
                      <Crop className="w-3 h-3 text-emerald-700" />
                      <span>Adjust Crop</span>
                    </button>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Background Removed
                    </span>
                  </div>
                </div>
              )}

              {!uploadedRawImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-7 text-center cursor-pointer hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center space-y-2.5 group bg-slate-50/50"
                >
                  <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Upload Signature Photo / Document
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      কাগজে পেন দিয়ে করা স্বাক্ষরের ছবি আপলোড করুন (AI স্বয়ংক্রিয়ভাবে টাইপ করা টেক্সট বাদ দিয়ে কেবল আসল সিগনেচার শনাক্ত করবে)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[10.5px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                      ✨ AI Handwriting Detection & Verification
                    </span>
                    <span className="text-[10.5px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                      🔍 Clean Transparent Ink
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Active Photo Controls Header */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Photo Signature Active</div>
                        <div className="text-[10.5px] text-slate-500">
                          Use controls below to scale, position & enhance
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleOpenCropModal}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Crop signature area or select specific signature from page"
                      >
                        <Crop className="w-3.5 h-3.5 text-amber-700" />
                        <span>Crop & Select</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedRawImage('');
                          setPreviewDataUrl('');
                          setHasSignature(false);
                          setStrokes([]);
                          setDetectedSignaturesList([]);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Signature Detected Picker */}
                  {detectedSignaturesList.length > 1 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ডকুমেন্টে {detectedSignaturesList.length}টি সিগনেচার শনাক্ত হয়েছে — বেছে নিন:</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {detectedSignaturesList.map((sig, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectDetectedSignature(sig)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-200 transition shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{sig.label || `স্বাক্ষর #${idx + 1}`}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleOpenCropModal}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Crop className="w-3 h-3" />
                          <span>কাস্টম ক্রপ</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Visual Canvas / Stage (Drag to pan, wheel to zoom) */}
                  <div className="relative border-2 border-slate-200 hover:border-amber-400 rounded-xl overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-slate-50 p-2 select-none transition-colors">
                    <div
                      onMouseDown={handleMouseDownPreview}
                      onMouseMove={handleMouseMovePreview}
                      onMouseUp={handleMouseUpPreview}
                      onMouseLeave={handleMouseUpPreview}
                      onWheel={handleWheelPreview}
                      className="w-full h-36 flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
                      title="Drag to reposition, mouse wheel to zoom in/out"
                    >
                      {previewDataUrl ? (
                        <img
                          src={previewDataUrl}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain filter drop-shadow-xs transition-transform duration-75 pointer-events-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Processing image...</span>
                      )}

                      {/* Guide Baseline Overlay */}
                      <div className="absolute inset-x-8 bottom-4 h-[1px] border-b border-dashed border-slate-300 pointer-events-none" />
                      <div className="absolute bottom-1 right-2 text-[9.5px] text-slate-400 font-mono pointer-events-none bg-white/80 px-1 rounded">
                        Drag to Move • Scroll to Zoom
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* RESIZING & SCALING TOOLBOX                               */}
                  {/* ======================================================== */}
                  <div className="p-3.5 bg-gradient-to-b from-amber-50/70 to-amber-50/30 border border-amber-200/90 rounded-2xl space-y-3.5">
                    {/* Header with current scale percentage */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Sliders className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold text-amber-950">
                          Signature Size & Scale Adjustment
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                          {photoScale}%
                        </span>
                        <button
                          type="button"
                          onClick={handleResetTransform}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-amber-100 transition cursor-pointer"
                          title="Reset to 100%"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scale Slider with Zoom In / Out Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleScaleChange(photoScale - 10)}
                        className="px-2 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                        title="Make Smaller (Zoom Out)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">Smaller</span>
                      </button>

                      <div className="flex-1 px-1 flex items-center">
                        <input
                          type="range"
                          min={20}
                          max={300}
                          step={2}
                          value={photoScale}
                          onChange={(e) => handleScaleChange(Number(e.target.value))}
                          className="w-full accent-amber-600 h-2 bg-amber-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleScaleChange(photoScale + 10)}
                        className="px-2 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                        title="Make Bigger (Zoom In)"
                      >
                        <span className="text-[11px] font-semibold">Larger</span>
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10.5px] text-amber-900/80 font-semibold mr-0.5">
                        Quick Sizes:
                      </span>
                      {[40, 70, 100, 130, 170, 220].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleScaleChange(sz)}
                          className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            photoScale === sz
                              ? 'bg-amber-600 text-white font-bold shadow-2xs'
                              : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {sz === 40 ? 'Mini 40%' : sz === 70 ? 'Small 70%' : sz === 100 ? 'Normal 100%' : sz === 130 ? 'Medium 130%' : sz === 170 ? 'Large 170%' : 'Jumbo 220%'}
                        </button>
                      ))}
                    </div>

                    {/* Advanced: Width & Height Proportions & Smart Auto-Crop */}
                    <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Smart Auto-Trim Margin Button */}
                      <button
                        type="button"
                        onClick={handleAutoTrimInk}
                        disabled={isAutoDetecting}
                        className="flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Automatically remove white paper borders and center signature"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isAutoDetecting ? 'Scanning...' : 'Auto-Trim Paper Margins'}</span>
                        <span className="text-[9.5px] bg-amber-200/80 text-amber-900 px-1 rounded">Auto Crop</span>
                      </button>

                      {/* Rotate Options */}
                      <div className="flex items-center justify-between bg-white px-2 py-1 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="text-[11px] font-semibold flex items-center space-x-1">
                          <RotateCw className="w-3 h-3 text-amber-700" />
                          <span>Rotate:</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleRotateStep(-90)}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-200 rounded border border-amber-200 cursor-pointer"
                            title="Rotate Left 90°"
                          >
                            -90°
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRotateStep(90)}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-200 rounded border border-amber-200 cursor-pointer"
                            title="Rotate Right 90°"
                          >
                            +90°
                          </button>
                          {rotationDeg !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleAngleChange(0)}
                              className="text-[9.5px] text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
                              title="Reset rotation"
                            >
                              0°
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Position Nudge Controls */}
                    <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-amber-950 flex items-center space-x-1">
                        <Move className="w-3.5 h-3.5 text-amber-700" />
                        <span>Position Adjust (Nudge Alignment):</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(-15, 0)}
                          className="p-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 cursor-pointer shadow-2xs"
                          title="Nudge Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(0, -10)}
                          className="p-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 cursor-pointer shadow-2xs"
                          title="Nudge Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(0, 10)}
                          className="p-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 cursor-pointer shadow-2xs"
                          title="Nudge Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(15, 0)}
                          className="p-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 cursor-pointer shadow-2xs"
                          title="Nudge Right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Transparent Background & Ink Color Enhancement */}
                    <div className="pt-2.5 border-t border-amber-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-xs font-semibold text-amber-950 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={removeBg}
                            onChange={(e) => {
                              setRemoveBg(e.target.checked);
                              refreshPhotoSignature({ transparentBg: e.target.checked });
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Remove White Paper Background (Transparent Ink)</span>
                        </label>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                          Transparent Ink
                        </span>
                      </div>

                      {/* Ink Color Selector */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10.5px] text-amber-900/80 font-semibold mr-1">
                          Ink Enhancement:
                        </span>
                        {INK_PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              setInkColor(p.value);
                              refreshPhotoSignature({ inkColor: p.value });
                            }}
                            className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer border ${
                              inkColor === p.value
                                ? 'border-amber-600 ring-2 ring-amber-400 font-bold'
                                : 'border-slate-200 hover:border-slate-400 opacity-80'
                            } ${p.bgClass}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DRAW WITH FINGERS (আঙুল দিয়ে আঁকুন)                 */}
          {/* ======================================================== */}
          {mode === 'draw' && (
            <div className="space-y-3">
              {/* Finger Drawing Notice & Quick Tips */}
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl text-xs text-amber-950 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                    <Hand className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold">Draw with Fingers (স্মুথ ফিঙ্গার ড্রয়িং):</span>{' '}
                    <span className="text-[11px] text-amber-800">
                      আঙুল দিয়ে মসৃণভাবে পূর্ণাঙ্গ স্বাক্ষর করুন। অসম্পূর্ণ বা অতিরিক্ত ছোট স্বাক্ষর রিফিউজ করা হবে।
                    </span>
                  </div>
                </div>
              </div>

              {/* Pen Color & Width Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {/* Colors */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Ink:</span>
                  {PEN_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setPenColor(col.value)}
                      title={col.label}
                      className={`w-6 h-6 rounded-full ${col.colorClass} border-2 transition-transform cursor-pointer ${
                        penColor === col.value
                          ? 'border-amber-500 scale-110 shadow-xs'
                          : 'border-transparent hover:scale-105 opacity-80'
                      }`}
                    />
                  ))}
                </div>

                {/* Pen Widths */}
                <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Stroke:</span>
                  {PEN_WIDTHS.map((pw) => (
                    <button
                      key={pw.label}
                      type="button"
                      onClick={() => setPenWidth(pw.value)}
                      className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                        penWidth === pw.value
                          ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {pw.label}
                    </button>
                  ))}
                </div>

                {/* Actions: Undo / Clear */}
                <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                    title="Undo Stroke"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={strokes.length === 0}
                    className="p-1.5 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawing Canvas with Pointer Capture & Smooth Bézier Curves */}
              <div className="relative border-2 border-slate-300 hover:border-amber-400 rounded-xl overflow-hidden bg-white shadow-inner cursor-crosshair transition-colors">
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 sm:h-48 block touch-none select-none"
                  style={{ width: '100%', height: '180px', touchAction: 'none' }}
                />
                <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-400 font-medium select-none bg-white/70 px-1 rounded">
                  Sign above dashed line with your finger
                </div>
              </div>

              {/* Finger Signature Completeness & Validation Status */}
              {strokes.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  {validateFingerSignature(strokes).valid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ বৈধ ফিঙ্গার সিগনেচার (Valid Finger Signature)</span>
                    </span>
                  ) : (
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>⚠️ অসম্পূর্ণ বা খুব ছোট স্বাক্ষর — আঙুল দিয়ে স্পষ্ট ও পূর্ণাঙ্গ স্বাক্ষর করুন</span>
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[10.5px]">
                    {strokes.length} Stroke{strokes.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {strokes.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-900">
                    Want to resize or enlarge this drawn signature?
                  </span>
                  <button
                    type="button"
                    onClick={handleTransferDrawingToResizer}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Open Size Resizer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: RECENT USER SIGNATURES (রিসেন্ট ইউজার সিগনেচার)     */}
          {/* ======================================================== */}
          {mode === 'recent' && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      Recent User Signatures (রিসেন্ট ইউজার সিগনেচার)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                      {recentSignatures.length} Saved
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    আপনার পূর্বে ব্যবহৃত সমস্ত পেন ও আপলোডকৃত সিগনেচার এখানে সংরক্ষিত আছে। যেকোনো সিগনেচার ১-ক্লিকেই রিউজ করুন।
                  </p>
                </div>

                {recentSignatures.length > 0 && (
                  <div className="flex items-center space-x-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => syncRecentSignatures().then((list) => setRecentSignatures(list))}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition text-xs"
                      title="Refresh Signatures"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to clear all saved recent signatures?')) {
                          await clearAllRecentSignatures();
                          setRecentSignatures([]);
                          toast.info('All recent signatures cleared.');
                        }
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Search filter if there are several signatures */}
              {recentSignatures.length >= 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchRecentQuery}
                    onChange={(e) => setSearchRecentQuery(e.target.value)}
                    placeholder="Search recent signature by title or name..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  {searchRecentQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchRecentQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Signatures List or Empty State */}
              {recentSignatures.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Feather className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">No Recent Signatures Saved Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      পেন দিয়ে ড্র করুন অথবা ফটোকপির ছবি আপলোড করে সাইজ ঠিক করে <strong>&quot;Embed Signature&quot;</strong> বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে এখানে পরবর্তীতে ব্যবহারের জন্য সেভ হয়ে থাকবে।
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('draw')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Feather className="w-3.5 h-3.5" />
                      <span>Draw with Pen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('upload')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload &amp; Resize Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {recentSignatures
                    .filter((s) => {
                      if (!searchRecentQuery) return true;
                      const q = searchRecentQuery.toLowerCase();
                      return (
                        (s.title && s.title.toLowerCase().includes(q)) ||
                        (s.name && s.name.toLowerCase().includes(q))
                      );
                    })
                    .map((sig) => {
                      const isSelected = selectedRecentId === sig.id || previewDataUrl === sig.dataUrl;
                      const typeLabel =
                        sig.type === 'pen'
                          ? '✍️ Pen Drawing'
                          : sig.type === 'upload'
                          ? '📷 Photocopy / Scanned'
                          : '🖋️ Digital Signature';

                      return (
                        <div
                          key={sig.id}
                          className={`p-3 rounded-2xl border transition-all space-y-2 relative group ${
                            isSelected
                              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Signature display canvas */}
                          <div className="h-16 flex items-center justify-center bg-slate-50/80 rounded-xl border border-slate-100 p-2 overflow-hidden relative">
                            <img
                              src={sig.dataUrl}
                              alt={sig.title || 'Signature'}
                              className="max-h-12 max-w-full object-contain filter drop-shadow-2xs"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-amber-600 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate" title={sig.title}>
                                {sig.title || 'Official Signatory'}
                              </span>
                              {sig.name && (
                                <span className="text-[10px] text-slate-500 italic block truncate">
                                  {sig.name}
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                              {typeLabel}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectRecentSignature(sig, false);
                                setMode('upload');
                              }}
                              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                              title="Tweak size, rotation, or ink in Studio"
                            >
                              <Sliders className="w-3 h-3 text-amber-600" />
                              <span>Resize</span>
                            </button>

                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteRecentSignature(sig.id);
                                  setRecentSignatures((prev) => prev.filter((item) => item.id !== sig.id));
                                  toast.info('Signature removed from recent list.');
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete from recent signatures"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectRecentSignature(sig, true)}
                                className="flex items-center space-x-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Use Signature</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* REAL-TIME CERTIFICATE SIGNATURE BLOCK SIMULATION          */}
          {/* ======================================================== */}
          {previewDataUrl && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certificate Signature Line Simulation (Live Preview):</span>
                </span>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                  <span>Current Size:</span>
                  <span className="font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {photoScale}%
                  </span>
                </div>
              </div>

              {/* Simulation of the certificate signature block */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center max-w-xs mx-auto shadow-xs">
                <div className="h-14 flex items-end justify-center mb-1 overflow-hidden">
                  <img
                    src={previewDataUrl}
                    alt="Signature preview"
                    className="max-h-14 max-w-[210px] object-contain drop-shadow-2xs transition-all duration-75"
                  />
                </div>
                <div className="w-full h-[1.5px] bg-slate-800 mb-1" />
                <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider leading-tight">
                  {signatoryTitle}
                </div>
                {signatoryName && (
                  <div className="text-[10px] text-slate-500 italic mt-0.5 truncate">
                    {signatoryName}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {previewDataUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl('');
                  setUploadedRawImage('');
                  setHasSignature(false);
                  setStrokes([]);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!previewDataUrl}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Embed Signature</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Interactive Cropping Studio Modal */}
      <SignatureCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={uploadedRawImage}
        initialCrop={cropBounds}
        detectedSignatures={detectedSignaturesList}
        onApplyCrop={handleApplyCropFromModal}
      />
    </div>
  );
};
