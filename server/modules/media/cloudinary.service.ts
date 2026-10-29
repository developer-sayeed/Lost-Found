import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../../config/env.config.ts';
import { CloudinaryConfig, CloudinaryStatus } from '../../../src/types.ts';

const CONFIG_FILE = path.join(DATA_DIR, 'cloudinary_config.json');

class CloudinaryService {
  private isReady = false;
  private currentCloudName = '';
  private currentApiKey = '';
  private currentApiSecret = '';
  private currentUploadPreset = '';
  private configSource: 'env' | 'config' | 'none' = 'none';

  constructor() {
    this.init();
  }

  public init() {
    // 1. Check environment variables first
    const envUrl = process.env.CLOUDINARY_URL;
    const envCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const envApiKey = process.env.CLOUDINARY_API_KEY;
    const envApiSecret = process.env.CLOUDINARY_API_SECRET;
    const envUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (envUrl) {
      try {
        cloudinary.config({ cloudinary_url: envUrl });
        this.isReady = true;
        this.configSource = 'env';
        // Extract cloud name from URL if possible
        const parts = envUrl.split('@');
        if (parts.length > 1) {
          this.currentCloudName = parts[1].split('/')[0] || 'Cloudinary';
        }
        console.log('[Cloudinary] Configured via CLOUDINARY_URL environment variable.');
        return;
      } catch (err: any) {
        console.warn('[Cloudinary] Failed to parse CLOUDINARY_URL:', err.message);
      }
    }

    if (envCloudName && envApiKey && envApiSecret) {
      this.currentCloudName = envCloudName.trim();
      this.currentApiKey = envApiKey.trim();
      this.currentApiSecret = envApiSecret.trim();
      this.currentUploadPreset = (envUploadPreset || '').trim();

      cloudinary.config({
        cloud_name: this.currentCloudName,
        api_key: this.currentApiKey,
        api_secret: this.currentApiSecret,
        secure: true
      });
      this.isReady = true;
      this.configSource = 'env';
      console.log(`[Cloudinary] Configured via environment variables for cloud: "${this.currentCloudName}".`);
      return;
    }

    // 2. Check saved persistent config file
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.cloudName && (parsed.apiSecret || parsed.uploadPreset)) {
          this.currentCloudName = (parsed.cloudName || '').trim();
          this.currentApiKey = (parsed.apiKey || '').trim();
          this.currentApiSecret = (parsed.apiSecret || '').trim();
          this.currentUploadPreset = (parsed.uploadPreset || '').trim();

          cloudinary.config({
            cloud_name: this.currentCloudName,
            api_key: this.currentApiKey,
            api_secret: this.currentApiSecret,
            secure: true
          });
          this.isReady = true;
          this.configSource = 'config';
          console.log(`[Cloudinary] Configured via saved configuration for cloud: "${this.currentCloudName}".`);
          return;
        }
      } catch (e: any) {
        console.warn('[Cloudinary] Error reading cloudinary_config.json:', e.message);
      }
    }

    this.isReady = false;
    this.configSource = 'none';
  }

  public isConfigured(): boolean {
    return this.isReady && Boolean(this.currentCloudName);
  }

  public getStatus(totalCloudinaryMedia = 0): CloudinaryStatus {
    const maskedKey = this.currentApiKey
      ? `${this.currentApiKey.substring(0, 3)}••••••••${this.currentApiKey.substring(this.currentApiKey.length - 2)}`
      : undefined;

    return {
      configured: this.isConfigured(),
      isConfigured: this.isConfigured(),
      cloudName: this.currentCloudName || undefined,
      apiKeyMasked: maskedKey,
      maskedApiKey: maskedKey,
      source: this.configSource,
      totalCloudinaryMedia,
      cdnMediaCount: totalCloudinaryMedia
    } as any;
  }

  public saveConfig(config: CloudinaryConfig): { success: boolean; message: string } {
    const cloudName = (config.cloudName || '').trim();
    const apiKey = (config.apiKey || '').trim();
    const apiSecret = (config.apiSecret || '').trim();
    const uploadPreset = (config.uploadPreset || '').trim();

    if (!cloudName) {
      throw new Error('Cloudinary Cloud Name is required.');
    }

    // Save to disk
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
          {
            cloudName,
            apiKey,
            apiSecret: apiSecret || this.currentApiSecret, // preserve existing secret if not re-entered
            uploadPreset,
            updatedAt: new Date().toISOString()
          },
          null,
          2
        ),
        'utf-8'
      );

      this.currentCloudName = cloudName;
      this.currentApiKey = apiKey;
      if (apiSecret) this.currentApiSecret = apiSecret;
      this.currentUploadPreset = uploadPreset;

      cloudinary.config({
        cloud_name: this.currentCloudName,
        api_key: this.currentApiKey,
        api_secret: this.currentApiSecret,
        secure: true
      });

      this.isReady = true;
      this.configSource = 'config';

      return {
        success: true,
        message: `Cloudinary connected successfully for account: ${cloudName}`
      };
    } catch (e: any) {
      console.error('[Cloudinary] Failed to save config:', e);
      throw new Error(e.message || 'Failed to save Cloudinary configuration');
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string; ping?: any }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Cloudinary is not configured yet. Please enter your Cloud Name and API credentials.'
      };
    }

    try {
      const pingRes = await cloudinary.api.ping();
      return {
        success: true,
        message: `Connection verified! Cloudinary is active for cloud "${this.currentCloudName}".`,
        ping: pingRes
      };
    } catch (err: any) {
      console.error('[Cloudinary] Ping error:', err);
      return {
        success: false,
        message: err.message || 'Cloudinary verification failed. Please check your credentials.'
      };
    }
  }

  /**
   * Upload image, video, logo or favicon to Cloudinary with automatic optimization
   */
  public async upload(
    fileDataOrUrl: string,
    options: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      tags?: string[];
      overwrite?: boolean;
    } = {}
  ): Promise<{
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured. Please configure your Cloudinary credentials first.');
    }

    const folder = options.folder || 'warwick_media';
    const resourceType = options.resourceType || 'auto';

    const result = await cloudinary.uploader.upload(fileDataOrUrl, {
      folder,
      public_id: options.publicId,
      resource_type: resourceType,
      tags: ['warwick_hotel', ...(options.tags || [])],
      overwrite: options.overwrite !== false,
      use_filename: true,
      unique_filename: true
    });

    // Build optimized thumbnail URL (e.g. 300x300 smart crop, auto format & quality)
    let thumbnailUrl = result.secure_url;
    if (result.resource_type === 'image') {
      try {
        thumbnailUrl = cloudinary.url(result.public_id, {
          width: 350,
          height: 350,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true
        });
      } catch {
        thumbnailUrl = result.secure_url;
      }
    } else if (result.resource_type === 'video') {
      try {
        thumbnailUrl = cloudinary.url(result.public_id, {
          resource_type: 'video',
          format: 'jpg',
          width: 350,
          height: 350,
          crop: 'fill',
          secure: true
        });
      } catch {
        thumbnailUrl = result.secure_url;
      }
    }

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format || 'jpg',
      bytes: result.bytes || 0,
      width: result.width,
      height: result.height,
      duration: result.duration ? Math.round(result.duration) : undefined,
      thumbnailUrl
    };
  }

  /**
   * Delete file from Cloudinary
   */
  public async delete(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    if (!this.isConfigured() || !publicId) return false;
    try {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return res.result === 'ok';
    } catch (e: any) {
      console.warn('[Cloudinary] Delete warning:', e.message);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
