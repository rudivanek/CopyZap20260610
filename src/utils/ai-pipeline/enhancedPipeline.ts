/**
 * Enhanced AI Pipeline for CopyZap+ Mode
 * Three-step process: Input Expansion → Enhanced Generation → Editorial Refinement
 */
import { FormState, User, CopyResult, BrandVoice } from '../../types';
import { handleApiResponse, storePrompts, calculateTargetWordCount, extractWordCount, getWordCountTolerance, makeApiRequestWithFallback } from '../../services/api/utils';
import { trackTokenUsage, extractTokenBreakdown } from '../../services/api/tokenTracking';
import { saveCopySession, getSupabaseClient } from '../../services/supabaseClient';
import { reviseContentForWordCount } from '../../services/api/contentRefinement';
import { generateSeoMetadata } from '../../services/api/seoGeneration';
import { calculateGeoScore } from '../../services/api/geoScoring';
import { expandInputs, ExpandedInputs } from './expandInputs';
import { refineOutput } from './refineOutput';
import { getEnhancedModelSettings } from './modelSettings';
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
 * Build enhanced system prompt for CopyZap+ mode
 */
function buildEnhancedSystemPrompt(
  formState: FormState,
  targetWordCountInfo: { target: number; min?: number; max?: number } | number,
  brandVoice?: BrandVoice | null,
  expandedInputs?: ExpandedInputs
): string {
  const targetWordCount = typeof targetWordCountInfo === 'number' ? targetWordCountInfo : targetWordCountInfo.target;
  const minWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.min : undefined;
  const maxWordCount = typeof targetWordCountInfo === 'object' ? targetWordCountInfo.max : undefined;

  let systemPrompt = `You are CopyZap+, a senior-level AI copywriter that produces output superior to generic AI models.

Your writing consistently exceeds the quality of standard AI-generated content through:
• Strategic storytelling and narrative flow
• Benefit-driven, outcome-focused messaging
• Emotional resonance that connects with readers
• Fresh insights that go beyond obvious points
• Industry-appropriate credibility and authority
• Precise, specific language that avoids generic phrases
• Natural rhythm and readability
• Professional human-level copywriting

CORE REQUIREMENTS:
• Start with a strong hook that captures attention immediately
• Use benefit-driven language focused on outcomes, not just features
• Apply emotional resonance and narrative flow throughout
• Add at least one fresh insight or angle not present in the user input
• Avoid generic AI phrases like "revolutionize," "game-changer," "cutting-edge," "unlock," etc.
• Match the inferred or provided tone precisely
• Use industry-appropriate terminology and credibility markers
• Maintain clarity, rhythm, and specificity in every sentence
• Write as a professional human copywriter would`;

  // Add TL;DR formatting requirement at the beginning if enabled
  if (formState.enhanceForGEO && formState.addTldrSummary) {
    systemPrompt = `ABSOLUTE MANDATORY REQUIREMENT - TL;DR SUMMARY:

Your response MUST begin with "TL;DR:" followed by exactly one concise sentence that directly answers the main question.

EXACT FORMAT REQUIRED:
TL;DR: [One clear sentence that directly answers what the user wants to know.]

[blank line]

[Rest of your marketing copy content...]

---

${systemPrompt}`;
  }

  systemPrompt += `\n\nThe copy should be in ${formState.language} language with a ${formState.tone} tone.`;

  // Enhanced word count instructions based on enforcement mode
  if (formState.aiDecideWordCount) {
    // No word count restriction - AI decides optimal length
    systemPrompt += `\n\nWORD COUNT: Unrestricted - focus on quality and completeness.
Write as much or as little as needed to effectively communicate the message.
Prioritize content excellence over hitting a specific length target.`;
  } else if (formState.prioritizeWordCount) {
    // Strict mode: ±10% tolerance
    const tolerance = 10;
    const minWords = Math.round(targetWordCount * (100 - tolerance) / 100);
    const maxWords = Math.round(targetWordCount * (100 + tolerance) / 100);

    systemPrompt += `\n\nSTRICT WORD COUNT: ${minWords}-${maxWords} words (target: ${targetWordCount}, ±${tolerance}%).
Professional copywriters count carefully. Content outside this range will be revised.`;
  } else {
    // Flexible mode: ±30% tolerance
    const minWords = Math.round(targetWordCount * 0.70);
    const maxWords = Math.round(targetWordCount * 1.30);

    systemPrompt += `\n\nTARGET WORD COUNT: Approximately ${targetWordCount} words (acceptable range: ${minWords}-${maxWords}, ±30%)
Aim for the target but prioritize quality. Before finishing, verify your word count and adjust if needed.`;
  }

  // Add enriched audience and messaging insights if available
  if (expandedInputs) {
    if (expandedInputs.enrichedAudience) {
      systemPrompt += `\n\n=== AUDIENCE INTELLIGENCE ===
${expandedInputs.enrichedAudience}`;
    }

    if (expandedInputs.messagingIntent) {
      systemPrompt += `\n\nSTRATEGIC INTENT: ${expandedInputs.messagingIntent}`;
    }

    if (expandedInputs.inferredBenefits && expandedInputs.inferredBenefits.length > 0) {
      systemPrompt += `\n\nKEY BENEFITS TO EMPHASIZE:
${expandedInputs.inferredBenefits.map(b => `• ${b}`).join('\n')}`;
    }

    if (expandedInputs.inferredDifferentiators && expandedInputs.inferredDifferentiators.length > 0) {
      systemPrompt += `\n\nDIFFERENTIATORS TO HIGHLIGHT:
${expandedInputs.inferredDifferentiators.map(d => `• ${d}`).join('\n')}`;
    }

    if (expandedInputs.emotionalHooks && expandedInputs.emotionalHooks.length > 0) {
      systemPrompt += `\n\nEMOTIONAL HOOKS TO INCORPORATE:
${expandedInputs.emotionalHooks.map(h => `• ${h}`).join('\n')}`;
    }

    if (expandedInputs.credibilityFactors && expandedInputs.credibilityFactors.length > 0) {
      systemPrompt += `\n\nCREDIBILITY ELEMENTS TO LEVERAGE:
${expandedInputs.credibilityFactors.map(c => `• ${c}`).join('\n')}`;
    }
  }

  // Add tab-specific instructions
  if (formState.tab === 'create') {
    systemPrompt += `\n\nYou will create compelling new marketing copy that stands apart from typical AI content. Your copy should feel human, strategic, and professionally crafted.`;
  } else {
    systemPrompt += `\n\nYou will improve the existing copy while dramatically elevating its quality. Transform it into professional-grade content that outperforms the original.`;
  }

  systemPrompt += `\n\nOUTPUT REQUIREMENTS:
• Your response must contain ONLY the generated marketing copy
• Do NOT include introductory text, explanations, or meta-commentary
• Output ONLY the requested marketing content
• No SEO metadata in content body (handled separately)`;

  // Add brand voice if specified (brand voice still applies in enhanced mode)
  if (brandVoice) {
    systemPrompt += `\n\n=== BRAND VOICE: ${brandVoice.name} ===`;

    if (brandVoice.description) {
      systemPrompt += `\n${brandVoice.description}`;
    }

    if (brandVoice.personality_traits && brandVoice.personality_traits.length > 0) {
      systemPrompt += `\n\nPersonality: ${brandVoice.personality_traits.join(', ')}`;
    }

    if (brandVoice.tone_style) {
      systemPrompt += `\nTone Style: ${brandVoice.tone_style}`;
    }

    if (brandVoice.preferred_vocabulary && brandVoice.preferred_vocabulary.length > 0) {
      systemPrompt += `\nPreferred Vocabulary: ${brandVoice.preferred_vocabulary.join(', ')}`;
    }

    if (brandVoice.forbidden_terms && brandVoice.forbidden_terms.length > 0) {
      systemPrompt += `\nForbidden Terms: ${brandVoice.forbidden_terms.join(', ')}`;
    }
  }

  // Add section-specific instructions
  if (formState.section) {
    systemPrompt += `\n\nThis copy is for the "${formState.section}" section.`;
  }

  // Add structured output instructions if needed
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    systemPrompt += `\n\nStructure your response with these sections (in order):`;
    formState.outputStructure.forEach((element, index) => {
      systemPrompt += `\n${index + 1}. ${element.label || element.value}${element.wordCount ? ` (${element.wordCount} words)` : ''}`;
    });
  }

  // Add keyword integration if keywords are provided
  if (formState.keywords) {
    systemPrompt += `\n\nNaturally integrate these keywords: ${formState.keywords}`;
  }

  // Add elaboration instructions if needed
  if (formState.forceElaborationsExamples) {
    systemPrompt += `\n\nIMPORTANT: You MUST provide detailed explanations, comprehensive examples, case studies, and in-depth elaboration throughout the copy. Expand on every point with supporting evidence, real-world applications, and specific details to reach the target word count.`;
    console.log('[enhancedPipeline] forceElaborationsExamples=true — elaboration directive injected into system prompt');
  } else {
    console.log('[enhancedPipeline] forceElaborationsExamples=false — no elaboration directive');
  }

  // Add GEO enhancement if enabled
  if (formState.enhanceForGEO) {
    systemPrompt += `\n\nGEO TARGETING: Optimize for AI search engine visibility`;
    if (formState.geoRegions && formState.geoRegions.trim()) {
      systemPrompt += ` in ${formState.geoRegions}`;
    }
  }

  // Add special instructions
  if (formState.specialInstructions && formState.specialInstructions.trim()) {
    systemPrompt += `\n\n=== SPECIAL INSTRUCTIONS ===
${formState.specialInstructions.trim()}`;
  }

  systemPrompt += `\n\nREMEMBER: You are CopyZap+. Your output should demonstrably exceed typical AI-generated content in quality, persuasiveness, and human feel.`;

  return systemPrompt;
}

/**
 * Build user prompt (similar to legacy but with expanded context)
 */
function buildEnhancedUserPrompt(
  formState: FormState,
  targetWordCount: number,
  expandedInputs?: ExpandedInputs
): string {
  let userPrompt = '';
  const contentToUse = formState.businessDescription || formState.originalCopy || '';

  if (formState.tab === 'create') {
    userPrompt = `Create professional marketing copy based on this business description:

"""
${contentToUse}
"""`;
  } else {
    userPrompt = `Transform this existing marketing copy into professional-grade content:

"""
${contentToUse}
"""`;
  }

  // Add key information
  userPrompt += `\n\nKey Information:`;
  if (expandedInputs?.enrichedAudience || formState.targetAudience) {
    userPrompt += `\n• Target Audience: ${expandedInputs?.enrichedAudience || formState.targetAudience}`;
  }
  if (expandedInputs?.enrichedKeyMessage || formState.keyMessage) {
    userPrompt += `\n• Key Message: ${expandedInputs?.enrichedKeyMessage || formState.keyMessage}`;
  }
  if (formState.callToAction) userPrompt += `\n• Call to Action: ${formState.callToAction}`;
  if (formState.desiredEmotion) userPrompt += `\n• Desired Emotion: ${formState.desiredEmotion}`;
  if (formState.brandValues) userPrompt += `\n• Brand Values: ${formState.brandValues}`;
  if (formState.keywords) userPrompt += `\n• Keywords: ${formState.keywords}`;
  if (formState.industryNiche) userPrompt += `\n• Industry/Niche: ${formState.industryNiche}`;
  if (formState.productServiceName) userPrompt += `\n• Product/Service: ${formState.productServiceName}`;

  // Add pain points if available
  if (formState.targetAudiencePainPoints) {
    const painPointsText = Array.isArray(formState.targetAudiencePainPoints)
      ? formState.targetAudiencePainPoints.join(', ')
      : formState.targetAudiencePainPoints;

    if (painPointsText && painPointsText.trim()) {
      userPrompt += `\n\nTarget Audience Pain Points:
${painPointsText.trim()}`;
    }
  }

  // Add TL;DR reminder if enabled
  if (formState.enhanceForGEO && formState.addTldrSummary) {
    userPrompt += `\n\nREMINDER: Start your response with "TL;DR: [one sentence]" followed by a blank line.`;
  }

  // Add structure guidance if specified
  if (formState.outputStructure && formState.outputStructure.length > 0) {
    userPrompt += `\n\nFormat as natural flowing text with markdown headings for each section.`;
  }

  // Add word count reminder
  // Only add word count instruction if AI is not allowed to decide freely
  if (!formState.aiDecideWordCount) {
    if (formState.prioritizeWordCount) {
      const tolerance = formState.wordCountTolerancePercentage || 2;
      const minWords = Math.round(targetWordCount * (100 - tolerance) / 100);
      const maxWords = Math.round(targetWordCount * (100 + tolerance) / 100);
      userPrompt += `\n\n⚠️ STRICT: ${minWords}-${maxWords} words (target: ${targetWordCount})`;
    } else {
      const minWords = Math.round(targetWordCount * 0.90);
      const maxWords = Math.round(targetWordCount * 1.10);
      userPrompt += `\n\n📝 Target: approximately ${targetWordCount} words (range: ${minWords}-${maxWords})`;
    }
  } else {
    // When AI decides word count, mention it's unrestricted
    userPrompt += `\n\n✨ Word count: Unrestricted - focus on quality and completeness`;
  }

  return userPrompt;
}

/**
 * Run the enhanced CopyZap+ pipeline
 */
export async function runEnhancedPipeline(
  formState: FormState,
  currentUser?: User,
  sessionId?: string,
  progressCallback?: (message: string) => void
): Promise<CopyResult> {
  console.log('🚀 Running CopyZap+ Enhanced Pipeline');

  // STRICT: Session ID must be provided - NO orphaned UUIDs
  if (!sessionId) {
    throw new Error(
      'We couldn\'t create a tracking session. Please retry. If the issue persists, contact support.'
    );
  }
  const actualSessionId = sessionId;

  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(formState);

  // Get max tokens for the model (edge function handles all API configuration)
  const maxTokens = 4000; // Default max tokens for all models

  // STEP 1: Input Expansion Pre-Processing
  if (progressCallback) {
    progressCallback('Step 1/3: Expanding and enriching inputs...');
  }

  let expandedInputs: ExpandedInputs = {};
  try {
    expandedInputs = await expandInputs(formState, currentUser?.email);
    console.log('✅ Input expansion complete');
    if (progressCallback) {
      progressCallback('Inputs enriched with strategic insights');
    }
  } catch (err) {
    console.warn('⚠️ Input expansion failed, continuing with original inputs:', err);
    if (progressCallback) {
      progressCallback('Using original inputs (expansion step skipped)');
    }
  }

  // Fetch brand voice if specified
  let brandVoice: BrandVoice | null = null;
  if (formState.brandVoiceId) {
    if (progressCallback) {
      progressCallback('Loading brand voice settings...');
    }
    brandVoice = await fetchBrandVoice(formState.brandVoiceId);
  }

  // STEP 2: Enhanced Generation with New System Prompt
  if (progressCallback) {
    progressCallback('Step 2/3: Generating professional copy with CopyZap+ engine...');
  }

  // Build enhanced prompts
  const systemPrompt = buildEnhancedSystemPrompt(formState, targetWordCount, brandVoice, expandedInputs);
  const userPrompt = buildEnhancedUserPrompt(formState, targetWordCount.target, expandedInputs);

  // Store prompts for display
  storePrompts(systemPrompt, userPrompt);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Get enhanced model settings
  const modelSettings = getEnhancedModelSettings(formState.model);

  try {
    // Make API request with enhanced settings
    const data = await makeApiRequestWithFallback(
      formState.model,
      messages,
      modelSettings.temperature,
      maxTokens,
      modelSettings.top_p,
      currentUser?.email
    );

    console.log('✅ Enhanced generation complete with model:', data.model_used);

    // Extract token usage
    const tokenUsage = data.usage?.total_tokens || 0;

    // Track tokens
    if (currentUser && tokenUsage > 0) {
      await trackTokenUsage(
        currentUser,
        tokenUsage,
        data.model_used,
        'generate_copy_enhanced',
        actualSessionId,
        0,
        undefined,
        extractTokenBreakdown(data.usage)
      );
    }

    // Extract content
    const generatedContent = data.choices[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('No content in response');
    }

    // STEP 3: Editorial Refinement Pass
    if (progressCallback) {
      progressCallback('Step 3/3: Applying editorial refinement...');
    }

    let improvedCopy = generatedContent;
    try {
      improvedCopy = await refineOutput(generatedContent, formState, currentUser?.email, progressCallback);
      console.log('✅ Editorial refinement complete');
    } catch (err) {
      console.warn('⚠️ Refinement failed, using unrefined version:', err);
      if (progressCallback) {
        progressCallback('Using generated version (refinement step skipped)');
      }
    }

    // Word count validation and revision if needed
    const currentWordCount = extractWordCount(improvedCopy);

    if (progressCallback) {
      progressCallback(`Generated ${currentWordCount} words (target: ${targetWordCount.target})`);
    }

    // Apply word count revision if necessary (same logic as legacy)
    const toleranceSettings = getWordCountTolerance(formState, targetWordCount.target);
    const targetValue = targetWordCount.target;
    const percentageOfTarget = (currentWordCount / targetValue) * 100;

    let needsRevision = false;
    if (targetWordCount.min !== undefined && targetWordCount.max !== undefined) {
      if (currentWordCount < targetWordCount.min || currentWordCount > targetWordCount.max) {
        needsRevision = true;
      }
    } else {
      if (percentageOfTarget < toleranceSettings.minimumAcceptablePercentage ||
         (toleranceSettings.maximumAcceptablePercentage && percentageOfTarget > toleranceSettings.maximumAcceptablePercentage)) {
        needsRevision = true;
      }
    }

    if (needsRevision) {
      if (progressCallback) {
        progressCallback(`Word count adjustment needed (${currentWordCount}/${targetValue}). Revising...`);
      }

      try {
        const shouldForceElaborations = formState.forceElaborationsExamples || currentWordCount < targetValue;
        const revisedContent = await reviseContentForWordCount(
          improvedCopy,
          targetWordCount,
          {
            ...formState,
            sessionId: actualSessionId,
            forceElaborationsExamples: shouldForceElaborations
          },
          currentUser,
          progressCallback,
          undefined,
          actualSessionId
        );
        improvedCopy = revisedContent;

        const revisedWordCount = extractWordCount(revisedContent);
        console.log(`Word count revision result: ${revisedWordCount} words`);
      } catch (revisionError) {
        console.error('Error revising content:', revisionError);
        if (progressCallback) {
          progressCallback(`⚠️ Revision error: ${revisionError.message}. Using original.`);
        }
      }
    }

    // Create result object
    const result: CopyResult = {
      improvedCopy,
      promptUsed: userPrompt
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
      }
    }

    // Generate FAQ Schema if needed
    if (formState.outputStructure && formState.outputStructure.some(element =>
      element.value === 'faqJson' || element.label?.toLowerCase().includes('faq (json)')
    )) {
      if (progressCallback) {
        progressCallback('Generating FAQ Schema...');
      }

      try {
        const { generateFaqSchemaFromText } = await import('../../services/api/seoGeneration');
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
      }
    }

    // Save to database if session ID provided
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
        }
      } catch (err) {
        console.error('Error saving copy session:', err);
      }
    } else if (currentUser) {
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
        }
      } catch (err) {
        console.error('Error creating new copy session:', err);
      }
    }

    console.log('🎉 CopyZap+ Enhanced Pipeline Complete');
    return result;
  } catch (error) {
    console.error('Error in enhanced pipeline:', error);
    if (progressCallback) {
      progressCallback(`Error: ${error.message}`);
    }
    throw error;
  }
}
