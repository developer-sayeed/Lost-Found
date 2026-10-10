import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Award,
  Crown,
  Check,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  ArrowRight,
  Filter,
  RotateCcw,
  Sliders,
  Palette,
  Layers,
  PenTool,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import {
  CertificatePreset,
  HOTEL_STAFF_CERTIFICATE_PRESETS,
  createCertificateFromPreset
} from './certificatePresets';
import {
  Certificate,
  CustomCertificateTemplate,
  CertificateBorderStyle,
  CertificateBadgeStyle
} from '../../types';
import { CertificateRenderer } from './CertificateTemplates';
import { CertificatePreviewStage } from './CertificatePreviewStage';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: CertificatePreset) => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  const { settings } = useApp();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingPreset, setInspectingPreset] = useState<CertificatePreset | null>(null);

  // Custom database templates
  const [customTemplates, setCustomTemplates] = useState<CustomCertificateTemplate[]>([]);
  const [hiddenPresetIds, setHiddenPresetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('warwick_hidden_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Template Editor State
  const [editingTemplate, setEditingTemplate] = useState<{
    preset?: CertificatePreset;
    custom?: CustomCertificateTemplate;
    isNew?: boolean;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    subtitle: '',
    category: 'Recognition & Appreciation',
    categoryKey: 'appreciation',
    defaultTitle: '',
    defaultPresentationText: '',
    defaultCitation: '',
    description: '',
    bestSuitedFor: '',
    accentColor: '#c59b27',
    primaryColor: '#0f2338',
    borderColor: '#c59b27',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    borderStyle: 'ornate_gold' as CertificateBorderStyle,
    badgeStyle: 'gold_seal' as CertificateBadgeStyle,
    badgeText: 'SEAL OF EXCELLENCE',
    badgeSubtext: '5-STAR SERVICE',
    fontFamily: 'Playfair Display' as 'Playfair Display' | 'Cinzel' | 'Plus Jakarta Sans',
    signatoryLeftTitle: 'Human Resources Director',
    signatoryLeftName: '',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    signatoryCenterTitle: '',
    signatoryCenterName: '',
    enableThirdSignatory: false
  });

  // Delete Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    name: string;
    isCustom: boolean;
  } | null>(null);

  // Load custom templates from API when opened
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const res = await api.getCertificateTemplates(user);
      if (res && res.templates) {
        setCustomTemplates(res.templates);
      }
    } catch (e) {
      console.warn('Failed to load custom templates:', e);
    }
  };

  const saveHiddenPresets = (newHidden: string[]) => {
    setHiddenPresetIds(newHidden);
    try {
      localStorage.setItem('warwick_hidden_presets', JSON.stringify(newHidden));
    } catch (e) {
      console.warn('Failed to persist hidden presets:', e);
    }
  };

  // Convert custom template to standard CertificatePreset format for display
  const customPresetsConverted: CertificatePreset[] = useMemo(() => {
    return customTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      subtitle: t.description || 'Custom Designed Template',
      category: t.category || 'Custom Templates',
      categoryKey: 'custom',
      badgeLabel: 'Custom Layout',
      templateType: 'custom',
      accentColor: t.customColors?.accent || '#c59b27',
      primaryColor: t.customColors?.primary || '#0f2338',
      description: t.description || 'Custom user-created certificate template',
      bestSuitedFor: 'Special recognition and custom hotel departments',
      features: ['Custom Layout', 'Flexible Fields', 'Custom Color Palette'],
      defaultTitle: t.name.toUpperCase(),
      defaultPresentationText: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
      defaultCitation: t.defaultCitation || 'In recognition of outstanding dedication and exemplary hospitality service.',
      badgeStyle: 'gold_seal',
      badgeText: 'WARWICK SEAL',
      badgeSubtext: '5-STAR HONORS',
      borderStyle: (t.customColors?.border ? 'ornate_gold' : 'royal_frame') as CertificateBorderStyle,
      signatoryLeftTitle: 'Department Head',
      signatoryLeftName: '',
      signatoryRightTitle: 'General Manager',
      signatoryRightName: 'Dr. Faisal Al-Ghamdi',
      fontFamily: 'Playfair Display',
      colors: {
        primary: t.customColors?.primary || '#0f2338',
        accent: t.customColors?.accent || '#c59b27',
        border: t.customColors?.border || '#c59b27',
        background: '#ffffff',
        text: '#0f172a'
      }
    }));
  }, [customTemplates]);

  // Combine visible presets + custom templates
  const allAvailablePresets = useMemo(() => {
    const visiblePresets = HOTEL_STAFF_CERTIFICATE_PRESETS.filter(
      (p) => !hiddenPresetIds.includes(p.id)
    );
    return [...customPresetsConverted, ...visiblePresets];
  }, [hiddenPresetIds, customPresetsConverted]);

  const categories = [
    { key: 'all', label: `All Templates (${allAvailablePresets.length})` },
    { key: 'custom', label: `Custom (${customPresetsConverted.length})` },
    { key: 'monthly', label: 'Monthly Honors' },
    { key: 'appreciation', label: 'Recognition & Appreciation' },
    { key: 'hospitality', label: 'Guest Experience & Front Office' },
    { key: 'culinary', label: 'Culinary & F&B' },
    { key: 'leadership', label: 'Leadership & Executive' },
    { key: 'safety', label: 'Safety & Standards' },
    { key: 'milestone', label: 'Tenure & Milestones' }
  ];

  const filteredPresets = useMemo(() => {
    let list = allAvailablePresets;

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'custom') {
        list = list.filter((p) => p.categoryKey === 'custom' || p.id.startsWith('tpl-'));
      } else {
        list = list.filter((p) => p.categoryKey === selectedCategory);
      }
    }

    if (searchQuery.trim()) {
      const q = (searchQuery || '').toLowerCase().trim();
      list = list.filter(
        (p) =>
          Boolean(p.name && p.name.toLowerCase().includes(q)) ||
          Boolean(p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
          Boolean(p.description && p.description.toLowerCase().includes(q)) ||
          Boolean(p.defaultTitle && p.defaultTitle.toLowerCase().includes(q)) ||
          Boolean(p.bestSuitedFor && p.bestSuitedFor.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allAvailablePresets, selectedCategory, searchQuery]);

  const getSampleCertificate = (preset: CertificatePreset): Certificate => {
    const partial = createCertificateFromPreset(preset, undefined, {
      hotelName: settings.certificateHotelName || settings.hotelName || 'WARWICK',
      hotelSubtitle:
        settings.certificateHotelSubtitle ||
        settings.hotelSubTitle ||
        'HOTEL AL BAHA • HOTELS & RESORTS',
      hotelLogoUrl: settings.certificateLogoUrl || settings.logoUrl || ''
    });

    return {
      id: `sample-${preset.id}`,
      certificateNumber: 'WARWICK-5STAR-PREVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(partial as any)
    };
  };

  // Start editing a template
  const handleStartEdit = (preset: CertificatePreset) => {
    const isCustom = preset.categoryKey === 'custom' || customTemplates.some((t) => t.id === preset.id);
    const customMatch = customTemplates.find((t) => t.id === preset.id);

    setEditForm({
      name: preset.name,
      subtitle: preset.subtitle || '',
      category: preset.category || 'Recognition & Appreciation',
      categoryKey: preset.categoryKey || 'appreciation',
      defaultTitle: preset.defaultTitle || 'CERTIFICATE OF RECOGNITION',
      defaultPresentationText: preset.defaultPresentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
      defaultCitation: preset.defaultCitation || '',
      description: preset.description || '',
      bestSuitedFor: preset.bestSuitedFor || '',
      accentColor: preset.accentColor || '#c59b27',
      primaryColor: preset.primaryColor || '#0f2338',
      borderColor: preset.colors?.border || preset.accentColor || '#c59b27',
      backgroundColor: preset.colors?.background || '#ffffff',
      textColor: preset.colors?.text || '#0f172a',
      borderStyle: preset.borderStyle || 'ornate_gold',
      badgeStyle: preset.badgeStyle || 'gold_seal',
      badgeText: preset.badgeText || 'SEAL OF EXCELLENCE',
      badgeSubtext: preset.badgeSubtext || '5-STAR SERVICE',
      fontFamily: preset.fontFamily || 'Playfair Display',
      signatoryLeftTitle: preset.signatoryLeftTitle || 'Department Head',
      signatoryLeftName: preset.signatoryLeftName || '',
      signatoryRightTitle: preset.signatoryRightTitle || 'General Manager',
      signatoryRightName: preset.signatoryRightName || 'Dr. Faisal Al-Ghamdi',
      signatoryCenterTitle: preset.signatoryCenterTitle || '',
      signatoryCenterName: preset.signatoryCenterName || '',
      enableThirdSignatory: Boolean(preset.enableThirdSignatory)
    });

    setEditingTemplate({
      preset,
      custom: customMatch,
      isNew: false
    });
  };

  // Save changes from Template Editor
  const handleSaveEditedTemplate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      const isCustom = editingTemplate?.custom || editingTemplate?.isNew;

      if (editingTemplate?.custom) {
        // Update existing custom template in database
        const res = await api.updateCertificateTemplate(
          editingTemplate.custom.id,
          {
            name: editForm.name,
            description: editForm.description,
            category: editForm.category,
            defaultCitation: editForm.defaultCitation,
            customColors: {
              primary: editForm.primaryColor,
              accent: editForm.accentColor,
              border: editForm.borderColor
            }
          },
          user
        );

        if (res.success) {
          toast.success(`Template "${editForm.name}" updated successfully!`);
          await loadTemplates();
          setEditingTemplate(null);
        } else {
          toast.error(res.message || 'Failed to update template');
        }
      } else {
        // Save as a new custom template in database
        const newCustomPayload: Partial<CustomCertificateTemplate> = {
          name: editForm.name,
          description: editForm.description || editForm.subtitle,
          category: editForm.category,
          textMode: 'full',
          defaultCitation: editForm.defaultCitation,
          customColors: {
            primary: editForm.primaryColor,
            accent: editForm.accentColor,
            border: editForm.borderColor
          }
        };

        const res = await api.createCertificateTemplate(newCustomPayload, user);
        if (res.success) {
          toast.success(`Custom template "${editForm.name}" created and saved!`);
          await loadTemplates();
          setEditingTemplate(null);
        } else {
          toast.error(res.message || 'Failed to save custom template');
        }
      }
    } catch (err: any) {
      console.error('Template save error:', err);
      toast.error(err.message || 'Error saving template');
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.isCustom) {
        const res = await api.deleteCertificateTemplate(deleteConfirmTarget.id, user);
        if (res.success) {
          toast.success(`Template "${deleteConfirmTarget.name}" deleted!`);
          setCustomTemplates((prev) => prev.filter((t) => t.id !== deleteConfirmTarget.id));
        } else {
          toast.error(res.message || 'Failed to delete template');
        }
      } else {
        // Built-in preset: hide it
        const updated = [...hiddenPresetIds, deleteConfirmTarget.id];
        saveHiddenPresets(updated);
        toast.info(`Preset "${deleteConfirmTarget.name}" removed from your gallery.`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete template');
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // Restore factory defaults
  const handleRestoreDefaults = () => {
    saveHiddenPresets([]);
    toast.success('All 25 official hotel presets restored!');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !editingTemplate && !deleteConfirmTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">5-Star Certificate Template Gallery</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30">
                  25 Distinct Presets & Custom Templates
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each preset has distinct luxury borders, typography, colors, and signatures. You can customize, edit, or delete any template.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Restore All Presets hidden per user request */}

            <button
              type="button"
              onClick={() => {
                setEditForm({
                  name: 'New Custom Luxury Template',
                  subtitle: 'Hotel Department Recognition',
                  category: 'Custom Templates',
                  categoryKey: 'custom',
                  defaultTitle: 'CERTIFICATE OF EXCELLENCE',
                  defaultPresentationText: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
                  defaultCitation: 'In sincere appreciation of outstanding service and 5-star dedication.',
                  description: 'Custom luxury certificate tailored to hotel staff recognition.',
                  bestSuitedFor: 'Special department awards and custom achievements.',
                  accentColor: '#c59b27',
                  primaryColor: '#0f2338',
                  borderColor: '#c59b27',
                  backgroundColor: '#ffffff',
                  textColor: '#0f172a',
                  borderStyle: 'ornate_gold',
                  badgeStyle: 'gold_seal',
                  badgeText: 'SEAL OF EXCELLENCE',
                  badgeSubtext: '5-STAR SERVICE',
                  fontFamily: 'Playfair Display',
                  signatoryLeftTitle: 'Department Head',
                  signatoryLeftName: '',
                  signatoryRightTitle: 'General Manager',
                  signatoryRightName: 'Dr. Faisal Al-Ghamdi',
                  signatoryCenterTitle: '',
                  signatoryCenterName: '',
                  enableThirdSignatory: false
                });
                setEditingTemplate({ isNew: true });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>

            <button
              id="btn-close-template-gallery"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by preset name, title, department..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50/70 dark:bg-slate-900/60">
          {filteredPresets.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Award className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching templates found</h4>
              <p className="text-xs">Try clearing your search query or selecting another category filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPresets.map((preset) => {
                const sampleCert = getSampleCertificate(preset);
                const isCustom = preset.categoryKey === 'custom' || customTemplates.some((t) => t.id === preset.id);

                return (
                  <div
                    key={preset.id}
                    className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/60 dark:hover:border-amber-400/60 transition-all duration-200 overflow-hidden flex flex-col group shadow-sm hover:shadow-md"
                  >
                    {/* Thumbnail Stage */}
                    <div
                      className="relative h-[220px] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-3 cursor-pointer group-hover:brightness-105 transition-all"
                      onClick={() => setInspectingPreset(preset)}
                    >
                      <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                          backgroundImage: `radial-gradient(${preset.accentColor} 1px, transparent 1px)`,
                          backgroundSize: '16px 16px'
                        }}
                      />

                      {/* Scaled Live Render */}
                      <div
                        className="pointer-events-none origin-center transition-transform duration-300 group-hover:scale-[0.24]"
                        style={{
                          transform: 'scale(0.22)',
                          width: '1000px',
                          height: '700px'
                        }}
                      >
                        <CertificateRenderer cert={sampleCert} idPrefix={`gallery-thumb-${preset.id}`} />
                      </div>

                      {/* Floating Badge Tag */}
                      <div className="absolute top-3 left-3 z-20">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 dark:bg-slate-900/90 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-400/40 shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          {preset.badgeLabel}
                        </span>
                      </div>

                      {/* Category Pill */}
                      <div className="absolute top-3 right-3 z-20">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-xs ${
                          isCustom
                            ? 'bg-purple-100 dark:bg-purple-900/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                            : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isCustom ? 'Custom' : preset.category}
                        </span>
                      </div>

                      {/* Inspect Overlay Prompt */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-semibold shadow-md flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                          <Eye className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          Click to Inspect Full-Size
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Controls */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
                            {preset.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Best Suited For */}
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px]">
                          <span className="font-semibold text-amber-700 dark:text-amber-400 block text-[10px]">Best Suited For:</span>
                          <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{preset.bestSuitedFor}</span>
                        </div>
                      </div>

                      {/* Action Bar: Edit, Delete, Preview, Use */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                        {/* Edit Template Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(preset)}
                          className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Edit Template Properties & Layout"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Template Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              id: preset.id,
                              name: preset.name,
                              isCustom
                            })
                          }
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title={isCustom ? 'Delete custom template permanently' : 'Remove preset from gallery'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectingPreset(preset)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectPreset(preset);
                            onClose();
                          }}
                          className="flex-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Use Preset</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Showing {filteredPresets.length} of {allAvailablePresets.length} luxury hotel certificate presets
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Gallery
          </button>
        </div>
      </div>

      {/* Full-Screen Inspector Modal - Responsive Mobile Optimized */}
      {inspectingPreset && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 dark:bg-black/90 backdrop-blur-md animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setInspectingPreset(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full max-h-[98vh] sm:max-h-[96vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-3 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{inspectingPreset.name}</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 truncate">{inspectingPreset.subtitle}</p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(inspectingPreset);
                    setInspectingPreset(null);
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Customize Preset"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden xs:inline">Edit Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(inspectingPreset);
                    setInspectingPreset(null);
                    onClose();
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Preset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectingPreset(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stage Body */}
            <div className="flex-1 p-2 sm:p-6 overflow-y-auto flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-950 min-h-0">
              <CertificatePreviewStage
                cert={getSampleCertificate(inspectingPreset)}
                idPrefix="inspect-preview"
                showToolbar={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal Sheet */}
      {editingTemplate && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingTemplate(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-500/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingTemplate.isNew ? 'Create New Hotel Certificate Template' : `Edit Template: ${editForm.name}`}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize titles, default citation text, colors, border style, and signatures
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form Fields */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Front Desk Excellence Honor"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Recognition & Appreciation">Recognition & Appreciation</option>
                    <option value="Monthly & Annual Awards">Monthly & Annual Awards</option>
                    <option value="Culinary & F&B">Culinary & F&B</option>
                    <option value="Guest Relations & Concierge">Guest Relations & Concierge</option>
                    <option value="Leadership & Executive">Leadership & Executive</option>
                    <option value="Safety & Life Standards">Safety & Life Standards</option>
                    <option value="Tenure & Milestones">Tenure & Milestones</option>
                    <option value="Custom Templates">Custom Templates</option>
                  </select>
                </div>
              </div>

              {/* Default Title & Presentation Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Award Certificate Title</label>
                  <input
                    type="text"
                    value={editForm.defaultTitle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, defaultTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-serif"
                    placeholder="e.g. CERTIFICATE OF APPRECIATION"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Presentation Header</label>
                  <input
                    type="text"
                    value={editForm.defaultPresentationText}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, defaultPresentationText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. THIS CERTIFICATE IS PROUDLY PRESENTED TO"
                  />
                </div>
              </div>

              {/* Default Citation */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Default Citation / Recognition Statement</label>
                <textarea
                  rows={3}
                  value={editForm.defaultCitation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, defaultCitation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
                  placeholder="In sincere appreciation of outstanding dedication and hospitality service..."
                />
              </div>

              {/* Visual Colors & Border Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">Primary Navy/Dark</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.primaryColor}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{editForm.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">Gold/Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.accentColor}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, accentColor: e.target.value, borderColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{editForm.accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">Border Style</label>
                  <select
                    value={editForm.borderStyle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, borderStyle: e.target.value as CertificateBorderStyle }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ornate_gold">Ornate 24K Gold</option>
                    <option value="baroque_filigree">Baroque Filigree</option>
                    <option value="geometric_gold">Art Deco Geometric</option>
                    <option value="vintage_engraved">Vintage Engraved</option>
                    <option value="laurel_wreath">Laurel Wreath Frame</option>
                    <option value="corporate_double">Corporate Double</option>
                    <option value="classic_navy">Classic Navy Inset</option>
                    <option value="royal_frame">Royal Frame</option>
                    <option value="minimal_clean">Minimal Clean</option>
                  </select>
                </div>
              </div>

              {/* Seal & Font Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Medallion / Seal Badge</label>
                  <select
                    value={editForm.badgeStyle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, badgeStyle: e.target.value as CertificateBadgeStyle }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="gold_seal">24K Embossed Gold Seal</option>
                    <option value="rosette">Pleated Rosette Ribbon</option>
                    <option value="laurel_crest">Imperial Laurel Crest</option>
                    <option value="star_medallion">5-Star Gold Medallion</option>
                    <option value="shield_crest">Security & Safety Crest</option>
                    <option value="none">No Badge / Medallion</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Typography Font Family</label>
                  <select
                    value={editForm.fontFamily}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fontFamily: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Playfair Display">Playfair Display (Timeless Serif)</option>
                    <option value="Cinzel">Cinzel (Roman Imperial Capital)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
                  </select>
                </div>
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Left Signatory Title</label>
                  <input
                    type="text"
                    value={editForm.signatoryLeftTitle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, signatoryLeftTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Human Resources Director"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Right Signatory Title</label>
                  <input
                    type="text"
                    value={editForm.signatoryRightTitle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, signatoryRightTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. General Manager"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEditedTemplate}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Delete "{deleteConfirmTarget.name}"?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {deleteConfirmTarget.isCustom
                  ? 'This custom certificate template will be permanently removed from your database.'
                  : 'This preset will be hidden from your active template gallery. You can restore it anytime.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
