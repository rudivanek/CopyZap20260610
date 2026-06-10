/**
 * Deep Analysis Service
 *
 * Provides narrative guidance and strategic recommendations for generated content versions.
 * This is SEPARATE from the scoring engine - it does NOT affect winner selection or numeric scores.
 *
 * Purpose:
 * - Detailed strengths/weaknesses analysis
 * - Strategic recommendations
 * - Deployment guidance
 * - Overall verdict (winner-focused)
 *
 * Caching:
 * - Uses contentHash + contextKey + analysisVersion
 * - Incremental updates for changed versions only
 * - Independent from scoring cache
 */

import { FormState, Model, VersionDeepAnalysis, ComparisonDeepAnalysisMeta } from '../../types';
import { handleApiResponse, generateErrorMessage, makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

const ANALYSIS_VERSION = 'deep-v1';

/**
 * Simple hash function for browser environment
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a hash for content to enable caching
 */
function generateContentHash(content: any): string {
  const contentString = typeof content === 'string'
    ? content
    : JSON.stringify(content);
  return simpleHash(contentString);
}

/**
 * Generate a context key for cache invalidation
 * Changes when model, persona, or analysis context changes
 */
function generateContextKey(
  model: Model,
  persona?: string,
  formState?: FormState
): string {
  const contextData = {
    model,
    persona,
    language: formState?.language,
    tone: formState?.tone,
    analysisVersion: ANALYSIS_VERSION
  };
  return simpleHash(JSON.stringify(contextData));
}

/**
 * Analyze a single version in depth
 *
 * Returns narrative guidance, strengths, weaknesses, and strategic recommendations.
 * Does NOT return numeric scores - those come from the scoring engine only.
 *
 * @param content - The content to analyze
 * @param optionLabel - Display label (e.g., "Standard Version", "Donald Miller's Voice")
 * @param model - AI model to use
 * @param currentUser - Current user for token tracking
 * @param formState - Form state for context
 * @param sessionId - Session ID for token tracking
 * @param progressCallback - Optional progress callback
 * @param currentScore - This version's raw LLM score from the comparison result (used to calibrate delta estimates)
 * @param parentScore - Score of the version this was derived from, if traceable (used to show improvement delta context)
 * @param parentCopyText - Full text of the parent version; when provided, switches to diff-aware evaluation mode
 * @returns VersionDeepAnalysis with narrative guidance
 */
export async function analyzeVersionDeep(
  content: any,
  optionLabel: string,
  model: Model, // Parameter kept for backward compatibility but overridden
  currentUser?: any,
  formState?: FormState,
  sessionId?: string,
  progressCallback?: (message: string) => void,
  currentScore?: number,
  parentScore?: number,
  parentCopyText?: string
): Promise<VersionDeepAnalysis> {
  // Use user's selected model, fallback to SCORING_MODEL only if not provided
  const actualModel = model || SCORING_MODEL;

  try {
    const contentHash = generateContentHash(content);
    const contextKey = generateContextKey(actualModel, formState?.selectedPersona, formState);

    if (progressCallback) {
      progressCallback(`Analyzing ${optionLabel} in detail...`);
    }

    // Determine content type
    const isStructured = typeof content === 'object' && !Array.isArray(content);
    const isHeadlines = Array.isArray(content);

    // Format content for analysis
    let formattedContent: string;
    if (isHeadlines) {
      formattedContent = (content as string[]).map((h, i) => `${i + 1}. ${h}`).join('\n');
    } else if (isStructured) {
      formattedContent = JSON.stringify(content, null, 2);
    } else {
      formattedContent = String(content);
    }

    // Compute score-aware calibration for delta estimates
    const scoreForCap = currentScore ?? 70;
    const projectedScoreCap = Math.min(92, scoreForCap + 15);

    console.log('[deepAnalysis] mode:', parentCopyText ? 'diff-aware' : 'standard', '| currentScore:', currentScore, '| parentScore:', parentScore);

    // Build analysis prompt — diff-aware when parent copy is available, standard otherwise
    let systemPrompt: string;
    let userPrompt: string;

    if (parentCopyText) {
      // Diff-aware mode: evaluate the modifications rather than the whole piece from scratch
      const scoreCalibration = currentScore != null
        ? `The original version scored ${parentScore ?? '?'}/100. The current version scored ${currentScore}/100. Calibrate points_delta against the current score of ${currentScore}. Most deltas should be 1–3 pts; only transformational changes earn 4–5 pts. The composite score never exceeds ${projectedScoreCap} even if all suggestions are applied.`
        : `The composite score never exceeds ${projectedScoreCap} even if all suggestions are applied.`;

      systemPrompt = `You are evaluating a modified version of existing copy. ${scoreCalibration}

Your task is to return STRICT JSON ONLY (no markdown, no extra text).

First, identify exactly what changed between the two versions (added, removed, or rewritten sections).
Then evaluate whether each change improves or weakens the copy against these dimensions: CTA Strength, Specificity, Clarity, Trust, Persuasiveness, Audience Fit.

Return ONLY this JSON structure:
{
  "summary": "2-4 sentence overview focusing on what the modifications achieved (or failed to achieve)",
  "keyStrengths": ["What the modifications did well — specific to the changes, not general praise"],
  "suggestedImprovements": [
    { "text": "What the modifications missed or introduced as a new weakness", "points_delta": 2, "dimension": "Clarity" }
  ],
  "strategicRecommendation": "Whether the modifications moved in the right direction and what the next highest-leverage change would be"
}

CRITICAL RULE — suggestedImprovements MUST be a JSON array of objects with exactly three fields each:
  "text": string — actionable improvement description
  "points_delta": integer 1–5 — realistic score gain if implemented (calibrated to current score)
  "dimension": string — e.g. "Clarity", "Persuasiveness", "CTA Strength", "Engagement", "Specificity", "Trust"

DO NOT return plain strings in suggestedImprovements. Every item must be an object with all three fields.
4–8 suggestions total. Focus on what the edit introduced or missed, not the whole piece.`;

      userPrompt = `Analyze the modifications made to: "${optionLabel}"

Language: ${formState?.language || 'English'}
Tone Goal: ${formState?.tone || 'Professional'}
Target Audience: ${formState?.targetAudience || 'General'}

ORIGINAL VERSION:
${parentCopyText}

MODIFIED VERSION:
${formattedContent}

Return ONLY valid JSON with the exact structure specified. No markdown, no explanations.`;

    } else {
      // Standard mode: evaluate the full piece holistically
      const scoreContext = currentScore != null
        ? `This version scored ${currentScore}/100.${parentScore != null ? ` It was derived from a version that scored ${parentScore}/100, so the improvement delta was +${currentScore - parentScore} pts.` : ''} When estimating points_delta for each suggestion, calibrate against the current score of ${currentScore}. Versions scoring 75+ have less room for improvement — most suggestions should be in the 1–3 pt range, with only transformational changes earning 4–5 pts.`
        : '';

      systemPrompt = `You are an expert copywriting analyst providing strategic guidance and recommendations.

Your task is to analyze the provided copy and return STRICT JSON ONLY (no markdown, no extra text).

CRITICAL: Your analysis provides narrative guidance only. Do NOT generate numeric scores (0-100).
The official scoring engine handles all numeric scoring separately.

Focus on:
- Concrete, specific observations (reference actual lines/sections)
- Strategic deployment recommendations
- Actionable improvements with estimated impact
- Real-world application guidance

Return ONLY this JSON structure:
{
  "summary": "2-4 sentence overview of what makes this copy work (or not)",
  "keyStrengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3", "Specific strength 4"],
  "suggestedImprovements": [
    { "text": "Actionable improvement 1", "points_delta": 3, "dimension": "Clarity" },
    { "text": "Actionable improvement 2", "points_delta": 2, "dimension": "Persuasiveness" }
  ],
  "strategicRecommendation": "2-4 sentences on where/how to deploy this copy for maximum impact"
}

CRITICAL RULE — suggestedImprovements MUST be a JSON array of objects. Each object MUST have exactly three fields:
  "text": string — the actionable improvement description
  "points_delta": integer 1–5 — how many score points this improvement would add if implemented
  "dimension": string — which scoring dimension it addresses (e.g. "Clarity", "Persuasiveness", "CTA Strength", "Engagement", "Specificity")

DO NOT return plain strings in suggestedImprovements. Every item must be an object with all three fields.

${scoreContext}

points_delta guidance:
- 1–2 pts: minor wording tweak, small readability fix
- 3–4 pts: meaningful structural or messaging change
- 5 pts: major rewrite of a key section (use sparingly)
- Assign higher deltas to improvements targeting the weakest areas
- 4–8 suggestions total
- The composite score never exceeds ${projectedScoreCap} even if all suggestions are applied

Additional notes:
- Keep bullets concrete and specific (avoid vague statements like "good flow")
- Reference actual phrases or sections from the copy when possible
- If copy includes unsupported claims, suggest safer phrasing in improvements
- Focus on deployment strategy in the strategic recommendation`;

      userPrompt = `Analyze this copy version: "${optionLabel}"

Content Type: ${isHeadlines ? 'Headlines' : isStructured ? 'Structured' : 'Plain Text'}
Language: ${formState?.language || 'English'}
Tone Goal: ${formState?.tone || 'Professional'}
Target Audience: ${formState?.targetAudience || 'General'}
Section: ${formState?.section || 'Marketing Copy'}

CONTENT TO ANALYZE:
${formattedContent}

Return ONLY valid JSON with the exact structure specified. No markdown, no explanations.`;
    }

    // Call AI  (temperature first, maxTokens second — matches makeApiRequestWithFallback signature)
    const data = await makeApiRequestWithFallback(
      actualModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.3,  // temperature
      2000  // maxTokens
    );

    // Track tokens
    const tokenUsage = data.usage?.total_tokens || 0;
    if (currentUser && tokenUsage > 0 && sessionId) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'deep_analysis',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract and parse response
    let responseContent = data.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from AI');
    }

    // Clean and parse JSON
    responseContent = cleanJsonResponse(responseContent);
    const analysisData = JSON.parse(responseContent);

    // Validate required fields
    if (!analysisData.summary || !Array.isArray(analysisData.keyStrengths) ||
        !Array.isArray(analysisData.suggestedImprovements) || !analysisData.strategicRecommendation) {
      throw new Error('Invalid analysis structure returned from AI');
    }

    // Normalize suggestedImprovements — ensure every item is a SuggestedImprovement object.
    // If the LLM returned a plain string (prompt non-compliance), assign a default points_delta of 2
    // so badges always render rather than silently disappearing.
    const normalizedImprovements = analysisData.suggestedImprovements.slice(0, 8).map((item: any) => {
      if (typeof item === 'string') {
        return { text: item, points_delta: 2, dimension: 'General' };
      }
      // Ensure points_delta is a positive integer; default to 2 if absent or zero
      const delta = typeof item.points_delta === 'number' && item.points_delta > 0
        ? item.points_delta
        : 2;
      return { text: item.text, points_delta: delta, dimension: item.dimension || 'General' };
    });

    // Build and return result
    const result: VersionDeepAnalysis = {
      versionId: '', // Will be set by caller
      summary: analysisData.summary,
      keyStrengths: analysisData.keyStrengths.slice(0, 8), // Max 8
      suggestedImprovements: normalizedImprovements,
      strategicRecommendation: analysisData.strategicRecommendation,
      pros: analysisData.pros?.slice(0, 6), // Optional, max 6
      cons: analysisData.cons?.slice(0, 6), // Optional, max 6
      analysisVersion: ANALYSIS_VERSION,
      evaluatedAt: new Date().toISOString(),
      contentHash,
      contextKey
    };

    if (progressCallback) {
      progressCallback(`Completed analysis for ${optionLabel}`);
    }

    return result;

  } catch (error: any) {
    console.error('Deep analysis failed:', error);

    // Return error result
    const contentHash = generateContentHash(content);
    const contextKey = generateContextKey(model, formState?.selectedPersona, formState);

    return {
      versionId: '', // Will be set by caller
      summary: 'Analysis unavailable due to an error.',
      keyStrengths: ['Unable to analyze'],
      suggestedImprovements: ['Retry analysis'],
      strategicRecommendation: 'Please try running the analysis again.',
      analysisVersion: ANALYSIS_VERSION,
      evaluatedAt: new Date().toISOString(),
      contentHash,
      contextKey,
      errorMessage: error.message || 'Unknown error'
    };
  }
}

/**
 * Generate overall verdict focusing on the winner
 *
 * This creates a summary paragraph explaining why the winner was chosen
 * and provides deployment guidance. It does NOT change the winner - the
 * winner is determined solely by the scoring engine.
 *
 * @param winnerVersionId - ID of the winning version (from scoring engine)
 * @param winnerLabel - Display label of winner
 * @param winnerContent - Content of the winning version
 * @param allVersionAnalyses - All version analyses for context
 * @param model - AI model to use
 * @param currentUser - Current user for token tracking
 * @param formState - Form state for context
 * @param sessionId - Session ID for token tracking
 * @returns ComparisonDeepAnalysisMeta with overall verdict
 */
export async function generateOverallVerdict(
  winnerVersionId: string,
  winnerLabel: string,
  winnerContent: any,
  allVersionAnalyses: Record<string, VersionDeepAnalysis>,
  model: Model, // Parameter kept for backward compatibility but overridden
  currentUser?: any,
  formState?: FormState,
  sessionId?: string
): Promise<ComparisonDeepAnalysisMeta> {
  // Use the user's selected model; normalize deepseek legacy value
  const actualModel: Model = (model === 'deepseek-chat' || !model) ? 'claude-sonnet-4-5' : model;

  try {
    // Get winner's analysis
    const winnerAnalysis = allVersionAnalyses[winnerVersionId];
    if (!winnerAnalysis) {
      throw new Error('Winner analysis not found');
    }

    // Count total versions
    const totalVersions = Object.keys(allVersionAnalyses).length;

    // Build verdict prompt
    const systemPrompt = `You are an expert copywriting strategist providing final recommendations.

Your task is to write a concise overall verdict explaining why "${winnerLabel}" emerged as the best choice
among ${totalVersions} version(s) analyzed.

Key points:
- This version won based on official scoring metrics (you're explaining the choice, not making it)
- Focus on what makes it superior for deployment
- Keep it practical and actionable
- Mention any cautions (e.g., if claims need evidence)
- 3-5 sentences maximum

Return ONLY plain text (not JSON). Write naturally as if briefing a marketing team.`;

    const userPrompt = `The winner is: "${winnerLabel}"

Winner's Key Strengths:
${winnerAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Winner's Strategic Recommendation:
${winnerAnalysis.strategicRecommendation}

Context:
- Total versions compared: ${totalVersions}
- Language: ${formState?.language || 'English'}
- Tone: ${formState?.tone || 'Professional'}
- Target Audience: ${formState?.targetAudience || 'General'}

Write a concise overall verdict (3-5 sentences) explaining why this version is the best choice and how to deploy it.`;

    // Call AI  (temperature first, maxTokens second — matches makeApiRequestWithFallback signature)
    const data = await makeApiRequestWithFallback(
      actualModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.4,  // temperature
      500   // maxTokens
    );

    // Track tokens
    const tokenUsage = data.usage?.total_tokens || 0;
    if (currentUser && tokenUsage > 0 && sessionId) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'overall_verdict',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract verdict
    const overallVerdict = data.choices[0]?.message?.content?.trim() ||
      `${winnerLabel} provides the strongest overall performance based on comprehensive scoring across all evaluation criteria.`;

    return {
      winnerVersionId,
      overallVerdict,
      bestVersionName: winnerLabel,
      analysisVersion: ANALYSIS_VERSION,
      evaluatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Overall verdict generation failed:', error);

    // Fallback verdict
    return {
      winnerVersionId,
      overallVerdict: `${winnerLabel} achieved the highest overall score and is recommended for deployment.`,
      bestVersionName: winnerLabel,
      analysisVersion: ANALYSIS_VERSION,
      evaluatedAt: new Date().toISOString()
    };
  }
}

/**
 * Check if deep analysis is cached and valid
 *
 * @param versionId - Version ID
 * @param contentHash - Current content hash
 * @param contextKey - Current context key
 * @param cachedAnalysis - Cached analysis to check
 * @returns true if cache is valid
 */
export function isDeepAnalysisCacheValid(
  versionId: string,
  contentHash: string,
  contextKey: string,
  cachedAnalysis?: VersionDeepAnalysis
): boolean {
  if (!cachedAnalysis) return false;

  return (
    cachedAnalysis.versionId === versionId &&
    cachedAnalysis.contentHash === contentHash &&
    cachedAnalysis.contextKey === contextKey &&
    cachedAnalysis.analysisVersion === ANALYSIS_VERSION &&
    !cachedAnalysis.errorMessage // Don't use error cache
  );
}
