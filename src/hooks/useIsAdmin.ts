/**
 * useIsAdmin Hook
 *
 * React hook for checking admin status with loading and caching
 * Listens to auth state changes and resets cache when auth state updates
 */

import { useState, useEffect } from 'react';
import { getIsAdmin, resetAdminCache } from '../services/adminService';
import { supabase } from '../services/supabaseClient';

interface User {
  email?: string;
  id?: string;
}

export function useIsAdmin(user?: User | null): { isAdmin: boolean; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        // getIsAdmin will fetch current user if not provided
        const adminStatus = await getIsAdmin(user);
        if (isMounted) {
          setIsAdmin(adminStatus);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in useIsAdmin:', err);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Reset cache on any auth state change
      resetAdminCache();

      // Re-check admin status with the new session user
      if (session?.user) {
        checkAdmin();
      } else {
        // No user, not admin
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    });

    // Initial check
    checkAdmin();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user?.email]); // Only re-run if user email changes

  return { isAdmin, isLoading };
}
