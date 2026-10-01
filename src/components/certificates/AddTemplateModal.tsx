import React, { useState, useRef } from 'react';
import { CustomCertificateTemplate, User } from '../../types';
import { api } from '../../lib/api';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  Sparkles,
  Sliders,
  Palette,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onTemplateAdded: (template: CustomCertificateTemplate) => void;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTemplateAdded
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Special Award');
  const [description, setDescription] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [textMode, setTextMode] = useState<'fill_in_blanks' | 'full'>('fill_in_blanks');
  const [textColor, setTextColor] = useState('#1a2e40');
  const [accentColor, setAccentColor] = useState('#c4972a');
  const [nameOffsetY, setNameOffsetY] = useState<number>(46);
  const [nameFontSize, setNameFontSize] = useState<number>(36);
  const [defaultCitation, setDefaultCitation] = useState('In recognition of your exceptional dedication, professionalism, and valuable contribution to Warwick Hotel Baha.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size must be under 8MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBackgroundImageUrl(result);
      if (!templateName) {
        // Auto-generate name from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTemplateName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setErrorMsg('Please provide a name for this certificate template.');
      return;
    }
    if (!backgroundImageUrl) {
      setErrorMsg('Please upload a certificate picture / background.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.createCertificateTemplate(
        {
          name: templateName.trim(),
          description: description.trim(),
          category: category.trim(),
          backgroundImageUrl,
          textMode,
          textColor,
          accentColor,
          nameOffsetY,
          nameFontSize,
          citationOffsetY: Math.min(nameOffsetY + 14, 70),
          defaultTitle: templateName.trim(),
          defaultCitation: defaultCitation.trim()
        },
        currentUser
      );

      if (res.success && res.template) {
        onTemplateAdded(res.template);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to save certificate template.');
      }
    } catch (err: any) {
      console.error('Error creating template:', err);
      setErrorMsg(err.message || 'An error occurred while creating template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-amber-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Add New Certificate Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload any certificate image — it will be saved and available for instant generation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image Upload & Live Preview */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Certificate Picture / Background <span className="text-red-500">*</span>
              </label>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {backgroundImageUrl ? (
                  <div className="relative w-full aspect-[10/7] rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
                    <img
                      src={backgroundImageUrl}
                      alt="Certificate Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2">
                      <Upload className="w-4 h-4" /> Click to Replace Image
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Click to upload or drag & drop
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      PNG, JPG, WEBP up to 8MB (Landscape ratio recommended)
                    </div>
                  </div>
                )}
              </div>

              {/* Live Placement Mini Preview */}
              {backgroundImageUrl && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span>Live Placement Simulator</span>
                    <span className="text-[10px] font-mono text-amber-600">Y: {nameOffsetY}% | Size: {nameFontSize}px</span>
                  </div>
                  <div className="relative w-full aspect-[10/7] rounded-md overflow-hidden border border-slate-300 dark:border-slate-600 bg-white">
                    <img
                      src={backgroundImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute left-0 right-0 text-center font-bold italic tracking-wide"
                      style={{
                        top: `${nameOffsetY}%`,
                        transform: 'translateY(-50%)',
                        fontSize: `${Math.round(nameFontSize * 0.45)}px`,
                        color: textColor
                      }}
                    >
                      MD ABU SAYEED RIDAY
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Template Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Annual Excellence Award"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Special Award">Special Award</option>
                    <option value="Opening Team">Opening Team</option>
                    <option value="Employee of the Month">Employee of the Month</option>
                    <option value="Certificate of Appreciation">Certificate of Appreciation</option>
                    <option value="Long Service">Long Service</option>
                    <option value="Leadership Excellence">Leadership Excellence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Text Mode
                  </label>
                  <select
                    value={textMode}
                    onChange={(e) => setTextMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="fill_in_blanks">Fill Blanks (Pre-printed)</option>
                    <option value="full">Full Overlay with Warwick Crest</option>
                  </select>
                </div>
              </div>

              {/* Slider for Name Y-Position */}
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    Recipient Name Vertical Position
                  </span>
                  <span className="font-mono text-amber-600">{nameOffsetY}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={nameOffsetY}
                  onChange={(e) => setNameOffsetY(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Higher (20%)</span>
                  <span>Center (50%)</span>
                  <span>Lower (80%)</span>
                </div>
              </div>

              {/* Slider for Name Font Size */}
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Recipient Name Font Size</span>
                  <span className="font-mono text-amber-600">{nameFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="54"
                  value={nameFontSize}
                  onChange={(e) => setNameFontSize(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Text / Name Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300">{textColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300">{accentColor}</span>
                  </div>
                </div>
              </div>

              {/* Default Citation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Citation / Recognition Note
                </label>
                <textarea
                  rows={2}
                  value={defaultCitation}
                  onChange={(e) => setDefaultCitation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !backgroundImageUrl || !templateName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Template...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
