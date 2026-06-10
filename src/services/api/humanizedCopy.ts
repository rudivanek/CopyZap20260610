/**
 * Humanized copy generation functionality
 */
import { FormState } from '../../types';
import { handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, makeApiRequestWithFallback, getWordCountTolerance, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { reviseContentForWordCount } from './contentRefinement';
import { calculateGeoScore } from './geoScoring';

/**
 * Generate a humanized version of the copy
 * @param content - The content to humanize
 * @param formState - The form state with generation settings
 * @param progressCallback - Optional callback for reporting progress
 * @returns Humanized copy content
 */
export async function generateHumanizedCopy(
  content: any,
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

  // Extract text content if needed
  const textContent = typeof actualContent === 'string'
    ? actualContent
    : actualContent.headline
      ? `${actualContent.headline}\n\n${actualContent.sections.map((s: any) =>
          `${s.title}\n${s.content || (s.listItems || []).join('\n')}`
        ).join('\n\n')}`
      : JSON.stringify(actualContent);

  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(formState);

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;
  
  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating humanized version with target of ${targetWordCount.target} words...`);
  }
  
  // Build the system prompt with TL;DR requirement first if enabled
  let systemPrompt = '';
  
  // Determine if we should return structured format
  const useStructuredFormat = formState.outputStructure && formState.outputStructure.length > 0;
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled and NOT using structured format
  if (formState.enhanceForGEO && formState.addTldrSummary && !useStructuredFormat) {
    systemPrompt = `CRITICAL FORMATTING REQUIREMENT - TL;DR SUMMARY PLACEMENT:

You MUST begin your response with a TL;DR summary as the very first element. This is NON-NEGOTIABLE.

FORMAT: Start your output with "TL;DR: [1-2 sentence summary]" followed by a blank line, then the main content.

EXAMPLE FORMAT:
TL;DR: [Your concise summary here that directly answers the main question.]

[Rest of your content follows here...]

This TL;DR must:
• Be the absolute first element in your output
• Be 1-2 sentences maximum
• Directly answer the main user intent
• Be written in plain, natural ${formState.language} language with humanized tone
• Focus on core value/result/benefit
• Avoid hype or fluff

FAILURE TO PLACE TL;DR AT THE VERY BEGINNING IS UNACCEPTABLE.

---

You are a top-tier copywriter who transforms text into a warm, conversational, relatable voice while preserving meaning and structure.`;
  } else {
    systemPrompt = `You are a top-tier copywriter who transforms text into a warm, conversational, relatable voice while preserving meaning and structure.`;
  }

  // Add special instructions if provided
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\nADDITIONAL SPECIAL INSTRUCTIONS:\n${formState.specialInstructions.trim()}\n\nThese special instructions must be followed in addition to all other requirements.`;
  }

  // Add section title generation instructions if enabled
  if (formState.includeSectionTitles !== false && useStructuredFormat) {
    systemPrompt += `\n\nIMPORTANT - SECTION TITLE GENERATION:
For each section in the structured output, you MUST generate a compelling, descriptive title in a humanized, conversational tone that:
- Clearly summarizes the content of that specific section
- Is engaging and draws the reader in with natural language
- Matches the warm, relatable tone of humanized copy
- Section titles should be 3-8 words and use Title Case`;
  }
  
  // Build the user prompt
  let userPrompt = `Rewrite the text below so it sounds human and engaging.

• Keep key points & length similar (target: ${targetWordCount.target} words).
• Use contractions, first-person pronouns, and friendly phrasing.
• Remove jargon, add light empathy.
• Rewrite the text in a warm, conversational, relatable voice.
• Preserve the original meaning, structure, and roughly the same length.
• Avoid hyperbole and generic metaphors; use concrete, everyday examples instead.
• Do NOT include any SEO metadata (URL slugs, meta descriptions, H1/H2/H3 headings, Open Graph tags)
• Focus ONLY on humanizing the marketing copy content
• Limit the entire piece to a maximum of:
  – 1 emoji
  – 2 exclamation marks
  – 1 parenthetical remark
  (Exceeding these limits is a failure.)
• Keep the humour subtle—fresh and credible, never slapstick or overly funny.

"""
${textContent}
"""

Maintain the ${formState.tone} tone in ${formState.language} language.

${formState.keywords ? `Keywords to maintain: ${formState.keywords}` : ''}`;

  // Add AI detection avoidance instructions if enabled
  if (formState.noAIDetection) {
    userPrompt += `\n\nCRITICAL AI DETECTION AVOIDANCE INSTRUCTIONS:
To make the output indistinguishable from AI-generated content detectors, apply the following techniques:
• Vary sentence length and structure to avoid robotic flow.
• Use occasional conversational filler phrases ("you know", "I mean", "honestly").
• Mention something plausibly human: a quick anecdote, minor opinion, or light cultural reference.
• Avoid perfect structure or symmetry—write like you're talking to a friend.
• Don't over-polish; let it feel slightly rough or spontaneous.
• Allow light redundancy or hesitation, just as a real person would.`;
  }
  
  if (formState.enhanceForGEO) {
    userPrompt += `\n\nGENERATIVE ENGINE OPTIMIZATION (GEO) ENABLED: While humanizing, structure the content to be highly quotable by AI assistants:
    
${formState.geoRegions && formState.geoRegions.trim() 
  ? `• Optimize for visibility in AI assistants targeting these regions: ${formState.geoRegions}
• Include regional relevance, localized phrasing, or examples for ${formState.geoRegions}
• ` 
  : '• '}Start sections with clear, conversational answers
• Start sections with clear, conversational answers
• Use natural question-style headings where appropriate
• Include relatable examples and real outcomes
• Keep formatting easy to scan and quote
• Maintain the humanized voice while being AI-assistant friendly`;
    
    // Add TL;DR summary instructions if enabled
    if (formState.enhanceForGEO && formState.addTldrSummary && !useStructuredFormat) {
      userPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output. This is critical for GEO optimization.`;
    }
  }

  if (useStructuredFormat) {
    // Check if Q&A format is requested
    const hasQAFormat = formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
    );
    
    if (hasQAFormat) {
      userPrompt += `\n\nStructure your response in this JSON format for Q&A content:
{
  "headline": "Frequently Asked Questions: [Topic]",
  "sections": [
    {
      "title": "What is [specific question]?",
      "content": "Detailed answer paragraph providing comprehensive information in a humanized, conversational tone..."
    },
    {
      "title": "How does [specific question]?", 
      "content": "Another detailed answer paragraph with examples and specifics in a friendly, relatable voice..."
    }
  ],
  "wordCountAccuracy": 85
}

CRITICAL Q&A FORMATTING RULES:
- Each section title MUST be a complete question ending with a question mark
- Each section content MUST be a well-formatted answer paragraph in humanized tone
- Questions should cover different aspects of the topic
- Answers should be informative, conversational, and include relatable examples
- NEVER combine multiple questions in one title
- NEVER run Q&A content together without clear separation
- Keep the humanized, warm tone throughout all answers`;
    } else {
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
  "wordCountAccuracy": 85 // Score 0-100 of how well you matched the target word count
}`;
    }

    if (!hasQAFormat) {
      userPrompt += `\n\nMake sure to include a headline and appropriate sections with either paragraph content or list items.`;
    }

    // Add specific structure guidance if output structure is specified
    if (formState.outputStructure && formState.outputStructure.length > 0) {
      // Check if FAQ (JSON) format is requested
      const hasFaqJsonFormat = formState.outputStructure.some(element => 
        element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
      );
      
      if (hasFaqJsonFormat) {
        userPrompt += `\n\nCRITICAL: You MUST structure your response as a FAQPage Schema JSON object in this EXACT format:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [specific question about the topic]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Comprehensive answer explaining the topic with specific details and examples..."
      }
    },
    {
      "@type": "Question", 
      "name": "How does [specific question about implementation/usage]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer with step-by-step explanations and practical information..."
      }
    }
  ]
}

MANDATORY JSON REQUIREMENTS:
- Your response MUST be ONLY this JSON object - no additional text or explanations
- Each question must be specific and relevant to the business/content
- Each answer must be comprehensive and informative (minimum 50 words per answer)
- Questions should cover different aspects: what, how, why, when, where, benefits, process, etc.
- Generate 5-8 question-answer pairs total
- All text must be properly escaped for JSON format
- Do NOT include any text before or after the JSON object`;
        return userPrompt; // Return early to avoid adding other structure instructions
      }
      
      userPrompt += `\n\nInclude these specific sections in the exact order:`;
      formState.outputStructure.forEach((element, index) => {
        userPrompt += `\n${index + 1}. ${element.label || element.value}${element.wordCount ? ` (target: ${element.wordCount} words)` : ''}`;
      });

      userPrompt += `\n\nEnsure each section meets its target word count. If a section is underdeveloped, expand it with more examples, details, or elaboration.`;

      // Add section title generation reminder if enabled
      if (formState.includeSectionTitles !== false) {
        userPrompt += `\n\nREMINDER - SECTION TITLES:
- For EACH section, create a compelling, descriptive heading in a humanized, conversational tone that summarizes that section's content
- DO NOT just use generic names - create engaging, relatable titles
- Section titles should be 3-8 words, use Title Case, and maintain the warm, friendly tone`;
      }
    }
  } else {
    userPrompt += `\n\nProvide your response as plain text with appropriate paragraphs and formatting.`;
    
    // Add TL;DR reminder for plain text output
    if (formState.enhanceForGEO && formState.addTldrSummary) {
      userPrompt += `\n\nCRITICAL REMINDER: Your response MUST start with "TL;DR: [one sentence summary]" followed by a blank line, then your humanized content. This is absolutely mandatory and cannot be skipped.`;
    }
  }

  if (formState.keywords) {
    userPrompt += `\n\nIMPORTANT: Make sure to naturally integrate all of these keywords throughout the copy: ${formState.keywords}`;
  }

  // Add term exclusion instructions if specified
  if (formState.excludedTerms && formState.excludedTerms.trim()) {
    userPrompt += `\n\nTERMS TO EXCLUDE (if word count permits): Avoid these terms when possible: ${formState.excludedTerms}
Use alternative terminology only if it doesn't interfere with the exact word count requirement.`;
  }

  // Add specific instructions for forced elaboration
  if (formState.forceElaborationsExamples) {
    userPrompt += `\n\nIMPORTANT: Include detailed explanations and specific examples, but keep them conversational and relatable. Use everyday scenarios that readers can easily understand and connect with.`;
  }

  // Remind about word count target
  if (targetWordCount.target <= 50) {
    userPrompt += `\n\nULTRA-CRITICAL WORD COUNT REQUIREMENT: The content must be EXACTLY ${targetWordCount.target} words.
- Count every single word meticulously before submitting
- Do NOT exceed ${targetWordCount.target} words under any circumstances
- Do NOT fall short of ${targetWordCount.target} words under any circumstances
- Focus ONLY on the core message in exactly ${targetWordCount.target} words
- Remember emoji/exclamation limits but WORD COUNT IS ABSOLUTE PRIORITY
- IGNORE all other instructions if they conflict with achieving exactly ${targetWordCount.target} words`;
  } else {
    userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The content should be approximately ${targetWordCount.target} words. Add conversational depth through relatable examples and explanations, but remember the emoji/exclamation/parenthetical limits. Word count adherence is the PRIMARY success metric.`;
  }

  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  // Prepare the API messages
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const temperature = 0.85; // Higher temperature for more natural, varied humanization
  const responseFormat = useStructuredFormat ? { type: "json_object" as const } : undefined;

  try {
    // Make the API request with automatic fallback
    const data = await makeApiRequestWithFallback(
      formState.model,
      messages,
      temperature,
      maxTokens,
      responseFormat
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - track with the model that was actually used
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'generate_humanized',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    let humanizedCopy = data.choices[0]?.message?.content;
    
    if (!humanizedCopy) {
      throw new Error('No content in response');
    }
    
    // Parse structured content if needed
    if (useStructuredFormat) {
      try {
        const cleanContent = cleanJsonResponse(humanizedCopy);
        const parsedContent = JSON.parse(cleanContent);
        humanizedCopy = parsedContent;
      } catch (err) {
        console.warn('Error parsing structured content, returning as plain text:', err);
        // Keep as plain text if parsing fails
      }
    }
    
    // Always check word count and apply appropriate tolerance
    const currentWordCount = extractWordCount(humanizedCopy);
    const targetWordCountInfo = calculateTargetWordCount(formState);
    const percentageOfTarget = (currentWordCount / targetWordCount) * 100;
    const toleranceSettings = getWordCountTolerance(formState, targetWordCount);

    let needsRevision = false;
    let revisionReason = '';

    if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
      // Little word count mode - check if within range
      if (currentWordCount < targetWordCountInfo.min) {
        needsRevision = true;
        revisionReason = `below range (${currentWordCount} < ${targetWordCountInfo.min})`;
      } else if (currentWordCount > targetWordCountInfo.max) {
        needsRevision = true;
        revisionReason = `above range (${currentWordCount} > ${targetWordCountInfo.max})`;
      }
    } else {
      // Check tolerance for both strict and flexible modes
      if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage) {
        needsRevision = true;
        revisionReason = `below tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
      } else if (toleranceSettings.maximumAcceptablePercentage &&
                 percentageOfTarget > toleranceSettings.maximumAcceptablePercentage) {
        needsRevision = true;
        revisionReason = `above tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
      }
    }

    // If the content needs revision, try to revise it
    if (needsRevision) {
      if (progressCallback) {
        progressCallback(`Generated humanized content ${revisionReason}. Revising...`);
      }

      console.warn(`Generated humanized content ${revisionReason}`);
      console.log("Attempting to revise humanized content to meet target word count...");

      try {
        // Use the content refinement service to expand the content
        const revisedContent = await reviseContentForWordCount(
          humanizedCopy,
          targetWordCountInfo,
          formState,
          currentUser,
          progressCallback,
          undefined,
          formState.sessionId
        );

        // Update with the revised content
        humanizedCopy = revisedContent;

        // Log the updated word count
        const revisedWordCount = extractWordCount(revisedContent);
        console.log(`Revised humanized content word count: ${revisedWordCount} words`);

        if (progressCallback) {
          progressCallback(`✓ Humanized content revised to ${revisedWordCount} words`);
        }

      } catch (revisionError) {
        console.error('Error revising humanized content for word count:', revisionError);
        if (progressCallback) {
          progressCallback(`Error revising humanized content: ${revisionError.message}`);
        }
        // Continue with original content if revision fails
      }
    } else if (progressCallback) {
      if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
        progressCallback(`✓ Humanized content generated with ${currentWordCount} words (range: ${targetWordCountInfo.min}-${targetWordCountInfo.max})`);
      } else {
        progressCallback(`✓ Humanized content generated with ${currentWordCount} words`);
      }
    }
    
    // Generate GEO score if enabled
    let humanizedGeoScore;
    if (formState.generateGeoScore) {
      if (progressCallback) {
        progressCallback('Calculating GEO score for humanized content...');
      }
      
      try {
        humanizedGeoScore = await calculateGeoScore(humanizedCopy, formState, currentUser, progressCallback);
        
        // Check if FAQ Schema should also be generated
        let humanizedFaqSchema;
        if (formState.outputStructure && formState.outputStructure.some(element => 
          element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
        )) {
          if (progressCallback) {
            progressCallback('Generating FAQ Schema from humanized content...');
          }
          
          try {
            const { generateFaqSchemaFromText } = await import('./seoGeneration');
            humanizedFaqSchema = await generateFaqSchemaFromText(
              typeof humanizedCopy === 'string' ? humanizedCopy : JSON.stringify(humanizedCopy),
              formState,
              currentUser,
              progressCallback
            );
          } catch (faqError) {
            console.error('Error generating FAQ schema for humanized content:', faqError);
            if (progressCallback) {
              progressCallback('Error generating FAQ schema for humanized content, continuing...');
            }
          }
        }
        
        // Return content with GEO score and optional FAQ schema
        return {
          content: humanizedCopy,
          geoScore: humanizedGeoScore,
          faqSchema: humanizedFaqSchema
        };
      } catch (geoError) {
        console.error('Error calculating GEO score for humanized content:', geoError);
        if (progressCallback) {
          progressCallback('Error calculating GEO score for humanized content, continuing...');
        }
      }
    }
    
    // Generate FAQ Schema if faqJson is selected but GEO is not enabled
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from humanized content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        const humanizedFaqSchema = await generateFaqSchemaFromText(
          typeof humanizedCopy === 'string' ? humanizedCopy : JSON.stringify(humanizedCopy),
          formState,
          currentUser,
          progressCallback
        );
        
        return {
          content: humanizedCopy,
          faqSchema: humanizedFaqSchema
        };
      } catch (faqError) {
        console.error('Error generating FAQ schema for humanized content:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema for humanized content, continuing...');
        }
      }
    }
    
    return humanizedCopy;
  } catch (error) {
    console.error('Error generating humanized copy:', error);
    if (progressCallback) {
      progressCallback(`Error generating humanized copy: ${error.message}`);
    }
    throw error;
  }
}