import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Safely converts any oklch(...) colors to standard sRGB values
 * using a canvas 2D context. This prevents rendering errors when
 * capturing elements styled with Tailwind CSS v4 or modern color functions.
 */
function convertOklchColors(root: HTMLElement): void {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const toRgb = (val: string): string => {
      if (!val || typeof val !== 'string' || !val.includes('oklch')) return val;
      try {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = val;
        return ctx.fillStyle;
      } catch {
        return val;
      }
    };

    const elements = [root, ...Array.from(root.querySelectorAll('*'))] as (HTMLElement | SVGElement)[];

    for (const el of elements) {
      if (el.style) {
        for (let i = 0; i < el.style.length; i++) {
          const prop = el.style[i];
          const val = el.style.getPropertyValue(prop);
          if (val && val.includes('oklch')) {
            const converted = toRgb(val);
            if (converted && !converted.includes('oklch')) {
              el.style.setProperty(prop, converted);
            }
          }
        }
      }

      const svgAttrs = ['stop-color', 'fill', 'stroke', 'flood-color', 'lighting-color'];
      for (const attr of svgAttrs) {
        const val = el.getAttribute(attr);
        if (val && val.includes('oklch')) {
          const converted = toRgb(val);
          if (converted && !converted.includes('oklch')) {
            el.setAttribute(attr, converted);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Certificate color sanitization notice:', e);
  }
}

/**
 * Locate the certificate container element by primary ID or known fallbacks
 */
export function getCertificateElement(preferredId?: string): HTMLElement | null {
  if (preferredId) {
    const direct = document.getElementById(preferredId);
    if (direct) return direct;

    // Try common variants (e.g. adding or removing -container)
    const containerVariant = document.getElementById(`${preferredId}-container`);
    if (containerVariant) return containerVariant;

    const trimmed = preferredId.replace(/-container$/, '');
    const trimmedEl = document.getElementById(trimmed);
    if (trimmedEl) return trimmedEl;
  }

  // Fallback to data attribute selector or well-known IDs
  const byAttr = document.querySelector('[data-certificate-root="true"]') as HTMLElement;
  if (byAttr) return byAttr;

  const fallbackIds = [
    'view-eom-certificate-container',
    'view-app-certificate-container',
    'view-custom-certificate-container',
    'eom-certificate-container',
    'app-certificate-container',
    'custom-certificate-container',
    'view-eom-certificate',
    'view-app-certificate'
  ];

  for (const id of fallbackIds) {
    const el = document.getElementById(id);
    if (el) return el;
  }

  return null;
}

/**
 * Clones the certificate element to an off-screen container without CSS transform
 * to ensure 100% complete, unclipped, crystal-clear 2000x1400 canvas capture.
 */
export async function captureCertificateCanvas(elementId?: string): Promise<HTMLCanvasElement> {
  const original = getCertificateElement(elementId);
  if (!original) {
    throw new Error('Certificate element not found on page. Please make sure the certificate is visible.');
  }

  // Detect orientation from element dimensions or attribute
  const isPortrait =
    original.offsetHeight > original.offsetWidth ||
    original.getAttribute('data-orientation') === 'portrait' ||
    (original.firstElementChild && original.firstElementChild.getAttribute('data-orientation') === 'portrait');
  const targetWidth = isPortrait ? 700 : 1000;
  const targetHeight = isPortrait ? 1000 : 700;

  // Create an offscreen mount within viewport coordinate space so styles, fonts & images compute accurately
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.left = '0';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.width = `${targetWidth}px`;
  offscreenContainer.style.height = `${targetHeight}px`;
  offscreenContainer.style.zIndex = '-9999';
  offscreenContainer.style.overflow = 'visible';
  offscreenContainer.style.opacity = '0.01';
  offscreenContainer.style.pointerEvents = 'none';

  const clone = original.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.width = `${targetWidth}px`;
  clone.style.height = `${targetHeight}px`;
  clone.style.minWidth = `${targetWidth}px`;
  clone.style.minHeight = `${targetHeight}px`;
  clone.style.maxWidth = `${targetWidth}px`;
  clone.style.maxHeight = `${targetHeight}px`;
  clone.style.boxShadow = 'none';

  // Strip any builder interactive handles, selection rings, and action toolbars from the clone
  try {
    const builderOverlays = clone.querySelectorAll(
      '[class*="ring-sky"], [class*="ring-2"], [class*="hover:ring"], [class*="cursor-grab"], [class*="animate-fade-in"], .absolute.-top-7'
    );
    builderOverlays.forEach((el) => {
      if (el instanceof HTMLElement) {
        if (el.classList.contains('-top-7') || el.textContent?.includes('px') || el.querySelector('svg')) {
          el.remove();
        }
      }
    });

    clone.querySelectorAll('*').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove('ring-2', 'ring-sky-500', 'ring-offset-2', 'hover:ring-1', 'hover:ring-sky-400/60');
        if (el.style.outline && el.style.outline.includes('sky')) {
          el.style.outline = 'none';
        }
      }
    });
  } catch (e) {
    console.warn('Overlay cleanup warning:', e);
  }

  convertOklchColors(clone);

  offscreenContainer.appendChild(clone);
  document.body.appendChild(offscreenContainer);

  try {
    // Wait for all images inside cloned certificate to be loaded
    const imgs = Array.from(clone.querySelectorAll('img'));
    if (imgs.length > 0) {
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = () => res(null);
            img.onerror = () => res(null);
            setTimeout(() => res(null), 400);
          });
        })
      );
    }

    // Wait for document fonts if available
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Continue if fonts check errors
      }
    }

    // Brief stabilization delay for layout reflow and background textures
    await new Promise((res) => setTimeout(res, 80));

    const canvas = await html2canvas(clone, {
      scale: 2.5, // 2.5x gives 2500x1750 ultra HD sharpness for print
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: targetWidth,
      height: targetHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (_clonedDoc, clonedEl) => {
        convertOklchColors(clonedEl);
      }
    });

    return canvas;
  } finally {
    if (document.body.contains(offscreenContainer)) {
      document.body.removeChild(offscreenContainer);
    }
  }
}

/**
 * Download certificate as high-resolution PNG
 */
export async function downloadCertificatePng(elementId?: string, filename: string = 'Warwick_Certificate.png'): Promise<void> {
  const canvas = await captureCertificateCanvas(elementId);
  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

  const link = document.createElement('a');
  link.download = cleanFilename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download certificate as landscape A4 PDF
 */
export async function downloadCertificatePdf(elementId?: string, filename: string = 'Warwick_Certificate.pdf'): Promise<void> {
  const canvas = await captureCertificateCanvas(elementId);
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Convert canvas to high-quality JPEG
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // Landscape A4 dimensions: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

  // Add certificate image full bleed
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  pdf.save(cleanFilename);
}

/**
 * Robust print function with multiple fallback strategies:
 * 1. Capture high-res canvas image
 * 2. Mount dedicated landscape print overlay
 * 3. Invoke window.print()
 */
/**
 * Print Certificate with maximum fidelity:
 * Uses an isolated hidden iframe with landscape layout and exact color adjustment.
 * This ensures:
 * 1. Only the certificate image is printed (no background page, modals or navigation).
 * 2. The DOM is NOT prematurely deleted while the print dialog or spooler is active.
 * 3. Works seamlessly inside iframes and standard tabs.
 */
export async function printCertificate(elementId?: string, title: string = 'Warwick Certificate'): Promise<void> {
  const canvas = await captureCertificateCanvas(elementId);
  const imgData = canvas.toDataURL('image/png');

  // Detect orientation from canvas aspect ratio
  const isPortrait = canvas.height > canvas.width;
  const pageOrientation = isPortrait ? 'portrait' : 'landscape';

  // Remove any stale print iframes
  const oldIframes = document.querySelectorAll('.warwick-print-frame');
  oldIframes.forEach(el => el.remove());

  // Create isolated invisible iframe positioned offscreen (visible to DOM tree so print dialog is allowed)
  const iframe = document.createElement('iframe');
  iframe.className = 'warwick-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '10px';
  iframe.style.height = '10px';
  iframe.style.border = '0';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-99999';
  document.body.appendChild(iframe);

  const pri = iframe.contentWindow || iframe.contentDocument;
  if (!pri) {
    // Direct fallback if iframe creation fails
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<img src="${imgData}" style="width:100%;height:100%;object-fit:contain" onload="window.print();window.close();"/>`);
      win.document.close();
    }
    return;
  }

  const doc = iframe.contentWindow?.document || (iframe.contentDocument as Document);
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${pageOrientation};
            margin: 4mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: #ffffff !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cert-container {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
          }
          img.cert-img {
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @media print {
            @page {
              size: ${pageOrientation};
              margin: 4mm;
            }
            html, body {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cert-container {
              width: 100% !important;
              height: 100% !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
            }
            img.cert-img {
              max-width: 100% !important;
              max-height: 100% !important;
              width: auto !important;
              height: auto !important;
              object-fit: contain !important;
              display: block !important;
              margin: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <img class="cert-img" id="print-cert-target" src="${imgData}" alt="${title}" />
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for the certificate image to fully load before triggering print
  await new Promise<void>((resolve) => {
    const img = doc.getElementById('print-cert-target') as HTMLImageElement | null;
    let resolved = false;

    const triggerPrint = () => {
      if (resolved) return;
      resolved = true;
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve();
        } catch (e) {
          console.warn('Iframe print focus error, using window fallback:', e);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(doc.documentElement.outerHTML);
            win.document.close();
            win.focus();
            setTimeout(() => {
              win.print();
            }, 300);
          }
          resolve();
        }
      }, 250);
    };

    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        triggerPrint();
      } else {
        img.onload = () => triggerPrint();
        img.onerror = () => triggerPrint();
      }
    } else {
      setTimeout(triggerPrint, 350);
    }
  });

  // Keep the iframe alive for 2 minutes to ensure print spooler completes without premature garbage collection
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      iframe.remove();
    }
  }, 120000);
}

