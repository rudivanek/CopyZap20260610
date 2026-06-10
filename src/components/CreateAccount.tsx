import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, User, Chrome, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { getSupabaseClient, createNewUser, checkUserExists } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import PublicFooter from './PublicFooter';
import { useNavigate } from 'react-router-dom';

interface CreateAccountProps {
  onLogin: (user: any) => void;
  onLoginSuccess?: () => void;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ onLogin, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const supabase = getSupabaseClient();
  const isSupabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED !== 'false';
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Pre-fill email from URL parameter if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []);

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
          // User is already logged in, redirect to copy-maker
          navigate('/copy-maker');
        }
      } catch (error: any) {
        setConnectionError(error.message || 'Failed to connect to authentication service');
        console.error('Failed to check session:', error);
      }
    };

    checkSession();
  }, [isSupabaseEnabled, navigate]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Reset error when form fields change
  useEffect(() => {
    if (error) setError('');
  }, [email, password, name]);

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

      // First check if the user already exists
      try {
        const existingUser = await checkUserExists(email);
        if (existingUser) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking if user exists:', err);
        // Continue with signup attempt even if check fails
      }

      // Sign up with email and password - REQUIRES EMAIL VERIFICATION
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Check if email confirmation is required
        // If there's no session after signup, it means email confirmation is required
        const requiresEmailConfirmation = !data.session;

        if (requiresEmailConfirmation) {
          // Email confirmation required - show modal
          setRegisteredEmail(email);
          setShowEmailConfirmModal(true);
          console.log('📧 Email confirmation required for:', email);
        } else {
          // Email confirmation not required (shouldn't happen with our setup, but handle it)
          try {
            // Create a record in the pmc_users table
            await createNewUser(
              data.user.id,
              data.user.email || '',
              name || data.user.email?.split('@')[0] || ''
            );

            // Send welcome email (non-blocking)
            const welcomeEmailUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`;
            console.log('🔔 Sending welcome email to:', data.user.email);

            fetch(welcomeEmailUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                email: data.user.email,
                name: name || data.user.email?.split('@')[0] || ''
              }),
            }).then(async (response) => {
              const result = await response.json();
              if (response.ok) {
                console.log('✅ Welcome email sent successfully:', result);
              } else {
                console.error('❌ Welcome email failed:', result);
              }
            }).catch(err => {
              console.error('❌ Welcome email network error:', err);
            });

            setMessage('Account created successfully! Signing you in...');

            // Auto sign-in the user after registration
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              console.error('Auto sign-in failed:', signInError);
              setMessage('Account created! Please sign in with your credentials.');
              setTimeout(() => navigate('/login'), 2000);
            } else if (signInData.user) {
              onLogin(signInData.user);
              onLoginSuccess?.();
            }
          } catch (createUserError) {
            console.error('Error creating user record:', createUserError);
            setError('Account created but there was an error setting up your profile. Please try signing in.');
            setTimeout(() => navigate('/login'), 2000);
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      if (err.message) {
        if (err.message.includes('Failed to fetch')) {
          setError('Connection error: Unable to reach authentication service. Please check your Supabase configuration and network connection.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during account creation');
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

  // Display connection error
  if (connectionError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4 text-red-600 dark:text-red-500">
            <AlertCircle size={24} className="mr-2" />
            <h2 className="text-xl font-bold">Connection Error</h2>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Unable to connect to the authentication service.
          </p>
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

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="flex items-center justify-center mb-6">
        <img src="/copyzap.png" alt="CopyZap" className="h-10 w-auto" />
      </div>

      <div className="text-center mb-6">
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-300 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Create Your Account
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                placeholder="Your name"
              />
            </div>
          </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 focus:ring-gray-500 focus:border-gray-500 block w-full"
                placeholder="Create password"
                minLength={6}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium text-base px-5 py-3 transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Already have an account?
          </p>
          <a
            href="/login"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
          >
            Sign In
          </a>
        </div>
      </div>

      <PublicFooter />

      {/* Email Confirmation Modal */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border border-gray-300 dark:border-gray-700 relative animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => {
                setShowEmailConfirmModal(false);
                navigate('/login');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <Mail size={48} className="text-green-600 dark:text-green-500" />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Check Your Email
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                We've sent a confirmation link to:
              </p>
              <p className="text-gray-900 dark:text-white font-semibold mb-4">
                {registeredEmail}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please click the link in your email to verify your account before signing in.
              </p>

              {/* Action button */}
              <button
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  navigate('/login');
                }}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
              >
                Got It
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Didn't receive the email? Check your spam folder or try registering again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAccount;
