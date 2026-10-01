import React, { useState, useRef, useEffect } from 'react';
import {
  Crown,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Save,
  CheckCircle2,
  FileCheck2,
  Sliders,
  Award,
  Printer,
  Eye,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';

export const CertificateSettingsTab: React.FC = () => {
  const { settings, updateSettings, setActiveTab } = useApp();
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
  }, [settings]);

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
      }, 3000);
    } catch (err: any) {
      console.error('Failed to save certificate settings:', err);
      toast.error(err.message || 'Could not save certificate settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 text-white p-6 rounded-2xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                5-Star Certificate Branding &amp; Hotel Logo System
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official Standards
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Upload your custom high-resolution hotel emblem or logo, customize royal 5-star typography, and establish default executive signatories for all appreciation and recognition certificates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>View Certificates &amp; Templates</span>
        </button>
      </div>

      {/* Grid: Settings Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Hotel Logo Upload Component */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hotel Logo &amp; Official Crest
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                PNG, SVG, JPG, WebP (Max 5MB)
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50/60'
              }`}
            >
              {logoUrl ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs max-w-[200px] h-20 flex items-center justify-center overflow-hidden">
                    <img
                      src={logoUrl}
                      alt="Hotel Logo Preview"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-800 flex items-center justify-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Custom Hotel Logo Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Click or drop a new image to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2.5 py-2">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Upload Hotel Logo for Certificates
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Drag and drop image here or click to browse files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logo Options */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-w-[130px] py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Browse Files</span>
              </button>

              {settings.logoUrl && settings.logoUrl !== logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl(settings.logoUrl || '');
                    toast.success('Main hotel logo applied to certificates!');
                  }}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Use Main App Logo</span>
                </button>
              )}

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('');
                    toast.info('Logo cleared. Default crest will be used.');
                  }}
                  className="py-2 px-3 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-200 rounded-xl text-xs font-semibold text-rose-600 transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                  title="Remove custom logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setLogoUrl('');
                  setHotelName('WARWICK');
                  setHotelSubtitle('HOTEL AL BAHA • HOTELS & RESORTS');
                  setShowFiveStars(true);
                  toast.info('Reset to default Warwick 5-star brand identity');
                }}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                title="Reset to default brand values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>

          {/* Card 2: Hotel Name & Subtitle */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Crown className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Property Identity &amp; Title
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certificate Header Title (Hotel Brand)
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. WARWICK or FOUR SEASONS"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certificate Subtitle (Property Location &amp; Division)
                </label>
                <input
                  type="text"
                  value={hotelSubtitle}
                  onChange={(e) => setHotelSubtitle(e.target.value)}
                  placeholder="e.g. HOTEL AL BAHA • HOTELS & RESORTS"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                />
              </div>

              {/* Five Star Stars Toggle */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Display 5-Star Luxury Rating Emblem</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Renders 5 golden stars (★★★★★) beneath the hotel crest
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFiveStars}
                    onChange={(e) => setShowFiveStars(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Default Signatories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Default Certificate Signatories
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Signatory */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Left Signature (Department)
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Title / Position
                  </label>
                  <input
                    type="text"
                    value={signatoryLeftTitle}
                    onChange={(e) => setSignatoryLeftTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Official Signer Name
                  </label>
                  <input
                    type="text"
                    value={signatoryLeftName}
                    onChange={(e) => setSignatoryLeftName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Right Signatory */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Right Signature (Executive / GM)
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Title / Position
                  </label>
                  <input
                    type="text"
                    value={signatoryRightTitle}
                    onChange={(e) => setSignatoryRightTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Official Signer Name
                  </label>
                  <input
                    type="text"
                    value={signatoryRightName}
                    onChange={(e) => setSignatoryRightName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Print Preview & System Output Workflow */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Certificate Print Preview & Output Workflow
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                printBehavior === 'preview'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {printBehavior === 'preview' ? 'Customized Preview First' : 'Direct System Print'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Configure what happens when staff members click &ldquo;Print&rdquo; on any certificate across the application:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Direct System Print */}
              <div
                id="tab-opt-print-direct"
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
                    Instantly launches your browser&apos;s native print preview dialog without opening intermediate preview pages. Fastest option for routine printing.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>One-click physical printing</span>
                </div>
              </div>

              {/* Option B: Customized Printable Preview */}
              <div
                id="tab-opt-print-preview"
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

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Interactive inspection before printing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved!</span>
              </span>
            )}
            <button
              type="button"
              id="btn-save-certificate-settings-tab"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Certificate Branding'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Certificate Header Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Live Certificate Header Preview
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                WYSIWYG
              </span>
            </div>

            {/* Simulated Certificate Parchment Card */}
            <div className="bg-[#fcfbf7] border-2 border-[#e6d5aa] rounded-xl p-6 shadow-md text-center space-y-3 relative overflow-hidden">
              {/* Subtle ornamental top accent */}
              <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent w-3/4 mx-auto rounded-full" />

              {/* Dynamic Logo Rendering */}
              <div className="flex flex-col items-center justify-center pt-2">
                {logoUrl ? (
                  <div className="max-h-16 max-w-[220px] flex items-center justify-center mb-1">
                    <img
                      src={logoUrl}
                      alt={hotelName}
                      className="max-h-14 max-w-full object-contain filter drop-shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-1 shadow-sm">
                    <Crown className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                )}

                {/* Hotel Title */}
                <h4 className="text-base font-serif font-black tracking-[0.22em] text-slate-900 uppercase mt-1">
                  {hotelName || 'WARWICK'}
                </h4>

                {/* Subtitle */}
                <p className="text-[10px] text-amber-800/80 font-bold tracking-[0.18em] uppercase mt-0.5">
                  {hotelSubtitle || 'HOTEL AL BAHA • HOTELS & RESORTS'}
                </p>

                {/* Golden Stars */}
                {showFiveStars && (
                  <div className="flex items-center justify-center space-x-1 mt-1 text-amber-500 text-xs">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                )}
              </div>

              {/* Mock Certificate Body */}
              <div className="py-4 border-t border-b border-[#e6d5aa]/60 space-y-1 my-2">
                <div className="text-[10px] font-serif uppercase tracking-widest text-slate-500">
                  Certificate of Excellence
                </div>
                <div className="text-sm font-serif font-bold text-slate-900">
                  Employee of the Month
                </div>
                <div className="text-[10px] text-slate-500 italic max-w-xs mx-auto">
                  Presented for outstanding dedication and exemplary hospitality service
                </div>
              </div>

              {/* Signatures Preview */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-[10px]">
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-800">{signatoryLeftName}</div>
                  <div className="text-slate-500 text-[9px]">{signatoryLeftTitle}</div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-800">{signatoryRightName}</div>
                  <div className="text-slate-500 text-[9px]">{signatoryRightTitle}</div>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
              <span className="font-bold text-slate-800 block">
                Automatic Print Template Sync:
              </span>
              <p className="text-[11px] text-slate-500">
                Any changes saved here instantly update all 5-star certificate templates in the Gallery, as well as the printable official PDF handover vouchers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
