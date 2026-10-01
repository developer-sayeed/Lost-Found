import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  QrCode,
  Tag,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LostItem } from '../../types';
import {
  generateItemQrDataUrl,
  downloadQrCodeImage,
  getItemQrPayload
} from '../../lib/qrcode';
import { useClickOutside } from '../../hooks/useClickOutside';

export const ItemQrCodeModal: React.FC = () => {
  const {
    isItemQrModalOpen,
    setIsItemQrModalOpen,
    qrModalItem,
    openItemDetails,
    openPrint,
    settings
  } = useApp();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const printLabelRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsItemQrModalOpen(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isItemQrModalOpen && !!qrModalItem,
    closeOnEsc: true
  });

  useEffect(() => {
    if (qrModalItem) {
      setIsGenerating(true);
      generateItemQrDataUrl(qrModalItem, settings.hotelName, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => {
          setQrDataUrl(url);
          setIsGenerating(false);
        })
        .catch(err => {
          console.warn('QR Code generation failed:', err);
          setIsGenerating(false);
        });
    }
  }, [qrModalItem, settings.hotelName]);

  const handleCopy = async () => {
    const itemUrl = `${window.location.origin}/?itemCode=${encodeURIComponent(qrModalItem?.code || '')}`;
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl && qrModalItem) {
      downloadQrCodeImage(qrDataUrl, qrModalItem.code, qrModalItem.itemName);
    }
  };

  // Print Sticky Tag strictly on A6 Paper (1 Single Page)
  const handlePrintLabel = () => {
    if (!qrModalItem) return;
    try {
      const hotelName = settings.hotelName || 'WARWICK HOTELS & RESORTS';
      const itemTitle = qrModalItem.itemName || qrModalItem.description;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>QR Tag - ${qrModalItem.code}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A6 portrait;
                margin: 4mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
                color: #0f172a !important;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                overflow: hidden !important;
              }
              .a6-container {
                width: 100% !important;
                max-width: 97mm !important;
                height: 100% !important;
                max-height: 139mm !important;
                margin: 0 auto !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .label-card {
                width: 100% !important;
                height: 100% !important;
                border: 2px dashed #475569 !important;
                border-radius: 12px !important;
                padding: 8px 10px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                text-align: center !important;
                box-sizing: border-box !important;
              }
              @media print {
                body { padding: 0 !important; margin: 0 !important; }
                .a6-container { max-width: 100% !important; }
              }
            </style>
          </head>
          <body class="p-0 m-0 flex items-center justify-center">
            <div class="a6-container">
              <div class="label-card">
                <!-- Hotel & Tag Header -->
                <div class="text-center pt-1">
                  <div class="text-[12px] font-extrabold tracking-wider uppercase text-slate-900">
                    ${hotelName}
                  </div>
                  <div class="text-[10px] text-indigo-700 uppercase tracking-widest font-bold mt-0.5">
                    INVENTORY TAG VERIFICATION
                  </div>
                </div>

                <!-- QR Code Center -->
                <div class="my-1 flex items-center justify-center">
                  <img
                    id="tag-qr-img"
                    src="${qrDataUrl}"
                    alt="${qrModalItem.code}"
                    style="width: 175px; height: 175px; object-fit: contain; margin: 0 auto; display: block; border-radius: 8px;"
                  />
                </div>

                <!-- Code & Item Name -->
                <div class="text-center">
                  <div class="text-base font-extrabold font-mono text-indigo-700 tracking-wider">
                    ${qrModalItem.code}
                  </div>
                  <div class="text-xs font-bold text-slate-900 truncate mt-0.5">
                    ${itemTitle}
                  </div>
                  <div class="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Category: ${qrModalItem.category}
                  </div>
                </div>

                <!-- Bottom Details -->
                <div class="border-t border-slate-300 pt-1.5 mt-1 text-[10px] text-slate-700">
                  <div class="flex justify-between font-bold">
                    <span>Loc: ${qrModalItem.locationFound}</span>
                    <span class="text-indigo-700">Store: ${qrModalItem.storeLocation}</span>
                  </div>
                  <div class="flex justify-between text-slate-500 text-[9px] mt-0.5">
                    <span>Found: ${qrModalItem.dateFound}</span>
                    <span>Finder: ${qrModalItem.employeeName || 'Staff'}</span>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Remove stale print iframes
      const oldIframes = document.querySelectorAll('.warwick-tag-print-frame');
      oldIframes.forEach(el => el.remove());

      const iframe = document.createElement('iframe');
      iframe.className = 'warwick-tag-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.zIndex = '-99999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || (iframe.contentDocument as Document);
      if (!doc) {
        handleOpenTagPrintWindow(htmlContent);
        return;
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      const img = doc.getElementById('tag-qr-img') as HTMLImageElement | null;
      const trigger = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            handleOpenTagPrintWindow(htmlContent);
          }
        }, 150);
      };

      if (img && (!img.complete || img.naturalWidth === 0)) {
        img.onload = () => trigger();
        img.onerror = () => trigger();
        setTimeout(trigger, 500);
      } else {
        trigger();
      }

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          iframe.remove();
        }
      }, 60000);
    } catch {
      handleOpenTagPrintWindow();
    }
  };

  const handleOpenTagPrintWindow = (fallbackHtml?: string) => {
    if (!qrModalItem) return;
    try {
      const hotelName = settings.hotelName || 'WARWICK HOTELS & RESORTS';
      const itemTitle = qrModalItem.itemName || qrModalItem.description;
      const content = fallbackHtml || `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>QR Tag - ${qrModalItem.code}</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A6 portrait; margin: 4mm; }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
                overflow: hidden !important;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              }
              .a6-container {
                width: 100% !important;
                max-width: 97mm !important;
                height: 100% !important;
                max-height: 139mm !important;
                margin: 0 auto !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .label-card {
                width: 100% !important;
                height: 100% !important;
                border: 2px dashed #475569 !important;
                border-radius: 12px !important;
                padding: 8px 10px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                text-align: center !important;
                box-sizing: border-box !important;
              }
            </style>
          </head>
          <body class="p-0 m-0 flex items-center justify-center">
            <div class="a6-container">
              <div class="label-card">
                <div class="text-center pt-1">
                  <div class="text-[12px] font-extrabold tracking-wider uppercase text-slate-900">${hotelName}</div>
                  <div class="text-[10px] text-indigo-700 uppercase tracking-widest font-bold mt-0.5">INVENTORY TAG VERIFICATION</div>
                </div>
                <div class="my-1 flex items-center justify-center">
                  <img src="${qrDataUrl}" alt="${qrModalItem.code}" style="width: 175px; height: 175px; object-fit: contain; margin: 0 auto; display: block; border-radius: 8px;" />
                </div>
                <div class="text-center">
                  <div class="text-base font-extrabold font-mono text-indigo-700 tracking-wider">${qrModalItem.code}</div>
                  <div class="text-xs font-bold text-slate-900 truncate mt-0.5">${itemTitle}</div>
                  <div class="text-[10px] text-slate-500 font-semibold mt-0.5">Category: ${qrModalItem.category}</div>
                </div>
                <div class="border-t border-slate-300 pt-1.5 mt-1 text-[10px] text-slate-700">
                  <div class="flex justify-between font-bold">
                    <span>Loc: ${qrModalItem.locationFound}</span>
                    <span class="text-indigo-700">Store: ${qrModalItem.storeLocation}</span>
                  </div>
                  <div class="flex justify-between text-slate-500 text-[9px] mt-0.5">
                    <span>Found: ${qrModalItem.dateFound}</span>
                    <span>Finder: ${qrModalItem.employeeName || 'Staff'}</span>
                  </div>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  try { window.focus(); window.print(); } catch(e) {}
                }, 250);
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = typeof window !== 'undefined' && window.open ? window.open('', '_blank', 'width=520,height=720') : null;
      if (printWindow && printWindow.document) {
        printWindow.document.write(content);
        printWindow.document.close();
      } else if (typeof window !== 'undefined') {
        window.print();
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  if (!isItemQrModalOpen || !qrModalItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Item QR Code &amp; Tag
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {qrModalItem.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsItemQrModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-inner">
            <div className="text-center mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {settings.hotelName || 'Warwick Hotels & Resorts'}
              </span>
              <p className="text-xs font-semibold text-slate-800">
                Inventory Tag Verification
              </p>
            </div>

            {/* QR Image */}
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              {isGenerating ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400 text-xs">
                  <span>Generating QR Tag...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${qrModalItem.code}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  <span>Failed to load QR code</span>
                </div>
              )}
            </div>

            {/* Item Code Badge */}
            <div className="mt-4 px-4 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
              <span className="font-mono text-sm font-bold text-indigo-600 tracking-wide">
                {qrModalItem.code}
              </span>
            </div>
          </div>

          {/* Item Quick Summary Info */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Item Name:</span>
              <span
                className="font-bold text-slate-900 truncate max-w-[200px] capitalize"
                style={{ textTransform: 'capitalize' }}
              >
                {qrModalItem.itemName || qrModalItem.description}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Category:</span>
              <span className="font-semibold text-slate-800">{qrModalItem.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Store Location:</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {qrModalItem.storeLocation}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Location Found:</span>
              <span className="font-medium text-slate-800">{qrModalItem.locationFound}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold text-slate-800">{qrModalItem.status}</span>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              id="btn-print-sticky-tag"
              onClick={handlePrintLabel}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticky Tag (A6)</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all col-span-2 sm:col-span-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Tag Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsItemQrModalOpen(false);
                openItemDetails(qrModalItem);
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl shadow-2xs transition-all col-span-2 sm:col-span-1"
            >
              <Eye className="w-4 h-4" />
              <span>View Full Details</span>
            </button>
          </div>
        </div>

        {/* Hidden Label Template for Direct Reference */}
        <div className="hidden">
          <div ref={printLabelRef} className="a6-container">
            <div className="label-card">
              <div className="text-[12px] font-extrabold tracking-wider uppercase text-slate-900">
                {settings.hotelName || 'WARWICK HOTELS & RESORTS'}
              </div>
              <div className="text-[10px] text-indigo-700 uppercase tracking-widest font-bold mt-0.5">
                INVENTORY TAG VERIFICATION
              </div>
              <div className="my-1 flex justify-center">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={qrModalItem.code}
                    style={{ width: '175px', height: '175px', margin: '0 auto', display: 'block' }}
                  />
                )}
              </div>
              <div className="text-base font-extrabold font-mono text-indigo-700">
                {qrModalItem.code}
              </div>
              <div
                className="text-xs font-bold text-slate-900 truncate capitalize"
                style={{ textTransform: 'capitalize' }}
              >
                {qrModalItem.itemName || qrModalItem.description}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Category: {qrModalItem.category}
              </div>
              <div className="text-[10px] text-slate-700 border-t border-slate-300 pt-1.5 mt-1 flex justify-between">
                <span>Loc: {qrModalItem.locationFound}</span>
                <span className="text-indigo-700 font-semibold">Store: {qrModalItem.storeLocation}</span>
              </div>
              <div className="text-[9px] text-slate-500 flex justify-between mt-0.5">
                <span>Found: {qrModalItem.dateFound}</span>
                <span>Finder: {qrModalItem.employeeName || 'Staff'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
