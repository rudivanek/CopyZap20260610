import { createClient } from 'npm:@supabase/supabase-js@2'
import { createServiceClient, getAdminEmailFallback } from '../_shared/admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

/**
 * Admin Ping - Diagnostic endpoint to verify admin status
 *
 * This function provides detailed diagnostics about admin authentication:
 * - Checks if user is admin via app_admins table
 * - Reports which method was used (allowlist or fallback)
 * - Returns comprehensive diagnostic information
 *
 * This is READ-ONLY and returns diagnostic data only.
 * It does NOT modify any permissions or data.
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          ok: false,
          isAdmin: false,
          error: 'Authentication required',
          message: 'You must be logged in to use this endpoint'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!user.email) {
      return new Response(
        JSON.stringify({
          ok: false,
          isAdmin: false,
          error: 'No email found',
          message: 'User account has no email address'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userEmail = user.email.toLowerCase()
    let isAdmin = false
    let method: 'allowlist' | 'fallback' | 'none' = 'none'
    let details: Record<string, any> = {}

    // Check emergency fallback first
    const fallbackEmail = getAdminEmailFallback()
    const hasFallback = !!fallbackEmail

    if (fallbackEmail && userEmail === fallbackEmail.toLowerCase()) {
      isAdmin = true
      method = 'fallback'
      details = {
        fallbackConfigured: true,
        matchedFallback: true,
        note: 'Admin access granted via emergency fallback'
      }
    } else {
      // Check app_admins table via service-role client
      try {
        const serviceClient = createServiceClient()

        const { data: adminRecord, error: dbError } = await serviceClient
          .from('app_admins')
          .select('email, is_active, created_at')
          .eq('email', userEmail)
          .maybeSingle()

        if (dbError) {
          console.error('Error checking app_admins:', dbError)
          details = {
            databaseError: dbError.message,
            fallbackConfigured: hasFallback,
            note: 'Database query failed - admin check incomplete'
          }
        } else if (adminRecord && adminRecord.is_active) {
          isAdmin = true
          method = 'allowlist'
          details = {
            allowlistRecord: {
              email: adminRecord.email,
              isActive: adminRecord.is_active,
              addedAt: adminRecord.created_at
            },
            fallbackConfigured: hasFallback,
            note: 'Admin access granted via app_admins allowlist'
          }
        } else if (adminRecord && !adminRecord.is_active) {
          details = {
            allowlistRecord: {
              email: adminRecord.email,
              isActive: false,
              note: 'Record exists but is_active = false'
            },
            fallbackConfigured: hasFallback,
            note: 'User is in allowlist but marked inactive'
          }
        } else {
          details = {
            allowlistRecord: null,
            fallbackConfigured: hasFallback,
            note: 'User not found in app_admins allowlist'
          }
        }
      } catch (err) {
        console.error('Exception checking admin status:', err)
        details = {
          exception: err instanceof Error ? err.message : 'Unknown error',
          fallbackConfigured: hasFallback,
          note: 'Exception occurred during admin check'
        }
      }
    }

    // Return diagnostic response
    const response = {
      ok: true,
      isAdmin,
      email: user.email,
      method,
      timestamp: new Date().toISOString(),
      details
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: isAdmin ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in admin-ping:', error)
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
