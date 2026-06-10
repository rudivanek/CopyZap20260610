/**
 * Content modification functionality
 */
import { FormState, User } from '../../types';
import { makeApiRequestWithFallback, storePrompts, calculateTargetWordCount, extractWordCount, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { reviseContentForWordCount } from './contentRefinement';

/**
 * Modify content based on user instructions
 * @param content - The content to modify
 * @param instruction - Natural language instruction for modification
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param progressCallback - Optional callback for reporting progress
 * @returns Modified content
 */
export async function modifyContent(
  content: any,
  instruction: string,
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<any> {
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

  // Calculate target word count
  const targetWordCountInfo = calculateTargetWordCount(formState);
  const targetWordCount = targetWordCountInfo.target;

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Modifying content: "${instruction}"...`);
  }

  // ALWAYS return plain text format when modifying existing content
  // Users expect readable text output, not JSON
  const useStructuredFormat = false;
  
  // Build the system prompt
  let systemPrompt = `You are an expert copywriter who excels at modifying marketing content based on specific user instructions.

Your task is to modify the provided marketing copy according to the user's instructions while maintaining the overall quality and effectiveness.
Keep the content in ${formState.language} language with a ${formState.tone} tone unless the instructions specify otherwise.`;

  // Add word count guidance if available
  if (targetWordCount) {
    systemPrompt += `\n\nThe original content was targeted for approximately ${targetWordCount} words. Maintain a similar length unless the instruction specifically asks to make it shorter or longer.`;
  }

  // Output format: ALWAYS plain text with markdown formatting
  systemPrompt += `\n\nProvide your response as clean, readable text with markdown formatting.`;

  // Add section title instructions (markdown headings)
  if (formState.includeSectionTitles !== false) {
    systemPrompt += `\n\nCRITICAL - Markdown Section Headings:
- MUST use markdown heading syntax: # for main headings, ## for subheadings
- NEVER use plain text for section titles - they MUST start with # or ##
- If the content has section headings, preserve them and make them compelling
- Create descriptive, engaging headings that summarize each section's content
- Headings should be 3-8 words, use Title Case, and match the overall tone
- Example format:

# Transform Your Business with AI-Powered Solutions

[Your content here...]

## Key Benefits That Drive Real Results

[Your content here...]

- Each section MUST have a markdown heading (starting with # or ##)`;
  }

  systemPrompt += `\n\nCRITICAL: Do NOT include any SEO metadata or JSON formatting:
- Do NOT return JSON - return clean, readable text
- Do NOT include URL slugs, meta descriptions, or Open Graph tags
- Do NOT wrap content in code blocks or JSON objects
- Focus ONLY on the marketing copy content as readable text
- SEO metadata is handled separately and should NOT be part of your content`;

  // Add special instructions if provided
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\nADDITIONAL SPECIAL INSTRUCTIONS:
${formState.specialInstructions.trim()}

These special instructions must be followed in addition to all other requirements.`;
  }

  // Build the user prompt
  let userPrompt = `Please modify the following content according to this instruction: "${instruction}"

Original content:
"""
${textContent}
"""

Modification instruction: ${instruction}

Apply the requested changes while maintaining the quality and effectiveness of the marketing copy. Keep the same general structure and format unless the instruction asks you to change it.`;

  // Add context from form state
  if (formState.targetAudience) {
    userPrompt += `\n\nTarget audience: ${formState.targetAudience}`;
  }
  if (formState.keyMessage) {
    userPrompt += `\nKey message to maintain: ${formState.keyMessage}`;
  }
  if (formState.callToAction) {
    userPrompt += `\nCall to action: ${formState.callToAction}`;
  }

  // Remind: plain text output only
  userPrompt += `\n\nIMPORTANT: Return clean, readable text with markdown formatting. Do NOT return JSON or code blocks.`;

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  try {
    // Make the API request with fallback (always plain text, never JSON)
    const data = await makeApiRequestWithFallback(
      formState.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.7,
      maxTokens,
      undefined, // No JSON format - always return plain text
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - API call fails if tracking fails
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'modify_content',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract the content from the response (always plain text)
    let modifiedContent = data.choices[0]?.message?.content;

    if (!modifiedContent) {
      throw new Error('No content in response');
    }

    // Clean up any accidental JSON formatting or code blocks
    modifiedContent = modifiedContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // If AI still returned JSON despite instructions, extract the actual text
    if (modifiedContent.startsWith('{') && modifiedContent.includes('"headline"')) {
      try {
        const cleanContent = cleanJsonResponse(modifiedContent);
        const parsed = JSON.parse(cleanContent);
        // Convert JSON structure back to markdown text
        let text = `# ${parsed.headline}\n\n`;
        if (parsed.sections) {
          text += parsed.sections.map((s: any) =>
            `## ${s.title}\n\n${s.content}`
          ).join('\n\n');
        }
        modifiedContent = text;
        console.warn('AI returned JSON despite instructions - converted to markdown');
      } catch (err) {
        console.warn('Could not parse unexpected JSON response:', err);
      }
    }

    if (progressCallback) {
      const wordCount = extractWordCount(modifiedContent);
      progressCallback(`✓ Content modified successfully (${wordCount} words)`);
    }

    return modifiedContent;
  } catch (error) {
    console.error('Error modifying content:', error);
    if (progressCallback) {
      progressCallback(`Error modifying content: ${error.message}`);
    }
    throw error;
  }
}