import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.43.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FirecrawlRequest {
  url: string;
  user_id: string;
  user_email?: string;
  extractMode?: 'context' | 'fullCopy';
  model?: string;
  session_id?: string | null;
}

interface ExtractedData {
  whatCreating: string;
  targetAudience: string;
  tone: string;
  painPoints: string;
  features: string[];
  benefits: string[];
  language: string;
}

interface ExtractedCopy {
  structuredCopy: string;
  language: string;
  targetAudience?: string;
  painPoints?: string;
  tone?: string;
  outputStructure?: Array<{ name: string; wordCount: number }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const {
      url,
      user_id,
      user_email,
      extractMode = 'context',
      model = 'gpt-4o',
      session_id
    }: FirecrawlRequest = await req.json();

    if (!url || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: url and user_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log(`Scraping URL with Firecrawl: ${url} (mode: ${extractMode})`);

    // Call Firecrawl API to scrape the URL
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      })
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', firecrawlResponse.status, errorText);

      let userMessage = 'Failed to access the URL. Please check that it is publicly accessible and try again.';
      try {
        const parsed = JSON.parse(errorText);
        const code: string = parsed.code || '';
        if (code === 'SCRAPE_SITE_ERROR' || code === 'ERR_PAGE_CRASH' || code === 'ERR_BLOCKED_BY_CLIENT') {
          userMessage = 'This page could not be loaded. It may be behind a login, block automated crawlers, or be temporarily unavailable.';
        } else if (code === 'ERR_NAME_NOT_RESOLVED' || code === 'ERR_NAME_RESOLUTION_FAILED') {
          userMessage = 'The domain could not be found. Please verify the URL is correct.';
        } else if (code === 'RATE_LIMIT_EXCEEDED' || firecrawlResponse.status === 429) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (code === 'INVALID_URL') {
          userMessage = 'The URL is invalid. Please check the format and try again.';
        } else if (parsed.error) {
          userMessage = 'Could not scrape this page. It may require login or block automated access.';
        }
      } catch {
        // errorText is not JSON — keep default message
      }

      return new Response(
        JSON.stringify({ error: userMessage }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('Firecrawl response received');

    if (!firecrawlData.success || !firecrawlData.data) {
      return new Response(
        JSON.stringify({ error: 'Failed to scrape URL with Firecrawl' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const scrapedData = firecrawlData.data;
    const markdown = scrapedData.markdown || '';
    const title = scrapedData.metadata?.title || '';
    const description = scrapedData.metadata?.description || '';
    const language = scrapedData.metadata?.language || 'en';

    console.log(`Scraped content: ${markdown.length} characters`);

    // Track Firecrawl credit usage
    // Firecrawl costs $0.015 per scrape = 2 credits at $0.01 per credit
    if (session_id) {
      const firecrawlCost = 0.015;
      const firecrawlCredits = Math.ceil((firecrawlCost * 1.30) / 0.01); // Apply 1.30x multiplier, round up

      const { error: trackError } = await sb
        .from('pmc_user_tokens_used')
        .insert({
          user_id,
          session_id,
          model: 'FireCrawl',
          operation_type: 'firecrawl-scrape',
          cost_usd: firecrawlCost,
          billable_units: firecrawlCredits,
          billing_rule_name: 'default',
          pricing_tier: 'standard',
          cost_source: 'fixed'
        });

      if (trackError) {
        console.error('Failed to track Firecrawl credit:', trackError);
      }
    }

    // Now analyze the content with AI based on extractMode
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');

    if (!openaiKey && !deepseekKey) {
      return new Response(
        JSON.stringify({ error: 'No AI API keys configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    let aiResult;
    let tokensUsed = 0;

    if (extractMode === 'context') {
      // Context mode: Extract wizard fields
      const prompt = `Analyze this webpage content and extract key information.

Content:
${markdown.substring(0, 12000)}

Return a JSON object with:
- whatCreating: A 1-2 sentence description of what this page is about
- targetAudience: Who this content is targeting
- tone: The tone of the writing (Professional, Friendly, Bold, Minimalist, Creative, or Persuasive)
- painPoints: What problems or pain points this addresses
- features: Array of key features mentioned
- benefits: Array of key benefits mentioned
- language: Detected language (e.g., "English", "Spanish", "French")`;

      const messages = [
        { role: 'system', content: 'You are an expert copywriter analyzing web content.' },
        { role: 'user', content: prompt }
      ];

      // Try OpenAI first, fallback to DeepSeek
      try {
        if (openaiKey) {
          console.log('Using OpenAI for context analysis');
          const openai = new OpenAI({ apiKey: openaiKey });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          });

          const content = completion.choices[0].message.content || '{}';
          console.log('OpenAI response received:', content.substring(0, 200));
          aiResult = JSON.parse(content);
          tokensUsed = completion.usage?.total_tokens || 0;
        } else {
          console.log('Using DeepSeek for context analysis');
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              temperature: 0.3,
              max_tokens: 1000,
              response_format: { type: 'json_object' }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', errorText);
            throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content || '{}';
          console.log('DeepSeek response received:', content.substring(0, 200));
          aiResult = JSON.parse(content);
          tokensUsed = data.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error('AI analysis error (context mode):', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: `Failed to analyze content with AI: ${errorMsg}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      // Track token usage
      if (session_id && tokensUsed > 0) {
        const modelUsed = openaiKey ? 'gpt-4o' : 'deepseek-chat';
        const costUsd = modelUsed === 'deepseek-chat'
          ? (tokensUsed / 1000) * 0.0025
          : (tokensUsed / 1000) * 0.0003;
        const billableUnits = Math.ceil((costUsd * 1.30) / 0.01); // Apply 1.30x multiplier, round up

        await sb.from('pmc_user_tokens_used').insert({
          user_id,
          session_id,
          model: modelUsed,
          cost_usd: costUsd,
          billable_units: billableUnits,
          billing_rule_name: 'default',
          pricing_tier: 'standard',
          cost_source: 'api_usage',
          operation_type: 'url_analysis_firecrawl'
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'context',
          data: aiResult as ExtractedData,
          title,
          description,
          tokensUsed,
          scraper: 'firecrawl'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      // fullCopy mode: Extract structured copy
      const prompt = `Analyze this webpage and extract the marketing copy with its structure.

Content (markdown):
${markdown.substring(0, 15000)}

Return a JSON object with:
- structuredCopy: The full marketing copy in HTML format with proper heading tags (h1, h2, h3, etc.)
- language: Detected language (e.g., "English", "Spanish")
- targetAudience: (optional) Who this targets
- painPoints: (optional) Problems addressed
- tone: (optional) Writing tone
- outputStructure: Array of objects with generic section names and their actual word counts from the page. Each object should have: {"name": "generic section name", "wordCount": actual_number}. Use generic names like "Hero", "Introduction", "Features", "Benefits", "How It Works", "Testimonials", "FAQ", "Pricing", "About", "Call to Action", etc. Calculate the ACTUAL word count for each section based on the content under each heading.

Example format:
[
  {"name": "Hero", "wordCount": 45},
  {"name": "Features", "wordCount": 320},
  {"name": "Benefits", "wordCount": 180}
]`;

      const messages = [
        { role: 'system', content: 'You are an expert at extracting and structuring marketing copy. Use generic section names (Hero, Introduction, Features, etc.) but calculate the ACTUAL word count for each section from the content.' },
        { role: 'user', content: prompt }
      ];

      try {
        if (openaiKey) {
          console.log('Using OpenAI for fullCopy analysis');
          const openai = new OpenAI({ apiKey: openaiKey });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as any,
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
          });

          const content = completion.choices[0].message.content || '{}';
          console.log('OpenAI response received:', content.substring(0, 200));
          aiResult = JSON.parse(content);
          tokensUsed = completion.usage?.total_tokens || 0;
        } else {
          console.log('Using DeepSeek for fullCopy analysis');
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              temperature: 0.3,
              max_tokens: 4000,
              response_format: { type: 'json_object' }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', errorText);
            throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content || '{}';
          console.log('DeepSeek response received:', content.substring(0, 200));
          aiResult = JSON.parse(content);
          tokensUsed = data.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error('AI analysis error (fullCopy mode):', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: `Failed to analyze content with AI: ${errorMsg}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      // Track token usage
      if (session_id && tokensUsed > 0) {
        const modelUsed = openaiKey ? 'gpt-4o' : 'deepseek-chat';
        const costUsd = modelUsed === 'deepseek-chat'
          ? (tokensUsed / 1000) * 0.0025
          : (tokensUsed / 1000) * 0.0003;
        const billableUnits = Math.ceil((costUsd * 1.30) / 0.01); // Apply 1.30x multiplier, round up

        await sb.from('pmc_user_tokens_used').insert({
          user_id,
          session_id,
          model: modelUsed,
          cost_usd: costUsd,
          billable_units: billableUnits,
          billing_rule_name: 'default',
          pricing_tier: 'standard',
          cost_source: 'api_usage',
          operation_type: 'url_analysis_firecrawl'
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'fullCopy',
          data: aiResult as ExtractedCopy,
          title,
          description,
          tokensUsed,
          scraper: 'firecrawl'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error('Error in analyze-url-firecrawl:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});