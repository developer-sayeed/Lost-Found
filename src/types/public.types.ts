import { ItemCategory } from './items.types';

export type GuestInquiryStatus =
  | 'Received'
  | 'Under Review'
  | 'Matched'
  | 'Ready for Pickup'
  | 'Dispatched'
  | 'Closed';

export interface GuestInquiry {
  id: string;
  trackingCode: string; // e.g. WARWICK-CLM-2026-0042
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber?: string;
  stayDate?: string;
  category: ItemCategory;
  itemName: string;
  description: string;
  brand?: string;
  color?: string;
  locationLost?: string;
  dateLost: string;
  photoUrl?: string;
  status: GuestInquiryStatus;
  matchedItemId?: string;
  matchedItemCode?: string;
  staffNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicWebsiteSettings {
  enabled: boolean;
  portalTitle: string;
  portalSubtitle: string;
  welcomeMessage: string;
  bannerNotice: string;
  showBannerNotice: boolean;
  contactPhone: string;
  contactEmail: string;
  allowPublicItemSearch: boolean;
  autoNotifyStaffOnInquiry: boolean;
  policyNotes: string;
  lostRetentionDays: number;
  heroImageUrl?: string;
  allowGuestPhotoUpload: boolean;
}

export const DEFAULT_PUBLIC_WEBSITE_SETTINGS: PublicWebsiteSettings = {
  enabled: true,
  portalTitle: 'Warwick Hotel Baha - Guest Lost & Found Portal',
  portalSubtitle: 'Official Guest Inquiry, Lost Property Reporting & Real-Time Tracking Service',
  welcomeMessage: 'Did you misplace a personal belonging during your stay at Warwick Hotel Baha? Our Concierge & Loss Prevention team is here 24/7 to help you search our registry or submit a recovery inquiry.',
  bannerNotice: '🌟 Concierge Notice: All found valuables (electronics, jewelry, wallets) are secured in our safe deposit vault for 90 days. Inquiries are processed within 2 hours.',
  showBannerNotice: true,
  contactPhone: '+966 17 725 1111',
  contactEmail: 'lostfound@warwickbahahotel.com',
  allowPublicItemSearch: true,
  autoNotifyStaffOnInquiry: true,
  policyNotes: 'All unclaimed guest items are securely categorized and held according to hotel policy. Valid government identification (Passport/Iqama) or room confirmation is required during handover.',
  lostRetentionDays: 90,
  allowGuestPhotoUpload: true
};
