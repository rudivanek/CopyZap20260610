import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

    // Get users from pmc_users table with auth user data
    const { data: pmcUsers, error: pmcError } = await supabaseAdmin
      .from('pmc_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (pmcError) {
      console.error('Error fetching pmc_users:', pmcError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch users: ${pmcError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Get aggregated token usage for all users using GROUP BY (much faster!)
    const { data: tokenUsageAgg, error: tokenError } = await supabaseAdmin
      .rpc('get_all_users_credits_summary')

    if (tokenError) {
      console.error('Error fetching token usage aggregates:', tokenError)
    }

    console.log('[admin-get-users] RPC returned aggregates:', tokenUsageAgg?.length || 0, 'users')

    // Convert array of aggregates to lookup map
    const usageByUser = (tokenUsageAgg || []).reduce((acc, record) => {
      // CRITICAL: PostgreSQL numeric returns as string, must convert to number!
      const creditsUsed = Number(record.total_billable_units) || 0
      const costUsd = Number(record.total_cost_usd) || 0
      const recordCount = Number(record.record_count) || 0

      acc[record.user_id] = {
        creditsUsed,
        costUsd,
        recordCount
      }

      // Log for hello@sharpen.studio user
      if (record.user_id === 'bd9f5e28-09d9-46e4-a73e-a5457b1c1ec2') {
        console.log('[admin-get-users] hello@sharpen.studio RAW from RPC:', {
          total_billable_units: record.total_billable_units,
          typeof_billable: typeof record.total_billable_units,
          total_cost_usd: record.total_cost_usd,
          record_count: record.record_count
        })
        console.log('[admin-get-users] hello@sharpen.studio AFTER conversion:', {
          creditsUsed,
          typeof_credits: typeof creditsUsed,
          costUsd,
          recordCount
        })
      }

      return acc
    }, {} as Record<string, { creditsUsed: number; costUsd: number; recordCount: number }>)

    // Get auth users data
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch auth users: ${authError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Combine data from both tables
    const combinedUsers = pmcUsers.map(pmcUser => {
      const authUser = authUsers.users.find(au => au.id === pmcUser.id)
      const userStats = usageByUser[pmcUser.id] || { creditsUsed: 0, costUsd: 0, recordCount: 0 }
      const creditsRemaining = (pmcUser.credits_allowed || 0) - userStats.creditsUsed

      return {
        id: pmcUser.id,
        email: pmcUser.email,
        name: pmcUser.name,
        created_at: pmcUser.created_at,
        start_date: pmcUser.start_date,
        until_date: pmcUser.until_date,
        credits_allowed: pmcUser.credits_allowed,
        credits_used: userStats.creditsUsed,
        credits_remaining: creditsRemaining,
        cost_usd: userStats.costUsd,
        total_records: userStats.recordCount,
        tokens_allowed: pmcUser.credits_allowed, // Backwards compatibility alias
        tokens_remaining: creditsRemaining, // Backwards compatibility alias
        auth_created_at: authUser?.created_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at
      }
    })

    return new Response(
      JSON.stringify({ users: combinedUsers }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in admin-get-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})