import React, { useState, useEffect } from 'react';
import {
  Upload,
  Building,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Shield,
  KeyRound,
  Palette,
  Type,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Crown,
  Database,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Zap,
  Contrast,
  User as UserIcon,
  Lock,
  ShieldCheck,
  Calendar,
  CreditCard,
  Briefcase,
  Phone,
  Mail,
  AlertCircle,
  FileSpreadsheet,
  Tags,
  Maximize2,
  Minimize2,
  RotateCcw,
  LayoutTemplate,
  Scaling,
  WifiOff,
  Globe,
  Bell,
  LogIn,
  Keyboard,
  Server,
  Clock,
  Cloud,
  Ban,
  Unlock,
  Wifi,
  Copy,
  ShieldAlert,
  Search,
  LogOut,
  AlertTriangle,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { HotelLink, ThemePreset, DeviceSession, BlockedDevice } from '../types';
import { MongoDatabaseSettings } from './MongoDatabaseSettings';
import { MultiDatabaseManager } from './MultiDatabaseManager';
import { DataImportExportSettings } from './DataImportExportSettings';
import { GoogleDriveBackupManager } from './GoogleDriveBackupManager';
import { CategorySettings } from './CategorySettings';
import { AlertsValidationSettings } from './AlertsValidationSettings';
import { LoginPageCustomizer } from './LoginPageCustomizer';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { CertificateSettingsTab } from './certificates/CertificateSettingsTab';
import { SecurityActivityTab } from './SecurityActivityTab';
import {
  DEFAULT_THEME_PRESETS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  calculateHoverColor,
  getContrastTextColor,
  applyDynamicTheme,
  getRadiusPixels,
  ThemePresetManager
} from '../lib/themeEngine';

const PRIMARY_COLOR_PRESETS = [
  { hex: '#0f172a', name: 'Slate Navy (Default)' },
  { hex: '#1e1b4b', name: 'Royal Indigo' },
  { hex: '#064e3b', name: 'Emerald Green' },
  { hex: '#18181b', name: 'Rich Charcoal' },
  { hex: '#31103f', name: 'Imperial Plum' },
  { hex: '#1e293b', name: 'Midnight Steel' }
];

const SECONDARY_COLOR_PRESETS = [
  { hex: '#4f46e5', name: 'Indigo (Default)' },
  { hex: '#2563eb', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald Mint' },
  { hex: '#7c3aed', name: 'Vibrant Violet' },
  { hex: '#d97706', name: 'Warm Amber' },
  { hex: '#e11d48', name: 'Rose Red' }
];

export interface SettingsViewProps {
  initialTab?: 'hotel' | 'certificate' | 'categories' | 'security' | 'database' | 'google_drive' | 'sync' | 'import_data' | 'alerts_validation' | 'login_page' | 'shortcuts';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab }) => {
  const {
    settings,
    updateSettings,
    isSyncing,
    triggerSettingsSync,
    isClearingCache,
    clearSystemCache,
    items,
    notifications,
    mongoStatus,
    multiDbState,
    sessions,
    isLoadingSessions,
    fetchSessions,
    deleteSession,
    blockedDevices,
    isLoadingBlockedDevices,
    fetchBlockedDevices,
    blockDevice,
    unblockDevice,
    staff,
    isSyncPaused,
    simulateOfflineToggle
  } = useApp();
  const { user, changePassword, autoLogoutMinutes, setAutoLogoutMinutes, hasPermission } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin';
  const isManager = ['Manager', 'Admin'].includes(user?.role || '');
  const canAccessHotel = isSuperAdmin || isManager || hasPermission('settings');

  const [activeTab, setActiveTab] = useState<
    'hotel' | 'certificate' | 'categories' | 'security' | 'database' | 'google_drive' | 'sync' | 'import_data' | 'alerts_validation' | 'login_page' | 'shortcuts'
  >(() => {
    if (initialTab && initialTab !== ('theme' as any)) return initialTab;
    return canAccessHotel ? 'hotel' : 'security';
  });

  const [databaseSubTab, setDatabaseSubTab] = useState<'cluster' | 'mongodb' | 'gdrive'>('cluster');
  const [connectedDevicesSubTab, setConnectedDevicesSubTab] = useState<'terminals' | 'blocked_devices' | 'security_activity'>('terminals');

  // Device Filter & Block Modal States
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'recent'>('all');
  const [deviceSearch, setDeviceSearch] = useState<string>('');
  const [deviceToBlock, setDeviceToBlock] = useState<DeviceSession | null>(null);
  const [blockType, setBlockType] = useState<'temporary' | 'permanent'>('temporary');
  const [blockDurationHours, setBlockDurationHours] = useState<number>(24);
  const [blockReason, setBlockReason] = useState<string>('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState<boolean>(false);
  const [deviceToUnblock, setDeviceToUnblock] = useState<BlockedDevice | null>(null);
  const [isUnblocking, setIsUnblocking] = useState<boolean>(false);
  const [showCustomBlockModal, setShowCustomBlockModal] = useState<boolean>(false);
  const [customBlockIp, setCustomBlockIp] = useState<string>('');
  const [customBlockDeviceId, setCustomBlockDeviceId] = useState<string>('');
  const [customBlockUserName, setCustomBlockUserName] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [deviceNotice, setDeviceNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  const handleClearCache = async () => {
    try {
      const res = await clearSystemCache();
      setCacheNotice(res.message || 'System cache purged and all clients updated!');
      setShowClearCacheModal(false);
      setTimeout(() => setCacheNotice(null), 6000);
    } catch (err: any) {
      setCacheNotice(err.message || 'Failed to clear system cache');
      setTimeout(() => setCacheNotice(null), 6000);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      if (isManager && !['hotel', 'certificate', 'security', 'alerts_validation', 'categories', 'login_page', 'shortcuts', 'database', 'google_drive'].includes(activeTab)) {
        setActiveTab('hotel');
      } else if (!isManager && !['hotel', 'certificate', 'security', 'shortcuts'].includes(activeTab)) {
        setActiveTab(canAccessHotel ? 'hotel' : 'shortcuts');
      }
    }
  }, [isSuperAdmin, isManager, canAccessHotel, activeTab]);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Hotel Info State
  const [hotelName, setHotelName] = useState(settings.hotelName);
  const [hotelArabicName, setHotelArabicName] = useState(settings.hotelArabicName || 'ورويك الباحة');
  const [hotelSubTitle, setHotelSubTitle] = useState(settings.hotelSubTitle || 'Hotels and Resorts');
  const [address, setAddress] = useState(settings.address);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [emailAddress, setEmailAddress] = useState(settings.emailAddress);
  const [website, setWebsite] = useState(settings.website);
  const [defaultDispatchDurationDays, setDefaultDispatchDurationDays] = useState(
    settings.defaultDispatchDurationDays || 90
  );
  const [defaultStoreLocation, setDefaultStoreLocation] = useState(
    settings.defaultStoreLocation || 'HK Office'
  );
  const [codePrefix, setCodePrefix] = useState(settings.codePrefix || 'LF');
  const [links, setLinks] = useState<HotelLink[]>(settings.additionalLinks || []);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);
  const [logoWidth, setLogoWidth] = useState<number>(settings.logoWidth || 140);
  const [logoHeight, setLogoHeight] = useState<number>(settings.logoHeight || 48);
  const [logoFit, setLogoFit] = useState<'contain' | 'cover' | 'fill'>(settings.logoFit || 'contain');
  const [liveSyncLogo, setLiveSyncLogo] = useState<boolean>(true);

  // Favicon & Collapsed Sidebar Icon State
  const [faviconPreview, setFaviconPreview] = useState<string>(settings.faviconUrl || '/icon.svg');
  const [customFaviconUrl, setCustomFaviconUrl] = useState<string>('');
  const [liveSyncFavicon, setLiveSyncFavicon] = useState<boolean>(true);

  // Theme & Appearance State
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'Plus Jakarta Sans');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || '#4f46e5');
  const [buttonColor, setButtonColor] = useState(settings.buttonColor || '#4f46e5');
  const [buttonHoverColor, setButtonHoverColor] = useState(
    settings.buttonHoverColor || calculateHoverColor(settings.buttonColor || '#4f46e5')
  );
  const [buttonTextColor, setButtonTextColor] = useState(
    settings.buttonTextColor || getContrastTextColor(settings.buttonColor || '#4f46e5')
  );
  const [headingColor, setHeadingColor] = useState(settings.headingColor || '#0f172a');
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#059669');
  const [buttonRadius, setButtonRadius] = useState(settings.buttonRadius || 'rounded-xl');
  const [activePresetId, setActivePresetId] = useState(settings.activePresetId || 'preset-royal-navy');
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>(settings.customPresets || []);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeSaveMessage, setThemeSaveMessage] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [showNewPresetModal, setShowNewPresetModal] = useState(false);
  const [presetFilterCategory, setPresetFilterCategory] = useState<'all' | 'luxury' | 'modern' | 'heritage' | 'custom'>('all');
  const [isDarkMode, setIsDarkMode] = useState(Boolean(settings.isDarkMode));
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    settings.themeMode || (settings.isDarkMode ? 'dark' : 'light')
  );
  const [customColors, setCustomColors] = useState<string[]>(
    settings.customColors && settings.customColors.length > 0
      ? settings.customColors
      : ['#0284c7', '#0d9488', '#ea580c', '#8b5cf6']
  );
  const [newCustomHex, setNewCustomHex] = useState('#0284c7');
  const [showDepartmentProcessingShare, setShowDepartmentProcessingShare] = useState<boolean>(
    () => Boolean(settings.showDepartmentProcessingShare)
  );

  useEffect(() => {
    setHotelName(settings.hotelName);
    setHotelArabicName(settings.hotelArabicName || 'ورويك الباحة');
    setHotelSubTitle(settings.hotelSubTitle || 'Hotels and Resorts');
    setAddress(settings.address);
    setPhoneNumber(settings.phoneNumber);
    setEmailAddress(settings.emailAddress);
    setWebsite(settings.website);
    setDefaultDispatchDurationDays(settings.defaultDispatchDurationDays || 90);
    setDefaultStoreLocation(settings.defaultStoreLocation || 'HK Office');
    setCodePrefix(settings.codePrefix || 'LF');
    setLinks(settings.additionalLinks || []);
    setLogoPreview(settings.logoUrl);
    setLogoWidth(settings.logoWidth || 140);
    setLogoHeight(settings.logoHeight || 48);
    setLogoFit(settings.logoFit || 'contain');
    setFontFamily(settings.fontFamily || 'Plus Jakarta Sans');
    setPrimaryColor(settings.primaryColor || '#0f172a');
    setSecondaryColor(settings.secondaryColor || '#4f46e5');
    setButtonColor(settings.buttonColor || '#4f46e5');
    setButtonHoverColor(settings.buttonHoverColor || calculateHoverColor(settings.buttonColor || '#4f46e5'));
    setButtonTextColor(settings.buttonTextColor || getContrastTextColor(settings.buttonColor || '#4f46e5'));
    setHeadingColor(settings.headingColor || '#0f172a');
    setAccentColor(settings.accentColor || '#059669');
    setButtonRadius(settings.buttonRadius || 'rounded-xl');
    setActivePresetId(settings.activePresetId || 'preset-royal-navy');
    setCustomPresets(settings.customPresets || []);
    setIsDarkMode(Boolean(settings.isDarkMode));
    setThemeMode(settings.themeMode || (settings.isDarkMode ? 'dark' : 'light'));
    setFaviconPreview(settings.faviconUrl || '/icon.svg');
    if (settings.customColors && settings.customColors.length > 0) {
      setCustomColors(settings.customColors);
    }
    setShowDepartmentProcessingShare(Boolean(settings.showDepartmentProcessingShare));
  }, [settings]);

  // Fetch active sessions and blocked devices when entering sync tab
  useEffect(() => {
    if (activeTab === 'sync') {
      fetchSessions();
      fetchBlockedDevices();
    }
  }, [activeTab, fetchSessions, fetchBlockedDevices]);

  const onlineSessions = React.useMemo(() => {
    return sessions.filter(s => {
      const diffSecs = Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 1000);
      return diffSecs < 180; // Within 3 minutes
    });
  }, [sessions]);

  const idleSessions = React.useMemo(() => {
    return sessions.filter(s => {
      const diffSecs = Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 1000);
      return diffSecs >= 180;
    });
  }, [sessions]);

  const displayedSessions = React.useMemo(() => {
    let list = sessions;
    if (deviceFilter === 'online') {
      list = onlineSessions;
    } else if (deviceFilter === 'recent') {
      list = idleSessions;
    }
    if (deviceSearch.trim()) {
      const q = deviceSearch.toLowerCase().trim();
      list = list.filter(s =>
        (s.userName || '').toLowerCase().includes(q) ||
        (s.userEmail || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.ip || '').toLowerCase().includes(q) ||
        (s.os || '').toLowerCase().includes(q) ||
        (s.browser || '').toLowerCase().includes(q) ||
        (s.deviceId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sessions, onlineSessions, idleSessions, deviceFilter, deviceSearch]);

  const handleOpenBlockModal = (session: DeviceSession) => {
    setDeviceToBlock(session);
    setBlockType('temporary');
    setBlockDurationHours(24);
    setBlockReason('Suspicious or unauthorized terminal access');
  };

  const handleConfirmBlockDevice = async () => {
    if (!deviceToBlock && !customBlockIp && !customBlockDeviceId) return;
    setIsSubmittingBlock(true);
    try {
      const targetDevId = deviceToBlock?.deviceId || customBlockDeviceId || undefined;
      const targetIp = deviceToBlock?.ip || customBlockIp || undefined;
      const targetUser = deviceToBlock?.userName || customBlockUserName || 'Unknown User';

      const success = await blockDevice({
        deviceId: targetDevId,
        ip: targetIp,
        userName: targetUser,
        userEmail: deviceToBlock?.userEmail,
        deviceType: deviceToBlock?.deviceType,
        browser: deviceToBlock?.browser,
        os: deviceToBlock?.os,
        blockType,
        durationHours: blockType === 'temporary' ? blockDurationHours : undefined,
        reason: blockReason || (blockType === 'permanent' ? 'Permanent administrator security block' : `Temporary ${blockDurationHours}h security block`)
      });

      if (success) {
        setDeviceNotice({
          message: `Device successfully blocked (${blockType === 'permanent' ? 'Permanent Block' : `${blockDurationHours}h Temporary Block`}).`,
          type: 'success'
        });
        setDeviceToBlock(null);
        setShowCustomBlockModal(false);
        setCustomBlockIp('');
        setCustomBlockDeviceId('');
        setCustomBlockUserName('');
        setBlockReason('');
        await fetchBlockedDevices();
        await fetchSessions();
        setTimeout(() => setDeviceNotice(null), 5000);
      } else {
        setDeviceNotice({ message: 'Failed to block device', type: 'error' });
      }
    } catch (err: any) {
      setDeviceNotice({ message: err.message || 'Error blocking device', type: 'error' });
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleConfirmUnblockDevice = async (blocked: BlockedDevice) => {
    setIsUnblocking(true);
    try {
      const success = await unblockDevice({
        deviceId: blocked.deviceId,
        ip: blocked.ip
      });
      if (success) {
        setDeviceNotice({
          message: `Device (${blocked.userName || blocked.deviceId || blocked.ip}) was unblocked successfully.`,
          type: 'success'
        });
        setDeviceToUnblock(null);
        await fetchBlockedDevices();
        await fetchSessions();
        setTimeout(() => setDeviceNotice(null), 5000);
      } else {
        setDeviceNotice({ message: 'Failed to unblock device', type: 'error' });
      }
    } catch (err: any) {
      setDeviceNotice({ message: err.message || 'Error unblocking device', type: 'error' });
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully! Please use your new password next time you login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddCustomColor = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex : `#${hex}`;
    if (!customColors.includes(formatted)) {
      const updated = [...customColors, formatted];
      setCustomColors(updated);
      updateSettings({ customColors: updated });
    }
  };

  const handleRemoveCustomColor = (hex: string) => {
    const updated = customColors.filter(c => (c || '').toLowerCase() !== (hex || '').toLowerCase());
    setCustomColors(updated);
    updateSettings({ customColors: updated });
  };

  const handleInstantThemeModeChange = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    const darkEnabled = mode === 'dark';
    setIsDarkMode(darkEnabled);
    await updateSettings({
      themeMode: mode,
      isDarkMode: darkEnabled
    });
  };

  const handleSelectPreset = (preset: ThemePreset, saveNow: boolean = false) => {
    setActivePresetId(preset.id);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setButtonColor(preset.buttonColor);
    setButtonHoverColor(preset.buttonHoverColor || calculateHoverColor(preset.buttonColor));
    setButtonTextColor(preset.buttonTextColor || getContrastTextColor(preset.buttonColor));
    setHeadingColor(preset.headingColor || preset.primaryColor);
    setAccentColor(preset.accentColor || preset.secondaryColor);
    setFontFamily(preset.fontFamily || 'Plus Jakarta Sans');
    setButtonRadius(preset.buttonRadius || 'rounded-xl');

    // Dynamically apply and update through ThemePresetManager
    const { updatedSettings, appliedPreset } = ThemePresetManager.switchPreset(settings, preset.id, {
      autoApplyDOM: true
    });

    if (saveNow) {
      updateSettings(updatedSettings);
      setThemeSaveMessage(`Applied & synchronized preset: "${appliedPreset.name}"!`);
      setTimeout(() => setThemeSaveMessage(null), 4000);
    } else {
      setThemeSaveMessage(`Live preview active: "${appliedPreset.name}". Click "Save Theme & Sync" to persist.`);
      setTimeout(() => setThemeSaveMessage(null), 4000);
    }
  };

  const handleLiveColorChange = (
    field: 'primary' | 'secondary' | 'button' | 'buttonHover' | 'buttonText' | 'heading' | 'accent' | 'font' | 'radius',
    value: string
  ) => {
    let nextPrimary = primaryColor;
    let nextSecondary = secondaryColor;
    let nextButton = buttonColor;
    let nextHover = buttonHoverColor;
    let nextText = buttonTextColor;
    let nextHeading = headingColor;
    let nextAccent = accentColor;
    let nextFont = fontFamily;
    let nextRadius = buttonRadius;

    if (field === 'primary') { setPrimaryColor(value); nextPrimary = value; }
    if (field === 'secondary') { setSecondaryColor(value); nextSecondary = value; }
    if (field === 'button') {
      setButtonColor(value);
      nextButton = value;
      const autoHover = calculateHoverColor(value);
      const autoText = getContrastTextColor(value);
      setButtonHoverColor(autoHover);
      setButtonTextColor(autoText);
      nextHover = autoHover;
      nextText = autoText;
    }
    if (field === 'buttonHover') { setButtonHoverColor(value); nextHover = value; }
    if (field === 'buttonText') { setButtonTextColor(value); nextText = value; }
    if (field === 'heading') { setHeadingColor(value); nextHeading = value; }
    if (field === 'accent') { setAccentColor(value); nextAccent = value; }
    if (field === 'font') { setFontFamily(value); nextFont = value; }
    if (field === 'radius') { setButtonRadius(value); nextRadius = value; }

    setActivePresetId('custom-modified');

    applyDynamicTheme({
      primaryColor: nextPrimary,
      secondaryColor: nextSecondary,
      buttonColor: nextButton,
      buttonHoverColor: nextHover,
      buttonTextColor: nextText,
      headingColor: nextHeading,
      accentColor: nextAccent,
      fontFamily: nextFont,
      buttonRadius: nextRadius,
      activePresetId: 'custom-modified'
    });
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    setThemeSaveMessage(null);
    try {
      await updateSettings({
        fontFamily,
        primaryColor,
        secondaryColor,
        buttonColor,
        buttonHoverColor,
        buttonTextColor,
        headingColor,
        accentColor,
        buttonRadius,
        activePresetId,
        customPresets,
        customColors,
        isDarkMode,
        themeMode
      });
      setThemeSaveMessage('Theme customizations & button presets saved successfully!');
      setTimeout(() => setThemeSaveMessage(null), 4000);
    } catch (err: any) {
      setThemeSaveMessage('Failed to save theme: ' + (err.message || 'Network error'));
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetToDefaultTheme = async () => {
    const defaultPreset = DEFAULT_THEME_PRESETS[0];
    handleSelectPreset(defaultPreset, true);
  };

  const handleCreateCustomPreset = async () => {
    if (!newPresetName.trim()) return;
    const { updatedSettings, newPreset } = ThemePresetManager.savePreset(settings, {
      name: newPresetName.trim(),
      description: `Custom preset created by ${user?.name || 'Administrator'}`,
      badge: 'Custom',
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonHoverColor,
      buttonTextColor,
      headingColor,
      accentColor,
      fontFamily,
      buttonRadius
    });

    setCustomPresets(updatedSettings.customPresets || []);
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowNewPresetModal(false);

    await updateSettings(updatedSettings);
    setThemeSaveMessage(`Custom preset "${newPreset.name}" saved & added to library!`);
    setTimeout(() => setThemeSaveMessage(null), 4000);
  };

  const handleDeleteCustomPreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { updatedSettings, success } = ThemePresetManager.deletePreset(settings, id);
    if (success) {
      setCustomPresets(updatedSettings.customPresets || []);
      if (updatedSettings.activePresetId) {
        setActivePresetId(updatedSettings.activePresetId);
        if (updatedSettings.primaryColor) setPrimaryColor(updatedSettings.primaryColor);
        if (updatedSettings.secondaryColor) setSecondaryColor(updatedSettings.secondaryColor);
        if (updatedSettings.buttonColor) setButtonColor(updatedSettings.buttonColor);
        if (updatedSettings.buttonHoverColor) setButtonHoverColor(updatedSettings.buttonHoverColor);
        if (updatedSettings.buttonTextColor) setButtonTextColor(updatedSettings.buttonTextColor);
        if (updatedSettings.headingColor) setHeadingColor(updatedSettings.headingColor);
        if (updatedSettings.accentColor) setAccentColor(updatedSettings.accentColor);
        if (updatedSettings.fontFamily) setFontFamily(updatedSettings.fontFamily);
        if (updatedSettings.buttonRadius) setButtonRadius(updatedSettings.buttonRadius);
      }
      await updateSettings(updatedSettings);
      setThemeSaveMessage('Custom preset removed from library.');
      setTimeout(() => setThemeSaveMessage(null), 3000);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setLogoPreview(dataUrl);
          saveRecentLogo(dataUrl, file.name);
          updateSettings({ logoUrl: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = () => {
    const newLink: HotelLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      url: 'https://'
    };
    setLinks([...links, newLink]);
  };

  const updateLink = (id: string, field: 'label' | 'url', val: string) => {
    setLinks(links.map(l => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleApplyLogoDimensions = (w: number, h: number, fit?: 'contain' | 'cover' | 'fill', autoSave = liveSyncLogo) => {
    const validW = Math.max(40, Math.min(220, Math.round(w)));
    const validH = Math.max(20, Math.min(100, Math.round(h)));
    const finalFit = fit || logoFit;
    setLogoWidth(validW);
    setLogoHeight(validH);
    if (fit) setLogoFit(fit);

    if (autoSave) {
      updateSettings({
        logoWidth: validW,
        logoHeight: validH,
        logoFit: finalFit
      });
    }
  };

  interface RecentFavicon {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }

  interface RecentLogo {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }

  const [recentLogos, setRecentLogos] = useState<RecentLogo[]>(() => {
    try {
      const stored = localStorage.getItem('warwick_recent_logos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveRecentLogo = (url: string, name?: string) => {
    if (!url || !url.trim()) return;
    setRecentLogos(prev => {
      const filtered = prev.filter(f => f.url !== url);
      const newEntry: RecentLogo = {
        id: `logo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Logo Upload #${filtered.length + 1}`,
        url,
        uploadedAt: new Date().toISOString()
      };
      const updated = [newEntry, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('warwick_recent_logos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentLogo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentLogos(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('warwick_recent_logos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentLogos = () => {
    setRecentLogos([]);
    try {
      localStorage.removeItem('warwick_recent_logos');
    } catch {}
  };

  const handleApplyLogo = (url: string) => {
    setLogoPreview(url);
    updateSettings({ logoUrl: url });
  };

  const [recentFavicons, setRecentFavicons] = useState<RecentFavicon[]>(() => {
    try {
      const stored = localStorage.getItem('warwick_recent_favicons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveRecentFavicon = (url: string, name?: string) => {
    if (!url || !url.trim()) return;
    setRecentFavicons(prev => {
      const filtered = prev.filter(f => f.url !== url);
      const newEntry: RecentFavicon = {
        id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Favicon Upload #${filtered.length + 1}`,
        url,
        uploadedAt: new Date().toISOString()
      };
      const updated = [newEntry, ...filtered].slice(0, 12);
      try {
        localStorage.setItem('warwick_recent_favicons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentFavicon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentFavicons(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('warwick_recent_favicons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentFavicons = () => {
    setRecentFavicons([]);
    try {
      localStorage.removeItem('warwick_recent_favicons');
    } catch {}
  };

  const handleApplyFavicon = (url: string, autoSave = liveSyncFavicon) => {
    setFaviconPreview(url);
    if (autoSave) {
      updateSettings({ faviconUrl: url });
    }
  };

  const handleFaviconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          handleApplyFavicon(dataUrl);
          saveRecentFavicon(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    await updateSettings({
      hotelName,
      hotelArabicName,
      hotelSubTitle,
      address,
      phoneNumber,
      emailAddress,
      website,
      defaultDispatchDurationDays: Number(defaultDispatchDurationDays),
      defaultStoreLocation,
      codePrefix,
      additionalLinks: links,
      logoUrl: logoPreview,
      logoWidth: Number(logoWidth),
      logoHeight: Number(logoHeight),
      logoFit,
      faviconUrl: faviconPreview,
      fontFamily,
      primaryColor,
      secondaryColor,
      buttonColor,
      buttonHoverColor,
      buttonTextColor,
      headingColor,
      accentColor,
      buttonRadius,
      activePresetId,
      customPresets,
      isDarkMode,
      themeMode,
      customColors,
      showDepartmentProcessingShare
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System & Account Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel branding, personal employee profile, password security, and theme appearance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canAccessHotel && (
            <button
              type="button"
              id="btn-clear-system-cache-header"
              onClick={() => setShowClearCacheModal(true)}
              disabled={isClearingCache || isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="Purge stale cache and force real-time client synchronization"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 ${isClearingCache ? 'animate-bounce' : ''}`} />
              <span>{isClearingCache ? 'Purging Cache...' : 'Clear System Cache'}</span>
            </button>
          )}

          {/* Quick Dark Mode Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleInstantThemeModeChange('light')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Light Theme"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => handleInstantThemeModeChange('dark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'dark'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to High-Contrast Dark Theme"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-200" />
              <span>Dark</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved!</span>
            </div>
          )}
        </div>
      </div>

      {cacheNotice && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-medium rounded-xl shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cacheNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCacheNotice(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {canAccessHotel && (
          <button
            type="button"
            onClick={() => setActiveTab('hotel')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'hotel'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Hotel Information</span>
          </button>
        )}

        {canAccessHotel && (
          <button
            type="button"
            id="btn-settings-tab-certificate"
            onClick={() => setActiveTab('certificate')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'certificate'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Certificate &amp; Hotel Logo</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Item Categories & Retention</span>
          </button>
        )}

        {(isSuperAdmin || isManager || canAccessHotel) && (
          <button
            type="button"
            onClick={() => setActiveTab('alerts_validation')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'alerts_validation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Validation Messages</span>
          </button>
        )}

        {(isSuperAdmin || isManager || canAccessHotel) && (
          <button
            type="button"
            onClick={() => setActiveTab('login_page')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login_page'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Page & Branding</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shortcuts')}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'shortcuts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Keyboard Shortcuts</span>
        </button>

        {/* REAL-TIME DATABASE INTEGRATIONS (MongoDB, Firebase, SQL, Redis, Supabase) */}
        {(isSuperAdmin || canAccessHotel) && (
          <button
            type="button"
            id="btn-settings-tab-database"
            onClick={() => setActiveTab('database')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Integrations</span>
            <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
          </button>
        )}

        {/* GOOGLE DRIVE AUTO BACKUP & CLOUD RESTORE */}
        {(isSuperAdmin || canAccessHotel) && (
          <button
            type="button"
            id="btn-settings-tab-google-drive"
            onClick={() => setActiveTab('google_drive')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'google_drive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-300" />
            <span>Google Drive Backup</span>
            {settings.googleDriveBackup?.autoBackupEnabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            )}
          </button>
        )}

        {isSuperAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('import_data')}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'import_data'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Data Import & Export</span>
            </button>

            <button
              type="button"
              id="btn-settings-tab-connected-devices"
              onClick={() => setActiveTab('sync')}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Connected Devices</span>
              {sessions.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'sync' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sessions.length}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* TAB: PASSWORD CHANGE & SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 mb-1">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold">Change Password & Account Security</h2>
              </div>
              <p className="text-xs text-slate-500">
                Update your account password. Use a strong password with letters and numbers.
              </p>
            </div>

            {passwordError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isChangingPassword ? 'Changing Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>

          {/* Inactivity Auto-Logout Security Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 text-slate-900 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold">Automatic Logout System (Permanently Stopped)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Per system administrator configuration, the automatic logout system is completely stopped and disabled. Sessions remain permanently active and authenticated across all devices until manually signed out.
            </p>
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Automatic Logout: Stopped & Disabled
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Never auto-logout. Hotel staff and admin sessions remain continuously preserved.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-semibold">
                Disabled / Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ITEM CATEGORIES & RETENTION */}
      {activeTab === 'categories' && (
        <CategorySettings />
      )}

      {/* TAB: DATA IMPORT & EXPORT */}
      {activeTab === 'import_data' && (
        <DataImportExportSettings />
      )}

      {/* TAB: MULTI-DATABASE ARCHITECTURE & MONGODB */}
      {activeTab === 'database' && (
        <div className="space-y-4 animate-fade-in">
          {/* Sub-navigation between Multi-Database Cluster & MongoDB Deep Setup */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-subtab-multidb"
                onClick={() => setDatabaseSubTab('cluster')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  databaseSubTab === 'cluster'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Real-Time Database Integrations</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  MongoDB, Firebase, SQL, Redis, Supabase
                </span>
              </button>

              <button
                type="button"
                id="btn-subtab-mongodb"
                onClick={() => setDatabaseSubTab('mongodb')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  databaseSubTab === 'mongodb'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>MongoDB Atlas Setup & Collections</span>
              </button>

              <button
                type="button"
                id="btn-subtab-gdrive"
                onClick={() => setDatabaseSubTab('gdrive')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  databaseSubTab === 'gdrive'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Google Drive Auto Backup</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 px-2">
              <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-700">
                {mongoStatus?.connected ? 'MongoDB Cluster Live' : 'Offline Engine Active'}
              </span>
            </div>
          </div>

          {/* Sub-view Content */}
          {databaseSubTab === 'cluster' ? (
            <MultiDatabaseManager />
          ) : databaseSubTab === 'mongodb' ? (
            <MongoDatabaseSettings />
          ) : (
            <GoogleDriveBackupManager />
          )}
        </div>
      )}

      {/* TAB: GOOGLE DRIVE AUTO BACKUP & RECOVERY */}
      {activeTab === 'google_drive' && (
        <div className="space-y-6 max-w-6xl animate-fade-in">
          <GoogleDriveBackupManager />
        </div>
      )}

      {/* TAB: ALERTS & VALIDATION CONTROLS */}
      {activeTab === 'alerts_validation' && (
        <AlertsValidationSettings />
      )}

      {/* TAB: LOGIN PAGE & BRANDING CUSTOMIZER */}
      {activeTab === 'login_page' && (
        <LoginPageCustomizer onNavigateToAlerts={() => setActiveTab('alerts_validation')} />
      )}

      {/* TAB: KEYBOARD SHORTCUTS & OPERATIONAL CONTROLS */}
      {activeTab === 'shortcuts' && (
        <KeyboardShortcutsSettings />
      )}

      {/* Form for other tabs */}
      {activeTab !== 'database' && activeTab !== 'security' && activeTab !== 'import_data' && activeTab !== 'categories' && activeTab !== 'alerts_validation' && activeTab !== 'login_page' && activeTab !== 'shortcuts' && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: HOTEL INFORMATION & BRANDING */}
        {/* ========================================================================= */}
        {activeTab === 'hotel' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hotel Logo & Crown Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 mb-1">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold">Hotel Logo & Brand Emblem</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Displays on printable PDF receipts, vouchers, reports, and dynamic portal sidebar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {logoPreview ? (
                  <div className="w-52 h-28 bg-white border-2 border-indigo-200 rounded-xl flex flex-col items-center justify-center p-3 shadow-2xs text-center relative group">
                    <img
                      src={logoPreview}
                      alt="Hotel Logo Preview"
                      className="max-h-16 max-w-[180px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100">
                      Custom Logo Active
                    </span>
                  </div>
                ) : (
                  <div className="w-52 h-28 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 shadow-2xs text-center">
                    <Crown className="w-6 h-6 text-slate-800 mb-0.5" strokeWidth={1.4} />
                    <div className="text-[10px] font-serif text-slate-700 tracking-wider">
                      {hotelArabicName || 'ورويك الباحة'}
                    </div>
                    <div className="text-xs font-serif font-bold text-slate-900 tracking-widest uppercase">
                      WARWICK
                    </div>
                    <div className="text-[8px] text-indigo-600 font-semibold tracking-wider uppercase">
                      {hotelSubTitle || 'Hotels and Resorts'}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{logoPreview ? 'Change Custom Logo' : 'Upload Custom Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(undefined);
                          updateSettings({ logoUrl: undefined });
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PNG, JPG, or SVG. Dynamically saved and rendered in high resolution across the application and PDF documents.
                  </div>
                </div>
              </div>

              {/* DYNAMIC SIDEBAR LOGO WIDTH & HEIGHT CONTROLS */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Sidebar Logo Dynamic Width & Height Control
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Adjust the exact size, width, height, and display fit for the logo rendered in the navigation sidebar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={liveSyncLogo}
                        onChange={e => setLiveSyncLogo(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Live Instant Update</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleApplyLogoDimensions(140, 48, 'contain')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-all"
                      title="Reset logo size to default (140 × 48 px)"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Quick Size Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { label: 'Compact', w: 110, h: 36, desc: '110 × 36 px' },
                      { label: 'Standard', w: 140, h: 48, desc: '140 × 48 px' },
                      { label: 'Wide', w: 165, h: 52, desc: '165 × 52 px' },
                      { label: 'Large Banner', w: 195, h: 60, desc: '195 × 60 px' },
                      { label: 'Square Emblem', w: 50, h: 50, desc: '50 × 50 px' },
                      { label: 'Full Width', w: 215, h: 65, desc: '215 × 65 px' }
                    ].map(preset => {
                      const isSelected = logoWidth === preset.w && logoHeight === preset.h;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyLogoDimensions(preset.w, preset.h)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-900 shadow-2xs font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{preset.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine Sliders & Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {/* Width Control */}
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Scaling className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Logo Width</span>
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min={40}
                          max={220}
                          value={logoWidth}
                          onChange={e => handleApplyLogoDimensions(Number(e.target.value), logoHeight)}
                          className="w-16 px-2 py-0.5 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                        />
                        <span className="text-[10px] font-semibold text-slate-500">px</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={220}
                      step={2}
                      value={logoWidth}
                      onChange={e => handleApplyLogoDimensions(Number(e.target.value), logoHeight)}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>40px</span>
                      <span>Default: 140px</span>
                      <span>220px</span>
                    </div>
                  </div>

                  {/* Height Control */}
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Scaling className="w-3.5 h-3.5 text-indigo-600 rotate-90" />
                        <span>Logo Height</span>
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min={20}
                          max={100}
                          value={logoHeight}
                          onChange={e => handleApplyLogoDimensions(logoWidth, Number(e.target.value))}
                          className="w-16 px-2 py-0.5 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                        />
                        <span className="text-[10px] font-semibold text-slate-500">px</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={2}
                      value={logoHeight}
                      onChange={e => handleApplyLogoDimensions(logoWidth, Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>20px</span>
                      <span>Default: 48px</span>
                      <span>100px</span>
                    </div>
                  </div>

                  {/* Object Fit Control */}
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2 md:col-span-2 lg:col-span-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aspect Ratio & Fit Mode</span>
                    </label>

                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {(['contain', 'cover', 'fill'] as const).map(fit => (
                        <button
                          key={fit}
                          type="button"
                          onClick={() => handleApplyLogoDimensions(logoWidth, logoHeight, fit)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                            logoFit === fit
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      {logoFit === 'contain' && '• Contain: Preserves aspect ratio without cropping (Recommended)'}
                      {logoFit === 'cover' && '• Cover: Fills width and height, clipping overflow'}
                      {logoFit === 'fill' && '• Fill: Stretches image to exact dimensions'}
                    </div>
                  </div>
                </div>

                {/* Real-Time Live Sidebar Header Simulation Preview */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-slate-200">Live Sidebar Header Preview</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-[10px] font-mono rounded-md border border-slate-700">
                      {logoWidth} × {logoHeight} px • {logoFit}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Simulated Expanded Sidebar Header */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[100px]">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Expanded Sidebar (w-64)
                      </div>
                      <div
                        className="flex items-center justify-center overflow-hidden transition-all bg-slate-900/40 rounded-lg p-1 border border-slate-800"
                        style={{
                          width: `${logoWidth}px`,
                          height: `${logoHeight}px`,
                          maxWidth: '100%'
                        }}
                      >
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Preview"
                            className="w-full h-full"
                            style={{
                              objectFit: logoFit,
                              maxWidth: `${logoWidth}px`,
                              maxHeight: `${logoHeight}px`
                            }}
                          />
                        ) : (
                          <div className="flex items-center space-x-1 text-indigo-400">
                            <Crown className="w-6 h-6" />
                            <span className="text-xs font-serif font-bold text-white">WARWICK</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Simulated Collapsed Sidebar Header */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[100px]">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Collapsed Sidebar (w-20)
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-2xs">
                        {faviconPreview || logoPreview ? (
                          <img
                            src={faviconPreview || logoPreview}
                            alt="Favicon Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Crown className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Favicon & Collapsed Sidebar Icon (w-20) Management System */}
            <div id="settings-favicon-management" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-slate-900">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold">Website Favicon &amp; Collapsed Sidebar Icon (w-20)</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Dynamic System
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Control the browser tab favicon and the collapsed navigation icon (80px / <code className="text-indigo-600 font-mono">w-20</code> sidebar). Admins can change, reset, or upload a new favicon anytime.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={liveSyncFavicon}
                      onChange={e => setLiveSyncFavicon(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Instant Live Save</span>
                  </label>
                </div>
              </div>

              {/* Real-time Visual Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Browser Tab Simulation Preview */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Browser Tab Simulation</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Synced</span>
                    </span>
                  </div>

                  {/* Mock Browser Tab Bar */}
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center space-x-2 max-w-[260px] bg-slate-800 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700 shadow-sm">
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center overflow-hidden rounded bg-slate-900/60 p-0.5">
                        <img
                          src={faviconPreview || '/icon.svg'}
                          alt="Tab Favicon"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {hotelName || 'Warwick Hotel'} - Lost &amp; Found
                      </span>
                      <span className="text-slate-500 hover:text-slate-300 text-xs ml-auto font-bold cursor-default">×</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Updates the active browser window tab, bookmarks, and shortcuts in real-time.
                  </p>
                </div>

                {/* 2. Collapsed Sidebar Rail Simulation */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Collapsed Sidebar Header (w-20)</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">80px Rail Mode</span>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center justify-center">
                    <div className="w-20 bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 p-1.5 flex items-center justify-center shadow-inner border border-slate-700">
                        <img
                          src={faviconPreview || '/icon.svg'}
                          alt="Sidebar Favicon"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                        LF
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Displays prominently in the compact navigation bar when collapsed (<code className="text-indigo-300 font-mono">w-20</code>).
                  </p>
                </div>
              </div>

              {/* Upload & Direct URL Controls */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Custom Favicon or Use Image Link</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Button */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload from Device (.svg, .png, .ico, .jpg)
                    </label>
                    <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs transition-colors">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>Choose Favicon File</span>
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
                        onChange={handleFaviconFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Quick Copy from Hotel Logo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Quick Action
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApplyFavicon(logoPreview || '/icon.svg')}
                        className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Use Main Hotel Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyFavicon('/icon.svg')}
                        title="Reset to default Warwick Crest"
                        className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 transition-colors flex items-center space-x-1 shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct URL input */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Direct Image URL / Data URI
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="https://example.com/favicon.png or data:image/svg+xml;..."
                      value={customFaviconUrl}
                      onChange={e => setCustomFaviconUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white"
                    />
                    <button
                      type="button"
                      disabled={!customFaviconUrl.trim()}
                      onClick={() => {
                        if (customFaviconUrl.trim()) {
                          const url = customFaviconUrl.trim();
                          handleApplyFavicon(url);
                          saveRecentFavicon(url, 'Custom Favicon Link');
                          setCustomFaviconUrl('');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Recently Uploaded Favicons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Recently Uploaded Favicons</span>
                  </label>
                  {recentFavicons.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllRecentFavicons}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Clear Recent
                    </button>
                  )}
                </div>

                {recentFavicons.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No recently uploaded favicons</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Upload a favicon file from your device or apply an image URL above to save it here for instant switching.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentFavicons.map((item) => {
                      const isSelected = faviconPreview === item.url;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleApplyFavicon(item.url)}
                          className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 p-1.5 shadow-2xs">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </span>
                              <div className="flex items-center space-x-1">
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => removeRecentFavicon(item.id, e)}
                                  title="Remove from recents"
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recently Uploaded Logos Section (Added alongside Recently Uploaded Favicons) */}
              <div className="space-y-3 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Recently Uploaded Logos</span>
                  </label>
                  {recentLogos.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllRecentLogos}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                    >
                      Clear Recent
                    </button>
                  )}
                </div>

                {recentLogos.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No recently uploaded logos</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Upload a logo file from your device to save it here for instant switching across the portal, sidebar, and login screen.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentLogos.map((item) => {
                      const isSelected = logoPreview === item.url;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleApplyLogo(item.url)}
                          className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-12 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 p-1 shadow-2xs overflow-hidden">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </span>
                              <div className="flex items-center space-x-1">
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => removeRecentLogo(item.id, e)}
                                  title="Remove from recents"
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Hotel Information Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 mb-1">
                <Building className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold">Property & Contact Information</h2>
              </div>
              <p className="text-xs text-slate-500">
                Official property contact info printed on receipts and export documents.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotel Name (English)
                  </label>
                  <input
                    id="input-settings-hotel-name"
                    type="text"
                    value={hotelName}
                    onChange={e => setHotelName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotel Name (Arabic)
                  </label>
                  <input
                    id="input-settings-arabic-name"
                    type="text"
                    dir="rtl"
                    value={hotelArabicName}
                    onChange={e => setHotelArabicName(e.target.value)}
                    placeholder="ورويك الباحة"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Subtitle
                  </label>
                  <input
                    id="input-settings-subtitle"
                    type="text"
                    value={hotelSubTitle}
                    onChange={e => setHotelSubTitle(e.target.value)}
                    placeholder="Hotels and Resorts"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="input-settings-phone"
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Physical Address
                  </label>
                  <input
                    id="input-settings-address"
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="input-settings-email"
                    type="email"
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Website URL
                  </label>
                  <input
                    id="input-settings-website"
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Default Retention Duration (Days)
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Configure Per-Category Policy &rarr;
                    </button>
                  </div>
                  <input
                    type="number"
                    value={defaultDispatchDurationDays}
                    onChange={e => setDefaultDispatchDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fallback retention duration when an item doesn&apos;t match any custom category policy.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Storage Location
                  </label>
                  <input
                    type="text"
                    value={defaultStoreLocation}
                    onChange={e => setDefaultStoreLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Additional Links Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-slate-900 mb-1">
                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold">Portal & Guest Links</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Links for guest verification portal, staff directory, or parcel tracking.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-add-link"
                  onClick={addLink}
                  className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add Link</span>
                </button>
              </div>

              {links.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No additional links added. Click "Add Link" to add one.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {links.map(link => (
                    <div key={link.id} className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Label (e.g. Guest Portal)"
                        value={link.label}
                        onChange={e => updateLink(link.id, 'label', e.target.value)}
                        className="w-1/3 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={link.url}
                        onChange={e => updateLink(link.id, 'url', e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(link.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Processing Share Toggle for Performance Page */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Department Processing Share (Staff Performance Page)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable or disable the Department Processing Share chart on the Staff Performance dashboard. By default, it is hidden.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={showDepartmentProcessingShare}
                    onChange={(e) => setShowDepartmentProcessingShare(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Save Hotel Information Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSyncing}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSyncing ? 'Saving Hotel Information...' : 'Save Hotel Information & Branding'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: 5-STAR CERTIFICATE BRANDING & HOTEL LOGO SYSTEM */}
        {/* ========================================================================= */}
        {activeTab === 'certificate' && canAccessHotel && (
          <div className="animate-fade-in">
            <CertificateSettingsTab />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: CONNECTED DEVICES & SECURITY ACTIVITY */}
        {/* ========================================================================= */}
        {activeTab === 'sync' && (
          <div className="space-y-6 animate-fade-in">
            {/* Connected Devices Sub-Tabs Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  id="btn-subtab-connected-terminals"
                  onClick={() => setConnectedDevicesSubTab('terminals')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    connectedDevicesSubTab === 'terminals'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Active Devices &amp; Terminals</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    connectedDevicesSubTab === 'terminals' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {sessions.length || 1}
                  </span>
                  {onlineSessions.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                      {onlineSessions.length} Online Now
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-subtab-blocked-devices"
                  onClick={() => setConnectedDevicesSubTab('blocked_devices')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    connectedDevicesSubTab === 'blocked_devices'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Blocked Devices</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    connectedDevicesSubTab === 'blocked_devices'
                      ? 'bg-rose-700 text-white'
                      : blockedDevices.length > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {blockedDevices.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-subtab-security-activity"
                  onClick={() => setConnectedDevicesSubTab('security_activity')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    connectedDevicesSubTab === 'security_activity'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Security Activity</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    connectedDevicesSubTab === 'security_activity' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    Live History
                  </span>
                </button>
              </div>

              {connectedDevicesSubTab === 'terminals' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    id="btn-clear-cache-sync-tab"
                    onClick={() => setShowClearCacheModal(true)}
                    disabled={isClearingCache || isSyncing}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                    title="Purge stale application cache and force real-time client synchronization"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-600 ${isClearingCache ? 'animate-bounce' : ''}`} />
                    <span>{isClearingCache ? 'Purging Cache...' : 'Clear System Cache'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchSessions();
                      fetchBlockedDevices();
                    }}
                    disabled={isLoadingSessions}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Refresh Connected Devices"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    id="btn-simulate-offline-toggle"
                    onClick={simulateOfflineToggle}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border shadow-2xs ${
                      isSyncPaused
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle simulated offline state to test the network banner & sync pause notification"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>{isSyncPaused ? 'Resume Online' : 'Simulate Offline'}</span>
                  </button>
                  <button
                    type="button"
                    id="btn-force-sync"
                    onClick={triggerSettingsSync}
                    disabled={isSyncing || isSyncPaused}
                    className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Device Notice Toast */}
            {deviceNotice && (
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold animate-fade-in shadow-xs ${
                  deviceNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {deviceNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{deviceNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeviceNotice(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sub-Tab 1: Connected Terminals (Now Online + Login Device Information + Block Device) */}
            {connectedDevicesSubTab === 'terminals' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Active Devices, Live Terminals &amp; Login Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time monitoring of all logged-in devices. Track currently online terminals, inspect hardware and IP data, or block suspicious devices.
                  </p>
                </div>

                {/* Status Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Online Now Highlight Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Online Right Now</span>
                      </div>
                      <Wifi className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1.5 flex items-baseline space-x-2">
                      <span>{onlineSessions.length}</span>
                      <span className="text-xs font-semibold text-emerald-700">active terminal{onlineSessions.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1">
                      Active heartbeat in the last 3 minutes
                    </div>
                  </div>

                  {/* Connected Terminals Total */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total Sessions
                      </div>
                      <Laptop className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      {sessions.length || 1}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Registered authorized login sessions
                    </div>
                  </div>

                  {/* Blocked Devices Counter */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                        Blocked Devices
                      </div>
                      <Ban className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-rose-900 mt-1.5">
                      {blockedDevices.length}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-1">
                      Prohibited from system access
                    </div>
                  </div>

                  {/* System Cache State */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>Build Sync</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-sm font-bold text-amber-900 mt-1.5">
                      v{settings.version || 1} Live Synced
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-1 truncate">
                      Last sync: {new Date(settings.lastSyncedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Filter Controls & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeviceFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Connected Devices ({sessions.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeviceFilter('online')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'online'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online Now ({onlineSessions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeviceFilter('recent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'recent'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Idle / Inactive ({idleSessions.length})
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deviceSearch}
                      onChange={e => setDeviceSearch(e.target.value)}
                      placeholder="Filter device by user, IP, OS..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {deviceSearch && (
                      <button
                        type="button"
                        onClick={() => setDeviceSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Terminal Sessions List */}
                <div className="space-y-3 pt-1">
                  {isLoadingSessions ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Refreshing live connected devices...</p>
                    </div>
                  ) : displayedSessions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <Laptop className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-sm font-bold text-slate-700">No matching connected devices</div>
                      <p className="text-xs text-slate-500">
                        {deviceFilter === 'online'
                          ? 'No devices currently online in the last 3 minutes.'
                          : 'No terminal sessions match the current filter or search criteria.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedSessions.map(session => {
                        const isCurrent = session.isCurrent;
                        const DeviceIcon =
                          session.deviceType === 'Mobile'
                            ? Smartphone
                            : session.deviceType === 'Tablet'
                            ? Tablet
                            : Laptop;

                        const timeSinceSeen = Math.floor(
                          (Date.now() - new Date(session.lastSeen).getTime()) / 1000
                        );
                        const isOnlineNow = timeSinceSeen < 180; // Within 3 minutes

                        return (
                          <div
                            key={session.deviceId}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                              isCurrent
                                ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-500/20'
                                : isOnlineNow
                                ? 'bg-emerald-50/30 border-emerald-200/80 hover:bg-emerald-50/50'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {/* Top Card Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2.5 rounded-xl ${
                                    isCurrent
                                      ? 'bg-indigo-600 text-white'
                                      : isOnlineNow
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  <DeviceIcon className="w-5 h-5" />
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900">
                                      {session.os || 'Desktop OS'} • {session.browser || 'Web Browser'}
                                    </span>

                                    {/* Current Terminal Badge */}
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md flex items-center space-x-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Current Device (This Terminal)</span>
                                      </span>
                                    )}

                                    {/* Real-time Online Indicator */}
                                    {isOnlineNow ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                                        Online Now
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Idle ({Math.floor(timeSinceSeen / 60)}m ago)
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                                    <span>Session: <code className="font-mono text-slate-700 font-bold">{session.deviceId}</code></span>
                                    <span>•</span>
                                    <span>Last Seen: {new Date(session.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Block Device & Terminate */}
                              <div className="flex items-center space-x-2 self-end sm:self-center">
                                {!isCurrent ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenBlockModal(session)}
                                      className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition-all shadow-2xs cursor-pointer"
                                      title="Block this device temporarily or permanently"
                                    >
                                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Block Device</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteSession(session.deviceId)}
                                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs cursor-pointer"
                                      title="Terminate remote session"
                                    >
                                      <LogOut className="w-3.5 h-3.5" />
                                      <span>Terminate</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                                    Protected Active Terminal
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Full Login Device Information Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                              {/* Logged in User */}
                              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {(session.userName || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged-in User</span>
                                  <span className="font-bold text-slate-800 truncate block text-xs">
                                    {session.userName || 'Unknown Staff'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 capitalize block">
                                    {session.role || 'Staff'} {session.userEmail ? `• ${session.userEmail}` : ''}
                                  </span>
                                </div>
                              </div>

                              {/* IP Address */}
                              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">IP Address</span>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="font-mono font-bold text-slate-800 text-xs truncate">
                                    {session.ip || '192.168.1.45'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyClipboard(session.ip || '192.168.1.45')}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                                    title="Copy IP"
                                  >
                                    {copiedText === (session.ip || '192.168.1.45') ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-400 block">Local / Network Terminal</span>
                              </div>

                              {/* Device Type & Platform */}
                              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hardware &amp; Platform</span>
                                <span className="font-bold text-slate-800 truncate block text-xs mt-0.5">
                                  {session.deviceType || 'Desktop'} ({session.os || 'Windows'})
                                </span>
                                <span className="text-[10px] text-slate-500 truncate block">
                                  {session.browser || 'Google Chrome'}
                                </span>
                              </div>

                              {/* Connection & Device ID */}
                              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Device Identifier</span>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="font-mono text-slate-700 text-xs font-semibold truncate">
                                    {session.deviceId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyClipboard(session.deviceId)}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                                    title="Copy Device ID"
                                  >
                                    {copiedText === session.deviceId ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-400 block">
                                  {isOnlineNow ? '🟢 Active Heartbeat' : '⚪ Standby'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Blocked Devices Management (Temporary & Permanent) */}
            {connectedDevicesSubTab === 'blocked_devices' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                        <Ban className="w-5 h-5" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Blocked Devices &amp; Terminal Access Control
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Blacklisted terminals and IP addresses prohibited from authentication or data synchronization.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomBlockModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Block Custom IP / Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchBlockedDevices()}
                      disabled={isLoadingBlockedDevices}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlockedDevices ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {isLoadingBlockedDevices ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 text-rose-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Checking blocked devices list...</p>
                  </div>
                ) : blockedDevices.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">No Blocked Devices</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All authorized terminals and staff devices are currently granted system access. To prohibit a device, click &quot;Block Device&quot; in the Active Devices tab or add a custom rule above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedDevices.map(blocked => {
                      const isPermanent = blocked.blockType === 'permanent';
                      const remainingMs = blocked.blockedUntil ? Math.max(0, new Date(blocked.blockedUntil).getTime() - Date.now()) : 0;
                      const remainingHours = Math.ceil(remainingMs / (3600 * 1000));
                      const remainingMins = Math.ceil(remainingMs / (60 * 1000));

                      return (
                        <div
                          key={blocked.deviceId}
                          className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/50 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                                <Ban className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">
                                    {blocked.userName || 'Unknown Staff'}
                                  </span>

                                  {isPermanent ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                                      <Lock className="w-3 h-3" />
                                      <span>Permanent Block</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        Temporary Block ({remainingHours > 1 ? `${remainingHours}h remaining` : `${remainingMins}m remaining`})
                                      </span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                                  <span>Device: <code className="font-mono font-bold text-slate-800">{blocked.deviceId}</code></span>
                                  <span>•</span>
                                  <span>IP: <code className="font-mono font-bold text-slate-800">{blocked.ip || 'All IPs'}</code></span>
                                  <span>•</span>
                                  <span>Platform: {blocked.deviceType || 'Desktop'} ({blocked.os || 'OS'})</span>
                                </div>

                                <div className="text-xs text-rose-800 font-medium mt-1">
                                  Reason: {blocked.reason || 'Security policy enforcement'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setDeviceToUnblock(blocked)}
                                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unblock Device</span>
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                            <span>Blocked By: <strong>{blocked.blockedBy}</strong> ({blocked.blockedByRole || 'Super Admin'})</span>
                            <span>Blocked At: {new Date(blocked.blockedAt).toLocaleString()}</span>
                            {blocked.blockedUntil && (
                              <span>Expires: {new Date(blocked.blockedUntil).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Security Activity History */}
            {connectedDevicesSubTab === 'security_activity' && (
              <SecurityActivityTab />
            )}
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex justify-end pt-3">
          <button
            id="btn-save-settings"
            type="submit"
            disabled={isSyncing}
            className={`flex items-center space-x-2 px-6 py-2.5 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 ${buttonRadius}`}
            style={{ backgroundColor: buttonColor }}
          >
            <Save className="w-4 h-4" />
            <span>{isSyncing ? 'Saving & Syncing...' : 'Save & Apply All Settings'}</span>
          </button>
        </div>
      </form>
      )}

      {/* Clear System Cache Confirmation Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Clear System Cache?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will purge all server memory buffers, clean inactive device sessions, and broadcast an immediate refresh event to all connected employee terminals and dashboards.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between font-medium">
                <span>Current Sync Build:</span>
                <span className="font-bold text-slate-800">v{settings.version || 1}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Active Cached Items:</span>
                <span className="font-bold text-slate-800">{items.length} records</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Connected Terminals:</span>
                <span className="font-bold text-slate-800">{sessions.length || 1} devices</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                disabled={isClearingCache}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-purge-cache"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="flex items-center space-x-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isClearingCache ? 'animate-bounce' : ''}`} />
                <span>{isClearingCache ? 'Purging Cache...' : 'Confirm Cache Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Block Active Device (Temporary & Permanent) */}
      {deviceToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Block Device &amp; Terminal Access
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prohibit this device from logging in or syncing data. Its current active session will be immediately destroyed.
                </p>
              </div>
            </div>

            {/* Device Info Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">User:</span>
                <span className="font-bold text-slate-900">{deviceToBlock.userName} ({deviceToBlock.role || 'Staff'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">IP Address:</span>
                <span className="font-mono font-bold text-slate-800">{deviceToBlock.ip || '192.168.1.45'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Platform:</span>
                <span>{deviceToBlock.deviceType || 'Desktop'} • {deviceToBlock.os || 'Windows'} ({deviceToBlock.browser || 'Chrome'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Device ID:</span>
                <code className="font-mono text-[11px] text-slate-600">{deviceToBlock.deviceId}</code>
              </div>
            </div>

            {/* Block Type Selection */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 block">Select Block Mode:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    blockType === 'temporary'
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-500/20 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="blockTypeRadio"
                      checked={blockType === 'temporary'}
                      onChange={() => setBlockType('temporary')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold">⏱️ Temporary Block</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">
                    Automatically unblocks after specified duration
                  </span>
                </label>

                <label
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    blockType === 'permanent'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-500/20 text-rose-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="blockTypeRadio"
                      checked={blockType === 'permanent'}
                      onChange={() => setBlockType('permanent')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold">🚫 Permanent Block</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">
                    Remains blacklisted until admin explicitly unblocks
                  </span>
                </label>
              </div>
            </div>

            {/* Temporary Duration Selector */}
            {blockType === 'temporary' && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-800 block">Block Duration:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: '15 Min', hours: 0.25 },
                    { label: '1 Hour', hours: 1 },
                    { label: '6 Hours', hours: 6 },
                    { label: '24 Hours', hours: 24 },
                    { label: '3 Days', hours: 72 },
                    { label: '7 Days', hours: 168 }
                  ].map(d => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setBlockDurationHours(d.hours)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        blockDurationHours === d.hours
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Block Reason */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 block">Reason for Block:</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[
                  'Suspicious login activity',
                  'Unauthorized staff terminal',
                  'Security policy audit',
                  'Lost or stolen device'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBlockReason(r)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 transition-all cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Enter block reason or security note..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                The active session for this terminal will be destroyed immediately and future requests from this device or IP will be rejected with HTTP 403 Forbidden.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeviceToBlock(null)}
                disabled={isSubmittingBlock}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-device"
                onClick={handleConfirmBlockDevice}
                disabled={isSubmittingBlock}
                className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Ban className={`w-3.5 h-3.5 ${isSubmittingBlock ? 'animate-spin' : ''}`} />
                <span>{isSubmittingBlock ? 'Blocking Device...' : 'Confirm & Block Device'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Block Custom IP / Device ID */}
      {showCustomBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Block Custom IP or Device Identifier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Blacklist a specific IP address or terminal hardware ID from accessing the system.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">IP Address to Block:</label>
                <input
                  type="text"
                  value={customBlockIp}
                  onChange={e => setCustomBlockIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or 46.240.73.235"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Device ID (Optional):</label>
                <input
                  type="text"
                  value={customBlockDeviceId}
                  onChange={e => setCustomBlockDeviceId(e.target.value)}
                  placeholder="e.g. dev-suspicious-01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staff / Label Description:</label>
                <input
                  type="text"
                  value={customBlockUserName}
                  onChange={e => setCustomBlockUserName(e.target.value)}
                  placeholder="e.g. Unknown Remote Terminal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Block Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockType('temporary')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                      blockType === 'temporary'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ⏱️ Temporary (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType('permanent')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                      blockType === 'permanent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🚫 Permanent
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason:</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Rogue terminal security block"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomBlockModal(false)}
                disabled={isSubmittingBlock}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockDevice}
                disabled={isSubmittingBlock || (!customBlockIp && !customBlockDeviceId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBlock ? 'Adding Block...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Unblock Device Confirmation */}
      {deviceToUnblock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Unblock Device?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to unblock this terminal? It will regain access to connect and authenticate.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className="font-bold text-slate-900">{deviceToUnblock.userName || 'Device'}</div>
              <div className="font-mono text-[11px] text-slate-500">ID: {deviceToUnblock.deviceId}</div>
              <div className="font-mono text-[11px] text-slate-500">IP: {deviceToUnblock.ip || 'N/A'}</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeviceToUnblock(null)}
                disabled={isUnblocking}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-unblock-modal"
                onClick={() => handleConfirmUnblockDevice(deviceToUnblock)}
                disabled={isUnblocking}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isUnblocking ? 'Unblocking...' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
