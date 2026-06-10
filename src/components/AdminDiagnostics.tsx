import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { supabase } from '../services/supabaseClient';

interface PingResponse {
  ok: boolean;
  isAdmin: boolean;
  email?: string;
  method?: 'allowlist' | 'fallback' | 'none';
  timestamp?: string;
  details?: Record<string, any>;
  error?: string;
  message?: string;
}

interface RpcResult {
  success: boolean;
  isAdmin: boolean;
  error?: string;
}

/**
 * Admin Diagnostics Page
 *
 * Read-only diagnostic tool to verify admin authentication is working correctly.
 * This page does NOT modify any permissions or behavior.
 *
 * Shows:
 * - Current user email
 * - Frontend admin check (useIsAdmin hook)
 * - Edge function admin-ping result
 * - Database RPC is_app_admin result
 * - Environment fallback detection
 */
export function AdminDiagnostics() {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<PingResponse | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [rpcResult, setRpcResult] = useState<RpcResult | null>(null);
  const [rpcLoading, setRpcLoading] = useState(false);

  // Check if user is authenticated and get email
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setUserEmail(user.email || null);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Run diagnostics on mount
  useEffect(() => {
    if (!loading && userEmail) {
      runAllDiagnostics();
    }
  }, [loading, userEmail]);

  const callAdminPing = async () => {
    setPingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setPingResult({
          ok: false,
          isAdmin: false,
          error: 'No session found'
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ping`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();
      setPingResult(data);
    } catch (error) {
      setPingResult({
        ok: false,
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setPingLoading(false);
    }
  };

  const callRpcCheck = async () => {
    setRpcLoading(true);
    try {
      const { data, error } = await supabase.rpc('is_app_admin');

      if (error) {
        setRpcResult({
          success: false,
          isAdmin: false,
          error: error.message
        });
      } else {
        setRpcResult({
          success: true,
          isAdmin: !!data
        });
      }
    } catch (error) {
      setRpcResult({
        success: false,
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setRpcLoading(false);
    }
  };

  const runAllDiagnostics = () => {
    callAdminPing();
    callRpcCheck();
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    return status ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Diagnostics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read-only verification of admin authentication system
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current User</p>
              <p className="font-mono text-lg text-gray-900 dark:text-white">
                {userEmail}
              </p>
            </div>
            <button
              onClick={runAllDiagnostics}
              disabled={pingLoading || rpcLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${(pingLoading || rpcLoading) ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </button>
          </div>
        </div>

        {/* Frontend Check */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              1. Frontend Admin Check (useIsAdmin Hook)
            </h2>
            <StatusIcon status={isAdmin} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-semibold ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {isAdmin ? 'Admin' : 'Not Admin'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              <p>This hook calls the database RPC function is_app_admin() to check admin status.</p>
            </div>
          </div>
        </div>

        {/* Edge Function Ping */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              2. Edge Function Check (admin-ping)
            </h2>
            <StatusIcon status={pingResult?.isAdmin ?? null} />
          </div>

          {pingLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : pingResult ? (
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-semibold ${pingResult.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {pingResult.isAdmin ? 'Admin' : 'Not Admin'}
                </span>
              </div>
              {pingResult.method && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Method:</span>
                  <span className="font-mono text-sm">
                    {pingResult.method}
                  </span>
                </div>
              )}
              {pingResult.timestamp && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                  <span className="font-mono text-sm">
                    {new Date(pingResult.timestamp).toLocaleString()}
                  </span>
                </div>
              )}
              {pingResult.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {pingResult.error}
                  </p>
                  {pingResult.message && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {pingResult.message}
                    </p>
                  )}
                </div>
              )}
              {pingResult.details && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Details:
                  </p>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(pingResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Click "Refresh Diagnostics" to test
            </p>
          )}
        </div>

        {/* Database RPC Check */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3. Database RPC Check (is_app_admin)
            </h2>
            <StatusIcon status={rpcResult?.isAdmin ?? null} />
          </div>

          {rpcLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : rpcResult ? (
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-semibold ${rpcResult.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {rpcResult.isAdmin ? 'Admin' : 'Not Admin'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">RPC Success:</span>
                <span className={`font-semibold ${rpcResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {rpcResult.success ? 'Yes' : 'No'}
                </span>
              </div>
              {rpcResult.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {rpcResult.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Click "Refresh Diagnostics" to test
            </p>
          )}
        </div>

        {/* Environment Check */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            4. Environment Configuration
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Emergency Fallback Configured:</span>
              <span className={`font-semibold ${import.meta.env.VITE_ADMIN_EMAIL_FALLBACK ? 'text-green-600' : 'text-gray-400'}`}>
                {import.meta.env.VITE_ADMIN_EMAIL_FALLBACK ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              <p className="mb-2">
                <strong>Note:</strong> This page only shows whether fallback is configured, not the actual value.
              </p>
              <p>
                The fallback email is used only when the database is unreachable.
                Under normal operation, admin status is determined by the app_admins allowlist table.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Admin System Architecture
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Primary: app_admins table (allowlist with is_active flag)</li>
            <li>Fallback: Emergency email (database unreachable only)</li>
            <li>RLS: All admin checks use is_app_admin() RPC function</li>
            <li>Edge Functions: Use service-role client with shared admin.ts helper</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
