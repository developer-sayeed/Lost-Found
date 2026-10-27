import { PublicWebsiteSettings, GuestInquiry, User } from '../../types';
import { getAuthHeaders } from './client';

export const publicApi = {
  async getPublicItems(): Promise<{ success: boolean; count: number; items: any[] }> {
    const res = await fetch('/api/public/items');
    return res.json();
  },

  async getPublicWebsiteSettings(): Promise<PublicWebsiteSettings> {
    const res = await fetch('/api/public/website-settings');
    return res.json();
  },

  async updatePublicWebsiteSettings(settings: Partial<PublicWebsiteSettings>, user?: User | null): Promise<any> {
    const res = await fetch('/api/public/website-settings', {
      method: 'PUT',
      headers: getAuthHeaders(user),
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async getInquiries(_user?: User | null): Promise<{ success: boolean; inquiries: GuestInquiry[] }> {
    return { success: true, inquiries: [] };
  },

  async createGuestInquiry(_inquiry?: Partial<GuestInquiry>): Promise<any> {
    return { success: false, error: 'Guest inquiries are disabled in this private portal.' };
  },

  async trackGuestInquiry(_code?: string): Promise<{ success: boolean; inquiry?: GuestInquiry; error?: string }> {
    return { success: false, error: 'Inquiry tracking is disabled.' };
  },

  async updateInquiry(_id?: string, _updates?: Partial<GuestInquiry>, _user?: User | null): Promise<any> {
    return { success: false };
  },

  async deleteInquiry(_id?: string, _user?: User | null): Promise<any> {
    return { success: false };
  }
};
