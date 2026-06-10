/**
 * Alternative copy generation functionality
 */
import { FormState } from '../../types';
import { handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, makeApiRequestWithFallback, getWordCountTolerance, cleanJsonResponse } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { generateSeoMetadata } from './seoGeneration';
import { saveCopySession } from '../supabaseClient';
import { reviseContentForWordCount } from './contentRefinement';
import { calculateGeoScore } from './geoScoring';

function detectZoneLabels(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n');
  const zoneLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^zona\s+\d+\s*[—\-–]/i.test(trimmed) || /^\[zona\s+\d+/i.test(trimmed)) {
      zoneLines.push(trimmed);
    }
  }
  return zoneLines;
}

/**
 * Generate an alternative version of the copy
 * @param formState - The form state with generation settings
 * @param improvedCopy - The primary copy to create an alternative for
 * @param sessionId - Optional session ID for saving to the database
 * @param progressCallback - Optional callback for reporting progress
 * @returns Alternative copy content
 */
export async function generateAlternativeCopy(
  formState: FormState,
  improvedCopy: any,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<any> {
  // Extract actual content from nested objects (e.g., from previous generation with SEO metadata)
  let actualContent = improvedCopy;
  if (typeof improvedCopy === 'object' && improvedCopy.content) {
    actualContent = improvedCopy.content;
  }

  // Extract text content from structured content if needed
  const improvedCopyText = typeof actualContent === 'string'
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

  // Detect zone labels from the copy text AND from special instructions
  const zoneLabelsFromCopy = detectZoneLabels(improvedCopyText);
  const zoneLabelsFromInstructions = detectZoneLabels(formState.specialInstructions || '');
  const allZoneLabels = zoneLabelsFromCopy.length > 0 ? zoneLabelsFromCopy : zoneLabelsFromInstructions;
  const hasZoneStructure = allZoneLabels.length > 0;

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Generating alternative version with target of ${targetWordCount} words...`);
  }

  // Build the system prompt with TL;DR requirement first if enabled
  let systemPrompt = '';

  // Determine if we should return structured format
  const useStructuredFormat = formState.outputStructure && formState.outputStructure.length > 0;

  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled and NOT using structured format
  if (formState.enhanceForGEO && formState.addTldrSummary && !useStructuredFormat) {
    systemPrompt = `ABSOLUTE MANDATORY REQUIREMENT - TL;DR SUMMARY:

Your response MUST begin with "TL;DR:" followed by exactly one concise sentence that directly answers the main question.

EXACT FORMAT REQUIRED:
TL;DR: [One clear sentence that directly answers what the user wants to know.]

[blank line]

[Rest of your alternative marketing copy content...]

CRITICAL TL;DR RULES:
- Must be the first 3 characters: "TL;"
- Only ONE sentence in the TL;DR
- Answer the core question directly
- Use natural ${formState.language} language
- No hype words or marketing fluff
- Follow with blank line, then main content

FAILURE TO START WITH "TL;DR:" = COMPLETE REJECTION

---

You are an expert copywriter who excels at creating alternative versions of marketing content.`;
  } else {
    systemPrompt = `You are an expert copywriter who excels at creating alternative versions of marketing content.`;
  }

  systemPrompt += `
  Your task is to create a compelling alternative version of the marketing copy provided, with a different approach or angle.
  The alternative version should maintain the key message and purpose, but present it in a fresh way.
  Maintain the ${formState.tone} tone and stay within the approximate target of ${targetWordCount} words.
${hasZoneStructure ? `
  ⚠️ ZONE STRUCTURE — ABSOLUTE HARD RULE — THIS OVERRIDES EVERYTHING:
  This copy uses a named zone layout. You MUST output every zone label EXACTLY as it appears in the original (e.g., "${allZoneLabels[0]}").
  Do NOT rename, merge, reorder, drop, or rephrase any zone label under any circumstances.
  Rewrite ONLY the copy content within each zone. The zone labels are the fixed skeleton.

  Zone labels that MUST appear in your output, word-for-word:
${allZoneLabels.map(z => `  - ${z}`).join('\n')}
` : `
  ⚠️ IMMUTABLE STRUCTURE RULE — THIS OVERRIDES EVERYTHING ELSE:
  If the source copy contains zone labels, section labels, or any structural headings (e.g., "Zona 1 — Hero con CTA primario", "Zona 2 — Prueba Social", "Section 1:", numbered zones, or any label defined in the Special Instructions), those labels MUST appear in your output EXACTLY as written — unchanged in wording, order, and count.
  You are rewriting the CONTENT WITHIN each zone/section only.
  You must NOT rename zones, invent new section names, merge zones, split zones, or drop any zone.
  The structural skeleton is fixed. Only the body copy inside each zone gets an alternative treatment.
`}
  CRITICAL: Do NOT include any SEO metadata in your content output:
  - Do NOT include URL slugs, meta descriptions, or Open Graph tags
  - Do NOT include H1, H2, or H3 headings as metadata elements
  - Focus ONLY on creating compelling alternative marketing copy content
  - SEO metadata is handled separately and should NOT be part of your content

  IMPORTANT: The copy must be ${targetWordCount} words or longer. Do not conclude early.
  If you need more content to reach the word count, add depth through examples, explanations, and elaboration.`;

  // Add special instructions if provided
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\n=== MANDATORY SPECIAL INSTRUCTIONS ===
The following instructions are HIGHEST PRIORITY and OVERRIDE any conflicting defaults. You MUST follow every instruction below without exception:

${formState.specialInstructions.trim()}

CRITICAL REMINDER: If these special instructions define zones, sections, or a page structure (e.g., "Zona 1 —", "Zona 2 —", named sections), those zone/section labels are the IMMUTABLE STRUCTURAL SKELETON of the output. Preserve every label exactly. Only the copy content within each zone gets the alternative treatment.
=== END MANDATORY SPECIAL INSTRUCTIONS ===`;
  }

  // Add section title generation instructions if enabled
  if (formState.includeSectionTitles !== false && useStructuredFormat) {
    systemPrompt += `\n\nIMPORTANT - SECTION TITLE GENERATION:
For each section in the structured output, you MUST generate a compelling, descriptive title that:
- Clearly summarizes the content of that specific section
- Is engaging and draws the reader in
- Matches the tone and style of the overall copy
- Section titles should be 3-8 words and use Title Case`;
  }
  
  // Build the user prompt
  let userPrompt = `Generate an alternative version of this marketing copy with a different approach or angle.

Original copy:
"""
${improvedCopyText}
"""

Key information to maintain:
- Target audience: ${formState.targetAudience || 'Not specified'}
- Key message: ${formState.keyMessage || 'Not specified'}
- Call to action: ${formState.callToAction || 'Not specified'}
- Tone: ${formState.tone}
- Language: ${formState.language}
- Target word count: ${targetWordCount} words
${formState.geoRegions ? `- Target Countries/Regions: ${formState.geoRegions}` : ''}

${formState.keywords ? `Keywords to include: ${formState.keywords}` : ''}
${formState.brandValues ? `Brand values: ${formState.brandValues}` : ''}
${formState.desiredEmotion ? `Desired emotion: ${formState.desiredEmotion}` : ''}`;

  if (formState.location) userPrompt += `\n- Target Location/Region: ${formState.location}`;

  // Add section-specific guidelines based on formState.section
  if (formState.section) {
    userPrompt += `\n\nThis is for the "${formState.section}" section.`;
  }
  
  // Add term exclusion instructions if specified
  if (formState.excludedTerms && formState.excludedTerms.trim()) {
    userPrompt += `\n\nTERMS TO EXCLUDE: Do not mention or reference any of these terms in your response: ${formState.excludedTerms}
Use alternative terminology or avoid these topics entirely.`;
  }
  
  // Determine if we should return structured format
  
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
      "content": "Detailed answer paragraph providing comprehensive information..."
    },
    {
      "title": "How does [specific question]?", 
      "content": "Another detailed answer paragraph with examples and specifics..."
    }
  ],
  "wordCountAccuracy": 85
}

CRITICAL Q&A FORMATTING RULES:
- Each section title MUST be a complete question ending with a question mark
- Each section content MUST be a well-formatted answer paragraph
- Questions should cover different aspects of the topic
- Answers should be informative, specific, and include examples where helpful
- NEVER combine multiple questions in one title
- NEVER run Q&A content together without clear separation`;
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
- For EACH section, create a compelling, descriptive heading that summarizes that section's content
- DO NOT just use generic names - create engaging, benefit-driven titles
- Section titles should be 3-8 words, use Title Case, and match the overall tone`;
      }
    }
  } else {
    userPrompt += `\n\nProvide your response as plain text with appropriate paragraphs and formatting.`;

    // Add section title instructions if enabled (even without outputStructure)
    if (formState.includeSectionTitles !== false) {
      userPrompt += `\n\nCRITICAL - Markdown Section Headings:
- MUST use markdown heading syntax: # for main headings, ## for subheadings
- NEVER use plain text for section titles - they MUST start with # or ##
- Create descriptive, engaging headings that summarize each section's content
- Headings should be 3-8 words, use Title Case, and match the overall tone
- Example format:

# Transform Your Business with AI-Powered Solutions

[Your content here...]

## Key Benefits That Drive Real Results

[Your content here...]

- Each major section MUST have a markdown heading (starting with # or ##)`;
    }

    // Add TL;DR reminder for plain text output
    if (formState.enhanceForGEO && formState.addTldrSummary) {
      userPrompt += `\n\nCRITICAL REMINDER: Your response MUST start with "TL;DR: [one sentence summary]" followed by a blank line, then your alternative content. This is absolutely mandatory and cannot be skipped.`;
    }
  }

  if (formState.keywords) {
    userPrompt += `\n\nIMPORTANT: Make sure to naturally integrate all of these keywords throughout the copy: ${formState.keywords}`;
  }

  // Add specific instructions for forced elaboration
  if (formState.forceElaborationsExamples) {
    userPrompt += `\n\nIMPORTANT: Include detailed explanations, specific examples, and where appropriate, brief case studies or scenarios to fully elaborate on your points. Make sure to substantiate claims with evidence or reasoning.`;
  }
  
  // Add GEO enhancement instructions if enabled
  if (formState.enhanceForGEO) {
    userPrompt += `\n\nGENERATIVE ENGINE OPTIMIZATION (GEO) ENABLED: Structure this alternative content to be highly quotable and summarizable by AI assistants:
    
${formState.geoRegions && formState.geoRegions.trim() 
  ? `• Optimize for visibility in AI assistants targeting these regions: ${formState.geoRegions}
• Include regional relevance, localized phrasing, or examples for ${formState.geoRegions}
• ` 
  : '• '}Start with clear, direct answers
• Start with clear, direct answers
• Use question-based subheadings where logical
• Include authority signals (examples, results, credentials)
• Keep formatting scannable with short paragraphs and bullet points
• Use natural, specific language AI tools can easily process and quote`;
    
    // Add TL;DR summary instructions if enabled
    if (formState.addTldrSummary && !useStructuredFormat) {
      userPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output. This is critical for GEO optimization.`;
    }
  }
  
  // Remind about word count target
  if (targetWordCount <= 50) {
    userPrompt += `\n\nULTRA-CRITICAL WORD COUNT REQUIREMENT: The content must be EXACTLY ${targetWordCount} words.
- Count every single word meticulously before submitting
- Do NOT exceed ${targetWordCount} words under any circumstances  
- Do NOT fall short of ${targetWordCount} words under any circumstances
- Focus ONLY on the core message in exactly ${targetWordCount} words
- IGNORE all other instructions if they conflict with achieving exactly ${targetWordCount} words
- WORD COUNT IS THE ABSOLUTE PRIORITY`;
  } else {
    userPrompt += `\n\nCRITICAL WORD COUNT REQUIREMENT: The content must be ${targetWordCount} words or longer. If needed, add depth through examples, explanations, and elaboration. Word count adherence is the PRIMARY success metric.`;
  }
  
  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);

  // Prepare the API messages
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const temperature = 0.8; // Higher temperature for more creativity in alternatives
  const responseFormat = useStructuredFormat ? { type: "json_object" as const } : undefined;

  try {
    // Make the API request with automatic fallback
    const data = await makeApiRequestWithFallback(
      formState.model,
      messages,
      temperature,
      maxTokens,
      responseFormat,
      currentUser?.email
    );

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - track with the model that was actually used
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'generate_alternative',
        sessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }
    
    // Extract the content from the response
    let alternativeCopy = data.choices[0]?.message?.content;
    
    if (!alternativeCopy) {
      throw new Error('No content in response');
    }
    
    // Parse structured content if needed
    if (useStructuredFormat) {
      try {
        const cleanContent = cleanJsonResponse(alternativeCopy);
        const parsedContent = JSON.parse(cleanContent);
        alternativeCopy = parsedContent;
      } catch (err) {
        console.warn('Error parsing structured content, returning as plain text:', err);
        // Keep as plain text if parsing fails
      }
    }
    
    // Always check word count and apply appropriate tolerance
    const currentWordCount = extractWordCount(alternativeCopy);
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
        progressCallback(`Generated alternative content ${revisionReason}. Revising...`);
      }

      console.warn(`Generated alternative content ${revisionReason}`);
      console.log("Attempting to revise alternative content to meet target word count...");

      try {
        // Use the content refinement service to expand the content
        const revisedContent = await reviseContentForWordCount(
          alternativeCopy,
          targetWordCountInfo,
          formState,
          currentUser,
          progressCallback,
          undefined, // persona
          formState.sessionId
        );

        // Update with the revised content
        alternativeCopy = revisedContent;

        // Log the updated word count
        const revisedWordCount = extractWordCount(revisedContent);
        console.log(`Revised alternative content word count: ${revisedWordCount} words`);

        if (progressCallback) {
          progressCallback(`✓ Alternative content revised to ${revisedWordCount} words`);
        }

      } catch (revisionError) {
        console.error('Error revising alternative content for word count:', revisionError);
        if (progressCallback) {
          progressCallback(`Error revising alternative content: ${revisionError.message}`);
        }
        // Continue with original content if revision fails
      }
    } else if (progressCallback) {
      if (targetWordCountInfo.min !== undefined && targetWordCountInfo.max !== undefined) {
        progressCallback(`✓ Alternative content generated with ${currentWordCount} words (range: ${targetWordCountInfo.min}-${targetWordCountInfo.max})`);
      } else {
        progressCallback(`✓ Alternative content generated with ${currentWordCount} words`);
      }
    }
    
    // Generate SEO metadata if enabled (for alternative copy)
    let alternativeSeoMetadata;
    if (formState.generateSeoMetadata) {
      if (progressCallback) {
        progressCallback('Generating SEO metadata for alternative copy...');
      }
      
      try {
        alternativeSeoMetadata = await generateSeoMetadata(alternativeCopy, formState, progressCallback);
      } catch (seoError) {
        console.error('Error generating SEO metadata for alternative:', seoError);
        if (progressCallback) {
          progressCallback('Error generating SEO metadata for alternative, continuing...');
        }
      }
    }
    
    // Generate GEO score if enabled (for alternative copy)
    let alternativeGeoScore;
    if (formState.generateGeoScore) {
      if (progressCallback) {
        progressCallback('Calculating GEO score for alternative copy...');
      }
      
      try {
        alternativeGeoScore = await calculateGeoScore(alternativeCopy, formState, currentUser, progressCallback);
      } catch (geoError) {
        console.error('Error calculating GEO score for alternative:', geoError);
        if (progressCallback) {
          progressCallback('Error calculating GEO score for alternative, continuing...');
        }
      }
    }
    
    // Generate FAQ Schema if faqJson is selected in output structure
    let alternativeFaqSchema;
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from alternative content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        alternativeFaqSchema = await generateFaqSchemaFromText(
          typeof alternativeCopy === 'string' ? alternativeCopy : JSON.stringify(alternativeCopy),
          formState,
          currentUser,
          progressCallback
        );
      } catch (faqError) {
        console.error('Error generating FAQ schema for alternative:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema for alternative, continuing...');
        }
      }
    }
    
    // Save to database if session ID is provided
    if (sessionId) {
      try {
        await saveCopySession(formState, improvedCopy, alternativeCopy, sessionId);
      } catch (err) {
        console.error('Error saving copy session:', err);
        // Continue even if save fails
      }
    }
    
    // Return alternative copy with SEO metadata if generated
    if (alternativeSeoMetadata || alternativeGeoScore || alternativeFaqSchema) {
      return {
        content: alternativeCopy,
        seoMetadata: alternativeSeoMetadata,
        geoScore: alternativeGeoScore,
        faqSchema: alternativeFaqSchema
      };
    }
    
    return alternativeCopy;
  } catch (error) {
    console.error('Error generating alternative copy:', error);
    if (progressCallback) {
      progressCallback(`Error generating alternative copy: ${error.message}`);
    }
    throw error;
  }
}