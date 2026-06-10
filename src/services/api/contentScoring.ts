/**
 * Content scoring functionality
 */
import { Model, ScoreData, User } from '../../types';
import { handleApiResponse, calculateTargetWordCount, cleanJsonResponse, makeApiRequestWithFallback } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

/**
 * Generate scores for content
 * @param content - The content to score (can be string or structured content)
 * @param contentType - The type of content being scored
 * @param model - The AI model to use
 * @param originalContent - The original content (for comparison)
 * @param targetWordCount - The target word count for the content
 * @param progressCallback - Optional callback for reporting progress
 * @returns A ScoreData object with various scores and explanations
 */
export async function generateContentScores(
  content: any,
  contentType: string,
  model: Model,
  currentUser?: User,
  originalContent?: string,
  targetWordCount?: number,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<ScoreData> {
  // Handle null or undefined content
  if (content === null || content === undefined) {
    content = '';
  }

  // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
  let actualContent = content;
  if (typeof content === 'object' && content.content) {
    actualContent = content.content;
  }

  // Extract text content from structured content if needed
  const textContent = typeof actualContent === 'string'
    ? actualContent
    : Array.isArray(actualContent)
      ? actualContent.join('\n')
      : actualContent && actualContent.headline
        ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(actualContent);
  
  // Ensure textContent is always a string to prevent trim() errors
  const safeTextContent = textContent || '';

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating scores for ${contentType}...`);
  }
  
  // Count the actual words in the content
  const contentWords = safeTextContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Build the system prompt
  const systemPrompt = `You are an expert content evaluator who provides detailed scoring and analysis of marketing copy.
  Analyze the provided content based on clarity, persuasiveness, tone match, and engagement.
  Also evaluate how well the content matches the target word count (if provided).
  Provide a comprehensive assessment with scores and explanations.
  
  CRITICAL: You MUST respond with a valid JSON object only. All property names MUST be double-quoted. Do not include any text before or after the JSON object.`;
  
  // Build the user prompt
  let userPrompt = `Please evaluate this ${contentType}:

"""
${safeTextContent}
"""`;

  // Add original content for comparison if provided
  if (originalContent) {
    userPrompt += `\n\nOriginal content for comparison:
"""
${originalContent}
"""`;
  }

  // Add word count information if target is provided
  if (targetWordCount) {
    const percentDiff = Math.abs(contentWords - targetWordCount) / targetWordCount * 100;
    userPrompt += `\n\nWord count information:
- Actual word count: ${contentWords} words
- Target word count: ${targetWordCount} words
- Difference: ${contentWords - targetWordCount} words (${percentDiff.toFixed(1)}%)`;
  }

  userPrompt += `\n\nRespond with a JSON object containing:
1. overall: Overall quality score from 0-100 (integer)
2. clarity: Brief assessment of clarity (1-2 sentences)
3. persuasiveness: Brief assessment of persuasiveness (1-2 sentences)
4. toneMatch: Brief assessment of tone appropriateness (1-2 sentences)
5. engagement: Brief assessment of how engaging the content is (1-2 sentences)
6. wordCountAccuracy: ${targetWordCount ? 'A PERCENTAGE SCORE from 0-100 (integer) indicating how well the content matches the target word count. 100 = perfect match, 90 = within 10% of target, 80 = within 20%, etc. IMPORTANT: This must be a number between 0-100, NOT the actual word count.' : 'Not applicable (omit this field)'}
7. improvementExplanation: Detailed explanation of how this content meets the specified requirements and improves upon the original. Include commentary on how well it adheres to instructions like tone, word count, clarity goals, and any specific requirements that were met during generation.
8. suggestions: Array of specific, actionable recommendations for improving the content further (5-7 suggestions). Only include if the overall score is below 95. Each suggestion should be clear, specific, and implementable.

The JSON should follow this structure:
{
  "overall": 85,
  "clarity": "The content clearly explains the value proposition with specific examples.",
  "persuasiveness": "The arguments are compelling and well-supported with evidence.",
  "toneMatch": "The tone is appropriately professional while remaining conversational.",
  "engagement": "The content uses storytelling elements that keep the reader interested.",
  "wordCountAccuracy": 90,
  "improvementExplanation": "This version successfully maintains professional tone while highlighting key benefits. It includes a clear CTA, avoids specified terms, focuses on outcomes, and meets the exact word count requirement. The language is persuasive yet accessible, balancing technical details with results-focused messaging.",
  "suggestions": [
    "Add more specific data points or statistics to strengthen credibility",
    "Include a secondary call-to-action for readers not ready to commit",
    "Enhance emotional appeal by incorporating customer success stories",
    "Tighten the word count by removing redundant phrases in the second paragraph",
    "Strengthen the opening hook to capture attention within the first sentence",
    "Use more active voice throughout to increase energy and directness",
    "Add concrete examples or case studies to support key claims"
  ]
}`;

  try {
    // SCORING FIX: force single model for deterministic evaluation
    const data = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.5,
      Math.round(maxTokens / 3),
      { type: "json_object" }
    );
    
    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        SCORING_MODEL,
        'generate_content_score',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      if (progressCallback) {
        progressCallback(`AI model returned empty response for ${contentType} scoring`);
      }
      
      // Return default scores when AI returns empty content
      return {
        overall: 0,
        clarity: "Unable to evaluate - AI model returned empty response.",
        persuasiveness: "Unable to evaluate - AI model returned empty response.",
        toneMatch: "Unable to evaluate - AI model returned empty response.",
        engagement: "Unable to evaluate - AI model returned empty response.",
        improvementExplanation: "Content scoring was not available due to an empty response from the AI model."
      };
    }
    
    // Parse the JSON content
    const cleanContent = cleanJsonResponse(responseContent);
    const parsedContent = JSON.parse(cleanContent);

    if (progressCallback) {
      progressCallback(`Generated scores for ${contentType}: ${parsedContent.overall}/100`);
    }

    // Validate and cap wordCountAccuracy to 0-100 range
    let validatedWordCountAccuracy = parsedContent.wordCountAccuracy;
    if (validatedWordCountAccuracy !== undefined && validatedWordCountAccuracy !== null) {
      // If the AI returned a value > 100 (possibly the target word count), recalculate it
      if (validatedWordCountAccuracy > 100 && targetWordCount) {
        console.warn(`AI returned invalid wordCountAccuracy: ${validatedWordCountAccuracy}. Recalculating...`);
        // Calculate accuracy based on actual vs target word count
        const percentDiff = Math.abs(contentWords - targetWordCount) / targetWordCount * 100;
        validatedWordCountAccuracy = Math.max(0, Math.min(100, 100 - percentDiff));
      }
      // Ensure it's within 0-100 range
      validatedWordCountAccuracy = Math.max(0, Math.min(100, validatedWordCountAccuracy));
    }

    // Return the score data
    return {
      overall: parsedContent.overall,
      clarity: parsedContent.clarity,
      persuasiveness: parsedContent.persuasiveness,
      toneMatch: parsedContent.toneMatch,
      engagement: parsedContent.engagement,
      wordCountAccuracy: validatedWordCountAccuracy,
      improvementExplanation: parsedContent.improvementExplanation,
      suggestions: parsedContent.suggestions
    };
  } catch (error) {
    console.error(`Error generating scores for ${contentType}:`, error);
    
    if (progressCallback) {
      progressCallback(`Error generating scores: ${error.message}`);
    }
    
    // Return default scores in case of error
    return {
      overall: 70, // Neutral score
      clarity: "Not evaluated due to an error.",
      persuasiveness: "Not evaluated due to an error.",
      toneMatch: "Not evaluated due to an error.",
      engagement: "Not evaluated due to an error.",
      improvementExplanation: "Could not evaluate due to a technical issue."
    };
  }
}