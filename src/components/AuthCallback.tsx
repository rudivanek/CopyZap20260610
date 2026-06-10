import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSupabaseClient, ensureUserExists } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = getSupabaseClient();
  const { theme } = useTheme();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!session) {
          console.log('No session found, waiting for auth state change...');
          // Set up a listener for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('Auth state changed:', event, newSession);

            if (event === 'SIGNED_IN' && newSession) {
              subscription.unsubscribe();
              await processSession(newSession);
            } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
              subscription.unsubscribe();
              setError('Authentication failed. Please try again.');
              setTimeout(() => navigate('/login'), 3000);
            }
          });

          // Set a timeout in case the auth state change doesn't fire
          setTimeout(() => {
            subscription.unsubscribe();
            if (!session) {
              setError('Authentication timed out. Please try again.');
              setTimeout(() => navigate('/login'), 2000);
            }
          }, 10000);

          return;
        }

        // If we have a session immediately, process it
        await processSession(session);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred during authentication.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    const processSession = async (session: any) => {
      try {
        const user = session.user;

        if (!user) {
          throw new Error('No user found in session');
        }

        // Check if user is registered in pmc_users table
        const { checkUserExists } = await import('../services/supabaseClient');
        const userExists = await checkUserExists(user.email || '');

        if (!userExists) {
          console.log('User not registered in pmc_users, redirecting to create account');

          // Sign them out of Supabase Auth
          await supabase.auth.signOut();

          // Redirect to create account with email pre-filled
          navigate(`/create-account?email=${encodeURIComponent(user.email || '')}`, { replace: true });
          return;
        }

        // Ensure the user exists in pmc_users table
        await ensureUserExists(
          user.id,
          user.email || '',
          user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        );

        console.log('User authenticated successfully:', user.email);

        // Check if there's a redirect URL in the state
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/copy-maker';

        // Navigate to the intended destination
        navigate(redirectTo, { replace: true });
      } catch (err: any) {
        console.error('Error processing session:', err);
        setError('Failed to complete authentication setup. Please try signing in again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, location, supabase]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="flex items-center justify-center mb-6">
        <img src="/copyzap.png" alt="CopyZap" className="h-10 w-auto" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800">
        {error ? (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-12 h-12 mx-auto animate-spin"
                viewBox="0 0 50 50"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="spinnerGradientAuth" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </linearGradient>
                </defs>
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="url(#spinnerGradientAuth)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="90, 150"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Completing Sign In...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we set up your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
