import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  QrCode,
  Download,
  Copy,
  Check,
  Maximize2,
  Tag,
  Share2,
  AlertCircle,
  Trash2,
  HeartHandshake,
  Truck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateItemQrDataUrl, downloadQrCodeImage } from '../../lib/qrcode';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ItemActivityTimeline } from './ItemActivityTimeline';

export const ItemDetailsModal: React.FC = () => {
  const {
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    selectedItem,
    openItemQrModal,
    settings
  } = useApp();
  const { user, isAdmin } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setIsDetailsModalOpen(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isDetailsModalOpen && !!selectedItem,
    closeOnEsc: true
  });

  useEffect(() => {
    if (selectedItem) {
      generateItemQrDataUrl(selectedItem, settings.hotelName, { width: 200, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(e => console.warn('QR code gen failed:', e));
    }
  }, [selectedItem, settings.hotelName]);

  if (!isDetailsModalOpen || !selectedItem) return null;

  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '');
  const isPendingApproval = selectedItem.status === 'Pending Approval' || (selectedItem.isApproved === false && selectedItem.approvalStatus === 'pending');
  const isStored = selectedItem.status === 'Stored';
  const isHandedOver = selectedItem.status === 'Handed Over';
  const isDispatched = selectedItem.status === 'Dispatched';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-900">
              Inventory Item Details
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${
                selectedItem.isDeleted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isPendingApproval
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isStored
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : isHandedOver
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}
            >
              {selectedItem.isDeleted ? 'Removed Item (Trash)' : selectedItem.status}
            </span>
          </div>

          <button
            onClick={() => setIsDetailsModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Soft-Deleted Notice Banner */}
        {selectedItem.isDeleted && (
          <div className="bg-rose-50/80 border-b border-rose-200/80 px-6 py-3 flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Item removed by <strong>{selectedItem.deletedBy || 'Staff'}</strong> on{' '}
                <strong>{selectedItem.deletedAt ? new Date(selectedItem.deletedAt).toLocaleDateString() : 'recent'}</strong>. Reason:{' '}
                <em>"{selectedItem.deletionReason || 'Removed'}"</em>
              </span>
            </div>
            <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-bold rounded-md uppercase shrink-0 ml-2">
              60-Day Retention
            </span>
          </div>
        )}

        {/* Pending Approval Notice Banner */}
        {isPendingApproval && !selectedItem.isDeleted && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Submitted by <strong>{selectedItem.employeeName}</strong>. Awaiting Admin Approval before active inventory placement.
              </span>
            </div>
            {isAdminTier && (
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-md uppercase shrink-0 ml-2">
                Pending Review
              </span>
            )}
          </div>
        )}

        {/* Content Details Grid */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-xs">
            {/* Code */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Code</div>
              <div className="font-mono font-bold text-indigo-600 text-sm">
                {selectedItem.code}
              </div>
            </div>

            {/* Date Found */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Date Found</div>
              <div className="font-medium text-slate-800">
                {new Date(selectedItem.dateFound).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Item Name (Full width) - Description hidden under item name */}
            <div className="col-span-2">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Item Name</div>
              <div
                className="font-semibold text-slate-900 text-sm capitalize"
                style={{ textTransform: 'capitalize' }}
              >
                {selectedItem.itemName || selectedItem.description || 'Lost Item'}
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Category</div>
              <div className="font-medium text-slate-800">
                {selectedItem.category}
              </div>
            </div>

            {/* Location Found */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Location Found</div>
              <div className="font-medium text-slate-800">
                {selectedItem.locationFound}
              </div>
            </div>

            {/* Guest Name */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Guest Name</div>
              <div className="font-medium text-slate-800">
                {selectedItem.guestName || 'N/A'}
              </div>
            </div>

            {/* Employee Name */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Employee Name</div>
              <div className="font-medium text-slate-800">
                {selectedItem.employeeName}
              </div>
            </div>

            {/* Store Location */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Store Location</div>
              <div className="font-medium text-slate-800">
                {selectedItem.storeLocation}
              </div>
            </div>

            {/* Recorded By */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Recorded By</div>
              <div className="font-medium text-slate-800 uppercase">
                {selectedItem.recordedBy}
              </div>
            </div>

            {/* Dispatch Duration */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Dispatch Duration</div>
              <div className="font-medium text-slate-800">
                {selectedItem.dispatchDurationDays} days
              </div>
            </div>

            {/* Dispatch Deadline */}
            <div>
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Dispatch Deadline</div>
              <div className="font-medium text-slate-800">
                {new Date(selectedItem.dispatchDeadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Handover Specific Info if applicable */}
          {selectedItem.handoverDetails && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-800 flex items-center space-x-1.5">
                <HeartHandshake className="w-4 h-4" />
                <span>Handover Information</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-emerald-950">
                <div>Receiver: <span className="font-semibold">{selectedItem.handoverDetails.receiverName}</span></div>
                <div>Contact: <span className="font-semibold">{selectedItem.handoverDetails.contactNumber}</span></div>
                <div>Date: <span className="font-semibold">{selectedItem.handoverDetails.handoverDate}</span></div>
                <div>Staff: <span className="font-semibold">{selectedItem.handoverDetails.handedOverBy}</span></div>
              </div>
            </div>
          )}

          {/* Dispatch Specific Info if applicable */}
          {selectedItem.dispatchDetails && (
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs space-y-2">
              <div className="font-bold text-sky-800 flex items-center space-x-1.5">
                <Truck className="w-4 h-4" />
                <span>Dispatch Information</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sky-950">
                <div>Release Method: <span className="font-semibold">{selectedItem.dispatchDetails.courierName || selectedItem.dispatchDetails.dispatchedTo || 'Staff Release'}</span></div>
                <div>Reference #: <span className="font-semibold font-mono">{selectedItem.dispatchDetails.trackingNumber || 'N/A'}</span></div>
                <div>Destination: <span className="font-semibold">{selectedItem.dispatchDetails.destination}</span></div>
                <div>Date: <span className="font-semibold">{selectedItem.dispatchDetails.dispatchedDate}</span></div>
              </div>
            </div>
          )}

          {/* Activity & Custody History (Accountability Audit Trail) */}
          <ItemActivityTimeline item={selectedItem} />

          {/* QR Code Tag Card & Instant Verification Block */}
          <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div
              className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-2xs group cursor-pointer shrink-0"
              onClick={() => openItemQrModal(selectedItem)}
              title="Click to enlarge QR Code"
            >
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR tag for ${selectedItem.code}`}
                  className="w-24 h-24 object-contain rounded-lg group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center text-[10px] text-slate-400">
                  <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
                </div>
              )}
              <div className="absolute inset-0 bg-indigo-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-2xs">
                <Maximize2 className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center justify-center sm:justify-start space-x-1">
                    <Tag className="w-3 h-3 text-indigo-600" />
                    <span>Unique QR Inventory Tag</span>
                  </div>
                  <h3 className="font-mono text-xs font-bold text-indigo-700">
                    {selectedItem.code}
                  </h3>
                </div>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 self-center sm:self-auto">
                  Scannable Label
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Scan this unique QR tag with any device or mobile camera to instantly retrieve this item’s live custody and storage details.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => openItemQrModal(selectedItem)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all"
                  title="Enlarge QR Tag"
                >
                  <Maximize2 className="w-3 h-3 text-indigo-600" />
                  <span>Enlarge Tag</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (qrCodeUrl) {
                      downloadQrCodeImage(qrCodeUrl, selectedItem.code, selectedItem.itemName);
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all"
                  title="Download PNG QR Tag"
                >
                  <Download className="w-3 h-3 text-indigo-600" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}/?itemCode=${encodeURIComponent(selectedItem.code)}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all"
                  title="Copy direct verification link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Timestamps footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              Created: {new Date(selectedItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div>
              Updated: {new Date(selectedItem.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* View-Only Mode Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            View-Only Mode
          </span>
          <button
            id="btn-close-details-footer"
            onClick={() => setIsDetailsModalOpen(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
