/**
 * Main copy generation functionality
 */
import { FormState, User, CopyResult, BrandVoice, StructuredCopyOutput } from '../../types';
import { handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, getWordCountTolerance, makeApiRequestWithFallback } from './utils';
import { trackTokenUsage, extractTokenBreakdown } from './tokenTracking';
import { saveCopySession, getSupabaseClient } from '../supabaseClient';
import { reviseContentForWordCount } from './contentRefinement';
import { generateSeoMetadata } from './seoGeneration';
import { calculateGeoScore } from './geoScoring';
import { runEnhancedPipeline } from '../../utils/ai-pipeline/enhancedPipeline';
import { validateCopyMakerResult, buildRepairPrompt } from '../../utils/copyMakerOutputValidation';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch brand voice data if brandVoiceId is provided
 */
async function fetchBrandVoice(brandVoiceId: string): Promise<BrandVoice | null> {
  if (!brandVoiceId) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pmc_public_brand_voices')
      .select('*')
      .eq('id', brandVoiceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching brand voice:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception fetching brand voice:', err);
    return null;
  }
}

/**
 * Generate copy based on form state
 * @param formState - The form state with generation settings
 * @param currentUser - The current user (for token tracking)
 * @param sessionId - Optional session ID for updating an existing session
 * @param progressCallback - Optional callback for reporting progress
 * @returns A CopyResult object with the generated content
 */
export async function generateCopy(
  formState: FormState,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<CopyResult> {
  // Check AI Engine Mode and route to appropriate pipeline
  const aiEngineMode = formState.aiEngineMode || 'legacy';

  if (aiEngineMode === 'enhanced') {
    console.log('🚀 Using CopyZap+ Enhanced Pipeline');
    return runEnhancedPipeline(formState, currentUser, sessionId, progressCallback);
  }

  // Legacy pipeline (default)
  console.log('📝 Using Legacy Pipeline');

  // STRICT: Session ID must be provided - NO orphaned UUIDs
  if (!sessionId) {
    throw new Error(
      'We couldn\'t create a tracking session. Please retry. If the issue persists, contact support.'
    );
  }
  const actualSessionId = sessionId;

  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(formState);

  // Max tokens for output (edge function handles all API configuration)
  const maxTokens = 4000;

  console.log('Token limits calculated:', {
    targetWords: targetWordCount.target,
    finalMaxTokens: maxTokens,
    maxWordsAllowed: Math.floor(maxTokens / 1.3),
    model: formState.model
  });

  // Debug: Log word count enforcement settings
  console.log('Word count enforcement:', {
    prioritizeWordCount: formState.prioritizeWordCount,
    adhereToLittleWordCount: formState.adhereToLittleWordCount,
    targetWordCount: targetWordCount.target,
    formStateKeys: Object.keys(formState).filter(k => k.includes('prioritize') || k.includes('wordCount'))
  });

  // Progress reporting if callback provided
  if (progressCallback) {
    progressCallback(`Initializing copy generation with ${formState.model}...`);
  }

  // Fetch brand voice if specified
  let brandVoice: BrandVoice | null = null;
  if (formState.brandVoiceId) {
    if (progressCallback) {
      progressCallback('Loading brand voice settings...');
    }
    brandVoice = await fetchBrandVoice(formState.brandVoiceId);
    if (brandVoice && progressCallback) {
      progressCallback(`Applying brand voice: ${brandVoice.name}`);
    }
  }

  // Auto-distribute word counts if output structure is provided but counts are missing
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    const missingWordCounts = formState.outputStructure.every(
      section => !section.wordCount || section.wordCount === 0
    );

    if (missingWordCounts) {
      const perSection = Math.floor(targetWordCount.target / formState.outputStructure.length);
      formState.outputStructure = formState.outputStructure.map(section => ({
        ...section,
        wordCount: perSection
      }));

      console.log(`Auto-distributed word count: ${perSection} words per section across ${formState.outputStructure.length} sections`);

      if (progressCallback) {
        progressCallback(`Auto-distributed ${targetWordCount.target} words across ${formState.outputStructure.length} sections`);
      }
    }
  }
  
  // Build the system prompt
  const systemPrompt = buildSystemPrompt(formState, targetWordCount, brandVoice);

  // Build the user prompt
  const userPrompt = buildUserPrompt(formState, targetWordCount.target);
  
  // Store the prompts for display in the UI
  storePrompts(systemPrompt, userPrompt);
  
  if (progressCallback) {
    progressCallback(`Generating ${formState.tab === 'create' ? 'new' : 'improved'} copy with target of ${targetWordCount.target} words...`);
  }
  
  // Always use plain text format for consistency
  // Prepare the API messages
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const temperature = targetWordCount.target <= 150 ? 0.5 : 0.7; // Lower temperature for short content for more precision

  try {
    console.log('Making API request with model:', formState.model);

    // Make the API request with automatic fallback
    const data = await makeApiRequestWithFallback(
      formState.model,
      messages,
      temperature,
      maxTokens,
      undefined,
      currentUser?.email
    );

    console.log('API response received with model:', data.model_used);

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // MANDATORY TOKEN TRACKING - track with the model that was actually used
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'generate_copy',
        actualSessionId, // Use actualSessionId, not sessionId parameter
        0, // retryCount
        undefined, // trackingId
        extractTokenBreakdown(data.usage) // Phase 3: Token breakdown
      );
    }
    
    // Extract the content from the response
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    // Content is always plain text
    let improvedCopy = content;
    
    // Get the current word count
    const currentWordCount = extractWordCount(improvedCopy);
    
    if (progressCallback) {
      progressCallback(`Initial copy generated with ${currentWordCount} words (target: ${targetWordCount.target})`);
    }
    
    // ALWAYS check word count - enforce limits regardless of user toggle
    if (true) {
      // Get tolerance settings
      const toleranceSettings = getWordCountTolerance(formState, targetWordCount.target);
      
      // For short content (≤150 words), be more strict about both minimum and maximum
      const targetValue = targetWordCount.target;
      const percentageOfTarget = (currentWordCount / targetValue) * 100;
      
      let needsRevision = false;
      let revisionReason = '';
      
      // Check if revision is needed based on tolerance settings
      if (targetWordCount.min !== undefined && targetWordCount.max !== undefined) {
        // Flexible range mode
        if (currentWordCount < targetWordCount.min) {
          needsRevision = true;
          revisionReason = `below minimum range (${currentWordCount} < ${targetWordCount.min})`;
        } else if (currentWordCount > targetWordCount.max) {
          needsRevision = true;
          revisionReason = `above maximum range (${currentWordCount} > ${targetWordCount.max})`;
        }
      } else {
        // Strict mode
        if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage) {
          needsRevision = true;
          revisionReason = `below tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
        } else if (toleranceSettings.maximumAcceptablePercentage && 
                   percentageOfTarget > toleranceSettings.maximumAcceptablePercentage) {
          needsRevision = true;
          revisionReason = `above tolerance (${currentWordCount} words = ${percentageOfTarget.toFixed(1)}% of target)`;
        }
      }
      
      // If the content is outside acceptable range, try to revise it
      if (needsRevision) {
        console.warn(`Generated content needs revision: ${revisionReason}`);
        
        if (progressCallback) {
          progressCallback(`Content ${revisionReason}. Revising...`);
        }
        
        try {
          // FIRST REVISION ATTEMPT - Enhanced parameters for better word count adherence
          // Respect user's explicit toggle; only auto-enable elaborations if content is too short
          const shouldForceElaborations = formState.forceElaborationsExamples || currentWordCount < targetValue;

          const revisedContent = await reviseContentForWordCount(
            improvedCopy,
            targetWordCount,
            {
              ...formState,
              sessionId: actualSessionId,
              // DO NOT force prioritizeWordCount - respect user's checkbox setting
              forceElaborationsExamples: shouldForceElaborations
            },
            currentUser,
            progressCallback,
            undefined, // persona
            actualSessionId
          );
          
          // Update with the revised content
          improvedCopy = revisedContent;
          
          // Log the updated word count
          const revisedWordCount = extractWordCount(revisedContent);
          console.log(`First revision result: ${revisedWordCount} words (target: ${targetValue})`);
          
          // Check if second revision is needed
          const revisedPercentageOfTarget = (revisedWordCount / targetValue) * 100;
          const stillNeedsRevision = targetWordCount.min !== undefined && targetWordCount.max !== undefined
            ? (revisedWordCount < targetWordCount.min || revisedWordCount > targetWordCount.max)
            : (revisedPercentageOfTarget < toleranceSettings.minimumAcceptablePercentage ||
               (toleranceSettings.maximumAcceptablePercentage && revisedPercentageOfTarget > toleranceSettings.maximumAcceptablePercentage));
          
          if (stillNeedsRevision) {
            if (progressCallback) {
              progressCallback(`⚠ Content still outside acceptable range after first revision (${revisedWordCount}/${targetValue} words). The system will automatically attempt further refinements...`);
            }
            // Note: The reviseContentForWordCount function will handle second and emergency revisions internally
          }
          
        } catch (revisionError) {
          console.error('Error revising content for word count:', revisionError);
          if (progressCallback) {
            progressCallback(`❌ Error revising content: ${revisionError.message}. Using original content.`);
          }
          // Continue with original content if revision fails
        }
      } else if (progressCallback) {
        progressCallback(`✓ Content meets word count requirements: ${currentWordCount} words (${percentageOfTarget.toFixed(1)}% of target)`);
      }
    }

    // Generate multiple variants if requested
    let alternativeVersions: (string | StructuredCopyOutput)[] = [];
    if (formState.createVariants && formState.numberOfVariants && formState.numberOfVariants > 1) {
      const totalVariants = Math.min(formState.numberOfVariants, 10); // Cap at 10

      if (progressCallback) {
        progressCallback(`Generating ${totalVariants} variants...`);
      }

      // Add the first copy as variant 1
      alternativeVersions.push(improvedCopy);

      // Generate additional variants
      for (let i = 2; i <= totalVariants; i++) {
        if (progressCallback) {
          progressCallback(`Generating variant ${i} of ${totalVariants}...`);
        }

        try {
          // Make another API call with the same parameters but request a different variation
          const variantSystemPrompt = systemPrompt + `\n\nIMPORTANT: This is variant ${i}. Generate a UNIQUE variation that differs from previous versions while maintaining the same quality and parameters.`;
          const variantUserPrompt = userPrompt + `\n\nNote: Create a distinct variation - different phrasing, structure, or approach while meeting all requirements.`;

          // Prepare variant messages
          const variantMessages = [
            { role: 'system', content: variantSystemPrompt },
            { role: 'user', content: variantUserPrompt }
          ];

          // Make the API request for the variant
          const variantData = await makeApiRequestWithFallback(
            formState.model,
            variantMessages,
            temperature,
            maxTokens,
            undefined,
            currentUser?.email
          );

          // Extract the content from the response
          const variantContent = variantData.choices[0]?.message?.content;

          if (!variantContent) {
            throw new Error('No content in variant response');
          }

          alternativeVersions.push(variantContent);

          // Track token usage for variant
          const variantTokenUsage = variantData.usage?.total_tokens || 0;
          if (currentUser && variantTokenUsage > 0) {
            await trackTokenUsage(
              currentUser,
              variantTokenUsage,
              variantData.model_used,
              'generate_copy_variant',
              actualSessionId,
              0, // retryCount
              undefined, // trackingId
              extractTokenBreakdown(variantData.usage) // Phase 3: Token breakdown
            );
          }
        } catch (variantError) {
          console.error(`Error generating variant ${i}:`, variantError);
          if (progressCallback) {
            progressCallback(`Error generating variant ${i}, continuing...`);
          }
          // Continue with other variants even if one fails
        }
      }

      if (progressCallback) {
        progressCallback(`✓ Generated ${alternativeVersions.length} variants successfully`);
      }
    }

    // Create the result object with just the improved copy - no alternative or humanized versions initially
    const result: CopyResult = {
      improvedCopy,
      alternativeVersions: alternativeVersions.length > 0 ? alternativeVersions : undefined,
      promptUsed: userPrompt // Store for token calculation
    };
    
    // Generate SEO metadata if enabled
    if (formState.generateSeoMetadata) {
      if (progressCallback) {
        progressCallback('Generating SEO metadata...');
      }
      
      try {
        const seoMetadata = await generateSeoMetadata(improvedCopy, formState, currentUser, progressCallback, actualSessionId);
        result.seoMetadata = seoMetadata;
      } catch (seoError) {
        console.error('Error generating SEO metadata:', seoError);
        if (progressCallback) {
          progressCallback('Error generating SEO metadata, continuing...');
        }
      }
    }
    
    // Generate FAQ Schema if faqJson is selected in output structure
    if (formState.outputStructure && formState.outputStructure.some(element => 
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema from content...');
      }
      
      try {
        const { generateFaqSchemaFromText } = await import('./seoGeneration');
        const faqSchema = await generateFaqSchemaFromText(
          typeof improvedCopy === 'string' ? improvedCopy : JSON.stringify(improvedCopy),
          formState,
          currentUser,
          progressCallback,
          actualSessionId
        );
        result.faqSchema = faqSchema;
      } catch (faqError) {
        console.error('Error generating FAQ schema:', faqError);
        if (progressCallback) {
          progressCallback('Error generating FAQ schema, continuing...');
        }
      }
    }
    
    // Generate GEO score if enabled
    if (formState.generateGeoScore) {
      if (progressCallback) {
        progressCallback('Calculating GEO score...');
      }

      try {
        const geoScore = await calculateGeoScore(improvedCopy, formState, currentUser, progressCallback, actualSessionId);
        result.geoScore = geoScore;
      } catch (geoError) {
        console.error('Error calculating GEO score:', geoError);
        if (progressCallback) {
          progressCallback('Error calculating GEO score, continuing...');
        }
      }
    }

    // ============================================================================
    // LIGHT OUTPUT VALIDATION LAYER
    // Validate the result before saving to prevent broken/malformed outputs
    // ============================================================================
    if (progressCallback) {
      progressCallback('Validating generated output...');
    }

    const validationResult = validateCopyMakerResult(result, formState);

    if (!validationResult.valid) {
      console.warn('Copy Maker output validation failed:', validationResult.errors);

      if (progressCallback) {
        progressCallback('⚠️ Output validation failed. Attempting repair...');
      }

      // ONE automatic retry with repair prompt
      try {
        const repairPrompts = buildRepairPrompt({
          originalSystemPrompt: systemPrompt,
          originalUserPrompt: userPrompt,
          failedOutput: typeof improvedCopy === 'string' ? improvedCopy : JSON.stringify(improvedCopy),
          validationErrors: validationResult.errors
        });

        // Prepare repair messages
        const repairMessages = [
          { role: 'system', content: repairPrompts.system },
          { role: 'user', content: repairPrompts.user }
        ];

        // Make repair API request (reuse existing model + fallback logic)
        const repairData = await makeApiRequestWithFallback(
          formState.model,
          repairMessages,
          temperature,
          maxTokens,
          undefined,
          currentUser?.email
        );

        // Track token usage for repair attempt
        const repairTokenUsage = repairData.usage?.total_tokens || 0;
        if (currentUser && repairTokenUsage > 0) {
          await trackTokenUsage(
            currentUser,
            repairTokenUsage,
            repairData.model_used,
            'generate_copy_repair',
            actualSessionId,
            0, // retryCount
            undefined, // trackingId
            extractTokenBreakdown(repairData.usage)
          );
        }

        // Extract repaired content
        const repairedContent = repairData.choices[0]?.message?.content;

        if (repairedContent) {
          // Update result with repaired content
          result.improvedCopy = repairedContent;

          // Re-validate repaired output
          const repairedValidation = validateCopyMakerResult(result, formState);

          if (repairedValidation.valid) {
            console.log('✓ Repair successful, validation passed');
            if (progressCallback) {
              progressCallback('✓ Output repaired and validated successfully');
            }
            // Continue to session save (validation passed)
          } else {
            console.error('✗ Repair attempt still invalid:', repairedValidation.errors);
            if (progressCallback) {
              progressCallback('✗ Repair attempt failed validation');
            }

            // Add validation failure info to result for UI handling
            (result as any).validationFailed = true;
            (result as any).validationErrors = repairedValidation.errors;
            (result as any).rawFailedOutput = repairedContent;

            // Skip session save - return result with validation failure flag
            return result;
          }
        } else {
          throw new Error('No content in repair response');
        }
      } catch (repairError) {
        console.error('Error during repair attempt:', repairError);
        if (progressCallback) {
          progressCallback('✗ Repair attempt failed with error');
        }

        // Add validation failure info to result for UI handling
        (result as any).validationFailed = true;
        (result as any).validationErrors = validationResult.errors;
        (result as any).rawFailedOutput = typeof improvedCopy === 'string' ? improvedCopy : JSON.stringify(improvedCopy);

        // Skip session save - return result with validation failure flag
        return result;
      }
    } else {
      if (progressCallback) {
        progressCallback('✓ Output validation passed');
      }
    }
    // ============================================================================
    // END VALIDATION LAYER
    // ============================================================================

    // Save to database if session ID is provided
    if (actualSessionId) {
      try {
        const { data: sessionData, error: sessionError } = await saveCopySession(
          formState, 
          improvedCopy, 
          undefined, 
          actualSessionId
        );
        
        if (sessionError) {
          console.error('Error updating copy session:', sessionError);
        } else {
          console.log('Copy session updated:', sessionData?.id);
          // Now that session exists, we could track additional token usage with sessionId if needed
        }
      } catch (err) {
        console.error('Error saving copy session:', err);
        // Continue even if save fails
      }
    } else if (currentUser) {
      // Create a new session if user is logged in
      try {
        const { data: sessionData, error: sessionError } = await saveCopySession(
          formState,
          improvedCopy
        );
        
        if (sessionError) {
          console.error('Error saving new copy session:', sessionError);
        } else {
          console.log('New copy session created:', sessionData?.id);
          result.sessionId = sessionData?.id || actualSessionId;
          // Session now exists, could track additional token usage with sessionId if needed
        }
      } catch (err) {
        console.error('Error creating new copy session:', err);
        // Continue even if save fails
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating copy:', error);
    if (progressCallback) {
      progressCallback(`Error generating copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse labeled special instructions into structured items.
 * Detects blocks of the form "LABEL: instruction text" where LABEL is uppercase.
 * Returns each instruction with its label, full text, and optional count.
 */
function parseSpecialInstructions(specialInstructions: string): Array<{ label: string; instruction: string; count: number | null; quotedKeywords: string[]; positionalConstraint: string | null; isNewSection: boolean }> {
  const result: Array<{ label: string; instruction: string; count: number | null; quotedKeywords: string[]; positionalConstraint: string | null; isNewSection: boolean }> = [];

  // Split on blank lines to get separate instruction blocks
  const blocks = specialInstructions.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  // If there's only one block, try line-by-line splitting as fallback
  const items = blocks.length > 1 ? blocks : specialInstructions.split('\n').map(l => l.trim()).filter(Boolean);

  // Label pattern: starts with uppercase/accented chars, may contain digits/spaces/slashes
  const labelRegex = /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜA-Z0-9 \/\-\.]{1,60}):\s*([\s\S]*)/;

  for (const item of items) {
    const match = item.match(labelRegex);
    if (!match) continue;

    const label = match[1].trim();
    const instruction = match[2].trim().replace(/\n/g, ' ');

    if (!instruction) continue;

    const countMatch = instruction.match(/m[ií]nimo\s+(\d+)/i)
      || instruction.match(/minimum\s+(\d+)/i)
      || instruction.match(/al menos\s+(\d+)/i)
      || instruction.match(/at least\s+(\d+)/i)
      || instruction.match(/\b(\d+)\s+(?:preguntas?|questions?|items?|pasos?|steps?|secciones?|sections?|puntos?|points?)/i);

    const count = countMatch ? parseInt(countMatch[1], 10) : null;

    // Extract all quoted keywords/phrases (straight " U+0022, curly " U+201C, " U+201D, or single ')
    const quotedKeywords: string[] = [];
    const quotedMatches = instruction.matchAll(/[\u0022\u201C\u201D]([^\u0022\u201C\u201D]{1,80})[\u0022\u201C\u201D]|'([^']{1,80})'/g);
    for (const m of quotedMatches) {
      const kw = (m[1] || m[2] || '').trim();
      if (kw) quotedKeywords.push(kw);
    }

    // Detect positional constraint: first sentence(s), first N words, opening, etc.
    let positionalConstraint: string | null = null;
    if (/primer[ao]s?\s+\d+\s+palabras|first\s+\d+\s+words/i.test(instruction)) {
      const numMatch = instruction.match(/primer[ao]s?\s+(\d+)\s+palabras|first\s+(\d+)\s+words/i);
      const num = numMatch ? (numMatch[1] || numMatch[2]) : null;
      positionalConstraint = num ? `first ${num} words` : 'opening section';
    } else if (/primeras?\s+dos\s+oraciones|primeras?\s+dos\s+frases|first\s+two\s+sentences/i.test(instruction)) {
      positionalConstraint = 'first two sentences';
    } else if (/primer[ao]s?\s+oración|primera\s+frase|first\s+sentence/i.test(instruction)) {
      positionalConstraint = 'first sentence';
    } else if (/abre?\s+con|opening|inicio|comienzo/i.test(instruction)) {
      positionalConstraint = 'opening';
    }

    // Detect if this instruction requires CREATING a new section (not just modifying existing)
    // Verbs like "escribe", "crea", "añade", "genera", "redacta", "write", "create", "add", "generate"
    const isNewSection = /^\s*(escribe|crea|añade|agrega|genera|redacta|incluye|write|create|add|generate|include)\b/i.test(instruction);

    result.push({ label, instruction, count, quotedKeywords, positionalConstraint, isNewSection });
  }

  return result;
}

/**
 * Build the system prompt based on form state
 */
export function buildSystemPrompt(formState: FormState, targetWordCountInfo: { target: number; min?: number; max?: number } | number, brandVoice?: BrandVoice | null): string {
  const targetWordCount = typeof targetWordCountInfo === 'number' ? targetWordCountInfo : targetWordCountInfo.target;
  const minWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.min : undefined;
  const maxWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.max : undefined;
  const isShortContent = targetWordCount <= 150;
  
  let systemPrompt = `You are an expert copywriter with years of experience in creating persuasive, engaging, and effective marketing copy.`;
  
  // Add CRITICAL TL;DR formatting requirement at the very beginning if enabled
  if (formState.enhanceForGEO && formState.addTldrSummary) {
    systemPrompt = `ABSOLUTE MANDATORY REQUIREMENT - TL;DR SUMMARY:

Your response MUST begin with "TL;DR:" followed by exactly one concise sentence that directly answers the main question.

EXACT FORMAT REQUIRED:
TL;DR: [One clear sentence that directly answers what the user wants to know.]

[blank line]

[Rest of your marketing copy content...]

CRITICAL TL;DR RULES:
- Must be the first 3 characters: "TL;" 
- Only ONE sentence in the TL;DR
- Answer the core question directly
- Use natural ${formState.language} language
- No hype words or marketing fluff
- Follow with blank line, then main content

FAILURE TO START WITH "TL;DR:" = COMPLETE REJECTION

---

You are an expert copywriter with years of experience in creating persuasive, engaging, and effective marketing copy.`;
  }
  
  systemPrompt += `\n\nYour task is to create new marketing copy based on the provided information.

The copy should be in ${formState.language} language with a ${formState.tone} tone.`;

  // Word count instructions based on enforcement mode
  if (formState.aiDecideWordCount) {
    // No word count restriction - AI decides optimal length
    systemPrompt += `\n\nWORD COUNT: Unrestricted - focus on quality and completeness.
Write as much or as little as needed to effectively communicate the message and meet all other requirements.
Prioritize content quality over hitting a specific word count target.`;
  } else if (formState.prioritizeWordCount) {
    // Strict mode: Use user's configured tolerance (default ±2%)
    const tolerance = formState.wordCountTolerancePercentage || 2;
    const minWords = Math.round(targetWordCount * (100 - tolerance) / 100);
    const maxWords = Math.round(targetWordCount * (100 + tolerance) / 100);

    systemPrompt += `\n\nSTRICT WORD COUNT REQUIREMENT:
Target: ${targetWordCount} words
Acceptable range: ${minWords}-${maxWords} words (±${tolerance}%)

YOU MUST STAY WITHIN THIS RANGE. Content outside ${minWords}-${maxWords} words will be REJECTED.

Before you finish, count your words. If you're outside the acceptable range, revise immediately:
- If below ${minWords} words: Add essential details, examples, or elaboration
- If above ${maxWords} words: Cut unnecessary words, tighten phrasing, remove redundancy

DO NOT submit content outside the ${minWords}-${maxWords} word range.`;
  } else {
    // Flexible mode: Use ±30% tolerance for quality over precision
    const minWords = Math.round(targetWordCount * 0.70);
    const maxWords = Math.round(targetWordCount * 1.30);

    systemPrompt += `\n\nWORD COUNT GUIDANCE:
Target: approximately ${targetWordCount} words
Acceptable range: ${minWords}-${maxWords} words (±30% tolerance)

Aim for the target, but prioritize content quality and completeness over strict word count adherence.
It's better to deliver complete, well-crafted content than to artificially constrain or pad to hit an exact number.`;
  }

  // Add tab-specific instructions
  if (formState.tab === 'create') {
    systemPrompt += `\n\nYou will create compelling new marketing copy based on the business description provided. Your copy should effectively communicate the unique value proposition and connect with the target audience at an emotional level.`;
  } else {
    systemPrompt += `\n\nYou will improve the existing marketing copy while maintaining its core message. Your improvements should enhance clarity, persuasiveness, engagement, and strategic alignment while preserving the essential brand identity.`;
  }

  // SPECIAL INSTRUCTIONS — injected immediately after core task, at highest priority
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\n=== MANDATORY SPECIAL INSTRUCTIONS ===
The following instructions are HIGHEST PRIORITY and OVERRIDE any conflicting defaults. You MUST follow every instruction below without exception:

${formState.specialInstructions.trim()}

These requirements are non-negotiable and take precedence over general style guidance, word count defaults, and structural suggestions.
=== END MANDATORY SPECIAL INSTRUCTIONS ===`;

    // Universal structural injection: every labeled instruction becomes a required element.
    // This ensures the model PLANS its full output structure before writing the first word.
    const parsedInstructions = parseSpecialInstructions(formState.specialInstructions);
    if (parsedInstructions.length > 0) {
      const requirementLines = parsedInstructions.map(item => {
        const countNote = item.count ? ` (minimum ${item.count} items required)` : '';
        const shortInstruction = item.instruction.length > 130
          ? item.instruction.slice(0, 130) + '...'
          : item.instruction;
        let line = `- ${item.label}${countNote}: ${shortInstruction}`;
        if (item.quotedKeywords.length > 0 && item.positionalConstraint) {
          const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
          line += ` ← CRITICAL: the exact keyword ${kwList} MUST appear in the ${item.positionalConstraint}. Place it before writing anything else in that section.`;
        } else if (item.quotedKeywords.length > 0) {
          const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
          line += ` ← CRITICAL: the exact keyword ${kwList} must appear verbatim in your output.`;
        }
        if (item.isNewSection) {
          line += ` ← NEW SECTION: this section is absent from the original — you must CREATE and APPEND it.`;
        }
        if (item.count && item.isNewSection) {
          line += ` Write exactly ${item.count} or more items — no fewer.`;
        }
        return line;
      }).join('\n');

      systemPrompt += `\n\n=== REQUIRED ELEMENTS — ALL MUST BE PRESENT IN YOUR OUTPUT ===
Plan your response so that EVERY item below is addressed before you write the final CTA:

${requirementLines}

Do NOT write the final CTA until every item above has been addressed. If you reach a natural page ending and any element is missing — write it first, then close with the CTA.
=== END REQUIRED ELEMENTS ===`;
    }
  }

  systemPrompt += `\n\nOUTPUT REQUIREMENTS:
  - Your response must contain ONLY the generated marketing copy
  - Do NOT include any introductory text, concluding remarks, or explanations
  - Do NOT include meta-commentary about how the copy meets requirements
  - Output ONLY the requested marketing content and nothing else`;
  
  systemPrompt += `\n\nCRITICAL: DO NOT include any SEO metadata in your content output:
- DO NOT include URL slugs, meta descriptions, or Open Graph tags
- DO NOT include H1, H2, or H3 headings as metadata elements
- DO NOT add any SEO-specific information to the content body
- Focus ONLY on creating compelling marketing copy content
- SEO metadata is handled separately and should NOT be part of your content`;
  
  // Add tone level instructions if specified
  if (formState.toneLevel !== undefined) {
    if (formState.toneLevel < 25) {
      systemPrompt += `\n\nUse a very formal tone that is appropriate for academic or corporate contexts.`;
    } else if (formState.toneLevel < 50) {
      systemPrompt += `\n\nUse a moderately formal tone that is professional but approachable.`;
    } else if (formState.toneLevel < 75) {
      systemPrompt += `\n\nUse a conversational tone that balances professionalism with approachability.`;
    } else {
      systemPrompt += `\n\nUse a casual, friendly tone that feels like a conversation with a trusted friend.`;
    }
  }
  
  // Add writing style instructions if specified
  if (formState.preferredWritingStyle) {
    systemPrompt += `\n\nPreferred writing style: ${formState.preferredWritingStyle}`;
  }
  
  // Add language style constraints if specified
  if (formState.languageStyleConstraints && formState.languageStyleConstraints.length > 0) {
    systemPrompt += `\n\nLanguage style constraints to follow:`;
    formState.languageStyleConstraints.forEach(constraint => {
      systemPrompt += `\n- ${constraint}`;
    });
  }

  // Add brand voice instructions if specified
  if (brandVoice) {
    systemPrompt += `\n\n=== BRAND VOICE: ${brandVoice.name} ===`;

    if (brandVoice.description) {
      systemPrompt += `\n${brandVoice.description}`;
    }

    if (brandVoice.personality_traits && brandVoice.personality_traits.length > 0) {
      systemPrompt += `\n\nPersonality Traits:`;
      brandVoice.personality_traits.forEach(trait => {
        systemPrompt += `\n- ${trait}`;
      });
    }

    if (brandVoice.tone_style) {
      systemPrompt += `\n\nTone Style: ${brandVoice.tone_style}`;
    }

    if (brandVoice.sentence_style) {
      systemPrompt += `\nSentence Style: ${brandVoice.sentence_style}`;
    }

    if (brandVoice.preferred_vocabulary && brandVoice.preferred_vocabulary.length > 0) {
      systemPrompt += `\n\nPreferred Vocabulary: ${brandVoice.preferred_vocabulary.join(', ')}`;
    }

    if (brandVoice.forbidden_terms && brandVoice.forbidden_terms.length > 0) {
      systemPrompt += `\n\nForbidden Terms (DO NOT USE): ${brandVoice.forbidden_terms.join(', ')}`;
    }

    if (brandVoice.cta_style) {
      systemPrompt += `\n\nCall-to-Action Style: ${brandVoice.cta_style}`;
    }

    if (brandVoice.punctuation_rules) {
      systemPrompt += `\n\nPunctuation Rules:`;
      if (brandVoice.punctuation_rules.use_oxford_comma !== undefined) {
        systemPrompt += `\n- Oxford comma: ${brandVoice.punctuation_rules.use_oxford_comma ? 'Required' : 'Not used'}`;
      }
      if (brandVoice.punctuation_rules.prefer_short_sentences) {
        systemPrompt += `\n- Prefer short, punchy sentences`;
        if (brandVoice.punctuation_rules.max_sentence_length) {
          systemPrompt += ` (max ${brandVoice.punctuation_rules.max_sentence_length} words)`;
        }
      }
      if (brandVoice.punctuation_rules.use_contractions !== undefined) {
        systemPrompt += `\n- Contractions: ${brandVoice.punctuation_rules.use_contractions ? 'Use liberally' : 'Avoid'}`;
      }
      if (brandVoice.punctuation_rules.exclamation_frequency) {
        systemPrompt += `\n- Exclamation marks: ${brandVoice.punctuation_rules.exclamation_frequency}`;
      }
    }

    // Add advanced style controls if specified
    if (brandVoice.advanced_style && Object.keys(brandVoice.advanced_style).length > 0) {
      systemPrompt += `\n\n=== ADVANCED STYLE CONTROLS ===`;

      if (brandVoice.advanced_style.sentence_length) {
        systemPrompt += `\nSentence Length: ${brandVoice.advanced_style.sentence_length}`;
      }

      if (brandVoice.advanced_style.rhythm) {
        systemPrompt += `\nRhythm & Cadence: ${brandVoice.advanced_style.rhythm}`;
      }

      if (brandVoice.advanced_style.formality !== undefined) {
        systemPrompt += `\nFormality Level: ${brandVoice.advanced_style.formality}/5 (1=very casual, 5=very formal)`;
      }

      if (brandVoice.advanced_style.emotional_tone && brandVoice.advanced_style.emotional_tone.length > 0) {
        systemPrompt += `\nEmotional Tone: ${brandVoice.advanced_style.emotional_tone.join(', ')}`;
      }

      if (brandVoice.advanced_style.persona) {
        systemPrompt += `\nBrand Persona: ${brandVoice.advanced_style.persona}`;
      }

      if (brandVoice.advanced_style.pov) {
        systemPrompt += `\nPoint of View: ${brandVoice.advanced_style.pov.replace('_', ' ')}`;
      }

      if (brandVoice.advanced_style.figurative_level) {
        systemPrompt += `\nFigurative Language: ${brandVoice.advanced_style.figurative_level}`;
      }

      if (brandVoice.advanced_style.detail_depth) {
        systemPrompt += `\nLevel of Detail: ${brandVoice.advanced_style.detail_depth}`;
      }

      if (brandVoice.advanced_style.vocabulary_complexity) {
        systemPrompt += `\nVocabulary Complexity: ${brandVoice.advanced_style.vocabulary_complexity.replace('_', ' ')}`;
      }

      if (brandVoice.advanced_style.content_structure_rules) {
        const rules = brandVoice.advanced_style.content_structure_rules;
        if (Object.keys(rules).length > 0) {
          systemPrompt += `\nContent Structure Rules:`;
          if (rules.short_paragraphs) systemPrompt += `\n- Use short paragraphs`;
          if (rules.use_bullets) systemPrompt += `\n- Use bullet lists when appropriate`;
          if (rules.questions_allowed !== undefined) {
            systemPrompt += `\n- Rhetorical questions: ${rules.questions_allowed ? 'allowed' : 'avoid'}`;
          }
        }
      }

      if (brandVoice.advanced_style.allowed_elements && brandVoice.advanced_style.allowed_elements.length > 0) {
        systemPrompt += `\nAllowed Elements: ${brandVoice.advanced_style.allowed_elements.join(', ')}`;
      }

      if (brandVoice.advanced_style.forbidden_elements && brandVoice.advanced_style.forbidden_elements.length > 0) {
        systemPrompt += `\nForbidden Elements (DO NOT USE): ${brandVoice.advanced_style.forbidden_elements.join(', ')}`;
      }

      systemPrompt += `\n\nRespect these advanced style constraints strictly when generating copy, unless explicitly overridden by specific user instructions in the form.`;
    }

    systemPrompt += `\n\nBRAND VOICE HIERARCHY:
This brand voice provides the baseline framework and default style for the copy.
However, when specific form inputs for this session (tone, writing style, special instructions, etc.) conflict with brand voice settings, the form inputs take precedence.
Think of brand voice as the foundation, and form inputs as session-specific overrides.`;
  }

  // Add section-specific instructions
  if (formState.section) {
    systemPrompt += `\n\nThis copy is for the "${formState.section}" section.`;
    
    // Add section-specific guidance
    switch (formState.section) {
      case 'Hero Section':
        systemPrompt += ` Focus on creating an attention-grabbing headline and compelling value proposition that immediately communicates the core benefit and establishes an emotional connection.`;
        break;
      case 'Benefits':
        systemPrompt += ` Focus on clearly articulating the key benefits for the customer, with persuasive language that transforms features into meaningful advantages. Use benefit-driven headlines and supportive evidence.`;
        break;
      case 'Features':
        systemPrompt += ` Describe the key features and how they solve specific problems for the user. Focus on the "so what" of each feature - explaining not just what it does, but why it matters to the user.`;
        break;
      case 'Services':
        systemPrompt += ` Outline the services offered with a focus on value delivered and outcomes achieved. Highlight differentiation factors and expertise.`;
        break;
      case 'About':
        systemPrompt += ` Create an engaging narrative about the business, its mission, values, and unique story. Connect the organization's purpose to customer needs.`;
        break;
      case 'Testimonials':
        systemPrompt += ` Frame testimonials effectively to maximize social proof, highlighting specific results and emotional impact. Create contextual introductions that enhance credibility.`;
        break;
      case 'FAQ':
        systemPrompt += ` Create clear questions and informative answers that address common concerns while subtly reinforcing key selling points and overcoming objections.`;
        break;
      case 'Full Copy':
        systemPrompt += ` Create a comprehensive marketing piece that covers all key aspects: problem identification, solution presentation, benefits explanation, feature details, and a compelling call to action.`;
        break;
    }
  }
  
  // Add instructions for structured output if requested
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    // Check if Q&A format is requested
    const hasQAFormat = formState.outputStructure.some(element =>
      element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
    );

    if (hasQAFormat) {
      systemPrompt += `\n\nFormat your response as structured markdown with clear headings and sections.

CRITICAL Q&A FORMATTING REQUIREMENTS:
- When creating Q&A content, each question MUST be a separate section with a ## heading
- Each question should be formatted as a clear, standalone question ending with a question mark
- Each answer should be a comprehensive, well-formatted response in paragraph form
- NEVER run questions and answers together in continuous text
- ALWAYS separate each Q&A pair clearly
- Each question should be specific and actionable
- Each answer should be informative and complete`;
    } else {
      systemPrompt += `\n\nFormat your response as natural flowing text with markdown headings. Use # or ## for section headings. DO NOT output JSON.`;
    }

    // Add section title generation instructions
    if (formState.includeSectionTitles !== false) {
      systemPrompt += `\n\nIMPORTANT - SECTION TITLE GENERATION:
For each section in the structured output, you MUST generate a compelling, descriptive title (H1 or H2 style) that:
- Clearly summarizes the content of that specific section
- Is engaging and draws the reader in
- Matches the tone and style of the overall copy
- Is concise but informative (typically 3-8 words)
- Uses proper capitalization (Title Case)

Example structure:
Section 1 Title: "Transform Your Business with AI-Powered Solutions"
Section 1 Content: [your marketing copy here]

Section 2 Title: "Why Industry Leaders Choose Our Platform"
Section 2 Content: [your marketing copy here]

These titles should feel natural and professional, enhancing the overall presentation of the content.`;
    }
    
    // Add word count allocations if specified
    const hasWordCountAllocations = formState.outputStructure.some(element => element.wordCount !== null && element.wordCount !== undefined);
    
    if (hasWordCountAllocations) {
      systemPrompt += ` Follow these specific word count allocations for each section:`;
      formState.outputStructure.forEach(element => {
        if (element.wordCount) {
          systemPrompt += `\n- "${element.label || element.value}": ${element.wordCount} words`;
        }
      });
      
      systemPrompt += `\n\nEnsure each section meets its target word count. If one is underdeveloped, expand that section until it reaches the specified length.`;
    }
  }
  
  // Add keyword instructions if keywords are provided
  if (formState.keywords) {
    systemPrompt += `\n\nIMPORTANT: You MUST naturally integrate all of these keywords throughout the copy: ${formState.keywords}. Keywords should be placed strategically where they enhance meaning and SEO value, not forced in ways that disrupt readability.`;
  }
  
  // Add elaboration instructions if needed
  if (formState.forceElaborationsExamples) {
    systemPrompt += `\n\nIMPORTANT: You MUST provide detailed explanations, comprehensive examples, case studies, and in-depth elaboration throughout the copy. Expand on every point with supporting evidence, real-world applications, and specific details to reach the target word count.`;
    console.log('[copyGeneration] forceElaborationsExamples=true — elaboration directive injected into system prompt');
  } else {
    console.log('[copyGeneration] forceElaborationsExamples=false — no elaboration directive');
  }

  // Add GEO enhancement instructions if enabled
  if (formState.enhanceForGEO) {
    systemPrompt += `\n\nGEO TARGETING ENABLED: Adapt the output to improve visibility in AI-generated answers for location-based queries.`;
    
      if (formState.geoRegions && formState.geoRegions.trim()) {
        systemPrompt += `\n\nThe user specified target countries or regions: "${formState.geoRegions}".
Optimize the content for visibility in AI assistants (ChatGPT, Claude, Gemini) targeting the specified regions: ${formState.geoRegions}.
• Include regional relevance, localized phrasing, or examples where helpful
• Ensure the output appeals to audiences in those areas
• Naturally reference these regions in examples, testimonials, or CTAs where appropriate
• Use culturally relevant terminology and concepts for these regions`;
      } else if (formState.location && formState.location.trim()) {
        systemPrompt += `\n\nThe user specified a target location or region: "${formState.location}".
• Naturally include this location in the content, such as:
  – "Serving businesses in ${formState.location}"
  – "Helping companies across ${formState.location} thrive"
• Reference the region in examples, testimonials, or CTAs
• Maintain a natural tone—avoid overstuffing location terms`;
    } else {
      systemPrompt += `\n\nThe user did not specify a location, but their business appears to serve a global audience.
• Focus on making content discoverable and quotable without adding geographical references
• Use language that appeals to a broad audience without mentioning specific locations, regions, or countries
• Keep the messaging universal and location-neutral while maintaining GEO optimization benefits`;
    }
    
    // Add TL;DR summary instructions if enabled
    if (formState.enhanceForGEO && formState.addTldrSummary) {
      systemPrompt += `\n\nREMINDER: You have already been instructed to place a TL;DR summary at the absolute beginning of your output. This is critical for GEO optimization.`;
    }
  }
  
  // Add priority instructions for strict word count adherence
  if (formState.prioritizeWordCount && !formState.aiDecideWordCount) {
    const tolerance = 10;
    const minWords = Math.round(targetWordCount * (100 - tolerance) / 100);
    const maxWords = Math.round(targetWordCount * (100 + tolerance) / 100);

    systemPrompt += `\n\nSTRICT WORD COUNT MODE ENABLED:
- You MUST create content between ${minWords}-${maxWords} words
- Target: ${targetWordCount} words (±${tolerance}% tolerance)
- Count every word carefully before submitting
- Content outside this range will be automatically revised`;
  }

  // Add guidance for creating a comprehensive marketing piece
  systemPrompt += `\n\nYour copy should:
  1. Be persuasive, clear, and engaging with a logical flow that guides the reader
  2. Use proper grammar and spelling appropriate for the language (${formState.language})
  3. Create fresh, original copy based on the provided information
  4. Highlight unique selling points and benefits effectively
  5. Include a compelling call to action where appropriate
  6. Speak directly to the audience's needs and desires
  7. Be scannable with appropriate headings, subheadings, and paragraph breaks
  8. Convey professionalism and authority in the subject matter

The final output must meet or exceed the target word count of ${targetWordCount} words. Do not stop short. Expand all sections with meaningful content to reach this goal.`;

  return systemPrompt;
}

/**
 * Build the user prompt based on form state
 */
export function buildUserPrompt(formState: FormState, targetWordCount: number): string {
  let userPrompt = '';
  
  // Different prompts based on tab (create/improve)
  // Note: In the current UI, both businessDescription and originalCopy use the same field
  // The businessDescription field serves as a unified input for both create and improve modes
  const contentToUse = formState.businessDescription || formState.originalCopy || '';

  if (formState.tab === 'create') {
    userPrompt = `Create compelling marketing copy based on this business description:

"""
${contentToUse}
"""`;
  } else {
    userPrompt = `Improve this existing marketing copy:

"""
${contentToUse}
"""`;
  }
  
  // Re-assert special instructions in user prompt for maximum LLM attention
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    userPrompt += `\n\n⚠ MANDATORY REQUIREMENTS — READ BEFORE WRITING (highest priority, override all defaults):
${formState.specialInstructions.trim()}

Every single requirement above must be present in your output. Do not begin writing until you have read and understood all requirements above.`;

    // Universal pre-writing checklist: every labeled instruction becomes a checkbox.
    // This frames the model's full output plan before it writes the first word.
    const parsedForChecklist = parseSpecialInstructions(formState.specialInstructions);
    if (parsedForChecklist.length > 0) {
      const checklistItems = parsedForChecklist.map(item => {
        const countNote = item.count ? ` — at least ${item.count} items` : '';
        let entry = `[ ] ${item.label}${countNote}`;
        if (item.quotedKeywords.length > 0 && item.positionalConstraint) {
          const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
          entry += ` — exact keyword ${kwList} must be in the ${item.positionalConstraint}`;
        } else if (item.quotedKeywords.length > 0) {
          const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
          entry += ` — exact keyword ${kwList} must appear verbatim`;
        }
        if (item.isNewSection && item.count) {
          entry += ` — NEW SECTION, must contain at least ${item.count} items, append to output`;
        } else if (item.isNewSection) {
          entry += ` — NEW SECTION, must be created and appended`;
        }
        return entry;
      }).join('\n');

      userPrompt += `\n\n⛔ REQUIRED ELEMENTS CHECKLIST — Your output is INCOMPLETE without every item below. Check each off mentally before writing the final CTA:

${checklistItems}

DO NOT write the closing CTA until every item above is satisfied in your output.`;
    }
  }

  // Add key information
  userPrompt += `\n\nKey information:`;
  if (formState.targetAudience) userPrompt += `\n- Target audience: ${formState.targetAudience}`;
  if (formState.keyMessage) userPrompt += `\n- Key message: ${formState.keyMessage}`;
  if (formState.callToAction) userPrompt += `\n- Call to action: ${formState.callToAction}`;
  if (formState.desiredEmotion) userPrompt += `\n- Desired emotion: ${formState.desiredEmotion}`;
  if (formState.brandValues) userPrompt += `\n- Brand values: ${formState.brandValues}`;
  if (formState.keywords) userPrompt += `\n- Keywords: ${formState.keywords}`;
  if (formState.context) userPrompt += `\n- Context: ${formState.context}`;
  if (formState.industryNiche) userPrompt += `\n- Industry/Niche: ${formState.industryNiche}`;
  if (formState.productServiceName) userPrompt += `\n- Product/Service Name: ${formState.productServiceName}`;
  if (formState.readerFunnelStage) userPrompt += `\n- Reader's Stage in Funnel: ${formState.readerFunnelStage}`;
  if (formState.geoRegions) userPrompt += `\n- Target Countries/Regions: ${formState.geoRegions}`;
  
  // Add tone and language
  userPrompt += `\n- Tone: ${formState.tone}`;
  userPrompt += `\n- Language: ${formState.language}`;
  
  // Add competitor information if available
  if (formState.competitorUrls && formState.competitorUrls.some(url => url.trim().length > 0)) {
    userPrompt += `\n\nCompetitor URLs to consider for differentiation:`;
    formState.competitorUrls.forEach(url => {
      if (url.trim()) {
        userPrompt += `\n- ${url.trim()}`;
      }
    });
  }
  
  if (formState.competitorCopyText && formState.competitorCopyText.trim()) {
    userPrompt += `\n\nCompetitor copy to outperform:
"""
${formState.competitorCopyText.trim()}
"""`;
  }
  
  // Add pain points if available
  if (formState.targetAudiencePainPoints) {
    // Handle both array and string formats
    const painPointsText = Array.isArray(formState.targetAudiencePainPoints)
      ? formState.targetAudiencePainPoints.join(', ')
      : formState.targetAudiencePainPoints;

    if (painPointsText && painPointsText.trim()) {
      userPrompt += `\n\nTarget audience pain points to address:
"""
${painPointsText.trim()}
"""`;
    }
  }
  
  // Add TL;DR reminder if enabled
  if (formState.enhanceForGEO && formState.addTldrSummary) {
    userPrompt += `\n\nCRITICAL REMINDER: Your response MUST start with "TL;DR: [one sentence summary]" followed by a blank line, then your main content. This is absolutely mandatory and cannot be skipped.`;
  }

  // Add specific structure guidance if output structure is specified
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    // Check if FAQ (JSON) format is requested
    const hasFaqJsonFormat = formState.outputStructure.some(element =>
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    );

    // Check if Q&A format is requested
    const hasQAFormat = formState.outputStructure.some(element =>
      element.value === 'qaFormat' || element.label?.toLowerCase().includes('q&a')
    );

    if (hasFaqJsonFormat) {
      userPrompt += `\n\nNote: FAQ JSON Schema will be automatically generated from your Q&A content.`;
    }

    if (hasQAFormat) {
      userPrompt += `\n\nStructure your content as Q&A format with clear questions and answers:
- Each question should be on its own line, formatted as a complete question ending with a question mark
- Follow each question with a detailed answer paragraph
- Questions should cover different aspects of the topic
- Answers should be informative, specific, and include examples where helpful
- Use clear separation between different Q&A pairs`;
    }

    userPrompt += `\n\nInclude these specific sections in the exact order, formatted as plain text with headings:`;
    formState.outputStructure.forEach((element, index) => {
      userPrompt += `\n${index + 1}. ${element.label || element.value}${element.wordCount ? ` (target: ${element.wordCount} words)` : ''}`;
    });

    userPrompt += `\n\nCRITICAL OUTPUT FORMAT INSTRUCTIONS:
- DO NOT use JSON format
- DO NOT create a JSON object with "headline" and "sections" keys
- Write your response as natural flowing text with markdown headings
- Use # for main headings`;

    // Add section title generation instructions if enabled
    if (formState.includeSectionTitles !== false) {
      userPrompt += `
- For EACH section, create a compelling, descriptive heading that summarizes that section's content
- DO NOT just use the section names (Hero, Features, etc.) - create engaging, benefit-driven titles
- Section titles should be 3-8 words, use Title Case, and match the overall tone
- Example format:

# Transform Your Business Challenges Into Opportunities
[Your content for the first section (${formState.outputStructure[0]?.label || formState.outputStructure[0]?.value})]

# Our Proven Solution That Delivers Real Results
[Your content for the second section (${formState.outputStructure[1]?.label || formState.outputStructure[1]?.value || 'next section'})]

Notice how the titles are DIFFERENT from the section names - they're compelling marketing copy!`;
    } else {
      userPrompt += `
- Use the section names as headings
- Example format:

# ${formState.outputStructure[0]?.label || formState.outputStructure[0]?.value || 'Section Title'}
[Your content here as natural paragraphs...]

# ${formState.outputStructure[1]?.label || formState.outputStructure[1]?.value || 'Next Section'}
[Your content here as natural paragraphs...]`;
    }

    userPrompt += `

Ensure each section meets its target word count. If a section is underdeveloped, expand it with more examples, details, or elaboration.`;
  } else {
    // Add term exclusion instructions if specified
    // Always use plain text format for consistency when copying prompts to other AI tools
    userPrompt += `\n\nProvide your response as natural flowing text with appropriate paragraphs and formatting.`;

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
  }
  
  // Add reminder about word count based on enforcement mode
  if (formState.aiDecideWordCount) {
    // No restriction mode - AI decides
    userPrompt += `\n\n✨ WORD COUNT: Unrestricted
Focus on quality and completeness. Write as much or as little as needed to effectively deliver the message.
No word count constraints apply - prioritize content excellence over length.`;
  } else if (formState.prioritizeWordCount) {
    // Strict mode - ±10% tolerance
    const tolerance = 10;
    const minWords = Math.round(targetWordCount * (100 - tolerance) / 100);
    const maxWords = Math.round(targetWordCount * (100 + tolerance) / 100);

    userPrompt += `\n\n⚠️ STRICT WORD COUNT REQUIREMENT ⚠️
You MUST generate between ${minWords}-${maxWords} words (target: ${targetWordCount} words, ±${tolerance}%).
Content outside this range will be AUTOMATICALLY REJECTED and revised.
Count your words carefully before submitting.`;
  } else {
    // Flexible mode - ±30% tolerance, quality over precision
    const minWords = Math.round(targetWordCount * 0.70);
    const maxWords = Math.round(targetWordCount * 1.30);

    userPrompt += `\n\n📝 WORD COUNT GUIDANCE 📝
Target: approximately ${targetWordCount} words
Acceptable range: ${minWords}-${maxWords} words (±30% tolerance)

Prioritize content quality and completeness. The word count is a guideline, not a strict requirement.

IMPORTANT: Never cut off mid-sentence or leave content incomplete. It's better to exceed the target than to deliver incomplete thoughts.

If you're close to the target but need a few more words to complete a section properly, go ahead and finish it.`;
  }

  // Completeness gate — forces the model to verify ALL special instruction requirements before stopping.
  // Uses the universal label parser: one verification item per labeled instruction.
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    const si = formState.specialInstructions.toLowerCase();
    const detectedChecks: string[] = [];

    // Universal check: one verification item per labeled instruction
    const parsedForCompletion = parseSpecialInstructions(formState.specialInstructions);
    for (const item of parsedForCompletion) {
      const countNote = item.count ? ` with at least ${item.count} items` : '';
      const shortInstruction = item.instruction.length > 150
        ? item.instruction.slice(0, 150) + '...'
        : item.instruction;

      // Build a precise positional check if keywords + position were both detected
      if (item.quotedKeywords.length > 0 && item.positionalConstraint) {
        const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
        detectedChecks.push(
          `⛔ ${item.label}${countNote} — KEYWORD POSITION CHECK: The exact word/phrase ${kwList} MUST appear in the ${item.positionalConstraint} of your output. Read your own first sentences back now and confirm character by character. If the keyword is missing or placed too late — rewrite those sentences NOW before continuing.`
        );
        // Also add the structural part of the instruction if there is one beyond the keyword
        // q = quote chars for use inside character classes; qc = full class for matching
        const q = `\u0022\u201C\u201D`;
        const structuralPart = item.instruction
          .replace(new RegExp(`incluyendo\\s+la\\s+keyword\\s+[${q}][^${q}]+[${q}]`, 'gi'), '')
          .replace(new RegExp(`including\\s+the\\s+keyword\\s+[${q}][^${q}]+[${q}]`, 'gi'), '')
          .replace(new RegExp(`incluir\\s+keyword\\s*:\\s*[${q}][^${q}]+[${q}]`, 'gi'), '')
          .trim();
        if (structuralPart.length > 10) {
          detectedChecks.push(
            `⛔ ${item.label} — STRUCTURAL CHECK: "${structuralPart}". Confirm your output satisfies this structural rule.`
          );
        }
      } else if (item.quotedKeywords.length > 0) {
        const kwList = item.quotedKeywords.map(k => `"${k}"`).join(', ');
        detectedChecks.push(
          `⛔ ${item.label}${countNote} (MANDATORY — STOP AND CHECK): Verify that the exact word/phrase ${kwList} appears verbatim in your output. Requirement: "${shortInstruction}". If it does not appear exactly — fix it NOW.`
        );
      } else if (item.isNewSection && item.count) {
        detectedChecks.push(
          `⛔ ${item.label} — NEW SECTION REQUIRED (COUNT: at least ${item.count} items): This section does NOT exist in the original — you MUST append it to your output. Scroll to the end of what you have written. If a "${item.label}" section with at least ${item.count} items is not present — write it NOW and append it before stopping. This is a hard failure if missing.`
        );
      } else if (item.isNewSection) {
        detectedChecks.push(
          `⛔ ${item.label} — NEW SECTION REQUIRED: This section does NOT exist in the original copy — you MUST create it and append it to your output. If you cannot see a "${item.label}" section in what you have written — write it NOW. Stopping without it is a failure.`
        );
      } else if (item.count) {
        detectedChecks.push(
          `⛔ ${item.label} — COUNT CHECK (at least ${item.count} items): Count the actual items you wrote for this section. If fewer than ${item.count} — add the missing ones NOW before stopping. Requirement: "${shortInstruction}".`
        );
      } else {
        detectedChecks.push(
          `⛔ ${item.label}${countNote} (MANDATORY — STOP AND CHECK): Has this requirement been fully satisfied in your output? Requirement: "${shortInstruction}". If NO — address it NOW before writing the closing CTA.`
        );
      }
    }

    // Non-label fallback: keyword placement in opening sentences
    if (parsedForCompletion.length === 0 && (si.includes('primeras dos oraciones') || si.includes('first two sentences') || si.includes('primeras 100 palabras') || si.includes('primeras dos frases'))) {
      detectedChecks.push(`KEYWORD IN OPENING: Verify the required keyword appears explicitly and verbatim in the first two sentences of your output. If it does not, rewrite the opening now.`);
    }

    // Fallback: if no labeled instructions were parsed, fall back to line-by-line verification
    if (parsedForCompletion.length === 0) {
      const parsedLines = formState.specialInstructions
        .split(/\n+/)
        .map(line => line.replace(/^[\s\-\*\•\d\.\)\:]+/, '').trim())
        .filter(line => line.length > 4);
      for (const line of parsedLines) {
        detectedChecks.push(`⛔ REQUIRED: Verify your output fully satisfies this instruction: "${line}". If not, fix it NOW.`);
      }
    }

    const checksText = detectedChecks.length > 0
      ? detectedChecks.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : '- Check every listed requirement is present in your output.';

    userPrompt += `\n\n=== MANDATORY COMPLETENESS CHECK — DO NOT SKIP — READ THIS BEFORE STOPPING ===
Before writing your final CTA or stopping, verify EACH item below. For any item marked ⛔, writing the closing CTA without it is a failure.

${checksText}

FINAL RULE: If you have already written a closing CTA but any ⛔ item above is missing — append the missing section NOW, then repeat the closing CTA. Do NOT end your response until every item is confirmed present.`;
  }

  return userPrompt;
}