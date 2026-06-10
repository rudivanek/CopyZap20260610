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

    // Get token usage data with user information and session details
    // Using service-role client to bypass RLS
    console.log('[admin-get-token-usage] Fetching token usage with service role client')
    const { data: tokenUsage, error: tokenError } = await supabaseAdmin
      .from('pmc_user_tokens_used')
      .select(`
        id,
        user_id,
        operation_type,
        model,
        cost_usd,
        billable_units,
        billing_rule_name,
        pricing_tier,
        created_at,
        session_id,
        pmc_users!inner(
          email,
          name
        ),
        pmc_copy_sessions(
          id,
          session_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (tokenError) {
      console.error('[admin-get-token-usage] Error fetching token usage:', tokenError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch token usage: ${tokenError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`[admin-get-token-usage] Token usage rows returned: ${tokenUsage?.length || 0}`)

    // Transform the data to include user info and session info at the top level
    const transformedData = (tokenUsage || []).map(usage => ({
      id: usage.id,
      user_id: usage.user_id,
      user_email: usage.pmc_users.email,
      user_name: usage.pmc_users.name,
      operation_type: usage.operation_type,
      model: usage.model,
      cost_usd: usage.cost_usd,
      billable_units: usage.billable_units || 0,
      billing_rule_name: usage.billing_rule_name || null,
      pricing_tier: usage.pricing_tier || null,
      created_at: usage.created_at,
      session_id: usage.session_id,
      session_name: usage.pmc_copy_sessions?.session_name || null
    }))

    return new Response(
      JSON.stringify({ data: transformedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in admin-get-token-usage function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})