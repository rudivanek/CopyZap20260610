/**
 * Input Expansion Pre-Processing for CopyZap+ Mode
 * Enriches and clarifies user inputs before main content generation
 */
import { FormState } from '../../types';
import { makeApiRequestWithFallback } from '../../services/api/utils';

export interface ExpandedInputs {
  enrichedTone?: string;
  enrichedAudience?: string;
  enrichedKeyMessage?: string;
  inferredBenefits?: string[];
  inferredDifferentiators?: string[];
  messagingIntent?: string;
  emotionalHooks?: string[];
  credibilityFactors?: string[];
}

/**
 * Expands and enriches user inputs using AI to clarify intent and infer missing details
 */
export async function expandInputs(
  formState: FormState,
  userEmail?: string
): Promise<ExpandedInputs> {
  const contentToAnalyze = formState.businessDescription || formState.originalCopy || '';

  const systemPrompt = `You are an AI copy strategist specializing in marketing analysis and content planning.

Your task is to analyze user inputs and expand them with strategic insights. Infer missing fields such as tone nuances, audience details, messaging intent, benefits, and differentiators.

Output ONLY a valid JSON object with enriched fields. Do NOT write any copy or explanatory text.`;

  const userPrompt = `Analyze the following marketing inputs and expand them with strategic insights:

**Content/Business Description:**
${contentToAnalyze}

**Current Inputs:**
- Target Audience: ${formState.targetAudience || 'Not specified'}
- Key Message: ${formState.keyMessage || 'Not specified'}
- Tone: ${formState.tone || 'Not specified'}
- Desired Emotion: ${formState.desiredEmotion || 'Not specified'}
- Brand Values: ${formState.brandValues || 'Not specified'}
- Industry/Niche: ${formState.industryNiche || 'Not specified'}
- Product/Service: ${formState.productServiceName || 'Not specified'}
- Keywords: ${formState.keywords || 'Not specified'}

**Task:**
Expand and clarify these inputs. Return a JSON object with the following structure:
{
  "enrichedTone": "Enhanced tone description with nuances",
  "enrichedAudience": "Detailed audience profile with demographics, psychographics, and pain points",
  "enrichedKeyMessage": "Clarified and strengthened key message",
  "inferredBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "inferredDifferentiators": ["Differentiator 1", "Differentiator 2"],
  "messagingIntent": "Overall strategic intent of the messaging",
  "emotionalHooks": ["Emotional trigger 1", "Emotional trigger 2"],
  "credibilityFactors": ["Trust element 1", "Trust element 2"]
}

Return ONLY valid JSON. No explanations or additional text.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const data = await makeApiRequestWithFallback(
      formState.model,
      messages,
      0.4, // Lower temperature for more focused analysis
      2000, // Max tokens for expansion
      undefined,
      userEmail
    );

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in expansion response');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not parse JSON from expansion response:', content);
      return {};
    }

    const expandedInputs: ExpandedInputs = JSON.parse(jsonMatch[0]);
    console.log('Input expansion completed:', expandedInputs);

    return expandedInputs;
  } catch (error) {
    console.error('Error expanding inputs:', error);
    // Return empty object on error - generation will proceed with original inputs
    return {};
  }
}
