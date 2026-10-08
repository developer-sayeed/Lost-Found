import React, { useEffect, useState, useRef } from 'react';
import {
  Printer,
  Download,
  FileText,
  ArrowLeft,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Maximize2,
  Smartphone,
  Loader2
} from 'lucide-react';
import { Certificate } from '../../types';
import { CertificateRenderer } from './CertificateTemplates';
import { downloadCertificatePdf, downloadCertificatePng, printCertificate } from './CertificateActions';
import { toast } from 'react-toastify';

interface CertificatePrintPageProps {
  certificate: Certificate;
  onBack: () => void;
  canSave?: boolean;
}

export const CertificatePrintPage: React.FC<CertificatePrintPageProps> = ({
  certificate,
  onBack,
  canSave = true
}) => {
  const [autoScale, setAutoScale] = useState<number>(1);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState<boolean>(false);
  const [isPrintingNow, setIsPrintingNow] = useState<boolean>(false);
  const printStageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Auto-fit calculation based on viewport width
  useEffect(() => {
    const updateScale = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 640;
        const pad = isMobile ? 16 : 48;
        const availableW = window.innerWidth - pad;
        const fit = Math.min(Math.max(availableW / 1000, 0.22), 1.05);
        setAutoScale(fit);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const currentScale = manualZoom !== null ? manualZoom : autoScale;

  // Prepare fonts & DOM readiness on mount
  useEffect(() => {
    if (!autoPrintTriggered) {
      const initReady = async () => {
        if (document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch {
            // Ignore font error
          }
        }
        setAutoPrintTriggered(true);
      };
      initReady();
    }
  }, [autoPrintTriggered]);

  // Handle keyboard shortcuts (Escape to exit, Ctrl+P to print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      } else if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintNow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const handlePrintNow = async () => {
    if (isPrintingNow) return;
    setIsPrintingNow(true);
    try {
      await printCertificate(
        'direct-print-certificate-container',
        `${certificate.recipientName || 'Award'} - ${certificate.title || 'Certificate'}`
      );
      toast.success('Print document ready');
    } catch (err) {
      console.warn('High fidelity print failed, using native print:', err);
      window.print();
    } finally {
      setIsPrintingNow(false);
    }
  };

  const handleOpenCleanPrintTab = () => {
    try {
      const container = document.getElementById('direct-print-certificate-container');
      if (!container) {
        window.print();
        return;
      }

      const win = window.open('', '_blank', 'width=1100,height=800');
      if (!win) {
        toast.info('Popup window blocked. Opening native print dialog instead...');
        window.print();
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>${certificate.recipientName} - ${certificate.title}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Pinyon+Script&family=Alex+Brush&display=swap" rel="stylesheet">
            <style>
              @page {
                size: landscape;
                margin: 0;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background-color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-wrap {
                width: 1000px;
                height: 700px;
                margin: auto;
              }
            </style>
          </head>
          <body>
            <div class="print-wrap">
              ${container.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 350);
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } catch (e) {
      console.warn('Tab print error:', e);
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const cleanNum = certificate.certificateNumber || 'CERT';
      const cleanName = certificate.recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.pdf`;
      await downloadCertificatePdf('direct-print-certificate-container', filename);
      toast.success('Certificate PDF generated and downloaded!');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. You can also use "Print -> Save as PDF".');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsExportingPng(true);
      const cleanNum = certificate.certificateNumber || 'CERT';
      const cleanName = certificate.recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.png`;
      await downloadCertificatePng('direct-print-certificate-container', filename);
      toast.success('High-resolution PNG image downloaded!');
    } catch (err: any) {
      console.error('PNG error:', err);
      toast.error('Failed to download PNG image.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleTouchEndStage = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (manualZoom === null || manualZoom <= autoScale + 0.05) {
        setManualZoom(1);
      } else {
        setManualZoom(null);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-y-auto animate-fade-in print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Print specific styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #ffffff !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          header,
          nav,
          aside,
          #app-sidebar,
          #top-header-bar,
          #mobile-bottom-footer-nav,
          .Toastify {
            display: none !important;
          }
          #direct-print-page-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            z-index: 999999 !important;
          }
          #direct-print-page-wrapper > div {
            transform: none !important;
            margin: auto !important;
            box-shadow: none !important;
          }
          #direct-print-certificate-container,
          [data-certificate-root="true"] {
            width: 1000px !important;
            height: 700px !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Back button & Certificate info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  {certificate.certificateNumber || 'PRINT'}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md">
                  {certificate.recipientName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Landscape A4 Ready • {certificate.title}
              </p>
            </div>
          </div>

          {/* Center: Zoom Controls (Responsive for mobile & desktop) */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-slate-300">
            <button
              type="button"
              onClick={() => setManualZoom(Math.max(0.3, Math.round((currentScale - 0.1) * 10) / 10))}
              className="p-1 rounded-lg hover:bg-slate-700 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] sm:text-xs font-mono font-bold px-1 sm:px-2 min-w-[42px] text-center text-slate-200">
              {Math.round(currentScale * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setManualZoom(Math.min(1.4, Math.round((currentScale + 0.1) * 10) / 10))}
              className="p-1 rounded-lg hover:bg-slate-700 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setManualZoom(null)}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition ${
                manualZoom === null ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:bg-slate-700'
              }`}
              title="Fit to Screen"
            >
              Fit
            </button>

            <button
              type="button"
              onClick={() => setManualZoom(1)}
              className={`hidden xs:inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded transition ${
                manualZoom === 1 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Actual Size"
            >
              100%
            </button>
          </div>

          {/* Right: Primary Print & Export Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrintNow}
              disabled={isPrintingNow}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
            >
              {isPrintingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">Direct Print</span>
              <span className="xs:hidden">Print</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCleanPrintTab}
              className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition items-center gap-1.5 border border-slate-700 shadow-xs"
              title="Open pure printable HTML in dedicated tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Clean Tab</span>
            </button>

            {canSave && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1 border border-slate-700 shadow-xs disabled:opacity-50"
                  title="Download Landscape A4 PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isExportingPng}
                  className="hidden xs:inline-flex px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition items-center gap-1 border border-slate-700 shadow-xs disabled:opacity-50"
                  title="Download High-Res PNG"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>PNG</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Hint Ribbon (Hidden during print) */}
      <div className="no-print bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs text-amber-300 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">
          Set Destination to <strong>Save as PDF</strong> or Color Printer • Layout: <strong>Landscape</strong> • Margins: <strong>None</strong>
        </span>
      </div>

      {/* Main Print Stage Area (Responsive, touch-pan enabled, auto-scaling) */}
      <div
        id="direct-print-page-wrapper"
        ref={printStageRef}
        onTouchEnd={handleTouchEndStage}
        className="flex-1 flex items-center justify-center p-2 sm:p-6 md:p-10 overflow-auto touch-pan-x touch-pan-y"
      >
        <div
          style={{
            transform: `scale(${currentScale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            width: '1000px',
            height: '700px'
          }}
          className="relative transition-transform shadow-2xl rounded-sm print:shadow-none select-none shrink-0"
        >
          <CertificateRenderer
            cert={certificate}
            idPrefix="direct-print"
            className="shadow-2xl print:shadow-none"
          />
        </div>
      </div>
    </div>
  );
};
