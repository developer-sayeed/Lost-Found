import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { StaffPerformancePrintModal } from '../../../components/modals/StaffPerformancePrintModal';
import { StaffPerformanceSkeleton } from '../../../components/common/Skeleton';
import {
  DateRangeFilter,
  MetricViewMode,
  StaffPerformanceStats,
  DEPT_COLORS
} from './types/performance.types';
import { PerformanceToolbar } from './components/PerformanceToolbar';
import { PerformanceKpis } from './components/PerformanceKpis';
import { PerformanceCharts } from './components/PerformanceCharts';
import { PerformanceLeaderboardTable } from './components/PerformanceLeaderboardTable';
import { StaffItemsDrilldownModal } from './components/StaffItemsDrilldownModal';

export const StaffPerformanceView: React.FC = () => {
  const { items, staff, openItemDetails, openStaffProfile, settings, isLoading } = useApp();
  const { user } = useAuth();
  const { t, isRTL, translateRole } = useLanguage();

  // Department Processing Share chart toggle (Default: hidden unless enabled in settings)
  const showDepartmentProcessingShare = Boolean(settings?.showDepartmentProcessingShare);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangeFilter>('last30');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metricViewMode, setMetricViewMode] = useState<MetricViewMode>('stacked');
  const [sortField, setSortField] = useState<'totalProcessed' | 'itemsLogged' | 'itemsHandedOver'>('totalProcessed');
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

    const windowItems = items.filter(item => {
      const foundInWindow = isWithinDateRange(item.dateFound) || isWithinDateRange(item.createdAt);
      const handoverInWindow = item.handoverDetails && isWithinDateRange(item.handoverDetails.handoverDate);
      const dispatchInWindow = item.dispatchDetails && isWithinDateRange(item.dispatchDetails.dispatchedDate || item.dispatchDetails.dispatchedAt);
      const timelineInWindow = item.timeline?.some(ev => isWithinDateRange(ev.timestamp));

      return foundInWindow || handoverInWindow || dispatchInWindow || timelineInWindow;
    });

    const statsMap = new Map<string, StaffPerformanceStats>();

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

    windowItems.forEach(item => {
      const itemProcessedStaffSet = new Set<string>();

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

      itemProcessedStaffSet.forEach(staffId => {
        const entry = statsMap.get(staffId);
        if (entry && !entry.processedItems.some(it => it.id === item.id)) {
          entry.processedItems.push(item);
        }
      });
    });

    const totalProcessedGlobal = globalLogged + globalHandedOver + globalDispatched;

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
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [staffStatsList, selectedDept, searchQuery, sortField, sortOrder]);

  const topPerformer = useMemo(() => {
    const sorted = [...staffStatsList].sort((a, b) => b.totalProcessed - a.totalProcessed);
    return sorted[0]?.totalProcessed > 0 ? sorted[0] : null;
  }, [staffStatsList]);

  const activeStaffCount = useMemo(() => {
    return staffStatsList.filter(s => s.totalProcessed > 0).length;
  }, [staffStatsList]);

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

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

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

  if (isLoading) {
    return <StaffPerformanceSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in" id="supervisor-performance-view">
      <PerformanceToolbar
        dateRange={dateRange}
        setDateRange={setDateRange}
        dateRangeLabel={dateRangeLabel}
        onExportExcel={handleExportExcel}
        onPrintReport={() => handleOpenPrintModal()}
      />

      <PerformanceKpis
        totalProcessedOverall={totalProcessedOverall}
        totalLoggedOverall={totalLoggedOverall}
        totalHandedOverOverall={totalHandedOverOverall}
        topPerformer={topPerformer}
        activeStaffCount={activeStaffCount}
        totalStaffCount={staff.length}
      />

      <PerformanceCharts
        dateRangeLabel={dateRangeLabel}
        metricViewMode={metricViewMode}
        setMetricViewMode={setMetricViewMode}
        staffChartData={staffChartData}
        showDepartmentProcessingShare={showDepartmentProcessingShare}
        departmentChartData={departmentChartData}
        totalProcessedOverall={totalProcessedOverall}
        dailyActivityData={dailyActivityData}
        categoryProcessingData={categoryProcessingData}
      />

      <PerformanceLeaderboardTable
        filteredStaffStats={filteredStaffStats}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departmentsList={departmentsList}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onInspectStaff={s => setInspectingStaff(s)}
        onPrintStaff={s => handleOpenPrintModal(s)}
        onOpenStaffProfile={openStaffProfile}
      />

      <StaffItemsDrilldownModal
        inspectingStaff={inspectingStaff}
        onClose={() => setInspectingStaff(null)}
        drilldownSearch={drilldownSearch}
        setDrilldownSearch={setDrilldownSearch}
        drilldownStatusFilter={drilldownStatusFilter}
        setDrilldownStatusFilter={setDrilldownStatusFilter}
        drilldownFilteredItems={drilldownFilteredItems}
        dateRangeLabel={dateRangeLabel}
        onOpenItemDetails={openItemDetails}
        onPrintStaffAudit={s => handleOpenPrintModal(s)}
      />

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
