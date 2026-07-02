import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from 'npm:openai@4.43.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function recordUsage(
  supabase: any,
  params: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    operationType?: string;
    sessionId?: string | null;
  }
): Promise<void> {
  try {
    let cost_usd = 0;
    let cost_source = 'legacy';
    let pricing_row_id: string | null = null;
    const { data: pricingData } = await supabase.rpc('get_active_model_pricing', {
      p_model_key: params.model,
      p_pricing_tier: 'standard'
    });
    const pricing = pricingData?.[0];
    if (pricing) {
      cost_usd =
        (params.inputTokens / 1000) * Number(pricing.input_usd_per_1k || 0) +
        (params.outputTokens / 1000) * Number(pricing.output_usd_per_1k || 0);
      cost_source = 'db_pricing';
      pricing_row_id = pricing.id;
    }
    if (!Number.isFinite(cost_usd) || cost_usd < 0) cost_usd = 0;

    let billable_units = 0;
    let billing_rule_name = 'default_fallback';
    let rule: any = { cost_multiplier: 1.30, usd_per_unit: 0.01, min_units_per_call: 1, rule_name: 'default_fallback' };
    const { data: ruleData } = await supabase
      .from('llm_billing_rules')
      .select('rule_name, cost_multiplier, usd_per_unit, min_units_per_call, rounding_mode')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();
    if (ruleData) rule = ruleData;
    if (cost_usd > 0) {
      billable_units = Math.max(
        rule.min_units_per_call,
        Math.ceil((cost_usd * rule.cost_multiplier) / rule.usd_per_unit)
      );
    }
    billing_rule_name = rule.rule_name;

    const { error } = await supabase.from('pmc_user_tokens_used').insert([{
      user_id: params.userId,
      operation_type: params.operationType || 'llm_call',
      model: params.model,
      cost_usd,
      session_id: params.sessionId || null,
      billable_units,
      billing_rule_name,
      pricing_tier: 'standard',
      created_at: new Date().toISOString(),
      cost_source,
      pricing_row_id,
      input_tokens_used: params.inputTokens,
      output_tokens_used: params.outputTokens
    }]);
    if (error) console.error('❌ Usage recording insert failed:', error);
    else console.log(`✓ Usage recorded: ${params.operationType || 'llm_call'} / ${params.model} / in:${params.inputTokens} out:${params.outputTokens} / $${cost_usd.toFixed(6)} / ${billable_units} credits`);
  } catch (err) {
    console.error('❌ Usage recording failed (non-fatal):', err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const { messages, model, temperature, maxTokens, responseFormat, stream: useStream, operationType, sessionId } = requestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // ============================================
    // ACCESS CONTROL CHECK (PHASE 4B-2: CREDITS-ONLY)
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
// Log details server-side only; never return internal error info to the client
      console.error('Access check failed (no user data):', {
        userId: user.id,
        errorCode: accessError?.code,
      });
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Create Supabase client with the user's JWT for authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Create service role client for database queries (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user access (subscription date and credits - PHASE 4B-2)
    const { data: userData, error: accessError } = await supabase
      .from('pmc_users')
      .select('start_date, until_date, credits_allowed, credits_period_start_day, credits_grace_units')
      .eq('id', user.id)
      .single();

    if (accessError || !userData) {
      console.error('❌ Error checking user access:', accessError);
      console.error('User ID:', user.id);
      console.error('User data:', userData);

      // Include detailed error for debugging
      return new Response(
        JSON.stringify({
          error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.',
          debug: {
            userId: user.id,
            email: user.email,
            hasUserData: !!userData,
            errorMessage: accessError?.message,
            errorDetails: accessError?.details,
            errorHint: accessError?.hint,
            errorCode: accessError?.code
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    console.log('📊 User data retrieved:', {
      userId: user.id,
      email: user.email,
      startDate: userData.start_date,
      untilDate: userData.until_date,
      creditsAllowed: userData.credits_allowed,
      creditsGrace: userData.credits_grace_units
    });

    // Check subscription date validity
    const todayStr = new Date().toISOString().split('T')[0];
    const startDateStr = userData.start_date;
    const untilDateStr = userData.until_date;

    console.log('🗓️ Date check:', { today: todayStr, start: startDateStr, until: untilDateStr });

    // Check if subscription has started (if start_date is set)
    if (startDateStr && todayStr < startDateStr) {
      console.log('❌ Access denied: subscription has not started yet');
      console.log('Today:', todayStr, 'Start:', startDateStr);
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Check if subscription has expired (if until_date is set)
    if (untilDateStr && todayStr > untilDateStr) {
      console.log('❌ Access denied: subscription expired');
      console.log('Today:', todayStr, 'Until:', untilDateStr);
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // Calculate credits usage (PHASE 4B-2: Credits-only enforcement)
    const creditsAllowed = userData.credits_allowed || 0;
    const creditsGraceUnits = userData.credits_grace_units || 0;
    const creditsPeriodStartDay = userData.credits_period_start_day || 1;

    // Calculate rolling 30-day billing period anchored to the user's signup day
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();

    let periodStart: Date;
    if (currentDay >= creditsPeriodStartDay) {
      periodStart = new Date(Date.UTC(currentYear, currentMonth, creditsPeriodStartDay, 0, 0, 0, 0));
    } else {
      periodStart = new Date(Date.UTC(currentYear, currentMonth - 1, creditsPeriodStartDay, 0, 0, 0, 0));
    }
    // periodEnd is exactly 30 days after periodStart (matches frontend computeCreditsPeriod)

    console.log('💳 Credits billing period:', {
      periodStart: periodStart.toISOString(),
      creditsAllowed,
      creditsGraceUnits
    });

    // Query usage in current period
    const { data: usageData, error: usageError } = await supabase
      .from('pmc_user_tokens_used')
      .select('billable_units')
      .eq('user_id', user.id)
      .gte('created_at', periodStart.toISOString());

    let creditsUsed = 0;
    if (usageError) {
      console.warn('⚠️ Warning: Failed to fetch usage data:', usageError);
      // Fail open: allow access if we can't check usage (transient DB issue)
      console.log('⚠️ Allowing access due to transient DB error (fail-open policy)');
    } else {
      creditsUsed = usageData?.reduce((sum, row) => sum + (row.billable_units || 0), 0) || 0;
    }

    const creditsRemaining = creditsAllowed - creditsUsed;
    const creditsEffectiveRemaining = creditsRemaining + creditsGraceUnits;

    console.log('💳 Credits check:', {
      creditsAllowed,
      creditsUsed,
      creditsRemaining,
      creditsGraceUnits,
      creditsEffectiveRemaining
    });

    // Check if user has credits available
    if (creditsAllowed === 0) {
      console.log('❌ Access denied: no credit plan assigned');
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    if (creditsEffectiveRemaining <= 0) {
      console.log('❌ Access denied: credits limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    console.log('✅ Access granted:', {
      userId: user.id,
      creditsEffectiveRemaining,
      creditsUsed,
      creditsAllowed
    });
    // ============================================
    // END ACCESS CONTROL CHECK
    // ============================================

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
    const grokKey = Deno.env.get('GROK_API_KEY');
    const googleKey = Deno.env.get('GOOGLE_API_KEY');
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('API Keys available:', {
      claude: !!claudeKey,
      openai: !!openaiKey,
      deepseek: !!deepseekKey,
      grok: !!grokKey,
      google: !!googleKey
    });

    if (!claudeKey && !openaiKey && !deepseekKey && !grokKey && !googleKey) {
      return new Response(
        JSON.stringify({ error: 'No API keys configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const useModel = model || 'gpt-4o';
    const useTemperature = temperature ?? 0.7;
    const useMaxTokens = maxTokens || 4000;

    let content = '';
    let usage: any = null;
    let lastError: Error | null = null;
    let usedModel = useModel;

    // ── Streaming Claude path (used for long-output requests to avoid idle timeout) ──
    if (useStream && useModel.startsWith('claude-') && claudeKey) {
      console.log('Attempting streaming request with Claude...');

      const systemMessage = messages.find((msg: any) => msg.role === 'system');
      const userMessages = messages.filter((msg: any) => msg.role !== 'system');

      const requestBody: any = {
        model: useModel,
        max_tokens: useMaxTokens,
        stream: true,
        messages: userMessages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
      };
      // claude-sonnet-5 rejects temperature with a 400 error — omit it for that model
      if (useModel !== 'claude-sonnet-5') {
        requestBody.temperature = useTemperature;
      }

      if (systemMessage) {
        requestBody.system = systemMessage.content;
      }

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        throw new Error(`Claude streaming API error (${anthropicResponse.status}): ${errorText}`);
      }

      // Pipe the SSE stream straight through to the browser
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        const reader = anthropicResponse.body!.getReader();
        const decoder = new TextDecoder();
        let streamInputTokens = 0;
        let streamOutputTokens = 0;
        let lineBuffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Forward each chunk verbatim — client will parse Anthropic SSE format
            await writer.write(value);
            // Parse alongside for token tracking (decode a copy)
            const text = decoder.decode(value, { stream: true });
            lineBuffer += text;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              try {
                const evt = JSON.parse(line.slice(5).trim());
                if (evt.type === 'message_start') {
                  streamInputTokens = evt.message?.usage?.input_tokens || 0;
                } else if (evt.type === 'message_delta' && evt.usage?.output_tokens !== undefined) {
                  streamOutputTokens = evt.usage.output_tokens;
                }
              } catch { /* ignore parse failures */ }
            }
          }
          await recordUsage(supabase, {
            userId: user.id,
            model: useModel,
            inputTokens: streamInputTokens,
            outputTokens: streamOutputTokens,
            operationType,
            sessionId
          });
          // Send a terminal marker so the client knows the stream ended cleanly
          await writer.write(encoder.encode('\n'));
        } catch (e) {
          console.error('Streaming pipe error:', e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Model-Used': useModel,
        }
      });
    }

    // Handle Claude separately (different API format) — non-streaming path
    if (useModel.startsWith('claude-')) {
      if (!claudeKey) {
        console.log('Claude API key not configured, will attempt fallback models...');
        // Fall through to fallback models below
      } else {
        // Retry logic for rate limiting and overload errors
        const maxRetries = 3;
        let retryCount = 0;
        let lastClaudeError: any = null;

        while (retryCount < maxRetries && !content) {
          try {
            if (retryCount > 0) {
              const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);
              console.log(`Retry attempt ${retryCount}/${maxRetries} after ${backoffMs}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            }

            console.log('Attempting request with Claude...');

            // Convert OpenAI-style messages to Claude format
            const systemMessage = messages.find((msg: any) => msg.role === 'system');
            const userMessages = messages.filter((msg: any) => msg.role !== 'system');

            const requestBody: any = {
              model: useModel,
              max_tokens: useMaxTokens,
              messages: userMessages.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
              })),
            };
            // claude-sonnet-5 rejects temperature with a 400 error — omit it for that model
            if (useModel !== 'claude-sonnet-5') {
              requestBody.temperature = useTemperature;
            }

            // Add system message if present
            if (systemMessage) {
              requestBody.system = systemMessage.content;
            }

            const response = await fetch(
              'https://api.anthropic.com/v1/messages',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': claudeKey,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              lastClaudeError = { status: response.status, errorText };

              // Check if it's a retryable error
              if (response.status === 529 || response.status === 429) {
                console.log(`Claude API ${response.status === 529 ? 'overloaded' : 'rate limited'}, will retry...`);
                retryCount++;
                continue;
              }

              throw new Error(`Claude API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            content = data.content?.[0]?.text || '';
            usedModel = useModel;
            // Phase 3: Include token breakdown for accurate pricing
            usage = {
              total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
              prompt_tokens: data.usage?.input_tokens || 0,
              completion_tokens: data.usage?.output_tokens || 0
            };
            console.log('Claude request successful');
          } catch (error: any) {
            console.error('Claude error:', error);
            lastError = error as Error;

            // If not a retryable error, break out of retry loop
            if (lastClaudeError?.status !== 529 && lastClaudeError?.status !== 429) {
              break;
            }
            retryCount++;
          }
        }

        // If we exhausted retries with 529, return a specific overload message
        if (!content && lastClaudeError?.status === 529) {
          return new Response(
            JSON.stringify({
              error: 'API_OVERLOADED',
              message: 'The AI service is experiencing high demand. Please try again in a moment.',
              retryable: true
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 503
            }
          );
        }

        // If Claude failed but it's not a temporary overload, log and fall through to try GPT-4o
        if (!content) {
          console.log('Claude failed, attempting GPT-4o fallback...');
        }
      }
    }

    // Handle Gemini separately (different API format)
    if (!content && useModel === 'gemini-2.0-flash') {
      if (!googleKey) {
        return new Response(
          JSON.stringify({ error: 'Google API key not configured' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        );
      }
      try {
        console.log('Attempting request with Google Gemini...');

        const geminiMessages = messages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const requestBody = {
          contents: geminiMessages,
          generationConfig: {
            temperature: useTemperature,
            maxOutputTokens: useMaxTokens
          }
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': googleKey
            },
            body: JSON.stringify(requestBody)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        usedModel = useModel;
        // Phase 3: Include token breakdown for accurate pricing
        usage = {
          total_tokens: data.usageMetadata?.totalTokenCount || 0,
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0
        };
        console.log('Gemini request successful');
      } catch (error: any) {
        console.error('Gemini error:', error);
        lastError = error as Error;
      }
    }

    // Handle Grok
    if (!content && useModel === 'grok-4-latest') {
      if (!grokKey) {
        return new Response(
          JSON.stringify({ error: 'Grok API key not configured' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        );
      }
      try {
        console.log('Attempting request with Grok...');
        const grok = new OpenAI({
          apiKey: grokKey,
          baseURL: 'https://api.x.ai/v1'
        });

        const requestBody: any = {
          model: useModel,
          messages,
          temperature: useTemperature,
          max_tokens: useMaxTokens
        };

        if (responseFormat) {
          requestBody.response_format = responseFormat;
        }

        const completion = await grok.chat.completions.create(requestBody);

        content = completion.choices[0]?.message?.content || '';
        usage = completion.usage;
        usedModel = useModel;
        console.log('Grok request successful');
      } catch (error: any) {
        console.error('Grok error:', error);
        lastError = error as Error;
      }
    }

    // Handle DeepSeek
    if (!content && useModel === 'deepseek-chat') {
      if (!deepseekKey) {
        return new Response(
          JSON.stringify({ error: 'DeepSeek API key not configured' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        );
      }
      try {
        console.log('Attempting request with DeepSeek...');
        console.log('DeepSeek request params:', {
          model: 'deepseek-chat',
          messageCount: messages.length,
          temperature: useTemperature,
          maxTokens: useMaxTokens
        });

        const deepseek = new OpenAI({
          apiKey: deepseekKey,
          baseURL: 'https://api.deepseek.com/v1'
        });

        const requestBody: any = {
          model: 'deepseek-chat',
          messages,
          temperature: useTemperature,
          max_tokens: Math.min(useMaxTokens, 8192) // DeepSeek has 8192 token limit
        };

        // DeepSeek doesn't support response_format, so don't include it
        // JSON output is controlled via system prompt instead

        const completion = await deepseek.chat.completions.create(requestBody);

        content = completion.choices[0]?.message?.content || '';
        usage = completion.usage;
        usedModel = 'deepseek-chat';
        console.log('DeepSeek request successful');
      } catch (error: any) {
        console.error('DeepSeek error details:', {
          message: error.message,
          type: error.type,
          status: error.status,
          code: error.code
        });
        console.error('Full DeepSeek error:', error);
        lastError = error as Error;
      }
    }

    // Handle OpenAI (or default)
    if (!content && (useModel === 'gpt-4o' || useModel === 'gpt-4-turbo' || useModel === 'gpt-3.5-turbo' || useModel === 'chatgpt-4o-latest')) {
      if (!openaiKey) {
        console.log('OpenAI key not configured, attempting DeepSeek fallback...');
        // Fall through to DeepSeek fallback below
      } else {
        try {
          console.log(`Attempting request with OpenAI model: ${useModel}`);
          const openai = new OpenAI({ apiKey: openaiKey });

          const requestBody: any = {
            model: useModel,
            messages,
            temperature: useTemperature,
            max_tokens: useMaxTokens
          };

          if (responseFormat) {
            requestBody.response_format = responseFormat;
          }

          const completion = await openai.chat.completions.create(requestBody);

          content = completion.choices[0]?.message?.content || '';
          usage = completion.usage;
          usedModel = useModel;
          console.log('OpenAI request successful');
        } catch (error: any) {
          console.error('OpenAI error:', error);
          lastError = error as Error;
          // Check if it's an invalid API key error
          if (error.message?.includes('401') || error.message?.includes('Incorrect API key')) {
            console.log('Invalid OpenAI API key detected, attempting DeepSeek fallback...');
            // Fall through to DeepSeek fallback below
          }
        }
      }
    }



    if (!content) {
      console.error('All API attempts failed:', lastError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate completion',
          details: lastError?.message || 'Unknown error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // PHASE 4B-2: Credits are tracked via track-tokens edge function
    // No need to update any counters here - enforcement happens at access check time

    if (usage) {
      await recordUsage(supabase, {
        userId: user.id,
        model: usedModel,
        inputTokens: usage.prompt_tokens || usage.input_tokens || 0,
        outputTokens: usage.completion_tokens || usage.output_tokens || 0,
        operationType,
        sessionId
      });
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { content } }],
        usage,
        model_used: usedModel
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in ai-completion function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
