import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Certificate } from '../../types';
import { CertificateRenderer } from './CertificateTemplates';

interface DirectCertificatePrintPortalProps {
  certificate: Certificate | null;
  onDone: () => void;
}

/**
 * DirectCertificatePrintPortal
 * Mounts the certificate directly into document.body (outside #root) and invokes
 * native browser print dialog with full-bleed landscape styling.
 *
 * Prevents opening any intermediate modal or screen, providing immediate direct
 * dispatch to the user's printer.
 */
export const DirectCertificatePrintPortal: React.FC<DirectCertificatePrintPortalProps> = ({
  certificate,
  onDone
}) => {
  const [mounted, setMounted] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!certificate || !mounted) return;

    let isCleanedUp = false;

    const executeDirectPrint = async () => {
      // 1. Wait for custom luxury typography (Cinzel, Playfair Display, Plus Jakarta Sans, etc.)
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font readiness error
        }
      }

      // 2. Allow brief browser tick for SVG emblems, seals and gold gradients to compute
      await new Promise((resolve) => setTimeout(resolve, 80));

      if (isCleanedUp) return;

      // 3. Mark body so CSS @media print isolates ONLY this certificate
      document.body.classList.add('is-printing-certificate');

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        document.body.classList.remove('is-printing-certificate');
        window.removeEventListener('afterprint', cleanup);
        onDone();
      };

      window.addEventListener('afterprint', cleanup);

      // 4. Trigger printer dialog directly
      try {
        window.print();
      } catch (err: any) {
        console.warn('[DirectPrint] window.print() restricted in iframe, attempting popup fallback:', err);
        try {
          const content = printSheetRef.current?.innerHTML || '';
          const printWin = window.open('', '_blank', 'width=1100,height=800');
          if (printWin) {
            printWin.document.write(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <title>${certificate.recipientName || 'Certificate'} - ${certificate.title || 'Award'}</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Pinyon+Script&family=Alex+Brush&display=swap" rel="stylesheet">
                  <style>
                    @page {
                      size: landscape;
                      margin: 0 !important;
                    }
                    *, *::before, *::after {
                      box-sizing: border-box;
                      margin: 0;
                      padding: 0;
                    }
                    html, body {
                      width: 100vw !important;
                      height: 100vh !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background-color: #ffffff !important;
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      overflow: hidden !important;
                    }
                    .cert-wrapper {
                      width: 1000px;
                      height: 700px;
                      margin: auto;
                    }
                  </style>
                </head>
                <body>
                  <div class="cert-wrapper">
                    ${content}
                  </div>
                  <script>
                    window.onload = function() {
                      setTimeout(function() {
                        window.focus();
                        window.print();
                      }, 250);
                    };
                  </script>
                </body>
              </html>
            `);
            printWin.document.close();
          }
        } catch (popupErr) {
          console.error('[DirectPrint] Popup print failed:', popupErr);
        }
        cleanup();
      }

      // Safety timeout: in case afterprint does not fire in certain browser configurations
      setTimeout(cleanup, 2500);
    };

    executeDirectPrint();

    return () => {
      isCleanedUp = true;
      document.body.classList.remove('is-printing-certificate');
      window.removeEventListener('afterprint', onDone);
    };
  }, [certificate, mounted, onDone]);

  if (!certificate || !mounted) return null;

  return createPortal(
    <div
      id="direct-certificate-print-portal"
      className="hidden print:flex"
      aria-hidden="true"
    >
      <style>{`
        @page {
          size: landscape;
          margin: 0 !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide the entire standard application during certificate printing */
          body.is-printing-certificate #root {
            display: none !important;
          }
          /* Display only this print portal */
          body.is-printing-certificate #direct-certificate-print-portal {
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.is-printing-certificate #direct-certificate-print-portal .cert-print-sheet {
            width: 1000px !important;
            height: 700px !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div ref={printSheetRef} className="cert-print-sheet">
        <CertificateRenderer cert={certificate} idPrefix="direct-print-portal" />
      </div>
    </div>,
    document.body
  );
};
