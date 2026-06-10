import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '../services/supabaseClient';
import PublicFooter from './PublicFooter';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); // Verifying token on mount
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const supabase = getSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyResetToken = async () => {
      setIsVerifying(true);
      console.log('🔍 Checking for reset token...');
      console.log('Full URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Search:', window.location.search);

      // Wait a moment for the auth listener to process the tokens
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // FIRST: Check if we already have a session (onAuthStateChange might have already processed the tokens)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('Initial session check:', session ? 'Session exists' : 'No session');
        console.log('Session error:', sessionError);

        if (session && !sessionError) {
          console.log('✅ Valid recovery session already exists (processed by auth listener)');
          setHasToken(true);
          setError('');
          setIsVerifying(false);
          return;
        }

        // SECOND: If no session exists, try to get tokens from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let accessToken = hashParams.get('access_token');
        let type = hashParams.get('type');
        let refreshToken = hashParams.get('refresh_token');

        // Also check query parameters (for ?token=...&type=recovery format)
        const searchParams = new URLSearchParams(window.location.search);
        const tokenHash = searchParams.get('token');
        const queryType = searchParams.get('type');

        if (!accessToken && tokenHash && queryType === 'recovery') {
          // Using token hash format from email - verify it with Supabase
          console.log('✅ Token hash detected in URL, verifying...');

          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (verifyError) {
            console.error('Verify OTP error:', verifyError);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsVerifying(false);
            return;
          }

          if (data.session) {
            console.log('✅ Session established successfully from token hash');
            setHasToken(true);
            setError('');
            setIsVerifying(false);
            return;
          }
        }

        // Handle hash-based tokens (#access_token=...&refresh_token=...)
        if (!accessToken) {
          accessToken = searchParams.get('access_token');
          type = searchParams.get('type');
        }

        console.log('Token found in URL:', !!accessToken);
        console.log('Type:', type);
        console.log('Refresh token found:', !!refreshToken);

        if (accessToken && type === 'recovery' && refreshToken) {
          console.log('✅ Recovery token detected in URL, setting session...');

          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Set session error:', setSessionError);
            setError(`Unable to establish session: ${setSessionError.message}`);
            setIsVerifying(false);
            return;
          }

          if (data.session) {
            console.log('✅ Session established successfully from URL tokens');
            setHasToken(true);
            setError('');
            setIsVerifying(false);
            return;
          }
        }

        // If we reach here, no valid session or tokens found
        console.error('❌ No recovery token or session found');
        setError('Invalid or expired reset link. Please request a new password reset.');
      } catch (err: any) {
        console.error('Error verifying token:', err);
        setError(`Verification error: ${err.message}`);
      }

      setIsVerifying(false);
    };

    verifyResetToken();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="flex items-center justify-center mb-6">
        <img src="/copyzap.png" alt="CopyZap" className="h-10 w-auto" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Set New Password
        </h2>

        {isVerifying ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Verifying reset link...</p>
          </div>
        ) : error ? (
          <div className="bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 px-4 py-3 mb-4 flex items-start">
            <AlertCircle size={18} className="text-gray-600 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!isVerifying && success ? (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 mb-4 flex items-start">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>Your password has been reset successfully!</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Redirecting you to the login page...
            </p>
          </div>
        ) : !isVerifying && hasToken ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium text-base px-5 py-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        ) : !isVerifying ? (
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
            >
              Return to Login
            </button>
          </div>
        ) : null}
      </div>

      <PublicFooter />
    </div>
  );
};

export default ResetPassword;
