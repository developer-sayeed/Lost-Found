import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Building,
  ShieldAlert,
  Send,
  HelpCircle,
  Eye,
  Info,
  Layers,
  Save,
  PartyPopper,
  LogIn
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ToastConfig, ValidationMessagesConfig, DEFAULT_TOAST_CONFIG, DEFAULT_VALIDATION_MESSAGES } from '../types';
import { toast } from 'react-toastify';
import { triggerConfetti } from '../utils/confetti';

export const AlertsValidationSettings: React.FC = () => {
  const { settings, updateSettings, showCustomToast } = useApp();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin';
  const isManager = ['Manager', 'Admin'].includes(user?.role || '');
  const canEdit = isSuperAdmin || isManager;

  // Active sub-section
  const [subSection, setSubSection] = useState<'toasts' | 'validations' | 'performance'>('toasts');

  // Local Toast Configuration State
  const [toastConfig, setToastConfig] = useState<ToastConfig>(() => ({
    ...DEFAULT_TOAST_CONFIG,
    ...(settings.toastConfig || {})
  }));

  // Local Validation Messages State
  const [validationMessages, setValidationMessages] = useState<ValidationMessagesConfig>(() => ({
    ...DEFAULT_VALIDATION_MESSAGES,
    ...(settings.validationMessages || {})
  }));

  // Performance Page Chart Toggle State
  const [showDeptShare, setShowDeptShare] = useState<boolean>(() => {
    return Boolean(settings.showDepartmentProcessingShare);
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Handle Toast Config field change
  const handleToastChange = (key: keyof ToastConfig, value: any) => {
    setToastConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle Validation Message field change
  const handleValidationChange = (key: keyof ValidationMessagesConfig, value: string) => {
    setValidationMessages(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset Toasts to Defaults
  const handleResetToasts = () => {
    setToastConfig({ ...DEFAULT_TOAST_CONFIG });
    toast.info('Toast notifications reset to system defaults. Click "Save Changes" to persist.');
  };

  // Reset Validations to Defaults
  const handleResetValidations = () => {
    setValidationMessages({ ...DEFAULT_VALIDATION_MESSAGES });
    toast.info('Validation messages reset to system defaults. Click "Save Changes" to persist.');
  };

  // Test current Toast settings
  const handleTestToast = (key: keyof ToastConfig = 'itemRegistered', type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    let template = (toastConfig[key] as string) || (DEFAULT_TOAST_CONFIG[key] as string) || 'Test Notification!';
    template = template
      .replace(/\{code\}/g, 'WH-2026-089')
      .replace(/\{name\}/g, user?.name || 'MD ABU SAYEED RIDAY')
      .replace(/\{receiver\}/g, 'John Smith (Room 504)')
      .replace(/\{count\}/g, '3')
      .replace(/\{role\}/g, user?.role || 'Super Admin')
      .replace(/\{hotel\}/g, settings.loginPageTitle || settings.hotelName || 'Warwick Hotels and Resorts');

    if (toastConfig.enableToasts === false) {
      toast.warning('⚠️ Toast alerts are currently DISABLED in settings! Enable them above to show alerts.', {
        position: toastConfig.position || 'top-right',
        autoClose: toastConfig.autoClose || 4000
      });
      return;
    }

    if (key === 'loginSuccess' && toastConfig.loginSuccessConfetti !== false) {
      triggerConfetti({ count: 70, duration: 2500 });
    }

    const testPosition =
      key === 'loginSuccess' && toastConfig.loginSuccessPosition
        ? toastConfig.loginSuccessPosition
        : toastConfig.position || 'top-right';

    const testDuration =
      key === 'loginSuccess' && toastConfig.loginSuccessAutoClose
        ? toastConfig.loginSuccessAutoClose
        : toastConfig.autoClose || 4000;

    toast[type](template, {
      position: testPosition,
      autoClose: testDuration,
      theme: toastConfig.theme || 'colored'
    });
  };

  // Save all settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        toastConfig,
        validationMessages,
        showDepartmentProcessingShare: showDeptShare
      });
      setSaveStatus('Settings successfully saved & synced across devices!');
      toast.success('⚙️ Toast & validation configurations updated successfully!');
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const TOAST_MESSAGE_FIELDS: { key: keyof ToastConfig; label: string; description: string; type: 'success' | 'info' | 'warning' | 'error' }[] = [
    { key: 'loginSuccess', label: '🔐 Login Authentication Success', description: 'When staff or admin validates credentials and enters the dashboard (supports {name}, {role}, {hotel})', type: 'success' },
    { key: 'loginError', label: '⚠️ Login Authentication Failed', description: 'When incorrect password, invalid staff ID, or unknown account is entered', type: 'error' },
    { key: 'itemRegistered', label: 'Item Registered', description: 'When a new lost item is registered & saved to inventory', type: 'success' },
    { key: 'itemUpdated', label: 'Item Updated', description: 'When existing item details or attributes are edited', type: 'success' },
    { key: 'itemApproved', label: 'Request Approved', description: 'When a staff item submission is reviewed & approved by manager', type: 'success' },
    { key: 'itemRejected', label: 'Request Rejected', description: 'When a staff item submission is rejected', type: 'info' },
    { key: 'itemHandedOver', label: 'Handed Over to Guest', description: 'When an item is returned and handed over to owner/guest', type: 'success' },
    { key: 'itemDispatched', label: 'Item Dispatched / Released', description: 'When an item is dispatched or released to finder/guest', type: 'success' },
    { key: 'itemTrash', label: 'Moved to Removed Items', description: 'When an item is moved to 60-day retention trash', type: 'warning' },
    { key: 'itemDeleted', label: 'Permanently Deleted', description: 'When an item is permanently purged from system', type: 'info' },
    { key: 'itemReturned', label: 'Returned to Stored', description: 'When a disputed or returned item is brought back to Stored', type: 'info' },
    { key: 'itemRestored', label: 'Restored to Active', description: 'When an item is recovered from Removed Items archive', type: 'success' },
    { key: 'batchTrash', label: 'Batch Moved to Trash', description: 'When multiple selected items are sent to Removed Items', type: 'warning' },
    { key: 'batchRestored', label: 'Batch Restored', description: 'When multiple selected items are restored to active inventory', type: 'success' },
    { key: 'batchDispatched', label: 'Batch Dispatched', description: 'When multiple selected items are dispatched in bulk', type: 'success' },
    { key: 'batchDeleted', label: 'Batch Deleted Permanently', description: 'When multiple items are permanently deleted', type: 'info' },
    { key: 'trashEmptied', label: 'Recycle Bin Emptied', description: 'When all items in Removed Items archive are purged', type: 'info' },
    { key: 'offlineSaved', label: 'Offline Mode Saved', description: 'When an item is saved locally while device is disconnected', type: 'info' },
    { key: 'wifiSynced', label: 'Wi-Fi Reconnected & Synced', description: 'When offline items are successfully synced upon reconnection', type: 'success' },
    { key: 'profileUpdated', label: 'Staff Profile Updated', description: 'When user updates personal profile or contact details', type: 'success' },
    { key: 'staffSaved', label: 'Staff Member Saved', description: 'When a staff account is added or modified', type: 'success' },
    { key: 'staffDeleted', label: 'Staff Member Removed', description: 'When a staff member is deleted from directory', type: 'info' }
  ];

  const VALIDATION_MESSAGE_FIELDS: { key: keyof ValidationMessagesConfig; label: string; description: string }[] = [
    { key: 'valItemName', label: 'Item Title / Name Required', description: 'Prompted if item title or name is left empty' },
    { key: 'valCategory', label: 'Category Selection Required', description: 'Prompted if category is not selected' },
    { key: 'valLocation', label: 'Room / Location Required', description: 'Prompted if room number or location found is empty' },
    { key: 'valFinder', label: 'Finder Staff Name Required', description: 'Prompted if finder name or employee is omitted' },
    { key: 'valReceiver', label: 'Guest / Receiver Name Required', description: 'Prompted if receiver name is left empty during handover' },
    { key: 'valStaffName', label: 'Staff Full Name Required', description: 'Prompted when creating or editing staff without a name' },
    { key: 'valStaffEmail', label: 'Staff Email Required', description: 'Prompted if staff email address is omitted' },
    { key: 'valStaffEmailInvalid', label: 'Invalid Email Format', description: 'Prompted if email does not match standard email syntax' },
    { key: 'valStaffPassword', label: 'Staff Password Required', description: 'Prompted when creating a new staff account without password' },
    { key: 'valLoginId', label: 'Login ID / Email Required', description: 'Prompted on login screen if username or ID is blank' },
    { key: 'valLoginPassword', label: 'Login Password Required', description: 'Prompted on login screen if password field is blank' },
    { key: 'valLockedItem', label: 'Handed Over Item Delete Restriction', description: 'Warning that Handed Over / Claimed items are locked from deletion' },
    { key: 'valRejectionReason', label: 'Rejection Reason Required', description: 'Prompted if manager rejects item without giving reason' },
    { key: 'valNotifStaffDelete', label: 'Notification Delete Staff Restriction', description: 'Enforced restriction that only Admin/Supervisor can delete notifications' }
  ];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in" id="alerts-validation-settings-container">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Alerts, Toasts & Validation Controls</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Admin Managed
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Customize every react-toastify action popup, form validation notice, and performance dashboard display.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestToast('itemRegistered', 'success')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Test current toast alert configuration"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Test Toast</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setSubSection('toasts')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subSection === 'toasts'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>React-Toastify Actions & Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setSubSection('validations')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subSection === 'validations'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Form Validation Messages</span>
          </button>

          <button
            type="button"
            onClick={() => setSubSection('performance')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subSection === 'performance'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Performance Page Display Options</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: REACT-TOASTIFY SETTINGS */}
      {subSection === 'toasts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Master Toast Behavior Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Global Toast Notification Behavior</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure positioning, duration, and visual theme for all pop-up toast alerts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToasts}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                title="Reset all toast messages and settings to system defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Enable / Disable Toasts */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Toast System Status</span>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toastConfig.enableToasts !== false}
                    onChange={(e) => handleToastChange('enableToasts', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    {toastConfig.enableToasts !== false ? '✅ Enabled' : '🚫 Disabled'}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">
                  When enabled, action notifications popup on top of the screen.
                </p>
              </div>

              {/* Screen Position */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Screen Position</span>
                <select
                  value={toastConfig.position || 'top-right'}
                  onChange={(e) => handleToastChange('position', e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="top-right">Top Right (Default)</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
                <p className="text-[11px] text-slate-500">Where toasts display on user monitors.</p>
              </div>

              {/* Auto-Close Duration */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Auto-Close Duration: {((toastConfig.autoClose || 4000) / 1000).toFixed(1)}s
                </span>
                <select
                  value={toastConfig.autoClose ?? 4000}
                  onChange={(e) => handleToastChange('autoClose', Number(e.target.value))}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={2000}>2.0 Seconds (Fast)</option>
                  <option value={3000}>3.0 Seconds (Quick)</option>
                  <option value={4000}>4.0 Seconds (Standard)</option>
                  <option value={5000}>5.0 Seconds (Extended)</option>
                  <option value={8000}>8.0 Seconds (Long)</option>
                  <option value={12000}>12.0 Seconds (Persistent)</option>
                </select>
                <p className="text-[11px] text-slate-500">Time before notification dismisses automatically.</p>
              </div>

              {/* Visual Theme */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Visual Theme</span>
                <select
                  value={toastConfig.theme || 'colored'}
                  onChange={(e) => handleToastChange('theme', e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="colored">Colored (Rich Luxury Tones)</option>
                  <option value="light">Light (Clean White Backdrop)</option>
                  <option value="dark">Dark (Deep Charcoal)</option>
                </select>
                <p className="text-[11px] text-slate-500">Aesthetic theme of the toast banner.</p>
              </div>
            </div>
          </div>

          {/* Dedicated Login Success Alert & Confetti Card */}
          <div className="bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 rounded-2xl border border-indigo-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Login Success Alert &amp; Celebration Controls</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      Staff Portal
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control what message appears when staff logs in, with optional confetti particles and dynamic token substitution.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTestToast('loginSuccess', 'success')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  <span>Test Login Toast</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Login Success Message Format
                  </label>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                    <span>Tokens:</span>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{name}'}</code>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{role}'}</code>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{'{hotel}'}</code>
                  </div>
                </div>
                <input
                  type="text"
                  value={(toastConfig.loginSuccess as string) || DEFAULT_TOAST_CONFIG.loginSuccess || ''}
                  onChange={(e) => handleToastChange('loginSuccess', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="🔐 Authentication validated. Welcome {name} to {hotel}!"
                />
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-white space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Celebration Confetti</span>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toastConfig.loginSuccessConfetti !== false}
                    onChange={(e) => handleToastChange('loginSuccessConfetti', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    {toastConfig.loginSuccessConfetti !== false ? '🎉 Confetti Active' : '🚫 No Confetti'}
                  </span>
                </label>
                <p className="text-[10px] text-slate-500">
                  Fires colorful particles across screen upon successful authentication.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Toast Action Messages List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Toast Action & Event Messages</h3>
                <p className="text-xs text-slate-500">
                  Customize the exact wording displayed for each system event. Supported placeholders: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">{'{code}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">{'{name}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">{'{receiver}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">{'{count}'}</code>.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {TOAST_MESSAGE_FIELDS.map((field) => {
                const currentValue = (toastConfig[field.key] as string) || '';
                return (
                  <div key={field.key} className="p-3.5 rounded-xl border border-slate-150 hover:border-slate-300 bg-slate-50/40 transition-all space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{field.label}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({field.description})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestToast(field.key, field.type)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Preview this toast message"
                      >
                        Preview Toast
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleToastChange(field.key, e.target.value)}
                      placeholder={DEFAULT_TOAST_CONFIG[field.key] as string}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: VALIDATION MESSAGES SETTINGS */}
      {subSection === 'validations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Form & Operational Validation Messages</span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure the specific warning and validation text shown when mandatory fields are missing or actions are restricted.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetValidations}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              title="Reset validation messages to system defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {VALIDATION_MESSAGE_FIELDS.map((field) => {
              const currentValue = (validationMessages[field.key] as string) || '';
              return (
                <div key={field.key} className="p-3.5 rounded-xl border border-slate-150 hover:border-slate-300 bg-slate-50/40 transition-all space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{field.label}</span>
                    <span className="text-[11px] text-slate-400">({field.description})</span>
                  </div>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleValidationChange(field.key, e.target.value)}
                    placeholder={DEFAULT_VALIDATION_MESSAGES[field.key] as string}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: PERFORMANCE PAGE DISPLAY OPTIONS */}
      {subSection === 'performance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Staff Processing Performance Page Customization</span>
            </h3>
            <p className="text-xs text-slate-500">
              Control the visibility of analytics widgets and divisional charts on the Supervisor Performance Dashboard.
            </p>
          </div>

          {/* Department Processing Share Toggle Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">
                  Department Processing Share Donut Chart
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${showDeptShare ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {showDeptShare ? 'Currently Visible' : 'Hidden by Default'}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Show or hide the "Department Processing Share" donut chart on the Staff Performance page. When hidden, the Staff Throughput Bar Chart expands across all columns for higher readability.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={showDeptShare}
                onChange={(e) => setShowDeptShare(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Notice for Admin */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Admin Real-Time Control</p>
              <p>
                By default, "Department Processing Share" is hidden to focus on individual staff throughput. You can enable or disable this chart at any time using the toggle above and clicking "Save Changes".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">
          Changes will apply to all staff members and real-time clients upon saving.
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
};
