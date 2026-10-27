import { Certificate, CustomCertificateTemplate, User } from '../../types';
import { getAuthHeaders } from './client';

const DEFAULT_SEED_CERTS: Certificate[] = [
  {
    id: 'cert-1788765369001',
    certificateNumber: 'WRW-CERT-2026-001',
    template: 'employee_of_month',
    title: 'Employee of the Month',
    recipientName: 'MD ABU SAYEED RIDAY',
    recipientPosition: 'Housekeeping Supervisor',
    recipientDepartment: 'Housekeeping',
    awardPeriod: 'June 2026',
    citationText: 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!',
    location: 'Al Baha, Saudi Arabia',
    awardDate: 'June 2026',
    signatory1Title: 'Housekeeping',
    signatory1Name: '',
    signatory2Title: 'General Manager',
    signatory2Name: '',
    notes: 'Awarded for exceptional leadership in guest service and department organization.',
    issuedBy: 'Super Admin',
    issuedByRole: 'Super Admin',
    issuedAt: '2026-06-30T10:00:00.000Z',
    createdAt: '2026-06-30T10:00:00.000Z',
    updatedAt: '2026-06-30T10:00:00.000Z'
  },
  {
    id: 'cert-1788765369002',
    certificateNumber: 'WRW-CERT-2026-002',
    template: 'appreciation',
    title: 'Certificate of Appreciation',
    recipientName: 'MD ABU SAYEED RIDAY',
    recipientPosition: 'Housekeeping Supervisor',
    recipientDepartment: 'Housekeeping',
    awardPeriod: 'June 2026',
    citationText: 'This certificate is proudly presented to Md Abu Sayeed Riday, Housekeeping Supervisor, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.',
    location: 'Al Baha, Saudi Arabia',
    awardDate: '15 June 2026',
    signatory1Title: 'Housekeeping Manager',
    signatory1Name: '',
    signatory2Title: 'General Manager',
    signatory2Name: '',
    notes: 'Awarded during hotel pre-opening and grand launch event.',
    issuedBy: 'Super Admin',
    issuedByRole: 'Super Admin',
    issuedAt: '2026-06-15T10:00:00.000Z',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z'
  }
];

export const certificatesApi = {
  async getCertificateTemplates(user?: User | null): Promise<{ success: boolean; templates: CustomCertificateTemplate[] }> {
    try {
      const res = await fetch('/api/certificates/templates', {
        headers: getAuthHeaders(user)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.templates)) {
          try {
            localStorage.setItem('warwick_certificate_templates', JSON.stringify(data.templates));
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('API getCertificateTemplates offline or unavailable, using local fallback:', e);
    }

    let localTemplates: CustomCertificateTemplate[] = [];
    try {
      const cached = localStorage.getItem('warwick_certificate_templates');
      if (cached) localTemplates = JSON.parse(cached);
    } catch {}
    return { success: true, templates: localTemplates };
  },

  async createCertificateTemplate(templateData: Partial<CustomCertificateTemplate>, user?: User | null): Promise<{ success: boolean; template: CustomCertificateTemplate; message?: string }> {
    try {
      const res = await fetch('/api/certificates/templates', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(templateData)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.template) {
          try {
            const cached = localStorage.getItem('warwick_certificate_templates');
            const list: CustomCertificateTemplate[] = cached ? JSON.parse(cached) : [];
            list.unshift(data.template);
            localStorage.setItem('warwick_certificate_templates', JSON.stringify(list));
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('createCertificateTemplate online failed, falling back to local creation:', e);
    }

    const fallbackTemplate: CustomCertificateTemplate = {
      id: templateData.id || `custom-${Date.now()}`,
      name: templateData.name || 'Custom Certificate Template',
      description: templateData.description || '',
      category: templateData.category || 'Hotel Staff',
      backgroundImageUrl: templateData.backgroundImageUrl || '',
      isCustom: true,
      defaultTitle: templateData.defaultTitle || 'Certificate of Recognition',
      defaultCitation: templateData.defaultCitation || '',
      accentColor: templateData.accentColor || '#FFFFFF',
      elements: templateData.elements || [],
      settings: templateData.settings || {},
      createdBy: user?.name || 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const cached = localStorage.getItem('warwick_certificate_templates');
      const list: CustomCertificateTemplate[] = cached ? JSON.parse(cached) : [];
      list.unshift(fallbackTemplate);
      localStorage.setItem('warwick_certificate_templates', JSON.stringify(list));
    } catch {}
    return { success: true, template: fallbackTemplate, message: 'Template saved locally.' };
  },

  async updateCertificateTemplate(id: string, templateData: Partial<CustomCertificateTemplate>, user?: User | null): Promise<{ success: boolean; template: CustomCertificateTemplate; message?: string }> {
    try {
      const res = await fetch(`/api/certificates/templates/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(templateData)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.template) {
          try {
            const cached = localStorage.getItem('warwick_certificate_templates');
            if (cached) {
              const list: CustomCertificateTemplate[] = JSON.parse(cached);
              const idx = list.findIndex(t => t.id === id);
              if (idx >= 0) {
                list[idx] = data.template;
                localStorage.setItem('warwick_certificate_templates', JSON.stringify(list));
              }
            }
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('updateCertificateTemplate online failed, falling back to local update:', e);
    }

    let updatedTemplate: CustomCertificateTemplate = templateData as CustomCertificateTemplate;
    try {
      const cached = localStorage.getItem('warwick_certificate_templates');
      if (cached) {
        const list: CustomCertificateTemplate[] = JSON.parse(cached);
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...templateData, updatedAt: new Date().toISOString() };
          updatedTemplate = list[idx];
          localStorage.setItem('warwick_certificate_templates', JSON.stringify(list));
        }
      }
    } catch {}
    return { success: true, template: updatedTemplate, message: 'Template updated locally.' };
  },

  async deleteCertificateTemplate(id: string, user?: User | null): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/certificates/templates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        try {
          const cached = localStorage.getItem('warwick_certificate_templates');
          if (cached) {
            const list: CustomCertificateTemplate[] = JSON.parse(cached);
            localStorage.setItem('warwick_certificate_templates', JSON.stringify(list.filter(t => t.id !== id)));
          }
        } catch {}
        return data;
      }
    } catch (e) {
      console.warn('deleteCertificateTemplate online failed, deleting locally:', e);
    }

    try {
      const cached = localStorage.getItem('warwick_certificate_templates');
      if (cached) {
        const list: CustomCertificateTemplate[] = JSON.parse(cached);
        localStorage.setItem('warwick_certificate_templates', JSON.stringify(list.filter(t => t.id !== id)));
      }
    } catch {}
    return { success: true, message: 'Template removed.' };
  },

  async getCertificates(params?: { q?: string; template?: string }, user?: User | null): Promise<{ success: boolean; certificates: Certificate[]; total: number; source?: string }> {
    try {
      const query = new URLSearchParams();
      if (params?.q) query.set('q', params.q);
      if (params?.template) query.set('template', params.template);
      const url = `/api/certificates${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(user)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.certificates)) {
          try {
            localStorage.setItem('warwick_certificates', JSON.stringify(data.certificates));
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('API getCertificates offline or error, falling back to local storage cache:', e);
    }

    let localCerts: Certificate[] = DEFAULT_SEED_CERTS;
    try {
      const cached = localStorage.getItem('warwick_certificates');
      if (cached) {
        localCerts = JSON.parse(cached);
      } else {
        localStorage.setItem('warwick_certificates', JSON.stringify(DEFAULT_SEED_CERTS));
      }
    } catch {}

    let filtered = [...localCerts];
    if (params?.q) {
      const q = params.q.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.recipientName?.toLowerCase().includes(q) ||
        c.certificateNumber?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.recipientDepartment?.toLowerCase().includes(q)
      );
    }
    if (params?.template && params.template !== 'all') {
      filtered = filtered.filter(c => c.template === params.template);
    }

    return {
      success: true,
      certificates: filtered,
      total: filtered.length,
      source: 'local_storage'
    };
  },

  async getCertificate(id: string, user?: User | null): Promise<{ success: boolean; certificate: Certificate }> {
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(user)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.certificate) return data;
      }
    } catch (e) {
      console.warn('getCertificate online failed, checking local storage:', e);
    }

    try {
      const cached = localStorage.getItem('warwick_certificates');
      if (cached) {
        const list: Certificate[] = JSON.parse(cached);
        const found = list.find(c => c.id === id || c.certificateNumber === id);
        if (found) return { success: true, certificate: found };
      }
    } catch {}

    throw new Error('Certificate not found');
  },

  async createCertificate(certData: Partial<Certificate>, user?: User | null): Promise<{ success: boolean; certificate: Certificate; message?: string }> {
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(certData)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.certificate) {
          try {
            const cached = localStorage.getItem('warwick_certificates');
            const list: Certificate[] = cached ? JSON.parse(cached) : [];
            list.unshift(data.certificate);
            localStorage.setItem('warwick_certificates', JSON.stringify(list));
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('createCertificate online failed, saving locally:', e);
    }

    const newId = `cert-${Date.now()}`;
    const certNum = certData.certificateNumber || `WRW-CERT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const fallbackCert: Certificate = {
      ...certData,
      id: newId,
      certificateNumber: certNum,
      template: certData.template || 'employee_of_month',
      title: certData.title || 'Certificate of Recognition',
      recipientName: certData.recipientName || 'Recipient Name',
      recipientPosition: certData.recipientPosition || '',
      recipientDepartment: certData.recipientDepartment || '',
      awardPeriod: certData.awardPeriod || '',
      citationText: certData.citationText || '',
      location: certData.location || 'Al Baha, Saudi Arabia',
      awardDate: certData.awardDate || new Date().toLocaleDateString('en-GB'),
      signatory1Title: certData.signatory1Title || 'Department Head',
      signatory1Name: certData.signatory1Name || '',
      signatory1Signature: certData.signatory1Signature || undefined,
      signatory2Title: certData.signatory2Title || 'General Manager',
      signatory2Name: certData.signatory2Name || '',
      signatory2Signature: certData.signatory2Signature || undefined,
      signatory3Title: certData.signatory3Title || undefined,
      signatory3Name: certData.signatory3Name || undefined,
      signatory3Signature: certData.signatory3Signature || undefined,
      showSignatory3: Boolean(certData.showSignatory3),
      notes: certData.notes || '',
      issuedBy: user?.name || 'Super Admin',
      issuedByRole: user?.role || 'Super Admin',
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const cached = localStorage.getItem('warwick_certificates');
      const list: Certificate[] = cached ? JSON.parse(cached) : [];
      list.unshift(fallbackCert);
      localStorage.setItem('warwick_certificates', JSON.stringify(list));
    } catch {}
    return { success: true, certificate: fallbackCert, message: 'Certificate saved locally.' };
  },

  async updateCertificate(id: string, certData: Partial<Certificate>, user?: User | null): Promise<{ success: boolean; certificate: Certificate; message?: string }> {
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify(certData)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.certificate) {
          try {
            const cached = localStorage.getItem('warwick_certificates');
            if (cached) {
              const list: Certificate[] = JSON.parse(cached);
              const idx = list.findIndex(c => c.id === id);
              if (idx >= 0) {
                list[idx] = data.certificate;
                localStorage.setItem('warwick_certificates', JSON.stringify(list));
              }
            }
          } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('updateCertificate online failed, updating locally:', e);
    }

    let updatedCert: Certificate = certData as Certificate;
    try {
      const cached = localStorage.getItem('warwick_certificates');
      if (cached) {
        const list: Certificate[] = JSON.parse(cached);
        const idx = list.findIndex(c => c.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...certData, updatedAt: new Date().toISOString() };
          updatedCert = list[idx];
          localStorage.setItem('warwick_certificates', JSON.stringify(list));
        }
      }
    } catch {}
    return { success: true, certificate: updatedCert, message: 'Certificate updated locally.' };
  },

  async deleteCertificate(id: string, user?: User | null): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        try {
          const cached = localStorage.getItem('warwick_certificates');
          if (cached) {
            const list: Certificate[] = JSON.parse(cached);
            localStorage.setItem('warwick_certificates', JSON.stringify(list.filter(c => c.id !== id)));
          }
        } catch {}
        return data;
      }
    } catch (e) {
      console.warn('deleteCertificate online failed, deleting locally:', e);
    }

    try {
      const cached = localStorage.getItem('warwick_certificates');
      if (cached) {
        const list: Certificate[] = JSON.parse(cached);
        localStorage.setItem('warwick_certificates', JSON.stringify(list.filter(c => c.id !== id)));
      }
    } catch {}
    return { success: true, message: 'Certificate deleted locally.' };
  },

  async extractHandwrittenSignature(
    imageBase64: string,
    user?: User | null
  ): Promise<{
    success: boolean;
    hasHandwrittenSignature: boolean;
    boundingBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
    allSignatures?: Array<{ label?: string; ymin: number; xmin: number; ymax: number; xmax: number }>;
    confidence?: number;
    error?: string;
    message?: string;
    reason?: string;
  }> {
    try {
      const res = await fetch('/api/certificates/extract-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeaders(user) : {})
        },
        body: JSON.stringify({ imageBase64 })
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        hasHandwrittenSignature: false,
        error: 'Network error',
        message: 'Handwritten signature is not found'
      };
    }
  }
};
