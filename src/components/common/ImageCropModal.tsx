import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Sparkles,
  Move
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  title?: string;
  outputSize?: number; // default 512
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Crop Profile Photo / ছবি ক্রপ করুন',
  outputSize = 512
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Viewport Crop Box Dimensions (interactive preview)
  const CROP_BOX_SIZE = 280;

  // Draw interactive crop preview onto preview canvas
  const drawPreview = useCallback(() => {
    if (!imageLoaded || !imgRef.current || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const width = CROP_BOX_SIZE;
    const height = CROP_BOX_SIZE;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate base scale to fill the crop box (cover)
    const scaleCover = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const effectiveScale = scaleCover * zoom;

    const scaledWidth = img.naturalWidth * effectiveScale;
    const scaledHeight = img.naturalHeight * effectiveScale;

    // Center coordinates + user drag offset
    const centerX = (width - scaledWidth) / 2 + offset.x;
    const centerY = (height - scaledHeight) / 2 + offset.y;

    // Draw the image
    ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);
  }, [imageLoaded, zoom, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Render high-res crisp 512x512 final image
  const handleApplyCrop = () => {
    if (!imageLoaded || !imgRef.current) return;
    const img = imgRef.current;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Ratio between output size and preview size
    const ratio = outputSize / CROP_BOX_SIZE;

    const scaleCover = Math.max(CROP_BOX_SIZE / img.naturalWidth, CROP_BOX_SIZE / img.naturalHeight);
    const effectiveScale = scaleCover * zoom;

    const scaledWidth = img.naturalWidth * effectiveScale * ratio;
    const scaledHeight = img.naturalHeight * effectiveScale * ratio;

    const centerX = ((CROP_BOX_SIZE - (img.naturalWidth * effectiveScale)) / 2 + offset.x) * ratio;
    const centerY = ((CROP_BOX_SIZE - (img.naturalHeight * effectiveScale)) / 2 + offset.y) * ratio;

    ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);

    // Export ultra-crisp PNG or high quality JPEG
    const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.95);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fuchsia-500/20 rounded-xl text-fuchsia-300 border border-fuchsia-500/30">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-fuchsia-200/80">
                ছবি ড্র্যাগ ও জুম করে মুখ ঠিকভাবে সেন্টারে রাখুন (512×512 HD Sharp)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-6 flex flex-col items-center bg-slate-950 select-none">
          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden border-2 border-fuchsia-400/50 shadow-2xl cursor-grab active:cursor-grabbing bg-slate-900 touch-none flex items-center justify-center"
            style={{ width: `${CROP_BOX_SIZE}px`, height: `${CROP_BOX_SIZE}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full block"
              style={{
                imageRendering: '-webkit-optimize-contrast'
              }}
            />

            {/* Circular Avatar Guide Mask */}
            <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

            {/* Crosshair Center Marker */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <div className="w-6 h-0.5 bg-white" />
              <div className="h-6 w-0.5 bg-white absolute" />
            </div>

            {/* Move Hint */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2.5 py-1 bg-black/70 backdrop-blur-xs text-[10px] text-white/90 rounded-full font-medium flex items-center gap-1 border border-white/10">
                <Move className="w-3 h-3 text-fuchsia-400" />
                <span>Drag to reposition</span>
              </span>
            </div>
          </div>

          {/* Zoom Slider & Controls */}
          <div className="w-full max-w-[280px] mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <ZoomIn className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Zoom Scale: {Math.round(zoom * 100)}%</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset crop zoom and position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-fuchsia-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <button
                type="button"
                onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel / বাতিল
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-950/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Crop & Apply Photo (ক্লিয়ার ও শার্প)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
