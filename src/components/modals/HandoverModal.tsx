import React, { useState, useMemo } from 'react';
import { X, HeartHandshake, User, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';
import {
  handoverValidationSchema,
  validateForm,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses,
  HandoverFormData
} from '../../lib/validationSchema';

export const HandoverModal: React.FC = () => {
  const { isHandoverModalOpen, setIsHandoverModalOpen, selectedItem, handoverItem, openPrint, getValidationMessage } = useApp();
  const { user } = useAuth();
  const [receiverName, setReceiverName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handoverData: HandoverFormData = useMemo(() => ({
    receiverName,
    contactNumber
  }), [receiverName, contactNumber]);

  const validation = useMemo(() => {
    return validateForm(handoverData, handoverValidationSchema);
  }, [handoverData]);

  const { errors, errorList } = validation;

  const handleClose = () => {
    if (isSubmitting) return;
    setIsHandoverModalOpen(false);
    setHasAttemptedSubmit(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isHandoverModalOpen && !!selectedItem,
    closeOnEsc: true
  });

  if (!isHandoverModalOpen || !selectedItem) return null;

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validation.isValid) {
      errorList.forEach(err => {
        toast.warning(err.message, { toastId: `handover-val-${err.field}` });
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await handoverItem(selectedItem.id, {
        receiverName: receiverName.trim(),
        contactNumber: contactNumber.trim() || '0'
      });
      setIsHandoverModalOpen(false);
      setHasAttemptedSubmit(false);
      // Offer immediate handover receipt print
      openPrint(
        {
          ...selectedItem,
          status: 'Handed Over',
          handoverDetails: {
            receiverName: receiverName.trim(),
            contactNumber: contactNumber.trim() || '0',
            handoverDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            handedOverBy: user?.name || 'MD ABU SAYEED RIDAY'
          }
        },
        'receipt'
      );
      setReceiverName('');
      setContactNumber('');
    } catch (e: any) {
      console.error(e);
      toast.error(`❌ Handover failed: ${e?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Handover to Guest
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Item: {selectedItem.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsHandoverModalOpen(false);
              setHasAttemptedSubmit(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleHandover} noValidate className="p-6 space-y-4">
          {/* Top Banner */}
          {hasAttemptedSubmit && errorList.length > 0 && (
            <FormValidationBanner errors={errorList} title="⚠️ Handover Information Required" />
          )}

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div
              className="font-bold text-slate-900 text-sm capitalize"
              style={{ textTransform: 'capitalize' }}
            >
              {selectedItem.itemName || selectedItem.description}
            </div>
            <div className="text-slate-500 mt-1">
              Original Guest: {selectedItem.guestName || 'Unknown'}
            </div>
          </div>

          {/* Receiver Name */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Receiver Name *</span>
            </label>
            <input
              id="input-handover-receiver-name"
              type="text"
              required
              placeholder="Enter receiver's full name"
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              className={getFieldInputClasses(Boolean(errors.receiverName && hasAttemptedSubmit))}
            />
            <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.receiverName : null} />
            <p className="text-[11px] text-slate-400 mt-1">
              Name of the person receiving the item
            </p>
          </div>

          {/* Contact Number */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Contact Number</span>
            </label>
            <input
              id="input-handover-contact"
              type="text"
              placeholder="Enter receiver's phone number"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              className={getFieldInputClasses(Boolean(errors.contactNumber && hasAttemptedSubmit))}
            />
            <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.contactNumber : null} />
            <p className="text-[11px] text-slate-400 mt-1">
              This will be recorded on the digital handover voucher.
            </p>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              id="btn-handover-cancel"
              onClick={() => {
                setIsHandoverModalOpen(false);
                setHasAttemptedSubmit(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-handover-confirm"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
