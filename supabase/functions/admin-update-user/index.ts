import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Check if user is an admin using centralized admin helper
    const forbidden = await requireAdmin(supabaseAdmin, user)
    if (forbidden) return forbidden

    const requestBody = await req.json()
    const { userId, password, startDate, untilDate, tokensAllowed, creditPlanId, enforcementMode, creditsGraceUnits } = requestBody

    // Debug logging
    console.log('Update user request:', { userId, tokensAllowed, creditPlanId, requestBody })

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

    // Update password in auth.users if provided
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      })

      if (authError) {
        console.error('Error updating user password:', authError)
        return new Response(
          JSON.stringify({ error: `Failed to update password: ${authError.message}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
    }

    // Update user record in pmc_users table
    const updateData: any = {}
    if (startDate !== undefined) updateData.start_date = startDate
    if (untilDate !== undefined) updateData.until_date = untilDate
    // Phase 4B-2: tokens_allowed renamed to credits_allowed, tokens_remaining removed
    if (tokensAllowed !== undefined) {
      updateData.credits_allowed = tokensAllowed
    }
    if (creditPlanId !== undefined) {
      updateData.credit_plan_id = creditPlanId
      // Set credit_plan_applied_at timestamp when plan is assigned
      if (creditPlanId) {
        updateData.credit_plan_applied_at = new Date().toISOString()
      }
    }
    // Phase 4A: Enforcement mode and grace units
    if (enforcementMode !== undefined) updateData.enforcement_mode = enforcementMode
    if (creditsGraceUnits !== undefined) updateData.credits_grace_units = creditsGraceUnits

    if (Object.keys(updateData).length > 0) {
      const { error: userError2 } = await supabaseAdmin
        .from('pmc_users')
        .update(updateData)
        .eq('id', userId)

      if (userError2) {
        console.error('Error updating user in pmc_users:', userError2)
        return new Response(
          JSON.stringify({ error: `Failed to update user profile: ${userError2.message}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'User updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in admin-update-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})