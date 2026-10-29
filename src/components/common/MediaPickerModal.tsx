import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  Images,
  Image as ImageIcon,
  Search,
  Check,
  Zap,
  HardDrive,
  RefreshCw,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { MediaItem } from '../../types';
import { mediaApi } from '../../services/api/media.api';
import { useAuth } from '../../context/AuthContext';
import { ImageCropModal } from './ImageCropModal';
import { toast } from 'react-toastify';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, name?: string) => void;
  title: string;
  description?: string;
  currentValue?: string;
  acceptTypes?: 'image' | 'video' | 'all';
  enableCrop?: boolean;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  currentValue,
  acceptTypes = 'image',
  enableCrop = false
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUrl, setSelectedUrl] = useState<string>(currentValue || '');
  const [selectedName, setSelectedName] = useState<string>('');

  // Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropTargetImage, setCropTargetImage] = useState<string>('');
  const [pendingCropSource, setPendingCropSource] = useState<'gallery' | 'upload'>('upload');

  // Local Upload State
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localDataUrl, setLocalDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media library items
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const typeFilter = acceptTypes === 'all' ? 'all' : acceptTypes;
      const res = await mediaApi.getMedia({ type: typeFilter, search: searchQuery }, user);
      if (res.success && Array.isArray(res.media)) {
        setMediaList(res.media);
      }
    } catch (err) {
      console.warn('Failed to fetch media for picker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedUrl(currentValue || '');
      setLocalFile(null);
      setLocalDataUrl('');
    }
  }, [isOpen, acceptTypes]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered images list
  const filteredMedia = useMemo(() => {
    if (acceptTypes === 'all') return mediaList;
    return mediaList.filter(m => (acceptTypes === 'image' ? m.type === 'image' : m.type === 'video'));
  }, [mediaList, acceptTypes]);

  // Handle local file select
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20 MB limit.');
      return;
    }

    setLocalFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLocalDataUrl(dataUrl);
      if (enableCrop) {
        setCropTargetImage(dataUrl);
        setPendingCropSource('upload');
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Crop Complete from ImageCropModal
  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsCropModalOpen(false);
    setLocalDataUrl(croppedDataUrl);

    // Upload the high-res 512x512 cropped avatar directly to Cloudinary
    setIsUploading(true);
    try {
      const res = await mediaApi.uploadMedia(
        {
          name: localFile?.name ? `crop_${localFile.name}` : `crop_avatar_${Date.now()}.jpg`,
          title: 'Cropped Photo (HD Sharp)',
          url: croppedDataUrl,
          type: 'image',
          mimeType: 'image/jpeg',
          size: Math.round((croppedDataUrl.length * 3) / 4),
          associatedTo: { type: 'branding' }
        },
        user
      );

      if (res.success && res.mediaItem) {
        toast.success('Photo cropped and applied with crystal clarity!');
        onSelect(res.mediaItem.url, res.mediaItem.title);
        onClose();
      } else {
        onSelect(croppedDataUrl, 'Cropped Avatar');
        onClose();
      }
    } catch (e) {
      onSelect(croppedDataUrl, 'Cropped Avatar');
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  // Submit local upload directly to Cloudinary / Media Library
  const handleUploadAndSelect = async () => {
    if (!localDataUrl) {
      toast.warning('Please select a file to upload.');
      return;
    }

    if (enableCrop) {
      setCropTargetImage(localDataUrl);
      setPendingCropSource('upload');
      setIsCropModalOpen(true);
      return;
    }

    setIsUploading(true);
    try {
      const res = await mediaApi.uploadMedia(
        {
          name: localFile?.name || `upload_${Date.now()}`,
          title: localFile?.name?.replace(/\.[^/.]+$/, '') || 'Uploaded Image',
          url: localDataUrl,
          type: localFile?.type.startsWith('video/') ? 'video' : 'image',
          mimeType: localFile?.type || 'image/png',
          size: localFile?.size || Math.round((localDataUrl.length * 3) / 4),
          associatedTo: { type: 'branding' }
        },
        user
      );

      if (res.success && res.mediaItem) {
        toast.success('Image uploaded successfully!');
        onSelect(res.mediaItem.url, res.mediaItem.title || res.mediaItem.name);
        onClose();
      } else {
        // Fallback to local DataURL if server media fails
        onSelect(localDataUrl, localFile?.name);
        onClose();
      }
    } catch (err: any) {
      console.warn('Upload error, using dataUrl fallback:', err);
      onSelect(localDataUrl, localFile?.name);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm selection from gallery
  const handleConfirmGallerySelect = () => {
    if (!selectedUrl) {
      toast.warning('Please select an image first.');
      return;
    }
    if (enableCrop) {
      setCropTargetImage(selectedUrl);
      setPendingCropSource('gallery');
      setIsCropModalOpen(true);
      return;
    }
    onSelect(selectedUrl, selectedName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Images className="w-5 h-5 text-fuchsia-400" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {description || 'Select an image from the media library or upload a file from your computer.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'gallery'
                ? 'bg-white dark:bg-slate-900 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>Media Library / Gallery ({filteredMedia.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Local File</span>
          </button>
        </div>

        {/* Tab 1: Media Library Gallery */}
        {activeTab === 'gallery' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search images (by name or tag)..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
              <button
                type="button"
                onClick={loadMedia}
                disabled={isLoading}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Media Grid */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-7 h-7 text-fuchsia-600 animate-spin mx-auto mb-2" />
                Loading media files...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No images found in Media Library
                </p>
                <p className="text-[11px] text-slate-500 mt-1 mb-4">
                  You can upload a new photo directly from the "Upload Local File" tab.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-fuchsia-700 text-white rounded-xl text-xs font-semibold hover:bg-fuchsia-800 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Upload Local File
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredMedia.map(item => {
                  const isSelected = selectedUrl === item.url;
                  const isCloud = item.isCloudinary || item.url?.includes('cloudinary.com');
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedUrl(item.url);
                        setSelectedName(item.title || item.name);
                      }}
                      className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-fuchsia-600 ring-4 ring-fuchsia-500/20 shadow-md scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-fuchsia-400 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <div className="aspect-4/3 bg-slate-950 overflow-hidden relative">
                        <img
                          src={item.url}
                          alt={item.title || item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-fuchsia-900/30 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-fuchsia-600 text-white flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}
                        {isCloud && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                            <Zap className="w-2.5 h-2.5 text-amber-300" /> CDN
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 text-left">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={item.title || item.name}>
                          {item.title || item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.formattedSize}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Local Upload */}
        {activeTab === 'upload' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                onChange={handleLocalFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                Select an image from computer or mobile
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Click to browse files. The uploaded photo will be stored on high-speed Cloudinary CDN.
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-semibold text-slate-500 border border-slate-200 dark:border-slate-700">
                Supported formats: PNG, JPG, WEBP, SVG, ICO (Max 20 MB)
              </span>
            </div>

            {/* Uploaded File Preview */}
            {localDataUrl && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                  <img src={localDataUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {localFile?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {localFile && `${Math.round(localFile.size / 1024)} KB`}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    <Sparkles className="w-3 h-3" /> Ready to upload & apply
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {enableCrop && (
                    <button
                      type="button"
                      onClick={() => {
                        setCropTargetImage(localDataUrl);
                        setPendingCropSource('upload');
                        setIsCropModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-fuchsia-600/10 hover:bg-fuchsia-600/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Crop and resize photo"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Crop Image</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalFile(null);
                      setLocalDataUrl('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 truncate">
            {activeTab === 'gallery' && selectedUrl && (
              <span className="flex items-center gap-1.5 text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> 1 image selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'gallery' ? (
              <button
                type="button"
                onClick={handleConfirmGallerySelect}
                disabled={!selectedUrl}
                className="px-5 py-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {enableCrop ? 'Crop & Select' : 'Apply Selection'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUploadAndSelect}
                disabled={!localDataUrl || isUploading}
                className="px-5 py-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                {isUploading ? 'Uploading...' : (enableCrop ? 'Crop & Upload' : 'Upload & Select')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Image Crop Modal (512x512 Crisp Output) */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropTargetImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        outputSize={512}
        title="Crop & Center Photo (Crisp High-Res Output)"
      />
    </div>
  );
};

export default MediaPickerModal;
