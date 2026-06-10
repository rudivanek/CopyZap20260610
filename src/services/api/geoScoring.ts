/**
 * GEO (Generative Engine Optimization) scoring functionality
 */
import { FormState, Model, GeoScoreData, User } from '../../types';
import { makeApiRequestWithFallback, storePrompts, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

/**
 * Calculate GEO score for content based on AI assistant optimization and geographical visibility
 * @param content - The content to evaluate for GEO optimization
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns A GeoScoreData object with score and breakdown
 */
export async function calculateGeoScore(
  content: any,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<GeoScoreData> {
  // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
  let actualContent = content;
  if (typeof content === 'object' && content.content) {
    actualContent = content.content;
  }

  // Extract text content from structured content if needed
  const textContent = typeof actualContent === 'string'
    ? actualContent
    : actualContent.headline
      ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(actualContent);

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback('Calculating GEO (Generative Engine Optimization) score...');
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert in Generative Engine Optimization (GEO) - the practice of optimizing content for AI assistants like ChatGPT, Claude, and Gemini.

Your task is to evaluate content based on how well it's optimized for AI-driven consumption and geographical visibility.

You must respond with a valid JSON object only. All property names must be double-quoted.`;
  
  // Build the user prompt with detailed scoring criteria
  const userPrompt = `Evaluate this content for GEO optimization based on the following 7 criteria. Each criterion has a maximum score shown:

CONTENT TO EVALUATE:
"""
${textContent}
"""

SCORING CRITERIA (Total possible: 100 points):

1. **Direct Answer Clarity** (20 points max)
   - Does the content start with a concise, clear answer or summary?
   - Is there a TL;DR or executive summary at the beginning?
   - Can AI assistants easily extract the main answer?

2. **Scannable Structure** (15 points max)
   - Are there bullet points, short paragraphs, and clear subheadings?
   - Is the content easy to scan and digest quickly?
   - Are there H2/H3 headings that break up the content?

3. **Question-Based Headings** (10 points max)
   - Are headings phrased as questions that AI assistants can index?
   - Do headings match common user queries?
   - Would an AI assistant surface these headings as relevant answers?

4. **Local Relevance or GEO Markers** (20 points max)
   - Does the content mention specific locations, regions, or geographical markers?
   - Are there phrases useful for local AI and search discovery?
   - Examples: "in Mexico", "Querétaro", "serving clients across LATAM", etc.
   - Note: This criterion gets full points if content is intentionally global/location-neutral

5. **Quote-Friendly Sentences** (15 points max)
   - Are there short, clear sentences that AI can easily quote?
   - Does the content have standalone statements that make sense out of context?
   - Are key points expressed in quotable, memorable phrases?

6. **Authority Signals** (10 points max)
   - Are examples, statistics, or credentials mentioned?
   - Does the content include social proof or expertise indicators?
   - Are there specific results, numbers, or case studies mentioned?

7. **Optional TL;DR / Answer Box** (10 points max)
   - If TL;DR is enabled in the form settings, was it included properly?
   - Does the content have an answer-box style beginning?
   - Is there a quick summary that directly addresses user intent?

CONTEXT INFORMATION:
- Target Language: ${formState.language}
- Content Type: ${formState.tab === 'create' ? 'New Copy' : 'Improved Copy'}
- Page Type: ${formState.pageType || 'Not specified'}
- Target Regions: ${formState.geoRegions || 'Not specified'}
- TL;DR Enabled: ${formState.addTldrSummary ? 'Yes' : 'No'}
- GEO Enhancement Enabled: ${formState.enhanceForGEO ? 'Yes' : 'No'}

RESPONSE FORMAT:
Respond with this exact JSON structure:
{
  "overall": 85,
  "breakdown": [
    {
      "criterion": "Direct Answer Clarity",
      "score": 18,
      "detected": true,
      "explanation": "Content starts with a clear summary that directly answers the user's main question."
    },
    {
      "criterion": "Scannable Structure", 
      "score": 12,
      "detected": true,
      "explanation": "Good use of subheadings and short paragraphs, though more bullet points would help."
    },
    {
      "criterion": "Question-Based Headings",
      "score": 8,
      "detected": true,
      "explanation": "Some headings are question-based, but more could be rephrased as common user queries."
    },
    {
      "criterion": "Local Relevance or GEO Markers",
      "score": 15,
      "detected": true,
      "explanation": "Good geographical context with specific location mentions relevant to the target audience."
    },
    {
      "criterion": "Quote-Friendly Sentences",
      "score": 13,
      "detected": true,
      "explanation": "Contains several short, clear statements that AI assistants can easily quote."
    },
    {
      "criterion": "Authority Signals",
      "score": 9,
      "detected": true,
      "explanation": "Includes specific examples and credentials that establish authority."
    },
    {
      "criterion": "Optional TL;DR / Answer Box",
      "score": 10,
      "detected": true,
      "explanation": "TL;DR is properly included and directly addresses user intent."
    }
  ],
  "suggestions": [
    "Add more bullet points to improve scannability",
    "Include more specific statistics or case studies for authority",
    "Rephrase some headings as questions users might ask"
  ]
}

IMPORTANT: 
- Calculate scores fairly based on what's actually present in the content
- For "Local Relevance", give full points if content is intentionally global/location-neutral AND well-optimized
- Only include suggestions if overall score is below 80
- Ensure all JSON properties are properly quoted and the response is valid JSON`;

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  try {
    // SCORING FIX: force single model for deterministic evaluation
    const data = await makeApiRequestWithFallback(
      SCORING_MODEL,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.5, // Lower temperature for consistent scoring
      3000, // GEO scoring needs moderate tokens
      { type: "json_object" },
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        SCORING_MODEL,
        'calculate_geo_score',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent || responseContent.trim() === '') {
      console.warn('Empty response from AI for GEO scoring, returning default score');
      return {
        overall: 0,
        breakdown: [],
        suggestions: ['Unable to evaluate GEO optimization due to empty AI response']
      };
    }
    
    // Parse the JSON content
    const cleanContent = cleanJsonResponse(responseContent);
    const parsedResponse = JSON.parse(cleanContent);
    
    // Validate and clean up the response
    const geoScore: GeoScoreData = {
      overall: parsedResponse.overall || 0,
      breakdown: Array.isArray(parsedResponse.breakdown) ? parsedResponse.breakdown : [],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : []
    };
    
    if (progressCallback) {
      progressCallback(`GEO score calculated: ${geoScore.overall}/100`);
    }
    
    return geoScore;
  } catch (error) {
    console.error('Error calculating GEO score:', error);
    if (progressCallback) {
      progressCallback(`Error calculating GEO score: ${error.message}`);
    }
    
    // Return default structure in case of error
    return {
      overall: 0,
      breakdown: [],
      suggestions: ['Error calculating GEO score. Please try again.']
    };
  }
}