import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:from-amber-700 hover:to-amber-800 transition active:scale-95 ${className}`}
        title="Install Warwick Lost & Found App"
      >
        <Download className="w-4 h-4 text-amber-100" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition active:scale-95 ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center text-amber-600 font-bold">
                    W
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Install Warwick Lost &amp; Found
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button (box with an arrow pointing up) in the Safari toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p>
                    The app will launch full-screen with offline caching enabled!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-95 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
