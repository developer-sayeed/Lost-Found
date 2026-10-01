import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  ArrowRight,
  ArrowLeft,
  Eye,
  Edit2,
  HeartHandshake,
  Box,
  Printer,
  Trash2,
  CalendarCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  QrCode,
  RotateCcw,
  BarChart3,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Calendar,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LostItem } from '../types';
import { isWithinHandover24Hours } from '../lib/handoverUtils';
import { Badge } from './Badge';
import { NotificationEfficiencyWidget } from './NotificationEfficiencyWidget';

const VIBRANT_CATEGORY_PALETTE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#fb923c', // Orange
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#e11d48', // Crimson
  '#059669'  // Green
];

// Helper to assign a distinct vibrant color to any category
const getCategoryColor = (categoryName: string, index: number): string => {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = (Math.abs(hash) + index) % VIBRANT_CATEGORY_PALETTE.length;
  return VIBRANT_CATEGORY_PALETTE[colorIndex];
};

interface CategoryTooltipProps {
  active?: boolean;
  payload?: any[];
  totalActiveItems: number;
}

const CustomCategoryTooltip: React.FC<CategoryTooltipProps> = ({ active, payload, totalActiveItems }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pct = totalActiveItems > 0 ? Math.round((data.count / totalActiveItems) * 100) : 0;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 z-50">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
          <span className="font-bold text-slate-100">{data.label || data.category}</span>
        </div>
        <div className="text-slate-300 font-medium pl-4.5">
          <span className="text-white font-bold text-sm">{data.count}</span> {data.count === 1 ? 'item' : 'items'}
          <span className="text-slate-400 text-[11px] ml-1.5 font-normal">({pct}% of inventory)</span>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC = () => {
  const {
    activeItems,
    stats,
    settings,
    setActiveTab,
    setFilters,
    setIsAddModalOpen,
    setEditingItem,
    openItemDetails,
    openHandover,
    openDispatch,
    openDelete,
    openPrint,
    openEditItem,
    openQrScanner,
    openItemQrModal,
    openReturnToStore
  } = useApp();
  const { user, isAdmin, hasPermission } = useAuth();
  const { t, isRTL, translateCategory, translateStatus } = useLanguage();

  // Dynamic time-based greeting calculation (Morning / Afternoon / Evening / Night)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good Morning',
        icon: Sun,
        period: 'morning',
        shift: 'Morning Shift',
        accentBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
        iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: 'Good Afternoon',
        icon: SunMedium,
        period: 'afternoon',
        shift: 'Afternoon Shift',
        accentBg: 'from-blue-500/10 via-indigo-500/5 to-transparent',
        iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60'
      };
    }
    if (hour >= 17 && hour < 21) {
      return {
        text: 'Good Evening',
        icon: Sunset,
        period: 'evening',
        shift: 'Evening Shift',
        accentBg: 'from-purple-500/10 via-rose-500/5 to-transparent',
        iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60'
      };
    }
    return {
      text: 'Good Night',
      icon: Moon,
      period: 'night',
      shift: 'Night Shift',
      accentBg: 'from-indigo-900/15 via-slate-900/5 to-transparent',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60'
    };
  }, []);

  const hotelName = settings?.hotelName?.trim() || 'Warwick Hotel';
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).format(new Date());
  }, []);

  const GreetingIcon = greeting.icon;

  // Status chart data matching live real-time stats
  const statusData = useMemo(() => [
    { name: t.store, value: stats.stored || 0, color: '#4f46e5' },
    { name: t.handover, value: stats.handedOver || 0, color: '#10b981' },
    { name: t.dispatched, value: stats.dispatched || 0, color: '#f43f5e' }
  ], [stats.stored, stats.handedOver, stats.dispatched, t]);

  const totalStatusCount = (stats.stored || 0) + (stats.handedOver || 0) + (stats.dispatched || 0);
  const storedPct = totalStatusCount > 0 ? Math.round(((stats.stored || 0) / totalStatusCount) * 100) : 0;
  const handedOverPct = totalStatusCount > 0 ? Math.round(((stats.handedOver || 0) / totalStatusCount) * 100) : 0;
  const dispatchedPct = totalStatusCount > 0 ? Math.round(((stats.dispatched || 0) / totalStatusCount) * 100) : 0;

  // Category chart data dynamically computed with unique random vibrant colors per category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeItems.forEach(i => {
      const cat = i.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const activeCategories = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count], idx) => ({
        category: cat,
        label: translateCategory(cat),
        count,
        fill: getCategoryColor(cat, idx)
      }));

    return activeCategories.length > 0 ? activeCategories : [
      { category: 'General', label: t.store, count: 0, fill: '#6366f1' }
    ];
  }, [activeItems, translateCategory, t]);

  const maxCategoryCount = Math.max(...categoryData.map(c => c.count), 5);
  const recentItems = activeItems.slice(0, 6);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* ========================================================================= */}
      {/* DYNAMIC WELCOME & TIME GREETING SECTION (RESPONSIVE FOR ALL DEVICES) */}
      {/* ========================================================================= */}
      <div 
        id="dashboard-welcome-banner"
        className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 md:p-7 transition-all"
      >
        {/* Subtle Ambient Time Gradient Backdrop */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${greeting.accentBg} pointer-events-none opacity-90`}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Greeting Icon, Title, and Dynamic Hotel Name */}
          <div className="flex items-center space-x-3.5 sm:space-x-5 rtl:space-x-reverse min-w-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${greeting.iconBg}`}
              title={greeting.text}
            >
              <GreetingIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Main Greeting Heading (e.g. Good Morning / Good Afternoon / Good Evening / Good Night) */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {greeting.text}
              </h1>

              {/* Dynamic Hotel Name Message */}
              <p className="mt-1 text-xs sm:text-sm md:text-base font-medium text-slate-600 dark:text-slate-300 flex items-center flex-wrap gap-1.5 leading-relaxed">
                <span>Welcome to</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 inline-block flex-shrink-0" />
                  {hotelName}
                </span>
                <span>Lost and Found Portal</span>
              </p>
            </div>
          </div>

          {/* Clean Date Indicator (Responsive) */}
          <div className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* 5 Summary Metric Top Cards: Total Item, Store, Handover, Total Dispatch, Found Today */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* 1. Total Item */}
        <div 
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              status: 'All Status',
              startDate: '',
              endDate: '',
              searchQuery: '',
              category: 'All Categories',
              datePreset: 'All'
            }));
            setActiveTab('items');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view all items in inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalItems}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {stats.totalItems}
            </p>
            <div className="mt-1 flex items-center text-[11px] text-indigo-600 font-medium">
              <span>{t.allRecords}</span>
            </div>
          </div>
        </div>

        {/* 2. Store (Stored Items) */}
        <div 
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              status: 'Store',
              startDate: '',
              endDate: '',
              searchQuery: '',
              category: 'All Categories',
              datePreset: 'All'
            }));
            setActiveTab('items');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          title="Click to filter by currently stored items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.store}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {stats.stored}
            </p>
            <div className="mt-1 flex items-center text-[11px] text-blue-600 font-medium">
              <span>{t.inStorage}</span>
            </div>
          </div>
        </div>

        {/* 3. Handover */}
        <div 
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              status: 'Handover',
              startDate: '',
              endDate: '',
              searchQuery: '',
              category: 'All Categories',
              datePreset: 'All'
            }));
            setActiveTab('items');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
          title="Click to filter by handed over items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.handover}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              {stats.handedOver}
            </p>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 font-medium">
              <span>{t.returnedToGuests}</span>
            </div>
          </div>
        </div>

        {/* 4. Total Dispatch */}
        <div 
          onClick={() => {
            setFilters(prev => ({
              ...prev,
              status: 'Dispatched',
              startDate: '',
              endDate: '',
              searchQuery: '',
              category: 'All Categories',
              datePreset: 'All'
            }));
            setActiveTab('items');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
          title="Click to filter by dispatched items"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalDispatch}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              {stats.dispatched}
            </p>
            <div className="mt-1 flex items-center text-[11px] text-rose-600 font-medium">
              <span>{t.dispatchedItems}</span>
            </div>
          </div>
        </div>

        {/* 5. Found Today */}
        <div 
          onClick={() => {
            const todayStr = new Date().toISOString().split('T')[0];
            setFilters(prev => ({
              ...prev,
              status: 'All Status',
              startDate: todayStr,
              endDate: todayStr,
              searchQuery: '',
              category: 'All Categories',
              datePreset: 'All'
            }));
            setActiveTab('items');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group col-span-2 sm:col-span-1"
          title="Click to filter items found today"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.foundToday}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                {stats.foundToday}
              </p>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {t.today}
              </span>
            </div>
            <div className="mt-1 flex items-center text-[11px] text-amber-600 font-medium">
              <span>{t.loggedToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Donut Chart: Items by Status */}
        <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900">
              {t.itemsByStatus}
            </h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wide border border-emerald-100">
              {t.liveBreakdown}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative my-auto">
            {totalStatusCount === 0 ? (
              <div className="text-center text-slate-400 text-sm">
                {t.noItemsRecorded}
              </div>
            ) : (
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Background Track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                  />
                  {/* Stored Segment */}
                  {stats.stored > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#4f46e5"
                      strokeWidth="22"
                      strokeDasharray={`${(stats.stored / totalStatusCount) * 439.82} 439.82`}
                      strokeDashoffset="0"
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                  {/* Handed Over Segment */}
                  {stats.handedOver > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="22"
                      strokeDasharray={`${(stats.handedOver / totalStatusCount) * 439.82} 439.82`}
                      strokeDashoffset={-((stats.stored / totalStatusCount) * 439.82)}
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                  {/* Dispatched Segment */}
                  {stats.dispatched > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth="22"
                      strokeDasharray={`${(stats.dispatched / totalStatusCount) * 439.82} 439.82`}
                      strokeDashoffset={-(((stats.stored + stats.handedOver) / totalStatusCount) * 439.82)}
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                </svg>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalStatusCount}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t.totalTracked}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Status Labels */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>{t.store} {storedPct}% ({stats.stored})</span>
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{t.handover} {handedOverPct}% ({stats.handedOver})</span>
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{t.dispatched} {dispatchedPct}% ({stats.dispatched})</span>
            </div>
          </div>
        </section>

        {/* Bar Chart: Items by Category */}
        <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-slate-900">
                {t.itemsByCategory}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
              {categoryData.length} {categoryData.length === 1 ? t.category : t.categories}
            </span>
          </div>

          {/* Recharts Bar Chart - Cleanly hidden bottom labels, hover-only rich category tooltip */}
          <div className="w-full h-72 pt-2">
            {activeItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {t.noItemsRecorded}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    hide={true}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomCategoryTooltip totalActiveItems={activeItems.length} />}
                    cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    animationDuration={800}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cat-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* Admin Notification & Dispatch Alert Delivery Rates Telemetry Widget */}
      <NotificationEfficiencyWidget />

      {/* Recent Items Section */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">
              {t.recentActivity}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.latestItemsLogged}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:space-x-3 rtl:space-x-reverse w-full sm:w-auto shrink-0">
            {hasPermission('create') && (
              <button
                id="btn-dashboard-add-item"
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                className="flex-1 sm:flex-initial justify-center whitespace-nowrap flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{t.addItem}</span>
              </button>
            )}
            <button
              id="btn-dashboard-view-all"
              onClick={() => setActiveTab('items')}
              className="flex-1 sm:flex-initial justify-center whitespace-nowrap px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 active:scale-95 rounded-xl transition-colors border border-slate-200 flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
            >
              <span className="whitespace-nowrap">{t.viewAll}</span>
              {isRTL ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-5">{t.code}</th>
                <th className="py-3.5 px-5">{t.dateFound}</th>
                <th className="py-3.5 px-5">{t.locationFound}</th>
                <th className="py-3.5 px-5">{t.description}</th>
                <th className="py-3.5 px-5">{t.status}</th>
                <th className="py-3.5 px-5 text-right rtl:text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentItems.map(item => {
                const isStored = item.status === 'Stored';
                const isHandedOver = item.status === 'Handed Over';
                const isDispatched = item.status === 'Dispatched';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-indigo-600">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600">
                      {new Date(item.dateFound).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      {item.locationFound}
                    </td>
                    <td
                      className="py-3.5 px-5 max-w-xs truncate font-medium text-slate-900 capitalize"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {item.itemName}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge status={item.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right rtl:text-left">
                      <div className="flex items-center justify-end rtl:justify-start space-x-1 rtl:space-x-reverse">
                        <button
                          id={`btn-qr-${item.id}`}
                          onClick={() => openItemQrModal(item)}
                          title={t.scanQr}
                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {hasPermission('view') && (
                          <button
                            id={`btn-view-${item.id}`}
                            onClick={() => openItemDetails(item)}
                            title={t.viewDetails}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('edit') && !isHandedOver && (
                          <button
                            id={`btn-edit-${item.id}`}
                            onClick={() => openEditItem(item)}
                            title={t.edit}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isStored && (
                          <>
                            {isAdmin && hasPermission('handover') && (
                              <button
                                id={`btn-handover-${item.id}`}
                                onClick={() => openHandover(item)}
                                title={t.handover}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <HeartHandshake className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission('dispatch') && (
                              <button
                                id={`btn-dispatch-${item.id}`}
                                onClick={() => openDispatch(item)}
                                title={t.dispatch}
                                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Box className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {isHandedOver && isAdmin && isWithinHandover24Hours(item) && (
                          <button
                            id={`btn-dashboard-return-store-${item.id}`}
                            onClick={() => openReturnToStore(item)}
                            title={t.returnToStore}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('print') && (
                          <button
                            id={`btn-print-${item.id}`}
                            onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                            title={t.print}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('delete') && !isHandedOver && (
                          <button
                            id={`btn-delete-${item.id}`}
                            onClick={() => openDelete(item)}
                            title={t.delete}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

