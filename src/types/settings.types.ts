import { PermissionKey, UserRole } from './common.types';
import { CategoryConfig } from './items.types';
import { MultiDatabaseSystemState } from './database.types';
import { PublicWebsiteSettings } from './public.types';
import { GoogleDriveBackupSettings } from './backup.types';

export interface HotelLink {
  id: string;
  label: string;
  url: string;
}

export interface HeadingColorsConfig {
  h1?: string;
  h2?: string;
  h3?: string;
  h4?: string;
  h5?: string;
  h6?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  buttonTextColor: string;
  headingColor: string;
  headingColors?: HeadingColorsConfig;
  headingColorH1?: string;
  headingColorH2?: string;
  headingColorH3?: string;
  headingColorH4?: string;
  headingColorH5?: string;
  headingColorH6?: string;
  accentColor: string;
  fontFamily: string;
  buttonRadius: string;
  isCustom?: boolean;
}

export interface ToastConfig {
  enableToasts?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoClose?: number;
  theme?: 'colored' | 'light' | 'dark';
  itemRegistered?: string;
  itemUpdated?: string;
  itemApproved?: string;
  itemRejected?: string;
  itemHandedOver?: string;
  itemDispatched?: string;
  itemTrash?: string;
  itemDeleted?: string;
  itemReturned?: string;
  itemRestored?: string;
  batchTrash?: string;
  batchRestored?: string;
  batchDispatched?: string;
  batchDeleted?: string;
  trashEmptied?: string;
  offlineSaved?: string;
  wifiSynced?: string;
  profileUpdated?: string;
  staffSaved?: string;
  staffDeleted?: string;
  // Login & Authentication Toast Customizations
  loginSuccess?: string;
  loginError?: string;
  loginSuccessConfetti?: boolean;
  loginSuccessPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  loginSuccessAutoClose?: number;
}

export interface ValidationMessagesConfig {
  valItemName?: string;
  valCategory?: string;
  valLocation?: string;
  valFinder?: string;
  valReceiver?: string;
  valStaffName?: string;
  valStaffEmail?: string;
  valStaffEmailInvalid?: string;
  valStaffPassword?: string;
  valLoginId?: string;
  valLoginPassword?: string;
  valLockedItem?: string;
  valRejectionReason?: string;
  valNotifStaffDelete?: string;
  valDispatchMethod?: string;
  valTrackingRef?: string;
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  enableToasts: true,
  position: 'top-right',
  autoClose: 4000,
  theme: 'colored',
  itemRegistered: '📦 Item {code} ({name}) registered & stored successfully!',
  itemUpdated: '✏️ Item {code} ({name}) updated successfully!',
  itemApproved: '✅ Storage request for {code} approved!',
  itemRejected: '🚫 Item {code} submission rejected.',
  itemHandedOver: '🤝 Item {code} handed over to {receiver}!',
  itemDispatched: '🚚 Item {code} dispatched / released successfully!',
  itemTrash: '📁 Item {code} moved to Removed Items (retained for 60 days).',
  itemDeleted: '🗑️ Item {code} permanently deleted.',
  itemReturned: '🔄 Item {code} returned to Stored inventory!',
  itemRestored: '♻️ Item {code} restored to active inventory!',
  batchTrash: '📁 Moved {count} items to Removed Items.',
  batchRestored: '♻️ Restored {count} items to active inventory!',
  batchDispatched: '🚚 Successfully dispatched {count} items!',
  batchDeleted: '🗑️ Permanently deleted {count} items.',
  trashEmptied: '🗑️ Removed Items archive emptied successfully.',
  offlineSaved: '📶 Saved locally in offline mode! Will sync when reconnected.',
  wifiSynced: '📶 Wi-Fi sync complete: {count} offline record(s) synchronized!',
  profileUpdated: '👤 Profile updated successfully!',
  staffSaved: '👤 Staff member saved successfully!',
  staffDeleted: '🗑️ Staff member removed successfully!',
  loginSuccess: '🔐 Authentication validated. Welcome {name} to {hotel}!',
  loginError: '⚠️ Access Denied: Invalid credentials. Verification failed.',
  loginSuccessConfetti: true,
  loginSuccessPosition: 'top-right',
  loginSuccessAutoClose: 3500
};

export const DEFAULT_VALIDATION_MESSAGES: ValidationMessagesConfig = {
  valItemName: '⚠️ Please provide an item title/name.',
  valCategory: '⚠️ Please select an item category.',
  valLocation: '⚠️ Please enter the room number or location found.',
  valFinder: "⚠️ Please enter the finder's name or staff ID.",
  valReceiver: '⚠️ Please enter the receiver / guest name.',
  valStaffName: "⚠️ Please enter the staff member's full name.",
  valStaffEmail: "⚠️ Please enter the staff member's email address.",
  valStaffEmailInvalid: '⚠️ Please enter a valid email format (e.g. staff@warwickhotels.com).',
  valStaffPassword: '⚠️ Please enter a password for the staff account.',
  valLoginId: '⚠️ Please enter your Staff ID or registered Email address.',
  valLoginPassword: '⚠️ Please enter your password to validate dashboard access.',
  valLockedItem: '⚠️ Handed Over items are locked and cannot be deleted.',
  valRejectionReason: '⚠️ Please provide a reason for rejection.',
  valNotifStaffDelete: '⚠️ Only Administrators and Supervisors can delete notifications.',
  valDispatchMethod: '⚠️ Please specify the dispatch/release method.',
  valTrackingRef: '⚠️ Please enter the batch reference or tracking number.'
};

export interface HotelSettings {
  id: string;
  hotelName: string;
  hotelArabicName?: string;
  hotelSubTitle?: string;
  logoUrl: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoFit?: 'contain' | 'cover' | 'fill';
  faviconUrl?: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  website: string;
  additionalLinks: HotelLink[];
  defaultDispatchDurationDays: number;
  defaultStoreLocation: string;
  codePrefix: string;
  autoSyncEnabled: boolean;
  lastSyncedAt: string;
  lastCachePurgedAt?: string;
  cacheVersion?: number;
  syncedDevicesCount: number;
  version: number;
  fontFamily?: string;
  fontColor?: string;
  headingColor?: string;
  headingColors?: HeadingColorsConfig;
  headingColorH1?: string;
  headingColorH2?: string;
  headingColorH3?: string;
  headingColorH4?: string;
  headingColorH5?: string;
  headingColorH6?: string;
  primaryColor?: string;
  secondaryColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonTextColor?: string;
  accentColor?: string;
  buttonRadius?: string;
  activePresetId?: string;
  customPresets?: ThemePreset[];
  customColors?: string[];
  isDarkMode?: boolean;
  themeMode?: 'light' | 'dark';
  autoLogoutMinutes?: number;
  categories?: CategoryConfig[];
  showDepartmentProcessingShare?: boolean;
  toastConfig?: ToastConfig;
  validationMessages?: ValidationMessagesConfig;

  // Login Page Customizer & Security Portal Controls (Admin Managed)
  loginPageTitle?: string;
  loginPageSubtitle?: string;
  loginPageTagline?: string;
  loginLogoUrl?: string;
  loginLogoLightUrl?: string;
  loginLogoDarkUrl?: string;
  loginLogoWidth?: number;
  loginLogoHeight?: number;
  loginLogoFit?: 'contain' | 'cover' | 'fill';
  showLoginCrownBadge?: boolean;
  loginBackgroundStyle?: 'luxury-dark' | 'royal-indigo' | 'hotel-emerald' | 'minimal-clean' | 'custom-color' | 'custom-gradient' | 'custom-image' | 'custom-video' | 'plum-violet';
  loginBgColor?: string;
  loginGradientStart?: string;
  loginGradientEnd?: string;
  loginGradientDirection?: 'to right' | 'to bottom' | 'to bottom right' | 'to top right' | 'radial';
  loginHeaderBgColor?: string;
  loginBgImageUrl?: string;
  loginBgVideoUrl?: string;
  loginVideoBlurEnabled?: boolean;
  loginVideoBlurAmount?: number;
  loginCardBlur?: boolean;
  loginBannerNotice?: string;
  loginBannerType?: 'none' | 'info' | 'warning' | 'shield';
  loginFooterText?: string;
  showForgotPasswordHelp?: boolean;
  showQuickLoginHelper?: boolean;
  loginSupportPhone?: string;
  loginSupportEmail?: string;

  // Multi-Database System Architecture Configuration
  multiDbConfig?: MultiDatabaseSystemState;

  // Public Hotel Guest Website & Inquiries Portal Settings
  publicWebsiteSettings?: PublicWebsiteSettings;

  // Certificate Branding & 5-Star Hotel Configuration
  certificateLogoUrl?: string;
  certificateHotelName?: string;
  certificateHotelSubtitle?: string;
  certificateShowFiveStars?: boolean;
  certificateDefaultSignatoryLeftTitle?: string;
  certificateDefaultSignatoryLeftName?: string;
  certificateDefaultSignatoryRightTitle?: string;
  certificateDefaultSignatoryRightName?: string;
  certificateDraft?: any;
  certificatePrintBehavior?: 'direct' | 'preview';
  certificateEnablePrintPreview?: boolean;

  // System Role Baseline Permission Matrix Customization
  rolePermissions?: Partial<Record<UserRole, PermissionKey[]>>;

  // Google Drive Automated Cloud Backup Configuration
  googleDriveBackup?: GoogleDriveBackupSettings;
}
