export type SettingsTab =
  | 'hotel'
  | 'certificate'
  | 'categories'
  | 'security'
  | 'database'
  | 'google_drive'
  | 'sync'
  | 'import_data'
  | 'alerts_validation'
  | 'login_page'
  | 'shortcuts';

export interface RecentFavicon {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface RecentLogo {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}
