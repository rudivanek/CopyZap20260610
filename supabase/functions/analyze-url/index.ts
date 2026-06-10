import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.43.0';

// Helper function to make API request with DeepSeek fallback
async function makeApiRequestWithFallback(
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
  responseFormat: { type: string },
  userEmail?: string
): Promise<{ content: string; model_used: string; total_tokens: number }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');

  console.log('API Keys available:', {
    openai: !!openaiKey,
    deepseek: !!deepseekKey
  });

  let lastError: Error | null = null;

  // Try OpenAI first
  if (openaiKey) {
    try {
      console.log('Attempting request with OpenAI...');
      const openai = new OpenAI({ apiKey: openaiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat
      });

      console.log('OpenAI request successful');
      return {
        content: completion.choices[0].message.content || '',
        model_used: 'gpt-4o',
        total_tokens: completion.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error('OpenAI error details:', {
        message: error?.message,
        name: error?.name,
        status: error?.status,
        code: error?.code,
        type: error?.type
      });
      lastError = error as Error;

      // Check if we should fallback to DeepSeek
      const errorStr = String(error);
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      const errorType = error?.type || '';
      const errorStatus = error?.status;

      const shouldFallback =
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorStatus === 429 ||
        errorStr.includes('401') ||
        errorStr.includes('403') ||
        errorStr.includes('429') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('429') ||
        errorMessage.includes('Incorrect API key') ||
        errorMessage.includes('rate_limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('insufficient_quota') ||
        errorCode === 'invalid_api_key' ||
        errorCode === 'insufficient_quota' ||
        errorCode === 'rate_limit_exceeded' ||
        errorType === 'invalid_request_error';

      console.log('Fallback decision:', {
        shouldFallback,
        deepseekAvailable: !!deepseekKey,
        errorStatus,
        errorCode,
        errorType
      });

      if (!shouldFallback || !deepseekKey) {
        throw error;
      }
    }
  } else {
    console.log('No OpenAI key, checking DeepSeek directly');
  }

  // Fallback to DeepSeek (or use as primary if no OpenAI key)
  if (deepseekKey) {
    try {
      const usingAsFallback = !!openaiKey && !!lastError;
      console.log(usingAsFallback ? 'Attempting fallback to DeepSeek...' : 'Using DeepSeek as primary API...');

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature,
          max_tokens: Math.min(maxTokens, 8000), // DeepSeek limit
          response_format: responseFormat
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek error response:', errorText);
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('DeepSeek request successful');

      if (usingAsFallback) {
        console.log('🔄 Using DeepSeek API as fallback');
      }

      return {
        content: data.choices[0]?.message?.content || '',
        model_used: 'deepseek-chat',
        total_tokens: data.usage?.total_tokens || 0
      };
    } catch (fallbackError) {
      console.error('DeepSeek error details:', {
        message: (fallbackError as Error).message,
        name: (fallbackError as Error).name
      });
      throw lastError || fallbackError;
    }
  }

  const errorMsg = 'No API keys available';
  console.error(errorMsg);
  throw lastError || new Error(errorMsg);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UrlAnalysisRequest {
  url: string;
  user_id: string;
  user_email?: string;
  extractMode?: 'context' | 'fullCopy'; // Default: 'context'
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
  structuredCopy: string; // HTML-formatted copy preserving original structure
  language: string;
  targetAudience?: string;
  painPoints?: string;
  tone?: string;
  outputStructure?: Array<{ name: string; wordCount: number }>; // Array of section objects with generic names and actual word counts
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { url, user_id, user_email, extractMode = 'context', session_id }: UrlAnalysisRequest = await req.json();

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

    // Check cache first (only for context mode)
    if (extractMode === 'context') {
      const { data: cached } = await sb
        .from('pmc_url_analysis_cache')
        .select('*')
        .eq('url', url)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached) {
        // Update access tracking
        await sb
          .from('pmc_url_analysis_cache')
          .update({
            access_count: cached.access_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', cached.id);

        console.log(`Cache hit for URL: ${url}`);
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            mode: 'context',
            data: cached.extracted_data,
            title: cached.title,
            description: cached.description
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    console.log(`Fetching URL: ${url} (mode: ${extractMode})`);

    // Fetch the URL content with timeout
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 60000); // 60 second timeout for fetch

    let fetchResponse;
    try {
      fetchResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CopyZap/1.0; +https://copyzap.com)'
        },
        signal: fetchController.signal
      });
      clearTimeout(fetchTimeout);
    } catch (error) {
      clearTimeout(fetchTimeout);
      console.error('Error fetching URL:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error && error.name === 'AbortError'
            ? 'Request timed out while fetching the URL. The page may be too slow or inaccessible.'
            : `Failed to fetch URL: ${error instanceof Error ? error.message : 'Network error'}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    if (!fetchResponse.ok) {
      console.error(`Fetch failed with status: ${fetchResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const html = await fetchResponse.text();
    console.log(`Successfully fetched HTML, length: ${html.length}`);

    // Check if page is a JavaScript-heavy SPA with minimal server-rendered content
    // Look for empty body with just a root div (common in React/Vue/Angular apps)
    const hasMinimalContent = html.length < 2000 &&
                              html.includes('<div id="root">') &&
                              !html.match(/<(p|h1|h2|h3|article|main)[^>]*>[^<]+<\/(p|h1|h2|h3|article|main)>/i);

    if (hasMinimalContent) {
      console.error('Page appears to be a JavaScript-rendered SPA with no server-side content');
      return new Response(
        JSON.stringify({
          error: 'This page uses JavaScript to load content dynamically. URL extraction only works with server-rendered pages that include content in the initial HTML. Try using a page that displays content without JavaScript, or manually copy the content instead.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Extract title and description from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract language from HTML
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const detectedLang = langMatch ? langMatch[1].trim() : 'en';

    // For fullCopy mode, preserve HTML structure but extract main content area first
    let contentForProcessing = html;

    // Try to extract just the main content area to reduce processing time
    // Look for semantic HTML5 tags first
    const mainMatch = contentForProcessing.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = contentForProcessing.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

    // Look for common content container classes (more flexible pattern matching)
    const contentMatches = [
      contentForProcessing.match(/<div[^>]*class=["'][^"']*(post-content|entry-content|article-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
      contentForProcessing.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
      contentForProcessing.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i)
    ];

    // Find the largest content match
    let bestMatch = null;
    let bestSize = 0;

    if (mainMatch && mainMatch[1].length > bestSize) {
      bestMatch = mainMatch[1];
      bestSize = bestMatch.length;
      console.log('Found <main> content:', bestSize);
    }

    if (articleMatch && articleMatch[1].length > bestSize) {
      bestMatch = articleMatch[1];
      bestSize = bestMatch.length;
      console.log('Found <article> content:', bestSize);
    }

    for (const match of contentMatches) {
      if (match && match[2] && match[2].length > bestSize) {
        bestMatch = match[2];
        bestSize = bestMatch.length;
        console.log('Found content div:', bestSize);
      }
    }

    // Use the best match if it's substantial, otherwise use full HTML
    // IMPORTANT: Don't use extracted sections for fullCopy mode to avoid missing FAQ sections
    // that often appear outside the main content div
    if (bestMatch && bestSize > 5000 && extractMode !== 'fullCopy') {
      contentForProcessing = bestMatch;
      console.log('Using extracted content section (context mode)');
    } else {
      console.log(extractMode === 'fullCopy'
        ? 'Using full HTML to capture all sections including FAQs'
        : 'No large content section found, using full HTML');
    }

    // Clean HTML: remove non-content elements but preserve structure
    // This is critical for performance - we only want the actual marketing copy
    contentForProcessing = contentForProcessing
      // Remove ALL script tags first (including JSON-LD, application/json, etc.)
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove inline JavaScript event handlers
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove styles
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\sstyle\s*=\s*["'][^"']*["']/gi, '')
      // Remove navigation and footer (but NOT header - it often contains H1 and intro copy)
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      // Remove other non-content elements
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove data attributes that might contain JSON
      .replace(/\sdata-[a-z-]+\s*=\s*["'][^"']*["']/gi, '');

    console.log(`After cleaning: ${contentForProcessing.length} characters`);

    // Limit content size for AI processing (optimized for speed and timeout limits)
    // Supabase Edge Functions have ~150s timeout
    // For fullCopy mode: no limit since we use regex-based extraction (not AI-based)
    // For context mode: 100k is sufficient for AI analysis
    const maxContentLength = extractMode === 'fullCopy' ? 5000000 : 100000;
    contentForProcessing = contentForProcessing.substring(0, maxContentLength);

    console.log(`Final content size: ${contentForProcessing.length} characters in ${extractMode} mode`);

    // For context mode, create cleaned text version
    let cleanedContent = contentForProcessing
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    cleanedContent = cleanedContent.substring(0, 12000);

    // Handle different extract modes
    if (extractMode === 'fullCopy') {
      // Pre-process HTML to extract text content in structured format
      // This reduces AI processing load and improves accuracy
      let preExtractedContent = contentForProcessing;

      // Extract all headings and paragraphs with markers
      const h1Matches = [...preExtractedContent.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)];
      const h2Matches = [...preExtractedContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
      const h3Matches = [...preExtractedContent.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)];
      const h4Matches = [...preExtractedContent.matchAll(/<h4[^>]*>(.*?)<\/h4>/gi)];
      const h5Matches = [...preExtractedContent.matchAll(/<h5[^>]*>(.*?)<\/h5>/gi)];
      const pMatches = [...preExtractedContent.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];

      // Extract Elementor FAQ/accordion questions (often in <a> tags with specific classes)
      const faqQuestionMatches = [...preExtractedContent.matchAll(/<a[^>]*class=["'][^"']*elementor-toggle-title[^"']*["'][^>]*>(.*?)<\/a>/gi)];

      // Extract accordion/tab content divs
      const accordionContentMatches = [...preExtractedContent.matchAll(/<div[^>]*class=["'][^"']*elementor-tab-content[^"']*["'][^>]*>(.*?)<\/div>/gi)];

      console.log(`Found: ${h1Matches.length} H1, ${h2Matches.length} H2, ${h3Matches.length} H3, ${h4Matches.length} H4, ${h5Matches.length} H5, ${pMatches.length} P, ${faqQuestionMatches.length} FAQ questions`);

      // Debug: Log first FAQ question if found
      if (faqQuestionMatches.length > 0) {
        console.log(`First FAQ: ${faqQuestionMatches[0][1].replace(/<[^>]+>/g, '').trim().substring(0, 100)}`);
      }

      // Build structured content with position tracking
      const contentElements: Array<{pos: number, type: string, text: string}> = [];

      h1Matches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0) {
          contentElements.push({ pos: match.index || 0, type: 'h1', text });
        }
      });

      h2Matches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0) {
          contentElements.push({ pos: match.index || 0, type: 'h2', text });
        }
      });

      h3Matches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0) {
          contentElements.push({ pos: match.index || 0, type: 'h3', text });
        }
      });

      h4Matches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0) {
          contentElements.push({ pos: match.index || 0, type: 'h4', text });
        }
      });

      h5Matches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0) {
          contentElements.push({ pos: match.index || 0, type: 'h5', text });
        }
      });

      // Process FAQ questions as H4 headings (they're formatted as questions)
      faqQuestionMatches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 0 && text.includes('?')) {  // Only if it's a question
          contentElements.push({ pos: match.index || 0, type: 'faq', text });
        }
      });

      // Process accordion content - extract paragraphs from within
      accordionContentMatches.forEach(match => {
        const contentHtml = match[1];
        const innerPMatches = [...contentHtml.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
        innerPMatches.forEach(pMatch => {
          const text = pMatch[1].replace(/<[^>]+>/g, '').trim();
          if (text.length > 10) {
            // Use the parent match's position
            contentElements.push({ pos: match.index || 0, type: 'p', text });
          }
        });
      });

      pMatches.forEach(match => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 10) {  // Only include substantial paragraphs
          contentElements.push({ pos: match.index || 0, type: 'p', text });
        }
      });

      // Sort by position to maintain original order
      contentElements.sort((a, b) => a.pos - b.pos);

      // Build markdown formatted content
      let structuredMarkdown = '';
      contentElements.forEach(el => {
        if (el.type === 'h1') structuredMarkdown += `# ${el.text}\n\n`;
        else if (el.type === 'h2') structuredMarkdown += `## ${el.text}\n\n`;
        else if (el.type === 'h3') structuredMarkdown += `### ${el.text}\n\n`;
        else if (el.type === 'h4') structuredMarkdown += `#### ${el.text}\n\n`;
        else if (el.type === 'h5') structuredMarkdown += `##### ${el.text}\n\n`;
        else if (el.type === 'faq') structuredMarkdown += `#### ${el.text}\n\n`;  // Format FAQ questions as H4
        else if (el.type === 'p') structuredMarkdown += `${el.text}\n\n`;
      });

      console.log(`Pre-extracted markdown length: ${structuredMarkdown.length} characters`);

      // If we have pre-extracted content, use simpler AI prompt for metadata only
      if (structuredMarkdown.length > 100) {
        // Extract metadata using AI
        const metadataPrompt = `Analyze this content and extract metadata:

Content: ${structuredMarkdown.substring(0, 5000)}

Return JSON with:
{
  "language": "English|Spanish|French|German|etc",
  "targetAudience": "who this is for (in content language)",
  "painPoints": "problems addressed (in content language)",
  "tone": "Professional|Friendly|Bold|Minimalist|Creative|Persuasive",
  "outputStructure": [
    {"name": "Hero", "wordCount": 45},
    {"name": "Introduction", "wordCount": 120},
    {"name": "Features", "wordCount": 280}
  ]
}

Use GENERIC section names (Hero, Introduction, Features, Benefits, How It Works, Testimonials, FAQ, Pricing, About, Call to Action, etc.) but calculate the ACTUAL word count for each section by counting words in the content under each heading.`;

        const metadataResult = await makeApiRequestWithFallback(
          [
            {
              role: 'system',
              content: 'Extract metadata from content. Return JSON only.'
            },
            { role: 'user', content: metadataPrompt }
          ],
          0.3,
          2000,
          { type: 'json_object' },
          user_email
        );

        const metadata = JSON.parse(metadataResult.content || '{}');

        const extractedCopy: ExtractedCopy = {
          structuredCopy: structuredMarkdown,
          language: metadata.language || 'English',
          targetAudience: metadata.targetAudience,
          painPoints: metadata.painPoints,
          tone: metadata.tone,
          outputStructure: metadata.outputStructure
        };

        // Track token usage
        const tokensUsed = metadataResult.total_tokens;
        const costUsd = metadataResult.model_used === 'deepseek-chat'
          ? (tokensUsed / 1000) * 0.0025
          : (tokensUsed / 1000) * 0.0003;

        await sb
          .from('pmc_user_tokens_used')
          .insert({
            user_id,
            operation_type: 'url_copy_extraction',
            model: metadataResult.model_used,
            tokens_used: tokensUsed,
            cost_usd: costUsd,
            session_id: session_id || null
          });

        console.log(`Successfully extracted copy from URL: ${url}, tokens: ${tokensUsed}`);

        return new Response(
          JSON.stringify({
            success: true,
            mode: 'fullCopy',
            data: extractedCopy,
            title,
            description,
            tokensUsed
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Fallback to original AI-based extraction if pre-processing didn't work
      const copyExtractionPrompt = `Extract ALL marketing copy from this HTML in ORIGINAL ORDER. Find and extract ALL text content including headings, paragraphs, lists, and other text elements.

IMPORTANT:
- Extract the FULL TEXT CONTENT, not just section names or summaries
- Include complete paragraphs with ALL sentences and details
- Look for content inside divs, sections, articles, and header elements
- Extract ALL heading levels (h1, h2, h3, h4, h5, h6) with their full text
- Include text inside span tags and other inline elements
- Preserve quotes, emphasis, and formatted text

Format as markdown:
- # for h1 headings
- ## for h2 headings
- ### for h3 headings
- #### for h4 headings (if present)
- Plain text for paragraphs
- Preserve the original order
- Keep line breaks between sections

Exclude ONLY: navigation menus, footers, copyright notices, cookie banners, button labels.

HTML: ${contentForProcessing}

Return JSON:
{
  "structuredCopy": "# Main Heading\\n\\nFull paragraph text here with all details...\\n\\n## Section Heading\\n\\nComplete section text...",
  "language": "English|Spanish|French|German|etc",
  "targetAudience": "who this is for (in content language)",
  "painPoints": "problems addressed (in content language)",
  "tone": "Professional|Friendly|Bold|Minimalist|Creative|Persuasive",
  "outputStructure": ["Section1", "Section2", "Section3"]
}`;

      const copyResult = await makeApiRequestWithFallback(
        [
          {
            role: 'system',
            content: 'You are a content extraction expert. Extract ALL marketing copy from HTML, including full paragraphs and all text content. Look inside ALL elements including divs, spans, sections, articles, and headers. Extract ALL heading levels (h1-h6). Format as markdown: # for h1, ## for h2, ### for h3, #### for h4. Preserve original order. Return complete text with ALL sentences, not summaries. Return JSON only.'
          },
          { role: 'user', content: copyExtractionPrompt }
        ],
        0,
        16000,
        { type: 'json_object' },
        user_email
      );

      const rawContent = copyResult.content;
      console.log('OpenAI response received, parsing...');

      if (!rawContent) {
        throw new Error('OpenAI returned empty response');
      }

      let extractedCopy: ExtractedCopy = JSON.parse(rawContent);

      // Validate that we got actual content
      if (!extractedCopy.structuredCopy || extractedCopy.structuredCopy.trim().length < 10) {
        console.error('Extracted copy is empty or too short');
        throw new Error('No meaningful content could be extracted from the URL. The page may not contain extractable marketing copy.');
      }

      console.log(`Extracted copy length: ${extractedCopy.structuredCopy.length} characters`);

      // Clean up any remaining HTML tags and format properly
      if (extractedCopy.structuredCopy) {
        extractedCopy.structuredCopy = extractedCopy.structuredCopy
          // Remove all HTML tags including <p>, <div>, <span>, etc.
          .replace(/<[^>]+>/g, '')
          // Remove HTML entities
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          // Clean up extra whitespace but preserve intentional line breaks
          .replace(/[ \t]+/g, ' ')
          // Normalize line breaks (max 2 consecutive)
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      // Track token usage
      const tokensUsed = copyResult.total_tokens;
      const costUsd = copyResult.model_used === 'deepseek-chat'
        ? (tokensUsed / 1000) * 0.0025
        : (tokensUsed / 1000) * 0.0003;

      await sb
        .from('pmc_user_tokens_used')
        .insert({
          user_id,
          operation_type: 'url_copy_extraction',
          model: copyResult.model_used,
          tokens_used: tokensUsed,
          cost_usd: costUsd,
          session_id: session_id || null
        });

      console.log(`Successfully extracted copy from URL: ${url}, tokens: ${tokensUsed}`);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'fullCopy',
          data: extractedCopy,
          title,
          description,
          tokensUsed
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Context analysis mode (default)
    const analysisPrompt = `Analyze the following webpage content and extract key information in JSON format.

Page Language: ${detectedLang}
Title: ${title}
Description: ${description}
Content: ${cleanedContent}

Extract:
1. whatCreating: What product/service/content is this (1-2 sentences)?
2. targetAudience: Who is the target audience (be specific)?
3. tone: What is the tone/voice? Choose ONE from: Professional, Friendly, Bold, Minimalist, Creative, Persuasive
4. painPoints: What problems/pain points does it address (comma-separated)?
5. features: List of key features mentioned (array of strings, max 5)
6. benefits: List of main benefits (array of strings, max 5)
7. language: Detect the primary language of the content. Return the full language name in English (e.g., "English", "Spanish", "French", "German", "Italian", "Portuguese")

CRITICAL: Preserve the original language of the content when writing descriptions. If the webpage is in Spanish, respond in Spanish. If it's in French, respond in French, etc. But ALWAYS return the language field in English (e.g., "Spanish" not "Español").

Return ONLY valid JSON with these exact keys. Be concise and specific.`;

    const analysisResult = await makeApiRequestWithFallback(
      [
        {
          role: 'system',
          content: 'You are a marketing content analyzer. Extract structured data from webpage content. Return only valid JSON.'
        },
        { role: 'user', content: analysisPrompt }
      ],
      0.3,
      4000,
      { type: 'json_object' },
      user_email
    );

    const extractedData: ExtractedData = JSON.parse(
      analysisResult.content || '{}'
    );

    // Cache the results
    await sb
      .from('pmc_url_analysis_cache')
      .insert({
        url,
        title,
        description,
        content: cleanedContent.substring(0, 1000), // Store sample
        extracted_data: extractedData,
        access_count: 1,
        last_accessed_at: new Date().toISOString()
      });

    // Track token usage
    const tokensUsed = analysisResult.total_tokens;
    const costUsd = analysisResult.model_used === 'deepseek-chat'
      ? (tokensUsed / 1000) * 0.0025
      : (tokensUsed / 1000) * 0.0003;

    await sb
      .from('pmc_user_tokens_used')
      .insert({
        user_id,
        operation_type: 'url_analysis',
        model: analysisResult.model_used,
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        session_id: session_id || null
      });

    console.log(`Successfully analyzed URL: ${url}, tokens: ${tokensUsed}`);

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        mode: 'context',
        data: extractedData,
        title,
        description,
        tokensUsed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze-url function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});