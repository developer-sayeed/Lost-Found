import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Images,
  Video,
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  Download,
  Copy,
  Check,
  HardDrive,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  X,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Film,
  FileCheck,
  ShieldAlert,
  ArrowUpDown,
  Grid,
  List,
  Cloud,
  Zap,
  Settings,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MediaItem, MediaStorageStats, MediaType } from '../../types';
import { mediaApi } from '../../services/api/media.api';
import { toast } from 'react-toastify';

export const MediaView: React.FC = () => {
  const { user, isSuperAdmin, previewRole, effectiveRole, hasPermission } = useAuth();
  const { t } = useLanguage();

  // Role and Permission Guards
  const isMasterSuperAdmin = isSuperAdmin && !previewRole;
  const isActualSuperAdmin = isMasterSuperAdmin || (effectiveRole === 'Super Admin' && isSuperAdmin);
  const canViewMedia = isActualSuperAdmin || hasPermission('media_view') || hasPermission('media' as any);
  const canUploadMedia = isActualSuperAdmin || hasPermission('media_upload') || hasPermission('media' as any);
  const canEditMedia = isActualSuperAdmin || hasPermission('media_edit') || hasPermission('media' as any);
  const canDeleteMedia = isActualSuperAdmin || hasPermission('media_delete');

  // States
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Cloudinary CDN States
  const [cloudinaryStatus, setCloudinaryStatus] = useState<any>(null);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState<boolean>(false);
  const [isTestingCloud, setIsTestingCloud] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cloudNameInput, setCloudNameInput] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiSecretInput, setApiSecretInput] = useState<string>('');
  const [uploadPresetInput, setUploadPresetInput] = useState<string>('');
  const [isEditingCredentials, setIsEditingCredentials] = useState<boolean>(false);

  // Robust check if Cloudinary CDN is configured
  const isCdnConfigured = Boolean(
    cloudinaryStatus?.configured ||
    cloudinaryStatus?.isConfigured ||
    (cloudinaryStatus?.cloudName && String(cloudinaryStatus.cloudName).trim() !== '') ||
    (cloudNameInput && cloudNameInput.trim() !== '')
  );

  // Filters & Controls
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [uploadType, setUploadType] = useState<MediaType>('image');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCaption, setEditCaption] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Load media items from server
  const fetchMedia = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await mediaApi.getMedia({ type: selectedType, search: searchQuery, sortBy }, user);
      if (res.success) {
        setMediaList(res.media || []);
        if (res.stats) setStats(res.stats);
      } else {
        toast.error('Failed to load media items');
      }
    } catch (err: any) {
      console.error('Failed to fetch media:', err);
      toast.error('Error connecting to media service');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Cloudinary status
  const fetchCloudinaryStatus = async () => {
    try {
      const res = await mediaApi.getCloudinaryStatus(user);
      if (res.success && res.status) {
        setCloudinaryStatus(res.status);
        if (res.status.cloudName) {
          setCloudNameInput(res.status.cloudName);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Cloudinary status:', err);
    }
  };

  useEffect(() => {
    if (canViewMedia) {
      fetchMedia();
      fetchCloudinaryStatus();
    }
  }, [selectedType, sortBy, canViewMedia]);

  // Debounced search
  useEffect(() => {
    if (!canViewMedia) return;
    const timer = setTimeout(() => {
      fetchMedia(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, canViewMedia]);

  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit.');
      return;
    }

    setUploadFile(file);
    const isVid = file.type.startsWith('video/');
    setUploadType(isVid ? 'video' : 'image');
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit direct media upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDataUrl) {
      toast.warning('Please select a photo or video file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const tagsArray = uploadTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await mediaApi.uploadMedia(
        {
          name: uploadFile?.name || `upload_${Date.now()}`,
          title: uploadTitle.trim() || uploadFile?.name || 'Uploaded File',
          caption: uploadCaption.trim(),
          url: uploadDataUrl,
          type: uploadType,
          mimeType: uploadFile?.type || (uploadType === 'video' ? 'video/mp4' : 'image/jpeg'),
          size: uploadFile?.size || Math.round((uploadDataUrl.length * 3) / 4),
          tags: tagsArray,
          associatedTo: { type: 'general' }
        },
        user
      );

      if (res.success && res.mediaItem) {
        toast.success('Media uploaded successfully!');
        setIsUploadModalOpen(false);
        resetUploadForm();
        fetchMedia(true);
      } else {
        toast.error(res.error || 'Failed to upload media file.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadDataUrl('');
    setUploadTitle('');
    setUploadCaption('');
    setUploadTags('');
    setUploadType('image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title || item.name);
    setEditCaption(item.caption || '');
    setEditTags(Array.isArray(item.tags) ? item.tags.join(', ') : '');
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmittingEdit(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await mediaApi.updateMedia(
        editingItem.id,
        {
          title: editTitle.trim(),
          caption: editCaption.trim(),
          tags: tagsArray
        },
        user
      );

      if (res.success && res.mediaItem) {
        toast.success('Media metadata updated.');
        setMediaList(prev => prev.map(m => (m.id === editingItem.id ? res.mediaItem! : m)));
        setEditingItem(null);
      } else {
        toast.error(res.error || 'Failed to update metadata.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating metadata.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const res = await mediaApi.deleteMedia(deletingItem.id, user);
      if (res.success) {
        toast.success(`Deleted "${deletingItem.title || deletingItem.name}"`);
        setMediaList(prev => prev.filter(m => m.id !== deletingItem.id));
        if (res.stats) setStats(res.stats);
        setDeletingItem(null);
        if (previewItem?.id === deletingItem.id) setPreviewItem(null);
      } else {
        toast.error(res.error || 'Failed to delete media item.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting media item.');
    }
  };

  // Copy link helper
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info('Media URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download media helper
  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name || `media_${item.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cloudinary Action Handlers
  const handleTestCloudinary = async () => {
    setIsTestingCloud(true);
    setTestResult(null);
    try {
      const res = await mediaApi.testCloudinary(user);
      setTestResult({
        success: res.success,
        message: res.message
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
      toast.error('Cloudinary connection test failed');
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleSaveCloudinaryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudNameInput.trim()) {
      toast.error('Cloud Name is required');
      return;
    }
    setIsSavingCloud(true);
    try {
      const res = await mediaApi.saveCloudinaryConfig(
        {
          cloudName: cloudNameInput.trim(),
          apiKey: apiKeyInput.trim(),
          apiSecret: apiSecretInput.trim(),
          uploadPreset: uploadPresetInput.trim()
        },
        user
      );

      if (res.success) {
        toast.success(res.message || 'Cloudinary configuration saved successfully!');
        if (res.status) setCloudinaryStatus(res.status);
        setIsEditingCredentials(false);
        fetchCloudinaryStatus();
        fetchMedia(true);
      } else {
        toast.error(res.error || 'Failed to save Cloudinary configuration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving Cloudinary configuration');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleMigrateToCloudinary = async () => {
    if (!isCdnConfigured) {
      toast.info('Please configure and save your Cloud Name and API credentials below before running 1-Click Migration.');
      setIsEditingCredentials(true);
      setIsCloudinaryModalOpen(true);
      return;
    }
    setIsMigrating(true);
    try {
      const res = await mediaApi.migrateToCloudinary(user);
      if (res.success) {
        toast.success(res.message || `Migrated ${res.migratedCount} files to Cloudinary CDN!`);
        fetchMedia(true);
        fetchCloudinaryStatus();
      } else {
        toast.error(res.error || 'Migration failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing Cloudinary migration');
    } finally {
      setIsMigrating(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Permission Access Block
  if (!canViewMedia) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-16 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/40 text-center shadow-lg">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50 dark:ring-red-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {(t as any).accessDenied || 'Access Denied: Permission Required'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Access to the Media Library requires administrator permission.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
          Current Role: {effectiveRole || user?.role || 'Guest'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-fuchsia-950 via-purple-900 to-indigo-950 rounded-none p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-fuchsia-900/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-fuchsia-200 text-xs font-semibold tracking-wide uppercase mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-400" />
              {isActualSuperAdmin ? 'Super Admin Vault' : 'Authorized Access'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Images className="w-8 h-8 text-fuchsia-400" />
              {t.media || 'Media Library'}
            </h1>
            <p className="text-fuchsia-200/80 text-sm mt-1 max-w-xl">
              Central vault for all uploaded photos, videos, and item proof documents. Manage files with uploader info, timestamps, and sizes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* Cloudinary CDN Status / Settings Button */}
            <button
              onClick={() => setIsCloudinaryModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs transition-all cursor-pointer shadow-md border ${
                isCdnConfigured
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-200'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200'
              }`}
              title="Cloudinary CDN Settings & Migration"
            >
              <Cloud className="w-4 h-4" />
              <span>{isCdnConfigured ? '⚡ Cloudinary CDN Active' : '☁️ Cloudinary Setup'}</span>
              <Settings className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button
              onClick={() => {
                fetchMedia(true);
                fetchCloudinaryStatus();
              }}
              disabled={isRefreshing}
              className="p-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Media"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {canUploadMedia && (
              <button
                onClick={() => {
                  resetUploadForm();
                  setIsUploadModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-fuchsia-500/30 transition-all cursor-pointer active:scale-95"
              >
                <Upload className="w-5 h-5" />
                Upload Media
              </button>
            )}
          </div>
        </div>

        {/* Cloudinary CDN Highlights Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 font-medium text-white/90">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <strong>Cloud CDN Storage:</strong>
              {isCdnConfigured ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  ✓ Connected ({cloudinaryStatus?.cloudName || cloudNameInput || 'Active'})
                </span>
              ) : (
                <span className="text-amber-300">Local Storage (CDN Not Configured)</span>
              )}
            </span>

            {stats && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80">
                <span>⚡ CDN Hosted: <strong className="text-white">{stats.cloudinaryCount || 0}</strong></span>
                <span className="text-white/40">•</span>
                <span>💾 Local/DB: <strong className="text-white">{stats.localCount || stats.totalFiles}</strong></span>
              </span>
            )}
          </div>

          {isActualSuperAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMigrateToCloudinary}
                disabled={isMigrating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Migrate all existing local files and logos to Cloudinary"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? 'Migrating to CDN...' : '⚡ 1-Click Migrate All to Cloudinary'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Storage Metrics Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-fuchsia-200 text-xs font-medium mb-1">
                <HardDrive className="w-3.5 h-3.5 text-fuchsia-400" /> Total Storage
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.formattedTotalSize}</div>
              <div className="text-xs text-white/60 mt-0.5">{stats.totalFiles} files registered</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-fuchsia-200 text-xs font-medium mb-1">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Images
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.imagesCount}</div>
              <div className="text-xs text-white/60 mt-0.5">{stats.formattedImagesSize}</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-fuchsia-200 text-xs font-medium mb-1">
                <Video className="w-3.5 h-3.5 text-purple-400" /> Videos
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.videosCount}</div>
              <div className="text-xs text-white/60 mt-0.5">{stats.formattedVideosSize}</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-fuchsia-200 text-xs font-medium mb-1">
                <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> Others & Docs
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.otherCount}</div>
              <div className="text-xs text-white/60 mt-0.5">{stats.formattedOtherSize}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Files', icon: HardDrive },
            { id: 'image', label: 'Photos / Images', icon: ImageIcon },
            { id: 'video', label: 'Videos', icon: Video }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-fuchsia-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, Sort, View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, uploader, tag..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="date_desc" className="dark:bg-slate-800">Newest First</option>
              <option value="date_asc" className="dark:bg-slate-800">Oldest First</option>
              <option value="size_desc" className="dark:bg-slate-800">Largest Size</option>
              <option value="size_asc" className="dark:bg-slate-800">Smallest Size</option>
              <option value="name_asc" className="dark:bg-slate-800">Name (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Media Grid / List Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-fuchsia-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Media Library...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Images className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No media files found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            {searchQuery
              ? `No results matching "${searchQuery}". Try adjusting your filters.`
              : 'There are no media items uploaded yet. Click "Upload Media" to add your first photo or video.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Media
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mediaList.map(item => {
            const isVideo = item.type === 'video';
            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-all flex flex-col"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-4/3 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
                  {isVideo ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Gradient Overlay & Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Type Badge, CDN & Size */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                      {isVideo ? <Video className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                      {isVideo ? 'Video' : 'Photo'}
                    </span>
                    {(item.isCloudinary || item.url?.includes('cloudinary.com')) && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-600/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-xs" title="Hosted on Cloudinary Global CDN">
                        <Zap className="w-2.5 h-2.5 text-amber-300" /> CDN
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-semibold">
                      {item.formattedSize}
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item.url, item.id);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-lg transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-lg transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Associated Item Tag if linked */}
                  {item.associatedTo?.code && (
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <span className="inline-block truncate max-w-full px-2 py-0.5 rounded-md bg-fuchsia-600/80 backdrop-blur-sm text-white text-[10px] font-medium">
                        Linked: {item.associatedTo.code}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-fuchsia-600 transition-colors cursor-pointer"
                      onClick={() => setPreviewItem(item)}
                      title={item.title || item.name}
                    >
                      {item.title || item.name}
                    </h4>

                    {item.caption && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.caption}
                      </p>
                    )}

                    {/* Meta Info: Uploaded By, Date, Size */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          <strong>By:</strong> {item.uploadedBy?.name || 'Super Admin'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(item.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                    {/* Footer Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {canEditMedia && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteMedia && (
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Delete Media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Preview</th>
                  <th className="py-3.5 px-4">Title & Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4">Upload Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {mediaList.map(item => {
                  const isVid = item.type === 'video';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          className="w-12 h-10 rounded-lg overflow-hidden bg-slate-900 cursor-pointer relative shrink-0"
                          onClick={() => setPreviewItem(item)}
                        >
                          {isVid ? (
                            <video src={item.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                          )}
                          {isVid && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Film className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div
                          className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-fuchsia-600"
                          onClick={() => setPreviewItem(item)}
                        >
                          {item.title || item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {isVid ? <Video className="w-3 h-3 text-purple-500" /> : <ImageIcon className="w-3 h-3 text-pink-500" />}
                            {item.type}
                          </span>
                          {(item.isCloudinary || item.url?.includes('cloudinary.com')) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40" title="Hosted on Cloudinary CDN">
                              <Zap className="w-2.5 h-2.5 text-emerald-500" /> CDN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.formattedSize}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {item.uploadedBy?.name || 'Super Admin'}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.uploadedBy?.role || 'Staff'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDate(item.uploadedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyUrl(item.url, item.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Copy URL"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          {canEditMedia && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 rounded-lg text-slate-500 hover:text-fuchsia-600"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteMedia && (
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-slate-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Upload Media Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload New Media</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add photos, item proof, or video recordings</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Photo or Video File *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-fuchsia-50/30 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadDataUrl ? (
                    <div className="space-y-3">
                      <div className="max-h-48 rounded-xl overflow-hidden mx-auto max-w-xs bg-slate-950 flex items-center justify-center">
                        {uploadType === 'video' ? (
                          <video src={uploadDataUrl} className="max-h-48 w-auto" controls />
                        ) : (
                          <img src={uploadDataUrl} alt="Preview" className="max-h-48 object-contain" />
                        )}
                      </div>
                      <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium">
                        {uploadFile?.name} ({(uploadFile?.size ? (uploadFile.size / 1024 / 1024).toFixed(2) : '0')} MB) • Click to change
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Click to browse or drag & drop file here
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Supports JPEG, PNG, WEBP, MP4, WEBM (Max 25 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Rolex Submariner Verification Proof"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              {/* Caption / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  placeholder="Optional details, room number, condition remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  placeholder="e.g. Proof, Jewelry, Executive Suite, Verified"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadDataUrl}
                  className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Media Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{editingItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption / Notes
                </label>
                <textarea
                  rows={3}
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-red-200 dark:border-red-900/40 p-6 text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Delete Media Permanently?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete <strong>"{deletingItem.title || deletingItem.name}"</strong> ({deletingItem.formattedSize})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Fullscreen Preview / Lightbox Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10">
            {/* Media Content */}
            <div className="w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/60 max-h-[68vh]">
              {previewItem.type === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[68vh] rounded-2xl"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.title || previewItem.name}
                  className="max-w-full max-h-[68vh] object-contain rounded-2xl"
                />
              )}
            </div>

            {/* Lightbox Info & Actions Bar */}
            <div className="w-full mt-4 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {previewItem.title || previewItem.name}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-600/80">
                    {previewItem.formattedSize}
                  </span>
                </h4>
                <div className="text-xs text-white/70 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Uploaded by: <strong>{previewItem.uploadedBy?.name || 'Super Admin'}</strong></span>
                  <span>Date: {formatDate(previewItem.uploadedAt)}</span>
                  {previewItem.associatedTo?.code && (
                    <span>Linked Item: {previewItem.associatedTo.code}</span>
                  )}
                </div>
                {previewItem.caption && (
                  <p className="text-xs text-white/60 italic pt-0.5">{previewItem.caption}</p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => handleCopyUrl(previewItem.url, previewItem.id)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy URL
                </button>
                <button
                  onClick={() => handleDownload(previewItem)}
                  className="px-3.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Cloudinary CDN Setup & Migration Modal */}
      {isCloudinaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Cloudinary CDN Storage
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      High Speed CDN
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cloudinary cloud storage & high-speed automatic CDN delivery
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCloudinaryModalOpen(false);
                  setTestResult(null);
                }}
                className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  isCdnConfigured
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCdnConfigured
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {isCdnConfigured ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {isCdnConfigured
                      ? `Cloudinary CDN Connected: ${cloudinaryStatus?.cloudName || cloudNameInput || 'vi7hzuuf'}`
                      : 'Cloudinary CDN Not Yet Configured'}
                    {isCdnConfigured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-1 opacity-90 leading-relaxed">
                    {isCdnConfigured ? (
                      <span>
                        Cloudinary CDN is successfully connected! All new images, videos, logos, and favicons will be stored and served via high-speed cached CDN delivery.
                      </span>
                    ) : (
                      <span>
                        Please enter your Cloudinary credentials (Cloud Name, API Key, API Secret) below or configure them in your environment variables.
                      </span>
                    )}
                  </div>

                  {isCdnConfigured && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center gap-3 text-[11px]">
                      <span>Source: <strong>{cloudinaryStatus?.source === 'env' ? 'Environment Variables' : 'Server Config'}</strong></span>
                      {(cloudinaryStatus?.apiKeyMasked || cloudinaryStatus?.maskedApiKey) && (
                        <span>API Key: <code className="font-mono">{cloudinaryStatus.apiKeyMasked || cloudinaryStatus.maskedApiKey}</code></span>
                      )}
                      <span>CDN Media Files: <strong>{stats?.cloudinaryCount ?? cloudinaryStatus?.totalCloudinaryMedia ?? cloudinaryStatus?.cdnMediaCount ?? 0}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Migration Card */}
              {isActualSuperAdmin && (
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-slate-800 dark:to-indigo-950/30 rounded-2xl p-4 sm:p-5 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        1-Click CDN Migration
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Migrate all legacy base64 images, videos, hotel logos, and favicons from the local database to Cloudinary CDN in one click for instant loading and lighter backups.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleMigrateToCloudinary}
                          disabled={isMigrating}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                          <Zap className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                          <span>{isMigrating ? 'Migrating Media to CDN...' : '⚡ Start 1-Click Migration'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Section: Collapsed into compact status card when configured */}
              {isCdnConfigured && !isEditingCredentials ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          Cloudinary Credentials Saved
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            Connected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Cloud: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{cloudinaryStatus?.cloudName || cloudNameInput || 'vi7hzuuf'}</code>
                          {(cloudinaryStatus?.apiKeyMasked || cloudinaryStatus?.maskedApiKey || apiKeyInput) && (
                            <> • Key: <code className="font-mono">{cloudinaryStatus?.apiKeyMasked || cloudinaryStatus?.maskedApiKey || (apiKeyInput ? `${apiKeyInput.substring(0, 3)}••••${apiKeyInput.substring(apiKeyInput.length - 2)}` : '')}</code></>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingCredentials(true)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Change Keys</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-1 ${
                        testResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
                      }`}
                    >
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTestCloudinary}
                      disabled={isTestingCloud}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingCloud ? 'animate-spin' : ''}`} />
                      {isTestingCloud ? 'Testing Connection...' : 'Test Connection'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCloudinaryModalOpen(false);
                        setTestResult(null);
                      }}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveCloudinaryConfig} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-fuchsia-600" />
                      Cloudinary Credentials Configuration
                    </h4>
                    <a
                      href="https://cloudinary.com/console"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 font-medium"
                    >
                      Get free API keys <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cloud Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. dxyz123ab"
                        value={cloudNameInput}
                        onChange={e => setCloudNameInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        API Key
                      </label>
                      <input
                        type="text"
                        placeholder={cloudinaryStatus?.apiKeyMasked || cloudinaryStatus?.maskedApiKey || 'e.g. 123456789012345'}
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        API Secret
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••"
                        value={apiSecretInput}
                        onChange={e => setApiSecretInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Test Connection Result Box */}
                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
                      }`}
                    >
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestCloudinary}
                      disabled={isTestingCloud}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingCloud ? 'animate-spin' : ''}`} />
                      {isTestingCloud ? 'Testing Connection...' : 'Test Connection'}
                    </button>

                    <div className="flex items-center gap-2">
                      {isCdnConfigured && (
                        <button
                          type="button"
                          onClick={() => setIsEditingCredentials(false)}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCloudinaryModalOpen(false);
                          setTestResult(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCloud}
                        className="px-5 py-2.5 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {isSavingCloud ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaView;
