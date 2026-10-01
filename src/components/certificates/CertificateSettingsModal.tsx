import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Building2,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Star,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer,
  Eye,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HotelLogoDisplay } from './HotelLogoDisplay';
import { toast } from 'react-toastify';

interface CertificateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateSettingsModal: React.FC<CertificateSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hotelName, setHotelName] = useState<string>(
    settings.certificateHotelName || settings.hotelName || 'WARWICK'
  );
  const [hotelSubtitle, setHotelSubtitle] = useState<string>(
    settings.certificateHotelSubtitle ||
      settings.hotelSubTitle ||
      'HOTEL AL BAHA • HOTELS & RESORTS'
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    settings.certificateLogoUrl || settings.logoUrl || ''
  );
  const [showFiveStars, setShowFiveStars] = useState<boolean>(
    settings.certificateShowFiveStars !== false
  );
  const [logoSize, setLogoSize] = useState<number>(52);
  const [signatoryLeftTitle, setSignatoryLeftTitle] = useState<string>(
    settings.certificateDefaultSignatoryLeftTitle || 'Department Head'
  );
  const [signatoryLeftName, setSignatoryLeftName] = useState<string>(
    settings.certificateDefaultSignatoryLeftName || 'Executive Housekeeper'
  );
  const [signatoryRightTitle, setSignatoryRightTitle] = useState<string>(
    settings.certificateDefaultSignatoryRightTitle || 'General Manager'
  );
  const [signatoryRightName, setSignatoryRightName] = useState<string>(
    settings.certificateDefaultSignatoryRightName || 'Dr. Faisal Al-Ghamdi'
  );
  const [printBehavior, setPrintBehavior] = useState<'direct' | 'preview'>(
    settings.certificatePrintBehavior || (settings.certificateEnablePrintPreview ? 'preview' : 'direct')
  );

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setHotelName(settings.certificateHotelName || settings.hotelName || 'WARWICK');
      setHotelSubtitle(
        settings.certificateHotelSubtitle ||
          settings.hotelSubTitle ||
          'HOTEL AL BAHA • HOTELS & RESORTS'
      );
      setLogoUrl(settings.certificateLogoUrl || settings.logoUrl || '');
      setShowFiveStars(settings.certificateShowFiveStars !== false);
      setSignatoryLeftTitle(settings.certificateDefaultSignatoryLeftTitle || 'Department Head');
      setSignatoryLeftName(settings.certificateDefaultSignatoryLeftName || 'Executive Housekeeper');
      setSignatoryRightTitle(settings.certificateDefaultSignatoryRightTitle || 'General Manager');
      setSignatoryRightName(settings.certificateDefaultSignatoryRightName || 'Dr. Faisal Al-Ghamdi');
      setPrintBehavior(
        settings.certificatePrintBehavior || (settings.certificateEnablePrintPreview ? 'preview' : 'direct')
      );
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setLogoUrl(result);
        toast.success('Hotel logo image loaded successfully!');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read logo file');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        certificateLogoUrl: logoUrl,
        certificateHotelName: hotelName.trim() || 'WARWICK',
        certificateHotelSubtitle: hotelSubtitle.trim() || 'HOTEL AL BAHA • HOTELS & RESORTS',
        certificateShowFiveStars: showFiveStars,
        certificateDefaultSignatoryLeftTitle: signatoryLeftTitle.trim(),
        certificateDefaultSignatoryLeftName: signatoryLeftName.trim(),
        certificateDefaultSignatoryRightTitle: signatoryRightTitle.trim(),
        certificateDefaultSignatoryRightName: signatoryRightName.trim(),
        certificatePrintBehavior: printBehavior,
        certificateEnablePrintPreview: printBehavior === 'preview'
      });

      setSavedSuccess(true);
      toast.success('Certificate branding and print behavior saved successfully!');
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save certificate settings:', err);
      toast.error(err.message || 'Could not save certificate settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setHotelName(settings.hotelName || 'WARWICK');
    setHotelSubtitle(settings.hotelSubTitle || 'HOTEL AL BAHA • HOTELS & RESORTS');
    setLogoUrl(settings.logoUrl || '');
    setShowFiveStars(true);
    setSignatoryLeftTitle('Department Head');
    setSignatoryLeftName('Executive Housekeeper');
    setSignatoryRightTitle('General Manager');
    setSignatoryRightName('Dr. Faisal Al-Ghamdi');
    setPrintBehavior('direct');
    toast.info('Settings reset to default hotel branding and direct print.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Certificate Settings & Hotel Logo</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  5-Star Branding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your hotel logo and configure global brand identity for all certificate templates
              </p>
            </div>
          </div>

          <button
            id="btn-close-cert-settings"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Live Preview Card */}
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Certificate Header Preview
              </span>
              <span className="text-[10px] text-slate-400">Appears on every printed certificate</span>
            </div>

            <div className="bg-[#0b1b2d] rounded-lg p-6 flex flex-col items-center justify-center border border-amber-500/20 min-h-[140px] text-center">
              <HotelLogoDisplay
                hotelName={hotelName}
                hotelSubtitle={hotelSubtitle}
                hotelLogoUrl={logoUrl}
                hotelLogoPreset="warwick_crest"
                hotelLogoSize={logoSize}
                showHotelLogo={true}
                showFiveStars={showFiveStars}
                accentColor="#c59b27"
                primaryColor="#ffffff"
                textColor="#ffffff"
                layout="stacked"
              />
            </div>
          </div>

          {/* Section 1: Hotel Logo File Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Hotel Logo Image Upload
              </span>
              {logoUrl && (
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Custom Logo
                </span>
              )}
            </label>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {/* Drag & Drop File Input Component */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                  : logoUrl
                  ? 'border-amber-400/60 bg-amber-50/30 hover:bg-amber-50/60'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              {logoUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                      <img
                        src={logoUrl}
                        alt="Hotel Logo"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Dynamic Hotel Logo Active</p>
                      <p className="text-[11px] text-slate-500">
                        Click or drag & drop to replace this image
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Replace Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        toast.info('Custom logo removed. Default luxury crest will be used.');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload hotel logo or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recommended: Transparent PNG, SVG, or high-res JPG (Max 5MB)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    Browse Files
                  </span>
                </>
              )}
            </div>

            {/* Logo Scaling Slider */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Display Logo Size:</span>
                <span className="text-xs font-mono font-bold text-indigo-700">{logoSize}px</span>
              </div>
              <input
                type="range"
                min={32}
                max={90}
                step={2}
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="w-48 accent-indigo-600"
              />
            </div>
          </div>

          {/* Section 2: Hotel Names & 5-Star Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hotel Brand Name
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g. WARWICK"
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hotel Subtitle & Branch
              </label>
              <input
                type="text"
                value={hotelSubtitle}
                onChange={(e) => setHotelSubtitle(e.target.value)}
                placeholder="e.g. HOTEL AL BAHA • HOTELS & RESORTS"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showFiveStars}
                  onChange={(e) => setShowFiveStars(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    Display 5-Star Golden Rating Stars
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Renders the 5 polished golden stars insignia under the hotel brand name
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Default Executive Signatories */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Default Executive Signatories
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Left Signatory (Department Head)
                </span>
                <input
                  type="text"
                  value={signatoryLeftTitle}
                  onChange={(e) => setSignatoryLeftTitle(e.target.value)}
                  placeholder="Title: Department Head"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={signatoryLeftName}
                  onChange={(e) => setSignatoryLeftName(e.target.value)}
                  placeholder="Name: Executive Housekeeper"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Right Signatory (General Manager)
                </span>
                <input
                  type="text"
                  value={signatoryRightTitle}
                  onChange={(e) => setSignatoryRightTitle(e.target.value)}
                  placeholder="Title: General Manager"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={signatoryRightName}
                  onChange={(e) => setSignatoryRightName(e.target.value)}
                  placeholder="Name: Dr. Faisal Al-Ghamdi"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Print Preview & System Output Workflow */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                Certificate Printing Workflow
              </label>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                printBehavior === 'preview'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Active: {printBehavior === 'preview' ? 'Customized Preview First' : 'Direct System Print'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Choose whether clicking &ldquo;Print&rdquo; on certificates triggers the system print dialog immediately or opens an interactive printable preview first.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Direct System Print */}
              <div
                id="opt-print-direct"
                onClick={() => setPrintBehavior('direct')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  printBehavior === 'direct'
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        printBehavior === 'direct' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Direct System Print</h4>
                        <span className="text-[10px] font-medium text-emerald-600">Fast 1-Click</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      printBehavior === 'direct' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {printBehavior === 'direct' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Immediately launches your browser&apos;s native print preview dialog with full-bleed luxury landscape styling. Bypasses intermediate screens for rapid physical output.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Optimal for quick, repetitive badge & voucher printing</span>
                </div>
              </div>

              {/* Option B: Customized Printable Preview */}
              <div
                id="opt-print-preview"
                onClick={() => setPrintBehavior('preview')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  printBehavior === 'preview'
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        printBehavior === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Printable Preview First</h4>
                        <span className="text-[10px] font-medium text-indigo-600">Inspect & Polish</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      printBehavior === 'preview' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {printBehavior === 'preview' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Opens a customized high-fidelity preview screen first. Allows zooming in to inspect signatures, typography, and paper layout, plus one-click PDF & PNG downloads before printing.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Recommended for executive certificates & VIP awards</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-save-certificate-settings"
              type="button"
              disabled={isSaving}
              onClick={handleSaveSettings}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Certificate Settings'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
