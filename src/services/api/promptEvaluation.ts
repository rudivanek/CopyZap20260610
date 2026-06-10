/**
 * Prompt evaluation functionality
 */
import { FormState, PromptEvaluation, User, Model } from '../../types';
import { calculateTargetWordCount, storePrompts, handleApiResponse, cleanJsonResponse, makeApiRequestWithFallback } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { SCORING_MODEL } from '../../constants';

/**
 * Evaluate the quality of a prompt
 * @param formData - The form data to evaluate
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns A PromptEvaluation object with score and improvement tips
 */
export async function evaluatePrompt(
  formData: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<PromptEvaluation> {
  // Determine which text to evaluate based on the active tab
  const textToEvaluate = formData.tab === 'create' 
    ? formData.businessDescription 
    : formData.originalCopy;
  
  if (!textToEvaluate) {
    throw new Error('No text provided for evaluation');
  }

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;

  // Calculate target word count for the copy
  const targetWordCount = calculateTargetWordCount(formData);
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Evaluating input quality...`);
  }
  
  // Build the system prompt - enhanced for comprehensive evaluation
  const systemPrompt = `You are an expert marketing advisor and copywriting strategist who provides comprehensive analysis of marketing copy inputs.
  
  Your task is to evaluate ALL provided input fields for a marketing copy project, not just the main content. Analyze:
  
  1. COMPLETENESS: Which critical fields are missing or incomplete?
  2. CLARITY: Are the provided details clear and specific enough?
  3. COHERENCE: Do all the inputs work together logically and consistently?
  4. STRATEGIC VALUE: Will these inputs lead to effective marketing copy?
  5. ACTIONABILITY: Are the instructions clear enough for an AI to execute?
  
  Focus on identifying specific gaps, inconsistencies, and improvement opportunities across all input fields.
  Provide actionable, field-specific suggestions that will directly improve the quality of generated marketing copy.
  
  The goal is to help the user optimize their inputs BEFORE generating copy, saving time and improving results.`;
  
  // Build the user prompt - comprehensive field analysis
  const userPrompt = `Please conduct a comprehensive evaluation of these marketing copy inputs. Analyze ALL fields for completeness, clarity, coherence, and strategic value.

## PRIMARY CONTENT
**${formData.tab === 'create' ? 'Business Description' : 'Original Copy'}:**
"${textToEvaluate}"

## PROJECT SETUP
- **Customer:** ${formData.customerName || 'Not specified'}
- **Product/Service Name:** ${formData.productServiceName || 'Not specified'}
- **Brief Description:** ${formData.briefDescription || 'Not specified'}
- **Page Type:** ${formData.pageType || 'Not specified'}
- **Section:** ${formData.section || 'Not specified'}

## TARGETING & AUDIENCE
- **Target Audience:** ${formData.targetAudience || 'Not specified'}
- **Industry/Niche:** ${formData.industryNiche || 'Not specified'}
- **Reader's Funnel Stage:** ${formData.readerFunnelStage || 'Not specified'}
- **Target Audience Pain Points:** ${formData.targetAudiencePainPoints || 'Not specified'}

## STRATEGIC MESSAGING
- **Key Message:** ${formData.keyMessage || 'Not specified'}
- **Call to Action:** ${formData.callToAction || 'Not specified'}
- **Desired Emotion:** ${formData.desiredEmotion || 'Not specified'}
- **Brand Values:** ${formData.brandValues || 'Not specified'}
- **Keywords:** ${formData.keywords || 'Not specified'}
- **Context:** ${formData.context || 'Not specified'}

## TONE & STYLE
- **Language:** ${formData.language}
- **Tone:** ${formData.tone}
- **Tone Level:** ${formData.toneLevel || 'Not specified'}
- **Preferred Writing Style:** ${formData.preferredWritingStyle || 'Not specified'}
- **Language Style Constraints:** ${formData.languageStyleConstraints?.length ? formData.languageStyleConstraints.join(', ') : 'None specified'}

## TECHNICAL SETTINGS
- **Word Count Target:** ${targetWordCount} words (${formData.wordCount}${formData.wordCount === 'Custom' ? ` - ${formData.customWordCount}` : ''})
- **Output Structure:** ${formData.outputStructure?.length ? formData.outputStructure.map(s => s.label || s.value).join(', ') : 'None specified'}
- **Priority Features:** ${[
    formData.generateHeadlines && 'Headlines',
    formData.generateScores && 'Scoring',
    formData.prioritizeWordCount && 'Strict Word Count',
    formData.keywords && 'Keyword Integration',
    formData.forceElaborationsExamples && 'Detailed Examples'
  ].filter(Boolean).join(', ') || 'None selected'}

## COMPETITIVE ANALYSIS
- **Competitor URLs:** ${formData.competitorUrls?.filter(url => url.trim()).join(', ') || 'None provided'}
- **Competitor Copy Text:** ${formData.competitorCopyText || 'Not provided'}

## EVALUATION INSTRUCTIONS
Provide a detailed analysis focusing on:

1. **Critical Missing Information**: What essential details are missing that would significantly impact copy quality?
2. **Field-Specific Issues**: Which specific fields need improvement and why?
3. **Coherence Problems**: Are there inconsistencies or conflicts between different inputs?
4. **Strategic Gaps**: What strategic elements are missing for effective marketing copy?
5. **Actionable Improvements**: Specific steps to enhance each problematic area.

Respond with a JSON object containing:
1. **score**: Overall readiness score from 0-100 (consider completeness, clarity, and coherence)
2. **tips**: Array of 6-10 specific, actionable improvement suggestions

Each tip should:
- Clearly identify which field(s) it addresses
- Explain the specific issue (missing, vague, inconsistent, etc.)
- Provide actionable guidance on what to add or change
- Explain why this improvement matters for copy generation

Example tip format:
"Target Audience field is too vague ('business owners'). Add specific demographics, company size, industry, and pain points. This helps generate more targeted, relevant copy that resonates with your actual prospects."

The JSON should follow this structure:
{
  "score": 75,
  "tips": [
    "Target Audience field needs more specific demographics and pain points. Add details like company size, industry, and specific challenges they face. This enables more targeted messaging.",
    "Key Message is missing or unclear. Define the main value proposition you want to communicate. This becomes the central theme that ties all copy elements together.",
    "Brand Values field is empty. Add 2-3 core values that differentiate your brand. These guide tone and messaging consistency across all copy.",
    "Keywords field lacks SEO focus. Include 5-7 specific terms your audience searches for. This improves search visibility and copy relevance.",
    "Call to Action is generic. Specify exactly what action you want readers to take and create urgency. This directly impacts conversion rates.",
    "Competitor analysis is incomplete. Add competitor URLs or copy examples for differentiation opportunities. This helps position your unique advantages."
  ]
}`;

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
      0.7,
      Math.floor(maxTokens / 4),
      { type: "json_object" }
    );
    
    // Extract the content from the response
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Extract token usage from the response for tracking
    const tokenUsage = data.usage?.total_tokens || 0;
    
    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        SCORING_MODEL,
        'evaluate_prompt',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Parse the JSON content
    // Clean any markdown code fences that might wrap the JSON
    const cleanContent = cleanJsonResponse(content);
    const parsedContent = JSON.parse(cleanContent);
    
    if (progressCallback) {
      progressCallback(`Input evaluation complete: ${parsedContent.score}/100`);
    }
    
    // Return the evaluation result
    return {
      score: parsedContent.score,
      tips: parsedContent.tips || []
    };
  } catch (error) {
    console.error('Error evaluating prompt:', error);
    
    if (progressCallback) {
      progressCallback(`Error evaluating input: ${error.message}`);
    }
    
    // Return a default error evaluation
    return {
      score: 0,
      tips: [
        'There was an error evaluating your input.',
        'Please check your API keys and internet connection.',
        'Try again or proceed with generating content.'
      ]
    };
  }
}

/**
 * Evaluate the quality of content (business description or original copy)
 * @param content - The content to evaluate
 * @param contentType - The type of content being evaluated
 * @param model - The AI model to use
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns ContentQualityScore with score and improvement tips
 */
export async function evaluateContentQuality(
  content: string,
  contentType: string,
  model: Model, // Parameter kept for backward compatibility but overridden
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<ContentQualityScore> {
  // SCORING FIX: force single model for deterministic evaluation
  const actualModel = SCORING_MODEL;
  if (!content) {
    throw new Error('No content provided for evaluation');
  }

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Evaluating ${contentType} quality...`);
  }
  
  // Build the system prompt
  const systemPrompt = `You are an expert content evaluator. Provide a detailed assessment of the content quality.`;
  
  // Build the user prompt
  const userPrompt = `Please evaluate this ${contentType}:

"${content}"

Respond with a JSON object containing:
1. score: A numerical assessment from 0-100
2. tips: An array of specific improvement suggestions (2-3 items)

The JSON should follow this structure:
{
  "score": 85,
  "tips": [
    "Add more details about X",
    "Clarify the target audience",
    "Include specific examples"
  ]
}`;

  try {
    // Make the API request via edge function
    const data = await makeApiRequestWithFallback(
      actualModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7,
      Math.floor(maxTokens / 4),
      { type: "json_object" }
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        actualModel,
        'evaluate_content_quality',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No content in response');
    }
    
    // Parse the JSON content
    const cleanResponseContent = cleanJsonResponse(responseContent);
    const parsedContent = JSON.parse(cleanResponseContent);
    
    if (progressCallback) {
      progressCallback(`${contentType} evaluation complete: ${parsedContent.score}/100`);
    }
    
    // Return the evaluation result
    return {
      score: parsedContent.score,
      tips: parsedContent.tips || []
    };
  } catch (error) {
    console.error(`Error evaluating ${contentType}:`, error);
    
    if (progressCallback) {
      progressCallback(`Error evaluating ${contentType}: ${error.message}`);
    }
    
    // Return a default error evaluation
    return {
      score: 50, // Neutral score for error cases
      tips: [
        `There was an error evaluating your ${contentType}.`,
        'Try again or proceed with generating content.'
      ]
    };
  }
}