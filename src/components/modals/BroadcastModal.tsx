import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Send,
  Bell,
  Users,
  Building,
  User as UserIcon,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DEPARTMENT_OPTIONS } from '../../lib/constants';

export const BroadcastModal: React.FC = () => {
  const { isBroadcastModalOpen, setIsBroadcastModalOpen, staff, broadcastNotification } = useApp();
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const [targetType, setTargetType] = useState<'all' | 'department' | 'individual' | 'roles'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('Housekeeping');
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('Employee');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [noticeType, setNoticeType] = useState<'notice' | 'alert' | 'system'>('notice');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isBroadcastModalOpen) return null;

  const handleClose = () => {
    setIsBroadcastModalOpen(false);
    setTitle('');
    setMessage('');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage('Please enter both a title and message for the notification.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedStaffObj = staff.find(s => s.name === selectedStaffName || s.id === selectedStaffName);

    try {
      const res = await broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        type: noticeType,
        priority,
        targetType,
        targetDepartment: targetType === 'department' ? selectedDept : undefined,
        targetStaffName: targetType === 'individual' ? (selectedStaffObj?.name || selectedStaffName) : undefined,
        targetStaffEmail: targetType === 'individual' ? selectedStaffObj?.email : undefined,
        targetUserId: targetType === 'individual' ? (selectedStaffObj?.id || selectedStaffObj?.userId) : undefined,
        targetRoles: targetType === 'roles' ? [selectedRole] : undefined
      });

      if (res.success) {
        setSuccessMessage('Notice dispatched successfully in real time!');
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Failed to dispatch notification.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col transition-all ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Send Real-Time Notice / Broadcast
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Instant push alerts to all staff, departments, or individual members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 rtl:space-x-reverse text-emerald-800 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 rtl:space-x-reverse text-rose-800 text-xs font-semibold animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Audience Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  targetType === 'all'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 mb-1 text-indigo-600" />
                <span>All Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('department')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  targetType === 'department'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 mb-1 text-teal-600" />
                <span>Department</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('individual')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  targetType === 'individual'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserIcon className="w-4 h-4 mb-1 text-amber-600" />
                <span>Individual Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('roles')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  targetType === 'roles'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-purple-600" />
                <span>Specific Role</span>
              </button>
            </div>
          </div>

          {/* Department Selection Conditional */}
          {targetType === 'department' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Target Department
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENT_OPTIONS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Individual Staff Selection Conditional */}
          {targetType === 'individual' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Staff Member
              </label>
              <select
                value={selectedStaffName}
                onChange={e => setSelectedStaffName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Staff Member --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.role} - {s.department || 'General'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Selection Conditional */}
          {targetType === 'roles' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Target Role
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Supervisor">Supervisor</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Security">Security</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Employee">Employee (General Staff)</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          {/* Priority and Notice Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Level
              </label>
              <div className="flex gap-2">
                {(['normal', 'high', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : p === 'high'
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notice Classification
              </label>
              <div className="flex gap-2">
                {(['notice', 'alert', 'system'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNoticeType(t)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                      noticeType === t
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notice Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notice / Announcement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. VIP Guest Lost Watch Notice / End of Shift Handover Reminder"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notice Message Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Detailed Message *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter the full announcement text or urgent instruction..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span>Broadcasts deliver immediately without requiring page refresh</span>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim()}
                className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                <span>{isSending ? 'Sending...' : 'Broadcast Notice'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
