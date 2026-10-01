import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  Package,
  HeartHandshake,
  Clock,
  Calendar,
  Filter,
  Search,
  Download,
  Printer,
  ChevronRight,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  BarChart3,
  Layers,
  Shield,
  Eye,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LostItem, StaffMember } from '../types';
import { Badge } from './Badge';
import { StaffPerformancePrintModal } from './modals/StaffPerformancePrintModal';

type DateRangeFilter = 'last7' | 'last14' | 'last30' | 'last60' | 'last90' | 'all';
type MetricViewMode = 'stacked' | 'total' | 'logged' | 'handover';

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

const DEPT_COLORS: Record<string, string> = {
  Housekeeping: '#6366f1',
  Receptionist: '#0ea5e9',
  'Front Desk': '#0284c7',
  Security: '#10b981',
  'Food & Beverage': '#f59e0b',
  Maintenance: '#8b5cf6',
  Manager: '#ec4899',
  Other: '#64748b'
};

const CHART_COLORS = [
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

export const StaffPerformanceView: React.FC = () => {
  const { items, staff, openItemDetails, openStaffProfile, settings } = useApp();
  const { user } = useAuth();
  const { t, isRTL, translateRole } = useLanguage();

  // Department Processing Share chart toggle (Default: hidden unless enabled in settings)
  const showDepartmentProcessingShare = Boolean(settings?.showDepartmentProcessingShare);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangeFilter>('last30');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metricViewMode, setMetricViewMode] = useState<MetricViewMode>('stacked');
  const [sortField, setSortField] = useState<'totalProcessed' | 'itemsLogged' | 'itemsHandedOver' | 'name'>('totalProcessed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drilldown Modal for selected staff member
  const [inspectingStaff, setInspectingStaff] = useState<StaffPerformanceStats | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');
  const [drilldownStatusFilter, setDrilldownStatusFilter] = useState<string>('All');

  // Executive Performance Audit Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedStaffForPrint, setSelectedStaffForPrint] = useState<StaffPerformanceStats | null>(null);

  const handleOpenPrintModal = (specificStaff?: StaffPerformanceStats) => {
    setSelectedStaffForPrint(specificStaff || null);
    setIsPrintModalOpen(true);
  };

  // Calculate Date Threshold in milliseconds
  const dateThreshold = useMemo(() => {
    const now = Date.now();
    const daysMap: Record<DateRangeFilter, number> = {
      last7: 7,
      last14: 14,
      last30: 30,
      last60: 60,
      last90: 90,
      all: 3650
    };
    return now - daysMap[dateRange] * 24 * 60 * 60 * 1000;
  }, [dateRange]);

  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case 'last7': return 'Last 7 Days';
      case 'last14': return 'Last 14 Days';
      case 'last30': return 'Last 30 Days';
      case 'last60': return 'Last 60 Days';
      case 'last90': return 'Last 90 Days';
      case 'all': return 'All Time';
    }
  }, [dateRange]);

  // Helper to check if date falls in selected range
  const isWithinDateRange = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    try {
      const time = new Date(dateStr).getTime();
      return !isNaN(time) && time >= dateThreshold;
    } catch {
      return false;
    }
  };

  // Compute staff performance data
  const { staffStatsList, totalProcessedOverall, totalLoggedOverall, totalHandedOverOverall, totalDispatchedOverall } = useMemo(() => {
    let globalLogged = 0;
    let globalHandedOver = 0;
    let globalDispatched = 0;

    // Filter items within the active date window
    const windowItems = items.filter(item => {
      const foundInWindow = isWithinDateRange(item.dateFound) || isWithinDateRange(item.createdAt);
      const handoverInWindow = item.handoverDetails && isWithinDateRange(item.handoverDetails.handoverDate);
      const dispatchInWindow = item.dispatchDetails && isWithinDateRange(item.dispatchDetails.dispatchedDate || item.dispatchDetails.dispatchedAt);
      
      // Also check timeline events
      const timelineInWindow = item.timeline?.some(ev => isWithinDateRange(ev.timestamp));

      return foundInWindow || handoverInWindow || dispatchInWindow || timelineInWindow;
    });

    const statsMap = new Map<string, StaffPerformanceStats>();

    // Initialize all registered staff members in the stats map
    staff.forEach(s => {
      const key = s.id || s.userId || s.name;
      statsMap.set(key, {
        staff: s,
        staffName: s.name,
        staffId: s.userId || (s as any).staffId || `STF-${s.serial || 1}`,
        email: s.email,
        department: s.department || 'Housekeeping',
        role: s.role || 'Employee',
        avatar: s.avatar,
        itemsLogged: 0,
        itemsHandedOver: 0,
        itemsDispatched: 0,
        totalProcessed: 0,
        totalOperations: 0,
        processedItems: [],
        resolutionRate: 0,
        lastActivityDate: null,
        processingShare: 0
      });
    });

    // Helper to find matching staff entry in map
    const findStaffEntry = (nameOrEmailOrId?: string): StaffPerformanceStats | undefined => {
      if (!nameOrEmailOrId) return undefined;
      const target = (nameOrEmailOrId || '').toLowerCase().trim();
      for (const [_, entry] of statsMap.entries()) {
        const name = (entry.staffName || '').toLowerCase().trim();
        const email = (entry.email || '').toLowerCase().trim();
        const id = (entry.staffId || '').toLowerCase().trim();
        if (
          name === target ||
          email === target ||
          id === target ||
          (name.length > 3 && target.includes(name)) ||
          (target.length > 3 && name.includes(target))
        ) {
          return entry;
        }
      }
      return undefined;
    };

    // Analyze each item in the date window
    windowItems.forEach(item => {
      const itemProcessedStaffSet = new Set<string>();

      // 1. Check Item Logging / Finding
      const isLoggedInRange = isWithinDateRange(item.dateFound) || isWithinDateRange(item.createdAt);
      if (isLoggedInRange) {
        globalLogged++;
        const finderOrLogger = item.employeeName || item.recordedBy || item.loggedBy || item.submittedByStaffName || item.foundBy;
        const entry = findStaffEntry(finderOrLogger);
        if (entry) {
          entry.itemsLogged++;
          entry.totalOperations++;
          itemProcessedStaffSet.add(entry.staff.id);
          
          const itemDate = item.dateFound || item.createdAt;
          if (!entry.lastActivityDate || new Date(itemDate).getTime() > new Date(entry.lastActivityDate).getTime()) {
            entry.lastActivityDate = itemDate;
          }
        }
      }

      // 2. Check Guest Handover
      if (item.handoverDetails && isWithinDateRange(item.handoverDetails.handoverDate)) {
        globalHandedOver++;
        const handoverOfficer = item.handoverDetails.handedOverBy;
        const entry = findStaffEntry(handoverOfficer);
        if (entry) {
          entry.itemsHandedOver++;
          entry.totalOperations++;
          itemProcessedStaffSet.add(entry.staff.id);

          const hDate = item.handoverDetails.handoverDate;
          if (!entry.lastActivityDate || new Date(hDate).getTime() > new Date(entry.lastActivityDate).getTime()) {
            entry.lastActivityDate = hDate;
          }
        }
      }

      // 3. Check Dispatch
      if (item.dispatchDetails && isWithinDateRange(item.dispatchDetails.dispatchedDate || item.dispatchDetails.dispatchedAt)) {
        globalDispatched++;
        const dispatchOfficer = item.dispatchDetails.dispatchedBy;
        const entry = findStaffEntry(dispatchOfficer);
        if (entry) {
          entry.itemsDispatched++;
          entry.totalOperations++;
          itemProcessedStaffSet.add(entry.staff.id);

          const dDate = item.dispatchDetails.dispatchedDate || item.dispatchDetails.dispatchedAt || '';
          if (dDate && (!entry.lastActivityDate || new Date(dDate).getTime() > new Date(entry.lastActivityDate).getTime())) {
            entry.lastActivityDate = dDate;
          }
        }
      }

      // Add item to processedItems list of each involved staff member
      itemProcessedStaffSet.forEach(staffId => {
        const entry = statsMap.get(staffId);
        if (entry && !entry.processedItems.some(it => it.id === item.id)) {
          entry.processedItems.push(item);
        }
      });
    });

    const totalProcessedGlobal = globalLogged + globalHandedOver + globalDispatched;

    // Calculate totalProcessed, resolution rates, and share
    const list = Array.from(statsMap.values()).map(entry => {
      entry.totalProcessed = entry.itemsLogged + entry.itemsHandedOver + entry.itemsDispatched;
      entry.resolutionRate = entry.itemsLogged > 0
        ? Math.min(100, Math.round(((entry.itemsHandedOver + entry.itemsDispatched) / entry.itemsLogged) * 100))
        : entry.itemsHandedOver > 0 ? 100 : 0;
      entry.processingShare = totalProcessedGlobal > 0
        ? Math.round((entry.totalProcessed / totalProcessedGlobal) * 100)
        : 0;
      return entry;
    });

    return {
      staffStatsList: list,
      totalProcessedOverall: totalProcessedGlobal,
      totalLoggedOverall: globalLogged,
      totalHandedOverOverall: globalHandedOver,
      totalDispatchedOverall: globalDispatched
    };
  }, [items, staff, dateThreshold]);

  // Filter and sort the staff stats
  const filteredStaffStats = useMemo(() => {
    let result = staffStatsList.filter(s => {
      const matchDept = selectedDept === 'All' || s.department === selectedDept;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        Boolean(s.staffName && s.staffName.toLowerCase().includes(q)) ||
        Boolean(s.email && s.email.toLowerCase().includes(q)) ||
        Boolean(s.staffId && s.staffId.toLowerCase().includes(q)) ||
        Boolean(s.department && s.department.toLowerCase().includes(q)) ||
        Boolean(s.role && s.role.toLowerCase().includes(q));

      return matchDept && matchSearch;
    });

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'name') {
        valA = (a.staffName || '').toLowerCase();
        valB = (b.staffName || '').toLowerCase();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [staffStatsList, selectedDept, searchQuery, sortField, sortOrder]);

  // Top Performer / MVP
  const topPerformer = useMemo(() => {
    const sorted = [...staffStatsList].sort((a, b) => b.totalProcessed - a.totalProcessed);
    return sorted[0]?.totalProcessed > 0 ? sorted[0] : null;
  }, [staffStatsList]);

  // Active staff count (staff who processed at least 1 item in the time window)
  const activeStaffCount = useMemo(() => {
    return staffStatsList.filter(s => s.totalProcessed > 0).length;
  }, [staffStatsList]);

  // Chart Data 1: Staff Volume Bar Chart (Top 10 staff by processed count)
  const staffChartData = useMemo(() => {
    return [...filteredStaffStats]
      .sort((a, b) => b.totalProcessed - a.totalProcessed)
      .slice(0, 10)
      .map(s => ({
        name: s.staffName.split(' ')[0] || s.staffName,
        fullName: s.staffName,
        department: s.department,
        Logged: s.itemsLogged,
        HandedOver: s.itemsHandedOver,
        Dispatched: s.itemsDispatched,
        Total: s.totalProcessed
      }));
  }, [filteredStaffStats]);

  // Chart Data 2: Daily Activity Trend (30 Days Day-by-Day intake vs handovers)
  const dailyActivityData = useMemo(() => {
    const daysMap = new Map<string, { date: string; displayDate: string; logged: number; handovers: number; total: number }>();
    const numDays = dateRange === 'last7' ? 7 : dateRange === 'last14' ? 14 : dateRange === 'last60' ? 60 : dateRange === 'last90' ? 90 : 30;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      daysMap.set(dateKey, { date: dateKey, displayDate, logged: 0, handovers: 0, total: 0 });
    }

    items.forEach(it => {
      const foundDate = (it.dateFound || it.createdAt || '').split('T')[0];
      if (daysMap.has(foundDate)) {
        const rec = daysMap.get(foundDate)!;
        rec.logged++;
        rec.total++;
      }

      if (it.handoverDetails?.handoverDate) {
        const hDate = it.handoverDetails.handoverDate.split('T')[0];
        if (daysMap.has(hDate)) {
          const rec = daysMap.get(hDate)!;
          rec.handovers++;
          rec.total++;
        }
      }
    });

    return Array.from(daysMap.values());
  }, [items, dateRange]);

  // Chart Data 3: Department Contribution Donut Chart
  const departmentChartData = useMemo(() => {
    const deptMap = new Map<string, number>();
    staffStatsList.forEach(s => {
      const dept = s.department || 'Other';
      deptMap.set(dept, (deptMap.get(dept) || 0) + s.totalProcessed);
    });

    return Array.from(deptMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: DEPT_COLORS[name] || '#6366f1'
      }));
  }, [staffStatsList]);

  // Chart Data 4: Category Processing Breakdown
  const categoryProcessingData = useMemo(() => {
    const catMap = new Map<string, number>();
    items.forEach(it => {
      const inWindow = isWithinDateRange(it.dateFound) || isWithinDateRange(it.createdAt) || (it.handoverDetails && isWithinDateRange(it.handoverDetails.handoverDate));
      if (inWindow) {
        const cat = it.category || 'General';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      }
    });

    return Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [items, dateThreshold]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      { 'Metric': 'Report Name', 'Value': `Staff Performance Audit (${dateRangeLabel})` },
      { 'Metric': 'Generated At', 'Value': new Date().toLocaleString() },
      { 'Metric': 'Total Registered Staff', 'Value': staff.length },
      { 'Metric': 'Active Processors', 'Value': activeStaffCount },
      { 'Metric': 'Total Items Processed', 'Value': totalProcessedOverall },
      { 'Metric': 'Items Logged / Found', 'Value': totalLoggedOverall },
      { 'Metric': 'Items Handed Over to Guests', 'Value': totalHandedOverOverall },
      { 'Metric': 'Items Dispatched / Returned', 'Value': totalDispatchedOverall },
      { 'Metric': 'Top Performer', 'Value': topPerformer ? `${topPerformer.staffName} (${topPerformer.totalProcessed} items)` : 'N/A' }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Performance Summary');

    // 2. Staff Leaderboard Sheet
    const staffData = filteredStaffStats.map((s, idx) => ({
      'Rank': idx + 1,
      'Staff Name': s.staffName,
      'Staff ID': s.staffId,
      'Email': s.email,
      'Department': s.department,
      'Role': s.role,
      'Items Logged': s.itemsLogged,
      'Guest Handovers': s.itemsHandedOver,
      'Finder Dispatches': s.itemsDispatched,
      'Total Items Processed': s.totalProcessed,
      'Resolution Rate %': `${s.resolutionRate}%`,
      'Hotel Processing Share %': `${s.processingShare}%`,
      'Last Activity Date': s.lastActivityDate ? new Date(s.lastActivityDate).toLocaleDateString() : 'No recent activity'
    }));
    const staffSheet = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(workbook, staffSheet, 'Staff Throughput');

    XLSX.writeFile(workbook, `Warwick_Staff_Performance_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Robust Executive Performance Audit Report HTML Generator
  const generatePerformancePrintReport = () => {
    const hotelName = settings?.hotelName || 'Warwick Hotels & Resorts';
    const hotelArabic = settings?.hotelArabicName || 'ورويك الباحة';
    const hotelSub = settings?.hotelSubTitle || 'Hotels and Resorts';
    const logoUrl = settings?.logoUrl || '';
    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const avgProcessedPerActiveStaff = activeStaffCount > 0 ? (totalProcessedOverall / activeStaffCount).toFixed(1) : '0.0';

    const rowsHtml = filteredStaffStats.map((s, idx) => {
      const handoverRate = s.totalProcessed > 0 ? Math.round((s.itemsHandedOver / s.totalProcessed) * 100) : 0;
      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: center; width: 40px;">#${idx + 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${s.staffName}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #475569; font-size: 11px;">${s.staffId || 'N/A'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${s.department}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${s.role}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #4f46e5; font-weight: bold;">${s.itemsLogged}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: bold;">${s.itemsHandedOver}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #0284c7; font-weight: bold;">${s.itemsDispatched}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; font-size: 13px; color: #0f172a; background: #f8fafc;">${s.totalProcessed}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${handoverRate >= 50 ? '#16a34a' : '#d97706'};">${handoverRate}%</td>
        </tr>
      `;
    }).join('');

    const deptRowsHtml = departmentChartData.map(d => {
      const pct = totalProcessedOverall > 0 ? Math.round((d.value / totalProcessedOverall) * 100) : 0;
      return `
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 4px;">
          <span style="font-weight: 600; color: #334155;">${d.name}</span>
          <span style="font-weight: bold; color: #0f172a;">${d.value} items (${pct}%)</span>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Staff Processing Performance Audit - ${hotelName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 14mm 16mm 14mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .kpi-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .kpi-box {
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
          }
          .kpi-title {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 20px;
          }
          table.data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sign-box {
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 10px;
            text-align: center;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              ${logoUrl ? `<img src="${logoUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin-bottom: 4px;" /><br/>` : ''}
              <span style="font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">${hotelName}</span><br/>
              <span style="font-size: 11px; color: #475569; font-weight: 500;">${hotelArabic} &bull; ${hotelSub}</span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; background: #e0e7ff; color: #3730a3; font-weight: 800; font-size: 11px; text-transform: uppercase;">
                SUPERVISOR AUDIT REPORT
              </span><br/>
              <span style="font-size: 10px; color: #64748b; margin-top: 4px; display: inline-block;">
                Generated: <strong>${dateFormatted}</strong><br/>
                Auditor: <strong>${user?.name || 'Administrator'}</strong>
              </span>
            </td>
          </tr>
        </table>

        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div>
            <h2 style="font-size: 14px; font-weight: 800; margin: 0; color: #0f172a; text-transform: uppercase;">
              Staff Lost & Found Processing Performance Audit
            </h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
              Audit Filter Window: <strong>${dateRangeLabel}</strong> &bull; Department Scope: <strong>${selectedDept}</strong>
            </p>
          </div>
          <div style="font-size: 10px; color: #475569; text-align: right;">
            Total Evaluated Staff: <strong>${filteredStaffStats.length}</strong> &bull; Active Contributors: <strong>${activeStaffCount}</strong>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-box">
            <div class="kpi-title">Total Processed</div>
            <div class="kpi-value" style="color: #4f46e5;">${totalProcessedOverall}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Items Logged</div>
            <div class="kpi-value" style="color: #0f172a;">${totalLoggedOverall}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Handed Over</div>
            <div class="kpi-value" style="color: #16a34a;">${totalHandedOverOverall}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Dispatched</div>
            <div class="kpi-value" style="color: #0284c7;">${totalDispatchedOverall}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Avg per Active Staff</div>
            <div class="kpi-value" style="color: #7c3aed;">${avgProcessedPerActiveStaff}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">Rank</th>
              <th>Staff Member</th>
              <th>Staff ID</th>
              <th>Department</th>
              <th>Role</th>
              <th style="text-align: center;">Logged</th>
              <th style="text-align: center;">Handed Over</th>
              <th style="text-align: center;">Dispatched</th>
              <th style="text-align: center; background: #1e293b;">Total Items</th>
              <th style="text-align: center;">Success %</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #94a3b8;">No staff records available for the selected filters.</td></tr>'}
          </tbody>
        </table>

        ${departmentChartData.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">Department Throughput Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              ${deptRowsHtml}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px;">
          <div class="sign-box">
            <div style="height: 35px;"></div>
            <strong>Prepared By:</strong><br/>
            ${user?.name || 'Duty Staff / Auditor'}<br/>
            <span style="color: #64748b;">${user?.role || 'Auditor'}</span>
          </div>
          <div class="sign-box">
            <div style="height: 35px;"></div>
            <strong>Department Head / Supervisor:</strong><br/>
            Verified Signature & Date
          </div>
          <div class="sign-box">
            <div style="height: 35px;"></div>
            <strong>General Manager Approval:</strong><br/>
            Official Stamp & Seal
          </div>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
          This is an official confidential Lost & Found system audit document generated from Warwick Hotels & Resorts Management Portal.
        </div>
      </body>
      </html>
    `;
  };

  // Print Report Handler (Dynamic Executive Audit Modal)
  const handlePrint = (specificStaff?: StaffPerformanceStats) => {
    handleOpenPrintModal(specificStaff);
  };

  // Drilldown modal filtered items
  const drilldownFilteredItems = useMemo(() => {
    if (!inspectingStaff) return [];
    return inspectingStaff.processedItems.filter(item => {
      const matchStatus = drilldownStatusFilter === 'All' || item.status === drilldownStatusFilter;
      const q = drilldownSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        Boolean(item.code && item.code.toLowerCase().includes(q)) ||
        Boolean(item.itemName && item.itemName.toLowerCase().includes(q)) ||
        Boolean(item.category && item.category.toLowerCase().includes(q)) ||
        Boolean(item.locationFound && item.locationFound.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [inspectingStaff, drilldownSearch, drilldownStatusFilter]);

  const departmentsList = ['All', 'Housekeeping', 'Receptionist', 'Front Desk', 'Security', 'Food & Beverage', 'Maintenance', 'Manager'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in" id="supervisor-performance-view">
      {/* Top Header & Supervisor Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>Staff Processing Performance</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Supervisor Dashboard
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Staff throughput, items logged, guest returns, and department efficiency metrics over the {(dateRangeLabel || '').toLowerCase()}.
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(['last7', 'last14', 'last30', 'last90'] as DateRangeFilter[]).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  dateRange === range
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'last7' ? '7D' : range === 'last14' ? '14D' : range === 'last30' ? '30D' : '90D'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            id="btn-export-performance-excel"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Excel Worksheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint()}
            id="btn-print-performance-report"
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs group"
            title="Print Official Performance Audit Report"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Items Processed */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Processed
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalProcessedOverall}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="font-semibold text-indigo-600">{totalLoggedOverall} logged</span>
            <span>•</span>
            <span className="font-semibold text-emerald-600">{totalHandedOverOverall} returns</span>
          </div>
        </div>

        {/* 2. Top Performer (MVP) */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Top Contributor</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900">
              🥇 #1
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 truncate">
            {topPerformer ? topPerformer.staffName : 'No activity yet'}
          </div>
          <div className="text-[11px] text-amber-900 font-semibold truncate">
            {topPerformer ? `${topPerformer.totalProcessed} items (${topPerformer.department})` : 'Awaiting records'}
          </div>
        </div>

        {/* 3. Active Processors Rate */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Processors
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {activeStaffCount} <span className="text-sm font-semibold text-slate-400">/ {staff.length}</span>
          </div>
          <div className="text-[11px] text-sky-600 font-semibold">
            {staff.length > 0 ? Math.round((activeStaffCount / staff.length) * 100) : 0}% team participation
          </div>
        </div>

        {/* 4. Guest Returns / Handovers */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Guest Handovers
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalHandedOverOverall}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            {totalLoggedOverall > 0 ? Math.round((totalHandedOverOverall / totalLoggedOverall) * 100) : 0}% guest return rate
          </div>
        </div>

        {/* 5. Average Output per Staff */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Throughput
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {activeStaffCount > 0 ? (totalProcessedOverall / activeStaffCount).toFixed(1) : '0.0'}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold">
            Items processed per active staff
          </div>
        </div>
      </div>

      {/* Interactive Visual Charts Grid */}
      <div className={`grid grid-cols-1 ${showDepartmentProcessingShare ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Chart 1: Staff Member Items Processed Bar Chart */}
        <div className={`${showDepartmentProcessingShare ? 'lg:col-span-2' : 'w-full'} p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Items Processed by Staff Member ({dateRangeLabel})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Staff throughput ranking showing items logged, returned to guests, and dispatched.
              </p>
            </div>

            {/* Mode switch */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMetricViewMode('stacked')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metricViewMode === 'stacked' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Stacked Breakdown
              </button>
              <button
                type="button"
                onClick={() => setMetricViewMode('total')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metricViewMode === 'total' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Total Only
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {staffChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 z-50">
                            <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex justify-between gap-3">
                              <span>{d.fullName}</span>
                              <span className="text-slate-400 font-normal">{d.department}</span>
                            </div>
                            <div className="space-y-1 text-slate-300">
                              <div className="flex justify-between gap-4">
                                <span className="text-indigo-400">Items Logged:</span>
                                <span className="font-bold text-white">{d.Logged}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-emerald-400">Guest Handovers:</span>
                                <span className="font-bold text-white">{d.HandedOver}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-amber-400">Dispatches:</span>
                                <span className="font-bold text-white">{d.Dispatched}</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold">
                                <span>Total Processed:</span>
                                <span className="text-indigo-300">{d.Total} items</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {metricViewMode === 'stacked' ? (
                    <>
                      <Legend verticalAlign="top" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Logged" name="Items Logged" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="HandedOver" name="Guest Handovers" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Dispatched" name="Dispatches" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="Total" name="Total Items Processed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <span>No staff processing activity recorded in this date range.</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Department Share Donut Chart (Admin Toggleable, hidden by default) */}
        {showDepartmentProcessingShare && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-600" />
                <span>Department Processing Share</span>
              </h3>
              <p className="text-xs text-slate-500">
                Contribution by hotel operational division.
              </p>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              {departmentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const pct = totalProcessedOverall > 0 ? Math.round((d.value / totalProcessedOverall) * 100) : 0;
                          return (
                            <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                <span>{d.name}</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="font-bold text-white">{d.value}</span> items ({pct}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <span>No department data available.</span>
                </div>
              )}
              {departmentChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900">{totalProcessedOverall}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Items</span>
                </div>
              )}
            </div>

            {/* Department Legend */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px]">
              {departmentChartData.map(d => (
                <div key={d.name} className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-700 font-medium">{d.name}:</span>
                  <span className="text-slate-900 font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart 3 & 4: Daily Activity Timeline & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Intake vs Handovers Timeline (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Daily Activity Timeline ({dateRangeLabel})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Day-by-day continuous volume of found items intake vs. guest returns executed.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Logged Items</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Guest Returns</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLogged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHandovers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{d.date}</div>
                          <div className="text-indigo-400">Logged: <strong className="text-white">{d.logged}</strong></div>
                          <div className="text-emerald-400">Returns: <strong className="text-white">{d.handovers}</strong></div>
                          <div className="text-slate-300 font-semibold pt-0.5">Total Activity: {d.total}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="logged" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLogged)" />
                <Area type="monotone" dataKey="handovers" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHandovers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processed Items Category Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Top Processed Categories</span>
            </h3>
            <p className="text-xs text-slate-500">
              Inventory categories handled in the current window.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {categoryProcessingData.length > 0 ? (
              categoryProcessingData.map((cat, idx) => {
                const pct = totalProcessedOverall > 0 ? Math.round((cat.count / totalProcessedOverall) * 100) : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 truncate">{cat.name}</span>
                      <span className="text-slate-500">{cat.count} items ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(5, pct)}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                <span>No category data recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance Leaderboard & Detailed Audit Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Supervisor Staff Processing Leaderboard ({filteredStaffStats.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Individual staff performance breakdown with click-through item verification and audit trail.
            </p>
          </div>

          {/* Department Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter Select */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
            >
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-indigo-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">Rank</th>
                <th className="py-3 px-3.5">Staff Member</th>
                <th className="py-3 px-3.5">Department & Role</th>
                <th
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => {
                    setSortField('itemsLogged');
                    setSortOrder(sortField === 'itemsLogged' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Logged (30d)</span>
                    {sortField === 'itemsLogged' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                  </div>
                </th>
                <th
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => {
                    setSortField('itemsHandedOver');
                    setSortOrder(sortField === 'itemsHandedOver' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Handovers</span>
                    {sortField === 'itemsHandedOver' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Dispatched</th>
                <th
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none font-extrabold text-slate-900"
                  onClick={() => {
                    setSortField('totalProcessed');
                    setSortOrder(sortField === 'totalProcessed' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Total Processed</span>
                    {sortField === 'totalProcessed' && (<span>{sortOrder === 'desc' ? '↓' : '↑'}</span>)}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Team Share</th>
                <th className="py-3 px-3.5">Last Activity</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-medium">
              {filteredStaffStats.length > 0 ? (
                filteredStaffStats.map((s, idx) => {
                  const isTop3 = idx < 3;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                  return (
                    <tr
                      key={s.staff.id || s.email}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3.5 text-center font-bold">
                        {medal ? (
                          <span className="text-base" title={`Rank #${idx + 1}`}>{medal}</span>
                        ) : (
                          <span className="text-xs text-slate-400">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Staff Member Details */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {s.staffName ? s.staffName[0].toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {s.staffName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {s.staffId} • {s.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: DEPT_COLORS[s.department] || '#64748b' }}
                          >
                            {s.department}
                          </span>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {s.role}
                          </div>
                        </div>
                      </td>

                      {/* Items Logged */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          s.itemsLogged > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'
                        }`}>
                          {s.itemsLogged}
                        </span>
                      </td>

                      {/* Handovers */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          s.itemsHandedOver > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                        }`}>
                          {s.itemsHandedOver}
                        </span>
                      </td>

                      {/* Dispatched */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          s.itemsDispatched > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'
                        }`}>
                          {s.itemsDispatched}
                        </span>
                      </td>

                      {/* Total Processed */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className="text-sm font-black text-slate-900">
                          {s.totalProcessed}
                        </span>
                      </td>

                      {/* Processing Share Bar */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>{s.processingShare}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{ width: `${Math.min(100, s.processingShare)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                        {s.lastActivityDate ? (
                          <span>{new Date(s.lastActivityDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        ) : (
                          <span className="text-slate-300 italic">No activity</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {s.totalProcessed > 0 && (
                            <button
                              type="button"
                              onClick={() => setInspectingStaff(s)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Inspect Items Processed by this staff"
                            >
                              Inspect Items
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrint(s)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title={`Print ${s.staffName}'s Performance Record`}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openStaffProfile(s.staff)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Staff Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No staff records match your selected department or search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Modal: Inspect Staff Processed Items */}
      {inspectingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {inspectingStaff.staffName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{inspectingStaff.staffName}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: DEPT_COLORS[inspectingStaff.department] || '#64748b' }}
                    >
                      {inspectingStaff.department}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectingStaff.processedItems.length} items processed in {dateRangeLabel} ({inspectingStaff.itemsLogged} logged, {inspectingStaff.itemsHandedOver} handovers)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Inside Modal */}
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-white">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code, item name, room..."
                  value={drilldownSearch}
                  onChange={e => setDrilldownSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-indigo-500"
                />
              </div>

              <select
                value={drilldownStatusFilter}
                onChange={e => setDrilldownStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Stored">Stored</option>
                <option value="Handed Over">Handed Over</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Pending Approval">Pending Approval</option>
              </select>
            </div>

            {/* Modal Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {drilldownFilteredItems.length > 0 ? (
                drilldownFilteredItems.map(item => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {item.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.itemName}
                        </h4>
                        <Badge status={item.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                        <span>Category: <strong className="text-slate-700">{item.category}</strong></span>
                        <span>Location: <strong className="text-slate-700">{item.locationFound || 'Hotel'}</strong></span>
                        <span>Date: <strong>{item.dateFound || item.createdAt.split('T')[0]}</strong></span>
                        {item.handoverDetails?.receiverName && (
                          <span className="text-emerald-700">Receiver: <strong>{item.handoverDetails.receiverName}</strong></span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        openItemDetails(item);
                      }}
                      className="shrink-0 flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No items matched your search criteria for this staff member.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {drilldownFilteredItems.length} of {inspectingStaff.processedItems.length} records
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePrint(inspectingStaff)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 border border-indigo-200"
                  title="Print this staff member's official performance audit record"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print Staff Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingStaff(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Staff Performance Print & Audit Modal */}
      <StaffPerformancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        staffStats={filteredStaffStats}
        allStaffStats={staffStatsList}
        dateRange={dateRange}
        dateRangeLabel={dateRangeLabel}
        selectedDept={selectedDept}
        searchQuery={searchQuery}
        initialSelectedStaff={selectedStaffForPrint}
        departmentData={departmentChartData}
      />
    </div>
  );
};
