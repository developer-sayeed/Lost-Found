import React from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { FilterState, HotelSettings } from '../../../types';
import { Translations } from '../../../context/LanguageContext';

interface ItemsFilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  t: Translations;
  settings: HotelSettings;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean | ((prev: boolean) => boolean)) => void;
  onDatePresetChange: (preset: string) => void;
  onResetFilters: () => void;
  onPageReset: () => void;
}

export const ItemsFilterBar: React.FC<ItemsFilterBarProps> = ({
  filters,
  setFilters,
  t,
  settings,
  showAdvancedFilters,
  setShowAdvancedFilters,
  onDatePresetChange,
  onResetFilters,
  onPageReset
}) => {
  return (
    <div className="bg-white dark:bg-[#180F1A] p-4 rounded-2xl border border-slate-200 dark:border-fuchsia-900/30 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Real-time Global Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="input-items-search"
            type="text"
            placeholder={t.searchPlaceholder || 'Search code, item name, room, finder, category, guest...'}
            value={filters.searchQuery}
            onChange={e => {
              setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
              onPageReset();
            }}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#120815] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Dedicated Status Filter Dropdown */}
        <div className="flex items-center space-x-1.5 min-w-[150px]">
          <span className="text-xs font-semibold text-slate-500 shrink-0">{t.status}:</span>
          <select
            id="select-status-filter-dropdown"
            value={filters.status || 'All Status'}
            onChange={e => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              onPageReset();
            }}
            className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="All Status">{t.allStatuses || 'All Status'}</option>
            <option value="Store">{t.store || 'Store'}</option>
            <option value="Pending">{t.pending || 'Pending'}</option>
            <option value="Handover">{t.handover || 'Handover'}</option>
            <option value="Displaced">{t.displaced || 'Displaced'}</option>
          </select>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="flex items-center space-x-1.5 min-w-[150px]">
          <span className="text-xs font-semibold text-slate-500 shrink-0">{t.datePreset || 'Date Range'}:</span>
          <select
            id="select-date-range-preset"
            value={filters.datePreset || 'All'}
            onChange={e => onDatePresetChange(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="All">{t.allDates || 'All Dates'}</option>
            <option value="Today">{t.today || 'Today'}</option>
            <option value="Yesterday">{t.yesterday || 'Yesterday'}</option>
            <option value="Last 7 Days">{t.last7Days || 'Last 7 Days'}</option>
            <option value="This Month">{t.thisMonth || 'This Month'}</option>
            <option value="Last 30 Days">{t.last30Days || 'Last 30 Days'}</option>
            <option value="Custom">{t.customRange || 'Custom Range'}</option>
          </select>
        </div>

        {/* Custom Date Pickers */}
        {(filters.datePreset === 'Custom' || filters.startDate || filters.endDate) && (
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-[#200f24] p-1.5 rounded-xl border border-slate-200 dark:border-fuchsia-900/30">
            <input
              type="date"
              title="Start Date"
              value={filters.startDate || ''}
              onChange={e => {
                setFilters(prev => ({ ...prev, startDate: e.target.value, datePreset: 'Custom' }));
                onPageReset();
              }}
              className="text-xs px-2 py-1 bg-white dark:bg-[#140816] border border-slate-200 dark:border-fuchsia-900/30 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-medium">{t.to || 'to'}</span>
            <input
              type="date"
              title="End Date"
              value={filters.endDate || ''}
              onChange={e => {
                setFilters(prev => ({ ...prev, endDate: e.target.value, datePreset: 'Custom' }));
                onPageReset();
              }}
              className="text-xs px-2 py-1 bg-white dark:bg-[#140816] border border-slate-200 dark:border-fuchsia-900/30 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        )}

        {/* Toggle More Filters Button */}
        <button
          onClick={() => setShowAdvancedFilters(prev => !prev)}
          className={`flex items-center space-x-1.5 px-3.5 py-2 border rounded-xl text-xs font-medium transition-all cursor-pointer ${
            showAdvancedFilters
              ? 'bg-indigo-50 dark:bg-fuchsia-950/60 border-indigo-200 dark:border-fuchsia-800 text-indigo-700 dark:text-fuchsia-300 font-semibold'
              : 'border-slate-200 dark:border-fuchsia-900/30 bg-white dark:bg-[#180F1A] hover:bg-slate-50 dark:hover:bg-[#221028] text-slate-700 dark:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t.filters || 'More Filters'}</span>
        </button>

        {/* Reset Filters */}
        {(filters.searchQuery || filters.status !== 'All Status' || filters.category !== 'All Categories' || filters.startDate || filters.endDate || filters.datePreset !== 'All') && (
          <button
            onClick={onResetFilters}
            title={t.resetFilters || 'Reset all filters'}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#221028] rounded-xl transition-colors flex items-center space-x-1 text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.reset || 'Reset'}</span>
          </button>
        )}
      </div>

      {/* Collapsible Advanced Filters Tray */}
      {showAdvancedFilters && (
        <div className="pt-3 border-t border-slate-100 dark:border-fuchsia-900/20 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              id="select-items-category"
              value={filters.category}
              onChange={e => {
                setFilters(prev => ({ ...prev, category: e.target.value }));
                onPageReset();
              }}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All Categories">All Categories</option>
              {(settings?.categories && settings.categories.length > 0
                ? settings.categories.map(c => c.name)
                : ['Medicine', 'Foods & Perishables', 'Clothing', 'Personal Items', 'Electronics', 'Documents / ID', 'Valuables & Jewelry', 'Keys & Cards', 'Other']
              ).map(catName => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Storage Location
            </label>
            <select
              id="select-items-location"
              value={filters.storeLocation}
              onChange={e => {
                setFilters(prev => ({ ...prev, storeLocation: e.target.value }));
                onPageReset();
              }}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All Locations">All Locations</option>
              <option value="HK Office">HK Office</option>
              <option value="Safe Box">Safe Box</option>
              <option value="Front Desk Safe">Front Desk Safe</option>
              <option value="Security Office">Security Office</option>
              <option value="Storage Room B">Storage Room B</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Month
            </label>
            <select
              id="select-items-month"
              value={filters.month}
              onChange={e => {
                setFilters(prev => ({ ...prev, month: e.target.value }));
                onPageReset();
              }}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Year
            </label>
            <select
              id="select-items-year"
              value={filters.year}
              onChange={e => {
                setFilters(prev => ({ ...prev, year: e.target.value }));
                onPageReset();
              }}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-fuchsia-900/30 rounded-xl bg-white dark:bg-[#120815] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
