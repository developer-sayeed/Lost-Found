import React, { useState, useEffect } from 'react';
import { LibraryAsset, BuilderElement, CanvasSettings } from './types';
import {
  PREBUILT_ASSETS,
  ICON_CATALOG_KEYS,
  getStoredCustomAssets,
  saveCustomAssetToStorage,
  deleteCustomAssetFromStorage
} from './assetLibraryData';
import {
  X,
  Search,
  Upload,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Crown,
  Award,
  Shield,
  Trash2,
  Check,
  Sparkles,
  FileCheck2,
  FolderOpen,
  Filter
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: BuilderElement | null;
  settings: CanvasSettings;
  onAddAssetElement: (asset: { type: 'custom_image' | 'asset_icon'; content?: string; imageUrl?: string; iconName?: string; name: string }) => void;
  onReplaceElementAsset: (elementId: string, updates: Partial<BuilderElement>) => void;
  onSetBackground: (imageUrl: string) => void;
}

export const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedElement,
  settings,
  onAddAssetElement,
  onReplaceElementAsset,
  onSetBackground
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customAssets, setCustomAssets] = useState<LibraryAsset[]>([]);
  const [selectedIconColor, setSelectedIconColor] = useState<string>(settings.accentColor || '#D97706');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomAssets(getStoredCustomAssets());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Combine pre-built and custom assets
  const allMediaAssets = [...PREBUILT_ASSETS, ...customAssets];

  const filteredMediaAssets = allMediaAssets.filter((asset) => {
    const matchesCat =
      activeCategory === 'all'
        ? true
        : activeCategory === 'custom'
        ? asset.category === 'custom'
        : asset.category === activeCategory;

    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      Boolean(asset.name && asset.name.toLowerCase().includes(q)) ||
      Boolean(asset.description && asset.description.toLowerCase().includes(q)) ||
      (Array.isArray(asset.tags) && asset.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q)));

    return matchesCat && matchesSearch;
  });

  const q = (searchQuery || '').toLowerCase().trim();
  const filteredIcons = ICON_CATALOG_KEYS.filter((icon) => {
    return (
      !q ||
      Boolean(icon.label && icon.label.toLowerCase().includes(q)) ||
      Boolean(icon.key && icon.key.toLowerCase().includes(q)) ||
      Boolean(icon.category && icon.category.toLowerCase().includes(q))
    );
  });

  // Handle user image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newAsset: LibraryAsset = {
        id: `custom_asset_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        category: 'custom',
        type: file.type.includes('svg') ? 'svg' : 'image',
        url: result,
        description: 'Uploaded by user to certificate asset library',
        tags: ['uploaded', 'custom', 'branding']
      };

      saveCustomAssetToStorage(newAsset);
      setCustomAssets(getStoredCustomAssets());
      showFeedback(`Uploaded "${newAsset.name}" to library`);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomAsset = (id: string, name: string) => {
    deleteCustomAssetFromStorage(id);
    setCustomAssets(getStoredCustomAssets());
    showFeedback(`Deleted "${name}"`);
  };

  // Insert asset as new element on canvas
  const handleInsertMediaAsset = (asset: LibraryAsset) => {
    // If SVG, can use data URI or SVG string
    let url = asset.url;
    if (!url && asset.svgContent) {
      url = `data:image/svg+xml;utf8,${encodeURIComponent(asset.svgContent)}`;
    }

    onAddAssetElement({
      type: 'custom_image',
      imageUrl: url,
      name: asset.name
    });
    showFeedback(`Added "${asset.name}" to canvas`);
  };

  // Replace image or graphic in currently selected element
  const handleReplaceAssetInSelected = (asset: LibraryAsset) => {
    if (!selectedElement) return;

    let url = asset.url;
    if (!url && asset.svgContent) {
      url = `data:image/svg+xml;utf8,${encodeURIComponent(asset.svgContent)}`;
    }

    onReplaceElementAsset(selectedElement.id, {
      imageUrl: url,
      name: `${selectedElement.name} (${asset.name})`
    });
    showFeedback(`Replaced asset in "${selectedElement.name}"`);
  };

  // Insert vector icon
  const handleInsertIcon = (iconKey: string, iconLabel: string) => {
    onAddAssetElement({
      type: 'asset_icon',
      iconName: iconKey,
      name: iconLabel
    });
    showFeedback(`Added "${iconLabel}" icon to canvas`);
  };

  const handleReplaceWithIcon = (iconKey: string, iconLabel: string) => {
    if (!selectedElement) return;
    onReplaceElementAsset(selectedElement.id, {
      iconName: iconKey,
      name: `${iconLabel} Icon`
    });
    showFeedback(`Set "${iconLabel}" icon on selected element`);
  };

  const categories = [
    { id: 'all', label: 'All Assets', icon: FolderOpen },
    { id: 'crests', label: 'Hotel Crests & Logos', icon: Crown },
    { id: 'seals', label: 'Seals & Medals', icon: Award },
    { id: 'stamps', label: 'Stamps & Marks', icon: Shield },
    { id: 'signatures', label: 'Signatures & Flourishes', icon: Sparkles },
    { id: 'textures', label: 'Backgrounds', icon: ImageIcon },
    { id: 'icons', label: 'Vector Icons', icon: FileCheck2 },
    { id: 'custom', label: 'My Uploads', icon: Upload }
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Asset & Icon Central Library</h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Certificate Suite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select luxury hotel crests, 24K seals, rubber stamps, signatures, textures, or upload custom brand assets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Upload Button */}
            <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 transition shadow">
              <Upload className="w-4 h-4" />
              Upload Image/Logo
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Element Notice Banner */}
        {selectedElement && (
          <div className="bg-sky-950/60 border-b border-sky-800/60 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="text-slate-300">Active Element Selected:</span>
              <span className="font-bold text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded border border-sky-700/50">
                {selectedElement.name}
              </span>
            </div>
            <span className="text-sky-400 font-medium">
              Click &quot;Replace in Selected Element&quot; on any asset to swap its graphic instantly
            </span>
          </div>
        )}

        {/* Action Feedback Toast in Modal */}
        {actionFeedback && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-400" />
            {actionFeedback}
          </div>
        )}

        {uploadError && (
          <div className="bg-rose-900/30 border-b border-rose-800/60 px-4 py-1.5 text-xs text-rose-300 font-semibold flex items-center justify-between">
            <span>{uploadError}</span>
            <button type="button" onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subheader: Category Tabs & Search */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-2xl">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                  {cat.id === 'custom' && customAssets.length > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                      {customAssets.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets or icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeCategory === 'icons' ? (
            /* Vector Icons Gallery View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300">Default Icon Tint Color:</span>
                  <input
                    type="color"
                    value={selectedIconColor}
                    onChange={(e) => setSelectedIconColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-400">{selectedIconColor}</span>
                </div>
                <span className="text-xs text-slate-500">
                  Showing {filteredIcons.length} high-resolution vector symbols
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
                {filteredIcons.map((item) => {
                  const IconComponent = (LucideIcons as any)[item.key] || Award;
                  return (
                    <div
                      key={item.key}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl p-3 flex flex-col items-center justify-center text-center group transition shadow-sm hover:shadow-md"
                    >
                      <div
                        className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-2 group-hover:scale-110 transition"
                        style={{ color: selectedIconColor }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-amber-300 transition">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mb-2">{item.key}</span>

                      <div className="w-full flex flex-col gap-1 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleInsertIcon(item.key, item.label)}
                          className="w-full py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                        {selectedElement && (
                          <button
                            type="button"
                            onClick={() => handleReplaceWithIcon(item.key, item.label)}
                            className="w-full py-0.5 rounded bg-sky-900/40 hover:bg-sky-800 text-sky-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition border border-sky-700/50"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Replace
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Media (Crests, Seals, Stamps, Textures, Custom) Grid */
            <div className="space-y-4">
              {filteredMediaAssets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                  <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No assets match your search</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Try another search term, or click the &quot;Upload Image/Logo&quot; button above to import your own custom files.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMediaAssets.map((asset) => {
                    const isTexture = asset.category === 'textures';
                    const isCustom = asset.category === 'custom';

                    return (
                      <div
                        key={asset.id}
                        className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden flex flex-col group transition shadow-sm hover:shadow-xl"
                      >
                        {/* Visual Preview Box */}
                        <div className="h-36 bg-slate-900/80 border-b border-slate-800/80 p-3 flex items-center justify-center relative overflow-hidden">
                          {asset.svgContent ? (
                            <div
                              className="w-24 h-24 flex items-center justify-center group-hover:scale-105 transition"
                              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
                            />
                          ) : asset.url ? (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className={`w-full h-full object-contain group-hover:scale-105 transition ${
                                isTexture ? 'object-cover' : ''
                              }`}
                            />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-slate-600" />
                          )}

                          {/* Category badge */}
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-amber-300 border border-amber-500/30">
                            {asset.category.toUpperCase()}
                          </span>

                          {/* Delete custom upload */}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomAsset(asset.id, asset.name)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-700 text-rose-200 transition"
                              title="Delete from My Uploads"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                              {asset.name}
                            </h4>
                            {asset.description && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {asset.description}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleInsertMediaAsset(asset)}
                              className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Canvas
                            </button>

                            {selectedElement && !isTexture && (
                              <button
                                type="button"
                                onClick={() => handleReplaceAssetInSelected(asset)}
                                className="w-full py-1 rounded bg-sky-900/40 hover:bg-sky-800 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition border border-sky-700/50"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Replace in Selected
                              </button>
                            )}

                            {isTexture && asset.url && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSetBackground(asset.url!);
                                  showFeedback(`Applied "${asset.name}" as certificate background`);
                                }}
                                className="w-full py-1 rounded bg-purple-900/40 hover:bg-purple-800 text-purple-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition border border-purple-700/50"
                              >
                                <ImageIcon className="w-3 h-3" />
                                Set as Background
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Library Status: Ready (SVG Vectors, WebP, PNG supported)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
};
