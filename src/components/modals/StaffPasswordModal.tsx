import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Lock,
  X,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { StaffMember } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  staffPasswordValidationSchema,
  validateForm,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses,
  StaffPasswordFormData
} from '../../lib/validationSchema';

interface StaffPasswordModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStaff: StaffMember) => void;
}

export const StaffPasswordModal: React.FC<StaffPasswordModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { getValidationMessage } = useApp();

  const [mode, setMode] = useState<'random' | 'custom'>('random');
  const [randomPassword, setRandomPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [lastIssuedResult, setLastIssuedResult] = useState<{
    password: string;
    isTemp: boolean;
    expiresAt?: string;
  } | null>(null);

  // Generate a human-readable, secure random password (e.g., WH-749216 or WK#591834)
  const generateRandomKey = () => {
    const prefixes = ['WH', 'WK', 'WARWICK', 'SEC', 'STAFF'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const numPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${numPart}`;
  };

  const passwordFormData: StaffPasswordFormData = useMemo(() => ({
    targetPassword: mode === 'random' ? randomPassword : customPassword
  }), [mode, randomPassword, customPassword]);

  const validation = useMemo(() => {
    return validateForm(passwordFormData, staffPasswordValidationSchema);
  }, [passwordFormData]);

  const { errors, errorList } = validation;

  useEffect(() => {
    if (isOpen) {
      setRandomPassword(generateRandomKey());
      setCustomPassword('');
      setLastIssuedResult(null);
      setCopied(false);
      setHasAttemptedSubmit(false);
    }
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  // Check if staff has active 24-hr temp password
  const hasActiveTempPass =
    staff.isTempPassword &&
    staff.tempPassword &&
    staff.tempPasswordExpiresAt &&
    new Date(staff.tempPasswordExpiresAt).getTime() > Date.now();

  const hasExpiredTempPass =
    staff.isTempPassword &&
    staff.tempPasswordExpiresAt &&
    new Date(staff.tempPasswordExpiresAt).getTime() <= Date.now();

  const handleIssuePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const targetPassword = mode === 'random' ? randomPassword.trim() : customPassword.trim();

    if (!validation.isValid) {
      const firstErr = validation.firstError;
      if (firstErr) {
        toast.warning(firstErr.message);
      }
      return;
    }

    setIsLoading(true);
    try {
      const isTemporary = mode === 'random';
      const res = await api.updateStaffPassword(
        staff.id,
        {
          newPassword: targetPassword,
          isTemporary,
          expiresInHours: 24
        },
        user
      );

      const expiresAt = isTemporary
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const updatedStaffMember: StaffMember = {
        ...staff,
        password: targetPassword,
        isTempPassword: isTemporary,
        tempPassword: isTemporary ? targetPassword : undefined,
        tempPasswordExpiresAt: expiresAt
      };

      setLastIssuedResult({
        password: targetPassword,
        isTemp: isTemporary,
        expiresAt
      });

      onSuccess(res.staff || updatedStaffMember);
      toast.success(
        isTemporary
          ? `🔑 24-hour temporary password generated for ${staff.name}!`
          : `🔑 Permanent password updated for ${staff.name}!`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!lastIssuedResult) return;
    const expiryText = lastIssuedResult.isTemp && lastIssuedResult.expiresAt
      ? `\nValidation: 24 Hours (Expires: ${new Date(lastIssuedResult.expiresAt).toLocaleString()})`
      : '';
    const textToCopy = `Hotel Staff Access Credentials:
Staff Name: ${staff.name}
Staff ID: ${staff.staffId || staff.userId}
Email: ${staff.email}
Password: ${lastIssuedResult.password}${expiryText}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.info('📋 Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-modal-slide-down">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Manage Staff Credentials
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Change password or issue a 24-hour temporary login pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target Staff Summary */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  staff.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{staff.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {staff.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{staff.staffId || staff.userId}</span> • {staff.department}
                </div>
              </div>
            </div>
          </div>

          {/* Current Temporary Password Notice */}
          {hasActiveTempPass && !lastIssuedResult && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Active 24-Hour Temporary Password</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Current temp key: <span className="font-mono font-bold">{staff.tempPassword}</span>
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Expires on {new Date(staff.tempPasswordExpiresAt!).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {hasExpiredTempPass && !lastIssuedResult && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Previous 24-Hour Password Expired</span>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                  The temporary password has expired. Generate a fresh 24-hour key below.
                </p>
              </div>
            </div>
          )}

          {/* Last Issued Success Banner */}
          {lastIssuedResult ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-xs">New Password Active &amp; Stored</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    {lastIssuedResult.isTemp ? '24-Hour Temporary Password' : 'New Permanent Password'}
                  </span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white select-all">
                    {lastIssuedResult.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lastIssuedResult.password);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 cursor-pointer"
                  title="Copy password"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {lastIssuedResult.isTemp && lastIssuedResult.expiresAt && (
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Valid for <strong>24 Hours</strong> (Expires {new Date(lastIssuedResult.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(lastIssuedResult.expiresAt).toLocaleDateString()})
                  </span>
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Complete Staff Message</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleIssuePassword} noValidate className="space-y-4">
              {/* Form Validation Banner */}
              {hasAttemptedSubmit && errorList.length > 0 && (
                <FormValidationBanner errors={errorList} title="⚠️ Password Requirement Not Met" />
              )}

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('random')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    mode === 'random'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Random (24hr Pass)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    mode === 'custom'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Set Custom Password</span>
                </button>
              </div>

              {/* Mode: Random 24-Hr Password */}
              {mode === 'random' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Generated Temporary Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setRandomPassword(generateRandomKey())}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Generate another"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={randomPassword}
                        className="w-full font-mono text-base font-bold text-center tracking-wider py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white select-all shadow-xs"
                      />
                    </div>

                    <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] text-indigo-800 dark:text-indigo-300">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                      <span>
                        Validation rule: <strong>Strict 24-hour expiration</strong>. Ideal for staff who forgot their credentials.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: Custom Password */}
              {mode === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter New Staff Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showCustomPassword ? 'text' : 'password'}
                        placeholder="Min. 4 characters"
                        value={customPassword}
                        onChange={e => setCustomPassword(e.target.value)}
                        className={`${getFieldInputClasses(Boolean(errors.targetPassword && hasAttemptedSubmit))} pl-10 pr-10 font-medium`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomPassword(!showCustomPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                      >
                        {showCustomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.targetPassword : null} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>
                        {mode === 'random' ? 'Issue 24-Hr Password' : 'Save Permanent Password'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
