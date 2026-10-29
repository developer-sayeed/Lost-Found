import { Router, Request, Response, NextFunction } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { resolveActorPermissions, actorHasPermission } from '../../middleware/permission.middleware.ts';
import { MediaItem, MediaStorageStats, MediaType } from '../../../src/types.ts';
import { cloudinaryService } from './cloudinary.service.ts';

const router = Router();

// Strict Super Admin Access Guard
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { role, isSuperAdmin } = resolveActorPermissions(req);
  if (!isSuperAdmin && role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only Super Admins are permitted to access the Media Library.'
    });
  }
  next();
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'KB'}`;
}

// Automatically harvest media from existing items (e.g. lost item photos)
function autoHarvestExistingMedia() {
  if (!Array.isArray(db.media)) db.media = [];
  const existingUrls = new Set(db.media.map(m => m.url));
  let added = false;

  if (Array.isArray(db.items)) {
    for (const rawItem of db.items) {
      const item = rawItem as any;
      if (item && item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() && !existingUrls.has(item.imageUrl.trim())) {
        const url = item.imageUrl.trim();
        existingUrls.add(url);

        let size = 320000;
        if (url.startsWith('data:')) {
          size = Math.round((url.length * 3) / 4);
        }

        const safeCode = item.code || item.itemCode || 'ITEM';
        const safeName = (item.itemName || 'Photo').replace(/[^a-zA-Z0-9_-]/g, '_');

        db.media.push({
          id: `media-item-${item.id || safeCode || Math.random().toString(36).substring(2, 9)}`,
          name: `${safeCode}_${safeName}.jpg`,
          title: item.itemName ? `${item.itemName} (${safeCode})` : 'Lost & Found Proof Photo',
          caption: (item.storeLocation || item.storageLocation) ? `Stored at ${item.storeLocation || item.storageLocation} • Found in ${item.locationFound || 'Hotel'}` : 'Item image record',
          url: url,
          type: 'image',
          mimeType: url.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
          size: size,
          formattedSize: formatBytes(size),
          uploadedAt: item.createdAt || item.dateFound || item.foundDate || new Date().toISOString(),
          uploadedBy: {
            name: item.recordedBy || item.submittedByStaffName || item.employeeName || 'Hotel Staff',
            role: 'Security / Housekeeping',
            department: item.department || 'Security'
          },
          associatedTo: {
            type: 'item',
            id: item.id,
            code: safeCode,
            label: item.itemName
          },
          tags: [item.category || 'General', 'Proof Photo', item.status || 'Active']
        });
        added = true;
      }
    }
  }

  if (added) {
    saveDatabase();
  }
}

// Calculate storage stats helper
function calculateStats(): MediaStorageStats {
  if (!Array.isArray(db.media)) db.media = [];
  const totalFiles = db.media.length;
  let totalSize = 0;
  let imagesCount = 0;
  let imagesSize = 0;
  let videosCount = 0;
  let videosSize = 0;
  let otherCount = 0;
  let otherSize = 0;

  for (const m of db.media) {
    const sz = m.size || 0;
    totalSize += sz;
    if (m.type === 'image') {
      imagesCount++;
      imagesSize += sz;
    } else if (m.type === 'video') {
      videosCount++;
      videosSize += sz;
    } else {
      otherCount++;
      otherSize += sz;
    }
  }

  const cloudinaryCount = (db.media || []).filter(m => m.isCloudinary || (m.url && m.url.includes('cloudinary.com'))).length;
  const localCount = Math.max(totalFiles - cloudinaryCount, 0);

  return {
    totalFiles,
    totalSize,
    formattedTotalSize: formatBytes(totalSize),
    imagesCount,
    imagesSize,
    formattedImagesSize: formatBytes(imagesSize),
    videosCount,
    videosSize,
    formattedVideosSize: formatBytes(videosSize),
    otherCount,
    otherSize,
    formattedOtherSize: formatBytes(otherSize),
    cloudinaryCount,
    localCount
  };
}

// Guard helpers for media actions
const requireMediaView = (req: Request, res: Response, next: NextFunction) => {
  const { role, isSuperAdmin } = resolveActorPermissions(req);
  if (isSuperAdmin || role === 'Super Admin' || actorHasPermission(req, 'media_view') || actorHasPermission(req, 'media')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access Denied: You do not have permission to view the Media Library.'
  });
};

const requireMediaUpload = (req: Request, res: Response, next: NextFunction) => {
  const { role, isSuperAdmin } = resolveActorPermissions(req);
  if (isSuperAdmin || role === 'Super Admin' || actorHasPermission(req, 'media_upload') || actorHasPermission(req, 'media')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access Denied: You do not have permission to upload media.'
  });
};

const requireMediaEdit = (req: Request, res: Response, next: NextFunction) => {
  const { role, isSuperAdmin } = resolveActorPermissions(req);
  if (isSuperAdmin || role === 'Super Admin' || actorHasPermission(req, 'media_edit') || actorHasPermission(req, 'media')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access Denied: You do not have permission to edit media metadata.'
  });
};

const requireMediaDelete = (req: Request, res: Response, next: NextFunction) => {
  const { role, isSuperAdmin } = resolveActorPermissions(req);
  if (isSuperAdmin || role === 'Super Admin' || role === 'Admin' || actorHasPermission(req, 'media_delete')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access Denied: Only Administrators or authorized users can delete media.'
  });
};

// GET /api/media/stats
router.get('/stats', requireMediaView, (req: Request, res: Response) => {
  autoHarvestExistingMedia();
  const stats = calculateStats();
  return res.json({ success: true, stats });
});

// ----------------------------------------------------
// Cloudinary Management & Synchronization Endpoints
// ----------------------------------------------------

// GET /api/media/cloudinary/status - Check Cloudinary CDN connection & status
router.get('/cloudinary/status', requireMediaView, (req: Request, res: Response) => {
  const cloudinaryCount = (db.media || []).filter(m => m.isCloudinary || (m.url && m.url.includes('cloudinary.com'))).length;
  const status = cloudinaryService.getStatus(cloudinaryCount);
  return res.json({ success: true, status });
});

// POST /api/media/cloudinary/config - Configure Cloudinary credentials (Super Admin)
router.post('/cloudinary/config', requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const { cloudName, apiKey, apiSecret, uploadPreset } = req.body;
    const result = cloudinaryService.saveConfig({ cloudName, apiKey, apiSecret, uploadPreset });
    const cloudinaryCount = (db.media || []).filter(m => m.isCloudinary || (m.url && m.url.includes('cloudinary.com'))).length;
    return res.json({
      success: true,
      message: result.message,
      status: cloudinaryService.getStatus(cloudinaryCount)
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message || 'Failed to save Cloudinary configuration' });
  }
});

// POST /api/media/cloudinary/test - Test Cloudinary connection
router.post('/cloudinary/test', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const testResult = await cloudinaryService.testConnection();
    return res.json(testResult);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Cloudinary connection test failed.' });
  }
});

// POST /api/media/cloudinary/migrate - Migrate all local base64 images & branding to Cloudinary CDN
router.post('/cloudinary/migrate', requireSuperAdmin, async (req: Request, res: Response) => {
  if (!cloudinaryService.isConfigured()) {
    return res.status(400).json({ success: false, error: 'Cloudinary is not configured. Please save credentials first.' });
  }

  let migratedCount = 0;
  let failedCount = 0;

  // 1. Migrate db.media items
  if (Array.isArray(db.media)) {
    for (const item of db.media) {
      if (item.url && item.url.startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(item.url, {
            folder: 'warwick_media',
            resourceType: item.type === 'video' ? 'video' : 'image',
            publicId: `media_${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
          });
          item.url = res.secureUrl;
          item.thumbnailUrl = res.thumbnailUrl;
          item.cloudinaryPublicId = res.publicId;
          item.isCloudinary = true;
          item.size = res.bytes;
          item.formattedSize = formatBytes(res.bytes);
          migratedCount++;
        } catch (e: any) {
          console.warn(`[Cloudinary Migrate] Error on item ${item.id}:`, e.message);
          failedCount++;
        }
      }
    }
  }

  // 2. Migrate db.settings logos & favicon
  if (db.settings) {
    const brandFields: ('logoUrl' | 'logoLightUrl' | 'logoDarkUrl' | 'faviconUrl')[] = [
      'logoUrl',
      'logoLightUrl',
      'logoDarkUrl',
      'faviconUrl'
    ];
    for (const field of brandFields) {
      const val = (db.settings as any)[field];
      if (typeof val === 'string' && val.startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(val, {
            folder: 'warwick_branding',
            resourceType: 'image',
            publicId: `brand_${field}_${Date.now()}`
          });
          (db.settings as any)[field] = res.secureUrl;
          migratedCount++;
        } catch (e: any) {
          console.warn(`[Cloudinary Migrate] Error on ${field}:`, e.message);
        }
      }
    }
  }

  // 3. Migrate staff & user avatars
  if (Array.isArray(db.staff)) {
    for (const member of db.staff) {
      if (member.avatar && typeof member.avatar === 'string' && member.avatar.startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(member.avatar, {
            folder: 'warwick_avatars',
            resourceType: 'image',
            publicId: `avatar_staff_${member.id || member.staffId}_${Date.now()}`
          });
          member.avatar = res.secureUrl;
          migratedCount++;
        } catch (e: any) {
          console.warn(`[Cloudinary Migrate] Error on staff ${member.id} avatar:`, e.message);
        }
      }
    }
  }

  if (Array.isArray(db.users)) {
    for (const u of db.users) {
      if (u.avatar && typeof u.avatar === 'string' && u.avatar.startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(u.avatar, {
            folder: 'warwick_avatars',
            resourceType: 'image',
            publicId: `avatar_user_${u.id}_${Date.now()}`
          });
          u.avatar = res.secureUrl;
          migratedCount++;
        } catch (e: any) {
          console.warn(`[Cloudinary Migrate] Error on user ${u.id} avatar:`, e.message);
        }
      }
    }
  }

  // 4. Migrate item images
  if (Array.isArray(db.items)) {
    for (const item of db.items) {
      if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:')) {
        try {
          const res = await cloudinaryService.upload(item.imageUrl, {
            folder: 'warwick_lost_found',
            resourceType: 'image',
            publicId: `item_${item.id || item.code}_${Date.now()}`
          });
          item.imageUrl = res.secureUrl;
          migratedCount++;
        } catch (e: any) {
          console.warn(`[Cloudinary Migrate] Error on item ${item.id} imageUrl:`, e.message);
        }
      }
    }
  }

  saveDatabase();

  return res.json({
    success: true,
    message: `Migrated ${migratedCount} media file(s) to Cloudinary CDN!`,
    migratedCount,
    failedCount,
    stats: calculateStats()
  });
});

// GET /api/media - list all media with filtering, search, and sorting
router.get('/', requireMediaView, (req: Request, res: Response) => {
  autoHarvestExistingMedia();

  const { type, search, sortBy } = req.query;
  let results = [...(db.media || [])];

  // Filter by MediaType
  if (type && type !== 'all') {
    results = results.filter(m => m.type === type);
  }

  // Filter by Search query
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.caption && m.caption.toLowerCase().includes(q)) ||
      (m.uploadedBy?.name && m.uploadedBy.name.toLowerCase().includes(q)) ||
      (m.associatedTo?.code && m.associatedTo.code.toLowerCase().includes(q)) ||
      (m.associatedTo?.label && m.associatedTo.label.toLowerCase().includes(q)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Sort
  if (sortBy === 'date_asc') {
    results.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  } else if (sortBy === 'size_desc') {
    results.sort((a, b) => (b.size || 0) - (a.size || 0));
  } else if (sortBy === 'size_asc') {
    results.sort((a, b) => (a.size || 0) - (b.size || 0));
  } else if (sortBy === 'name_asc') {
    results.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
  } else {
    // Default: date_desc (newest first)
    results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  return res.json({
    success: true,
    totalCount: results.length,
    stats: calculateStats(),
    media: results
  });
});

// POST /api/media - Upload new media item
router.post('/', requireMediaUpload, async (req: Request, res: Response) => {
  try {
    const {
      name,
      title,
      caption,
      url,
      thumbnailUrl,
      type = 'image',
      mimeType,
      size = 0,
      dimensions,
      duration,
      tags = [],
      associatedTo
    } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, error: 'Media URL or file data is required.' });
    }

    if (!Array.isArray(db.media)) db.media = [];

    const actorName = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const actorRole = (req.headers['x-user-role'] as string) || 'Super Admin';
    const actorEmail = (req.headers['x-user-email'] as string) || 'abusayeedriday@gmail.com';
    const actorId = (req.headers['x-user-id'] as string) || 'usr-1';

    const cleanSize = Number(size) || Math.round((url.length * 3) / 4) || 250000;
    const mediaType: MediaType = ['image', 'video', 'document', 'other'].includes(type) ? type : 'image';

    let finalUrl = url.trim();
    let finalThumbnail = thumbnailUrl?.trim() || undefined;
    let finalSize = cleanSize;
    let cloudinaryPublicId: string | undefined = undefined;
    let isCloudinary = false;

    // Automatic Cloudinary upload if configured and payload is Base64 / data URL
    if (cloudinaryService.isConfigured() && (finalUrl.startsWith('data:') || finalUrl.startsWith('blob:'))) {
      try {
        console.log(`[Cloudinary] Uploading ${mediaType} "${title || name}" to Cloudinary CDN...`);
        const cloudRes = await cloudinaryService.upload(finalUrl, {
          folder: 'warwick_media',
          resourceType: mediaType === 'video' ? 'video' : 'image',
          tags: Array.isArray(tags) ? tags : []
        });
        finalUrl = cloudRes.secureUrl;
        finalThumbnail = cloudRes.thumbnailUrl;
        finalSize = cloudRes.bytes || cleanSize;
        cloudinaryPublicId = cloudRes.publicId;
        isCloudinary = true;
        console.log(`[Cloudinary] Upload successful: ${finalUrl}`);
      } catch (cloudErr: any) {
        console.warn('[Cloudinary] Upload notice (falling back to local storage):', cloudErr.message);
      }
    }

    const newMedia: MediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name?.trim() || `file_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      title: title?.trim() || name?.trim() || 'Uploaded Media',
      caption: caption?.trim() || '',
      url: finalUrl,
      thumbnailUrl: finalThumbnail,
      type: mediaType,
      mimeType: mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      size: finalSize,
      formattedSize: formatBytes(finalSize),
      dimensions: dimensions || undefined,
      duration: duration || undefined,
      uploadedAt: new Date().toISOString(),
      uploadedBy: {
        id: actorId,
        name: actorName,
        email: actorEmail,
        role: actorRole,
        department: 'Administration'
      },
      associatedTo: associatedTo || { type: 'general' },
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      cloudinaryPublicId,
      isCloudinary
    };

    db.media.unshift(newMedia);
    saveDatabase();

    addAudit(
      'create',
      'item',
      `${actorName} (${actorRole}) uploaded new ${mediaType} file: "${newMedia.title}" (${newMedia.formattedSize})${isCloudinary ? ' [Cloudinary CDN]' : ''}`,
      actorName,
      actorRole,
      newMedia.id
    );

    return res.status(201).json({
      success: true,
      message: 'Media uploaded successfully.',
      mediaItem: newMedia,
      stats: calculateStats()
    });
  } catch (error: any) {
    console.error('[Media] Upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to upload media.' });
  }
});

// PUT /api/media/:id - Edit media metadata (title, caption, tags, associatedTo)
router.put('/:id', requireMediaEdit, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, caption, tags, associatedTo } = req.body;

    if (!Array.isArray(db.media)) db.media = [];
    const itemIndex = db.media.findIndex(m => m.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Media item not found.' });
    }

    const current = db.media[itemIndex];
    if (title !== undefined) current.title = String(title).trim() || current.title;
    if (caption !== undefined) current.caption = String(caption).trim();
    if (tags !== undefined && Array.isArray(tags)) current.tags = tags.filter(Boolean);
    if (associatedTo !== undefined) current.associatedTo = associatedTo;

    db.media[itemIndex] = current;
    saveDatabase();

    const { name: actorName, role: actorRole } = resolveActorPermissions(req);
    addAudit(
      'update',
      'item',
      `${actorName} (${actorRole}) edited metadata for media file "${current.title}"`,
      actorName,
      actorRole,
      current.id
    );

    return res.json({
      success: true,
      message: 'Media metadata updated successfully.',
      mediaItem: current
    });
  } catch (error: any) {
    console.error('[Media] Update error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to update media.' });
  }
});

// DELETE /api/media/:id - Delete media item
router.delete('/:id', requireMediaDelete, (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Array.isArray(db.media)) db.media = [];
    const itemIndex = db.media.findIndex(m => m.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Media item not found.' });
    }

    const removedItem = db.media.splice(itemIndex, 1)[0];
    saveDatabase();

    if (removedItem.cloudinaryPublicId) {
      cloudinaryService.delete(removedItem.cloudinaryPublicId, removedItem.type === 'video' ? 'video' : 'image').catch(() => {});
    }

    const { name: actorName, role: actorRole } = resolveActorPermissions(req);
    addAudit(
      'delete',
      'item',
      `${actorName} (${actorRole}) deleted ${removedItem.type} file "${removedItem.title}" (${removedItem.formattedSize})`,
      actorName,
      actorRole,
      removedItem.id
    );

    return res.json({
      success: true,
      message: 'Media item deleted successfully.',
      stats: calculateStats()
    });
  } catch (error: any) {
    console.error('[Media] Delete error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to delete media.' });
  }
});

export default router;
