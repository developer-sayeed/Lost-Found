import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, CheckCircle2, X, AlertTriangle, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline, isSyncPaused, checkConnection, triggerSettingsSync } = useApp();
  const { t, isRTL } = useLanguage();

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const [checkResultMsg, setCheckResultMsg] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  // Track previous connection state to detect online transition
  const prevOnlineRef = useRef<boolean>(isOnline);
  const syncRef = useRef(triggerSettingsSync);

  useEffect(() => {
    syncRef.current = triggerSettingsSync;
  });

  useEffect(() => {
    if (prevOnlineRef.current === false && isOnline === true) {
      // Just came back online
      setShowRestoredNotice(true);
      setIsDismissed(false);
      setOfflineSince(null);
      setCheckResultMsg(null);

      // Trigger sync
      syncRef.current?.().catch(() => {});

      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (prevOnlineRef.current === true && isOnline === false) {
      // Just went offline
      setShowRestoredNotice(false);
      setIsDismissed(false);
      setOfflineSince(new Date());
    }

    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Handle manual connection re-check
  const handleCheckConnection = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setCheckResultMsg(null);

    try {
      const online = await checkConnection();
      if (!online) {
        setCheckResultMsg(isRTL ? 'لا يزال الاتصال غير متاح' : 'Still offline');
        setTimeout(() => setCheckResultMsg(null), 3000);
      }
    } catch {
      setCheckResultMsg(isRTL ? 'تعذر الاتصال بالخادم' : 'Connection failed');
      setTimeout(() => setCheckResultMsg(null), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  // Format relative offline duration
  const getOfflineDurationText = () => {
    if (!offlineSince) return null;
    const seconds = Math.floor((Date.now() - offlineSince.getTime()) / 1000);
    if (seconds < 60) return isRTL ? 'منذ لحظات' : 'just now';
    const minutes = Math.floor(seconds / 60);
    return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  };

  const isVisible = (isSyncPaused && !isDismissed) || showRestoredNotice;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="network-status-banner"
            role="status"
            aria-live="polite"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full overflow-hidden border-b z-40 transition-colors ${
              showRestoredNotice
                ? 'bg-emerald-50/95 border-emerald-200/90 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-800/60 dark:text-emerald-100'
                : 'bg-amber-50/95 border-amber-200/80 text-amber-900 dark:bg-amber-950/80 dark:border-amber-800/60 dark:text-amber-100'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Left side: Icon & Informative Status Message */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                  {showRestoredNotice ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="relative w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <WifiOff className="w-4 h-4" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                        {showRestoredNotice ? t.onlineRestored : t.offlineMode}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200/50 dark:border-amber-800/40">
                        {showRestoredNotice ? (
                          <>
                            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                            <span>{isRTL ? 'استؤنفت المزامنة' : 'Sync Resumed'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{t.offlineSyncPaused}</span>
                          </>
                        )}
                      </span>
                      {!showRestoredNotice && offlineSince && (
                        <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium">
                          ({getOfflineDurationText()})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-1 sm:line-clamp-none">
                      {showRestoredNotice ? t.onlineSyncResumed : t.offlineNoticeDescription}
                    </p>
                  </div>
                </div>

                {/* Right side: Action Controls (Retry & Minimize) */}
                {!showRestoredNotice && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-center shrink-0">
                    {/* Check Connection Button */}
                    <button
                      type="button"
                      id="btn-retry-network-connection"
                      onClick={handleCheckConnection}
                      disabled={isChecking}
                      className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100/50 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/50 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      title={t.offlineCheckConnection}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-600' : 'text-amber-700 dark:text-amber-300'}`} />
                      <span>
                        {isChecking ? t.offlineCheckingConnection : (checkResultMsg || t.offlineCheckConnection)}
                      </span>
                    </button>

                    {/* Minimize / Dismiss Button */}
                    <button
                      type="button"
                      id="btn-dismiss-offline-banner"
                      onClick={() => setIsDismissed(true)}
                      className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors"
                      title={isRTL ? 'تصغير الإشعار' : 'Minimize banner'}
                      aria-label="Dismiss offline banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-intrusive Floating Pill when banner is dismissed but device remains offline */}
      <AnimatePresence>
        {isSyncPaused && isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 md:bottom-6 right-4 rtl:right-auto rtl:left-4 z-40"
          >
            <button
              type="button"
              id="btn-restore-offline-banner"
              onClick={() => setIsDismissed(false)}
              className="group flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-amber-300 backdrop-blur-md border border-amber-500/30 shadow-lg text-xs font-semibold transition-all hover:scale-102 cursor-pointer"
              title={isRTL ? 'انقر لتوسيع إشعار انقطاع الاتصال' : 'Click to view connection details'}
            >
              <div className="relative">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              </div>
              <span>{isRTL ? 'غير متصل • المزامنة متوقفة' : 'Offline • Sync Paused'}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">
                ({isRTL ? 'توسيع' : 'Details'})
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
