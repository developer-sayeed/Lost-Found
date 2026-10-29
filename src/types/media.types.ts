export type MediaType = 'image' | 'video' | 'document' | 'other';

export interface MediaItem {
  id: string;
  name: string;
  title: string;
  caption?: string;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  mimeType: string;
  size: number; // in bytes
  formattedSize: string; // e.g. "1.2 MB", "450 KB"
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: string; // e.g. "0:35"
  uploadedAt: string;
  uploadedBy: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
    department?: string;
    avatar?: string;
  };
  associatedTo?: {
    type: 'item' | 'certificate' | 'staff' | 'general' | 'proof' | 'hotel_branding';
    id?: string;
    code?: string;
    label?: string;
  };
  tags?: string[];
  isArchived?: boolean;
  cloudinaryPublicId?: string;
  isCloudinary?: boolean;
  cloudinaryFormat?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret?: string;
  uploadPreset?: string;
}

export interface CloudinaryStatus {
  configured: boolean;
  isConfigured?: boolean;
  cloudName?: string;
  apiKeyMasked?: string;
  maskedApiKey?: string;
  source?: 'env' | 'config' | 'none';
  totalCloudinaryMedia?: number;
  cdnMediaCount?: number;
  lastConnectedAt?: string;
}

export interface MediaStorageStats {
  totalFiles: number;
  totalSize: number;
  formattedTotalSize: string;
  imagesCount: number;
  imagesSize: number;
  formattedImagesSize: string;
  videosCount: number;
  videosSize: number;
  formattedVideosSize: string;
  otherCount: number;
  otherSize: number;
  formattedOtherSize: string;
  cloudinaryCount?: number;
  localCount?: number;
}
