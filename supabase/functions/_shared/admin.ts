/**
 * Shared admin authentication utilities for Edge Functions
 *
 * This module provides centralized admin checking that uses the app_admins
 * allowlist table, with an emergency email fallback to prevent lockouts.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * Get emergency fallback admin email from environment
 * Use this ONLY when database is unreachable
 */
export function getAdminEmailFallback(): string | null {
  return Deno.env.get('ADMIN_EMAIL_FALLBACK') || null;
}

/**
 * Create a service-role Supabase client for admin operations
 * This bypasses RLS and can read/write protected tables directly
 * Exported for use in admin edge functions
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Check if user is an admin
 * @param supabaseClient - Supabase client instance (not used, kept for compatibility)
 * @param user - User object from auth
 * @returns Promise<boolean> - true if user is active admin, false otherwise
 */
export async function isAdminUser(
  supabaseClient: SupabaseClient,
  user: { email?: string } | null
): Promise<boolean> {
  // No user or no email = not admin
  if (!user || !user.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase();

  // Emergency fallback check (if database is unreachable)
  const fallbackEmail = getAdminEmailFallback();
  if (fallbackEmail && userEmail === fallbackEmail.toLowerCase()) {
    return true;
  }

  // Use service-role client to query app_admins directly
  // This bypasses RLS and doesn't rely on JWT context
  try {
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from('app_admins')
      .select('is_active')
      .eq('email', userEmail)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      // On database error, fall back to emergency email check only
      return false;
    }

    // User is admin if record exists and is_active is true
    return data?.is_active === true;
  } catch (err) {
    console.error('Exception checking admin status:', err);
    // On exception, fall back to emergency email check only
    return false;
  }
}

/**
 * Require admin access - returns 403 Response if not admin, null if admin
 * @param supabaseClient - Supabase client instance
 * @param user - User object from auth
 * @returns Promise<Response | null> - 403 Response if not admin, null if authorized
 */
export async function requireAdmin(
  supabaseClient: SupabaseClient,
  user: { email?: string } | null
): Promise<Response | null> {
  const isAdmin = await isAdminUser(supabaseClient, user);

  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden - Admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}
