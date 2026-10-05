import React, { useState, useEffect } from 'react';
import {
  X,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  Package,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { LostItem } from '../../types';

interface RejectSubmissionModalProps {
  isOpen: boolean;
  item: LostItem | null;
  onClose: () => void;
  onConfirmReject: (itemId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Item details incomplete or inaccurate',
  'Duplicate entry / already registered in storage',
  'Not a hotel lost property (guest personal item)',
  'Item damaged, broken, or unidentifiable',
  'Item was already claimed or returned to guest',
  'Found location or date could not be verified'
];

export const RejectSubmissionModal: React.FC<RejectSubmissionModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmReject
}) => {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedPreset(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const submitterName =
    item.submittedByStaffName ||
    item.employeeName ||
    (item.recordedBy && item.recordedBy !== 'Pending Approval' ? item.recordedBy : '') ||
    'Submitting Staff';

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setReason(preset);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Please provide a reason explaining why this submission is being rejected.');
      return;
    }
    if (trimmedReason.length < 4) {
      setError('Please provide a meaningful explanation (minimum 4 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmReject(item.id, trimmedReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-reject-submission-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="modal-reject-submission"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 bg-rose-50/80 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950 dark:text-rose-200 leading-tight">
                Reject Item Submission
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Tracking Code: <span className="font-mono font-bold">{item.code}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Notification Alert Info Box */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              When rejected, an instant high-priority notification will be sent directly to{' '}
              <strong className="text-slate-900 dark:text-white">{submitterName}</strong> with your specified rejection reason.
            </div>
          </div>

          {/* Item Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
                <Package className="w-4 h-4 text-indigo-500" />
                <span>{item.itemName || 'Lost Item'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                Pending Approval
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted by: <strong className="text-slate-700 dark:text-slate-200">{submitterName}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{item.locationFound || 'Hotel premises'}</span>
              </div>
            </div>
          </div>

          {/* Preset Quick Reasons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quick Preset Reasons:
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Click to auto-fill
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map(preset => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left font-medium ${
                      isSelected
                        ? 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 hover:text-rose-700'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1 text-rose-600" />}
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rejection Reason Input */}
          <div>
            <label
              htmlFor="rejection-reason-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Detailed Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rejection-reason-input"
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Explain clearly why this submission was rejected. The staff member will see this in their notification..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all resize-none shadow-2xs"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>{reason.trim().length} characters</span>
              <span>This explanation will be permanently recorded in item audit history.</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rejecting & Notifying...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Reject Submission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
