import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, Check, X, RotateCcw, Maximize, Sparkles, Move } from 'lucide-react';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SignatureCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  initialCrop?: CropRect | null;
  detectedSignatures?: Array<{ ymin: number; xmin: number; ymax: number; xmax: number; label?: string }>;
  onApplyCrop: (crop: CropRect) => void;
}

export const SignatureCropModal: React.FC<SignatureCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  initialCrop,
  detectedSignatures = [],
  onApplyCrop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Natural image dimensions
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // Display scale factor (display pixel / natural pixel)
  const [displayScale, setDisplayScale] = useState<number>(1);

  // Crop rectangle in NATURAL image pixels
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  // Interactive dragging state
  const [isDrawingNewBox, setIsDrawingNewBox] = useState<boolean>(false);
  const [isMovingBox, setIsMovingBox] = useState<boolean>(false);
  const [isResizingHandle, setIsResizingHandle] = useState<string | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [initialBoxOnDrag, setInitialBoxOnDrag] = useState<CropRect | null>(null);

  // Measure and initialize
  const updateScaleAndDefaults = useCallback(() => {
    const img = imageRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalDimensions({ width: nw, height: nh });

    const dw = img.clientWidth || img.offsetWidth;
    const scale = dw > 0 ? dw / nw : 1;
    setDisplayScale(scale);

    if (initialCrop && initialCrop.width > 20 && initialCrop.height > 10) {
      setCrop(initialCrop);
    } else if (detectedSignatures.length > 0) {
      const first = detectedSignatures[0];
      const cx = Math.max(0, Math.round((first.xmin / 1000) * nw));
      const cy = Math.max(0, Math.round((first.ymin / 1000) * nh));
      const cw = Math.min(nw - cx, Math.round(((first.xmax - first.xmin) / 1000) * nw));
      const ch = Math.min(nh - cy, Math.round(((first.ymax - first.ymin) / 1000) * nh));
      setCrop({ x: cx, y: cy, width: cw, height: ch });
    } else {
      // Default to centered 70% width, 35% height
      const dwDefault = Math.round(nw * 0.7);
      const dhDefault = Math.round(nh * 0.35);
      const dxDefault = Math.round((nw - dwDefault) / 2);
      const dyDefault = Math.round((nh - dhDefault) / 2);
      setCrop({ x: dxDefault, y: dyDefault, width: dwDefault, height: dhDefault });
    }
  }, [initialCrop, detectedSignatures]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        updateScaleAndDefaults();
      }, 80);
      window.addEventListener('resize', updateScaleAndDefaults);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScaleAndDefaults);
      };
    }
  }, [isOpen, updateScaleAndDefaults]);

  if (!isOpen || !imageSrc) return null;

  // Convert natural crop coordinates to display px for UI
  const displayBox = {
    left: Math.round(crop.x * displayScale),
    top: Math.round(crop.y * displayScale),
    width: Math.round(crop.width * displayScale),
    height: Math.round(crop.height * displayScale)
  };

  // Helper to get natural image coordinates from mouse/touch event
  const getNaturalCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const img = imageRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    const relX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const relY = Math.max(0, Math.min(clientY - rect.top, rect.height));

    const scale = naturalDimensions.width > 0 && rect.width > 0 ? naturalDimensions.width / rect.width : 1;

    return {
      x: Math.round(relX * scale),
      y: Math.round(relY * scale)
    };
  };

  // Start drawing new crop box
  const handleContainerMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.handle || target.dataset.cropbox) return;

    const coords = getNaturalCoords(e);
    if (!coords) return;

    setIsDrawingNewBox(true);
    setDragStartPoint(coords);
    setCrop({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  // Start moving crop box
  const handleBoxMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const coords = getNaturalCoords(e);
    if (!coords) return;

    setIsMovingBox(true);
    setDragStartPoint(coords);
    setInitialBoxOnDrag({ ...crop });
  };

  // Start resizing via corner handles
  const handleHandleMouseDown = (handle: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const coords = getNaturalCoords(e);
    if (!coords) return;

    setIsResizingHandle(handle);
    setDragStartPoint(coords);
    setInitialBoxOnDrag({ ...crop });
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartPoint) return;
    const coords = getNaturalCoords(e);
    if (!coords) return;

    const nw = naturalDimensions.width;
    const nh = naturalDimensions.height;

    if (isDrawingNewBox) {
      const minX = Math.min(dragStartPoint.x, coords.x);
      const minY = Math.min(dragStartPoint.y, coords.y);
      const width = Math.abs(coords.x - dragStartPoint.x);
      const height = Math.abs(coords.y - dragStartPoint.y);

      setCrop({
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        width: Math.min(nw - minX, width),
        height: Math.min(nh - minY, height)
      });
    } else if (isMovingBox && initialBoxOnDrag) {
      const dx = coords.x - dragStartPoint.x;
      const dy = coords.y - dragStartPoint.y;

      let newX = initialBoxOnDrag.x + dx;
      let newY = initialBoxOnDrag.y + dy;

      newX = Math.max(0, Math.min(nw - initialBoxOnDrag.width, newX));
      newY = Math.max(0, Math.min(nh - initialBoxOnDrag.height, newY));

      setCrop({
        x: newX,
        y: newY,
        width: initialBoxOnDrag.width,
        height: initialBoxOnDrag.height
      });
    } else if (isResizingHandle && initialBoxOnDrag) {
      const dx = coords.x - dragStartPoint.x;
      const dy = coords.y - dragStartPoint.y;
      let { x, y, width, height } = initialBoxOnDrag;

      if (isResizingHandle.includes('e')) {
        width = Math.max(20, Math.min(nw - x, initialBoxOnDrag.width + dx));
      }
      if (isResizingHandle.includes('s')) {
        height = Math.max(10, Math.min(nh - y, initialBoxOnDrag.height + dy));
      }
      if (isResizingHandle.includes('w')) {
        const potentialW = initialBoxOnDrag.width - dx;
        if (potentialW >= 20) {
          x = Math.max(0, initialBoxOnDrag.x + dx);
          width = potentialW;
        }
      }
      if (isResizingHandle.includes('n')) {
        const potentialH = initialBoxOnDrag.height - dy;
        if (potentialH >= 10) {
          y = Math.max(0, initialBoxOnDrag.y + dy);
          height = potentialH;
        }
      }

      setCrop({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    setIsDrawingNewBox(false);
    setIsMovingBox(false);
    setIsResizingHandle(null);
    setDragStartPoint(null);
    setInitialBoxOnDrag(null);
  };

  // Quick select preset signature candidate
  const handleSelectPreset = (sig: { ymin: number; xmin: number; ymax: number; xmax: number }) => {
    const nw = naturalDimensions.width;
    const nh = naturalDimensions.height;
    if (!nw || !nh) return;

    const padX = Math.round((sig.xmax - sig.xmin) * 0.05);
    const padY = Math.round((sig.ymax - sig.ymin) * 0.05);
    const cx = Math.max(0, Math.round(((sig.xmin - padX) / 1000) * nw));
    const cy = Math.max(0, Math.round(((sig.ymin - padY) / 1000) * nh));
    const cw = Math.min(nw - cx, Math.round(((sig.xmax - sig.xmin + padX * 2) / 1000) * nw));
    const ch = Math.min(nh - cy, Math.round(((sig.ymax - sig.ymin + padY * 2) / 1000) * nh));

    setCrop({ x: cx, y: cy, width: cw, height: ch });
  };

  // Apply crop
  const handleConfirm = () => {
    if (crop.width < 15 || crop.height < 8) {
      // Default to entire image if selection was too tiny
      onApplyCrop({
        x: 0,
        y: 0,
        width: naturalDimensions.width,
        height: naturalDimensions.height
      });
    } else {
      onApplyCrop(crop);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Crop & Select Signature</h3>
              <p className="text-[11px] text-slate-300">
                Drag a box over the handwritten signature to extract only the signature area
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Signature Presets Bar if multiple detected */}
        {detectedSignatures.length > 0 && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-1.5 text-xs shrink-0">
            <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI Detected Signature Area{detectedSignatures.length > 1 ? 's' : ''}:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {detectedSignatures.map((sig, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(sig)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-200 transition shadow-2xs cursor-pointer"
                >
                  {sig.label || `Signature #${idx + 1}`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCrop({
                    x: 0,
                    y: 0,
                    width: naturalDimensions.width,
                    height: naturalDimensions.height
                  });
                }}
                className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Full Page
              </button>
            </div>
          </div>
        )}

        {/* Interactive Cropper Stage */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="p-3 sm:p-5 flex-1 overflow-auto bg-slate-950/90 flex flex-col items-center justify-center select-none min-h-[260px]"
        >
          <div
            onMouseDown={handleContainerMouseDown}
            onTouchStart={handleContainerMouseDown}
            className="relative cursor-crosshair inline-block max-w-full rounded-lg overflow-hidden border border-slate-700 shadow-xl"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Raw Document"
              onLoad={updateScaleAndDefaults}
              className="max-h-[50vh] sm:max-h-[58vh] max-w-full block pointer-events-none select-none object-contain"
            />

            {/* Dark Mask surrounding the crop box */}
            {displayBox.width > 0 && displayBox.height > 0 && (
              <>
                {/* Top mask */}
                <div
                  className="absolute inset-x-0 top-0 bg-black/60 pointer-events-none"
                  style={{ height: `${displayBox.top}px` }}
                />
                {/* Bottom mask */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-black/60 pointer-events-none"
                  style={{ top: `${displayBox.top + displayBox.height}px` }}
                />
                {/* Left mask */}
                <div
                  className="absolute left-0 bg-black/60 pointer-events-none"
                  style={{
                    top: `${displayBox.top}px`,
                    height: `${displayBox.height}px`,
                    width: `${displayBox.left}px`
                  }}
                />
                {/* Right mask */}
                <div
                  className="absolute right-0 bg-black/60 pointer-events-none"
                  style={{
                    top: `${displayBox.top}px`,
                    height: `${displayBox.height}px`,
                    left: `${displayBox.left + displayBox.width}px`
                  }}
                />

                {/* The Active Crop Box */}
                <div
                  data-cropbox="true"
                  onMouseDown={handleBoxMouseDown}
                  onTouchStart={handleBoxMouseDown}
                  className="absolute border-2 border-amber-400 bg-amber-400/10 cursor-move shadow-md"
                  style={{
                    left: `${displayBox.left}px`,
                    top: `${displayBox.top}px`,
                    width: `${displayBox.width}px`,
                    height: `${displayBox.height}px`
                  }}
                >
                  {/* Grid Lines inside crop box */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Move Icon Center badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="p-1 rounded-md bg-black/50 text-white text-[10px] font-mono flex items-center gap-1 opacity-70">
                      <Move className="w-3 h-3" />
                      <span>{crop.width} × {crop.height} px</span>
                    </span>
                  </div>

                  {/* 4 Corner Resize Handles */}
                  <div
                    data-handle="nw"
                    onMouseDown={(e) => handleHandleMouseDown('nw', e)}
                    onTouchStart={(e) => handleHandleMouseDown('nw', e)}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white cursor-nwse-resize shadow"
                  />
                  <div
                    data-handle="ne"
                    onMouseDown={(e) => handleHandleMouseDown('ne', e)}
                    onTouchStart={(e) => handleHandleMouseDown('ne', e)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white cursor-nesw-resize shadow"
                  />
                  <div
                    data-handle="sw"
                    onMouseDown={(e) => handleHandleMouseDown('sw', e)}
                    onTouchStart={(e) => handleHandleMouseDown('sw', e)}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white cursor-nesw-resize shadow"
                  />
                  <div
                    data-handle="se"
                    onMouseDown={(e) => handleHandleMouseDown('se', e)}
                    onTouchStart={(e) => handleHandleMouseDown('se', e)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white cursor-nwse-resize shadow"
                  />
                </div>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Click and drag anywhere on the document to draw a new crop box, or drag inside the box to reposition.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            {crop.width > 0 ? `Selected: ${crop.width} × ${crop.height} px` : 'No crop area selected'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
