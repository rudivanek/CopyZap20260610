import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, RefreshCw, ArrowLeft, Chrome } from 'lucide-react';
import { getSupabaseClient, createNewUser, checkUserExists, ensureUserExists } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import PublicFooter from './PublicFooter';

interface LoginProps {
  onLogin: (user: any) => void;
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const supabase = getSupabaseClient();
  const isSupabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED !== 'false';
  const { theme } = useTheme();

  // Check if user is already logged in
  useEffect(() => {
    if (!isSupabaseEnabled) return;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes('Failed to fetch')) {
            setConnectionError('Unable to connect to authentication service. Please check your Supabase credentials in the .env file.');
          } else {
            setConnectionError(error.message);
          }
          return;
        }
        
        if (session) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setConnectionError(userError.message);
            return;
          }
          
          if (user) {
            try {
              // Ensure the user exists in our pmc_users table
              await ensureUserExists(user.id, user.email || '', user.user_metadata?.name);
              onLogin(user);
            } catch (error: any) {
              setError('Error setting up user profile');
              console.error('Error ensuring user exists:', error);
            }
          }
        }
      } catch (error: any) {
        setConnectionError(error.message || 'Failed to connect to authentication service');
        console.error('Failed to check session:', error);
      }
    };
    
    checkSession();
  }, [isSupabaseEnabled]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Reset error when form fields change
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (!isSupabaseEnabled) {
        setError('Authentication service is not configured. Please contact the administrator.');
        setIsLoading(false);
        return;
      }

      // Redirect to site root - useAuth will handle OAuth tokens
      const redirectUrl = window.location.origin;

      console.log('🔐 Starting Google OAuth flow...');
      console.log('📍 After OAuth, redirect to:', redirectUrl);
      console.log('🔗 Google Console should have:', `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) {
        console.error('❌ OAuth error:', oauthError);
        throw oauthError;
      }

      console.log('✅ OAuth initiated successfully, redirecting to Google...');
      // The redirect to Google will happen automatically
      // After Google OAuth completes, Supabase will redirect to finalDestination
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setIsLoading(false);

      if (err.message) {
        if (err.message.includes('Failed to fetch')) {
          setError('Connection error: Unable to reach authentication service. Please check your network connection.');
        } else {
          setError(`Google sign-in failed: ${err.message}`);
        }
      } else {
        setError('An error occurred during Google sign-in. Please try again.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      if (err.message) {
        if (err.message.includes('Failed to fetch')) {
          setError('Connection error: Unable to reach authentication service. Please check your network connection.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred while sending the reset instructions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Client-side validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      if (!isSupabaseEnabled) {
        setError('Authentication service is not configured. Please contact the administrator.');
        setIsLoading(false);
        return;
      }

      // First check if the user exists in our pmc_users table
      const userExists = await checkUserExists(email);
      if (!userExists) {
        // User doesn't exist in our system, redirect to create account
        setMessage('No account found with this email. Redirecting you to create an account...');
        setTimeout(() => {
          window.location.href = `/create-account?email=${encodeURIComponent(email)}`;
        }, 2000);
        setIsLoading(false);
        return;
      }

      // User exists in pmc_users, now attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If auth fails, it might be wrong password, unconfirmed email, or account not in Supabase Auth
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid password. Please check your password and try again.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in. Check your inbox for the confirmation email.');
        }
        throw error;
      }

      if (data.user) {
        // Check if email is verified
        if (data.user.email_confirmed_at === null || data.user.email_confirmed_at === undefined) {
          throw new Error('Please verify your email address before signing in. Check your inbox for the confirmation email. If you didn\'t receive it, you can request a new one from the password reset page.');
        }

        // Ensure user exists in pmc_users table
        await ensureUserExists(
          data.user.id,
          data.user.email || '',
          data.user.user_metadata?.name || data.user.email?.split('@')[0] || ''
        );

        // Add timeout to onLogin to prevent hanging
        const loginTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Login timeout')), 15000); // 15 second timeout
        });

        try {
          await Promise.race([
            onLogin(data.user),
            loginTimeout
          ]);
          onLoginSuccess?.();
        } catch (loginError: any) {
          if (loginError.message === 'Login timeout') {
            throw new Error('Login is taking too long. There may be an issue with your account. Please try refreshing the page or contact support.');
          }
          throw loginError;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Track login attempts for invalid credentials
      if (err.message && err.message.includes('Invalid login credentials')) {
        setLoginAttempts(prev => prev + 1);
      }
      
      // Handle specific error cases
      if (err.message) {
        if (err.message.includes('Failed to fetch')) {
          setError('Connection error: Unable to reach authentication service. Please check your Supabase configuration and network connection.');
        } else if (err.message.includes('Invalid login credentials')) {
          if (loginAttempts >= 2) {
            setError('Multiple failed login attempts. Please verify your credentials carefully. If you\'re sure the email is correct, you may have entered an incorrect password or the account might not exist.');
          } else {
            setError('Invalid email or password. Please check your credentials and try again.');
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during authentication');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if Supabase is disabled
  if (!isSupabaseEnabled && !connectionError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4 text-red-600 dark:text-red-500">
            <AlertCircle size={24} className="mr-2" />
            <h2 className="text-xl font-bold">Service Unavailable</h2>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            The authentication service is not configured. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  // Display connection error if we can't connect to Supabase
  if (connectionError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4 text-red-600 dark:text-red-500">
            <AlertCircle size={24} className="mr-2" />
            <h2 className="text-xl font-bold">Connection Error</h2>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Unable to connect to the authentication service. This could be due to:
          </p>
          <ul className="list-disc ml-5 mb-6 text-gray-600 dark:text-gray-400 space-y-1">
            <li>Missing or incorrect Supabase credentials in .env file</li>
            <li>Network connectivity issues</li>
            <li>Service unavailability</li>
          </ul>
          <p className="mb-6 text-gray-700 dark:text-gray-300">{connectionError}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center mb-6">
          <img src="/copyzap.png" alt="CopyZap" className="h-10 w-auto" />
        </div>

        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Reset Your Password
          </h2>
          
          {message && (
            <div className="bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 px-4 py-3 mb-4 flex items-start">
              <span>{message}</span>
            </div>
          )}
          
          {error && (
            <div className="bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 px-4 py-3 mb-4 flex items-start">
              <AlertCircle size={18} className="text-gray-600 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {!resetSent ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                    placeholder="Your email"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We'll send password reset instructions to this email</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium text-base px-5 py-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              >
                {isLoading ? (
                  "Sending Reset Instructions..."
                ) : (
                  "Send Reset Instructions"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                We've sent password reset instructions to <span className="font-semibold text-primary-600 dark:text-primary-400">{email}</span>. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                If you don't see the email, check your spam folder. Sometimes it can take a few minutes to arrive.
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(false);
                setResetSent(false);
                setError('');
                setMessage('');
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 font-medium flex items-center justify-center mx-auto"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Sign In
            </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Beta users: your initial password is "letmein"
            </p>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard login/signup form
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="flex items-center justify-center mb-6">
        <img src="/copyzap.png" alt="CopyZap" className="h-10 w-auto" />
      </div>

      <div className="text-center mb-6">

      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Sign In to Your Account
        </h2>

        {message && (
          <div className="bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 px-4 py-3 mb-4 flex items-start">
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 px-4 py-3 mb-4 flex items-start">
            <AlertCircle size={18} className="text-gray-600 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium text-base px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center mb-6"
        >
          <Chrome size={20} className="mr-2" />
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              or
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                placeholder="Your email"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                placeholder="Enter password"
                minLength={6}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(true);
                setError('');
                setMessage('');
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium text-base px-5 py-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Don't have an account?
          </p>
          <a
            href="/create-account"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
          >
            Create an Account
          </a>
        </div>

        {loginAttempts > 0 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setError('');
                setLoginAttempts(0);
              }}
              className="flex items-center justify-center mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <RefreshCw size={14} className="mr-1" />
              Reset password field
            </button>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
};

export default Login;