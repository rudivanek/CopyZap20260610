/**
 * Content refinement functionality for word count adherence
 */
import { FormState, Model, User } from '../../types';
import { handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, generateErrorMessage, cleanJsonResponse, makeApiRequestWithFallback } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';

/**
 * Revise content to more closely match a target word count
 * @param content - The content to revise
 * @param targetWordCountInfo - The target word count information
 * @param formState - The form state with generation settings
 * @param progressCallback - Optional callback to report progress
 * @param persona - Optional persona to maintain voice style during revision
 * @returns The revised content with better word count adherence
 */
export async function reviseContentForWordCount(
  content: any,
  targetWordCountInfo: { target: number; min?: number; max?: number },
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  persona?: string,
  sessionId?: string
): Promise<any> {
  // Handle both old and new parameter formats
  const targetWordCount = typeof targetWordCountInfo === 'number'
    ? targetWordCountInfo
    : targetWordCountInfo.target;
  const minWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.min : undefined;
  const maxWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.max : undefined;

  // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
  let actualContent = content;
  if (typeof content === 'object' && content.content) {
    actualContent = content.content;
  }

  // Extract text content if needed
  const textContent = typeof actualContent === 'string'
    ? actualContent
    : actualContent.headline
      ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(actualContent);
  
  // Count the actual words in the content
  const contentWords = textContent.trim().split(/\s+/).length;
  
  // Get tolerance settings based on form state and content length
  const toleranceSettings = getRefinementWordCountTolerance(formState, targetWordCount);
  
  // Calculate the percentage of target achieved
  const percentageOfTarget = (contentWords / targetWordCount) * 100;
  
  // Determine if revision is needed based on tolerance settings
  let needsRevision = false;
  let revisionReason = '';
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    // Flexible range mode (little word count)
    if (contentWords < minWordCount) {
      needsRevision = true;
      revisionReason = `below minimum range (${contentWords} < ${minWordCount})`;
    } else if (contentWords > maxWordCount) {
      needsRevision = true;
      revisionReason = `above maximum range (${contentWords} > ${maxWordCount})`;
    }
  } else {
    // Check against tolerance percentages
    if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage) {
      needsRevision = true;
      revisionReason = `below tolerance (${contentWords} words = ${percentageOfTarget.toFixed(1)}% of target)`;
    } else if (toleranceSettings.maximumAcceptablePercentage && 
               percentageOfTarget > toleranceSettings.maximumAcceptablePercentage) {
      needsRevision = true;
      revisionReason = `above tolerance (${contentWords} words = ${percentageOfTarget.toFixed(1)}% of target)`;
    }
  }
  
  // If within acceptable range, return original content
  if (!needsRevision) {
    if (progressCallback) {
      progressCallback(`Content within acceptable range: ${contentWords} words (${percentageOfTarget.toFixed(1)}% of target)`);
    }
    return content;
  }
  
  if (progressCallback) {
    progressCallback(`Content needs revision: ${revisionReason}`);
  }
  
  try {
    // Max tokens for output (edge function handles all API configuration)
    const maxTokens = 4000;
    
    // Report progress if callback provided
    if (progressCallback) {
      if (minWordCount !== undefined && maxWordCount !== undefined) {
        progressCallback(`Revising content for flexible word count range ${minWordCount}-${maxWordCount} words (currently ${contentWords} words)`);
      } else {
        progressCallback(`Revising content to match target word count of ${targetWordCount} words (currently ${contentWords} words)`);
      }
    }
    
    // Determine if we should return structured format
    const useStructuredFormat = formState.outputStructure && formState.outputStructure.length > 0;
    const isStructuredContent = typeof actualContent === 'object' && actualContent.headline && Array.isArray(actualContent.sections);
    
    // Build the system prompt
    let systemPrompt: string;

    if (minWordCount !== undefined && maxWordCount !== undefined) {
      // Little word count mode - flexible range
      systemPrompt = buildFlexibleRangeSystemPrompt(contentWords, minWordCount, maxWordCount, targetWordCount, persona);
    } else if (toleranceSettings.toleranceMode === 'flexible') {
      // Flexible mode (checkbox OFF) - use guidance approach instead of strict requirements
      systemPrompt = buildFlexibleModeSystemPrompt(contentWords, targetWordCount, toleranceSettings, persona);
    } else {
      // Regular strict mode (checkbox ON)
      // Calculate the actual tolerance percentage from the tolerance settings
      const actualTolerancePercentage = 100 - toleranceSettings.minimumAcceptablePercentage;
      systemPrompt = buildStrictModeSystemPrompt(contentWords, targetWordCount, toleranceSettings.isShortContent, persona, actualTolerancePercentage);
    }
    
    // Add common system prompt additions
    systemPrompt += buildCommonSystemPromptAdditions(useStructuredFormat, isStructuredContent, persona, minWordCount, maxWordCount, targetWordCount, formState);
    
    // Build the user prompt
    const userPrompt = buildFirstRevisionUserPrompt(
      textContent, 
      contentWords, 
      targetWordCount, 
      minWordCount, 
      maxWordCount, 
      formState, 
      persona, 
      useStructuredFormat, 
      isStructuredContent
    );
    
    // Store the prompts for display in the UI
    storePrompts(systemPrompt, userPrompt);
    
    // Prepare the API request
    const requestBody = {
      model: formState.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Higher temperature for more creative expansion
      max_tokens: maxTokens, // Use dynamic token limit from API config
      response_format: useStructuredFormat || isStructuredContent ? { type: "json_object" } : undefined
    };
    
    // Make the API request via edge function
    try {
      const data = await makeApiRequestWithFallback(
        formState.model,
        requestBody.messages,
        requestBody.temperature,
        requestBody.max_tokens,
        requestBody.response_format
      );

      // Extract token usage
      const tokenUsage = data.usage?.total_tokens || 0;

      // MANDATORY TOKEN TRACKING - track first revision
      if (currentUser && tokenUsage > 0) {
        await trackTokenUsage(
          currentUser,
          tokenUsage,
          formState.model,
          'revise_content_wordcount',
          sessionId,
          0,
          undefined,
          extractTokenBreakdown(data.usage)
        );
      }

      // Extract the content from the response
      let revisedContent = data.choices[0]?.message?.content;

      if (!revisedContent) {
        throw new Error('No content in response');
      }

      console.log('📝 Raw revision response:', revisedContent.substring(0, 200) + '...');
      
      // Parse structured content if needed
      if (useStructuredFormat || isStructuredContent) {
        try {
          const cleanContent = cleanJsonResponse(revisedContent);
          const parsedContent = JSON.parse(cleanContent);
          revisedContent = parsedContent;
          console.log('✅ Successfully parsed revised JSON content');
        } catch (err) {
          console.warn('Error parsing structured content, returning as plain text:', err);
          // Keep as plain text if parsing fails
        }
      }
      
      // Verify the word count of the revised content
      const revisedWordCount = extractWordCount(revisedContent);
      const revisedPercentageOfTarget = (revisedWordCount / targetWordCount) * 100;
      
      console.log(`First revision result: ${revisedWordCount} words (target: ${targetWordCount}, ${revisedPercentageOfTarget.toFixed(1)}% of target)`);
      
      // CRITICAL CHECK: If word count didn't improve significantly, the revision failed
      if (Math.abs(revisedWordCount - contentWords) < 10) {
        console.warn(`⚠️ Revision didn't change word count significantly (${contentWords} → ${revisedWordCount}). AI may have ignored instructions.`);
        if (progressCallback) {
          progressCallback(`⚠️ First revision ineffective (${contentWords} → ${revisedWordCount} words). Making enhanced attempt...`);
        }
        
        // Try a more aggressive revision approach immediately
        try {
          const aggressiveRevision = await performAggressiveRevision(
            content,
            targetWordCountInfo,
            formState,
            currentUser,
            progressCallback,
            persona,
            sessionId
          );
          
          if (aggressiveRevision) {
            const aggressiveWordCount = extractWordCount(aggressiveRevision);
            console.log(`🔥 Aggressive revision result: ${aggressiveWordCount} words`);
            return aggressiveRevision;
          }
        } catch (aggressiveError) {
          console.error('Aggressive revision also failed:', aggressiveError);
        }
      }
      
      if (progressCallback) {
        progressCallback(`First revision complete: ${revisedWordCount} words (${revisedPercentageOfTarget.toFixed(1)}% of target)`);
      }
      
      // Determine if a second revision is needed
      const needsSecondRevision = shouldPerformSecondRevision(
        revisedWordCount, 
        targetWordCount, 
        minWordCount, 
        maxWordCount, 
        toleranceSettings
      );
      
      if (needsSecondRevision) {
        if (progressCallback) {
          progressCallback(`Content still outside acceptable range. Making second revision attempt...`);
        }
        
        // Call the dedicated second revision function
        const secondRevisionContent = await performSecondRevision(
          revisedContent, 
          { target: targetWordCount, min: minWordCount, max: maxWordCount },
          formState,
          currentUser,
          progressCallback,
          persona, // Pass the persona to maintain voice style during revision
          sessionId
        );
        
        return secondRevisionContent;
      }

      return revisedContent;
    } catch (error) {
      console.error('Error revising content for word count:', error);

      // Generate a more specific error message
      const errorMessage = generateErrorMessage(error);

      if (progressCallback) {
        progressCallback(`Error revising content: ${errorMessage}. Using original content.`);
      }

      // If revision fails, return the original content
      return content;
    }
  } catch (error) {
    console.error('Error in outer try block:', error);
    return content;
  }
}

/**
 * Helper function to build flexible range system prompt
 */
function buildFlexibleRangeSystemPrompt(contentWords: number, minWordCount: number, maxWordCount: number, targetWordCount: number, persona?: string): string {
  let systemPrompt = `You are an expert copywriter who specializes in creating concise, impactful SHORT content.
Your task is to revise the provided content to be between ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).
This is SHORT content with flexible word count tolerance to maintain natural phrasing.

${contentWords < minWordCount
  ? `The content is currently ${minWordCount - contentWords} words BELOW the minimum. Add essential words to reach at least ${minWordCount} words.`
  : contentWords > maxWordCount
    ? `The content is currently ${contentWords - maxWordCount} words ABOVE the maximum. Remove unnecessary words to stay within ${maxWordCount} words.`
    : `The content is within range but could be optimized toward the ${targetWordCount} word target.`}

FLEXIBLE RANGE: The final word count must be between ${minWordCount}-${maxWordCount} words, ideally close to ${targetWordCount} words.`;

  if (persona) {
    systemPrompt += `\n\nIMPORTANT: This content is written in the voice style of ${persona}. 
You MUST maintain ${persona}'s distinctive voice, tone, and writing style while adjusting the word count.
${persona}'s voice is a critical aspect that must be preserved throughout the revision.`;
  }

  return systemPrompt;
}

/**
 * Helper function to build flexible mode system prompt (checkbox OFF)
 */
function buildFlexibleModeSystemPrompt(contentWords: number, targetWordCount: number, toleranceSettings: any, persona?: string): string {
  const wordDifference = contentWords - targetWordCount;
  const percentageDifference = Math.abs(wordDifference) / targetWordCount * 100;
  const minAcceptable = Math.floor(targetWordCount * toleranceSettings.minimumAcceptablePercentage / 100);
  const maxAcceptable = Math.ceil(targetWordCount * (toleranceSettings.maximumAcceptablePercentage || 130) / 100);

  let systemPrompt = `You are an expert copywriter. Your task is to improve the provided content while aiming for approximately ${targetWordCount} words.

The target is ${targetWordCount} words, with an acceptable range of ${minAcceptable}-${maxAcceptable} words (±30% tolerance).

${wordDifference > 0
  ? `The content is currently ${contentWords} words. Consider trimming to improve conciseness, but only if it enhances clarity and impact.`
  : `The content is currently ${contentWords} words. Consider adding more detail, examples, or elaboration to make the content more comprehensive and valuable.`}

IMPORTANT: Prioritize content quality and completeness over strict word count adherence. The word count is a guideline, not a hard requirement. Never cut off sentences or leave content incomplete.`;

  if (persona) {
    systemPrompt += `\n\nIMPORTANT: This content is written in the voice style of ${persona}.
Maintain ${persona}'s distinctive voice, tone, and writing style while adjusting the content.`;
  }

  return systemPrompt;
}

/**
 * Helper function to build strict mode system prompt
 */
function buildStrictModeSystemPrompt(contentWords: number, targetWordCount: number, isShortContent: boolean, persona?: string, tolerancePercentage: number = 2): string {
  const wordDifference = contentWords - targetWordCount;
  const percentageDifference = Math.abs(wordDifference) / targetWordCount * 100;

  // Calculate the acceptable range based on tolerance
  const minAcceptableWords = Math.round(targetWordCount * (100 - tolerancePercentage) / 100);
  const maxAcceptableWords = Math.round(targetWordCount * (100 + tolerancePercentage) / 100);

  let systemPrompt = isShortContent
    ? `You are an expert copywriter who specializes in creating concise, impactful SHORT content.
Your task is to revise the provided content to be within ${minAcceptableWords}-${maxAcceptableWords} words (target: ${targetWordCount} words, ±${tolerancePercentage}% tolerance).
This is SHORT content requiring extreme precision - every word must be essential.

${wordDifference > 0
  ? `The content is currently ${wordDifference} words TOO LONG. Remove unnecessary words, adjectives, and phrases while preserving the core message.`
  : `The content is currently ${Math.abs(wordDifference)} words TOO SHORT. Add only essential, high-impact words that strengthen the message.`}

CRITICAL: For short content, precision is everything. The final word count must be between ${minAcceptableWords} and ${maxAcceptableWords} words.`
    : `You are an expert copywriter with a NON-NEGOTIABLE task: revise the provided content to match the target word count of ${targetWordCount} words (±${tolerancePercentage}% tolerance).
This is an ABSOLUTE REQUIREMENT - the final word count MUST be between ${minAcceptableWords} and ${maxAcceptableWords} words.

${wordDifference > 0
  ? `The content is currently ${wordDifference} words (${percentageDifference.toFixed(1)}%) TOO LONG. You MUST trim unnecessary details, redundant phrases, and verbose explanations while preserving all key points.`
  : `The content is currently ${Math.abs(wordDifference)} words (${percentageDifference.toFixed(1)}%) TOO SHORT. You MUST add substantial details, comprehensive examples, case studies, supporting evidence, or thorough elaborations to reach the target range of ${minAcceptableWords}-${maxAcceptableWords} words.`}

CRITICAL SUCCESS METRIC: The final word count must be between ${minAcceptableWords} and ${maxAcceptableWords} words. Aim for ${targetWordCount} but staying within the acceptable range is the priority.

IMPORTANT: Verify word count INTERNALLY before submitting. Do NOT include your counting process, verification steps, or word count calculations in the output - only provide the final content.`;

  if (persona) {
    systemPrompt += `\n\nCRITICAL REMINDER: Many revision attempts fail to maintain both the target word count AND ${persona}'s voice.
Your task is to achieve BOTH objectives:
1. Reaching the target range of ${minAcceptableWords}-${maxAcceptableWords} words
2. Maintaining ${persona}'s distinctive voice and style

If expanding, add content that sounds authentically like ${persona} would write it.`;
  }

  return systemPrompt;
}

/**
 * Helper function to build common system prompt additions
 */
function buildCommonSystemPromptAdditions(
  useStructuredFormat: boolean,
  isStructuredContent: boolean,
  persona?: string,
  minWordCount?: number,
  maxWordCount?: number,
  targetWordCount?: number,
  formState?: FormState
): string {
  let additions = '';
  
  if (useStructuredFormat || isStructuredContent) {
    additions += `\n\nYour response MUST be a valid JSON object.`;

    // Add section title generation instructions if enabled
    if (formState?.includeSectionTitles !== false) {
      additions += `\n\nIMPORTANT - SECTION TITLE GENERATION:
For each section in the structured output, you MUST generate a compelling, descriptive title${persona ? ` in ${persona}'s voice` : ''} that:
- Clearly summarizes the content of that specific section
- Is engaging and draws the reader in
- Matches the tone and style of the overall copy${persona ? ` and ${persona}'s distinctive voice` : ''}
- Section titles should be 3-8 words and use Title Case`;
    }
  }
  
  additions += `\n\nIMPORTANT: If expanding the content, do NOT add filler or repetitive content. Instead:
1. Add specific examples or case studies
2. Expand on benefits with more detail
3. Add supporting evidence or statistics
4. Elaborate on how the product/service solves specific problems
5. Include additional relevant context that enhances understanding
6. Add implementation steps, processes, or methodologies
7. Include background information, industry context, or comparative analysis`;
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    additions += `\n\nFLEXIBLE WORD COUNT: Aim for ${targetWordCount} words but anywhere between ${minWordCount}-${maxWordCount} words is acceptable.`;
  } else if (targetWordCount) {
    additions += `\n\nABSOLUTELY CRITICAL - WORD COUNT REQUIREMENT:
The final word count must be EXACTLY ${targetWordCount} words.

IMPORTANT: Count words INTERNALLY before submitting. Do NOT include your counting process, verification steps, or word count calculations in your response. Only provide the final content itself.

NO TOLERANCE, NO APPROXIMATION, NO EXCUSES - it must be precisely ${targetWordCount} words.

FAILURE TO ACHIEVE EXACTLY ${targetWordCount} WORDS = COMPLETE FAILURE.`;
  }
  
  return additions;
}

/**
 * Helper function to build first revision user prompt
 */
function buildFirstRevisionUserPrompt(
  textContent: string,
  contentWords: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  formState?: FormState,
  persona?: string,
  useStructuredFormat?: boolean,
  isStructuredContent?: boolean
): string {
  const wordDifference = contentWords - targetWordCount;
  
  let userPrompt = `Please revise this content to match the target word count:

"""
${textContent}
"""

Current word count: ${contentWords} words
Target word count: ${targetWordCount} words`;

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
Target range: ${minWordCount}-${maxWordCount} words
Status: ${contentWords < minWordCount ? `${minWordCount - contentWords} words below minimum` 
         : contentWords > maxWordCount ? `${contentWords - maxWordCount} words above maximum`
         : 'within range but can be optimized'}`;
  } else {
    userPrompt += `
Difference: ${wordDifference > 0 ? `${wordDifference} words too many` : `${Math.abs(wordDifference)} words too few`}`;
  }

  userPrompt += `

Guidelines:
- Maintain the ${formState?.tone || 'original'} tone
- Keep the same key messages and information
- ${wordDifference > 0 ? 'Remove unnecessary details or repetition without losing key points' : 'Add relevant details, examples, or elaborations that enhance the copy'}
- Ensure the content remains in ${formState?.language || 'English'} language
- Preserve the overall structure and flow`;

  // Add persona-specific instructions to user prompt if provided
  if (persona) {
    userPrompt += `\n- Maintain ${persona}'s distinctive voice and writing style throughout
- Ensure any added content sounds authentically like ${persona} would write it`;
  }

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `\n- Aim for the ${targetWordCount} word target within the ${minWordCount}-${maxWordCount} range`;
  } else {
    userPrompt += `\n- Count your words meticulously to ensure you hit the target word count of EXACTLY ${targetWordCount} words`;
  }
  
  // Add structured format instructions
  if (useStructuredFormat || isStructuredContent) {
    userPrompt += `\n\nPlease structure your response in this JSON format:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    },
    {
      "title": "Another section title",
      "listItems": ["First bullet point", "Second bullet point"]
    }
  ],
  "wordCountAccuracy": 95
}

Make sure to include a headline and appropriate sections with either paragraph content or list items.`;
  } else {
    userPrompt += `\n\nProvide your response as plain text with appropriate paragraphs and formatting.`;
  }

  if (formState?.keywords) {
    userPrompt += `\n\nIMPORTANT: Make sure to naturally integrate all of these keywords throughout the copy: ${formState.keywords}`;
  }
  
  // Add specific emphasis on word count for personas
  if (persona) {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nVERY IMPORTANT REMINDER: Your task has TWO equally critical requirements:
1. Stay within the ${minWordCount}-${maxWordCount} word range (ideally ${targetWordCount} words)
2. Maintain ${persona}'s distinctive voice and style

Many revision attempts fail on one of these requirements. You must succeed on BOTH.`;
    } else {
      userPrompt += `\n\nVERY IMPORTANT REMINDER: Your task has TWO equally critical requirements:
1. Match the target word count of EXACTLY ${targetWordCount} words
2. Maintain ${persona}'s distinctive voice and style

Many revision attempts fail on one of these requirements. You must succeed on BOTH.

DO NOT SUBMIT your response until you've verified:
- The word count is EXACTLY ${targetWordCount} words
- The content authentically sounds like ${persona}'s writing`;
    }
  }
  
  return userPrompt;
}

/**
 * Helper function to determine if a second revision is needed
 */
function shouldPerformSecondRevision(
  revisedWordCount: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  toleranceSettings?: any
): boolean {
  // For flexible range mode, check if still outside range
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    return revisedWordCount < minWordCount || revisedWordCount > maxWordCount;
  }
  
  const percentageOfTarget = (revisedWordCount / targetWordCount) * 100;

  // For strict mode, check both below AND above tolerance
  if (toleranceSettings?.toleranceMode === 'strict') {
    const min = toleranceSettings.minimumAcceptablePercentage ?? 98;
    const max = toleranceSettings.maximumAcceptablePercentage ?? 102;
    return percentageOfTarget < min || percentageOfTarget > max;
  }

  // For normal mode, check both directions (±5% threshold)
  return percentageOfTarget < 95 || percentageOfTarget > 105;
}

/**
 * Perform a second, more aggressive revision attempt when the first one fails to meet the word count
 */
async function performSecondRevision(
  content: any,
  targetWordCountInfo: { target: number; min?: number; max?: number },
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  persona?: string,
  sessionId?: string
): Promise<any> {
  const { target: targetWordCount, min: minWordCount, max: maxWordCount } = targetWordCountInfo;

  try {
    // Max tokens for output (edge function handles all API configuration)
    const maxTokens = 4000;

    // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
    let actualContent = content;
    if (typeof content === 'object' && content.content) {
      actualContent = content.content;
    }

    // Extract text content if needed
    const textContent = typeof actualContent === 'string'
      ? actualContent
      : actualContent.headline
        ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(actualContent);
    
    // Count the actual words in the content
    const contentWords = textContent.trim().split(/\s+/).length;
    const wordsMissing = targetWordCount - contentWords;
    const percentMissing = Math.round((wordsMissing / targetWordCount) * 100);
    const isShortContent = targetWordCount <= 150;
    const wordDifference = contentWords - targetWordCount;

    // Determine if we should return structured format
    const isStructuredContent = typeof actualContent === 'object' && actualContent.headline && Array.isArray(actualContent.sections);

    // Build the second revision system prompt
    const systemPrompt = buildSecondRevisionSystemPrompt(
      wordsMissing, 
      percentMissing, 
      targetWordCount, 
      isStructuredContent, 
      persona,
      minWordCount,
      maxWordCount
    );
    
    // Build the second revision user prompt
    const userPrompt = buildSecondRevisionUserPrompt(
      textContent,
      contentWords,
      targetWordCount,
      wordsMissing,
      percentMissing,
      isShortContent,
      wordDifference,
      formState,
      persona,
      isStructuredContent,
      minWordCount,
      maxWordCount
    );
    
    // Prepare the API request
    const requestBody = {
      model: formState.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6, // Slightly higher temperature for second attempt to encourage more creativity
      max_tokens: maxTokens, // Use dynamic token limit from API config
      response_format: isStructuredContent ? { type: "json_object" } : undefined
    };
    
    if (progressCallback) {
      progressCallback(`Making second attempt to match target word count...`);
    }

    // Make the API request via edge function
    try {
      const data = await makeApiRequestWithFallback(
        formState.model,
        requestBody.messages,
        requestBody.temperature,
        requestBody.max_tokens,
        requestBody.response_format
      );

      // Extract token usage
      const tokenUsage = data.usage?.total_tokens || 0;

      // MANDATORY TOKEN TRACKING - track second revision
      if (currentUser && tokenUsage > 0) {
        await trackTokenUsage(
          currentUser,
          tokenUsage,
          formState.model,
          'revise_content_wordcount_second',
          sessionId,
          0,
          undefined,
          extractTokenBreakdown(data.usage)
        );
      }

      // Extract the content from the response
      let revisedContent = data.choices[0]?.message?.content;

      if (!revisedContent) {
        throw new Error('No content in second revision response');
      }
      
      // Parse structured content if needed
      if (isStructuredContent) {
        try {
          const cleanContent = cleanJsonResponse(revisedContent);
          const parsedContent = JSON.parse(cleanContent);
          revisedContent = parsedContent;
        } catch (err) {
          console.warn('Error parsing structured content in second revision, returning as plain text:', err);
          // Keep as plain text if parsing fails
        }
      }
      
      // Verify the word count of the second revision
      const secondRevisedWordCount = extractWordCount(revisedContent);
      const percentOfTarget = Math.round((secondRevisedWordCount / targetWordCount) * 100);
      
      if (progressCallback) {
        progressCallback(`Second revision complete: ${secondRevisedWordCount} words (${percentOfTarget}% of target)`);
      }
      
      // Check if a third emergency revision is needed
      const needsEmergencyRevision = shouldPerformEmergencyRevision(
        secondRevisedWordCount,
        targetWordCount,
        minWordCount,
        maxWordCount,
        formState
      );
      
      if (needsEmergencyRevision) {
        if (progressCallback) {
          progressCallback(`Content still below target. Making final emergency revision...`);
        }
        
        try {
          const emergencyResult = await performEmergencyRevision(
            revisedContent,
            targetWordCount,
            secondRevisedWordCount,
            percentOfTarget,
            formState,
            currentUser,
            persona,
            isStructuredContent,
            progressCallback,
            sessionId
          );
          
          if (emergencyResult) {
            return emergencyResult;
          }
        } catch (emergencySetupError) {
          console.error('Error setting up emergency revision:', emergencySetupError);
        }
      }

      // Return the second revision content (or the original second revision if the emergency attempt failed)
      return revisedContent;
    } catch (error) {
      console.error('Error in second content revision:', error);

      // Generate a more specific error message
      const errorMessage = generateErrorMessage(error);

      if (progressCallback) {
        progressCallback(`Error in second revision: ${errorMessage}. Using first revision.`);
      }

      // If second revision fails, return the content from the first revision
      return content;
    }
  } catch (error) {
    console.error('Error in outer try block of performSecondRevision:', error);
    return content;
  }
}

/**
 * Helper function to build second revision system prompt
 */
function buildSecondRevisionSystemPrompt(
  wordsMissing: number,
  percentMissing: number,
  targetWordCount: number,
  isStructuredContent: boolean,
  persona?: string,
  minWordCount?: number,
  maxWordCount?: number
): string {
  const isTooLong = wordsMissing < 0;
  const wordsOver = Math.abs(wordsMissing);

  let systemPrompt = isStructuredContent
    ? `You are an expert copywriter with a FINAL, CRITICAL ATTEMPT to fix content that is not meeting word count requirements. Your response MUST be a valid JSON object.`
    : `You are an expert copywriter with a FINAL, CRITICAL ATTEMPT to fix content that is not meeting word count requirements.`;

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    systemPrompt += `

FLEXIBLE RANGE EMERGENCY: The content must be adjusted to fit within ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).`;
  } else if (isTooLong) {
    systemPrompt += `

EMERGENCY SITUATION: The content is ${wordsOver} words (${Math.abs(percentMissing)}%) OVER the required ${targetWordCount} word target.`;
  } else {
    systemPrompt += `

EMERGENCY SITUATION: The content provided is ${wordsMissing} words (${percentMissing}%) short of the required ${targetWordCount} word target.`;
  }

  if (isTooLong && minWordCount === undefined) {
    systemPrompt += `

THIS IS YOUR FINAL CHANCE. Your task is to TRIM this content down to the target word count:

1. Remove redundant phrases, filler words, and unnecessary qualifiers
2. Condense verbose explanations into tighter, more direct sentences
3. Cut repetitive points — say each idea once, powerfully
4. Shorten examples by removing excessive setup and context
5. Replace multi-word phrases with single precise words
6. Cut any section that adds length without adding value
7. Tighten every sentence — aim for maximum impact per word

PRESERVE all key messages, zone structure, CTAs, and the core persuasive argument. Only cut what is redundant or padded.

DO NOT add new content, only cut and condense.`;
  } else {
    systemPrompt += `

THIS IS YOUR FINAL CHANCE. Your task is to revise this content by adding substantive, valuable content:

1. Add specific examples, case studies, or scenarios that illustrate key points
2. Expand explanations with more detail and depth
3. Add supporting evidence, statistics, or expert opinions
4. Elaborate on benefits with concrete applications
5. Add contextual information that enhances understanding
6. Add implementation steps, processes, or methodologies
7. Include background information, industry context, or comparative analysis

DO NOT use filler text, repetition, or fluff. Every added word must add genuine value.`;
  }

  if (minWordCount !== undefined && maxWordCount !== undefined) {
    systemPrompt += `

REQUIREMENT: The final content must be between ${minWordCount}-${maxWordCount} words, ideally close to ${targetWordCount} words.`;
  } else {
    systemPrompt += `

ABSOLUTE REQUIREMENT: The final content MUST be within ±5% of ${targetWordCount} words (${Math.round(targetWordCount * 0.95)}-${Math.round(targetWordCount * 1.05)} words).
FAILURE TO DELIVER CONTENT WITHIN THIS RANGE WILL RESULT IN COMPLETE REJECTION.

YOU MUST VERIFY INTERNALLY THAT YOUR OUTPUT IS WITHIN THIS RANGE. Do NOT include your verification process or word counting in the output.`;
  }

  // Add persona-specific instructions if a persona is provided
  if (persona) {
    systemPrompt += `

CRITICAL: This content must sound like it was written by ${persona}.
You MUST maintain ${persona}'s distinctive voice, vocabulary, sentence structure, and overall style.
Any content you add should seamlessly blend with ${persona}'s writing style.

YOUR SUCCESS DEPENDS ON TWO EQUALLY IMPORTANT CRITERIA:`;
    
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      systemPrompt += `
1. Staying within ${minWordCount}-${maxWordCount} words (ideally ${targetWordCount} words)
2. Making the entire content sound authentically like ${persona}'s writing`;
    } else {
      systemPrompt += `
1. Reaching EXACTLY ${targetWordCount} words
2. Making the entire content sound authentically like ${persona}'s writing`;
    }
    
    systemPrompt += `

Many attempts fail on one of these criteria. You must succeed on BOTH.`;
  }
  
  return systemPrompt;
}

/**
 * Helper function to build second revision user prompt
 */
function buildSecondRevisionUserPrompt(
  textContent: string,
  contentWords: number,
  targetWordCount: number,
  wordsMissing: number,
  percentMissing: number,
  isShortContent: boolean,
  wordDifference: number,
  formState: FormState,
  persona?: string,
  isStructuredContent?: boolean,
  minWordCount?: number,
  maxWordCount?: number
): string {
  let userPrompt = '';
  
  if (isShortContent && !minWordCount && !maxWordCount) {
    userPrompt = `This content needs to be EXACTLY ${targetWordCount} words for SHORT content requiring precision.
    
Content to ${wordDifference > 0 ? 'condense' : 'expand'}:
"""
${textContent}
"""

Current word count: ${contentWords} words
Required word count: ${targetWordCount} words
${wordDifference > 0 ? `Words to remove: ${wordDifference} words` : `Words to add: ${Math.abs(wordDifference)} words`}

${wordDifference > 0 
  ? `Make this content more concise by removing unnecessary words, redundant phrases, and non-essential details while preserving the core message and impact.`
  : `Add only essential, high-impact words that strengthen the core message. Do not add filler or unnecessary elaboration.`}

CRITICAL: This is SHORT content. Every word must be purposeful and essential. The final count must be EXACTLY ${targetWordCount} words.`;
  } else if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt = `FLEXIBLE RANGE REVISION: This content needs to be adjusted to fit within ${minWordCount}-${maxWordCount} words (target: ${targetWordCount} words).
    
Content to revise:
"""
${textContent}
"""

Current word count: ${contentWords} words
Target range: ${minWordCount}-${maxWordCount} words
Ideal target: ${targetWordCount} words
Status: ${contentWords < minWordCount ? `${minWordCount - contentWords} words below minimum` 
         : contentWords > maxWordCount ? `${contentWords - maxWordCount} words above maximum`
         : 'within range but can be optimized'}

Adjust the content to fit comfortably within the target range while maintaining quality and natural flow.`;
  } else if (wordsMissing < 0) {
    const wordsOver = Math.abs(wordsMissing);
    const overPercent = Math.abs(percentMissing);
    userPrompt = `EMERGENCY WORD COUNT CORRECTION REQUIRED: This content is ${wordsOver} words (${overPercent}%) OVER the required ${targetWordCount} word target.

Content to trim:
"""
${textContent}
"""

Current word count: ${contentWords} words
Required word count: ${targetWordCount} words
Words to remove: ${wordsOver} words (${overPercent}%)

THIS IS YOUR FINAL OPPORTUNITY to trim this content down to ~${targetWordCount} words.

YOU MUST cut without losing the core message:
- Remove redundant phrases and unnecessary qualifiers
- Condense verbose explanations into tighter sentences
- Cut repetitive points — each idea stated once
- Shorten or eliminate low-value examples
- Replace wordy constructions with precise alternatives
- Remove padding and filler language

PRESERVE all key messages, zone labels, CTAs, and the core persuasive argument.

CRITICAL: Do NOT add new content. Do NOT include word counting commentary in the output.`;
  } else {
    userPrompt = `EMERGENCY WORD COUNT CORRECTION REQUIRED: This content is ${wordsMissing} words short of the required ${targetWordCount} word target.

Content to expand:
"""
${textContent}
"""

Current word count: ${contentWords} words
Required word count: ${targetWordCount} words
Words missing: ${wordsMissing} words (${percentMissing}%)

THIS IS YOUR FINAL OPPORTUNITY to expand this content to EXACTLY ${targetWordCount} words.

YOU MUST add high-quality, substantive content that enhances its value:
- Detailed examples with specific outcomes and results
- Comprehensive case studies with measurable impacts
- Supporting evidence from credible sources
- Step-by-step processes and implementation guides
- Background context and industry insights
- Practical applications and real-world scenarios
- Expert opinions and authoritative perspectives

ADD DEPTH, EXAMPLES, AND THOROUGH ELABORATION - NEVER FILLER TEXT.

CRITICAL: Do NOT include your word counting process, verification steps, or any meta-commentary about word counts in the output. Only provide the final content itself.`;
  }

  userPrompt += `\n\nYour ${wordDifference > 0 ? 'condensed' : 'expanded'} version must:
- Maintain the ${formState.tone} tone and ${formState.language} language`;

  if (isShortContent && !minWordCount && !maxWordCount) {
    userPrompt += `
- Be extremely concise and impactful
- Remove any unnecessary words or phrases
- Preserve only the most essential message elements`;
  } else if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
- Fit comfortably within the ${minWordCount}-${maxWordCount} word range
- Maintain natural phrasing and flow
- Be as close to ${targetWordCount} words as possible while staying in range`;
  } else {
    userPrompt += `
- Preserve all existing content (never remove anything valuable)
- Add substantial, valuable, relevant information that enhances understanding
- Include comprehensive details that provide genuine value to the reader`;
  }
  
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    userPrompt += `
- Stay within the ${minWordCount}-${maxWordCount} word range`;
  } else {
    userPrompt += `
- Reach EXACTLY ${targetWordCount} words with NO DEVIATION WHATSOEVER`;
  }

  // Add persona-specific instructions to the user prompt if provided
  if (persona) {
    userPrompt += `\n- Sound authentically like ${persona}'s writing style
- Maintain ${persona}'s distinctive voice, vocabulary, and sentence patterns
- Ensure any added content blends seamlessly with ${persona}'s style`;
  }

  userPrompt += `\n- Be formatted according to the original structure`;

  // Add JSON format instructions if structured content is expected
  if (isStructuredContent) {
    userPrompt += `\n\nPlease format your response as JSON with the following structure:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    },
    {
      "title": "Another section title", 
      "listItems": ["First bullet point", "Second bullet point"]
    }
  ],
  "wordCountAccuracy": 95
}

Return your response in valid JSON format.`;
  }

  if (formState.keywords) {
    userPrompt += `\n\nMake sure to naturally integrate these keywords in the expanded sections: ${formState.keywords}`;
  }
  
  // Add final reminder about word count, with extra emphasis for persona styling
  if (persona) {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nFINAL REMINDER: The content must be within ${minWordCount}-${maxWordCount} words AND sound like ${persona}'s authentic writing style. 
I will check both requirements carefully. Do not submit your response until you have verified both criteria are met.`;
    } else {
      userPrompt += `\n\nFINAL REMINDER: The content MUST be EXACTLY ${targetWordCount} words AND sound like ${persona}'s authentic writing style. 
I will check both requirements carefully. Do not submit your response until you have verified both criteria are met.`;
    }
  } else {
    if (minWordCount !== undefined && maxWordCount !== undefined) {
      userPrompt += `\n\nFINAL VERIFICATION: Ensure the content is within ${minWordCount}-${maxWordCount} words before submitting.`;
    } else {
      userPrompt += `\n\nFINAL VERIFICATION REQUIREMENT:
The content MUST be EXACTLY ${targetWordCount} words.

IMPORTANT: Verify the word count INTERNALLY before submitting. Do NOT include your counting process, word-by-word verification, or any word count calculations in the output. Only provide the final content.`;
    }
  }
  
  return userPrompt;
}

/**
 * Helper function to determine if emergency revision is needed
 */
function shouldPerformEmergencyRevision(
  secondRevisedWordCount: number,
  targetWordCount: number,
  minWordCount?: number,
  maxWordCount?: number,
  formState?: FormState
): boolean {
  // Skip emergency revision for flexible range mode
  if (minWordCount !== undefined && maxWordCount !== undefined) {
    return false;
  }
  
  // Only for strict word count mode
  if (!formState?.prioritizeWordCount) {
    return false;
  }
  
  // Use 95% threshold for emergency revision
  const minimumAcceptable = targetWordCount * 0.95;
  return secondRevisedWordCount < minimumAcceptable;
}

/**
 * Perform emergency (third) revision attempt
 */
async function performEmergencyRevision(
  content: any,
  targetWordCount: number,
  currentWordCount: number,
  percentOfTarget: number,
  formState: FormState,
  currentUser?: User,
  persona?: string,
  isStructuredContent?: boolean,
  progressCallback?: (message: string) => void,
  sessionId?: string
): Promise<any> {
  try {
    // Max tokens for output (edge function handles all API configuration)
    const maxTokens = 4000;

    // Set up a very targeted, emergency prompt for one final attempt
    const emergencySystemPrompt = persona 
      ? `You are ${persona}. EMERGENCY TASK: Your ONLY job is to expand this content to EXACTLY ${targetWordCount} words while maintaining my distinctive voice. Add substantive, valuable content - detailed examples, case studies, elaborations, and supporting evidence. Never use filler or fluff. ${isStructuredContent ? 'Your response MUST be a valid JSON object.' : ''} CRITICAL: Verify word count INTERNALLY before submitting - it MUST be EXACTLY ${targetWordCount} words. Do NOT include your counting process in the output.`
      : `You are an expert copywriter with a CRITICAL EMERGENCY TASK. Your ONLY job is to expand this content to EXACTLY ${targetWordCount} words. Add substantive, valuable content only. Never use filler or fluff. ${isStructuredContent ? 'Your response MUST be a valid JSON object.' : ''} CRITICAL: Verify word count INTERNALLY before submitting - it MUST be EXACTLY ${targetWordCount} words. Do NOT include your counting process in the output.`;
    
    const emergencyUserPrompt = `This content needs to be expanded to EXACTLY ${targetWordCount} words:
    
"""
${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
"""

Current length: ${currentWordCount} words
Target length: ${targetWordCount} words (currently at ${percentOfTarget}%)

${persona 
  ? `Add more substantive content - examples, analogies, elaborations, details - while keeping my (${persona}'s) distinctive voice and style.` 
  : `Add more substantive content - examples, analogies, elaborations, details - to reach the target word count.`}

ABSOLUTE REQUIREMENT: The content MUST be EXACTLY ${targetWordCount} words. Verify the count INTERNALLY before submitting - do NOT include your verification process in the output.

${isStructuredContent ? `Please format your response as a valid JSON object with the following structure:
{
  "headline": "Main headline goes here",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content paragraph(s)"
    }
  ],
  "wordCountAccuracy": 95
}` : 'Provide your response as plain text with appropriate formatting.'}`;
    
    // Make one final desperate attempt with higher temperature via edge function
    try {
      const emergencyData = await makeApiRequestWithFallback(
        formState.model,
        [
          { role: 'system', content: emergencySystemPrompt },
          { role: 'user', content: emergencyUserPrompt }
        ],
        0.9,
        maxTokens,
        isStructuredContent ? { type: "json_object" } : undefined
      );
      
      const emergencyContent = emergencyData.choices[0]?.message?.content;
      
      console.log('📝 Emergency revision response received:', emergencyContent ? `${emergencyContent.length} chars` : 'EMPTY');
      
      // Validate emergency content is not empty
      if (!emergencyContent || emergencyContent.trim().length === 0) {
        console.error('❌ Emergency revision returned empty content!');
        if (progressCallback) {
          progressCallback('❌ Emergency revision returned empty content. Using second revision.');
        }
        return null;
      }
      
      if (emergencyContent) {
        try {
          // Try to parse if structured content is expected
          let finalContent = isStructuredContent
            ? JSON.parse(cleanJsonResponse(emergencyContent))
            : emergencyContent;
          
          const finalWordCount = extractWordCount(finalContent);
          const finalPercentOfTarget = Math.round((finalWordCount / targetWordCount) * 100);
          
          console.log(`📊 Emergency revision final result: ${finalWordCount} words (${finalPercentOfTarget}% of target)`);
          
          if (progressCallback) {
            progressCallback(`🎯 Final emergency revision: ${finalWordCount} words (${finalPercentOfTarget}% of target)`);
          }
          
          return finalContent;
        } catch (parseError) {
          console.error('❌ Error parsing emergency revision response:', parseError);
          
          // Validate emergency content before fallback
          if (!emergencyContent || emergencyContent.trim().length === 0) {
            console.error('❌ Emergency content is empty after parse error!');
            if (progressCallback) {
              progressCallback('❌ Emergency revision parsing failed and content is empty. Using second revision.');
            }
            return null;
          }
          
          const finalWordCount = extractWordCount(emergencyContent);
          console.log(`📊 Emergency revision (plain text fallback): ${finalWordCount} words`);
          
          if (progressCallback) {
            progressCallback(`🎯 Final emergency revision (plain text): ${finalWordCount} words`);
          }
          
          return emergencyContent;
        }
      } else {
        console.error('❌ Emergency revision returned no content!');
        if (progressCallback) {
          progressCallback('❌ Emergency revision returned no content. Using second revision.');
        }
        return null;
      }
    } catch (emergencyError) {
      console.error('Emergency revision failed:', emergencyError);
      if (progressCallback) {
        progressCallback(`❌ Emergency revision failed: ${emergencyError.message}. Using second revision.`);
      }
      return null;
    }
  } catch (emergencySetupError) {
    console.error('Error setting up emergency revision:', emergencySetupError);
    if (progressCallback) {
      progressCallback(`❌ Error setting up emergency revision. Using second revision.`);
    }
    return null;
  }
  
  return null;
}

/**
 * Perform an aggressive revision when normal revision fails to change word count
 */
async function performAggressiveRevision(
  content: any,
  targetWordCountInfo: { target: number; min?: number; max?: number },
  formState: FormState,
  currentUser?: User,
  progressCallback?: (message: string) => void,
  persona?: string,
  sessionId?: string
): Promise<any> {
  const { target: targetWordCount, min: minWordCount, max: maxWordCount } = targetWordCountInfo;

  try {
    // Max tokens for output (edge function handles all API configuration)
    const maxTokens = 4000;

    // Extract actual content from nested objects (e.g., from Alternative Copy with SEO metadata)
    let actualContent = content;
    if (typeof content === 'object' && content.content) {
      actualContent = content.content;
    }

    // Extract text content
    const textContent = typeof actualContent === 'string'
      ? actualContent
      : actualContent.headline
        ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
            `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
          ).join('\n\n')}`
        : JSON.stringify(actualContent);
    
    const contentWords = textContent.trim().split(/\s+/).length;
    const wordsMissing = targetWordCount - contentWords;
    const isStructuredContent = typeof actualContent === 'object' && actualContent.headline && Array.isArray(actualContent.sections);
    
    // Build aggressive system prompt that forces expansion
    const systemPrompt = `You are an expert copywriter with ONE CRITICAL TASK: EXPAND the provided content to EXACTLY ${targetWordCount} words.

EMERGENCY SITUATION: Previous revision attempts have FAILED to expand this content. You MUST succeed where others failed.

AGGRESSIVE EXPANSION REQUIRED:
- Current content: ${contentWords} words
- Required content: ${targetWordCount} words  
- YOU MUST ADD ${wordsMissing} MORE WORDS

EXPANSION STRATEGIES YOU MUST USE:
1. Add 2-3 detailed examples or case studies to each section
2. Include specific statistics, research findings, or expert quotes
3. Expand explanations with step-by-step processes or methodologies
4. Add background context, historical perspective, or comparative analysis
5. Include implementation details, practical applications, or real-world scenarios
6. Add supporting evidence, testimonials, or success stories

${persona ? `MAINTAIN ${persona}'S VOICE: All added content must sound authentically like ${persona}'s writing style.` : ''}

${isStructuredContent ? 'RESPOND WITH VALID JSON OBJECT ONLY.' : 'RESPOND WITH PLAIN TEXT ONLY.'}

ABSOLUTE SUCCESS CRITERIA: The final content MUST be EXACTLY ${targetWordCount} words. Verify word count INTERNALLY - do NOT include counting process in output.`;

    // Build aggressive user prompt
    const userPrompt = `CRITICAL EXPANSION TASK: This content needs ${wordsMissing} more words to reach ${targetWordCount} words total.

Content to expand:
"""
${textContent}
"""

MANDATORY REQUIREMENTS:
- Add substantial, valuable content (never filler)
- Include detailed examples, case studies, research findings
- Expand each section with comprehensive explanations
- Add practical applications and real-world scenarios
- Include supporting evidence and expert perspectives
- MUST reach EXACTLY ${targetWordCount} words

${persona ? `- Maintain ${persona}'s distinctive voice throughout all additions` : ''}

${isStructuredContent ? `Format as JSON:
{
  "headline": "Expanded headline",
  "sections": [
    {
      "title": "Section title",
      "content": "Significantly expanded content with examples..."
    }
  ],
  "wordCountAccuracy": 100
}` : 'Format as plain text with paragraphs.'}

VERIFICATION: Verify word count INTERNALLY before submitting. Do NOT include your counting or verification process in the output.`;

    if (progressCallback) {
      progressCallback(`Making aggressive revision attempt to add ${wordsMissing} words...`);
    }

    // Make aggressive revision API request via edge function
    const data = await makeApiRequestWithFallback(
      formState.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      0.8,
      maxTokens,
      isStructuredContent ? { type: "json_object" } : undefined
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - track aggressive revision
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        formState.model,
        'revise_content_aggressive',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    let aggressiveContent = data.choices[0]?.message?.content;

    if (!aggressiveContent) {
      throw new Error('No content in aggressive revision response');
    }
    
    // Parse structured content if needed
    if (isStructuredContent) {
      try {
        const cleanContent = cleanJsonResponse(aggressiveContent);
        aggressiveContent = JSON.parse(cleanContent);
      } catch (err) {
        console.warn('Error parsing aggressive revision JSON, using as plain text');
      }
    }
    
    const aggressiveWordCount = extractWordCount(aggressiveContent);
    console.log(`🔥 Aggressive revision result: ${aggressiveWordCount} words (target: ${targetWordCount})`);
    
    if (progressCallback) {
      progressCallback(`🔥 Aggressive revision complete: ${aggressiveWordCount} words`);
    }
    
    return aggressiveContent;
    
  } catch (error) {
    console.error('Aggressive revision failed:', error);
    if (progressCallback) {
      progressCallback(`Aggressive revision failed: ${error.message}`);
    }
    return null;
  }
}

function getRefinementWordCountTolerance(formState: FormState, targetWordCount: number): any {
  const isShortContent = targetWordCount <= 150;

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