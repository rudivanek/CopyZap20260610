/**
 * API utility functions for CopyZap
 */

import { Model, FormState, ContentQualityScore } from '../../types';
import { countWords } from '../../utils/markdownUtils';
import { MAX_TOKENS_PER_MODEL } from '../../constants';
import { toast } from 'react-hot-toast';

// Store the last prompts for display in the prompt modal
let lastSystemPrompt = '';
let lastUserPrompt = '';

/**
 * SCORING ROBUSTNESS FIX: Enhanced JSON extraction with brace-balanced parsing
 * Handles markdown fences, prose, malformed wrapping, and extracts clean JSON
 */
export function cleanJsonResponse(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid response text');
  }

  // Trim whitespace
  let cleanedText = text.trim();

  // Quick check: if already valid JSON, return immediately
  try {
    JSON.parse(cleanedText);
    return cleanedText;
  } catch (e) {
    // Not valid yet, continue cleaning
  }

  // Remove markdown code fences: ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json|JSON)?\s*([\s\S]*?)```/;
  const codeMatch = cleanedText.match(codeBlockRegex);
  if (codeMatch && codeMatch[1]) {
    cleanedText = codeMatch[1].trim();
    // Try parsing this cleaned version
    try {
      JSON.parse(cleanedText);
      return cleanedText;
    } catch (e) {
      // Continue to more aggressive cleaning
    }
  }

  // Remove any leading/trailing backticks
  cleanedText = cleanedText.replace(/^`+|`+$/g, '').trim();

  // Remove leading 'json' or 'JSON' label
  if (/^json\s*\n/i.test(cleanedText)) {
    cleanedText = cleanedText.replace(/^json\s*\n/i, '').trim();
  }

  // Extract first JSON object using balanced brace parsing
  const firstBrace = cleanedText.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = firstBrace; i < cleanedText.length; i++) {
      const char = cleanedText[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) {
            // Found complete JSON object
            let extracted = cleanedText.substring(firstBrace, i + 1);

            // Remove trailing commas before closing braces/brackets (common AI mistake)
            extracted = extracted.replace(/,(\s*[}\]])/g, '$1');

            try {
              JSON.parse(extracted);
              return extracted;
            } catch (e) {
              // Invalid JSON, continue searching
            }
          }
        }
      }
    }
  }

  // Fallback: simple regex extraction (less reliable)
  const objectMatch = cleanedText.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    let extracted = objectMatch[1];
    // Remove trailing commas
    extracted = extracted.replace(/,(\s*[}\]])/g, '$1');
    return extracted.trim();
  }

  // If all else fails, return what we have
  return cleanedText;
}

/**
 * Handle API response and extract JSON data
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  console.log('API Response status:', response.status);
  console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const text = await response.text();
  console.log('Raw API Response:', text);
  const cleanedJson = cleanJsonResponse(text);
  console.log('Cleaned JSON:', cleanedJson);
  
  try {
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error('Error parsing JSON response:', e);
    console.error('Response text:', text);
    console.error('Cleaned JSON:', cleanedJson);
    throw new Error(`Error parsing copy response: ${e}`);
  }
}

/**
 * Store system and user prompts for later display
 */
export function storePrompts(systemPrompt: string, userPrompt: string): void {
  lastSystemPrompt = systemPrompt;
  lastUserPrompt = userPrompt;
}

/**
 * Get the last prompts that were used
 */
export function getLastPrompts(): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: lastSystemPrompt,
    userPrompt: lastUserPrompt
  };
}

/**
 * Determine the API key and base URL based on the selected model
 */
export function getApiConfig(model: Model): { apiKey: string; baseUrl: string; headers: HeadersInit; maxTokens: number } {
  // Get API keys from environment variables
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const grokKey = import.meta.env.VITE_GROK_API_KEY;
  const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Check if any API keys are available
  const availableKeys = [
    { name: 'Claude', key: claudeKey, models: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5'] },
    { name: 'OpenAI', key: openaiKey, models: ['gpt-4o', 'chatgpt-4o-latest', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { name: 'DeepSeek', key: deepseekKey, models: ['deepseek-chat'] },
    { name: 'Grok', key: grokKey, models: ['grok-4-latest'] },
    { name: 'Google', key: googleKey, models: ['gemini-2.0-flash'] }
  ];

  const hasAnyKey = availableKeys.some(api => api.key);

  if (!hasAnyKey) {
    throw new Error('No API keys available. Please check your environment variables.');
  }

  // Get the max tokens for the selected model, defaulting to 4000 if not specified
  const maxTokens = MAX_TOKENS_PER_MODEL[model] || 4000;

  // Determine which API to use based on the model
  if (model.startsWith('claude-')) {
    if (!claudeKey) {
      const message = 'Claude API key not available. Please add VITE_ANTHROPIC_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }

    return {
      apiKey: claudeKey,
      baseUrl: 'https://api.anthropic.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      maxTokens
    };
  } else if (model === 'deepseek-chat') {
    if (!deepseekKey) {
      const message = 'DeepSeek API key not available. Please add VITE_DEEPSEEK_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }

    return {
      apiKey: deepseekKey,
      baseUrl: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      maxTokens
    };
  } else if (model === 'grok-4-latest') {
    if (!grokKey) {
      const message = 'Grok API key not available. Please add VITE_GROK_API_KEY to your .env file. You can get a Grok API key from https://console.x.ai/';
      console.error(message);
      console.log('Available API keys:', availableKeys.filter(api => api.key).map(api => api.name));
      throw new Error(message);
    }

    return {
      apiKey: grokKey,
      baseUrl: 'https://api.x.ai/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokKey}`
      },
      maxTokens
    };
  } else if (model === 'gemini-2.0-flash') {
    if (!googleKey) {
      const message = 'Google API key not available. Please add VITE_GOOGLE_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }

    return {
      apiKey: googleKey,
      baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleKey
      },
      maxTokens
    };
  } else {
    if (!openaiKey) {
      const message = 'OpenAI API key not available. Please add VITE_OPENAI_API_KEY to your .env file.';
      console.error(message);
      throw new Error(message);
    }

    return {
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      maxTokens
    };
  }
}


/**
 * Make an API request using the selected model (no fallback)
 */
export async function makeApiRequestWithFallback(
  model: Model,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  responseFormat?: { type: string },
  userEmail?: string
): Promise<{
  choices: { message: { content: string } }[];
  usage?: { total_tokens: number };
  model_used: Model;
}> {
  // Normalize legacy/removed models — deepseek-chat is no longer a primary model.
  // Sessions saved when DeepSeek was available may still have it stored; map it to Claude.
  const resolvedModel: Model = model === 'deepseek-chat' ? 'claude-sonnet-4-5' : model;
  const attemptedModel = resolvedModel;

  // Check if Supabase is available - if so, use edge function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log(`Making request via Supabase edge function with ${attemptedModel}...`);

      // Get user's JWT token for authentication
      const { supabase } = await import('../supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      // Don't send responseFormat for DeepSeek (it doesn't support it)
      const requestBody: any = {
        messages,
        model: attemptedModel,
        temperature,
        maxTokens
      };

      // Only include responseFormat for models that support it
      if (responseFormat && attemptedModel !== 'deepseek-chat' && attemptedModel !== 'gemini-2.0-flash') {
        requestBody.responseFormat = responseFormat;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Try to parse error as JSON to extract debug info
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.debug) {
            console.error('🔍 SERVER DEBUG INFO:', errorData.debug);
          }
        } catch (e) {
          // Not JSON, continue with text error
        }

        throw new Error(`Edge function error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      console.log(`Success with edge function using ${data.model_used || attemptedModel}`);
      console.log('Edge function response data:', JSON.stringify(data, null, 2));

      return {
        choices: data.choices,
        usage: data.usage,
        model_used: data.model_used || attemptedModel
      };
    } catch (error) {
      console.error('Edge function error:', error);
      throw error;
    }
  }

  // Direct API calls if edge function not available
  try {
    const { baseUrl, headers, maxTokens: modelMaxTokens } = getApiConfig(attemptedModel);

    // Handle Claude API format
    if (attemptedModel.startsWith('claude-')) {
      // Convert OpenAI-style messages to Claude format
      const systemMessage = messages.find(msg => msg.role === 'system');
      const userMessages = messages.filter(msg => msg.role !== 'system');

      const requestBody: any = {
        model: attemptedModel,
        max_tokens: maxTokens,
        messages: userMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        temperature
      };

      // Add system message if present
      if (systemMessage) {
        requestBody.system = systemMessage.content;
      }

      console.log(`Attempting API request with ${attemptedModel}...`);

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Convert Claude response to OpenAI format
      const convertedData = {
        choices: [{
          message: {
            content: data.content?.[0]?.text || ''
          }
        }],
        usage: {
          total_tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
        }
      };

      console.log(`Success with ${attemptedModel}`);

      return {
        ...convertedData,
        model_used: attemptedModel
      };
    }

    // Handle Gemini API format differently
    if (attemptedModel === 'gemini-2.0-flash') {
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      console.log(`Attempting API request with ${attemptedModel}...`);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Convert Gemini response to OpenAI format
      const convertedData = {
        choices: [{
          message: {
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          }
        }],
        usage: {
          total_tokens: data.usageMetadata?.totalTokenCount || 0
        }
      };

      console.log(`Success with ${attemptedModel}`);

      return {
        ...convertedData,
        model_used: attemptedModel
      };
    }

    // OpenAI-compatible API format (OpenAI, DeepSeek, Grok)
    const requestBody: any = {
      model: attemptedModel,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    console.log(`Attempting API request with ${attemptedModel}...`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await handleApiResponse<{
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number }
    }>(response);

    console.log(`Success with ${attemptedModel}`);

    return {
      ...data,
      model_used: attemptedModel
    };
  } catch (error) {
    console.error(`Error with ${attemptedModel}:`, error);
    throw error;
  }
}

/**
 * Test API connectivity for a specific model
 * @param model - The model to test
 * @returns Promise that resolves if API is accessible, rejects if not
 */
export async function testApiConnectivity(model: Model): Promise<{ success: boolean; error?: string }> {
  try {
    const { apiKey, baseUrl, headers } = getApiConfig(model);
    
    // Make a simple test request (usually checking models endpoint)
    const testEndpoint = model === 'grok-4-latest' ? '/models' : '/models';
    
    const response = await fetch(`${baseUrl}${testEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': headers.Authorization as string
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return {
        success: false, 
        error: `API responded with ${response.status}: ${errorText}` 
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown API connectivity error' 
    };
  }
}

/**
 * Calculate token cost based on model (LEGACY - Phase 3 fallback only)
 *
 * IMPORTANT: This function is now a FALLBACK for Phase 3.
 * New code should use DB-driven pricing from pricingResolver.ts
 * This remains for:
 * - Fixed-cost operations (Firecrawl, etc.)
 * - Fallback when DB pricing lookup fails
 * - Backward compatibility
 */
export function calculateTokenCost(tokenCount: number, model: Model): number {
  // Updated pricing as of 2025
  switch (model) {
    case 'claude-sonnet-4-5':
      return tokenCount * 0.000003; // $0.003 per 1K tokens (input), $0.015 per 1K (output) - using average
    case 'claude-haiku-4-5':
      return tokenCount * 0.000001; // $0.001 per 1K tokens (input), $0.005 per 1K (output) - using average
    case 'claude-opus-4-5':
      return tokenCount * 0.000005; // $0.005 per 1K tokens (input), $0.025 per 1K (output) - using average
    case 'gpt-4o':
      return tokenCount * 0.000005; // $0.005 per 1K tokens (estimated)
    case 'gpt-4-turbo':
      return tokenCount * 0.000003; // $0.003 per 1K tokens
    case 'gpt-3.5-turbo':
      return tokenCount * 0.0000015; // $0.0015 per 1K tokens
    case 'deepseek-chat':
      return tokenCount * 0.0000025; // $0.0025 per 1K tokens (estimated)
    case 'grok-4-latest':
      return tokenCount * 0.000015; // $0.015 per 1K tokens (estimated based on xAI pricing)
    case 'gemini-2.0-flash':
      return tokenCount * 0.0000001; // $0.0001 per 1K tokens (very low cost)
    default:
      return tokenCount * 0.000003; // Default to moderate pricing
  }
}

/**
 * Calculate target word count based on form state
 * @param formState - The form state containing word count settings
 * @returns Object with target word count and optional min/max range for little word count mode
 */
export function calculateTargetWordCount(formState: FormState): { target: number; min?: number; max?: number } {
  // Calculate custom word count if selected
  let customWordCount = 0;
  let structureWordCount = 0;
  let presetWordCount = 150; // Default to medium length

  // Defensive: ensure wordCount exists
  if (!formState.wordCount) {
    console.warn('calculateTargetWordCount: wordCount is undefined, using default');
    formState.wordCount = 'Medium: 100-200';
  }

  // Calculate custom word count if selected
  if (formState.wordCount === 'Custom' && formState.customWordCount) {
    customWordCount = formState.customWordCount;
  }

  // Calculate word count from preset ranges
  if (formState.wordCount.includes('Short')) {
    presetWordCount = 75; // Mid-point of 50-100
  } else if (formState.wordCount.includes('Medium')) {
    presetWordCount = 150; // Mid-point of 100-200
  } else if (formState.wordCount.includes('Long')) {
    presetWordCount = 300; // Mid-point of 200-400
  }
  
  // Calculate total from structure elements if they exist
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    structureWordCount = formState.outputStructure.reduce((sum, element) => {
      return sum + (element.wordCount || 0);
    }, 0);
  }
  
  // Priority logic for determining target word count
  let targetWordCount = presetWordCount; // Start with preset as default
  
  // If we have both custom and structure counts
  if (customWordCount > 0 && structureWordCount > 0) {
    // Use the larger value when both are present
    targetWordCount = Math.max(customWordCount, structureWordCount);
  } 
  // If only custom count exists
  else if (customWordCount > 0) {
    targetWordCount = customWordCount;
  } 
  // If only structure counts exist
  else if (structureWordCount > 0) {
    targetWordCount = structureWordCount;
  }
  
  // Check if little word count mode is enabled and target is below 100 words
  if (formState.adhereToLittleWordCount && targetWordCount < 100) {
    const tolerance = formState.littleWordCountTolerancePercentage || 20;
    const toleranceAmount = Math.round(targetWordCount * (tolerance / 100));
    
    return {
      target: targetWordCount,
      min: Math.max(1, targetWordCount - toleranceAmount), // Ensure min is at least 1
      max: targetWordCount + toleranceAmount
    };
  }
  
  // Return simple target for normal mode
  return { target: targetWordCount };
}

/**
 * Get word count tolerance settings based on content length and form state
 * @param formState - The form state containing tolerance settings
 * @param targetWordCount - The target word count
 * @returns Object with tolerance settings
 */
export function getWordCountTolerance(formState: FormState, targetWordCount: number): {
  minimumAcceptablePercentage: number;
  maximumAcceptablePercentage?: number;
  isShortContent: boolean;
  toleranceMode: 'strict' | 'flexible' | 'normal' | 'none';
} {
  const isShortContent = targetWordCount <= 150;

  // No restriction mode - Let AI decide word count (new checkbox)
  if (formState.aiDecideWordCount) {
    return {
      minimumAcceptablePercentage: 0,
      maximumAcceptablePercentage: 999999,
      isShortContent,
      toleranceMode: 'none'
    };
  }

  // Strict word count mode (checkbox ON)
  if (formState.prioritizeWordCount) {
    const tolerance = formState.wordCountTolerancePercentage || 2;
    return {
      minimumAcceptablePercentage: 100 - tolerance,
      maximumAcceptablePercentage: 100 + tolerance,
      isShortContent,
      toleranceMode: 'strict'
    };
  }

  // Flexible mode (checkbox OFF) - Use ±30% tolerance as guidance
  const flexibleTolerance = 30;
  return {
    minimumAcceptablePercentage: 100 - flexibleTolerance,
    maximumAcceptablePercentage: 100 + flexibleTolerance,
    isShortContent,
    toleranceMode: 'flexible'
  };
}

/**
 * Extract the actual word count from content (string or structured)
 */
export function extractWordCount(content: any): number {
  // Handle empty content
  if (!content) return 0;

  // Handle nested content objects (e.g., from Alternative Copy with SEO metadata)
  // Use 'in' operator to check property existence regardless of truthy/falsy value
  if (typeof content === 'object' && content !== null && 'content' in content) {
    const nestedContent = content.content;

    // If nested content is a string (even empty string)
    if (typeof nestedContent === 'string') {
      return countWords(nestedContent);
    }

    // If nested content is structured
    if (nestedContent && typeof nestedContent === 'object' && nestedContent.headline) {
      const textContent = `${nestedContent.headline}\n\n${nestedContent.sections.map((s: any) =>
        `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
      ).join('\n\n')}`;
      return countWords(textContent);
    }
  }

  // Extract text from structured content
  const textContent = typeof content === 'string'
    ? content
    : content.headline
      ? `${content.headline}\n\n${content.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(content);

  // Count words
  return countWords(textContent);
}

/**
 * Generate error message with suggested fixes
 */
export function generateErrorMessage(error: any): string {
  let message = 'An error occurred while processing your request.';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Handle specific error cases
    if (message.includes('429')) {
      message = 'Rate limit exceeded. Please try again in a moment.';
    } else if (message.includes('401') || message.includes('403')) {
      message = 'Authentication error. Please check your API keys in the .env file.';
    } else if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      message = 'The AI service is currently experiencing issues. Please try again later.';
    } else if (message.includes('timeout')) {
      message = 'The request timed out. Please try again or use a different model.';
    }
  }
  
  return message;
}