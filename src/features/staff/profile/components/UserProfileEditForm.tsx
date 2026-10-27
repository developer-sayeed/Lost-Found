import React from 'react';
import { Edit3, Lock, AlertCircle, Save } from 'lucide-react';
import {
  FieldError,
  FormErrors,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses
} from '../../../../lib/validationSchema';

export interface EditFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  iqamaNumber: string;
  staffId: string;
  workplace: string;
  department: string;
  position: string;
  emergencyContact: string;
}

interface UserProfileEditFormProps {
  editFormData: EditFormData;
  setEditFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
  errors: FormErrors<EditFormData>;
  hasAttemptedSubmit: boolean;
  hasDuplicateError: boolean;
  errorList: FieldError[];
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export const UserProfileEditForm: React.FC<UserProfileEditFormProps> = ({
  editFormData,
  setEditFormData,
  errors,
  hasAttemptedSubmit,
  hasDuplicateError,
  errorList,
  isSaving,
  onSubmit,
  onCancel
}) => {
  return (
    <form onSubmit={onSubmit} noValidate className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50/50">
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Edit Profile Information</span>
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer p-1"
        >
          Cancel
        </button>
      </div>

      {/* Top Distinct Validation Errors Banner */}
      {(hasDuplicateError || hasAttemptedSubmit) && (
        <FormValidationBanner errors={errorList} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={editFormData.name}
            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
            className={getFieldInputClasses(Boolean(errors.name && hasAttemptedSubmit))}
          />
          <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.name : null} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Locked)</label>
          <input
            type="email"
            required
            disabled
            value={editFormData.email}
            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
            className={errors.email ? getFieldInputClasses(true) : 'w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 text-slate-500 bg-slate-100 cursor-not-allowed select-none min-h-[44px] sm:min-h-0'}
          />
          {errors.email ? (
            <FormFieldErrorMessage error={errors.email} />
          ) : (
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>Email is permanently locked and managed by Admin.</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Contact</label>
          <input
            type="text"
            value={editFormData.phone}
            onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
            className={getFieldInputClasses(Boolean(errors.phone))}
          />
          <FormFieldErrorMessage error={errors.phone} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={editFormData.dateOfBirth}
            onChange={e => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Iqama / National ID</label>
          <input
            type="text"
            value={editFormData.iqamaNumber}
            onChange={e => setEditFormData({ ...editFormData, iqamaNumber: e.target.value })}
            className={getFieldInputClasses(Boolean(errors.iqamaNumber))}
          />
          <FormFieldErrorMessage error={errors.iqamaNumber} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Staff ID Code *</label>
          <input
            type="text"
            value={editFormData.staffId}
            onChange={e => setEditFormData({ ...editFormData, staffId: e.target.value })}
            className={getFieldInputClasses(Boolean(errors.staffId))}
          />
          <FormFieldErrorMessage error={errors.staffId} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Workplace / Hotel Location</label>
          <input
            type="text"
            value={editFormData.workplace}
            onChange={e => setEditFormData({ ...editFormData, workplace: e.target.value })}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
          <select
            value={editFormData.department}
            onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
          >
            <option value="Housekeeping">Housekeeping</option>
            <option value="Front Desk">Front Desk</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Security">Security</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position / Title</label>
          <input
            type="text"
            value={editFormData.position}
            onChange={e => setEditFormData({ ...editFormData, position: e.target.value })}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact / Notes</label>
          <input
            type="text"
            placeholder="e.g. +966 50 999 8888 (Brother/Manager)"
            value={editFormData.emergencyContact}
            onChange={e => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
            className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:space-x-3 pt-4 border-t border-slate-200">
        <div>
          {hasDuplicateError && (
            <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span>Please resolve duplicate database conflicts before saving profile.</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-end gap-2.5 sm:space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer min-h-[44px] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || hasDuplicateError}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 sm:py-2 btn-primary-gradient text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Data'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
