import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  Truck,
  CalendarCheck,
  Eye,
  CheckCircle2,
  QrCode,
  X,
  Send,
  Users,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LostItem } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

export const PendingDispatchView: React.FC = () => {
  const { activeItems, batchDispatchItems, openDispatch, openItemDetails, openItemQrModal, getValidationMessage } = useApp();
  const { user, hasPermission } = useAuth();
  const { t, isRTL, translateCategory, translateStatus } = useLanguage();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  // Batch Dispatch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Internal Staff Release (Finder Staff)');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [destination, setDestination] = useState('Released to Respective Finder Staff');
  const [dispatchedTo, setDispatchedTo] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const batchModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isSubmittingBatch) setIsBatchModalOpen(false);
  }, { active: isBatchModalOpen, closeOnEsc: true });

  // Compute all Pending Dispatch Items dynamically with exact day calculations
  const { pendingItems, overdueItems, todayDueItems, upcomingDueItems } = useMemo(() => {
    const todayDate = new Date();
    const todayIso = todayDate.toISOString().split('T')[0];
    const todayMid = new Date(todayIso);

    const overdue: Array<LostItem & { diffDays: number }> = [];
    const todayDue: Array<LostItem & { diffDays: number }> = [];
    const upcoming: Array<LostItem & { diffDays: number }> = [];
    const allPending: Array<LostItem & { diffDays: number }> = [];

    activeItems.forEach(item => {
      const isEligible = item.status === 'Stored' || 
        item.status === 'Pending' || 
        item.status === 'Pending Approval' || 
        item.status === 'Pending Claim' || 
        item.status === 'Under Review';

      if (!isEligible) return;

      if (item.dispatchDeadline) {
        const deadlineDate = new Date(item.dispatchDeadline);
        const diffDays = Math.ceil((deadlineDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));

        const itemWithDiff = { ...item, diffDays };

        if (diffDays < 0) {
          overdue.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (diffDays === 0) {
          todayDue.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (diffDays <= 3) {
          upcoming.push(itemWithDiff);
          allPending.push(itemWithDiff);
        } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
          allPending.push(itemWithDiff);
        }
      } else if (item.status === 'Pending' || item.status === 'Pending Approval' || item.status === 'Pending Claim') {
        allPending.push({ ...item, diffDays: 0 });
      }
    });

    return {
      pendingItems: allPending,
      overdueItems: overdue,
      todayDueItems: todayDue,
      upcomingDueItems: upcoming
    };
  }, [activeItems]);

  // Display items filtered by selected tab
  const displayedItems = useMemo(() => {
    if (activeCategoryFilter === 'overdue') return overdueItems;
    if (activeCategoryFilter === 'today') return todayDueItems;
    if (activeCategoryFilter === 'upcoming') return upcomingDueItems;
    return pendingItems;
  }, [activeCategoryFilter, overdueItems, todayDueItems, upcomingDueItems, pendingItems]);

  const selectedItemsList = useMemo(() => {
    return activeItems.filter(i => selectedItemIds.includes(i.id) || selectedItemIds.includes(i.code));
  }, [activeItems, selectedItemIds]);

  const toggleSelectAll = () => {
    if (selectedItemIds.length === displayedItems.length && displayedItems.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(displayedItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenBatchDispatch = () => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    setTrackingNumber(`DSP-${todayStr}-${randCode}`);
    setCourierName('Internal Staff Release (Finder Staff)');
    setDestination('Released to Respective Finder Staff');
    setDispatchedTo('');
    setBatchNotes(`Batch dispatch processed for ${selectedItemIds.length} items.`);
    setIsBatchModalOpen(true);
  };

  const handleConfirmBatchDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) return;

    if (!courierName.trim()) {
      toast.error(getValidationMessage('valDispatchMethod'));
      return;
    }
    if (!trackingNumber.trim()) {
      toast.error(getValidationMessage('valTrackingRef'));
      return;
    }

    setIsSubmittingBatch(true);
    try {
      await batchDispatchItems(selectedItemIds, {
        courierName: courierName.trim() || 'Internal Staff Dispatch',
        trackingNumber: trackingNumber.trim() || `BATCH-DSP-${Date.now()}`,
        destination: destination.trim() || 'Released to Staff / Guest',
        dispatchedTo: dispatchedTo.trim() || undefined,
        notes: batchNotes.trim() || `Batch dispatched by ${user?.name || 'Staff'}`
      });
      setSelectedItemIds([]);
      setIsBatchModalOpen(false);
    } catch (err) {
      console.error('Batch dispatch error:', err);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* 4 Top Metric Cards (Sleek Interface) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pending */}
        <div 
          onClick={() => setActiveCategoryFilter('all')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'all'
              ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.pendingDispatchMetric || 'TOTAL PENDING'}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {pendingItems.length}
            </p>
            <div className="mt-2 flex items-center text-xs text-indigo-600 font-medium">
              <span className="mr-1">•</span>{t.awaitingFulfillment || 'Awaiting fulfillment'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setActiveCategoryFilter('overdue')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'overdue'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-rose-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.overdue || 'OVERDUE'}
            </p>
            <p className="text-2xl font-bold text-rose-600">
              {overdueItems.length}
            </p>
            <div className="mt-2 flex items-center text-xs text-rose-600 font-medium">
              <span className="mr-1">•</span>{t.pastPolicyWindow || 'Past policy window'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Due Today */}
        <div 
          onClick={() => setActiveCategoryFilter('today')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'today'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-amber-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.dueToday || 'DUE TODAY'}
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {todayDueItems.length}
            </p>
            <div className="mt-2 flex items-center text-xs text-amber-600 font-medium">
              <span className="mr-1">•</span>{t.immediateAction || 'Immediate action'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Due in 1-3 Days */}
        <div 
          onClick={() => setActiveCategoryFilter('upcoming')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeCategoryFilter === 'upcoming'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 shadow-sm hover:border-blue-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t.dueIn3Days || 'DUE IN 1-3 DAYS'}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {upcomingDueItems.length}
            </p>
            <div className="mt-2 flex items-center text-xs text-blue-600 font-medium">
              <span className="mr-1">•</span>{t.upcomingCutoff || 'Upcoming cutoff'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t.pendingDispatchTitle || 'Items Pending Dispatch'} ({displayedItems.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.pendingDispatchSubtitle || 'Items exceeding or approaching storage retention threshold for finder staff claiming'}
            </p>
          </div>

          {selectedItemIds.length > 0 && hasPermission('dispatch') && (
            <div className="flex items-center space-x-3 rtl:space-x-reverse bg-indigo-50/80 px-4 py-2 rounded-2xl border border-indigo-100 animate-slide-down">
              <span className="text-xs font-bold text-indigo-900">
                {selectedItemIds.length} {t.totalItems}
              </span>
              <button
                id="btn-batch-dispatch-trigger"
                onClick={handleOpenBatchDispatch}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t.processDispatch || 'Batch Dispatch'} ({selectedItemIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedItemIds([])}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {displayedItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">{t.noPendingDispatch || 'No items in this dispatch category'}</p>
              <p className="text-slate-400 mt-0.5">{t.allRetentionInCompliance || 'All retention and storage schedules are in compliance'}</p>
            </div>
          ) : (
            <table className="w-full text-left rtl:text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-10">
                    <input
                      type="checkbox"
                      id="checkbox-select-all-dispatch"
                      checked={selectedItemIds.length === displayedItems.length && displayedItems.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3.5 px-5">{t.itemCode || 'Code'}</th>
                  <th className="py-3.5 px-5">{t.itemName || 'Item Name'}</th>
                  <th className="py-3.5 px-5">{t.category || 'Category'}</th>
                  <th className="py-3.5 px-5">{t.finderStaff || 'Found By'}</th>
                  <th className="py-3.5 px-5">{t.storeLocation || 'Store Location'}</th>
                  <th className="py-3.5 px-5">{t.retentionDeadline || 'Deadline'}</th>
                  <th className="py-3.5 px-5">{t.urgency || 'Urgency'}</th>
                  <th className="py-3.5 px-5 text-right rtl:text-left">{t.actions || 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedItems.map(item => {
                  const diffDays = item.diffDays;
                  const isOverdue = diffDays < 0;
                  const isDueToday = diffDays === 0;
                  const isSelected = selectedItemIds.includes(item.id);

                  return (
                    <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'}`}>
                      <td className="py-3.5 px-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-5 font-mono font-semibold text-indigo-600">
                        {item.code}
                      </td>
                      <td
                        className="py-3.5 px-5 font-semibold text-slate-900 max-w-xs truncate capitalize"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {item.itemName}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {translateCategory(item.category)}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {item.employeeName || 'Staff'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {item.storeLocation}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600">
                        {item.dispatchDeadline ? new Date(item.dispatchDeadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (t.immediate || 'Immediate')}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isDueToday
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{t.overdue || 'Overdue'} ({Math.abs(diffDays)}d)</span>
                            </>
                          ) : isDueToday ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{t.dueToday || 'Due Today'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>{diffDays} {t.daysRemaining || 'days left'}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start space-x-1.5 rtl:space-x-reverse">
                          <button
                            onClick={() => openItemQrModal(item)}
                            title={t.viewPrintQr || 'View & Print QR Tag'}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openItemDetails(item)}
                            title={t.viewDetails || 'View Details'}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('dispatch') && (
                            <button
                              id={`btn-dispatch-action-${item.id}`}
                              onClick={() => openDispatch(item)}
                              className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>{t.dispatch || 'Dispatch'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dynamic Batch Dispatch Modal */}
      {isBatchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmittingBatch) {
              setIsBatchModalOpen(false);
            }
          }}
        >
          <div
            ref={batchModalRef}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Batch Dispatch ({selectedItemIds.length} Items)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Process and dispatch selected items in a single workflow
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchDispatch} noValidate className="p-6 space-y-4">
              {/* Selected Items preview chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Selected Items ({selectedItemsList.length})
                </label>
                <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
                  {selectedItemsList.map(item => (
                    <span
                      key={item.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                    >
                      <span className="font-mono text-indigo-600 font-bold">{item.code}:</span>
                      <span className="max-w-[120px] truncate">{item.itemName}</span>
                      <span className="text-[10px] text-slate-400">({item.employeeName || 'Staff'})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Method / Authorization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Internal Staff Release, Hotel Staff Handover"
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Reference / Auth # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DSP-20260829-001"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Housekeeping Staff Room, Main Reception"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatched To (Receiver / Staff)
                  </label>
                  <input
                    type="text"
                    placeholder="Defaults to respective finder employees"
                    value={dispatchedTo}
                    onChange={e => setDispatchedTo(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Notes & Authorization Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional dispatch remarks or handover notes..."
                  value={batchNotes}
                  onChange={e => setBatchNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingBatch}
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isSubmittingBatch
                      ? 'Processing Batch Dispatch...'
                      : `Confirm Dispatch (${selectedItemIds.length} Items)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
