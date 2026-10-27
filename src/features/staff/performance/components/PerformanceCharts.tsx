import React from 'react';
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
import { BarChart3, Building, Clock, Layers, Package } from 'lucide-react';
import { MetricViewMode, CHART_COLORS } from '../types/performance.types';

interface PerformanceChartsProps {
  dateRangeLabel: string;
  metricViewMode: MetricViewMode;
  setMetricViewMode: (mode: MetricViewMode) => void;
  staffChartData: any[];
  showDepartmentProcessingShare: boolean;
  departmentChartData: any[];
  totalProcessedOverall: number;
  dailyActivityData: any[];
  categoryProcessingData: any[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  dateRangeLabel,
  metricViewMode,
  setMetricViewMode,
  staffChartData,
  showDepartmentProcessingShare,
  departmentChartData,
  totalProcessedOverall,
  dailyActivityData,
  categoryProcessingData
}) => {
  return (
    <div className="space-y-6">
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

        {/* Chart 2: Department Share Donut Chart */}
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
    </div>
  );
};
