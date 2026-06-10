import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, ensureUserExists, checkUserAccess } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);

  // Public function to allow manual fallback to demo mode (disabled - users must login)
  const fallbackToDemoMode = useCallback(() => {
    // Demo mode disabled - do nothing
    console.log('Demo mode is disabled - users must login');
  }, []);

  // Check if user is logged in - run only once during initialization
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        // Check if Supabase is enabled (defaults to true unless explicitly set to 'false')
        const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED !== 'false';
        setIsSupabaseEnabled(supabaseEnabled);

        // Check if we have OAuth callback tokens in the URL
        console.log('🔍 Checking URL for OAuth tokens...');
        console.log('📍 Current URL:', window.location.href);
        console.log('🔗 Hash:', window.location.hash);

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasOAuthTokens = hashParams.has('access_token') || hashParams.has('refresh_token');

        if (hasOAuthTokens) {
          console.log('🔐 ✅ OAuth tokens detected in URL!');
          console.log('🎫 Token preview:', hashParams.get('access_token')?.substring(0, 20) + '...');
          // Wait for Supabase to process the tokens
          console.log('⏳ Waiting for Supabase to process tokens...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          console.log('❌ No OAuth tokens in URL');
        }

        // Add timeout protection for Supabase connection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 10000); // 10 second timeout
        });

        // Wrap all Supabase calls in a try-catch to handle network errors
        try {
          const sessionPromise = supabase.auth.getSession();
          const { data: { session }, error: sessionError } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            // Check for various connection/network error types
            if (sessionError.message.includes('Failed to fetch') || 
                sessionError.message.includes('fetch') ||
                sessionError.message.includes('Network') ||
                sessionError.message.includes('network') ||
                sessionError.name === 'TypeError') {
              console.log('Connection failed, setting init error');
              setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
              return;
            }
            setInitError('Failed to connect to authentication service');
            return;
          }
          
          if (session) {
            console.log('Session found, getting user...');
            try {
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              
              if (userError) {
                console.error('Error getting user:', userError);
                // Check for various connection/network error types
                if (userError.message.includes('Failed to fetch') || 
                    userError.message.includes('fetch') ||
                    userError.message.includes('Network') || 
                    userError.message.includes('network') ||
                    userError.name === 'TypeError') {
                  console.log('User fetch failed, setting init error');
                  setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
                  return;
                }
                setInitError('Failed to get user information');
                return;
              }
              
              if (user) {
                console.log('User found:', user.email);
                try {
                  // Ensure the user exists in our pmc_users table
                  await ensureUserExists(user.id, user.email || '', user.user_metadata?.name);

                  setCurrentUser(user);
                  setUser(user);

                  // Clean up OAuth tokens from URL if present
                  if (hasOAuthTokens) {
                    console.log('🧹 Cleaning up OAuth tokens from URL');
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                  }
                } catch (error: any) {
                  console.error('Error ensuring user exists:', error);
                  // If there are network errors, still allow login in demo mode
                  if (error.message && error.message.includes('Failed to fetch')) {
                    console.log('Network error during user setup, allowing demo mode login');
                    setCurrentUser(user);
                    setUser(user);
                  } else {
                    console.log('User profile setup failed, but allowing login');
                    setCurrentUser(user);
                    setUser(user);
                  }
                }
              }
            } catch (userFetchError: any) {
              console.error('Network error fetching user:', userFetchError);
              setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
              return;
            }
          } else {
            console.log('No session found, user not logged in');
          }
        } catch (supabaseError: any) {
          console.error('Supabase connection error:', supabaseError);
          // Check if it's a timeout error
          if (supabaseError.message === 'Connection timeout') {
            console.log('Connection timed out after 10 seconds');
            setInitError('Connection timeout: Unable to reach the authentication service. Please check your internet connection.');
          } else {
            // Any error connecting to Supabase should show init error instead of falling back
            setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
          }
          return;
        }
      } catch (error: any) {
        console.error('Error in checkSession:', error);
        // Show init error on any unexpected errors
        setInitError('An unexpected error occurred while initializing the application. Please try again or continue in demo mode.');
        return;
      } finally {
        // Always set isInitialized to true, even if there was an error
        console.log('Setting isInitialized to true');
        setIsInitialized(true);
      }
    };
    
    // Start the session check
    checkSession();
    
    // Set up auth state change listener only if Supabase is enabled
    const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED !== 'false';
    if (supabaseEnabled) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔔 Auth state changed:', event, session?.user?.email);
            if (session && session.user) {
              // Set user immediately — never await Supabase calls inside onAuthStateChange
              setCurrentUser(session.user);
              setUser(session.user);

              // Run ensureUserExists in a detached async block to avoid deadlock
              (async () => {
                try {
                  console.log('🔄 Ensuring user exists in database...');
                  await ensureUserExists(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
                  );
                  console.log('✅ User profile synced');
                } catch (error: any) {
                  console.error('❌ Error syncing user profile (non-blocking):', error);
                }
              })();
            } else {
              console.log('🚪 User signed out or no session');
              setCurrentUser(null);
              setUser(null);
            }
          }
        );
        
        return () => {
          // Clean up subscription when component unmounts
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from auth changes:', error);
          }
        };
      } catch (authListenerError) {
        console.error('Error setting up auth listener:', authListenerError);
        // Continue without auth listener if it fails
      }
    }
  }, []); // Remove dependencies to prevent re-running

  const handleLogin = useCallback(async (user: any) => {
    console.log('User logged in:', user.email);
    // Simply set the user - access will be checked when they try to use features
    setCurrentUser(user);
    setUser(user);
    console.log('✅ User login completed successfully');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      console.log('Logging out...');
      
      if (isSupabaseEnabled) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out from Supabase:', signOutError);
          // Continue with local logout even if Supabase signout fails
        }
      }
      
      setCurrentUser(null);
      setUser(null);
      setIsDemoMode(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if logout fails
      setCurrentUser(null);
      setUser(null);
      setIsDemoMode(false);
      toast.error('Logged out (with errors)');
    }
  }, [isSupabaseEnabled]);

  return {
    currentUser,
    user,
    setCurrentUser,
    isInitialized,
    initError,
    isSupabaseEnabled,
    isDemoMode,
    handleLogin,
    handleLogout,
    fallbackToDemoMode
  };
}