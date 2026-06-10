/**
 * AI-powered modification suggestions for generated content
 */
import { Model, User } from '../../types';
import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';

export interface ModificationSuggestion {
  category: string;
  suggestions: string[];
}

/**
 * Generate AI-powered modification suggestions based on content analysis
 * @param content - The generated content to analyze
 * @param formContext - Context about how the content was generated
 * @param model - The AI model to use
 * @param currentUser - The current user (for token tracking)
 * @param sessionId - Session ID for tracking
 * @param progressCallback - Optional callback for reporting progress
 * @returns Categorized modification suggestions
 */
export async function generateModificationSuggestions(
  content: string,
  formContext: {
    tone?: string;
    targetAudience?: string;
    keyMessage?: string;
    language?: string;
    outputType?: string;
  },
  model: Model,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<ModificationSuggestion[]> {
  if (!content || !content.trim()) {
    throw new Error('Content is required to generate suggestions');
  }

  if (progressCallback) {
    progressCallback('Analyzing content and generating suggestions...');
  }

  // Build a compact system prompt
  const systemPrompt = `You are a content editor. Analyze marketing copy and suggest improvements in 5 categories: Tone & Style, Structure & Flow, Persuasion & Impact, Audience Alignment, and Brevity & Clarity.

CRITICAL: Return valid JSON only. Each suggestion must be a single line string with no newlines or unescaped quotes.

Return this exact format: {"suggestions": [{"category": "Tone & Style", "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}, {"category": "Structure & Flow", "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}, {"category": "Persuasion & Impact", "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}, {"category": "Audience Alignment", "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}, {"category": "Brevity & Clarity", "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}]}`;

  // Build a minimal user prompt with small content sample
  const contentSample = content.substring(0, 600);
  let userPrompt = `Content: "${contentSample}${content.length > 600 ? '...' : ''}"

Target: ${formContext.targetAudience || 'General'}

Provide 3 concise suggestions per category. Keep each suggestion on a single line.`;

  try {
    // Make the API request with minimal token limit
    const data = await makeApiRequestWithFallback(
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7,
      1000,
      { type: "json_object" },
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'content_modification_suggestion',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract and parse the response
    let responseContent = data.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No content in AI response');
    }

    // Clean markdown code fences if present
    const cleanContent = cleanJsonResponse(responseContent);

    // Try to parse, with detailed error logging
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', responseContent);
      console.error('Cleaned content:', cleanContent);
      console.error('Content length:', cleanContent.length);
      console.error('First 500 chars:', cleanContent.substring(0, 500));
      console.error('Last 500 chars:', cleanContent.substring(Math.max(0, cleanContent.length - 500)));

      // Try to fix common JSON issues
      let fixedContent = cleanContent;

      // Fix unescaped newlines in strings
      fixedContent = fixedContent.replace(/([^\\])\n/g, '$1\\n');

      // Fix unescaped quotes in strings (simple heuristic)
      // This is tricky - we need to escape quotes that are inside string values
      // but not the structural quotes

      try {
        parsedResponse = JSON.parse(fixedContent);
        console.log('Successfully parsed after fixing newlines');
      } catch (secondError) {
        console.error('Still failed after fixing newlines:', secondError);
        throw new Error(`Failed to parse AI response: ${parseError.message}. The AI returned malformed JSON.`);
      }
    }

    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
      throw new Error('Invalid response format from AI');
    }

    if (progressCallback) {
      const totalSuggestions = parsedResponse.suggestions.reduce(
        (sum: number, cat: any) => sum + (cat.suggestions?.length || 0),
        0
      );
      progressCallback(`Generated ${totalSuggestions} suggestions across ${parsedResponse.suggestions.length} categories`);
    }

    return parsedResponse.suggestions;
  } catch (error) {
    console.error('Error generating modification suggestions:', error);
    if (progressCallback) {
      progressCallback(`Error: ${error.message}`);
    }
    throw error;
  }
}
