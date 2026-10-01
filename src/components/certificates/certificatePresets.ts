import { Certificate, CertificateTemplateType, CertificateBadgeStyle, CertificateBorderStyle, CertificateColors } from '../../types';

export interface CertificatePreset {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  categoryKey: string;
  badgeLabel: string;
  templateType: CertificateTemplateType;
  accentColor: string;
  primaryColor: string;
  description: string;
  bestSuitedFor: string;
  features: string[];
  defaultTitle: string;
  defaultPresentationText: string;
  defaultCitation: string;
  badgeStyle: CertificateBadgeStyle;
  badgeText: string;
  badgeSubtext: string;
  borderStyle: CertificateBorderStyle;
  signatoryLeftTitle: string;
  signatoryLeftName: string;
  signatoryRightTitle: string;
  signatoryRightName: string;
  signatoryCenterTitle?: string;
  signatoryCenterName?: string;
  enableThirdSignatory?: boolean;
  fontFamily: 'Playfair Display' | 'Cinzel' | 'Plus Jakarta Sans';
  colors: CertificateColors;
  hotelStaffNumber?: number;
}

/**
 * 25 Comprehensive Hotel Staff Certificate Presets
 * Fully customizable and tailored to modern 5-star hotel departments & achievements.
 */
export const HOTEL_STAFF_CERTIFICATE_PRESETS: CertificatePreset[] = [
  // 1. Certificate of Appreciation
  {
    id: 'hotel-staff-1',
    hotelStaffNumber: 1,
    name: '1. Certificate of Appreciation',
    subtitle: 'Classic 5-Star Hotel Honors for Valuable Contribution',
    category: 'Recognition & Appreciation',
    categoryKey: 'appreciation',
    badgeLabel: '24K Embossed Gold Seal',
    templateType: 'appreciation',
    accentColor: '#c4972a',
    primaryColor: '#0f2338',
    description: 'Timeless luxury navy blue with 24K gold foil trim, ornate corner filigree, and a 24K embossed gold seal.',
    bestSuitedFor: 'Special contributions, project completions, event support, and high-praise hotel operations.',
    features: ['24K Gold Filigree Border', 'Embossed Royal Seal', 'Dual Executive Signatures', 'Archival Parchment Tone'],
    defaultTitle: 'CERTIFICATE OF APPRECIATION',
    defaultPresentationText: 'THIS CERTIFICATE IS PROUDLY PRESENTED WITH GRATITUDE TO',
    defaultCitation: 'In sincere recognition and profound appreciation of your exceptional dedication, outstanding contributions, and high standards of service excellence that elevate the prestige and hospitality of our hotel.',
    badgeStyle: 'gold_seal',
    badgeText: 'WARWICK APPRECIATION',
    badgeSubtext: '5-STAR SERVICE',
    borderStyle: 'ornate_gold',
    signatoryLeftTitle: 'Human Resources Director',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#0f2338',
      accent: '#c4972a',
      border: '#c4972a',
      background: '#ffffff',
      text: '#0f172a'
    }
  },

  // 2. Employee of the Month Certificate
  {
    id: 'hotel-staff-2',
    hotelStaffNumber: 2,
    name: '2. Employee of the Month Certificate',
    subtitle: 'Signature 5-Star Hotel Monthly Achievement Award',
    category: 'Monthly & Annual Awards',
    categoryKey: 'monthly',
    badgeLabel: 'Pleated Rosette Ribbon',
    templateType: 'employee_of_month',
    accentColor: '#c59b27',
    primaryColor: '#0b1b2d',
    description: 'Neoclassical layout with deep royal navy waves, 24K gold foil trim, and a high-relief pleated rosette medal.',
    bestSuitedFor: 'Monthly star performer across any hotel department with exceptional metrics and attendance.',
    features: ['24K Gold Symmetrical Waves', 'High-Relief Pleated Rosette Ribbon', 'Dual Executive Signatures', 'Filigree Trim'],
    defaultTitle: 'EMPLOYEE OF THE MONTH',
    defaultPresentationText: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
    defaultCitation: 'In high esteem and official recognition of outstanding dedication, exceptional work ethic, and distinguished service excellence that exemplifies the true spirit of 5-star luxury hospitality.',
    badgeStyle: 'rosette',
    badgeText: 'SEAL OF EXCELLENCE',
    badgeSubtext: 'WARWICK HOTELS',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Department Head',
    signatoryLeftName: 'Operations Director',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#0b1b2d',
      accent: '#c59b27',
      border: '#c59b27',
      background: '#ffffff',
      text: '#0f172a'
    }
  },

  // 3. Employee of the Year Certificate
  {
    id: 'hotel-staff-3',
    hotelStaffNumber: 3,
    name: '3. Employee of the Year Certificate',
    subtitle: 'Highest Annual Distinction for Excellence & Leadership',
    category: 'Monthly & Annual Awards',
    categoryKey: 'monthly',
    badgeLabel: 'Imperial Laurel Crest',
    templateType: 'star_leadership',
    accentColor: '#f59e0b',
    primaryColor: '#1e1b4b',
    description: 'Imperial indigo and rich amber gold accents honoring the overall hotel champion of the year with 3 executive endorsements.',
    bestSuitedFor: 'The top performing staff member of the entire year across all hotel divisions.',
    features: ['Imperial Indigo Canvas', '3 Executive Endorsements', 'Imperial Laurel Crest', 'Supreme Honor Distinction'],
    defaultTitle: 'EMPLOYEE OF THE YEAR',
    defaultPresentationText: 'THE SUPREME ANNUAL DISTINCTION IS CONFERRED UPON',
    defaultCitation: 'Conferred with our highest honor in celebration of extraordinary commitment, peerless hospitality standards, and transformative contributions that inspired the entire hotel throughout the year.',
    badgeStyle: 'laurel_crest',
    badgeText: 'ANNUAL DISTINCTION',
    badgeSubtext: 'CHAMPION OF THE YEAR',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'HR Director',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryCenterTitle: 'Director of Operations',
    signatoryCenterName: 'Tariq Al-Mansoor',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    enableThirdSignatory: true,
    fontFamily: 'Cinzel',
    colors: {
      primary: '#1e1b4b',
      accent: '#f59e0b',
      border: '#f59e0b',
      background: '#fafaff',
      text: '#111827'
    }
  },

  // 4. Certificate of Recognition
  {
    id: 'hotel-staff-4',
    hotelStaffNumber: 4,
    name: '4. Certificate of Recognition',
    subtitle: 'Acknowledging Professional Excellence & Hospitality Dedication',
    category: 'Recognition & Appreciation',
    categoryKey: 'appreciation',
    badgeLabel: 'Star Medallion of Merit',
    templateType: 'appreciation',
    accentColor: '#d97706',
    primaryColor: '#0f172a',
    description: 'Clean, authoritative slate and warm golden medallion recognizing special service achievements.',
    bestSuitedFor: 'Formal acknowledgment of key milestones, guest commendations, and cross-team assistance.',
    features: ['Slate & Warm Gold Frame', 'Star Medallion', 'High Readability Typography', 'Official Seal'],
    defaultTitle: 'CERTIFICATE OF RECOGNITION',
    defaultPresentationText: 'THIS OFFICIAL RECOGNITION IS BESTOWED UPON',
    defaultCitation: 'In sincere acknowledgment of your steadfast loyalty, exceptional professionalism, and remarkable efforts that have significantly elevated our guest satisfaction and departmental standards.',
    badgeStyle: 'star_medallion',
    badgeText: 'OFFICIAL RECOGNITION',
    badgeSubtext: 'MERIT & DEDICATION',
    borderStyle: 'double_border',
    signatoryLeftTitle: 'Operations Manager',
    signatoryLeftName: 'Robert Sterling',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#0f172a',
      accent: '#d97706',
      border: '#d97706',
      background: '#ffffff',
      text: '#0f172a'
    }
  },

  // 5. Certificate of Excellence
  {
    id: 'hotel-staff-5',
    hotelStaffNumber: 5,
    name: '5. Certificate of Excellence',
    subtitle: 'Benchmarking the Pinnacle of Luxury Hospitality Standards',
    category: 'Excellence & Quality',
    categoryKey: 'excellence',
    badgeLabel: '24K Gold Luxury Seal',
    templateType: 'star_mastery',
    accentColor: '#eab308',
    primaryColor: '#064e3b',
    description: 'Deep emerald green and luminous 24K gold honoring flawless execution of 5-star brand standards.',
    bestSuitedFor: 'Staff who continuously achieve 100% mystery shopper ratings or zero-defect service scores.',
    features: ['Sovereign Emerald Aesthetic', '24K Gold Seal', 'Mastery Watermark', 'Executive Signatures'],
    defaultTitle: 'CERTIFICATE OF EXCELLENCE',
    defaultPresentationText: 'AWARDED IN COMMENDATION OF SUPERIOR MASTERY TO',
    defaultCitation: 'Awarded in commendation of consistent superior performance, unyielding attention to detail, and maintaining the flawless luxury standards expected of our 5-star hotel.',
    badgeStyle: 'gold_seal',
    badgeText: 'HOTEL EXCELLENCE',
    badgeSubtext: 'PINNACLE AWARD',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Quality Assurance Director',
    signatoryLeftName: 'David Chen',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#064e3b',
      accent: '#eab308',
      border: '#eab308',
      background: '#fbfdfc',
      text: '#062e24'
    }
  },

  // 6. Outstanding Performance Award
  {
    id: 'hotel-staff-6',
    hotelStaffNumber: 6,
    name: '6. Outstanding Performance Award',
    subtitle: 'For Exceeding Operational Targets & Service Benchmarks',
    category: 'Excellence & Quality',
    categoryKey: 'excellence',
    badgeLabel: 'Star Medallion',
    templateType: 'star_leadership',
    accentColor: '#eab308',
    primaryColor: '#1e3a8a',
    description: 'Vibrant sapphire blue and gold laurels recognizing staff who exceed KPIs and deliver standout results.',
    bestSuitedFor: 'Sales achievements, record turnaround times, and high volume operational shifts.',
    features: ['Sapphire Blue Luxe', 'Star Medallion', 'High-Performance Citation', 'Dual Endorsements'],
    defaultTitle: 'OUTSTANDING PERFORMANCE AWARD',
    defaultPresentationText: 'PROUDLY CONFERRED IN RECOGNITION OF HIGH PERFORMANCE TO',
    defaultCitation: 'Honoring superior initiative, exceptional efficiency, and an unwavering drive to exceed departmental targets and deliver memorable experiences to every guest.',
    badgeStyle: 'star_medallion',
    badgeText: 'OUTSTANDING MERIT',
    badgeSubtext: 'TOP PERFORMANCE',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Department Director',
    signatoryLeftName: 'Karim Al-Husseini',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#1e3a8a',
      accent: '#eab308',
      border: '#eab308',
      background: '#f8faff',
      text: '#0f172a'
    }
  },

  // 7. Teamwork Excellence Certificate
  {
    id: 'hotel-staff-7',
    hotelStaffNumber: 7,
    name: '7. Teamwork Excellence Certificate',
    subtitle: 'Celebrating Harmony, Collaboration & Collective Success',
    category: 'Excellence & Quality',
    categoryKey: 'excellence',
    badgeLabel: 'Rosette Ribbon of Unity',
    templateType: 'appreciation',
    accentColor: '#f59e0b',
    primaryColor: '#312e81',
    description: 'Deep royal violet and warm gold celebrating cross-departmental synergy and supportive teamwork.',
    bestSuitedFor: 'Staff members who support colleagues, resolve shift bottlenecks, and promote team unity.',
    features: ['Royal Violet & Gold Accents', 'Unity Rosette Ribbon', 'Teamwork Citation', 'Department Head Signature'],
    defaultTitle: 'TEAMWORK EXCELLENCE CERTIFICATE',
    defaultPresentationText: 'AWARDED WITH DEEP APPRECIATION FOR TEAM SYNERGY TO',
    defaultCitation: 'Awarded for exceptional camaraderie, selfless cross-departmental assistance, and fostering an inspiring team spirit that elevates the entire hotel staff family.',
    badgeStyle: 'rosette',
    badgeText: 'TEAM EXCELLENCE',
    badgeSubtext: 'UNITY & HARMONY',
    borderStyle: 'ornate_gold',
    signatoryLeftTitle: 'Team Supervisor',
    signatoryLeftName: 'Nadia Mansoor',
    signatoryRightTitle: 'HR Director',
    signatoryRightName: 'Mona Al-Shehri',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#312e81',
      accent: '#f59e0b',
      border: '#f59e0b',
      background: '#faf9ff',
      text: '#1e1b4b'
    }
  },

  // 8. Guest Service Excellence Certificate
  {
    id: 'hotel-staff-8',
    hotelStaffNumber: 8,
    name: '8. Guest Service Excellence Certificate',
    subtitle: 'Heart of Hospitality • Memorable Guest Experience Award',
    category: 'Hospitality & Front of House',
    categoryKey: 'hospitality',
    badgeLabel: 'Guest Delight Medallion',
    templateType: 'star_hospitality',
    accentColor: '#e5a970',
    primaryColor: '#4b1222',
    description: 'Burgundy crimson and rose gold arches celebrating empathy, warmth, and memorable guest interactions.',
    bestSuitedFor: 'Front desk, concierge, guest relations, butlers, and restaurant servers receiving direct guest praise.',
    features: ['Burgundy Crimson & Rose Gold', 'Curved Hospitality Arches', 'Guest Delight Medallion', 'Heartfelt Care Text'],
    defaultTitle: 'GUEST SERVICE EXCELLENCE',
    defaultPresentationText: 'PRESENTED IN RECOGNITION OF EXEMPLARY SERVICE TO',
    defaultCitation: 'In celebration of warm, heartfelt guest interactions, positive guest commendations, and crafting unforgettable luxury moments that make guests feel truly cherished.',
    badgeStyle: 'star_medallion',
    badgeText: 'GUEST DELIGHT',
    badgeSubtext: 'HOSPITALITY HERO',
    borderStyle: 'double_border',
    signatoryLeftTitle: 'Front Office Director',
    signatoryLeftName: 'Tariq Al-Mansoor',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#4b1222',
      accent: '#e5a970',
      border: '#e5a970',
      background: '#fdfbfb',
      text: '#2d0b14'
    }
  },

  // 9. Best Department Award
  {
    id: 'hotel-staff-9',
    hotelStaffNumber: 9,
    name: '9. Best Department Award',
    subtitle: 'Departmental Distinction for Operational Synergy & High Standards',
    category: 'Departmental Awards',
    categoryKey: 'departmental',
    badgeLabel: 'Imperial Departmental Crest',
    templateType: 'star_leadership',
    accentColor: '#ca8a04',
    primaryColor: '#1e293b',
    description: 'Prestigious corporate obsidian and burnished gold honoring the top performing department of the quarter.',
    bestSuitedFor: 'Recognizing an entire department team (Housekeeping, F&B, Front Office, Engineering, Security).',
    features: ['Obsidian & 24K Gold', 'Imperial Departmental Crest', '3 Executive Signatories', 'Quarterly Distinction'],
    defaultTitle: 'BEST DEPARTMENT AWARD',
    defaultPresentationText: 'CONFERRED WITH PRIDE & HIGH REGARD UPON THE TEAM OF',
    defaultCitation: 'Conferred upon the department team in recognition of unmatched cohesion, exceptional audit ratings, and upholding operational excellence across all hotel shifts.',
    badgeStyle: 'laurel_crest',
    badgeText: 'BEST DEPARTMENT',
    badgeSubtext: 'TOP DIVISION',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Director of Operations',
    signatoryLeftName: 'Robert Sterling',
    signatoryCenterTitle: 'Financial Controller',
    signatoryCenterName: 'Ayman Qasim',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    enableThirdSignatory: true,
    fontFamily: 'Cinzel',
    colors: {
      primary: '#1e293b',
      accent: '#ca8a04',
      border: '#ca8a04',
      background: '#fcfcfd',
      text: '#0f172a'
    }
  },

  // 10. Housekeeping Excellence Certificate
  {
    id: 'hotel-staff-10',
    hotelStaffNumber: 10,
    name: '10. Housekeeping Excellence Certificate',
    subtitle: 'Immaculate Standards • Guest Comfort & Hygiene Champion',
    category: 'Departmental Awards',
    categoryKey: 'departmental',
    badgeLabel: 'Purity Gold Seal',
    templateType: 'appreciation',
    accentColor: '#eab308',
    primaryColor: '#14532d',
    description: 'Deep forest emerald and sparkling gold honoring flawless room inspection scores and guest comfort.',
    bestSuitedFor: 'Room attendants, linen coordinators, floor supervisors, and public area sanitization champions.',
    features: ['Forest Emerald & Gold Trim', 'Purity Gold Seal', 'Flawless Hygiene Citation', 'Executive Housekeeper Sign'],
    defaultTitle: 'HOUSEKEEPING EXCELLENCE CERTIFICATE',
    defaultPresentationText: 'AWARDED FOR IMPECCABLE LUXURY STANDARDS TO',
    defaultCitation: 'In heartfelt appreciation of pristine room preparation, flawless attention to detail, and maintaining impeccable luxury cleanliness that forms the foundation of our guest trust.',
    badgeStyle: 'gold_seal',
    badgeText: 'IMMACULATE STANDARD',
    badgeSubtext: 'HOUSEKEEPING HERO',
    borderStyle: 'ornate_gold',
    signatoryLeftTitle: 'Executive Housekeeper',
    signatoryLeftName: 'Fatima Al-Harbi',
    signatoryRightTitle: 'Director of Rooms',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#14532d',
      accent: '#eab308',
      border: '#eab308',
      background: '#fcfdfc',
      text: '#0f2918'
    }
  },

  // 11. Maintenance Excellence Certificate
  {
    id: 'hotel-staff-11',
    hotelStaffNumber: 11,
    name: '11. Maintenance Excellence Certificate',
    subtitle: 'Engineering Precision • Facility Reliability & Rapid Response',
    category: 'Departmental Awards',
    categoryKey: 'departmental',
    badgeLabel: 'Engineering Medallion',
    templateType: 'appreciation',
    accentColor: '#d97706',
    primaryColor: '#1c1917',
    description: 'Warm charcoal graphite and copper gold honoring technical mastery and rapid preventive repairs.',
    bestSuitedFor: 'Electricians, HVAC technicians, plumbers, audiovisual staff, and general maintenance specialists.',
    features: ['Graphite & Warm Amber Gold', 'Engineering Medallion', 'Rapid Response Citation', 'Chief Engineer Sign'],
    defaultTitle: 'MAINTENANCE EXCELLENCE CERTIFICATE',
    defaultPresentationText: 'PRESENTED IN RECOGNITION OF TECHNICAL PRECISION TO',
    defaultCitation: 'Recognizing outstanding technical skill, proactive maintenance diligence, and prompt resolution of engineering requests that ensure seamless 24/7 hotel operations.',
    badgeStyle: 'star_medallion',
    badgeText: 'TECHNICAL MASTERY',
    badgeSubtext: 'ENGINEERING & FACILITY',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Chief Engineer',
    signatoryLeftName: 'Eng. Khaled Al-Ghamdi',
    signatoryRightTitle: 'Director of Operations',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      primary: '#1c1917',
      accent: '#d97706',
      border: '#d97706',
      background: '#ffffff',
      text: '#1c1917'
    }
  },

  // 12. Food & Beverage Excellence Certificate
  {
    id: 'hotel-staff-12',
    hotelStaffNumber: 12,
    name: '12. Food & Beverage Excellence Certificate',
    subtitle: 'Culinary & Banquet Distinction • Epicurean Delight Award',
    category: 'Departmental Awards',
    categoryKey: 'departmental',
    badgeLabel: 'Epicurean Rosette Ribbon',
    templateType: 'employee_of_month',
    accentColor: '#eab308',
    primaryColor: '#581c87',
    description: 'Imperial royal plum and golden crown honoring culinary artistry, banquet speed, and restaurant service.',
    bestSuitedFor: 'Chefs, line cooks, baristas, bartenders, banquet captains, and restaurant waitstaff.',
    features: ['Imperial Plum & Gold Frame', 'Epicurean Rosette Ribbon', 'Gastronomy Distinction', 'Executive Chef Sign'],
    defaultTitle: 'FOOD & BEVERAGE EXCELLENCE',
    defaultPresentationText: 'AWARDED IN TRIBUTE TO CULINARY & SERVICE PASSION TO',
    defaultCitation: 'Honoring superior culinary flair, immaculate banquet execution, and courteous dining service that leaves an indelible impression on our restaurant and banquet guests.',
    badgeStyle: 'rosette',
    badgeText: 'EPICUREAN DISTINCTION',
    badgeSubtext: 'CULINARY & SERVICE',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Executive Chef / F&B Director',
    signatoryLeftName: 'Chef Marco Bellini',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#581c87',
      accent: '#eab308',
      border: '#eab308',
      background: '#faf7fc',
      text: '#2e1065'
    }
  },

  // 13. Safe Driving & Service Certificate
  {
    id: 'hotel-staff-13',
    hotelStaffNumber: 13,
    name: '13. Safe Driving & Service Certificate',
    subtitle: 'Concierge Fleet & Chauffeur Safety Distinction',
    category: 'Operations & Safety',
    categoryKey: 'safety',
    badgeLabel: 'Gold Safety Seal',
    templateType: 'appreciation',
    accentColor: '#38bdf8',
    primaryColor: '#0f172a',
    description: 'Midnight navy and luminous sky blue trim honoring accident-free VIP chauffeur and valet service.',
    bestSuitedFor: 'Hotel chauffeurs, VIP airport transfer drivers, valet parking attendants, and golf cart operators.',
    features: ['Midnight Blue & Azure Trim', 'Accident-Free Citation', 'Gold Safety Seal', 'Transport Manager Sign'],
    defaultTitle: 'SAFE DRIVING & SERVICE CERTIFICATE',
    defaultPresentationText: 'PRESENTED IN RECOGNITION OF SAFE FLEET OPERATIONS TO',
    defaultCitation: 'Awarded for an exemplary accident-free driving record, gracious chauffeur courtesy, and safe, punctual transportation of VIP hotel guests and airport transfers.',
    badgeStyle: 'gold_seal',
    badgeText: 'SAFE FLEET OPERATOR',
    badgeSubtext: 'ZERO ACCIDENTS',
    borderStyle: 'double_border',
    signatoryLeftTitle: 'Fleet & Transport Manager',
    signatoryLeftName: 'Zubair Al-Otaibi',
    signatoryRightTitle: 'Director of Loss Prevention',
    signatoryRightName: 'Col. Fahad Al-Bishi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#0f172a',
      accent: '#38bdf8',
      border: '#38bdf8',
      background: '#ffffff',
      text: '#0f172a'
    }
  },

  // 14. Perfect Attendance Certificate
  {
    id: 'hotel-staff-14',
    hotelStaffNumber: 14,
    name: '14. Perfect Attendance Certificate',
    subtitle: 'Unwavering Reliability & Flawless Punctuality Honor',
    category: 'Milestones & Reliability',
    categoryKey: 'milestone',
    badgeLabel: 'Reliability Laurel Crest',
    templateType: 'star_milestone',
    accentColor: '#d97706',
    primaryColor: '#115e59',
    description: 'Prestige teal and antique gold celebrating 100% attendance, zero tardiness, and dependable duty.',
    bestSuitedFor: 'Staff with zero absences, on-time shift clock-ins over 3 months, 6 months, or a full calendar year.',
    features: ['Prestige Teal & Antique Gold', 'Guilloche Geometry', 'Reliability Laurel Crest', '100% Attendance Citation'],
    defaultTitle: 'PERFECT ATTENDANCE CERTIFICATE',
    defaultPresentationText: 'THIS SPECIAL COMMENDATION FOR RELIABILITY IS AWARDED TO',
    defaultCitation: 'In recognition of 100% attendance, zero tardiness, and steadfast dependability, demonstrating an inspirational commitment to daily hotel duty and team support.',
    badgeStyle: 'laurel_crest',
    badgeText: 'PERFECT ATTENDANCE',
    badgeSubtext: '100% RELIABILITY',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Human Resources Manager',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#115e59',
      accent: '#d97706',
      border: '#d97706',
      background: '#fafdfd',
      text: '#042f2e'
    }
  },

  // 15. Safety & Security Awareness Certificate
  {
    id: 'hotel-staff-15',
    hotelStaffNumber: 15,
    name: '15. Safety & Security Awareness Certificate',
    subtitle: 'Guardian of Guest Safety, Asset Protection & Vigilance',
    category: 'Operations & Safety',
    categoryKey: 'safety',
    badgeLabel: 'Guardian Star Medallion',
    templateType: 'appreciation',
    accentColor: '#f59e0b',
    primaryColor: '#0b132b',
    description: 'Deep security obsidian and bronze gold honoring proactive surveillance, fire safety, and asset vigilance.',
    bestSuitedFor: 'Security officers, CCTV operators, life safety marshals, and staff who prevented safety hazards.',
    features: ['Security Obsidian & Bronze Gold', 'Guardian Star Medallion', 'Life Safety Citation', 'Security Director Sign'],
    defaultTitle: 'SAFETY & SECURITY AWARENESS',
    defaultPresentationText: 'AWARDED FOR EXEMPLARY VIGILANCE & LIFE SAFETY TO',
    defaultCitation: 'Presented in recognition of proactive vigilance, rapid emergency response readiness, and safeguarding hotel guests, staff, and property with uncompromising professionalism.',
    badgeStyle: 'star_medallion',
    badgeText: 'GUARDIAN OF SAFETY',
    badgeSubtext: 'LOSS PREVENTION',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Director of Loss Prevention',
    signatoryLeftName: 'Col. Fahad Al-Bishi',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      primary: '#0b132b',
      accent: '#f59e0b',
      border: '#f59e0b',
      background: '#ffffff',
      text: '#0b132b'
    }
  },

  // 16. Training Completion Certificate
  {
    id: 'hotel-staff-16',
    hotelStaffNumber: 16,
    name: '16. Training Completion Certificate',
    subtitle: 'Professional Skills Development & Qualification Achievement',
    category: 'Training & Development',
    categoryKey: 'training',
    badgeLabel: 'Academic Gold Seal',
    templateType: 'star_mastery',
    accentColor: '#a855f7',
    primaryColor: '#1e1b4b',
    description: 'Midnight indigo and amethyst violet honoring the completion of professional hospitality workshops.',
    bestSuitedFor: 'New hire onboarding, brand luxury standards, food safety certifications, and language courses.',
    features: ['Academic Indigo & Amethyst Violet', '24K Gold Seal', 'Curriculum Completion Text', 'Learning Director Sign'],
    defaultTitle: 'TRAINING COMPLETION CERTIFICATE',
    defaultPresentationText: 'OFFICIALLY CERTIFIES THAT THE NOMINEE HAS COMPLETED',
    defaultCitation: 'Certifying the successful mastery and comprehensive completion of specialized hotel operational training, guest service protocols, and luxury brand standards.',
    badgeStyle: 'gold_seal',
    badgeText: 'COURSE ACCREDITED',
    badgeSubtext: 'PROFESSIONAL SKILLS',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Learning & Development Manager',
    signatoryLeftName: 'Sarah Jenkins',
    signatoryRightTitle: 'Human Resources Director',
    signatoryRightName: 'Mona Al-Shehri',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#1e1b4b',
      accent: '#a855f7',
      border: '#a855f7',
      background: '#fcfbfe',
      text: '#1e1b4b'
    }
  },

  // 17. Certificate of Participation
  {
    id: 'hotel-staff-17',
    hotelStaffNumber: 17,
    name: '17. Certificate of Participation',
    subtitle: 'Active Engagement & Professional Development Contribution',
    category: 'Training & Development',
    categoryKey: 'training',
    badgeLabel: 'Participation Rosette Ribbon',
    templateType: 'appreciation',
    accentColor: '#10b981',
    primaryColor: '#1e293b',
    description: 'Clean modern slate and emerald green honoring active engagement in hotel workshops and seminars.',
    bestSuitedFor: 'Seminar attendees, hotel wellness challenges, fire drill exercises, and team building camps.',
    features: ['Slate & Emerald Modern Styling', 'Participation Rosette Ribbon', 'Engagement Citation', 'Facilitator Sign'],
    defaultTitle: 'CERTIFICATE OF PARTICIPATION',
    defaultPresentationText: 'GRATEFULLY PRESENTED IN RECOGNITION OF ACTIVE PARTICIPATION TO',
    defaultCitation: 'Conferred in appreciation for active participation, passionate contribution, and valuable involvement in our hotel development workshops and corporate initiatives.',
    badgeStyle: 'rosette',
    badgeText: 'PARTICIPATION HONORS',
    badgeSubtext: 'HOTEL WORKSHOP',
    borderStyle: 'double_border',
    signatoryLeftTitle: 'Program Facilitator',
    signatoryLeftName: 'Nasser Al-Ghamdi',
    signatoryRightTitle: 'Department Head',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#1e293b',
      accent: '#10b981',
      border: '#10b981',
      background: '#ffffff',
      text: '#1e293b'
    }
  },

  // 18. Best New Employee Certificate
  {
    id: 'hotel-staff-18',
    hotelStaffNumber: 18,
    name: '18. Best New Employee Certificate',
    subtitle: 'Rising Star Award • Exceptional First Impression & Rapid Adaptation',
    category: 'Recognition & Appreciation',
    categoryKey: 'appreciation',
    badgeLabel: 'Rising Star Medallion',
    templateType: 'employee_of_month',
    accentColor: '#fbbf24',
    primaryColor: '#1d4ed8',
    description: 'Bright electric royal blue and shimmering gold honoring the most promising rookie hire of the quarter.',
    bestSuitedFor: 'Employees in their first 3 to 6 months of employment who showed remarkable initiative and learning.',
    features: ['Electric Royal Blue & Gold Trim', 'Rising Star Medallion', 'Rookie Excellence Citation', 'General Manager Sign'],
    defaultTitle: 'BEST NEW EMPLOYEE CERTIFICATE',
    defaultPresentationText: 'THE RISING STAR DISTINCTION IS PROUDLY BESTOWED UPON',
    defaultCitation: 'Welcoming our newest rising talent who demonstrated rapid adaptation, enthusiasm, and outstanding performance from day one, winning the admiration of peers and guests alike.',
    badgeStyle: 'star_medallion',
    badgeText: 'RISING STAR',
    badgeSubtext: 'ROOKIE OF THE YEAR',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Department Head',
    signatoryLeftName: 'Operations Director',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#1d4ed8',
      accent: '#fbbf24',
      border: '#fbbf24',
      background: '#ffffff',
      text: '#0f172a'
    }
  },

  // 19. Innovation & Improvement Award
  {
    id: 'hotel-staff-19',
    hotelStaffNumber: 19,
    name: '19. Innovation & Improvement Award',
    subtitle: 'Pioneering Solutions • Process Enhancement & Creative Thinking',
    category: 'Excellence & Quality',
    categoryKey: 'excellence',
    badgeLabel: 'Innovation Laurel Crest',
    templateType: 'star_leadership',
    accentColor: '#2dd4bf',
    primaryColor: '#042f2e',
    description: 'Deep cypress green and luminous aquamarine gold honoring innovative ideas that saved time or costs.',
    bestSuitedFor: 'Staff who proposed smart workflows, green sustainability ideas, software automation, or guest perks.',
    features: ['Cypress Green & Aquamarine', 'Innovation Laurel Crest', 'Progressive Solutions Citation', 'Director of Ops Sign'],
    defaultTitle: 'INNOVATION & IMPROVEMENT AWARD',
    defaultPresentationText: 'PRESENTED IN CELEBRATION OF CREATIVE VISION & INITIATIVE TO',
    defaultCitation: 'In admiration of innovative thinking, creative problem solving, and introducing progressive ideas that enhanced guest comfort, sustainability, and hotel operational efficiency.',
    badgeStyle: 'laurel_crest',
    badgeText: 'INNOVATION HONORS',
    badgeSubtext: 'CREATIVE EXCELLENCE',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Director of Innovation & Ops',
    signatoryLeftName: 'Robert Sterling',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#042f2e',
      accent: '#2dd4bf',
      border: '#2dd4bf',
      background: '#f8fdfc',
      text: '#042f2e'
    }
  },

  // 20. Certificate of Service
  {
    id: 'hotel-staff-20',
    hotelStaffNumber: 20,
    name: '20. Certificate of Service',
    subtitle: 'Honoring Dedicated Service, Integrity & Professionalism',
    category: 'Milestones & Reliability',
    categoryKey: 'milestone',
    badgeLabel: 'Official Service Seal',
    templateType: 'appreciation',
    accentColor: '#d4af37',
    primaryColor: '#18181b',
    description: 'Classic executive noir with antique metallic gold recognizing honorable service across tenure.',
    bestSuitedFor: 'Formal record of service rendered upon project milestones, contract completions, or transfers.',
    features: ['Classic Executive Noir & Gold', 'Official Service Seal', 'Formal Verification Citation', 'HR & GM Endorsement'],
    defaultTitle: 'CERTIFICATE OF SERVICE',
    defaultPresentationText: 'THIS ATTESTATION OF SERVICE IS GRATEFULLY PRESENTED TO',
    defaultCitation: 'Presented in grateful recognition of valuable service rendered with integrity, skill, and loyalty throughout your tenure with our hotel family.',
    badgeStyle: 'gold_seal',
    badgeText: 'OFFICIAL SERVICE',
    badgeSubtext: 'WARWICK HOTELS',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Human Resources Director',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#18181b',
      accent: '#d4af37',
      border: '#d4af37',
      background: '#ffffff',
      text: '#18181b'
    }
  },

  // 21. Farewell Certificate
  {
    id: 'hotel-staff-21',
    hotelStaffNumber: 21,
    name: '21. Farewell Certificate',
    subtitle: 'With Fond Gratitude & Best Wishes for Your Next Chapter',
    category: 'Recognition & Appreciation',
    categoryKey: 'appreciation',
    badgeLabel: 'Warm Tribute Rosette',
    templateType: 'appreciation',
    accentColor: '#f59e0b',
    primaryColor: '#27272a',
    description: 'Warm charcoal zinc and soft golden glow celebrating fond memories and wishing future success.',
    bestSuitedFor: 'Departing colleagues, relocating managers, and long-term staff transitioning to new adventures.',
    features: ['Warm Charcoal & Golden Glow', 'Tribute Rosette Ribbon', 'Heartfelt Farewell Message', 'Colleagues & GM Endorsement'],
    defaultTitle: 'FAREWELL CERTIFICATE',
    defaultPresentationText: 'WITH AFFECTIONATE REGARD & SINCERE BEST WISHES TO',
    defaultCitation: 'Expressing our deepest gratitude for your enduring dedication, cherished memories, and positive mark left upon our hotel team. We wish you immense success in all future endeavors.',
    badgeStyle: 'rosette',
    badgeText: 'FOND TRIBUTE',
    badgeSubtext: 'BEST WISHES',
    borderStyle: 'ornate_gold',
    signatoryLeftTitle: 'Department Head',
    signatoryLeftName: 'Operations Director',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#27272a',
      accent: '#f59e0b',
      border: '#f59e0b',
      background: '#fffdf9',
      text: '#27272a'
    }
  },

  // 22. Long Service Award
  {
    id: 'hotel-staff-22',
    hotelStaffNumber: 22,
    name: '22. Long Service Award',
    subtitle: 'Milestone of Loyalty, Fidelity & Enduring Career Dedication',
    category: 'Milestones & Reliability',
    categoryKey: 'milestone',
    badgeLabel: 'Imperial Milestone Crest',
    templateType: 'star_milestone',
    accentColor: '#eab308',
    primaryColor: '#3f1515',
    description: 'Regal mahogany crimson and 24K gold foil celebrating 5, 10, 15, or 20 years of loyal hotel career service.',
    bestSuitedFor: 'Veteran employees reaching 3, 5, 10, 15, or 20+ years of dedicated service.',
    features: ['Regal Mahogany & 24K Gold', 'Imperial Milestone Crest', 'Guilloche Border Frame', 'Chairman / GM Signatures'],
    defaultTitle: 'LONG SERVICE AWARD',
    defaultPresentationText: 'CONFERRED IN SOLEMN CELEBRATION OF CAREER TENURE UPON',
    defaultCitation: 'Conferred in solemn celebration of years of steadfast dedication, loyalty, and exceptional service that have shaped the heritage and success of our 5-star hotel.',
    badgeStyle: 'laurel_crest',
    badgeText: 'LOYALTY & FIDELITY',
    badgeSubtext: 'CAREER MILESTONE',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Human Resources Director',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Cinzel',
    colors: {
      primary: '#3f1515',
      accent: '#eab308',
      border: '#eab308',
      background: '#fffbfb',
      text: '#2e0f0f'
    }
  },

  // 23. Leadership Excellence Certificate
  {
    id: 'hotel-staff-23',
    hotelStaffNumber: 23,
    name: '23. Leadership Excellence Certificate',
    subtitle: 'Visionary Guidance, Mentorship & Departmental Inspiration',
    category: 'Leadership & Management',
    categoryKey: 'leadership',
    badgeLabel: 'Executive Distinction Crest',
    templateType: 'star_leadership',
    accentColor: '#d4af37',
    primaryColor: '#073e2a',
    description: 'Sovereign emerald and burnished gold with 3 executive endorsements celebrating inspirational leaders.',
    bestSuitedFor: 'Supervisors, assistant managers, department heads, and duty managers.',
    features: ['Sovereign Emerald Canvas', '3 Executive Endorsements', 'Imperial Leadership Shield', 'Mentorship Citation'],
    defaultTitle: 'LEADERSHIP EXCELLENCE CERTIFICATE',
    defaultPresentationText: 'THIS PRESTIGIOUS HONORS IS CONFERRED UPON',
    defaultCitation: 'Awarded in high honor of exemplary leadership, inspiring mentorship, and cultivating high-performance teams that set the standard for 5-star hotel hospitality.',
    badgeStyle: 'laurel_crest',
    badgeText: 'EXECUTIVE DISTINCTION',
    badgeSubtext: 'VISIONARY LEADERSHIP',
    borderStyle: 'geometric_gold',
    signatoryLeftTitle: 'Operations Director',
    signatoryLeftName: 'Robert Sterling',
    signatoryCenterTitle: 'Director of HR',
    signatoryCenterName: 'Mona Al-Shehri',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    enableThirdSignatory: true,
    fontFamily: 'Cinzel',
    colors: {
      primary: '#073e2a',
      accent: '#d4af37',
      border: '#d4af37',
      background: '#fbfdfc',
      text: '#062a1c'
    }
  },

  // 24. Customer Care Excellence Certificate
  {
    id: 'hotel-staff-24',
    hotelStaffNumber: 24,
    name: '24. Customer Care Excellence Certificate',
    subtitle: 'Empathy, Attentiveness & Genuine Guest Satisfaction',
    category: 'Hospitality & Front of House',
    categoryKey: 'hospitality',
    badgeLabel: 'Customer Care Medallion',
    templateType: 'star_hospitality',
    accentColor: '#fbbf24',
    primaryColor: '#4a044e',
    description: 'Rich royal burgundy wine and warm champagne gold honoring empathy and personalized guest care.',
    bestSuitedFor: 'Guest experience hosts, VIP concierges, telephone operators, reservation agents, and call center stars.',
    features: ['Burgundy Wine & Champagne Gold', 'Customer Care Medallion', 'Personalized Empathy Citation', 'Guest Relations Sign'],
    defaultTitle: 'CUSTOMER CARE EXCELLENCE',
    defaultPresentationText: 'AWARDED FOR EXTRAORDINARY CARE & ATTENTIVENESS TO',
    defaultCitation: 'Honoring unparalleled empathy, prompt resolution of guest needs, and a warm attitude that transforms ordinary hotel stays into extraordinary cherished memories.',
    badgeStyle: 'star_medallion',
    badgeText: 'CUSTOMER CARE HERO',
    badgeSubtext: 'EMPATHY & SERVICE',
    borderStyle: 'double_border',
    signatoryLeftTitle: 'Guest Relations Manager',
    signatoryLeftName: 'Layla Al-Amoudi',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    fontFamily: 'Playfair Display',
    colors: {
      primary: '#4a044e',
      accent: '#fbbf24',
      border: '#fbbf24',
      background: '#fefcfd',
      text: '#3b073e'
    }
  },

  // 25. Most Dedicated Employee Award
  {
    id: 'hotel-staff-25',
    hotelStaffNumber: 25,
    name: '25. Most Dedicated Employee Award',
    subtitle: 'Exemplary Passion, Selfless Commitment & Heart of Warwick',
    category: 'Monthly & Annual Awards',
    categoryKey: 'monthly',
    badgeLabel: 'Imperial Dedication Crest',
    templateType: 'star_leadership',
    accentColor: '#eab308',
    primaryColor: '#172554',
    description: 'Deep royal blue and brilliant 24K gold crest honoring tireless devotion and going the extra mile.',
    bestSuitedFor: 'Staff members who consistently volunteer for overtime, emergencies, and holiday shifts with a smile.',
    features: ['Deep Royal Blue & 24K Gold', 'Imperial Dedication Crest', 'Selfless Commitment Citation', 'GM & Board Endorsement'],
    defaultTitle: 'MOST DEDICATED EMPLOYEE AWARD',
    defaultPresentationText: 'AWARDED IN PROFOUND GRATITUDE & RECOGNITION TO',
    defaultCitation: 'In heartfelt tribute to your tireless devotion, going the extra mile without hesitation, and embodying the soul and hospitality of our 5-star hotel every single day.',
    badgeStyle: 'laurel_crest',
    badgeText: 'TIRELESS DEVOTION',
    badgeSubtext: 'HEART OF WARWICK',
    borderStyle: 'royal_frame',
    signatoryLeftTitle: 'Human Resources Director',
    signatoryLeftName: 'Mona Al-Shehri',
    signatoryCenterTitle: 'Operations Director',
    signatoryCenterName: 'Robert Sterling',
    signatoryRightTitle: 'General Manager',
    signatoryRightName: 'Dr. Faisal Al-Ghamdi',
    enableThirdSignatory: true,
    fontFamily: 'Cinzel',
    colors: {
      primary: '#172554',
      accent: '#eab308',
      border: '#eab308',
      background: '#f8faff',
      text: '#0f172a'
    }
  }
];

// Combine with legacy presets so existing presets continue to resolve without issue
export const FIVE_STAR_CERTIFICATE_PRESETS: CertificatePreset[] = [
  ...HOTEL_STAFF_CERTIFICATE_PRESETS
];

export function createCertificateFromPreset(
  preset: CertificatePreset,
  recipientInfo?: {
    name?: string;
    position?: string;
    department?: string;
    staffId?: string;
  },
  hotelBranding?: {
    hotelName?: string;
    hotelSubtitle?: string;
    hotelLogoUrl?: string;
  }
): Partial<Certificate> {
  const currentMonthYear = new Date().toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    template: preset.templateType,
    title: preset.defaultTitle,
    presentationText: preset.defaultPresentationText,
    recipientName: recipientInfo?.name || 'Ahmed Al-Zahrani',
    recipientPosition: recipientInfo?.position || 'Guest Service Specialist',
    recipientDepartment: recipientInfo?.department || 'Front Office',
    recipientStaffId: recipientInfo?.staffId,
    awardPeriod: currentMonthYear,
    awardDate: todayFormatted,
    location: 'Al Baha, Saudi Arabia',
    citationText: preset.defaultCitation,
    citationAlignment: 'center',
    fontFamily: preset.fontFamily,
    hotelName: hotelBranding?.hotelName || 'WARWICK',
    hotelSubtitle: hotelBranding?.hotelSubtitle || 'HOTEL AL BAHA • HOTELS & RESORTS',
    hotelLogoUrl: hotelBranding?.hotelLogoUrl,
    hotelLogoPreset: 'warwick_crest',
    hotelLogoSize: 50,
    showHotelLogo: true,
    showFiveStars: true,
    badgeStyle: preset.badgeStyle,
    badgeText: preset.badgeText,
    badgeSubtext: preset.badgeSubtext,
    borderStyle: preset.borderStyle,
    signatoryLeftTitle: preset.signatoryLeftTitle,
    signatoryLeftName: preset.signatoryLeftName,
    signatoryRightTitle: preset.signatoryRightTitle,
    signatoryRightName: preset.signatoryRightName,
    signatoryCenterTitle: preset.signatoryCenterTitle,
    signatoryCenterName: preset.signatoryCenterName,
    showSignatory3: preset.enableThirdSignatory,
    customColors: preset.colors,
    textMode: 'full'
  };
}
