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
  Maximize2
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState<boolean>(false);
  const printStageRef = useRef<HTMLDivElement>(null);

  const [isPrintingNow, setIsPrintingNow] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-y-auto animate-fade-in print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* 
        Print specific styles:
        Hides everything except the direct certificate container
      */}
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
          /* Hide non-print UI completely */
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
          /* Position certificate to fill printable page with zero overflow */
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
      <div className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Certificate info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {certificate.certificateNumber || 'DIRECT PRINT'}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {certificate.recipientName} • {certificate.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Direct Print Page • Landscape A4 (297mm × 210mm) Ready
              </p>
            </div>
          </div>

          {/* Center: Zoom Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-slate-300">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1 rounded-lg hover:bg-slate-700 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-2">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 rounded-lg hover:bg-slate-700 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 hover:bg-slate-700 rounded transition"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Right: Primary Print & Export Buttons */}
          <div className="flex items-center gap-2">
            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handlePrintNow}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Direct Print (Ctrl+P)</span>
            </button>

            {/* Clean Tab Print Fallback */}
            <button
              type="button"
              onClick={handleOpenCleanPrintTab}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 shadow-xs"
              title="Open pure printable HTML in dedicated tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Open Clean Tab</span>
            </button>

            {/* PDF Download */}
            {canSave && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 shadow-xs disabled:opacity-50"
                title="Download Landscape A4 PDF"
              >
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
              </button>
            )}

            {/* PNG Download */}
            {canSave && (
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isExportingPng}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 shadow-xs disabled:opacity-50"
                title="Download 2000px High-Res PNG"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{isExportingPng ? 'Exporting...' : 'PNG'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Hint Ribbon (Hidden during print) */}
      <div className="no-print bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Print Tip:</strong> Set printer Destination to <em>"Save as PDF"</em> or select your color printer. Ensure layout is set to <strong>Landscape</strong> and Margins to <strong>None</strong> for a 100% full-bleed luxury award.
        </span>
      </div>

      {/* Main Print Stage Area */}
      <div
        id="direct-print-page-wrapper"
        ref={printStageRef}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-auto"
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out'
          }}
          className="relative transition-transform shadow-2xl rounded-sm print:shadow-none"
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
