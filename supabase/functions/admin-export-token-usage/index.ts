import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');

    // Fetch ALL records in chunks to avoid Supabase limits
    const chunkSize = 1000;
    let offset = 0;
    let allRecords: any[] = [];
    let hasMore = true;

    console.log('[admin-export-token-usage] Starting export with filters:', { startDate, endDate, userId });

    while (hasMore) {
      let query = supabaseAdmin
        .from('pmc_user_tokens_used')
        .select(`
          *,
          pmc_users!inner(
            email,
            name
          ),
          pmc_copy_sessions(
            session_name
          )
        `, { count: 'exact' });

      // Exclude Intent Polish from export
      query = query.neq('operation_type', 'quick-polish');

      // Apply date range filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        query = query.lt('created_at', endDateTime.toISOString().split('T')[0]);
      }

      // Apply user filter if provided
      if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + chunkSize - 1);

      if (error) {
        console.error('Error fetching chunk:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data);
        console.log(`[admin-export-token-usage] Fetched chunk: ${data.length} records, total so far: ${allRecords.length}`);
      }

      // Check if we have more data
      hasMore = data && data.length === chunkSize;
      offset += chunkSize;

      // Safety limit to prevent infinite loops
      if (offset > 100000) {
        console.error('[admin-export-token-usage] Safety limit reached at 100,000 records');
        break;
      }
    }

    console.log(`[admin-export-token-usage] Export complete: ${allRecords.length} total records`);

    // Transform the data to match expected format (Phase 4B-2: tokens_used removed)
    const transformedData = allRecords.map(usage => ({
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
      // Token breakdown (for internal analytics only)
      input_tokens_used: usage.input_tokens_used || null,
      output_tokens_used: usage.output_tokens_used || null,
      reasoning_tokens_used: usage.reasoning_tokens_used || null,
      cost_source: usage.cost_source || 'legacy',
      pricing_row_id: usage.pricing_row_id || null,
      session_id: usage.session_id || null,
      session_name: usage.pmc_copy_sessions?.session_name || null,
      created_at: usage.created_at
    }));

    return new Response(
      JSON.stringify({
        data: transformedData,
        count: transformedData.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in admin-export-token-usage function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
