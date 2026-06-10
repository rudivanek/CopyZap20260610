import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing required environment variables' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        }
      }
    )

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Check if user is an admin using centralized admin helper
    const forbidden = await requireAdmin(supabaseAdmin, user)
    if (forbidden) return forbidden

    const { userId } = await req.json()

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Starting deletion process for user: ${userId}`)

    // First check if user exists in pmc_users
    console.log(`Checking if user exists in pmc_users table...`)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('pmc_users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is acceptable
      console.error('Error checking user existence:', checkError)
      return new Response(
        JSON.stringify({
          error: `Failed to verify user: ${checkError.message}`,
          details: checkError.details || 'No additional details available'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Delete user from pmc_users table (if exists)
    if (existingUser) {
      console.log(`Deleting user ${existingUser.email} from pmc_users table...`)

      // First, manually delete token usage records (foreign key doesn't have CASCADE)
      console.log(`Deleting token usage records for ${existingUser.email}...`)

      // Delete from pmc_user_tokens_usage
      const { error: pmcTokensError } = await supabaseAdmin
        .from('pmc_user_tokens_usage')
        .delete()
        .eq('user_email', existingUser.email)

      if (pmcTokensError) {
        console.error('Error deleting from pmc_user_tokens_usage:', pmcTokensError)
        // Continue anyway - this is not critical
      } else {
        console.log(`Deleted records from pmc_user_tokens_usage`)
      }

      // Now delete from pmc_users (this will cascade to other tables)
      const { error: pmcError } = await supabaseAdmin
        .from('pmc_users')
        .delete()
        .eq('id', userId)

      if (pmcError) {
        console.error('Error deleting user from pmc_users:', pmcError)
        return new Response(
          JSON.stringify({
            error: `Failed to delete user data: ${pmcError.message}`,
            details: pmcError.details || 'No additional details available'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      console.log(`Successfully deleted user from pmc_users table`)
    } else {
      console.log(`User not found in pmc_users table, will only delete from auth.users`)
    }

    // Then delete user from auth.users table
    console.log(`Deleting user from auth.users table...`)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user from auth.users:', authError)

      // Provide more specific error messages based on error codes
      let errorMessage = `Failed to delete user from authentication: ${authError.message}`
      let hint = 'Please verify the service role key has admin permissions'

      if (authError.message?.includes('permission') || authError.message?.includes('unauthorized')) {
        errorMessage = 'Insufficient permissions to delete user from authentication system'
        hint = 'The service role key may not have admin privileges. Check your Supabase project settings.'
      } else if (authError.message?.includes('not found') || authError.message?.includes('User not found')) {
        // If user was not in pmc_users AND not in auth.users, user doesn't exist
        if (!existingUser) {
          errorMessage = 'User not found'
          hint = 'This user does not exist in the system or has already been deleted.'
        } else {
          // User was in pmc_users but not in auth.users (orphaned data)
          errorMessage = 'User data deleted but user not found in authentication system'
          hint = 'The user data was removed, but they were not in the authentication system. This may indicate orphaned data.'
        }
      } else if (authError.message?.includes('network') || authError.message?.includes('timeout')) {
        errorMessage = 'Network error while deleting user'
        hint = 'Please check your internet connection and try again.'
      }

      // If user was deleted from pmc_users but auth deletion failed (and it's not a "not found" error),
      // this is a partial deletion which should be reported as an error
      if (existingUser && !authError.message?.includes('not found')) {
        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: authError.code ? `Error code: ${authError.code}` : 'No error code provided',
            hint: hint,
            warning: 'User data was deleted from database but authentication deletion failed. User may still be able to log in.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      // For "not found" errors, just log and continue
      console.log(`Auth deletion skipped: ${errorMessage}`)
    } else {
      console.log(`Successfully deleted user from auth.users table`)
    }

    console.log(`User deletion process completed for ${userId}`)

    return new Response(
      JSON.stringify({
        message: 'User deleted successfully',
        details: existingUser
          ? 'User removed from database and authentication'
          : 'User removed from authentication only (not found in database)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})