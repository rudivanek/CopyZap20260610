/**
 * URL Analysis API Service
 * Analyzes webpage content to extract key information for pre-filling wizard
 */

import { Model } from '../../types';

type ExtractMode = 'context' | 'fullCopy';

interface UrlContextResponse {
  success: boolean;
  cached?: boolean;
  mode: 'context';
  data: {
    whatCreating: string;
    targetAudience: string;
    tone: string;
    painPoints: string;
    features: string[];
    benefits: string[];
    language: string;
  };
  title: string;
  description: string;
  tokensUsed?: number;
}

interface UrlCopyResponse {
  success: boolean;
  mode: 'fullCopy';
  data: {
    structuredCopy: string;
    language: string;
    targetAudience?: string;
    painPoints?: string;
    tone?: string;
    outputStructure?: Array<{ name: string; wordCount: number }>;
  };
  title: string;
  description: string;
  tokensUsed?: number;
}

type UrlAnalysisResponse = UrlContextResponse | UrlCopyResponse;

/**
 * Analyzes a URL and extracts content data
 * @param mode - 'context' for wizard pre-fill data, 'fullCopy' to extract all copy
 * @param model - AI model to use for analysis
 */
export async function analyzeUrl(
  url: string,
  userId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  mode: ExtractMode = 'context',
  userEmail?: string,
  model?: Model,
  sessionId?: string | null
): Promise<UrlAnalysisResponse> {
  // Use user's selected model, fallback to claude if not provided
  const requestModel = model || 'claude-sonnet-4-5';
  if (!model) {
    console.warn(`⚠️ No model provided to analyzeUrl. Using fallback: claude-sonnet-4-5`);
  }

  const apiUrl = `${supabaseUrl}/functions/v1/analyze-url`;

  // Create abort controller for timeout (3 minutes for full copy, 90 seconds for context)
  const timeoutMs = mode === 'fullCopy' ? 180000 : 90000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`Analyzing URL: ${url} (mode: ${mode}, model: ${requestModel})`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        user_id: userId,
        user_email: userEmail,
        extractMode: mode,
        model: requestModel,
        session_id: sessionId || null
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('URL analysis error:', errorData);
      throw new Error(errorData.error || `Failed to analyze URL: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('URL analysis result:', result);

    // Validate the result has required data
    if (!result.success) {
      throw new Error('URL analysis failed: Invalid response');
    }

    if (mode === 'fullCopy') {
      if (!result.data?.structuredCopy) {
        throw new Error('No content extracted from the URL. The page may be empty or inaccessible.');
      }
    } else {
      if (!result.data?.whatCreating) {
        throw new Error('Failed to extract context from the URL. Please try a different URL.');
      }
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. The page may be too large or slow to load.`);
      }
      throw error;
    }

    throw new Error('An unexpected error occurred while analyzing the URL');
  }
}
