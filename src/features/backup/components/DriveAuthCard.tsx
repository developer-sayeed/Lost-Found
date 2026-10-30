import React from 'react';
import { Folder, Key, ExternalLink, RefreshCw, Check, AlertTriangle, Copy } from 'lucide-react';
import { GoogleDriveAuthState, DEFAULT_BACKUP_FOLDER_NAME } from '../../../lib/googleDriveBackup';

interface DriveAuthCardProps {
  authState: GoogleDriveAuthState;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  showTokenInput: boolean;
  setShowTokenInput: React.Dispatch<React.SetStateAction<boolean>>;
  manualToken: string;
  setManualToken: (val: string) => void;
  isConnectingToken: boolean;
  onConnectWithToken: () => Promise<void>;
  authError: string | null;
  copiedHost: boolean;
  onCopyHost: () => void;
}

export const DriveAuthCard: React.FC<DriveAuthCardProps> = ({
  authState,
  isConnecting,
  onConnect,
  onDisconnect,
  showTokenInput,
  setShowTokenInput,
  manualToken,
  setManualToken,
  isConnectingToken,
  onConnectWithToken,
  authError,
  copiedHost,
  onCopyHost
}) => {
  return (
    <div className="bg-slate-50/80 dark:bg-[#180F1A] rounded-2xl border border-slate-200/80 dark:border-fuchsia-900/30 p-5 sm:p-6 space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#120815] border border-slate-200 dark:border-fuchsia-900/40 flex items-center justify-center shadow-2xs shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M17 6L4 29l8 13 13-23z" />
              <path fill="#FF3D00" d="M31 6H17l13 23h14z" />
              <path fill="#4CAF50" d="M4 29l7 13h26l-7-13z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Google Drive Connection</h3>
              {(authState.isConnected || authState.isAuthenticated) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Connected • Auto-Refreshed
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-fuchsia-950/70 text-slate-700 dark:text-fuchsia-300 border border-slate-300/80 dark:border-fuchsia-800/50 shadow-2xs">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {(authState.isConnected || authState.isAuthenticated) && authState.user
                ? `Signed in as ${authState.user.displayName || 'Google Account'} (${authState.user.email || 'No email'})`
                : 'Connect your Google Drive account with permission to store and manage encrypted hotel backup snapshots.'}
            </p>
            {(authState.isConnected || authState.isAuthenticated) && (
              <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-600 dark:text-slate-300">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Target Folder: <strong>{DEFAULT_BACKUP_FOLDER_NAME}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {(authState.isConnected || authState.isAuthenticated) ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onConnect}
                disabled={isConnecting}
                className="gsi-material-button"
                style={{ height: '42px', borderRadius: '12px' }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isConnecting ? 'Connecting...' : 'Sign in with Google Drive'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowTokenInput(prev => !prev)}
                className="px-3.5 py-2.5 bg-white dark:bg-[#180F1A] hover:bg-slate-100 dark:hover:bg-[#251329] border border-slate-300 dark:border-fuchsia-900/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Connect directly using a Google OAuth Access Token without domain restrictions"
              >
                <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-fuchsia-400" />
                <span>{showTokenInput ? 'Hide Token Input' : 'Connect via Token'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direct Token Input Panel */}
      {showTokenInput && !authState.isAuthenticated && (
        <div className="p-4 bg-indigo-50/80 dark:bg-[#1c0f20] border border-indigo-200 dark:border-fuchsia-900/40 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-indigo-600 dark:text-fuchsia-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Google Access Token Connection</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-fuchsia-950/60 text-indigo-700 dark:text-fuchsia-300 border border-transparent dark:border-fuchsia-800/30">
                Localhost Friendly
              </span>
            </div>
            <a
              href="https://developers.google.com/oauthplayground"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-indigo-600 dark:text-fuchsia-400 hover:text-indigo-800 dark:hover:text-fuchsia-300 hover:underline flex items-center space-x-1"
            >
              <span>OAuth 2.0 Playground</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            When testing locally (or if your domain is not authorized in Firebase Console), you can paste any Google OAuth access token with Drive File scope (<code>https://www.googleapis.com/auth/drive.file</code>) to connect immediately without domain restrictions.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="password"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste Google Access Token (ya29.a0...)"
              className="flex-1 px-3 py-2 bg-white dark:bg-[#140816] border border-indigo-200 dark:border-fuchsia-900/40 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onConnectWithToken}
              disabled={isConnectingToken || !manualToken.trim()}
              className="px-4 py-2 btn-primary-gradient disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center space-x-1.5"
            >
              {isConnectingToken ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Connect Token</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Auth Error */}
      {authError && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 rounded-xl text-xs space-y-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  {authError.includes('unauthorized-domain')
                    ? 'Firebase Domain Authorization Required (auth/unauthorized-domain)'
                    : authError.includes('popup') || authError.includes('blocked')
                    ? 'Popup Window Blocked by Browser'
                    : 'Google Drive Authentication Notice'}
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {authError}
                </p>
              </div>
            </div>

            {(authError.includes('popup') || authError.includes('blocked')) && !authError.includes('unauthorized-domain') && (
              <div className="p-3.5 bg-white dark:bg-[#180F1A] rounded-xl border border-rose-200/90 dark:border-rose-900/40 space-y-2 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
                <p className="font-semibold text-slate-900 dark:text-white">How to allow Google Sign-in popup:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Look for the <strong>Pop-up blocked</strong> icon in your browser URL / address bar (right side).</li>
                  <li>Click it and select <strong>"Always allow pop-ups and redirects"</strong>, then click Done.</li>
                  <li>Or click the <strong>"Connect via Token"</strong> button above to connect directly without any popups.</li>
                </ul>
              </div>
            )}

            {authError.includes('unauthorized-domain') && (
              <div className="p-3.5 bg-white dark:bg-[#180F1A] rounded-xl border border-rose-200/90 dark:border-rose-900/40 space-y-3 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-fuchsia-900/20">
                  <span className="font-bold text-slate-900 dark:text-white">Option 1: Add domain to Firebase Console</span>
                  <button
                    type="button"
                    onClick={onCopyHost}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer w-fit"
                  >
                    {copiedHost ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-rose-700 dark:text-rose-400" />}
                    <span>{copiedHost ? 'Copied to Clipboard!' : `Copy Host "${window.location.hostname || 'localhost'}"`}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-fuchsia-400 font-semibold underline">Firebase Console</a> and select your project.</li>
                  <li>Navigate to <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.</li>
                  <li>Click <strong>Add domain</strong> and enter: <code className="bg-slate-100 dark:bg-[#251329] px-1.5 py-0.5 rounded font-mono text-rose-700 dark:text-rose-400 font-bold">{window.location.hostname || 'localhost'}</code></li>
                  <li>Wait ~30 seconds for Firebase rules to apply, then click <strong>Sign in with Google Drive</strong>.</li>
                </ol>

                <div className="pt-2 border-t border-slate-100 dark:border-fuchsia-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Option 2: Instant Connection without Firebase Console changes</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(true)}
                    className="px-3 py-1 btn-primary-gradient text-white rounded-lg text-xs font-bold transition-all cursor-pointer w-fit"
                  >
                    Paste Access Token Below
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
