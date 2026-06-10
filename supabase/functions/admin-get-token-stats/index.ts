import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenStatsParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

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

    const url = new URL(req.url);
    const params: TokenStatsParams = {
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
      offset: parseInt(url.searchParams.get('offset') || '0')
    };

    // Default to last 30 days if no date range provided
    if (!params.startDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      params.startDate = thirtyDaysAgo.toISOString().split('T')[0]; // Just the date part
    }

    if (!params.endDate) {
      params.endDate = new Date().toISOString().split('T')[0]; // Just the date part
    }

    // Convert date strings to full timestamps for proper comparison
    // startDate: beginning of day (00:00:00)
    // endDate: end of day (23:59:59.999)
    const startDateFull = params.startDate.includes('T') ? params.startDate : `${params.startDate}T00:00:00.000Z`;
    const endDateFull = params.endDate.includes('T') ? params.endDate : `${params.endDate}T23:59:59.999Z`;

    // Build the query (Phase 4B-2: tokens_used removed)
    let query = supabaseAdmin
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
      `, { count: 'exact' })
      .gte('created_at', startDateFull)
      .lte('created_at', endDateFull)
      .order('created_at', { ascending: false });

    // Filter by user if specified
    if (params.userId && params.userId !== 'all') {
      query = query.eq('user_id', params.userId);
    }

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);

    console.log('[admin-get-token-stats] Fetching token stats with service role client')
    const { data: tokenUsage, error: tokenError, count } = await query;

    if (tokenError) {
      console.error('[admin-get-token-stats] Error fetching token usage:', tokenError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch token usage: ${tokenError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`[admin-get-token-stats] Token usage rows returned: ${tokenUsage?.length || 0}, total count: ${count || 0}`)

    // Get aggregated stats for the date range (Phase 4B-2: credits-only)
    let totalTokens = 0; // Deprecated, kept for backwards compatibility
    let totalCost = 0;
    let totalBillableUnits = 0;
    let statsOffset = 0;
    const statsChunkSize = 1000;
    let hasMoreStats = true;

    while (hasMoreStats) {
      let statsQuery = supabaseAdmin
        .from('pmc_user_tokens_used')
        .select('cost_usd, billable_units')
        .gte('created_at', startDateFull)
        .lte('created_at', endDateFull);

      // Only add user filter if userId is specified and not "all"
      if (params.userId && params.userId !== 'all') {
        statsQuery = statsQuery.eq('user_id', params.userId);
      }

      const { data: statsChunk, error: statsError } = await statsQuery
        .range(statsOffset, statsOffset + statsChunkSize - 1);

      if (statsError) {
        console.error('Error fetching stats chunk:', statsError);
        break;
      }

      if (statsChunk && statsChunk.length > 0) {
        const chunkCost = statsChunk.reduce((sum: number, row: any) => sum + (row.cost_usd || 0), 0);
        const chunkBillable = statsChunk.reduce((sum: number, row: any) => sum + (row.billable_units || 0), 0);

        console.log(`[admin-get-token-stats] Chunk ${statsOffset}-${statsOffset + statsChunk.length}: ${statsChunk.length} rows, ${chunkBillable} billable units, $${chunkCost.toFixed(4)}`);

        totalCost += chunkCost;
        totalBillableUnits += chunkBillable;
      }

      hasMoreStats = statsChunk && statsChunk.length === statsChunkSize;
      statsOffset += statsChunkSize;

      // Safety limit
      if (statsOffset > 100000) break;
    }

    let aggregatedStats = {
      totalTokens, // Always 0, kept for backwards compatibility
      totalCost,
      totalBillableUnits,
      recordCount: count || 0
    };

    // Transform the data (Phase 4B-2: tokens_used removed)
    const transformedData = (tokenUsage || []).map(usage => {
      const sessionName = usage.pmc_copy_sessions?.session_name || null;
      return {
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
        session_name: sessionName
      };
    });

    return new Response(
      JSON.stringify({
        data: transformedData,
        stats: aggregatedStats,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          total: count || 0,
          hasMore: (params.offset + params.limit) < (count || 0)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in admin-get-token-stats function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
