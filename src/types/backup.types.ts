import { LostItem } from './items.types';
import { StaffMember } from './staff.types';
import { User } from './staff.types';
import { HotelSettings, HotelLink } from './settings.types';
import { CategoryConfig } from './items.types';
import { PublicWebsiteSettings } from './public.types';
import { Certificate, CustomCertificateTemplate } from './certificates.types';
import { AuditLog } from './audit.types';
import { AppNotification } from './notifications.types';

export interface GoogleDriveBackupSettings {
  autoBackupEnabled: boolean;
  autoBackupFrequency: '6h' | '12h' | 'daily' | 'weekly';
  autoBackupIncludeAuditLogs: boolean;
  autoBackupMaxFilesToKeep: number;
  lastBackupDate?: string;
  lastBackupFileId?: string;
  lastBackupFileName?: string;
  lastBackupFileSize?: number;
  lastBackupDriveLink?: string;
  lastBackupStatus?: 'success' | 'failed' | 'in_progress';
  lastBackupError?: string;
  nextScheduledBackup?: string;
  backupFolderId?: string;
  backupFolderName?: string;
  // Persistent Google Drive Connection Session Fields
  isConnected?: boolean;
  connectedEmail?: string;
  connectedName?: string;
  connectedPhoto?: string;
  connectedAt?: string;
  lastTokenRefreshAt?: string;
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size?: string | number;
  createdTime: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  description?: string;
  recordsCount?: {
    items?: number;
    staff?: number;
    certificates?: number;
    logs?: number;
  };
}

export interface FullSystemBackupPackage {
  version: string;
  timestamp: string;
  source: string;
  environment: string;
  hotelName: string;
  database: {
    items: LostItem[];
    staff: StaffMember[];
    users: Partial<User>[];
    settings: HotelSettings;
    certificates: Certificate[];
    certificateTemplates?: CustomCertificateTemplate[];
    auditLogs?: AuditLog[];
    notifications?: AppNotification[];
  };
  websiteConfig: {
    publicWebsite?: PublicWebsiteSettings;
    additionalLinks?: HotelLink[];
    categories?: CategoryConfig[];
    customColors?: string[];
    themeMode?: 'light' | 'dark';
    brandName?: string;
  };
  stats: {
    totalItems: number;
    totalStaff: number;
    totalCertificates: number;
    totalLogs: number;
    totalTemplates?: number;
  };
}
