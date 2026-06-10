import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from 'npm:openai@4.43.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { pastedContent, brandDescription, sampleText, user_id, session_id } = await req.json();

    // Validate that we have either pasted content OR brand description
    if (!pastedContent && !brandDescription) {
      return new Response(
        JSON.stringify({ error: 'Please provide either pastedContent or brandDescription' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // If using pasted content, require minimum length
    if (pastedContent && pastedContent.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least 100 characters for accurate analysis' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');

    console.log('API Keys available:', {
      openai: !!openaiKey,
      deepseek: !!deepseekKey
    });

    if (!openaiKey && !deepseekKey) {
      return new Response(
        JSON.stringify({ error: 'No API keys configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const systemPrompt = `You are an AI specializing in brand voice creation and extraction.

${pastedContent
  ? 'Analyze the following text and extract the brand\'s writing style, tone, vocabulary, and personality.'
  : 'Generate a brand voice profile based on the brand description provided.'
}

Return ONLY valid JSON in this EXACT schema:
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
  },
  "advanced_style": {
    "sentence_length": "",
    "rhythm": "",
    "formality": 3,
    "emotional_tone": [],
    "persona": "",
    "pov": "",
    "figurative_level": "",
    "detail_depth": "",
    "vocabulary_complexity": "",
    "content_structure_rules": {
      "short_paragraphs": false,
      "use_bullets": false,
      "questions_allowed": true
    },
    "allowed_elements": [],
    "forbidden_elements": []
  }
}

- description: 1-2 sentence summary of the brand voice observed
- personality_traits: 4-6 adjectives describing the brand personality from the text
- tone_style: e.g., "conversational-warm", "formal-professional", "casual-playful"
- sentence_style: e.g., "short-punchy", "flowing-descriptive", "clear-concise"
- preferred_vocabulary: 8-12 notable words/phrases used in this copy
- forbidden_terms: 5-8 words/phrases this brand would likely avoid
- cta_style: one of: "direct-action", "subtle-invitation", "friendly-invitation", "enthusiastic-action", "consultative-invitation", "urgent-action"
- punctuation_rules: appropriate settings based on the observed style
- advanced_style: Fine-grained style controls:
  - sentence_length: "short", "medium", "long", or "varied"
  - rhythm: "staccato", "smooth", "energetic", or "calm"
  - formality: 1-5 (1=very casual, 5=very formal)
  - emotional_tone: array of tones like ["warm", "friendly", "professional"]
  - persona: "mentor", "friend", "expert", "leader", "storyteller", "coach", "analyst", or "luxury_concierge"
  - pov: "first_person", "second_person", "third_person", or "brand_voice"
  - figurative_level: "literal", "balanced", or "metaphorical"
  - detail_depth: "minimal", "balanced", "detailed", or "highly_explanatory"
  - vocabulary_complexity: "simple", "basic_professional", "sophisticated", or "highly_intellectual"
  - content_structure_rules: object with booleans for short_paragraphs, use_bullets, questions_allowed
  - allowed_elements: array of allowed content elements
  - forbidden_elements: array of forbidden content elements

Do not add commentary. Only return JSON.`;

    let userPrompt = '';
    if (pastedContent) {
      userPrompt = `Analyze this text sample:\n\n${pastedContent.trim().substring(0, 10000)}`;
    } else {
      userPrompt = `Brand Description: ${brandDescription}${sampleText ? `\n\nSample Text: ${sampleText}` : ''}`;
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    let content = '';
    let lastError: Error | null = null;

    // Try OpenAI first
    if (openaiKey) {
      try {
        console.log('Attempting request with OpenAI...');
        const openai = new OpenAI({ apiKey: openaiKey });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        });

        content = completion.choices[0]?.message?.content || '';
        console.log('OpenAI request successful');
      } catch (error: any) {
        console.error('OpenAI error:', error);
        lastError = error as Error;
      }
    }

    // Fallback to DeepSeek if OpenAI failed or not available
    if (!content && deepseekKey) {
      try {
        console.log('Attempting request with DeepSeek...');
        const deepseek = new OpenAI({
          apiKey: deepseekKey,
          baseURL: 'https://api.deepseek.com/v1'
        });

        const completion = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        });

        content = completion.choices[0]?.message?.content || '';
        console.log('DeepSeek request successful');
      } catch (error: any) {
        console.error('DeepSeek error:', error);
        lastError = error as Error;
      }
    }

    if (!content) {
      console.error('All API attempts failed:', lastError);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze brand voice' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Clean JSON response if wrapped in code blocks
    let cleanedContent = content;
    const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = content.match(jsonCodeBlockRegex);
    if (match && match[1]) {
      cleanedContent = match[1].trim();
    }

    const parsed = JSON.parse(cleanedContent);

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
        const estimatedPromptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
        const estimatedCompletionTokens = Math.ceil((content.length) / 4);
        const tokensUsed = estimatedPromptTokens + estimatedCompletionTokens;

        // Determine which model was used based on which API succeeded
        const modelUsed = openaiKey && !lastError ? 'gpt-4o' : 'deepseek-chat';
        const costUsd = modelUsed === 'deepseek-chat'
          ? (tokensUsed / 1000) * 0.0025
          : (tokensUsed / 1000) * 0.0003;

        await sb
          .from('pmc_user_tokens_used')
          .insert({
            user_id,
            operation_type: 'brand_voice_analysis',
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
      JSON.stringify(parsed),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-brand-voice function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
