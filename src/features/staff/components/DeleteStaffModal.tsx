import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { StaffMember } from '../../../types';

interface DeleteStaffModalProps {
  staffToDelete: StaffMember | null;
  isDeleting: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  staffToDelete,
  isDeleting,
  modalRef,
  onClose,
  onConfirmDelete
}) => {
  if (!staffToDelete) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop-fade-in"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-modal-slide-down"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Remove Staff Account</h3>
            <p className="text-xs text-slate-500">Administrator Security Confirmation</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Are you sure you want to remove staff member <strong className="text-slate-900">{staffToDelete.name}</strong> ({staffToDelete.userId})? 
          Their system credentials and access rights will be permanently deleted.
        </p>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Department:</span>
            <span className="font-semibold text-slate-800">{staffToDelete.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="font-semibold text-slate-800">{staffToDelete.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-800">{staffToDelete.email}</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Remove</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
