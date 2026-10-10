import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Grid,
  List,
  Printer,
  Download,
  FileText,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building2,
  ShieldAlert,
  Sparkles,
  FileCheck,
  Palette,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Certificate, CustomCertificateTemplate } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';
import { CertificateGeneratorModal } from './CertificateGeneratorModal';
import { CertificateViewModal } from './CertificateViewModal';
import { CertificatePrintPage } from './CertificatePrintPage';
import { DirectCertificatePrintPortal } from './DirectCertificatePrintPortal';
import { AddTemplateModal } from './AddTemplateModal';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { CertificateSettingsModal } from './CertificateSettingsModal';
import { CertificatePreset, createCertificateFromPreset, HOTEL_STAFF_CERTIFICATE_PRESETS } from './certificatePresets';
import { CertificateRenderer } from './CertificateTemplates';
import { ElementorCertificateBuilder } from './builder/ElementorCertificateBuilder';
import { Crown } from 'lucide-react';
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  printCertificate
} from './CertificateActions';

export const CertificatesView: React.FC = () => {
  const { user, hasPermission, isSuperAdmin, previewRole, effectiveRole } = useAuth();
  const { t } = useLanguage();
  const { settings, updateSettings } = useApp();

  const isMasterAdmin = isSuperAdmin && !previewRole;

  // Granular Permission Checks
  const canViewCertificates =
    isMasterAdmin ||
    hasPermission('certificates_view') ||
    hasPermission('certificates_print') ||
    hasPermission('certificates');

  const canAddCertificates =
    isMasterAdmin ||
    hasPermission('certificates_create');

  const canEditCertificates =
    isMasterAdmin ||
    hasPermission('certificates_edit');

  const canDeleteCertificates =
    isMasterAdmin ||
    hasPermission('certificates_delete');

  const canPrintCertificates =
    isMasterAdmin ||
    hasPermission('certificates_print') ||
    hasPermission('certificates_view') ||
    hasPermission('print');

  const canSaveCertificates =
    isMasterAdmin ||
    hasPermission('certificates_save');

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomCertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Print State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isElementorOpen, setIsElementorOpen] = useState<boolean>(false);
  const [elementorCert, setElementorCert] = useState<Partial<Certificate> | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [directPrintingCert, setDirectPrintingCert] = useState<Certificate | null>(null);
  const [previewPrintingCert, setPreviewPrintingCert] = useState<Certificate | null>(null);

  const isPreviewMode = settings.certificatePrintBehavior === 'preview' || settings.certificateEnablePrintPreview === true;

  const handleTogglePrintBehavior = async () => {
    const nextMode = isPreviewMode ? 'direct' : 'preview';
    try {
      await updateSettings({
        certificatePrintBehavior: nextMode,
        certificateEnablePrintPreview: nextMode === 'preview'
      });
      if (nextMode === 'preview') {
        toast.info('Print Preview Enabled: Clicking Print opens the customized printable preview stage.', { autoClose: 3500 });
      } else {
        toast.info('Direct Print Enabled: Clicking Print triggers the system print dialog immediately.', { autoClose: 3500 });
      }
    } catch (err: any) {
      toast.error('Failed to update print setting');
    }
  };

  const handleOpenElementor = (cert?: Certificate | null) => {
    setElementorCert(cert || null);
    setIsElementorOpen(true);
  };

  const handleSaveFromElementor = async (savedCert: Partial<Certificate>) => {
    try {
      if (savedCert.id) {
        const res = await api.updateCertificate(savedCert.id, savedCert, user);
        if (res.success) {
          toast.success('Certificate updated via Certificate Builder!');
          loadCertificates();
          setIsElementorOpen(false);
        } else {
          toast.error(res.message || 'Failed to update certificate');
        }
      } else {
        const res = await api.createCertificate(savedCert, user);
        if (res.success) {
          toast.success('Certificate created via Certificate Builder!');
          loadCertificates();
          setIsElementorOpen(false);
        } else {
          toast.error(res.message || 'Failed to create certificate');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving certificate');
    }
  };

  // Active action loading states
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'print' | 'pdf' | 'png' | 'delete' | null>(null);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);

  // Load certificates and templates from API
  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const [certsRes, tplsRes] = await Promise.all([
        api.getCertificates(
          {
            q: searchQuery,
            template: selectedTemplateFilter !== 'all' && !selectedTemplateFilter.startsWith('custom') ? selectedTemplateFilter : undefined
          },
          user
        ),
        api.getCertificateTemplates(user)
      ]);

      if (certsRes && certsRes.certificates) {
        setCertificates(certsRes.certificates);
      }
      if (tplsRes && tplsRes.templates) {
        setCustomTemplates(tplsRes.templates);
      }
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
      toast.error('Could not load certificate history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canViewCertificates) {
      loadCertificates();
    }
  }, [canViewCertificates, selectedTemplateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCertificates();
  };

  const handleCertificateSaved = (newOrUpdatedCert: Certificate) => {
    setCertificates(prev => {
      const idx = prev.findIndex(c => c.id === newOrUpdatedCert.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newOrUpdatedCert;
        return updated;
      }
      return [newOrUpdatedCert, ...prev];
    });
  };

  const handleSelectPresetFromGallery = (preset: CertificatePreset) => {
    const partialCert = createCertificateFromPreset(preset, undefined, {
      hotelName: settings.certificateHotelName || settings.hotelName,
      hotelSubtitle: settings.certificateHotelSubtitle || settings.hotelSubTitle,
      hotelLogoUrl: settings.certificateLogoUrl || settings.logoUrl
    });

    setEditingCert({
      id: `draft-${Date.now()}`,
      certificateNumber: `WARWICK-${new Date().getFullYear()}-${String(certificates.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(partialCert as any)
    });
    setIsGeneratorOpen(true);
    toast.success(`Loaded 5-Star layout preset: ${preset.name}`);
  };

  const handleConfirmDelete = async () => {
    if (!certToDelete) return;
    try {
      setActiveActionId(certToDelete.id);
      setActionType('delete');
      const res = await api.deleteCertificate(certToDelete.id, user);
      if (res.success) {
        setCertificates(prev => prev.filter(c => c.id !== certToDelete.id));
        toast.success(`Certificate ${certToDelete.certificateNumber} deleted.`);
        setCertToDelete(null);
      } else {
        toast.error(res.message || 'Failed to delete certificate');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete certificate');
    } finally {
      setActiveActionId(null);
      setActionType(null);
    }
  };

  // Print Certificate Action - Routes to customized preview or direct system print based on settings
  const handleDirectPrint = (cert: Certificate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPreviewMode) {
      setPreviewPrintingCert(cert);
    } else {
      setActiveActionId(cert.id);
      setActionType('print');
      setDirectPrintingCert(cert);
      toast.info(`Sending ${cert.recipientName || 'Certificate'} directly to printer...`, { autoClose: 2000 });
    }
  };

  const handleDirectDownloadPdf = async (cert: Certificate, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActiveActionId(cert.id);
      setActionType('pdf');
      const cleanNum = cert.certificateNumber || 'CERT';
      const cleanName = (cert.recipientName || 'Recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatePdf(`thumb-${cert.id}-certificate-container`, `Warwick_Certificate_${cleanNum}_${cleanName}.pdf`);
      toast.success('Certificate PDF downloaded!');
    } catch (err) {
      console.error('Direct PDF download failed:', err);
      setViewingCert(cert);
    } finally {
      setActiveActionId(null);
      setActionType(null);
    }
  };

  const handleDirectDownloadPng = async (cert: Certificate, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActiveActionId(cert.id);
      setActionType('png');
      const cleanNum = cert.certificateNumber || 'CERT';
      const cleanName = (cert.recipientName || 'Recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatePng(`thumb-${cert.id}-certificate-container`, `Warwick_Certificate_${cleanNum}_${cleanName}.png`);
      toast.success('Certificate PNG image downloaded!');
    } catch (err) {
      console.error('Direct PNG download failed:', err);
      setViewingCert(cert);
    } finally {
      setActiveActionId(null);
      setActionType(null);
    }
  };

  // Template badge helper for accurate template naming across list views
  const getTemplateBadge = (cert: Certificate) => {
    if (cert.customBackgroundImage || cert.template === 'custom' || cert.template?.startsWith('tpl-custom-')) {
      return {
        label: cert.customTemplateName || 'Custom Template',
        badgeBg: 'bg-purple-600 text-white',
        tableBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
      };
    }
    switch (cert.template) {
      case 'employee_of_month':
      case 'star_eom':
        return {
          label: 'Employee of Month',
          badgeBg: 'bg-amber-500 text-white',
          tableBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
        };
      case 'appreciation':
      case 'star_appreciation':
        return {
          label: 'Appreciation',
          badgeBg: 'bg-[#0f2338] text-white',
          tableBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        };
      case 'star_leadership':
        return {
          label: 'Star Leadership',
          badgeBg: 'bg-emerald-600 text-white',
          tableBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
        };
      case 'star_hospitality':
        return {
          label: 'Hospitality Hero',
          badgeBg: 'bg-rose-600 text-white',
          tableBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
        };
      case 'star_milestone':
        return {
          label: 'Loyalty Milestone',
          badgeBg: 'bg-blue-600 text-white',
          tableBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
        };
      case 'star_mastery':
        return {
          label: 'Skill Mastery',
          badgeBg: 'bg-amber-600 text-white',
          tableBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
        };
      default: {
        if (cert.template?.startsWith('hotel-staff-')) {
          const preset = HOTEL_STAFF_CERTIFICATE_PRESETS.find(p => p.id === cert.template);
          return {
            label: preset ? preset.name : 'Staff Preset',
            badgeBg: 'bg-teal-600 text-white',
            tableBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
          };
        }
        return {
          label: cert.customTemplateName || '5-Star Suite',
          badgeBg: 'bg-indigo-600 text-white',
          tableBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
        };
      }
    }
  };

  // Metrics calculation
  const totalCount = certificates.length;
  const eomCount = certificates.filter(c => c && (c.template === 'employee_of_month' || c.template === 'star_eom')).length;
  const appCount = certificates.filter(c => c && (c.template === 'appreciation' || c.template === 'star_appreciation')).length;
  const starCount = certificates.filter(c => c && (
    c.template === 'star_leadership' ||
    c.template === 'star_hospitality' ||
    c.template === 'star_milestone' ||
    c.template === 'star_mastery' ||
    (c.template && c.template.startsWith('hotel-staff-')) ||
    (c.template && c.template.startsWith('tpl-preset-'))
  )).length;
  const customCount = certificates.filter(c => c && ((c.template && c.template.startsWith('tpl-custom-')) || c.template === 'custom' || Boolean(c.customBackgroundImage))).length;

  // Filter user's personal awarded certificates
  const myCertificates = useMemo(() => {
    if (!user) return [];
    const uName = (user.name || '').toLowerCase().trim();
    const uStaffId = (user.staffId || user.userId || user.id || '').toLowerCase().trim();
    return certificates.filter(c => {
      if (!c) return false;
      const rName = (c.recipientName || '').toLowerCase().trim();
      const rStaffId = (c.recipientStaffId || '').toLowerCase().trim();
      if (uStaffId && rStaffId && uStaffId === rStaffId) return true;
      if (uName && rName && (rName === uName || rName.includes(uName) || uName.includes(rName))) return true;
      return false;
    });
  }, [certificates, user]);

  // Filtered in-memory list
  const filteredCertificates = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const isRegularStaffViewOnly = !canAddCertificates && !isMasterAdmin;

    return certificates.filter(cert => {
      if (!cert) return false;

      // Regular staff with view-only permission: if filtering by personal certs or if only personal certs wanted
      if (isRegularStaffViewOnly && selectedTemplateFilter === 'my_certs') {
        const uName = (user?.name || '').toLowerCase().trim();
        const uStaffId = (user?.staffId || user?.userId || user?.id || '').toLowerCase().trim();
        const rName = (cert.recipientName || '').toLowerCase().trim();
        const rStaffId = (cert.recipientStaffId || '').toLowerCase().trim();
        const isMine =
          (uStaffId && rStaffId && uStaffId === rStaffId) ||
          (uName && rName && (rName === uName || rName.includes(uName) || uName.includes(rName)));
        if (!isMine) return false;
      }

      const matchSearch =
        !q ||
        (cert.recipientName && cert.recipientName.toLowerCase().includes(q)) ||
        (cert.certificateNumber && cert.certificateNumber.toLowerCase().includes(q)) ||
        (cert.recipientDepartment && cert.recipientDepartment.toLowerCase().includes(q)) ||
        (cert.recipientPosition && cert.recipientPosition.toLowerCase().includes(q)) ||
        (cert.title && cert.title.toLowerCase().includes(q)) ||
        (cert.awardPeriod && cert.awardPeriod.toLowerCase().includes(q)) ||
        (cert.awardDate && cert.awardDate.toLowerCase().includes(q));

      let matchTemplate = true;
      if (selectedTemplateFilter === 'my_certs') {
        const uName = (user?.name || '').toLowerCase().trim();
        const uStaffId = (user?.staffId || user?.userId || user?.id || '').toLowerCase().trim();
        const rName = (cert.recipientName || '').toLowerCase().trim();
        const rStaffId = (cert.recipientStaffId || '').toLowerCase().trim();
        const isMine =
          (uStaffId && rStaffId && uStaffId === rStaffId) ||
          (uName && rName && (rName === uName || rName.includes(uName) || uName.includes(rName)));
        matchTemplate = Boolean(isMine);
      } else if (selectedTemplateFilter === 'employee_of_month') {
        matchTemplate = cert.template === 'employee_of_month' || cert.template === 'star_eom';
      } else if (selectedTemplateFilter === 'appreciation') {
        matchTemplate = cert.template === 'appreciation' || cert.template === 'star_appreciation';
      } else if (selectedTemplateFilter === 'star_standard') {
        matchTemplate =
          cert.template === 'star_leadership' ||
          cert.template === 'star_hospitality' ||
          cert.template === 'star_milestone' ||
          cert.template === 'star_mastery' ||
          Boolean(cert.template && cert.template.startsWith('hotel-staff-')) ||
          Boolean(cert.template && cert.template.startsWith('tpl-preset-'));
      } else if (selectedTemplateFilter === 'custom') {
        matchTemplate = Boolean((cert.template && cert.template.startsWith('tpl-custom-')) || cert.template === 'custom' || cert.customBackgroundImage);
      }

      return matchSearch && matchTemplate;
    });
  }, [certificates, searchQuery, selectedTemplateFilter, user, canAddCertificates, isMasterAdmin]);

  // Non-authorized screen
  if (!canViewCertificates) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          You do not have permission to view or manage staff certificates. Please contact an administrator to grant you the <strong>Certificate View</strong> permission.
        </p>
        <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
          Current Role: {user?.role || 'Guest'}
        </div>
      </div>
    );
  }

  if (previewPrintingCert) {
    return (
      <CertificatePrintPage
        certificate={previewPrintingCert}
        onBack={() => setPreviewPrintingCert(null)}
        canSave={canSaveCertificates}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* Stats Cards (2 Columns per line on Mobile, 4 on Large) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Total Certificates
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
              {totalCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Recorded in history</div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Employee of Month
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-0.5 sm:mt-1">
              {eomCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Template 1</div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Appreciation
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#0f2338] dark:text-blue-300 mt-0.5 sm:mt-1">
              {appCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Template 2</div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0f2338] dark:text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Custom / Presets
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-0.5 sm:mt-1">
              {customCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{customTemplates.length} saved</div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5-Star Template Gallery Callout Banner - Available only to users with Add / Create permission */}
      {/* ------------------------------------------------------------- */}
      {/* 5-Star Template Gallery Callout Banner - Available only to users with Add / Create permission */}
      {canAddCertificates && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-slate-50 dark:from-slate-900 dark:via-[#0b1b2d] dark:to-slate-900 text-slate-900 dark:text-white p-5 border border-amber-200 dark:border-amber-500/30 shadow-xs">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
                <Crown className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">5-Star Standard Template Gallery</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-300/60 dark:border-amber-400/30">
                    5 Presets
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Explore pre-configured 5-star hotel layouts: Employee of the Month, Roman Appreciation, Sovereign Leadership, Hospitality Hero & Long Service Milestone.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                id="btn-open-template-gallery"
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse Gallery</span>
              </button>
              <button
                id="btn-open-certificate-settings"
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Brand & Logo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddTemplateOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Upload Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Search, Filters & Action Toolbar */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-certificates"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search recipient, cert #, department..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 outline-none transition"
            />
          </form>

          {/* Template filter tabs */}
          <div className="flex items-center overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedTemplateFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedTemplateFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            {myCertificates.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTemplateFilter('my_certs')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedTemplateFilter === 'my_certs'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 font-semibold'
                }`}
              >
                <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>My Certificates ({myCertificates.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedTemplateFilter('employee_of_month')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedTemplateFilter === 'employee_of_month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              EOM ({eomCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplateFilter('appreciation')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedTemplateFilter === 'appreciation'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Appreciation ({appCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplateFilter('star_standard')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedTemplateFilter === 'star_standard'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              5-Star ({starCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplateFilter('custom')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                selectedTemplateFilter === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Custom ({customCount})
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end shrink-0">
          {/* Print Workflow Mode Toggle */}
          <button
            id="btn-toggle-print-behavior"
            type="button"
            onClick={handleTogglePrintBehavior}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              isPreviewMode
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
            title={`Print Output Mode: ${isPreviewMode ? 'Print Preview First' : 'Direct System Print'} (Click to toggle)`}
          >
            {isPreviewMode ? (
              <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="font-bold">{isPreviewMode ? 'Preview' : 'Direct'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPreviewMode ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* Grid vs Table View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Table History View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Certificate Builder Dedicated Visual Customizer */}
          {canAddCertificates && (
            <button
              id="btn-open-certificate-builder"
              type="button"
              onClick={() => handleOpenElementor(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold transition-all shadow-2xs"
              title="Open Certificate Visual Page Builder"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Builder</span>
            </button>
          )}

          {/* Generate Certificate Primary Button */}
          {canAddCertificates && (
            <button
              id="btn-open-certificate-generator"
              type="button"
              onClick={() => {
                setEditingCert(null);
                setIsGeneratorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Content List / Grid */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading certificate history...</p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Certificates Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
            {searchQuery
              ? `No certificates matched "${searchQuery}". Try a different keyword.`
              : selectedTemplateFilter === 'my_certs'
              ? 'No certificates have been awarded to your account yet. When certificates are awarded, they will appear here.'
              : canAddCertificates
              ? 'No certificates have been issued yet. Click "Generate Certificate" to create one.'
              : 'No certificates have been issued yet. When certificates are awarded, you can view and print them here.'}
          </p>
          {canAddCertificates && (
            <button
              type="button"
              onClick={() => {
                setEditingCert(null);
                setIsGeneratorOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate Certificate
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View - Responsive: 1 Col Mobile, 2 Col Tablet, 3 Col MD, 4 Col LG, 5 Col >=1280px (XL & 2XL) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4 xl:gap-4">
          {filteredCertificates.map(cert => {
            const isCertActive = activeActionId === cert.id;
            return (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Scaled Thumbnail (with CertificateRenderer for full fidelity) */}
                <div
                  className="relative h-[190px] sm:h-[180px] md:h-[185px] lg:h-[175px] xl:h-[165px] 2xl:h-[180px] bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-200 dark:border-slate-800"
                  onClick={() => setViewingCert(cert)}
                >
                  <div
                    className="pointer-events-none transition-transform duration-300 group-hover:scale-[1.03] origin-center scale-[0.27] sm:scale-[0.25] md:scale-[0.25] lg:scale-[0.23] xl:scale-[0.21] 2xl:scale-[0.23]"
                    style={{
                      width: '1000px',
                      height: '700px'
                    }}
                  >
                    <CertificateRenderer cert={cert} idPrefix={`thumb-${cert.id}`} />
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-xs">
                    <Eye className="w-4 h-4" />
                    <span>View Certificate</span>
                  </div>

                  {/* Template & Category badge */}
                  <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1">
                    {(() => {
                      const badge = getTemplateBadge(cert);
                      return (
                        <span
                          className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md shadow-xs ${badge.badgeBg}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                    {cert.customColors && (
                      <span className="p-0.5 sm:p-1 rounded bg-black/60 text-amber-300" title="Custom Colors applied">
                        <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </span>
                    )}
                  </div>

                  {/* Certificate Number */}
                  <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/50 shadow-2xs">
                      {cert.certificateNumber}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-2.5 sm:p-3 xl:p-3 2xl:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] xl:text-[9.5px] 2xl:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                      {cert.title}
                    </div>
                    <h3 className="text-xs sm:text-sm xl:text-[13px] 2xl:text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {cert.recipientName}
                    </h3>
                    <div className="text-[10px] sm:text-[11px] xl:text-[10px] 2xl:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">
                        {cert.recipientPosition}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] xl:text-[10px] 2xl:text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">{cert.awardPeriod || cert.awardDate}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions: View, Print, PDF, PNG, Edit, Delete */}
                <div className="px-2 sm:px-2.5 xl:px-2.5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
                  {canViewCertificates && (
                    <button
                      type="button"
                      onClick={() => setViewingCert(cert)}
                      className="px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>View</span>
                    </button>
                  )}

                  <div className="flex items-center gap-0.5">
                    {/* Direct/Preview Print Button */}
                    {canPrintCertificates && (
                      <button
                        type="button"
                        onClick={(e) => handleDirectPrint(cert, e)}
                        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title={isPreviewMode ? 'Open Printable Preview' : 'Direct Print Certificate'}
                      >
                        <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* PDF Download Button */}
                    {canPrintCertificates && (
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownloadPdf(cert, e)}
                        disabled={isCertActive}
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Download PDF"
                      >
                        {isCertActive && actionType === 'pdf' ? (
                          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-red-600" />
                        ) : (
                          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        )}
                      </button>
                    )}

                    {/* PNG Download Button */}
                    {canPrintCertificates && (
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownloadPng(cert, e)}
                        disabled={isCertActive}
                        className="p-1 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition hidden 2xl:inline-flex"
                        title="Download PNG image"
                      >
                        {isCertActive && actionType === 'png' ? (
                          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-amber-700" />
                        ) : (
                          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Certificate Builder Customizer Button */}
                    {canEditCertificates && (
                      <button
                        type="button"
                        onClick={() => handleOpenElementor(cert)}
                        className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition hidden 2xl:inline-flex"
                        title="Customize in Certificate Builder"
                      >
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* Edit Button */}
                    {canEditCertificates && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCert(cert);
                          setIsGeneratorOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Edit Certificate"
                      >
                        <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {canDeleteCertificates && (
                      <button
                        type="button"
                        onClick={() => setCertToDelete(cert)}
                        className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table History View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {/* Offscreen render elements to guarantee DOM availability for direct export */}
          <div className="sr-only pointer-events-none fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
            {filteredCertificates.map(c => (
              <div key={`table-thumb-${c.id}`} style={{ width: '1000px', height: '700px' }}>
                <CertificateRenderer cert={c} idPrefix={`thumb-${c.id}`} />
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Certificate #</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Department / Role</th>
                  <th className="py-3.5 px-4">Award Period / Date</th>
                  <th className="py-3.5 px-4">Issued By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCertificates.map(cert => {
                  const isCertActive = activeActionId === cert.id;
                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => setViewingCert(cert)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {cert.certificateNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {cert.recipientName}
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const badge = getTemplateBadge(cert);
                          return (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badge.tableBg}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {cert.recipientPosition} ({cert.recipientDepartment})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {cert.awardPeriod || cert.awardDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {cert.issuedBy} ({cert.issuedByRole})
                      </td>
                      <td
                        className="py-3.5 px-4 text-right space-x-1"
                        onClick={e => e.stopPropagation()}
                      >
                        {canViewCertificates && (
                          <button
                            type="button"
                            onClick={() => setViewingCert(cert)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="View Certificate"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {canPrintCertificates && (
                          <button
                            type="button"
                            onClick={(e) => handleDirectPrint(cert, e)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title={isPreviewMode ? 'Open Printable Preview' : 'Direct Print Certificate'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {canPrintCertificates && (
                          <button
                            type="button"
                            onClick={(e) => handleDirectDownloadPdf(cert, e)}
                            disabled={isCertActive}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                            title="Download PDF"
                          >
                            {isCertActive && actionType === 'pdf' ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {canEditCertificates && (
                          <button
                            type="button"
                            onClick={() => handleOpenElementor(cert)}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Customize in Certificate Builder"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        {canEditCertificates && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCert(cert);
                              setIsGeneratorOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="Edit Certificate"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteCertificates && (
                          <button
                            type="button"
                            onClick={() => setCertToDelete(cert)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Delete Certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Modal */}
      {/* ------------------------------------------------------------- */}
      {certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Certificate?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete certificate{' '}
              <strong className="text-slate-800 dark:text-slate-200">{certToDelete.certificateNumber}</strong> issued to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{certToDelete.recipientName}</strong>? This action cannot be reversed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCertToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={activeActionId === certToDelete.id && actionType === 'delete'}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                {activeActionId === certToDelete.id && actionType === 'delete' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Certificate Generator Modal */}
      {/* ------------------------------------------------------------- */}
      <CertificateGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          setEditingCert(null);
        }}
        onCertificateSaved={handleCertificateSaved}
        initialCertificate={editingCert}
      />

      {/* ------------------------------------------------------------- */}
      {/* Certificate Full Screen View Modal */}
      {/* ------------------------------------------------------------- */}
      <CertificateViewModal
        isOpen={Boolean(viewingCert)}
        certificate={viewingCert}
        onClose={() => setViewingCert(null)}
        onEdit={cert => {
          setViewingCert(null);
          setEditingCert(cert);
          setIsGeneratorOpen(true);
        }}
        onPrint={() => {
          if (viewingCert) {
            const certToPrint = viewingCert;
            setViewingCert(null);
            handleDirectPrint(certToPrint);
          }
        }}
        onDelete={async (certId) => {
          const res = await api.deleteCertificate(certId, user);
          if (res.success) {
            setCertificates(prev => prev.filter(c => c.id !== certId));
          }
        }}
        canEdit={canEditCertificates}
        canPrint={canPrintCertificates}
        canDelete={canDeleteCertificates}
      />

      {/* ------------------------------------------------------------- */}
      {/* Template Gallery Modal (5 Pre-Designed 5-Star Presets) */}
      {/* ------------------------------------------------------------- */}
      <TemplateGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectPreset={handleSelectPresetFromGallery}
      />

      {/* ------------------------------------------------------------- */}
      {/* Certificate Settings & Hotel Logo Modal */}
      {/* ------------------------------------------------------------- */}
      <CertificateSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* ------------------------------------------------------------- */}
      {/* Elementor Certificate Page Builder (Full Visual Workspace) */}
      {/* ------------------------------------------------------------- */}
      {isElementorOpen && (
        <ElementorCertificateBuilder
          initialCertificate={elementorCert || {
            template: 'employee_of_month',
            title: 'EMPLOYEE OF THE MONTH',
            presentationText: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
            recipientName: 'MD ABU SAYEED RIDAY',
            recipientPosition: 'Housekeeping Supervisor',
            recipientDepartment: 'Housekeeping',
            hotelName: 'WARWICK',
            hotelSubtitle: 'HOTEL AL BAHA • HOTELS & RESORTS',
            citationText: 'In high esteem and official recognition of outstanding dedication, exceptional work ethic, and distinguished service excellence that exemplifies the true spirit of 5-star luxury hospitality.',
            borderStyle: 'royal_frame'
          }}
          onSave={handleSaveFromElementor}
          onClose={() => setIsElementorOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Add Custom Template Modal */}
      {/* ------------------------------------------------------------- */}
      <AddTemplateModal
        isOpen={isAddTemplateOpen}
        onClose={() => setIsAddTemplateOpen(false)}
        currentUser={user}
        onTemplateAdded={(newTpl) => {
          setCustomTemplates(prev => [newTpl, ...prev]);
          toast.success(`Template "${newTpl.name}" created! Open Generator to issue certificates with it.`);
        }}
      />
      {/* ------------------------------------------------------------- */}
      {/* Direct Certificate Print Portal (Immediate to Printer)        */}
      {/* ------------------------------------------------------------- */}
      {directPrintingCert && (
        <DirectCertificatePrintPortal
          certificate={directPrintingCert}
          onDone={() => {
            setDirectPrintingCert(null);
            setActiveActionId(null);
            setActionType(null);
          }}
        />
      )}
    </div>
  );
};
