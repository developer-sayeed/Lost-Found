import { LostItem, StaffMember } from '../../../../types';

export type DateRangeFilter = 'last7' | 'last14' | 'last30' | 'last60' | 'last90' | 'all';
export type MetricViewMode = 'stacked' | 'total' | 'logged' | 'handover';

export interface StaffPerformanceStats {
  staff: StaffMember;
  staffName: string;
  staffId: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
  itemsLogged: number;
  itemsHandedOver: number;
  itemsDispatched: number;
  totalProcessed: number;
  totalOperations: number;
  processedItems: LostItem[];
  resolutionRate: number;
  lastActivityDate: string | null;
  processingShare: number;
}

export const DEPT_COLORS: Record<string, string> = {
  Housekeeping: '#6366f1',
  Receptionist: '#0ea5e9',
  'Front Desk': '#0284c7',
  Security: '#10b981',
  'Food & Beverage': '#f59e0b',
  Maintenance: '#8b5cf6',
  Manager: '#ec4899',
  Other: '#64748b'
};

export const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#84cc16', // Lime
  '#d946ef'  // Fuchsia
];
