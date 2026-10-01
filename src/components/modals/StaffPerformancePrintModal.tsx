import React, { useState, useRef, useMemo } from 'react';
import {
  Printer,
  ExternalLink,
  X,
  FileText,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  TrendingUp,
  Package,
  HeartHandshake,
  Truck,
  ShieldCheck,
  Languages,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StaffPerformanceStats } from '../StaffPerformanceView';

interface StaffPerformancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffStats: StaffPerformanceStats[];
  allStaffStats?: StaffPerformanceStats[];
  dateRange: string;
  dateRangeLabel: string;
  selectedDept: string;
  searchQuery: string;
  initialSelectedStaff?: StaffPerformanceStats | null;
  departmentData?: { name: string; value: number }[];
}

export const StaffPerformancePrintModal: React.FC<StaffPerformancePrintModalProps> = ({
  isOpen,
  onClose,
  staffStats,
  allStaffStats = [],
  dateRangeLabel,
  selectedDept,
  searchQuery,
  initialSelectedStaff = null,
  departmentData = []
}) => {
  const { settings } = useApp();
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Configuration States for dynamic print
  const [useFilteredScope, setUseFilteredScope] = useState<boolean>(true);
  const [onlyActiveContributors, setOnlyActiveContributors] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialSelectedStaff ? (initialSelectedStaff.staffId || initialSelectedStaff.staffName) : 'all');
  const [includeDepartmentSummary, setIncludeDepartmentSummary] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [includeAuditorNotes, setIncludeAuditorNotes] = useState<boolean>(false);
  const [auditorNotes, setAuditorNotes] = useState<string>('Performance audit verified against physical storage logs and handover registers.');
  const [isBilingual, setIsBilingual] = useState<boolean>(true);

  // Dynamic Hotel Branding from Settings
  const hotelName = settings?.hotelName || 'Warwick Hotels & Resorts';
  const hotelArabic = settings?.hotelArabicName || 'فندق ورويك';
  const hotelSub = settings?.hotelSubTitle || 'Luxury Hotels & Resorts';
  const logoUrl = settings?.logoUrl || '';
  const hotelPhone = settings?.phoneNumber || '';
  const hotelEmail = settings?.emailAddress || '';

  // Base list depending on scope toggle
  const baseStaffList = useMemo(() => {
    if (useFilteredScope) {
      return staffStats;
    }
    return allStaffStats.length > 0 ? allStaffStats : staffStats;
  }, [useFilteredScope, staffStats, allStaffStats]);

  // Contributor filter
  const targetStaffList = useMemo(() => {
    let list = [...baseStaffList];
    if (onlyActiveContributors) {
      list = list.filter(s => s.totalProcessed > 0);
    }
    return list;
  }, [baseStaffList, onlyActiveContributors]);

  // Single staff inspect mode (if selected)
  const singleStaff = useMemo(() => {
    if (selectedStaffId === 'all') return null;
    return targetStaffList.find(s => s.staffId === selectedStaffId || s.staffName === selectedStaffId) ||
      allStaffStats.find(s => s.staffId === selectedStaffId || s.staffName === selectedStaffId) || null;
  }, [selectedStaffId, targetStaffList, allStaffStats]);

  // Dynamic KPI Metrics computation strictly for displayed staff
  const dynamicMetrics = useMemo(() => {
    if (singleStaff) {
      return {
        totalProcessed: singleStaff.totalProcessed,
        logged: singleStaff.itemsLogged,
        handedOver: singleStaff.itemsHandedOver,
        dispatched: singleStaff.itemsDispatched,
        activeStaffCount: singleStaff.totalProcessed > 0 ? 1 : 0,
        evaluatedStaffCount: 1,
        avgPerStaff: singleStaff.totalProcessed.toString(),
        overallResolutionRate: singleStaff.itemsLogged > 0
          ? Math.round(((singleStaff.itemsHandedOver + singleStaff.itemsDispatched) / singleStaff.itemsLogged) * 100)
          : singleStaff.itemsHandedOver > 0 ? 100 : 0
      };
    }

    const totalProcessed = targetStaffList.reduce((acc, s) => acc + s.totalProcessed, 0);
    const logged = targetStaffList.reduce((acc, s) => acc + s.itemsLogged, 0);
    const handedOver = targetStaffList.reduce((acc, s) => acc + s.itemsHandedOver, 0);
    const dispatched = targetStaffList.reduce((acc, s) => acc + s.itemsDispatched, 0);
    const activeStaffCount = targetStaffList.filter(s => s.totalProcessed > 0).length;
    const avgPerStaff = activeStaffCount > 0 ? (totalProcessed / activeStaffCount).toFixed(1) : '0.0';
    const overallResolutionRate = logged > 0
      ? Math.round(((handedOver + dispatched) / logged) * 100)
      : handedOver > 0 ? 100 : 0;

    return {
      totalProcessed,
      logged,
      handedOver,
      dispatched,
      activeStaffCount,
      evaluatedStaffCount: targetStaffList.length,
      avgPerStaff,
      overallResolutionRate
    };
  }, [singleStaff, targetStaffList]);

  // Audit Reference ID generated dynamically
  const auditReference = useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `AUD-SPP-${yr}${mo}${da}-${rand}`;
  }, []);

  const generatedDateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Native Print Trigger
  const handlePrint = () => {
    try {
      if (typeof window !== 'undefined') {
        window.print();
      }
    } catch (e) {
      console.warn('Native window.print failed, attempting standalone window:', e);
      handleOpenPrintWindow();
    }
  };

  // Standalone Popup Window for iframe compatibility
  const handleOpenPrintWindow = () => {
    if (!printContainerRef.current) return;
    try {
      const printContent = printContainerRef.current.innerHTML;
      const printWindow = typeof window !== 'undefined' && window.open ? window.open('', '_blank', 'width=920,height=1080') : null;
      if (printWindow && printWindow.document) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en" dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
              <meta charset="utf-8">
              <title>Staff Performance Audit - ${hotelName}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm 14mm 12mm;
                }
                body {
                  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background-color: #ffffff;
                  color: #0f172a;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  margin: 0;
                  padding: 16px;
                }
                .print-sheet {
                  max-width: 860px;
                  margin: 0 auto;
                  background: white;
                }
                @media print {
                  body { padding: 0 !important; }
                  .print-sheet { max-width: 100% !important; }
                }
              </style>
            </head>
            <body>
              <div class="print-sheet">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    try {
                      window.focus();
                      window.print();
                    } catch (e) {}
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else if (typeof window !== 'undefined') {
        window.print();
      }
    } catch {
      if (typeof window !== 'undefined') {
        try {
          window.print();
        } catch {}
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">
                  Staff Processing Performance Audit
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-400/30">
                  {dateRangeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Executive Audit Document &middot; {targetStaffList.length} staff evaluated
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              id="btn-open-perf-print-window"
              onClick={handleOpenPrintWindow}
              title="Open standalone print window"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Window</span>
            </button>

            <button
              type="button"
              id="btn-trigger-perf-print"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Audit PDF</span>
            </button>

            <button
              type="button"
              id="btn-close-perf-print-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Customization Bar (Hidden when printing) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Scope Selection */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setUseFilteredScope(true)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  useFilteredScope ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Filtered Scope ({staffStats.length})
              </button>
              <button
                type="button"
                onClick={() => setUseFilteredScope(false)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  !useFilteredScope ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff ({allStaffStats.length})
              </button>
            </div>

            {/* Contributor Filter */}
            <label className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 shadow-2xs">
              <input
                type="checkbox"
                checked={onlyActiveContributors}
                onChange={e => setOnlyActiveContributors(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="font-semibold text-slate-700">Active Contributors Only</span>
            </label>

            {/* Target Staff Selection */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">Full Staff Leaderboard ({targetStaffList.length})</option>
                <optgroup label="Individual Staff Record">
                  {targetStaffList.map(s => (
                    <option key={s.staffId || s.staffName} value={s.staffId || s.staffName}>
                      {s.staffName} ({s.department} &bull; {s.totalProcessed} items)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggles */}
            <label className="flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer text-[11px] font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
              <input
                type="checkbox"
                checked={includeDepartmentSummary}
                onChange={e => setIncludeDepartmentSummary(e.target.checked)}
                className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Dept Summary</span>
            </label>

            <label className="flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer text-[11px] font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={e => setIncludeSignatures(e.target.checked)}
                className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Signatures</span>
            </label>

            <label className="flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer text-[11px] font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
              <input
                type="checkbox"
                checked={includeAuditorNotes}
                onChange={e => setIncludeAuditorNotes(e.target.checked)}
                className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Auditor Notes</span>
            </label>

            <button
              type="button"
              onClick={() => setIsBilingual(!isBilingual)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                isBilingual ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Languages className="w-3 h-3" />
              <span>{isBilingual ? 'Bilingual (EN/AR)' : 'English Only'}</span>
            </button>
          </div>
        </div>

        {/* Auditor Notes Field (If enabled) */}
        {includeAuditorNotes && (
          <div className="bg-amber-50/60 border-b border-amber-200 px-6 py-2.5 flex items-center space-x-3 text-xs text-amber-900 print:hidden">
            <span className="font-bold shrink-0">Auditor Notes / Remarks:</span>
            <input
              type="text"
              value={auditorNotes}
              onChange={e => setAuditorNotes(e.target.value)}
              placeholder="e.g. Monthly housekeeping & front office audit verified against logbooks."
              className="flex-1 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:outline-indigo-500 shadow-2xs"
            />
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 text-slate-900 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={printContainerRef}
            id="printable-performance-container"
            className="max-w-[840px] mx-auto bg-white p-6 sm:p-10 shadow-md rounded-2xl print:border-none print:p-0 print:shadow-none print:rounded-none print:max-w-none text-slate-900 text-xs"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          >
            {/* Official Hotel Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={hotelName}
                      className="max-h-12 max-w-[170px] object-contain mb-1.5"
                    />
                  ) : null}
                  <div className="text-lg font-black tracking-wider uppercase text-slate-900">
                    {hotelName}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {hotelArabic} &bull; {hotelSub}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded bg-indigo-50 text-indigo-900 font-black text-[11px] tracking-wider uppercase border border-indigo-200">
                    {singleStaff ? 'STAFF PERFORMANCE RECORD' : 'STAFF PROCESSING AUDIT'}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                    <div>Ref: <strong className="font-mono text-slate-800">{auditReference}</strong></div>
                    <div>Generated: <strong className="text-slate-800">{generatedDateFormatted}</strong></div>
                    <div>Auditor: <strong className="text-slate-800">{user?.name || 'Administrator'}</strong> ({user?.role || 'Auditor'})</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <div>
                  Scope: <strong className="text-slate-900">{selectedStaffId !== 'all' && singleStaff ? singleStaff.staffName : (selectedDept === 'All' ? 'All Hotel Departments' : selectedDept)}</strong>
                  {searchQuery && <span className="ml-1 text-slate-500">(Keyword: "{searchQuery}")</span>}
                </div>
                <div>
                  Window: <strong className="text-slate-900">{dateRangeLabel}</strong> &bull; Total Processed: <strong className="text-indigo-700">{dynamicMetrics.totalProcessed} items</strong>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {singleStaff
                    ? `Staff Processing Performance Profile: ${singleStaff.staffName}`
                    : 'Staff Lost & Found Processing Performance Audit Report'}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isBilingual
                    ? 'Official supervisor inspection report detailing staff item registration, guest returns & handovers.'
                    : 'Official supervisor inspection report detailing staff item registration, guest returns & handovers.'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Evaluated Staff</span>
                <span className="text-base font-black text-slate-900">{dynamicMetrics.evaluatedStaffCount}</span>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-5 gap-2.5 mb-5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Processed</div>
                <div className="text-base font-black text-indigo-600 mt-1">{dynamicMetrics.totalProcessed}</div>
                <div className="text-[9px] text-slate-400">Total volume</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Items Logged</div>
                <div className="text-base font-black text-slate-900 mt-1">{dynamicMetrics.logged}</div>
                <div className="text-[9px] text-slate-400">Deposited in store</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Handed Over</div>
                <div className="text-base font-black text-emerald-600 mt-1">{dynamicMetrics.handedOver}</div>
                <div className="text-[9px] text-slate-400">Returned to guest</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dispatched</div>
                <div className="text-base font-black text-sky-600 mt-1">{dynamicMetrics.dispatched}</div>
                <div className="text-[9px] text-slate-400">Released / Sent</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Success Rate</div>
                <div className="text-base font-black text-purple-600 mt-1">{dynamicMetrics.overallResolutionRate}%</div>
                <div className="text-[9px] text-slate-400">Avg {dynamicMetrics.avgPerStaff}/staff</div>
              </div>
            </div>

            {/* Department Summary Pills (If enabled and multi-department) */}
            {includeDepartmentSummary && departmentData.length > 0 && !singleStaff && (
              <div className="mb-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Departmental Throughput Distribution</span>
                  <span className="text-[9px] text-slate-400">{departmentData.length} active departments</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {departmentData.map(d => {
                    const pct = dynamicMetrics.totalProcessed > 0
                      ? Math.round((d.value / dynamicMetrics.totalProcessed) * 100)
                      : 0;
                    return (
                      <div
                        key={d.name}
                        className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-semibold text-slate-800 truncate pr-2">{d.name}</span>
                        <span className="font-bold text-slate-900 shrink-0 font-mono">
                          {d.value} <span className="text-[9px] text-slate-500 font-normal">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auditor Notes Callout Box (If toggled on) */}
            {includeAuditorNotes && auditorNotes.trim() && (
              <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 text-[11px]">
                <strong className="block font-bold mb-0.5 text-amber-900">Auditor Remarks & Findings:</strong>
                <p className="text-amber-900/90 leading-relaxed">{auditorNotes}</p>
              </div>
            )}

            {/* Main Content: Single Staff Audit Record vs Full Staff Processing Leaderboard */}
            {singleStaff ? (
              <div className="space-y-4">
                {/* Single Staff Overview Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {singleStaff.staffName[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{singleStaff.staffName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                          {singleStaff.department}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                          {singleStaff.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                        <span>Staff ID: <strong className="font-mono text-slate-700">{singleStaff.staffId}</strong></span>
                        {singleStaff.email && <span>Email: <strong className="text-slate-700">{singleStaff.email}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Personal Success Rate</span>
                    <span className="text-lg font-black text-emerald-600">{singleStaff.resolutionRate}%</span>
                    <span className="text-[10px] text-slate-500 block">
                      {singleStaff.itemsHandedOver} returned / {singleStaff.itemsLogged} logged
                    </span>
                  </div>
                </div>

                {/* Single Staff Itemized Audit Trail */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Processed Items Register ({singleStaff.processedItems.length} items in {dateRangeLabel})
                  </h3>
                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Code</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Item Name</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Category</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Location Found</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Date</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Status</th>
                        <th className="p-2 text-left font-bold text-[10px] uppercase tracking-wider">Details / Receiver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {singleStaff.processedItems.length > 0 ? (
                        singleStaff.processedItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-indigo-700">{item.code}</td>
                            <td className="p-2 font-semibold text-slate-900">{item.itemName}</td>
                            <td className="p-2 text-slate-600">{item.category}</td>
                            <td className="p-2 text-slate-600">{item.locationFound || 'Hotel'}</td>
                            <td className="p-2 text-slate-500">{item.dateFound || item.createdAt.split('T')[0]}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                item.status === 'Handed Over' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'Dispatched' ? 'bg-sky-100 text-sky-800' :
                                item.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' :
                                'bg-indigo-50 text-indigo-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600">
                              {item.handoverDetails?.receiverName
                                ? `Handed to: ${item.handoverDetails.receiverName}`
                                : item.dispatchDetails?.destination
                                ? `Sent: ${item.dispatchDetails.destination}`
                                : item.storeLocation || 'Stored'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 text-xs">
                            No processed items found for this staff member in the selected window.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Full Staff Performance Audit Table */
              <div>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                      <th className="p-2 text-center w-10 font-bold">Rank</th>
                      <th className="p-2 text-left font-bold">Staff Member</th>
                      <th className="p-2 text-left font-bold">Staff ID</th>
                      <th className="p-2 text-left font-bold">Department</th>
                      <th className="p-2 text-left font-bold">Role</th>
                      <th className="p-2 text-center font-bold">Logged</th>
                      <th className="p-2 text-center font-bold">Handed Over</th>
                      <th className="p-2 text-center font-bold">Dispatched</th>
                      <th className="p-2 text-center font-bold bg-slate-800">Total Items</th>
                      <th className="p-2 text-center font-bold">Success %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {targetStaffList.length > 0 ? (
                      targetStaffList.map((s, idx) => {
                        const isTop3 = idx < 3;
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                        const handoverRate = s.totalProcessed > 0
                          ? Math.round((s.itemsHandedOver / s.totalProcessed) * 100)
                          : 0;

                        return (
                          <tr key={s.staffId || s.staffName} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="p-2 text-center font-bold text-slate-700">
                              {medal || `#${idx + 1}`}
                            </td>
                            <td className="p-2 font-semibold text-slate-900">
                              {s.staffName}
                            </td>
                            <td className="p-2 font-mono text-slate-600 text-[10px]">
                              {s.staffId || 'N/A'}
                            </td>
                            <td className="p-2 text-slate-700">
                              {s.department}
                            </td>
                            <td className="p-2 text-slate-500">
                              {s.role}
                            </td>
                            <td className="p-2 text-center font-bold text-indigo-600">
                              {s.itemsLogged}
                            </td>
                            <td className="p-2 text-center font-bold text-emerald-600">
                              {s.itemsHandedOver}
                            </td>
                            <td className="p-2 text-center font-bold text-sky-600">
                              {s.itemsDispatched}
                            </td>
                            <td className="p-2 text-center font-black text-slate-900 bg-slate-100/80">
                              {s.totalProcessed}
                            </td>
                            <td className="p-2 text-center font-bold">
                              <span className={handoverRate >= 50 ? 'text-emerald-700' : 'text-amber-700'}>
                                {handoverRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-400 text-xs">
                          No staff performance records available for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Summary Footer Row */}
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan={5} className="p-2 text-right uppercase text-[10px]">
                        Total Summary ({targetStaffList.length} staff):
                      </td>
                      <td className="p-2 text-center text-indigo-700 font-black">{dynamicMetrics.logged}</td>
                      <td className="p-2 text-center text-emerald-700 font-black">{dynamicMetrics.handedOver}</td>
                      <td className="p-2 text-center text-sky-700 font-black">{dynamicMetrics.dispatched}</td>
                      <td className="p-2 text-center text-slate-900 font-black bg-slate-200">{dynamicMetrics.totalProcessed}</td>
                      <td className="p-2 text-center text-purple-700 font-black">{dynamicMetrics.overallResolutionRate}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Official Management Verification & Signatures Block (If enabled) */}
            {includeSignatures && (
              <div className="mt-8 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="h-10"></div>
                    <div className="border-t border-slate-300 pt-1.5">
                      <strong className="block text-slate-900 font-bold">Prepared By / Auditor</strong>
                      <span className="text-slate-600 block">{user?.name || 'Duty Manager'}</span>
                      <span className="text-slate-400 text-[9px]">{user?.role || 'Security & Loss Prevention'}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="h-10"></div>
                    <div className="border-t border-slate-300 pt-1.5">
                      <strong className="block text-slate-900 font-bold">Department Head / Supervisor</strong>
                      <span className="text-slate-600 block">Verified Signature & Date</span>
                      <span className="text-slate-400 text-[9px]">Operations Verification</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="h-10"></div>
                    <div className="border-t border-slate-300 pt-1.5">
                      <strong className="block text-slate-900 font-bold">Executive Office / GM Approval</strong>
                      <span className="text-slate-600 block">Official Hotel Stamp & Seal</span>
                      <span className="text-slate-400 text-[9px]">Executive Management</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal & Confidentiality Footer */}
            <div className="mt-6 pt-3 border-t border-dashed border-slate-200 text-center text-[9px] text-slate-400">
              <p>
                This official audit statement is generated automatically by {hotelName} Lost &amp; Found Portal.
                All rights reserved &middot; Confidential Internal Document &middot; {hotelPhone ? `Tel: ${hotelPhone}` : ''} {hotelEmail ? `&bull; ${hotelEmail}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden when printing) */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Executive Audit Mode &middot; Ready for A4 Print / PDF Export</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Audit PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
