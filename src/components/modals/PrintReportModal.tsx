import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Crown,
  ExternalLink,
  CheckCircle2,
  FileText,
  Languages,
  Sparkles,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  UserCheck,
  Phone,
  CreditCard,
  MapPin,
  Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { LostItem } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';

export type HandoverPdfTemplate = 'warwick_english' | 'warwick_arabic';

export const PrintReportModal: React.FC = () => {
  const { isPrintModalOpen, setIsPrintModalOpen, selectedItem, printMode, settings } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<HandoverPdfTemplate>('warwick_english');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const printSheetRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsPrintModalOpen(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isPrintModalOpen && !!selectedItem,
    closeOnEsc: true
  });

  const isHandedOver = selectedItem?.status === 'Handed Over' || !!selectedItem?.handoverDetails;
  const isDispatched = selectedItem?.status === 'Dispatched';

  // Generate dynamic high-resolution QR Code
  useEffect(() => {
    if (selectedItem) {
      const qrPayload = JSON.stringify({
        hotel: settings.hotelName || 'Warwick Hotel Al Baha',
        code: selectedItem.code,
        item: selectedItem.itemName,
        category: selectedItem.category,
        status: selectedItem.status,
        dateFound: selectedItem.dateFound,
        location: selectedItem.locationFound,
        store: selectedItem.storeLocation,
        receiver: selectedItem.handoverDetails?.receiverName || 'N/A',
        verified: new Date().toISOString()
      });

      QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(() => {
          QRCode.toDataURL(`WARWICK-LF:${selectedItem.code}`, { width: 260, margin: 1 })
            .then(url => setQrCodeDataUrl(url))
            .catch(() => {});
        });
    }
  }, [selectedItem, settings]);

  if (!isPrintModalOpen || !selectedItem) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatLongDateEn = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatLongDateAr = (dateStr?: string) => {
    if (!dateStr) {
      return new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    try {
      const d = new Date(dateStr);
      return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()} م`;
    } catch {
      return dateStr;
    }
  };

  const getPrintedTimestampEn = () => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  };

  const getPrintedTimestampAr = () => {
    const d = new Date();
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}م`;
    const timeStr = d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  // Robust printing mechanism: Isolated iframe print + Popup Window fallback
  const handlePrint = () => {
    if (!printSheetRef.current) return;
    try {
      const isArabic = selectedTemplate === 'warwick_arabic';
      const printContent = printSheetRef.current.innerHTML;

      // Remove any stale print iframes
      const oldIframes = document.querySelectorAll('.warwick-report-print-frame');
      oldIframes.forEach(el => el.remove());

      const iframe = document.createElement('iframe');
      iframe.className = 'warwick-report-print-frame';
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
        handleOpenPrintWindow();
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8">
            <title>${selectedItem.code} - ${isArabic ? 'نموذج تسليم المفقودات الرسمي' : 'Lost & Found Official Handover Form'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { 
                size: A4 portrait; 
                margin: 8mm 10mm 8mm 10mm; 
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: #0f172a !important;
                font-family: ${isArabic ? "'Cairo', 'Amiri', system-ui, sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif"};
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              .handover-page {
                width: 100% !important;
                max-width: 780px !important;
                margin: 0 auto !important;
                background: white !important;
                padding: 4px 6px !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .handover-page-1 {
                page-break-after: always !important;
                break-after: page !important;
              }
              .page-divider {
                display: none !important;
              }
              @media print {
                body { padding: 0 !important; margin: 0 !important; }
                .print-wrapper { max-width: 100% !important; box-shadow: none !important; border: none !important; }
                .handover-page { padding: 2px 4px !important; }
                .page-divider { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-wrapper">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Preload images (hotel logo & QR code) before triggering print
      const images = Array.from(doc.images);
      const imagePromises = images.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(res => {
          img.onload = () => res();
          img.onerror = () => res();
          setTimeout(res, 800);
        });
      });

      Promise.all(imagePromises).then(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print error, falling back to popup window:', err);
            handleOpenPrintWindow();
          }
        }, 250);
      });

      // Cleanup after 2 minutes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          iframe.remove();
        }
      }, 120000);
    } catch (e) {
      console.warn('Iframe printing failed, using popup window fallback:', e);
      handleOpenPrintWindow();
    }
  };

  const handleOpenPrintWindow = () => {
    if (!printSheetRef.current) return;
    try {
      const isArabic = selectedTemplate === 'warwick_arabic';
      const printContent = printSheetRef.current.innerHTML;
      const printWindow = typeof window !== 'undefined' && window.open ? window.open('', '_blank', 'width=880,height=1050') : null;
      if (printWindow && printWindow.document) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
            <head>
              <meta charset="utf-8">
              <title>${selectedItem.code} - ${isArabic ? 'نموذج تسليم المفقودات الرسمي' : 'Lost & Found Official Handover Form'}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { 
                  size: A4 portrait; 
                  margin: 8mm 10mm; 
                }
                body {
                  background: white !important;
                  color: #0f172a !important;
                  font-family: ${isArabic ? "'Cairo', 'Amiri', system-ui, sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif"};
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  margin: 0;
                  padding: 8px;
                }
                .print-wrapper {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                }
                .handover-page {
                  width: 100% !important;
                  margin: 0 auto !important;
                  background: white !important;
                  padding: 4px 6px !important;
                  box-sizing: border-box !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .handover-page-1 {
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .page-divider {
                  display: none !important;
                }
                @media print {
                  body { padding: 0 !important; }
                  .print-wrapper { max-width: 100% !important; box-shadow: none !important; border: none !important; }
                  .handover-page { padding: 2px 4px !important; }
                  .page-divider { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="print-wrapper">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    try {
                      window.focus();
                      window.print();
                    } catch (e) {}
                  }, 350);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else if (typeof window !== 'undefined') {
        window.print();
      }
    } catch {
      if (typeof window !== 'undefined') {
        try {
          window.print();
        } catch {}
      }
    }
  };

  const getStatusLabelEn = (status: string) => {
    switch (status) {
      case 'Handed Over':
        return 'HANDED OVER';
      case 'Dispatched':
        return 'DISPATCHED';
      case 'Pending Approval':
        return 'PENDING APPROVAL';
      default:
        return 'STORED';
    }
  };

  const getStatusLabelAr = (status: string) => {
    switch (status) {
      case 'Handed Over':
        return 'تم التسليم للنزيل';
      case 'Dispatched':
        return 'تم الإرسال / الشحن';
      case 'Pending Approval':
        return 'بانتظار الاعتماد';
      default:
        return 'محفوظ بالمستودع';
    }
  };

  const getCategoryAr = (cat: string) => {
    const map: Record<string, string> = {
      'Electronics': 'أجهزة إلكترونية',
      'Clothing': 'ملابس ومنسوجات',
      'Accessories': 'إكسسوارات ومقتنيات',
      'Documents & Cards': 'وثائق وبطاقات ثبوتية',
      'Jewelry & Valuables': 'مجوهرات وأشياء ثمينة',
      'Luggage & Bags': 'حقائب وأمتعة',
      'Keys': 'مفاتيح',
      'Personal Care': 'عناية شخصية',
      'Cash & Wallet': 'أموال ومحافظ نقدية',
      'Eyewear': 'نظارات وبصريات',
      'Other': 'أخرى'
    };
    return map[cat] || cat;
  };

  // Render Single Page Copy (Guest Copy or Hotel Copy)
  const renderSinglePage = (copyType: 'guest' | 'hotel', isArabic: boolean) => {
    const isGuest = copyType === 'guest';
    const logoSrc = settings.certificateLogoUrl || settings.logoUrl;

    return (
      <div className="space-y-3.5 text-slate-900 leading-normal">
        {/* Page & Copy Identifier Header Tag */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs">
          <span
            className={`px-3 py-0.5 rounded-md font-bold uppercase tracking-wider text-[11px] border ${
              isGuest
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {isArabic
              ? (isGuest ? 'الصفحة ١ من ٢ • نسخة النزيل' : 'الصفحة ٢ من ٢ • نسخة إدارة الفندق / الأرشيف')
              : (isGuest ? 'Page 1 of 2 • GUEST COPY' : 'Page 2 of 2 • HOTEL COPY / ARCHIVE')}
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-500">
            {isArabic ? `رقم السجل: ${selectedItem.code}` : `Ref: ${selectedItem.code}`}
          </span>
        </div>

        {/* Clean Header: ONLY Hotel Logo + Form Title below it */}
        <div className="text-center flex flex-col items-center pb-1">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Hotel Logo"
              className="h-12 sm:h-14 max-w-[200px] object-contain mb-1"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-1 shadow-xs">
              <Crown className="w-6 h-6" strokeWidth={1.8} />
            </div>
          )}

          <div className="px-4 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold tracking-wider text-slate-900 uppercase">
            {isArabic ? 'نموذج تسليم المفقودات الرسمي' : 'Lost & Found Official Handover Form'}
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-b-2 border-slate-900 w-full" />

        {/* High-Contrast Navy Bar with Item Reference & Status Badge */}
        <div className="bg-[#1e293b] text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              {isArabic ? 'الرقم المرجعي الرسمي للمادة' : 'Official Inventory Reference'}
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-amber-300">
              {isArabic ? `رمز المادة: ${selectedItem.code}` : `Item Code: ${selectedItem.code}`}
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-2xs ${
                isHandedOver
                  ? 'bg-emerald-400 text-emerald-950'
                  : isDispatched
                  ? 'bg-sky-300 text-sky-950'
                  : 'bg-amber-300 text-amber-950'
              }`}
            >
              {isArabic ? getStatusLabelAr(selectedItem.status) : getStatusLabelEn(selectedItem.status)}
            </span>
          </div>
        </div>

        {/* Section 1: Item Specifications & Discovery Data */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 flex items-center justify-between uppercase tracking-wider">
            <span className="text-indigo-950">
              {isArabic ? '١. بيانات المادة المفقودة ومكان العثور' : '1. Item Specifications & Discovery Data'}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {isArabic ? `تاريخ العثور: ${formatDate(selectedItem.dateFound)}` : `found on ${formatDate(selectedItem.dateFound)}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'اسم المادة:' : 'Item Name:'}</span>
              <span
                className="font-bold text-slate-900 truncate capitalize"
                style={{ textTransform: 'capitalize' }}
              >
                {selectedItem.itemName}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'التصنيف:' : 'Category:'}</span>
              <span className="font-semibold text-slate-800">
                {isArabic ? getCategoryAr(selectedItem.category) : selectedItem.category}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'مكان العثور:' : 'Location Found:'}</span>
              <span className="text-slate-900 font-medium">{selectedItem.locationFound}</span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'موقع الحفظ:' : 'Storage Location:'}</span>
              <span className="text-indigo-700 font-bold">{selectedItem.storeLocation}</span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'الغرفة / النزيل:' : 'Guest Room / Name:'}</span>
              <span className="text-slate-900">
                {selectedItem.roomNumber ? `${isArabic ? 'غرفة ' : 'Room '}${selectedItem.roomNumber}` : ''}
                {selectedItem.guestName ? ` (${selectedItem.guestName})` : !selectedItem.roomNumber ? 'N/A' : ''}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'الموظف الذي عثر:' : 'Finder Staff:'}</span>
              <span className="text-slate-900">{selectedItem.employeeName || (isArabic ? 'موظف الفندق' : 'Staff Member')}</span>
            </div>

            <div className="flex col-span-2">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'موظف التسجيل:' : 'Registered Officer:'}</span>
              <span className="text-slate-900 font-bold">{selectedItem.recordedBy}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Handover Information */}
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[11px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 flex items-center justify-between uppercase tracking-wider">
            <span className="text-indigo-950">
              {isArabic ? '٢. بيانات تسليم المادة والمستلم' : '2. Handover & Release Information'}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {isArabic ? 'سجل التحقق والتسليم' : 'claimant / recipient record'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'تاريخ التسليم:' : 'Handover Date:'}</span>
              <span className="text-slate-900 font-semibold">
                {selectedItem.handoverDetails?.handoverDate
                  ? (isArabic ? formatLongDateAr(selectedItem.handoverDetails.handoverDate) : formatLongDateEn(selectedItem.handoverDetails.handoverDate))
                  : '_____________________'}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'الموظف المسلّم:' : 'Handed Over By:'}</span>
              <span className="text-slate-900 font-bold">
                {selectedItem.handoverDetails?.handedOverBy || selectedItem.recordedBy || (isArabic ? 'موظف الاستقبال' : 'Staff Officer')}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'اسم المستلم:' : 'Receiver Name:'}</span>
              <span className="text-slate-900 font-bold">
                {selectedItem.handoverDetails?.receiverName || '_____________________'}
              </span>
            </div>

            <div className="flex">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'رقم التواصل:' : 'Contact Number:'}</span>
              <span className="text-slate-900 font-mono font-medium">
                {selectedItem.handoverDetails?.contactNumber || '_____________________'}
              </span>
            </div>

            <div className="flex col-span-2">
              <span className="text-slate-500 font-medium w-28 shrink-0">{isArabic ? 'ملاحظات / الإثبات:' : 'Remarks / ID Ref:'}</span>
              <span className="text-slate-900 text-[11px]">
                {selectedItem.handoverDetails?.remarks || (isArabic ? 'تم التحقق من مطابقة الهوية ومواصفات المادة الشخصية قبل التسليم.' : 'Identity verified against hotel registration / photo ID.')}
              </span>
            </div>
          </div>

          {/* Handover Verification Callout Banner */}
          {isHandedOver ? (
            <div className="p-2 bg-emerald-50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-emerald-500 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl text-xs text-emerald-900 space-y-0.5">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isArabic ? 'تم تسليم المادة رسمياً إلى صاحبها / النزيل' : 'Item Successfully Released & Handed Over'}</span>
              </div>
              <div className="text-[10px] text-emerald-800">
                {isArabic
                  ? `سُلّمت بواسطة الموظف (${selectedItem.handoverDetails?.handedOverBy || selectedItem.recordedBy}) إلى المستلم "${selectedItem.handoverDetails?.receiverName}".`
                  : `Handed Over by ${selectedItem.handoverDetails?.handedOverBy || selectedItem.recordedBy} to guest "${selectedItem.handoverDetails?.receiverName}".`}
              </div>
            </div>
          ) : (
            <div className="p-2 bg-slate-50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-indigo-600 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl text-xs text-slate-700 space-y-0.5">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse font-bold text-indigo-950 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{isArabic ? 'سند تسليم رسمي (جاهز للتنفيذ والتوقيع)' : 'Official Handover Voucher (Ready for Execution)'}</span>
              </div>
              <div className="text-[10px] text-slate-600">
                {isArabic
                  ? `المادة محفوظة حالياً في ${selectedItem.storeLocation}. يُعتمد هذا السند ويُوقع عند التسليم الفعلي للنزيل.`
                  : `Item is stored at ${selectedItem.storeLocation}. To be signed and stamped upon physical property return to the guest.`}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Legal Acknowledgment & Custody Release */}
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[11px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 uppercase tracking-wider">
            {isArabic ? '٣. إقرار وتعهد الاستلام وإخلاء الطرف' : '3. Legal Acknowledgment & Custody Release'}
          </div>

          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 leading-relaxed">
            {isGuest ? (
              isArabic ? (
                'أقر أنا الموقع أدناه بأنني قد استلمت المادة المذكورة بياناتها أعلاه كاملة وبحالة سليمة ومطابقة لما فقدته، وأؤكد أنها من ممتلكاتي الشخصية، وبموجب هذا التوقيع أبرئ ذمة إدارة الفندق وموظفيها من أي مسؤولية لاحقة تتعلق بحفظ أو تسليم هذه المادة.'
              ) : (
                <>I hereby acknowledge receipt of the above-mentioned property in good condition and confirm that it is my rightful personal belonging. By signing this document, I release <strong>{settings.hotelName || 'hotel management'}</strong> and its staff from any further custody liability or claims regarding this item.</>
              )
            ) : (
              isArabic ? (
                'سجل الأرشيف الفندقي المعتمد: تم التحقق من هوية المستلم ومطابقتها لسجلات الفندق الرسمية. يُحفظ هذا النموذج في سجلات قسم التدبير الفندقي والأمن كإثبات رسمي لتسليم المادة وإخلاء طرف الفندق.'
              ) : (
                <>Official Hotel Archive Record: Retained permanently by the Housekeeping & Security Department following verified release of property. Confirms compliance with standard hotel lost & found operating policies.</>
              )
            )}
          </div>

          {/* Dual Official Signature Blocks */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Guest / Claimant Signature Box */}
            <div className="p-2.5 border border-slate-300 rounded-xl bg-white space-y-1.5">
              <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                <span>{isArabic ? 'توقيع المستلم / النزيل' : 'Guest / Claimant Signature'}</span>
                <UserCheck className="w-3 h-3 text-slate-400" />
              </div>
              <div className="h-9 border-b border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-300 italic">
                {isArabic ? '[ التوقيع المعتمد ]' : '[ Authorized Signature ]'}
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div><span className="text-slate-500">{isArabic ? 'الاسم:' : 'Name:'}</span> <strong className="text-slate-900">{selectedItem.handoverDetails?.receiverName || '________________________'}</strong></div>
                <div><span className="text-slate-500">{isArabic ? 'التاريخ:' : 'Date:'}</span> <span>{selectedItem.handoverDetails?.handoverDate ? (isArabic ? formatLongDateAr(selectedItem.handoverDetails.handoverDate) : formatLongDateEn(selectedItem.handoverDetails.handoverDate)) : (isArabic ? formatLongDateAr() : formatLongDateEn())}</span></div>
              </div>
            </div>

            {/* Employee Signature Box */}
            <div className="p-2.5 border border-slate-300 rounded-xl bg-white space-y-1.5">
              <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                <span>{isArabic ? 'توقيع الموظف المعتمد' : 'Employee Signature'}</span>
                <Building2 className="w-3 h-3 text-slate-400" />
              </div>
              <div className="h-9 border-b border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-300 italic">
                {isArabic ? '[ توقيع الموظف ]' : '[ Employee Signature ]'}
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div><span className="text-slate-500">{isArabic ? 'الموظف:' : 'Employee:'}</span> <strong className="text-slate-900">{selectedItem.handoverDetails?.handedOverBy || selectedItem.recordedBy || (isArabic ? 'الموظف' : 'Staff')}</strong></div>
                <div><span className="text-slate-500">{isArabic ? 'التاريخ:' : 'Date:'}</span> <span>{isArabic ? formatLongDateAr() : formatLongDateEn()}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Official Hotel Contacts & Verification QR */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="space-y-0.5 text-slate-600 text-[9px] leading-tight">
            <div className="font-semibold text-slate-900 text-[10px]">{settings.hotelName || 'Warwick Hotel Al Baha'}</div>
            <div>{settings.address || 'King Abdulaziz Rd, Baljurashi 65629, Al Baha, Saudi Arabia'}</div>
            <div>Phone: {settings.phoneNumber || '017 512 2070'} • Email: {settings.emailAddress || 'warwickhotelbaha@gmail.com'}</div>
            <div className="text-indigo-600">{settings.website || 'https://www.warwickhotels.com/warwick-hotel-bahah'}</div>
            <div className="text-slate-400 pt-0.5">
              {isArabic ? `رقم السند: WARWICK-HO-${selectedItem.code} • تاريخ وتوقيت الطباعة: ${getPrintedTimestampAr()}` : `Document Ref: WARWICK-HO-${selectedItem.code} • Printed: ${getPrintedTimestampEn()}`}
            </div>
          </div>

          {/* QR Code Verification */}
          <div className="shrink-0 pl-3 rtl:pl-0 rtl:pr-3 flex flex-col items-center">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code Verification"
                className="w-16 h-16 border border-slate-200 rounded-lg p-0.5 bg-white shadow-2xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">
                QR Code
              </div>
            )}
            <span className="text-[8px] font-mono font-bold text-slate-600 mt-0.5">{selectedItem.code}</span>
          </div>
        </div>
      </div>
    );
  };

  const isArabic = selectedTemplate === 'warwick_arabic';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">
                  Lost &amp; Found Official Handover Form
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-400/30">
                  {selectedItem.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                2-Page Official PDF: Page 1 (Guest Copy) &bull; Page 2 (Hotel Copy)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-open-print-window"
              onClick={handleOpenPrintWindow}
              title="Open standalone print dialog window"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Window</span>
            </button>

            <button
              id="btn-trigger-print"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF (2 Pages)</span>
            </button>

            <button
              id="btn-close-print-modal"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Language Template Switcher Bar & Page Indicators */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Language:
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setSelectedTemplate('warwick_english')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTemplate === 'warwick_english'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplate('warwick_arabic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTemplate === 'warwick_arabic'
                    ? 'bg-indigo-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Page 1: Guest Copy
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Page 2: Hotel Copy
            </span>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200/70 text-slate-900 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={printSheetRef}
            id="printable-receipt-container"
            className="max-w-[760px] mx-auto print:border-none print:p-0 print:shadow-none print:rounded-none print:max-w-none space-y-6 print:space-y-0"
          >
            {/* ========================================================================= */}
            {/* PAGE 1: GUEST COPY (Strictly fits on single A4 page) */}
            {/* ========================================================================= */}
            <div
              className={`handover-page handover-page-1 bg-white p-6 sm:p-8 shadow-md rounded-2xl print:border-none print:p-0 print:shadow-none print:rounded-none ${
                isArabic ? "font-['Cairo']" : 'font-sans'
              }`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {renderSinglePage('guest', isArabic)}
            </div>

            {/* Visual Page Break Separator (Hidden during print) */}
            <div className="page-divider my-6 flex items-center justify-center print:hidden">
              <div className="h-px bg-slate-300 flex-1" />
              <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mx-3 shadow-2xs border border-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                {isArabic ? 'فاصل الصفحات • الصفحة ٢ أدناه (نسخة الفندق)' : 'Page Break • Page 2 Below (Hotel Copy)'}
              </span>
              <div className="h-px bg-slate-300 flex-1" />
            </div>

            {/* ========================================================================= */}
            {/* PAGE 2: HOTEL COPY (Strictly fits on single A4 page) */}
            {/* ========================================================================= */}
            <div
              className={`handover-page handover-page-2 bg-white p-6 sm:p-8 shadow-md rounded-2xl print:border-none print:p-0 print:shadow-none print:rounded-none ${
                isArabic ? "font-['Cairo']" : 'font-sans'
              }`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {renderSinglePage('hotel', isArabic)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
