import { BuilderElement, CanvasSettings, SavedCertificateTemplate } from './types';

export const PREBUILT_TEMPLATES: SavedCertificateTemplate[] = [
  // 1. 5-Star Luxury Imperial Excellence
  {
    id: 'tpl_luxury_imperial',
    name: '5-Star Luxury Imperial Excellence',
    category: 'Hospitality & 5-Star',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    description: 'The definitive royal standard: gold crest, dual executive signatories and 24K seal with dynamic staff recognition.',
    thumbnailBadge: 'IMPERIAL GOLD',
    settings: {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      borderStyle: 'royal_frame',
      borderColor: '#c4972a',
      accentColor: '#c4972a',
      primaryColor: '#0f2338',
      textColor: '#0f172a',
      showWatermark: true,
      watermarkOpacity: 0.05
    },
    elements: [
      {
        id: 'title_1',
        type: 'certificate_title',
        name: 'Certificate Award Title',
        category: 'title',
        x: 50,
        y: 20,
        zIndex: 11,
        isVisible: true,
        content: 'CERTIFICATE OF EXCELLENCE',
        fontSize: 32,
        letterSpacing: 4,
        fontWeight: 800,
        textColor: '#0f2338'
      },
      {
        id: 'pres_1',
        type: 'presentation_text',
        name: 'Presentation Subtitle',
        category: 'title',
        x: 50,
        y: 29,
        zIndex: 12,
        isVisible: true,
        content: 'THIS HONOR IS PROUDLY CONFERRED UPON',
        fontSize: 11.5,
        letterSpacing: 3,
        fontWeight: 600,
        textColor: '#64748b'
      },
      {
        id: 'recip_1',
        type: 'recipient_name',
        name: 'Recipient Name',
        category: 'recipient',
        x: 50,
        y: 41,
        zIndex: 15,
        isVisible: true,
        content: '{{staff_name}}',
        fontSize: 38,
        fontWeight: 800,
        fontStyle: 'italic',
        textColor: '#0f2338'
      },
      {
        id: 'meta_1',
        type: 'recipient_meta',
        name: 'Role & Department',
        category: 'recipient',
        x: 50,
        y: 50,
        zIndex: 14,
        isVisible: true,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 13,
        fontWeight: 700,
        textColor: '#0f2338',
        meta: { awardPeriod: 'Annual Honors' }
      },
      {
        id: 'cit_1',
        type: 'citation',
        name: 'Commendation Citation',
        category: 'content',
        x: 50,
        y: 62,
        width: '78%',
        zIndex: 13,
        isVisible: true,
        content: '{{citation_paragraph}}',
        fontSize: 13.5,
        fontStyle: 'italic',
        lineHeight: 1.6,
        textColor: '#334155'
      },
      {
        id: 'badge_1',
        type: 'badge_seal',
        name: 'Official Medal Seal',
        category: 'badges',
        x: 50,
        y: 81,
        zIndex: 20,
        isVisible: true,
        content: 'SEAL OF EXCELLENCE',
        subContent: 'OFFICIAL RECOGNITION',
        meta: { badgeStyle: 'rosette' }
      },
      {
        id: 'sig_left',
        type: 'signatory_left',
        name: 'Signatory 1 (HOD)',
        category: 'signatures',
        x: 23,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Department Head',
        subContent: 'Authorized Signature',
        textColor: '#0f2338'
      },
      {
        id: 'sig_right',
        type: 'signatory_right',
        name: 'Signatory 2 (GM)',
        category: 'signatures',
        x: 77,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Executive Director',
        subContent: 'Authorized Signature',
        textColor: '#0f2338'
      },
      {
        id: 'qr_1',
        type: 'qr_code',
        name: 'Verification QR',
        category: 'security',
        x: 10,
        y: 93,
        zIndex: 12,
        isVisible: true
      },
      {
        id: 'date_1',
        type: 'date_location',
        name: 'Date & Location',
        category: 'security',
        x: 50,
        y: 93,
        zIndex: 12,
        isVisible: true,
        content: '{{issue_date}}',
        subContent: ''
      }
    ]
  },

  // 2. Employee of the Month Elite
  {
    id: 'tpl_eom_elite',
    name: 'Employee of the Month Elite',
    category: 'Hospitality & 5-Star',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Dynamic achievement design with starburst medal, key accomplishments, and official approval stamp.',
    thumbnailBadge: 'STARBURST MEDAL',
    settings: {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      borderStyle: 'geometric_gold',
      borderColor: '#d97706',
      accentColor: '#d97706',
      primaryColor: '#0f2338',
      textColor: '#0f172a',
      showWatermark: true,
      watermarkOpacity: 0.04
    },
    elements: [
      {
        id: 'title_eom',
        type: 'certificate_title',
        name: 'Certificate Award Title',
        category: 'title',
        x: 50,
        y: 19,
        zIndex: 11,
        isVisible: true,
        content: 'EMPLOYEE OF THE MONTH',
        fontSize: 32,
        letterSpacing: 4,
        textColor: '#0f2338'
      },
      {
        id: 'eom_tag',
        type: 'department_badge',
        name: 'Month Distinction',
        category: 'header',
        x: 50,
        y: 28,
        zIndex: 12,
        isVisible: true,
        content: 'DISTINGUISHED HONORS',
        fontSize: 11,
        textColor: '#d97706',
        borderColor: '#d97706',
        borderRadius: 20
      },
      {
        id: 'recip_eom',
        type: 'recipient_name',
        name: 'Recipient Name',
        category: 'recipient',
        x: 50,
        y: 39,
        zIndex: 15,
        isVisible: true,
        content: '{{staff_name}}',
        fontSize: 38,
        fontWeight: 800,
        textColor: '#0f2338'
      },
      {
        id: 'meta_eom',
        type: 'recipient_meta',
        name: 'Role & Department',
        category: 'recipient',
        x: 50,
        y: 47,
        zIndex: 14,
        isVisible: true,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 13,
        textColor: '#0f2338'
      },
      {
        id: 'cit_eom',
        type: 'citation',
        name: 'Commendation Paragraph',
        category: 'content',
        x: 50,
        y: 60,
        width: '74%',
        zIndex: 13,
        isVisible: true,
        content: '{{citation_paragraph}}',
        fontSize: 13,
        textColor: '#334155'
      },
      {
        id: 'stamp_eom',
        type: 'digital_stamp',
        name: 'Official Stamp Seal',
        category: 'signatures',
        x: 84,
        y: 72,
        zIndex: 22,
        isVisible: true,
        content: 'OFFICIALLY APPROVED',
        subContent: 'BOARD OF DIRECTORS'
      },
      {
        id: 'sig_left_eom',
        type: 'signatory_left',
        name: 'Signatory 1',
        category: 'signatures',
        x: 25,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Director of Human Resources',
        subContent: 'Authorized Official',
        textColor: '#0f2338'
      },
      {
        id: 'sig_right_eom',
        type: 'signatory_right',
        name: 'Signatory 2',
        category: 'signatures',
        x: 75,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Managing Director',
        subContent: 'Authorized Official',
        textColor: '#0f2338'
      }
    ]
  },

  // 3. Executive Leadership & Governance
  {
    id: 'tpl_leadership',
    name: 'Executive Leadership Excellence',
    category: 'Leadership & VIP',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Dignified corporate layout featuring Roman laurel wreath and citation paragraph.',
    thumbnailBadge: 'LAUREL WREATH',
    settings: {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#f8fafc',
      borderStyle: 'double_border',
      borderColor: '#0f2338',
      accentColor: '#c4972a',
      primaryColor: '#0f2338',
      textColor: '#0f172a',
      showWatermark: true,
      watermarkOpacity: 0.05
    },
    elements: [
      {
        id: 'title_lead',
        type: 'certificate_title',
        name: 'Leadership Award Title',
        category: 'title',
        x: 50,
        y: 19,
        zIndex: 11,
        isVisible: true,
        content: 'LEADERSHIP EXCELLENCE AWARD',
        fontSize: 30,
        letterSpacing: 4,
        textColor: '#0f2338'
      },
      {
        id: 'pres_lead',
        type: 'presentation_text',
        name: 'Presentation Subtitle',
        category: 'title',
        x: 50,
        y: 27,
        zIndex: 12,
        isVisible: true,
        content: 'PRESENTED IN RECOGNITION OF DISTINGUISHED IMPACT',
        fontSize: 11,
        letterSpacing: 3,
        textColor: '#64748b'
      },
      {
        id: 'recip_lead',
        type: 'recipient_name',
        name: 'Recipient Name',
        category: 'recipient',
        x: 50,
        y: 38,
        zIndex: 15,
        isVisible: true,
        content: '{{staff_name}}',
        fontSize: 36,
        fontWeight: 800,
        textColor: '#0f2338'
      },
      {
        id: 'meta_lead',
        type: 'recipient_meta',
        name: 'Executive Role',
        category: 'recipient',
        x: 50,
        y: 46,
        zIndex: 14,
        isVisible: true,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 13,
        textColor: '#0f2338'
      },
      {
        id: 'cit_lead',
        type: 'citation',
        name: 'Leadership Citation',
        category: 'content',
        x: 50,
        y: 60,
        width: '75%',
        zIndex: 13,
        isVisible: true,
        content: '{{citation_paragraph}}',
        fontSize: 13.5
      },
      {
        id: 'laurel_lead',
        type: 'laurel_crest',
        name: 'Roman Laurel Wreath',
        category: 'badges',
        x: 50,
        y: 78,
        zIndex: 20,
        isVisible: true,
        content: 'EXECUTIVE MERIT'
      },
      {
        id: 'sig_left_lead',
        type: 'signatory_left',
        name: 'Operations Director',
        category: 'signatures',
        x: 20,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Director of Operations',
        subContent: 'Authorized Signatory'
      },
      {
        id: 'sig_right_lead',
        type: 'signatory_right',
        name: 'Managing Director',
        category: 'signatures',
        x: 80,
        y: 84,
        zIndex: 16,
        isVisible: true,
        content: 'Managing Director',
        subContent: 'Authorized Signatory'
      }
    ]
  },

  // 4. Safety & Service Hero
  {
    id: 'tpl_safety',
    name: 'Safety & Dedicated Service Distinction',
    category: 'Safety & Security',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Designed for staff service and safety honors with heraldic shield and verification code.',
    thumbnailBadge: 'SECURITY SHIELD',
    settings: {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      borderStyle: 'baroque_filigree',
      borderColor: '#1e3a8a',
      accentColor: '#c4972a',
      primaryColor: '#1e3a8a',
      textColor: '#0f172a',
      showWatermark: true,
      watermarkOpacity: 0.05
    },
    elements: [
      {
        id: 'title_safe',
        type: 'certificate_title',
        name: 'Award Title',
        category: 'title',
        x: 50,
        y: 22,
        zIndex: 11,
        isVisible: true,
        content: 'SERVICE & DEDICATION DISTINCTION',
        fontSize: 28,
        letterSpacing: 4,
        textColor: '#1e3a8a'
      },
      {
        id: 'pres_safe',
        type: 'presentation_text',
        name: 'Presentation Text',
        category: 'title',
        x: 50,
        y: 30,
        zIndex: 12,
        isVisible: true,
        content: 'HONORABLY PRESENTED TO',
        fontSize: 11,
        textColor: '#64748b'
      },
      {
        id: 'recip_safe',
        type: 'recipient_name',
        name: 'Recipient Name',
        category: 'recipient',
        x: 50,
        y: 41,
        zIndex: 15,
        isVisible: true,
        content: '{{staff_name}}',
        fontSize: 36,
        fontWeight: 800,
        textColor: '#1e3a8a'
      },
      {
        id: 'meta_safe',
        type: 'recipient_meta',
        name: 'Role & Department',
        category: 'recipient',
        x: 50,
        y: 50,
        zIndex: 14,
        isVisible: true,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 12.5,
        textColor: '#1e3a8a'
      },
      {
        id: 'cit_safe',
        type: 'citation',
        name: 'Safety Citation',
        category: 'content',
        x: 50,
        y: 63,
        width: '78%',
        zIndex: 13,
        isVisible: true,
        content: '{{citation_paragraph}}',
        fontSize: 13.5
      },
      {
        id: 'shield_safe',
        type: 'shield_medal',
        name: 'Heraldic Shield',
        category: 'badges',
        x: 50,
        y: 80,
        zIndex: 20,
        isVisible: true,
        content: 'EXCELLENCE'
      },
      {
        id: 'sig_safe_1',
        type: 'signatory_left',
        name: 'Department Head',
        category: 'signatures',
        x: 24,
        y: 85,
        zIndex: 16,
        isVisible: true,
        content: 'Department Head',
        subContent: 'Authorized Signature'
      },
      {
        id: 'sig_safe_2',
        type: 'signatory_right',
        name: 'General Director',
        category: 'signatures',
        x: 76,
        y: 85,
        zIndex: 16,
        isVisible: true,
        content: 'Executive Director',
        subContent: 'Authorized Signature'
      },
      {
        id: 'barcode_safe',
        type: 'barcode_strip',
        name: 'Barcode Strip',
        category: 'security',
        x: 90,
        y: 93,
        zIndex: 12,
        isVisible: true,
        content: '{{certificate_no}}'
      }
    ]
  },

  // 5. Arabesque Royal Calligraphy Diploma
  {
    id: 'tpl_arabesque',
    name: 'Royal Arabic Calligraphic Diploma',
    category: 'Milestone & Loyalty',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Rich heritage certificate with Bismillah calligraphy and Islamic arch gold styling with dynamic staff details.',
    thumbnailBadge: 'ARABIC DIPLOMA',
    settings: {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#fffdfa',
      borderStyle: 'baroque_filigree',
      borderColor: '#b45309',
      accentColor: '#c4972a',
      primaryColor: '#064e3b',
      textColor: '#0f172a',
      showWatermark: true,
      watermarkOpacity: 0.06
    },
    elements: [
      {
        id: 'bismillah',
        type: 'arabic_bismillah',
        name: 'Bismillah Header',
        category: 'title',
        x: 50,
        y: 13,
        zIndex: 10,
        isVisible: true,
        content: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        fontSize: 20
      },
      {
        id: 'title_arab',
        type: 'certificate_title',
        name: 'Title',
        category: 'title',
        x: 50,
        y: 25,
        zIndex: 11,
        isVisible: true,
        content: 'شَهَادَةُ شُكْرٍ وَتَقْدِيرٍ • CERTIFICATE OF HONOR',
        fontSize: 24,
        textColor: '#064e3b'
      },
      {
        id: 'recip_arab_en',
        type: 'recipient_name',
        name: 'Recipient Name',
        category: 'recipient',
        x: 50,
        y: 38,
        zIndex: 15,
        isVisible: true,
        content: '{{staff_name}}',
        fontSize: 34,
        textColor: '#064e3b'
      },
      {
        id: 'meta_arab',
        type: 'recipient_meta',
        name: 'Role & Department',
        category: 'recipient',
        x: 50,
        y: 47,
        zIndex: 14,
        isVisible: true,
        content: '{{staff_position}}',
        subContent: '{{staff_department}}',
        fontSize: 13,
        textColor: '#b45309'
      },
      {
        id: 'cit_arab',
        type: 'citation',
        name: 'Citation Paragraph',
        category: 'content',
        x: 50,
        y: 62,
        width: '80%',
        zIndex: 13,
        isVisible: true,
        content: '{{citation_paragraph}}'
      },
      {
        id: 'gold_seal_arab',
        type: 'gold_foil_seal',
        name: '24K Gold Seal',
        category: 'badges',
        x: 50,
        y: 80,
        zIndex: 20,
        isVisible: true,
        content: 'HONOR DIPLOMA'
      },
      {
        id: 'sig_arab_1',
        type: 'signatory_left',
        name: 'Signatory Left',
        category: 'signatures',
        x: 23,
        y: 85,
        zIndex: 16,
        isVisible: true,
        content: 'Assistant Director',
        subContent: 'Authorized Signature'
      },
      {
        id: 'sig_arab_2',
        type: 'signatory_right',
        name: 'Signatory Right',
        category: 'signatures',
        x: 77,
        y: 85,
        zIndex: 16,
        isVisible: true,
        content: 'General Manager',
        subContent: 'Authorized Signature'
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'elementor_saved_custom_templates';

export function getSavedCustomTemplates(): SavedCertificateTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        ...t,
        elements: Array.isArray(t.elements) ? t.elements : [],
        settings: t.settings || {
          orientation: 'landscape',
          width: 1000,
          height: 700,
          backgroundColor: '#ffffff',
          borderStyle: 'royal_frame',
          borderColor: '#c4972a',
          accentColor: '#c4972a',
          primaryColor: '#0f2338',
          textColor: '#0f172a',
          showWatermark: false,
          watermarkOpacity: 0.05
        }
      }));
  } catch (err) {
    console.error('Failed to parse saved custom certificate templates:', err);
    return [];
  }
}

export function saveCustomTemplate(
  template: Omit<SavedCertificateTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>
): SavedCertificateTemplate {
  const existing = getSavedCustomTemplates();
  const id = `cust_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newTemplate: SavedCertificateTemplate = {
    ...template,
    id,
    isCustom: true,
    createdAt: now,
    updatedAt: now
  };

  const updated = [newTemplate, ...existing];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elementor_templates_updated', { detail: { template: newTemplate, action: 'create' } }));
    }
  } catch (err) {
    console.error('Failed to persist custom template:', err);
  }

  // Also sync to server database asynchronously
  try {
    fetch('/api/certificates/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        thumbnailBadge: newTemplate.thumbnailBadge,
        elements: newTemplate.elements,
        settings: newTemplate.settings,
        backgroundImageUrl: '',
        isCustom: true
      })
    }).catch((e) => console.warn('Background template server sync error:', e));
  } catch (e) {
    // Non-blocking
  }

  return newTemplate;
}

/**
 * Updates an existing custom template in localStorage and syncs with server.
 * If the template was a prebuilt template (non-custom ID), this converts it into a new custom template with isCustom: true.
 */
export function updateCustomTemplate(
  id: string,
  updates: Partial<SavedCertificateTemplate> = {}
): SavedCertificateTemplate | null {
  const existing = getSavedCustomTemplates();
  const index = existing.findIndex((t) => t.id === id);

  if (index === -1) {
    // If not found in custom templates (e.g. user loaded a prebuilt template and wants to update it),
    // we save it as a new custom template
    const prebuiltMatch = PREBUILT_TEMPLATES.find((p) => p.id === id);
    const baseName = updates?.name || prebuiltMatch?.name || 'Custom Certificate Template';
    const cleanName = baseName.includes('(Custom)') ? baseName : `${baseName} (Custom)`;
    
    return saveCustomTemplate({
      name: cleanName,
      category: updates?.category || prebuiltMatch?.category || 'Custom',
      description: updates?.description || prebuiltMatch?.description || 'Custom certificate template design.',
      thumbnailBadge: updates?.thumbnailBadge || 'CUSTOM',
      settings: updates?.settings || prebuiltMatch?.settings || {
        orientation: 'landscape',
        width: 1000,
        height: 700,
        backgroundColor: '#ffffff',
        borderStyle: 'royal_frame',
        borderColor: '#c4972a',
        accentColor: '#c4972a',
        primaryColor: '#0f2338',
        textColor: '#0f172a',
        showWatermark: false,
        watermarkOpacity: 0.05
      },
      elements: updates?.elements || prebuiltMatch?.elements || []
    });
  }

  const now = new Date().toISOString();
  const updatedItem: SavedCertificateTemplate = {
    ...existing[index],
    ...updates,
    id: existing[index].id,
    elements: Array.isArray(updates?.elements) ? updates.elements : (existing[index].elements || []),
    settings: updates?.settings || existing[index].settings || {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      borderStyle: 'royal_frame',
      borderColor: '#c4972a',
      accentColor: '#c4972a',
      primaryColor: '#0f2338',
      textColor: '#0f172a',
      showWatermark: false,
      watermarkOpacity: 0.05
    },
    isCustom: true,
    updatedAt: now
  };

  existing[index] = updatedItem;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elementor_templates_updated', { detail: { template: updatedItem, action: 'update' } }));
    }
  } catch (err) {
    console.error('Failed to update custom template in localStorage:', err);
  }

  // Also sync update to server database asynchronously
  try {
    fetch(`/api/certificates/templates/${encodeURIComponent(updatedItem.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedItem.id,
        name: updatedItem.name,
        description: updatedItem.description,
        category: updatedItem.category,
        thumbnailBadge: updatedItem.thumbnailBadge,
        elements: updatedItem.elements || [],
        settings: updatedItem.settings,
        backgroundImageUrl: '',
        isCustom: true
      })
    }).catch((e) => console.warn('Background template update server sync error:', e));
  } catch (e) {
    // Non-blocking
  }

  return updatedItem;
}

export function saveOrUpdateCustomTemplate(
  template: Partial<SavedCertificateTemplate> & { name: string; elements?: BuilderElement[]; settings?: CanvasSettings }
): SavedCertificateTemplate {
  if (!template) {
    return saveCustomTemplate({
      name: 'Custom Certificate',
      category: 'Custom',
      description: 'Custom certificate template design',
      thumbnailBadge: 'CUSTOM',
      settings: {
        orientation: 'landscape',
        width: 1000,
        height: 700,
        backgroundColor: '#ffffff',
        borderStyle: 'royal_frame',
        borderColor: '#c4972a',
        accentColor: '#c4972a',
        primaryColor: '#0f2338',
        textColor: '#0f172a',
        showWatermark: false,
        watermarkOpacity: 0.05
      },
      elements: []
    });
  }

  if (template.id && template.isCustom) {
    const updated = updateCustomTemplate(template.id, template);
    if (updated) return updated;
  }
  return saveCustomTemplate({
    name: template.name || 'Custom Certificate',
    category: template.category || 'Custom',
    description: template.description || 'Custom certificate template design',
    thumbnailBadge: template.thumbnailBadge || 'CUSTOM',
    settings: template.settings || {
      orientation: 'landscape',
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      borderStyle: 'royal_frame',
      borderColor: '#c4972a',
      accentColor: '#c4972a',
      primaryColor: '#0f2338',
      textColor: '#0f172a',
      showWatermark: false,
      watermarkOpacity: 0.05
    },
    elements: Array.isArray(template.elements) ? template.elements : []
  });
}

export function deleteSavedCustomTemplate(id: string): boolean {
  try {
    const existing = getSavedCustomTemplates();
    const filtered = existing.filter((t) => t.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elementor_templates_updated', { detail: { id, action: 'delete' } }));
    }

    // Also delete from server
    fetch(`/api/certificates/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch((e) => console.warn('Server delete template error:', e));

    return true;
  } catch (err) {
    console.error('Failed to delete custom template:', err);
    return false;
  }
}

/**
 * Loads custom templates from server and merges with local custom templates
 */
export async function syncTemplatesWithBackend(): Promise<SavedCertificateTemplate[]> {
  try {
    const res = await fetch('/api/certificates/templates');
    if (!res.ok) return getSavedCustomTemplates();
    const data = await res.json();
    const serverTemplates = data.templates || [];
    const localTemplates = getSavedCustomTemplates();

    const mergedMap = new Map<string, SavedCertificateTemplate>();
    
    // Put local first
    localTemplates.forEach((tpl) => {
      if (tpl && tpl.id) mergedMap.set(tpl.id, tpl);
    });

    // Merge server templates that have elements
    serverTemplates.forEach((st: any) => {
      if (st && st.id && Array.isArray(st.elements) && st.elements.length > 0) {
        const converted: SavedCertificateTemplate = {
          id: st.id,
          name: st.name,
          description: st.description || '',
          category: st.category || 'Custom',
          thumbnailBadge: st.thumbnailBadge || 'SAVED',
          isCustom: true,
          elements: st.elements,
          settings: st.settings || {},
          createdAt: st.createdAt || new Date().toISOString(),
          updatedAt: st.updatedAt || new Date().toISOString()
        };
        mergedMap.set(st.id, converted);
      }
    });

    const finalMerged = Array.from(mergedMap.values());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalMerged));
    return finalMerged;
  } catch (e) {
    return getSavedCustomTemplates();
  }
}
