import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from 'npm:openai@4.43.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/?(p|h1|h2|h3|h4|h5|h6|li|div|br)[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n'); // Multiple newlines to double newline
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  text = text.trim();

  return text;
}

/**
 * Fetch HTML from a URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandVoiceScanner/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return extractTextFromHtml(html);
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    throw new Error(`Failed to fetch content from URL: ${error.message}`);
  }
}

/**
 * Try to find and fetch About page
 */
async function tryFetchAboutPage(baseUrl: string): Promise<string | null> {
  const aboutPaths = ['/about', '/about-us', '/about-me', '/our-story'];

  try {
    const url = new URL(baseUrl);
    const origin = url.origin;

    for (const path of aboutPaths) {
      try {
        const aboutUrl = `${origin}${path}`;
        const response = await fetch(aboutUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BrandVoiceScanner/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });

        if (response.ok) {
          const html = await response.text();
          return extractTextFromHtml(html);
        }
      } catch (err) {
        // Continue to next path
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching about page:', error);
  }

  return null;
}

/**
 * Limit text to a specific character count
 */
function limitText(text: string, maxChars: number = 6000): string {
  if (text.length <= maxChars) return text;

  // Try to break at a sentence or paragraph
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');

  const breakPoint = Math.max(lastPeriod, lastNewline);
  if (breakPoint > maxChars * 0.8) {
    return truncated.substring(0, breakPoint + 1);
  }

  return truncated + '...';
}

/**
 * Analyze text content and extract brand voice using AI
 */
async function analyzeBrandVoice(text: string): Promise<any> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');

  console.log('API Keys available:', {
    openai: !!openaiKey,
    deepseek: !!deepseekKey
  });

  if (!openaiKey && !deepseekKey) {
    throw new Error('No API keys configured');
  }

  const systemPrompt = `You are an AI specializing in brand voice detection.

Analyze the following website content and extract the brand's tone, personality, vocabulary, CTA style, and writing style.

Return ONLY JSON in this exact schema:
{
  "description": "",
  "personality_traits": [],
  "tone_style": "",
  "sentence_style": "",
  "preferred_vocabulary": [],
  "forbidden_terms": [],
  "cta_style": "",
  "punctuation_rules": {
    "use_oxford_comma": true,
    "prefer_short_sentences": false,
    "max_sentence_length": 25,
    "use_contractions": true,
    "exclamation_frequency": "moderate"
  }
}

The JSON must be valid and include all fields. Infer missing fields from context.

Instructions:
- description: 1-2 sentence summary of the brand voice based on the content
- personality_traits: 4-6 adjectives that describe the brand personality
- tone_style: overall tone (e.g., "professional-friendly", "casual-energetic")
- sentence_style: sentence structure (e.g., "short-direct", "flowing-descriptive")
- preferred_vocabulary: 8-12 words/phrases commonly used by this brand
- forbidden_terms: 5-8 words/phrases that don't fit this brand's voice
- cta_style: the call-to-action style used
- punctuation_rules: appropriate settings based on the writing style

Return ONLY valid JSON, no additional text.`;

  const userPrompt = `Website Content:\n\n${text}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  let content = '';
  let lastError: Error | null = null;

  // Try OpenAI first
  if (openaiKey) {
    try {
      console.log('Attempting brand voice analysis with OpenAI...');
      const openai = new OpenAI({ apiKey: openaiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      });

      content = completion.choices[0]?.message?.content || '';
      console.log('OpenAI analysis successful');
    } catch (error: any) {
      console.error('OpenAI error:', error);
      lastError = error as Error;
    }
  }

  // Fallback to DeepSeek if OpenAI failed or not available
  if (!content && deepseekKey) {
    try {
      console.log('Attempting brand voice analysis with DeepSeek...');
      const deepseek = new OpenAI({
        apiKey: deepseekKey,
        baseURL: 'https://api.deepseek.com/v1'
      });

      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2500
      });

      content = completion.choices[0]?.message?.content || '';
      console.log('DeepSeek analysis successful');
    } catch (error: any) {
      console.error('DeepSeek error:', error);
      lastError = error as Error;
    }
  }

  if (!content) {
    console.error('All API attempts failed:', lastError);
    throw new Error('Failed to analyze brand voice');
  }

  // Clean JSON response if wrapped in code blocks
  let cleanedContent = content;
  const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = content.match(jsonCodeBlockRegex);
  if (match && match[1]) {
    cleanedContent = match[1].trim();
  }

  return JSON.parse(cleanedContent);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url, scanAbout, user_id, session_id } = await req.json();

    // Validate URL
    if (!url || !url.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.match(/^https?:\/\//i)) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL must start with http:// or https://' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch main page content
    let combinedText = await fetchUrlContent(trimmedUrl);

    // Fetch about page if requested
    if (scanAbout) {
      const aboutText = await tryFetchAboutPage(trimmedUrl);
      if (aboutText) {
        combinedText += '\n\n--- About Page ---\n\n' + aboutText;
      }
    }

    // Limit text to manageable size
    combinedText = limitText(combinedText, 6000);

    if (!combinedText || combinedText.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract enough text from the website' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Analyze brand voice with AI
    const brandVoice = await analyzeBrandVoice(combinedText);

    // Track token usage if user_id is provided
    if (user_id) {
      try {
        const sb = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          {
            auth: { autoRefreshToken: false, persistSession: false }
          }
        );

        // Estimate tokens (rough estimate: 1 token ≈ 4 characters)
        const systemPromptLength = 1700; // Approximate length of system prompt
        const estimatedPromptTokens = Math.ceil((systemPromptLength + combinedText.length) / 4);
        const estimatedCompletionTokens = Math.ceil((JSON.stringify(brandVoice).length) / 4);
        const tokensUsed = estimatedPromptTokens + estimatedCompletionTokens;

        // Determine which model was used
        const openaiKey = Deno.env.get('OPENAI_API_KEY');
        const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
        const modelUsed = openaiKey ? 'gpt-4o' : 'deepseek-chat';
        const costUsd = modelUsed === 'deepseek-chat'
          ? (tokensUsed / 1000) * 0.0025
          : (tokensUsed / 1000) * 0.0003;

        await sb
          .from('pmc_user_tokens_used')
          .insert({
            user_id,
            operation_type: 'brand_voice_url_extraction',
            model: modelUsed,
            tokens_used: tokensUsed,
            cost_usd: costUsd,
            session_id: session_id || null
          });

        console.log(`Tracked token usage: ${tokensUsed} tokens for user ${user_id}`);
      } catch (trackingError) {
        console.error('Error tracking tokens:', trackingError);
        // Don't fail the request if token tracking fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brandVoice,
        text: combinedText,
        length: combinedText.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in extract-brand-voice-from-url:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to extract content from URL'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
