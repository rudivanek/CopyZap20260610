/**
 * Centralized Admin Service
 *
 * This module provides a single source of truth for admin status checks
 * on the frontend, using the app_admins allowlist table with an emergency
 * email fallback to prevent lockouts.
 */

import { supabase } from './supabaseClient';

interface User {
  email?: string;
  id?: string;
}

// In-memory cache for admin status (per email)
interface AdminCache {
  [email: string]: {
    value: boolean;
    timestamp: number;
  };
}

const adminCache: AdminCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get emergency fallback admin email from environment
 * Use this ONLY when database is unreachable
 */
function getAdminEmailFallback(): string | null {
  return import.meta.env.VITE_ADMIN_EMAIL_FALLBACK || null;
}

/**
 * Check if user is an admin
 * @param user - User object (optional, will fetch current user if not provided)
 * @returns Promise<boolean> - true if user is active admin, false otherwise
 */
export async function getIsAdmin(user?: User | null): Promise<boolean> {
  try {
    // Get user if not provided
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      currentUser = authUser;
    }

    // No user or no email = not admin (DON'T CACHE - auth may not be ready yet)
    if (!currentUser || !currentUser.email) {
      return false;
    }

    const userEmail = currentUser.email;

    // Check cache first
    const cached = adminCache[userEmail];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    // Emergency fallback check (if database is unreachable)
    const fallbackEmail = getAdminEmailFallback();
    const isFallbackMatch = fallbackEmail === userEmail;

    // If fallback matches, return true immediately and cache it
    if (isFallbackMatch) {
      adminCache[userEmail] = {
        value: true,
        timestamp: Date.now(),
      };
      return true;
    }

    // Use RPC to check admin status (avoids RLS chicken-and-egg problem)
    // is_app_admin() is SECURITY DEFINER so it can read app_admins table
    const { data, error } = await supabase.rpc('is_app_admin');

    if (error) {
      console.error('Error checking admin status:', error);
      // On database error, DON'T CACHE (error might be transient or auth not ready)
      return false;
    }

    const isAdmin = data === true;

    // Cache the successful result (true or false)
    adminCache[userEmail] = {
      value: isAdmin,
      timestamp: Date.now(),
    };

    return isAdmin;
  } catch (err) {
    console.error('Exception checking admin status:', err);
    // On exception, fall back to emergency email check only
    // DON'T CACHE - exception might be transient
    const fallbackEmail = getAdminEmailFallback();
    return fallbackEmail === user?.email;
  }
}

/**
 * Clear admin cache for a specific user or all users
 * @param email - Optional email to clear specific user cache
 */
export function clearAdminCache(email?: string): void {
  if (email) {
    delete adminCache[email];
  } else {
    // Clear all cache
    Object.keys(adminCache).forEach(key => {
      delete adminCache[key];
    });
  }
}

/**
 * Reset admin cache (alias for clearAdminCache with no email)
 * Use this when auth state changes to force a fresh check
 */
export function resetAdminCache(): void {
  Object.keys(adminCache).forEach(key => {
    delete adminCache[key];
  });
}

/**
 * Hook-style admin check with loading state
 * Returns [isAdmin, isLoading]
 */
export async function checkAdminStatus(user?: User | null): Promise<[boolean, boolean]> {
  try {
    const isAdmin = await getIsAdmin(user);
    return [isAdmin, false];
  } catch (err) {
    console.error('Error in checkAdminStatus:', err);
    return [false, false];
  }
}
