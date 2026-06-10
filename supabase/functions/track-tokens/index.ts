import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Cache for billing rule (refreshed every 5 minutes)
let cachedBillingRule: {
  rule_name: string
  cost_multiplier: number
  usd_per_unit: number
  min_units_per_call: number
  rounding_mode: string
  cached_at: number
} | null = null

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Fallback billing rule if DB fetch fails
const FALLBACK_RULE = {
  rule_name: 'default_fallback',
  cost_multiplier: 1.30,
  usd_per_unit: 0.010000,
  min_units_per_call: 1,
  rounding_mode: 'ceil'
}

async function getActiveBillingRule(supabaseAdmin: any) {
  // Check cache
  const now = Date.now()
  if (cachedBillingRule && (now - cachedBillingRule.cached_at) < CACHE_TTL_MS) {
    return cachedBillingRule
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('llm_billing_rules')
      .select('rule_name, cost_multiplier, usd_per_unit, min_units_per_call, rounding_mode')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('Failed to fetch billing rule, using fallback:', error?.message)
      return { ...FALLBACK_RULE, cached_at: now }
    }

    cachedBillingRule = { ...data, cached_at: now }
    return cachedBillingRule
  } catch (err) {
    console.error('Error fetching billing rule:', err)
    return { ...FALLBACK_RULE, cached_at: now }
  }
}

// ============================================================================
// PHASE 4B-2: CREDITS-ONLY ENFORCEMENT
// ============================================================================
// Token system has been completely removed (Phase 4B-2).
// Only credits-based enforcement remains via billable_units.
//
// This function calculates billable units for:
// - Credits consumption tracking
// - Access enforcement (checkUserAccess validates credits)
// - Dashboard display and analytics
// - Billing calculations
// ============================================================================
function calculateBillableUnits(
  cost_usd: number,
  rule: typeof FALLBACK_RULE
): number {
  if (!cost_usd || cost_usd <= 0) return 0

  const adjusted_cost = cost_usd * rule.cost_multiplier
  const units_raw = adjusted_cost / rule.usd_per_unit

  // Phase 1: Only implement 'ceil' rounding
  const billable_units = Math.max(
    rule.min_units_per_call,
    Math.ceil(units_raw)
  )

  return billable_units
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

    // Parse request body
    const {
      user_id,
      operation_type,
      model,
      tokens_used,
      cost_usd,
      session_id,
      // Phase 3: Token breakdown fields
      input_tokens_used,
      output_tokens_used,
      reasoning_tokens_used,
      cost_source,
      pricing_row_id
    } = await req.json()

    // Validate required fields (Phase 4B-2: tokens_used is now optional/ignored)
    if (!user_id || !operation_type || !model || cost_usd === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['user_id', 'operation_type', 'model', 'cost_usd']
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate cost_usd (primary billing input)
    if (typeof cost_usd !== 'number' || cost_usd < 0) {
      return new Response(
        JSON.stringify({ error: 'cost_usd must be a non-negative number' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // tokens_used is now deprecated and ignored (Phase 4B-2)
    // Accept it for backwards compatibility but don't validate or use it


    // SAFETY NET: Auto-create session if missing
    let finalSessionId = session_id
    if (!finalSessionId) {
      console.warn(`⚠️ WARNING: No session_id provided for token tracking. Auto-creating session for user ${user_id}`)

      // Generate a session ID
      const newSessionId = crypto.randomUUID()
      const now = new Date().toISOString()
      const sessionName = `Untracked Session - ${new Date().toLocaleString()}`

      // Create the session
      const { error: sessionError } = await supabaseAdmin
        .from('pmc_copy_sessions')
        .insert({
          id: newSessionId,
          user_id,
          session_name: sessionName,
          output_type: operation_type,
          created_at: now
        })

      if (sessionError) {
        console.error('Failed to auto-create session:', sessionError)
        // Continue anyway - we'll track tokens without session
      } else {
        console.log(`✓ Auto-created session: ${newSessionId}`)
        finalSessionId = newSessionId
      }
    }

    console.log(`Recording credits usage for ${operation_type} using ${model}${finalSessionId ? ` [Session: ${finalSessionId}]` : ''}`)

    // Fetch active billing rule and calculate billable units
    let billable_units = 0
    let billing_rule_name = 'default_fallback'
    let pricing_tier = 'standard'

    try {
      const billingRule = await getActiveBillingRule(supabaseAdmin)
      billable_units = calculateBillableUnits(cost_usd, billingRule)
      billing_rule_name = billingRule.rule_name
      console.log(`Calculated billable units: ${billable_units} (rule: ${billing_rule_name}, cost: $${cost_usd.toFixed(6)})`)
    } catch (err) {
      console.error('Failed to calculate billable units, defaulting to 0:', err)
      // Continue with billable_units = 0 - never block the user
    }

    // Insert credits usage record (Phase 4B-2: tokens_used column removed)
    const insertData: any = {
      user_id,
      operation_type,
      model,
      cost_usd,
      session_id: finalSessionId || null,
      billable_units,
      billing_rule_name,
      pricing_tier,
      created_at: new Date().toISOString(),
      cost_source: cost_source || 'legacy'
    }

    // Add token breakdown if provided (NULL otherwise)
    if (input_tokens_used !== undefined && input_tokens_used !== null) {
      insertData.input_tokens_used = input_tokens_used
    }
    if (output_tokens_used !== undefined && output_tokens_used !== null) {
      insertData.output_tokens_used = output_tokens_used
    }
    if (reasoning_tokens_used !== undefined && reasoning_tokens_used !== null) {
      insertData.reasoning_tokens_used = reasoning_tokens_used
    }
    if (pricing_row_id !== undefined && pricing_row_id !== null) {
      insertData.pricing_row_id = pricing_row_id
    }

    const { data, error } = await supabaseAdmin
      .from('pmc_user_tokens_used')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Error inserting credits usage:', error)
      return new Response(
        JSON.stringify({
          error: `Failed to record credits usage: ${error.message}`,
          code: error.code
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`Successfully recorded credits usage:`, data?.[0])

    return new Response(
      JSON.stringify({
        success: true,
        id: data?.[0]?.id,
        message: 'Credits usage recorded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in track-tokens function:', error)
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
