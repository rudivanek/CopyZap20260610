import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type UIState = 'checking' | 'login' | 'sending' | 'success' | 'error' | 'no_ext_id';

const EXT_CONNECT_KEY = 'cz_ext_connect_id';

async function sendTokenToExtension(extId: string, session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}): Promise<void> {
  // chrome.runtime may not exist outside an extension context
  const cr = (window as any).chrome?.runtime;
  if (!cr?.sendMessage) {
    throw new Error('chrome.runtime not available');
  }
  return new Promise((resolve, reject) => {
    cr.sendMessage(
      extId,
      {
        type: 'COPYZAP_AUTH',
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
      (response: any) => {
        if ((window as any).chrome.runtime.lastError) {
          reject(new Error((window as any).chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      }
    );
  });
}

const ExtensionAuthPage: React.FC = () => {
  const [uiState, setUiState] = useState<UIState>('checking');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const extId = params.get('ext_id');

    if (!extId) {
      setUiState('no_ext_id');
      return;
    }

    // Persist for use after redirect-back login
    sessionStorage.setItem(EXT_CONNECT_KEY, extId);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setUiState('login');
        return;
      }
      setUiState('sending');
      try {
        await sendTokenToExtension(extId, session);
        sessionStorage.removeItem(EXT_CONNECT_KEY);
        setUiState('success');
      } catch {
        setUiState('error');
      }
    });

    // Also handle the case where this page is opened after login redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) return;
      const storedExtId = sessionStorage.getItem(EXT_CONNECT_KEY);
      if (!storedExtId) return;
      setUiState('sending');
      try {
        await sendTokenToExtension(storedExtId, session);
        sessionStorage.removeItem(EXT_CONNECT_KEY);
        setUiState('success');
      } catch {
        setUiState('error');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginClick = () => {
    // Redirect to login; after login the app will redirect back here
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${returnTo}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            CopyZap
          </span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm px-8 py-10 text-center">
          {(uiState === 'checking' || uiState === 'sending') && (
            <>
              <div className="flex justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Connecting...
              </p>
            </>
          )}

          {uiState === 'login' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Log in to connect the Chrome extension
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Sign in to your CopyZap account to authorize the extension.
              </p>
              <button
                onClick={handleLoginClick}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
              >
                Log in to CopyZap
              </button>
            </>
          )}

          {uiState === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Extension connected!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can close this tab.
              </p>
            </>
          )}

          {uiState === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connection failed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Make sure the extension is installed and try again.
              </p>
            </>
          )}

          {uiState === 'no_ext_id' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Missing extension ID
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please re-open this page from the extension.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtensionAuthPage;
