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
  RefreshCw,
  Loader2
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
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState<boolean>(false);

  // Monitor container width dynamically to adapt scale
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        // Subtract padding (approx 32px)
        const w = containerRef.current.clientWidth - 32;
        if (w > 100) {
          setContainerWidth(w);
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
  const autoScale = Math.min(Math.max(containerWidth / 1000, 0.35), 1);
  const scale = manualZoom !== null ? manualZoom : autoScale;

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
    setManualZoom(Math.min(current + 0.1, 1.4));
  };

  const handleZoomOut = () => {
    const current = scale;
    setManualZoom(Math.max(current - 0.1, 0.4));
  };

  const handleFit = () => {
    setManualZoom(null);
  };

  const handleActualSize = () => {
    setManualZoom(1);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md p-6 overflow-auto' : ''} ${className}`}
    >
      {/* Action Toolbar */}
      {showToolbar && (
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          {/* Zoom & Fit Controls */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs w-12 text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={handleFit}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                manualZoom === null
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={handleActualSize}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                manualZoom === 1
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-1"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Buttons: Print, PDF, PNG */}
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 shadow-xs"
              title="Open dedicated Direct Print Page"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
              <span>Direct Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 shadow-xs"
              title="Download print-ready A4 PDF"
            >
              {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <FileText className="w-3.5 h-3.5 text-red-600" />}
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50 shadow-xs"
              title="Download high-resolution PNG image"
            >
              {isDownloadingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" /> : <Download className="w-3.5 h-3.5 text-amber-700" />}
              <span>PNG Image</span>
            </button>
          </div>
        </div>
      )}

      {/* Scaled Certificate Stage Container */}
      <div
        className="relative overflow-hidden flex items-center justify-center p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-inner"
        style={{
          width: '100%',
          minHeight: `${700 * scale + 30}px`,
          maxWidth: manualZoom && manualZoom > 1 ? 'none' : '100%'
        }}
      >
        <div
          style={{
            width: `${1000 * scale}px`,
            height: `${700 * scale}px`,
            position: 'relative'
          }}
          className="transition-all duration-150 ease-out"
        >
          <div
            style={{
              width: '1000px',
              height: '700px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            <CertificateRenderer cert={cert} idPrefix={idPrefix} />
          </div>
        </div>
      </div>
    </div>
  );
};
