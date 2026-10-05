/**
 * Editorial Refinement Pass for CopyZap+ Mode
 * Applies a second AI pass to improve clarity, specificity, and persuasive power
 */
import { FormState } from '../../types';
import { makeApiRequestWithFallback, makeStreamingReportRequest } from '../../services/api/utils';
import { countWords } from '../markdownUtils';
import { canStream, getOutputBudget } from './outputBudget';

/**
 * Applies editorial refinement to generated content
 */
export async function refineOutput(
  generatedContent: string,
  formState: FormState,
  userEmail?: string,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<string> {
  if (progressCallback) {
    progressCallback('Applying editorial refinement pass...');
  }

  const systemPrompt = `You are a senior editor specializing in marketing copy refinement.

Your task is to refine and improve the provided copy without changing its core message or structure. Focus on:
- Improving clarity and specificity
- Strengthening emotional impact
- Enhancing narrative flow and rhythm
- Increasing persuasive power
- Removing weak wording and generic filler
- Tightening structure
- Strengthening verbs and action language
- Eliminating clichés and overused phrases

CRITICAL RULES:
- Maintain the same word count (±5%)
- Preserve all structural elements (headings, sections, formatting)
- Keep the same tone and voice
- Do NOT add new sections or remove existing ones
- Return ONLY the refined content, no explanations or meta-commentary`;

  const userPrompt = `Refine the following marketing copy. Improve its clarity, specificity, emotional impact, narrative flow, and persuasive power while maintaining its structure and approximate word count:

"""
${generatedContent}
"""

Return ONLY the refined version. No introductions, explanations, or commentary.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Long copy needs a larger output budget and is streamed (see outputBudget.ts).
  // Normal copy is sent exactly as before.
  const inputWords = countWords(generatedContent);
  const { isLongCopy, maxTokens } = getOutputBudget(inputWords);

  try {
    // Use temperature 0.3 for more controlled, focused refinement
    const refinedContent = isLongCopy && canStream(formState.model)
      ? await makeStreamingReportRequest(formState.model, messages, 0.3, maxTokens, 'refine_output', sessionId)
      : (await makeApiRequestWithFallback(
          formState.model,
          messages,
          0.3,
          maxTokens, // 4,000 for normal copy, the same as the server default used before
          undefined,
          userEmail,
          'refine_output',
          sessionId
        )).choices[0]?.message?.content;

    if (!refinedContent) {
      console.warn('No content in refinement response, returning original');
      return generatedContent;
    }

    // A refinement pass must not shrink long copy: when it comes back clearly
    // shorter, sections were dropped or the text was cut, so keep the input.
    if (isLongCopy && countWords(refinedContent) < inputWords * 0.85) {
      console.warn('Refinement shortened long copy, keeping the unrefined version');
      if (progressCallback) {
        progressCallback('Refinement shortened the text, using the unrefined version');
      }
      return generatedContent;
    }

    if (progressCallback) {
      progressCallback('Editorial refinement complete');
    }

    console.log('Content refined successfully');
    return refinedContent;
  } catch (error) {
    console.error('Error refining content:', error);
    if (progressCallback) {
      progressCallback('Refinement failed, using original version');
    }
    // Return original content on error
    return generatedContent;
  }
}
