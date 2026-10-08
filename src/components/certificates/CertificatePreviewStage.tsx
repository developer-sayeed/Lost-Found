import React, { useState, useEffect, useRef } from 'react';
import { Certificate } from '../../types';
import { CertificateRenderer } from './CertificateTemplates';
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  printCertificate
} from './CertificateActions';
import {
  Printer,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  Award,
  Smartphone,
  Eye,
  Hand
} from 'lucide-react';

interface CertificatePreviewStageProps {
  cert: Partial<Certificate>;
  idPrefix?: string;
  showToolbar?: boolean;
  className?: string;
  onPrintSuccess?: () => void;
  onDownloadSuccess?: () => void;
  onDirectPrintPage?: () => void;
}

export const CertificatePreviewStage: React.FC<CertificatePreviewStageProps> = ({
  cert,
  idPrefix = 'view',
  showToolbar = true,
  className = '',
  onPrintSuccess,
  onDownloadSuccess,
  onDirectPrintPage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollStageRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Measure container width accurately on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        // On mobile (< 640px), padding is tight (approx 16px total)
        const isMobile = window.innerWidth < 640;
        const padding = isMobile ? 16 : 32;
        const measured = clientWidth - padding;
        if (measured > 80) {
          setContainerWidth(measured);
        }
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Compute auto-fit scale based on container width (certificate native width is 1000px)
  const autoScale = Math.min(Math.max(containerWidth / 1000, 0.20), 1);
  const scale = manualZoom !== null ? manualZoom : autoScale;
  const isZoomedIn = manualZoom !== null && manualZoom > autoScale;

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printCertificate(
        `${idPrefix}-certificate-container`,
        `${cert.recipientName || 'Certificate'} - Warwick Hotel`
      );
      if (onPrintSuccess) onPrintSuccess();
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const cleanNum = cert.certificateNumber || 'WRW-CERT';
      const cleanName = (cert.recipientName || 'Recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.pdf`;
      await downloadCertificatePdf(`${idPrefix}-certificate-container`, filename);
      if (onDownloadSuccess) onDownloadSuccess();
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloadingPng(true);
      const cleanNum = cert.certificateNumber || 'WRW-CERT';
      const cleanName = (cert.recipientName || 'Recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.png`;
      await downloadCertificatePng(`${idPrefix}-certificate-container`, filename);
      if (onDownloadSuccess) onDownloadSuccess();
    } catch (err) {
      console.error('PNG download failed:', err);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleZoomIn = () => {
    const current = scale;
    setManualZoom(Math.min(Math.round((current + 0.1) * 10) / 10, 1.4));
  };

  const handleZoomOut = () => {
    const current = scale;
    setManualZoom(Math.max(Math.round((current - 0.1) * 10) / 10, 0.3));
  };

  const handleFit = () => {
    setManualZoom(null);
  };

  const handleSetZoom = (targetZoom: number) => {
    setManualZoom(targetZoom);
  };

  // Double tap to toggle zoom on mobile touch
  const handleTouchEndStage = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (manualZoom === null || manualZoom <= autoScale + 0.05) {
        setManualZoom(0.85); // Zoom in to readable size
      } else {
        setManualZoom(null); // Fit to screen width
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center w-full transition-colors ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-2 sm:p-5 overflow-auto flex flex-col justify-start'
          : ''
      } ${className}`}
    >
      {/* Action Toolbar */}
      {showToolbar && (
        <div className="w-full mb-3 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all space-y-2.5">
          {/* Top Section: Spec Badge & View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Meta Pill / Info */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold truncate max-w-[140px] sm:max-w-xs text-slate-900 dark:text-white">
                {cert.title || 'Certificate Preview'}
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                A4 Landscape
              </span>
            </div>

            {/* Quick Zoom Bar */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[11px] sm:text-xs w-11 sm:w-12 text-center font-bold text-slate-800 dark:text-slate-200 select-none">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

              <button
                type="button"
                onClick={handleFit}
                className={`px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                  manualZoom === null
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Fit certificate to available width"
              >
                Fit
              </button>

              <button
                type="button"
                onClick={() => handleSetZoom(0.75)}
                className={`hidden sm:inline-block px-1.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                  manualZoom === 0.75
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                75%
              </button>

              <button
                type="button"
                onClick={() => handleSetZoom(1)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                  manualZoom === 1
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Actual 100% resolution"
              >
                100%
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors ml-0.5"
                title={isFullscreen ? 'Exit fullscreen preview' : 'View fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen preview' : 'View fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-500" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Section: Touch Friendly Action Grid (Direct Print, PDF, PNG) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (onDirectPrintPage) {
                  onDirectPrintPage();
                } else {
                  handlePrint();
                }
              }}
              disabled={isPrinting}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs font-bold rounded-xl text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 transition disabled:opacity-50 border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Open printable preview / system print"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              )}
              <span className="truncate">Direct Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs font-bold rounded-xl text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-98 border border-red-200 dark:border-red-900/50 transition disabled:opacity-50 shadow-2xs"
              title="Download print-ready A4 PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              )}
              <span className="truncate">PDF Doc</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs font-bold rounded-xl text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-98 border border-amber-200 dark:border-amber-800/50 transition disabled:opacity-50 shadow-2xs"
              title="Download high-resolution PNG image"
            >
              {isDownloadingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              )}
              <span className="truncate">PNG Image</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile helper ribbon when zoomed in */}
      {isZoomedIn && (
        <div className="w-full flex items-center justify-center gap-1.5 pb-2 text-[11px] text-slate-500 dark:text-slate-400 select-none animate-fadeIn">
          <Hand className="w-3.5 h-3.5 text-amber-500" />
          <span>Pan horizontally/vertically to examine seal and signatures</span>
        </div>
      )}

      {/* Scaled Certificate Stage Container */}
      <div
        ref={scrollStageRef}
        className="relative w-full rounded-2xl bg-gradient-to-b from-slate-200/90 to-slate-300/80 dark:from-slate-900 dark:to-slate-950 border border-slate-300/70 dark:border-slate-800 shadow-inner overflow-x-auto overflow-y-auto overscroll-contain touch-pan-x touch-pan-y p-2 sm:p-5 flex items-center justify-center transition-all"
        style={{
          minHeight: `${Math.round(700 * scale + (window.innerWidth < 640 ? 16 : 32))}px`,
          maxHeight: isFullscreen ? 'calc(100vh - 120px)' : '76vh'
        }}
        onTouchEnd={handleTouchEndStage}
        onDoubleClick={() => {
          if (manualZoom === null || manualZoom <= autoScale + 0.05) {
            setManualZoom(0.9);
          } else {
            setManualZoom(null);
          }
        }}
      >
        <div
          style={{
            width: `${1000 * scale}px`,
            height: `${700 * scale}px`,
            minWidth: `${1000 * scale}px`,
            minHeight: `${700 * scale}px`,
            position: 'relative',
            margin: 'auto'
          }}
          className="transition-all duration-150 ease-out select-none"
        >
          <div
            style={{
              width: '1000px',
              height: '700px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            className="shadow-2xl rounded-sm ring-1 ring-black/10 dark:ring-white/10 print:shadow-none"
          >
            <CertificateRenderer cert={cert} idPrefix={idPrefix} />
          </div>
        </div>
      </div>

      {/* Helpful Mobile Orientation Hint */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 px-1">
        <span className="flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-slate-400" />
          <span className="hidden xs:inline">Mobile Tip: Rotate device for wider landscape view</span>
          <span className="xs:hidden">Rotate for landscape view</span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (manualZoom === null) setManualZoom(1);
            else setManualZoom(null);
          }}
          className="hover:text-amber-500 transition-colors text-[10px] font-medium"
        >
          {manualZoom === null ? 'Tap for 100%' : 'Tap to Fit Width'}
        </button>
      </div>
    </div>
  );
};
