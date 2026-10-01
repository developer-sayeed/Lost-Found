import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Phone,
  ArrowLeft,
  Copy,
  Check,
  Building,
  Info,
  AlertTriangle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { DEFAULT_TOAST_CONFIG } from '../../types';
import { triggerConfetti } from '../../utils/confetti';

export const AuthModal: React.FC = () => {
  const { loginWithEmail, isLoading, inactivityNotice } = useAuth();
  const { getValidationMessage, settings } = useApp();

  // Credentials input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number | null>(null);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);

  // Countdown timer for 5-minute lockout
  useEffect(() => {
    if (lockoutRemainingSeconds === null || lockoutRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemainingSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          toast.info('🔓 5-minute lockout period has ended. You may now enter your password.');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemainingSeconds]);

  const formatLockoutTimer = (totalSeconds: number | null) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Notify of inactivity session expiry if present
  useEffect(() => {
    if (inactivityNotice) {
      toast.warning(inactivityNotice, {
        toastId: 'inactivity-warning',
        autoClose: 5000
      });
    }
  }, [inactivityNotice]);

  // Database-driven logo resolution
  const dynamicLogoUrl = settings?.loginLogoUrl || settings?.logoUrl;
  const logoWidth = settings?.loginLogoWidth || settings?.logoWidth || 140;
  const logoHeight = settings?.loginLogoHeight || settings?.logoHeight || 48;
  const logoFit = settings?.loginLogoFit || settings?.logoFit || 'contain';

  // Dynamic branding text from database - no default data if not configured
  const brandTitle = settings?.loginPageTitle?.trim() || '';
  const brandSubtitle = settings?.loginPageSubtitle?.trim() || '';
  const brandTagline = settings?.loginPageTagline?.trim() || '';
  const footerText = settings?.loginFooterText?.trim() || '';

  // Dynamic Background and Atmosphere
  const bgStyle = settings?.loginBackgroundStyle || 'luxury-dark';
  const cardBlurEnabled = settings?.loginCardBlur !== false;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Normalize common typographical errors in email domain
    trimmedEmail = trimmedEmail
      .replace(/@(gmai|gmaill|gmial|gmil)\.(cokm|con|cmo|comm|coom|com)$/i, '@gmail.com')
      .replace(/\.(cokm|cmo|con|comm|coom)$/i, '.com');

    // Normalize known typo for Super Admin email
    if (trimmedEmail.toLowerCase() === 'abusayeedriay@gmail.com') {
      trimmedEmail = 'abusayeedriday@gmail.com';
    }

    // 1. Dynamic Validation for empty ID
    if (!trimmedEmail) {
      const msg = getValidationMessage('valLoginId', 'Please enter your Staff ID or registered Email address.');
      toast.warning(msg, {
        position: settings?.toastConfig?.position || 'top-right'
      });
      const idField = document.getElementById('auth-id-input');
      idField?.focus();
      return;
    }

    // 2. Dynamic Validation for empty Password
    if (!trimmedPassword) {
      const msg = getValidationMessage('valLoginPassword', 'Please enter your password to validate dashboard access.');
      toast.warning(msg, {
        position: settings?.toastConfig?.position || 'top-right'
      });
      const pwdField = document.getElementById('auth-password-input');
      pwdField?.focus();
      return;
    }

    try {
      const loggedUser = await loginWithEmail(trimmedEmail, trimmedPassword);

      // Customizable Login Success Toast & Celebration
      const toastTemplate =
        settings?.toastConfig?.loginSuccess ||
        DEFAULT_TOAST_CONFIG.loginSuccess ||
        '🔐 Authentication validated. Welcome {name} to {hotel}!';

      const formattedSuccessMsg = toastTemplate
        .replace(/\{name\}/g, loggedUser?.name || 'Staff Member')
        .replace(/\{role\}/g, loggedUser?.role || 'Staff')
        .replace(/\{hotel\}/g, brandTitle || settings?.hotelName || 'Warwick Hotels and Resorts');

      if (settings?.toastConfig?.enableToasts !== false) {
        toast.success(formattedSuccessMsg, {
          position: settings?.toastConfig?.loginSuccessPosition || settings?.toastConfig?.position || 'top-right',
          autoClose: settings?.toastConfig?.loginSuccessAutoClose || settings?.toastConfig?.autoClose || 3500,
          theme: settings?.toastConfig?.theme || 'colored'
        });
      }

      // Trigger celebration confetti if enabled in settings
      if (settings?.toastConfig?.loginSuccessConfetti !== false) {
        triggerConfetti({ count: 70, duration: 2500 });
      }
    } catch (err: any) {
      const customErrorTemplate = settings?.toastConfig?.loginError || DEFAULT_TOAST_CONFIG.loginError;
      const errorMsg = err.message || customErrorTemplate || 'Access Denied: Invalid credentials. Verification failed.';

      if (err.errorType === 'ACCOUNT_LOCKED' || err.lockedUntil || err.remainingSeconds) {
        const secs = err.remainingSeconds || (err.lockedUntil ? Math.max(0, Math.ceil((err.lockedUntil - Date.now()) / 1000)) : 300);
        setLockoutRemainingSeconds(secs);
        setLockoutMessage(err.contactMessage || 'Please contact administration to unlock or verify credentials.');
        toast.error(errorMsg, {
          position: settings?.toastConfig?.position || 'top-right',
          autoClose: 7000,
          theme: settings?.toastConfig?.theme || 'colored'
        });
        return;
      }

      toast.error(errorMsg, {
        position: settings?.toastConfig?.position || 'top-right',
        autoClose: 5000,
        theme: settings?.toastConfig?.theme || 'colored'
      });

      // Focus input on password rejection
      if (err.errorType === 'INVALID_PASSWORD' || errorMsg.toLowerCase().includes('password')) {
        const pwdField = document.getElementById('auth-password-input');
        pwdField?.focus();
      } else {
        const idField = document.getElementById('auth-id-input');
        idField?.focus();
      }
    }
  };

  const handleCopyAdminEmail = () => {
    const adminEmail = settings?.loginSupportEmail || settings?.emailAddress || 'admin@warwickhotels.com';
    navigator.clipboard.writeText(adminEmail);
    setCopiedContact(true);
    toast.info('📋 Admin contact email copied to clipboard!');
    setTimeout(() => setCopiedContact(false), 3000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
        cardBlurEnabled ? 'backdrop-blur-md' : ''
      } ${
        bgStyle === 'luxury-dark'
          ? 'bg-slate-950/85'
          : bgStyle === 'royal-indigo'
          ? 'bg-gradient-to-br from-slate-950/95 via-indigo-950/90 to-slate-900/95'
          : bgStyle === 'hotel-emerald'
          ? 'bg-gradient-to-br from-slate-950/95 via-emerald-950/90 to-slate-900/95'
          : bgStyle === 'minimal-clean'
          ? 'bg-slate-200/90'
          : 'bg-slate-950/85'
      }`}
      style={{
        backgroundColor: bgStyle === 'custom-color' ? settings?.loginBgColor || '#020617' : undefined,
        backgroundImage:
          bgStyle === 'custom-image' && settings?.loginBgImageUrl ? `url("${settings.loginBgImageUrl}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dimming overlay if custom image is used */}
      {bgStyle === 'custom-image' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs pointer-events-none" />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10">
        {/* Dynamic Brand Header */}
        <div
          className="text-white p-7 text-center border-b border-slate-800 relative transition-colors"
          style={{ backgroundColor: settings?.loginHeaderBgColor || '#020617' }}
        >
          {/* Dynamic Logo from Database */}
          {dynamicLogoUrl && !logoLoadError ? (
            <div className="flex justify-center mb-3">
              <div
                className="flex items-center justify-center overflow-hidden transition-all rounded-xl"
                style={{
                  width: `${logoWidth}px`,
                  height: `${logoHeight}px`,
                  maxWidth: '100%'
                }}
              >
                <img
                  src={dynamicLogoUrl}
                  alt={brandTitle || 'Hotel Logo'}
                  className="w-full h-full transition-all"
                  style={{
                    objectFit: logoFit,
                    maxWidth: `${logoWidth}px`,
                    maxHeight: `${logoHeight}px`
                  }}
                  onError={() => {
                    setLogoLoadError(true);
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : null}

          {/* Dynamic Titles - only render if set by admin */}
          {brandTitle && (
            <div className="font-serif tracking-widest text-xl font-bold uppercase mt-1 text-white">
              {brandTitle}
            </div>
          )}
          {brandSubtitle && (
            <div className="text-xs tracking-[0.25em] text-indigo-400 uppercase font-semibold mt-0.5">
              {brandSubtitle}
            </div>
          )}
          {brandTagline && (
            <div className="text-[10px] tracking-wider text-slate-400 mt-1 uppercase font-medium">
              {brandTagline}
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {showForgotModal ? (
            <div className="space-y-4 animate-fade-in" id="auth-forgot-password-view">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-center space-y-2">
                <div className="w-11 h-11 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Contact Hotel Administrator to Reset Password
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                  For hotel security and staff identity protection, password resets are handled by an Administrator. Contact your hotel supervisor or manager to update your credentials.
                </p>
              </div>

              {/* Admin Contact Information Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-2.5 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{brandTitle} — Admin Desk</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-750">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{settings?.loginSupportEmail || settings?.emailAddress || 'warwickhotelbaha@gmail.com'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAdminEmail}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                    title="Copy admin email"
                  >
                    {copiedContact ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{settings?.loginSupportPhone || settings?.phoneNumber || '017 512 2070'}</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-back-to-login"
                onClick={() => setShowForgotModal(false)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic Inactivity Session Notice */}
              {inactivityNotice && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Security Notice</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">{inactivityNotice}</p>
                  </div>
                </div>
              )}

              {/* Dynamic Announcement or Security Banner configured in Admin Dashboard */}
              {settings?.loginBannerNotice && settings?.loginBannerType !== 'none' && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 ${
                    settings.loginBannerType === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                      : settings.loginBannerType === 'shield'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200'
                      : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
                  }`}
                >
                  {settings.loginBannerType === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : settings.loginBannerType === 'shield' ? (
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{settings.loginBannerNotice}</span>
                </div>
              )}

              {/* Account Lockout Banner */}
              {lockoutRemainingSeconds !== null && lockoutRemainingSeconds > 0 && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 space-y-2 animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Security Alert: Account Temporarily Blocked (5 Minutes)</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                    {lockoutMessage || 'Account blocked due to repeated invalid password attempts. Please wait for the lockout timer to expire or contact hotel administration.'}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Unlocks in: {formatLockoutTimer(lockoutRemainingSeconds)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white underline cursor-pointer"
                    >
                      Contact Administration
                    </button>
                  </div>
                </div>
              )}

              {/* Secure Login Form */}
              <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
                <div>
                  <label htmlFor="auth-id-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Staff ID or Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-id-input"
                      type="text"
                      autoFocus
                      autoComplete="username"
                      placeholder="Enter your Staff ID or Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isLoading || (lockoutRemainingSeconds !== null && lockoutRemainingSeconds > 0)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {settings?.showForgotPasswordHelp !== false && (
                      <button
                        type="button"
                        id="btn-auth-forgot-password"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading || (lockoutRemainingSeconds !== null && lockoutRemainingSeconds > 0)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-0.5 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading || (lockoutRemainingSeconds !== null && lockoutRemainingSeconds > 0)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Pass...</span>
                    </>
                  ) : lockoutRemainingSeconds !== null && lockoutRemainingSeconds > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Locked ({formatLockoutTimer(lockoutRemainingSeconds)})</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Validate &amp; Enter Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Dynamic Footer Security Gateway Text - only render if set by admin */}
          {footerText && (
            <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
              {footerText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
