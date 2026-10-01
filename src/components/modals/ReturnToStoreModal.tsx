import React, { useState } from 'react';
import { X, RotateCcw, ShieldCheck, AlertCircle, Package, User, Calendar, Phone, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../Badge';
import { useClickOutside } from '../../hooks/useClickOutside';
import { isWithinHandover24Hours } from '../../lib/handoverUtils';

const REASON_PRESETS = [
  'Guest returned item',
  'Handover mistake / Cancelled',
  'Customer dispute resolved',
  'Wrong receiver info entered',
  'Duplicate handover entry'
];

export const ReturnToStoreModal: React.FC = () => {
  const {
    isReturnToStoreModalOpen,
    setIsReturnToStoreModalOpen,
    returnModalItem,
    setReturnModalItem,
    returnToStoreItem
  } = useApp();
  const { user } = useAuth();

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsReturnToStoreModalOpen(false);
    setReturnModalItem(null);
    setReason('');
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isReturnToStoreModalOpen && !!returnModalItem,
    closeOnEsc: true
  });

  if (!isReturnToStoreModalOpen || !returnModalItem) return null;

  const item = returnModalItem;
  const isHandedOver = item.status === 'Handed Over';
  const handoverDetails = item.handoverDetails;
  const is24hValid = isWithinHandover24Hours(item);

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!is24hValid) {
      alert('The 24-hour return window for this handed over item has expired. Items cannot be returned to store after 24 hours.');
      return;
    }

    try {
      setIsSubmitting(true);
      await returnToStoreItem(item.id, reason.trim() || undefined);
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Failed to return item to store');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="return-to-store-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onMouseDown={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        id="return-to-store-modal"
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Return Item to Store
              </h2>
              <p className="text-xs text-slate-500">
                Revert item status back to active <strong className="text-indigo-600">Stored</strong> inventory
              </p>
            </div>
          </div>
          <button
            id="btn-close-return-modal"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleConfirmReturn} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Target Item Details Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {item.code}
                </span>
              </div>
              <Badge status={item.status} />
            </div>

            <div>
              <h3
                className="text-sm font-bold text-slate-900 capitalize"
                style={{ textTransform: 'capitalize' }}
              >
                {item.itemName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                {item.description || 'No description provided.'}
              </p>
            </div>

            {/* Handover Specific Info */}
            {isHandedOver && handoverDetails && (
              <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500">
                    <User className="w-3.5 h-3.5" /> Receiver:
                  </span>
                  <span className="font-semibold text-slate-900">{handoverDetails.receiverName}</span>
                </div>
                {handoverDetails.contactNumber && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3.5 h-3.5" /> Contact:
                    </span>
                    <span className="font-medium text-slate-800">{handoverDetails.contactNumber}</span>
                  </div>
                )}
                {handoverDetails.handoverDate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> Date:
                    </span>
                    <span className="font-medium text-slate-800">{handoverDetails.handoverDate}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Notice Alert / Expiration Banner */}
          {!is24hValid ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">24-Hour Window Expired:</span> This item was handed over more than 24 hours ago. According to policy, items cannot be returned to store after 24 hours of guest handover.
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">24-Hour Return Window Active:</span> Returning this item will clear its Handover record, unlock Edit and Delete capabilities, and safely place it back into active <strong>Stored</strong> inventory. This option expires 24 hours post-handover.
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason for Return <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="input-return-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Guest returned wrong item / Handover cancelled"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {/* Quick Reason Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    reason === preset
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Authorization Sign-off */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authorized Admin:</span>
            </div>
            <span className="font-bold text-slate-800">
              {user?.name || 'MD ABU SAYEED RIDAY'}
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-return-to-store"
              disabled={isSubmitting || !is24hValid}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs hover:shadow transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Returning to Store...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm Return to Store</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
