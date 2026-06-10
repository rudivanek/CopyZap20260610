import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { FormState, User, GeneratedContentItem, GeneratedContentItemType, CopyResult, ScoringContext, MAX_BOOST_ITERATIONS, MAX_BOOST_SCORE_THRESHOLD } from '../../../../types';
import {
  generateCopy,
  generateContentScores,
  generateSeoMetadata,
  calculateGeoScore,
  generateAlternativeCopy,
  restyleCopyWithPersona
} from '../../../../services/apiService';
import { generateUnifiedComparison } from '../../../../services/api/unifiedComparison';
import { repairDecisionLayerFields as _repairDecisionLayerFields } from '../../../../services/api/comprehensiveScoring';
import { generateAbsoluteScore } from '../../../../services/api/absoluteScoring';
import { checkUserAccess, getSupabaseClient, saveAbsoluteScore } from '../../../../services/supabaseClient';
import { calculateTargetWordCount, extractWordCount } from '../../../../services/api/utils';
import { isContentEmpty } from '../utils/isContentEmpty';
import { sessionManager } from '../../../../services/sessionService';
import { useSession } from '../../../../context/SessionContext';
import { WorkflowService } from '../../../../services/workflowService';
import { WorkflowExecutionEngine } from '../../../../services/workflowExecutionEngine';
import { playSuccessSound } from '../../../../utils/soundEffects';
import { isSessionCreationError, SessionCreationError } from '../../../../utils/sessionErrors';
import { debugCompare } from '../../../../utils/debugLogger';
import { triggerGuidanceHint } from '../../../../utils/guidanceHintService';

export const ORIGINAL_VERSION_ID = '__original__';

/**
 * Parse a keywords string (comma or newline or semicolon separated) into a clean array.
 * Deduplicates and filters empty entries.
 */
function parseKeywordsString(raw?: string): string[] {
  if (!raw || raw.trim() === '') return [];
  return [...new Set(
    raw.split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0)
  )];
}

function ensureOriginalVersion(
  versions: GeneratedContentItem[],
  originalCopy: string | undefined
): GeneratedContentItem[] {
  if (!originalCopy?.trim()) return versions;
  if (versions.some(v => v.type === GeneratedContentItemType.Original)) return versions;
  const syntheticOriginal: GeneratedContentItem = {
    id: ORIGINAL_VERSION_ID,
    type: GeneratedContentItemType.Original,
    content: originalCopy.trim(),
    generatedAt: new Date().toISOString(),
    sourceDisplayName: 'Original Copy',
    analysisMode: 'batch'
  };
  return [syntheticOriginal, ...versions];
}

interface UseGenerationReturn {
  handleGenerate: () => void;
  handleOnDemandGeneration: (actionType: string, sourceItem: GeneratedContentItem, persona?: string, instructions?: string) => void;
  handleModifyContent: (sourceItem: GeneratedContentItem, instruction: string) => void;
  handlePerformanceBoost: (sourceItem: GeneratedContentItem) => Promise<void>;
  handleGenerateFaqSchema: (content: string) => void;
  handleCancelOperation: () => void;
  compareOutputsWithGrok: (isIncremental?: boolean, scoringContext?: import('../../../../types').ScoringContext) => void;
  reanalyzeAllDeep: () => void;
  generateDetailedAnalysis: () => void;
  ensureVersionDeepAnalysis: (versionId: string, freshComparisonResult?: any) => Promise<void>;
  isGeneratingDetails: boolean;
  loadingVersionIds: Set<string>;
  isComparing: boolean;
}

/**
 * Run deep analysis for all versions after comparison
 * Uses caching to avoid re-analyzing unchanged versions
 */
async function runDeepAnalysisForAll(
  versions: GeneratedContentItem[],
  comparisonResult: any,
  formState: FormState,
  currentUser: any,
  sessionId: string,
  progressCallback?: (message: string) => void
): Promise<{ versionAnalyses: Record<string, any>; meta: any }> {
  const { analyzeVersionDeep, generateOverallVerdict, isDeepAnalysisCacheValid } = await import('../../../../services/api/versionDeepAnalysis');

  const versionAnalyses: Record<string, any> = {};
  const existingCache = formState.copyResult?.versionDeepAnalysis || {};

  // Get winner info from comparison result
  const winnerRow = comparisonResult.rows.find((r: any) => r.isWinner);
  if (!winnerRow) {
    throw new Error('No winner found in comparison result');
  }

  const winnerVersion = versions.find(v => v.id === winnerRow.versionId);
  if (!winnerVersion) {
    throw new Error('Winner version not found');
  }

  // Analyze each version (with caching)
  for (const version of versions) {
    const optionLabel = version.sourceDisplayName || version.type || 'Version';

    // Check cache — skip if already analyzed
    const cachedAnalysis = existingCache[version.id];
    if (cachedAnalysis) {
      versionAnalyses[version.id] = cachedAnalysis;
      continue;
    }

    try {
      progressCallback?.(`Analyzing ${optionLabel}...`);

      const thisRow = comparisonResult.rows.find((r: any) => r.versionId === version.id);
      const currentScore: number | undefined =
        thisRow?.score ?? thisRow?.finalScore ??
        (typeof version.score?.overall === 'number' ? version.score.overall : undefined);
      const parentVersion = version.sourceId
        ? versions.find(v => v.id === version.sourceId)
        : undefined;
      const parentRow = parentVersion
        ? comparisonResult.rows.find((r: any) => r.versionId === parentVersion.id)
        : undefined;
      const parentScore: number | undefined =
        parentRow?.score ?? parentRow?.finalScore ??
        (typeof parentVersion?.score?.overall === 'number' ? parentVersion.score!.overall : undefined);
      const parentCopyText: string | undefined = parentVersion
        ? (typeof parentVersion.content === 'string'
            ? parentVersion.content
            : JSON.stringify(parentVersion.content))
        : undefined;

      const analysis = await analyzeVersionDeep(
        version.content,
        optionLabel,
        formState.model,
        currentUser,
        formState,
        sessionId,
        progressCallback,
        currentScore,
        parentScore,
        parentCopyText
      );

      analysis.versionId = version.id;
      versionAnalyses[version.id] = analysis;
    } catch (error) {
      console.error(`Failed to analyze ${optionLabel}:`, error);
    }
  }

  // Generate overall verdict
  progressCallback?.('Generating overall verdict...');
  const meta = await generateOverallVerdict(
    winnerRow.versionId,
    winnerRow.optionLabel,
    winnerVersion.content,
    versionAnalyses,
    formState.model,
    currentUser,
    formState,
    sessionId
  );

  return {
    versionAnalyses,
    meta
  };
}

export function useGeneration(
  currentUser?: User,
  formState?: FormState,
  setFormState?: (state: FormState | ((prev: FormState) => FormState)) => void,
  addProgressMessage?: (message: string) => void,
  onAccessDenied?: () => void,
  onNewOutputAdded?: (newOutputCount: number) => void
): UseGenerationReturn {
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);
  const formStateRef = useRef<FormState | null>(formState);
  formStateRef.current = formState;
  const { setCurrentSession, ensureActiveSession } = useSession();
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [loadingVersionIds, setLoadingVersionIds] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);

  const getBrandVoiceName = async (brandVoiceId?: string): Promise<string | undefined> => {
    if (!brandVoiceId) return undefined;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pmc_public_brand_voices')
        .select('name')
        .eq('id', brandVoiceId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching brand voice name:', error);
        return undefined;
      }
      return data?.name;
    } catch (err) {
      console.error('Exception fetching brand voice name:', err);
      return undefined;
    }
  };

  const handleGenerate = async () => {
    if (!formState || !setFormState || !addProgressMessage) return;

    let workingFormState = { ...formState };

    const hasProjectDescription = workingFormState.projectDescription?.trim();
    const hasProductServiceName = workingFormState.productServiceName?.trim();
    const hasRequiredContent = workingFormState.tab === 'improve'
      ? workingFormState.originalCopy?.trim()
      : workingFormState.businessDescription?.trim();

    if (!hasProjectDescription) {
      toast.error('Please provide a Project Description for session tracking.');
      return;
    }
    if (!hasProductServiceName) {
      toast.error('Please provide a Product/Service Name.');
      return;
    }
    if (!hasRequiredContent) {
      const missingField = workingFormState.tab === 'improve' ? 'Original Copy' : 'Business Description';
      toast.error(`Please provide ${missingField}.`);
      return;
    }
    if (!currentUser) {
      toast.error('Please log in to generate copy.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) {
          onAccessDenied();
        } else {
          toast.error(accessResult.message);
        }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for generation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      generationProgress: [],
      copyResult: {
        ...prev.copyResult,
        generatedVersions: []
      }
    }));
    addProgressMessage('Starting copy generation...');

    let actualSessionId = workingFormState.sessionId;
    if (!actualSessionId) {
      console.log('📝 No saved session - creating one for generation tracking');
      try {
        actualSessionId = await ensureActiveSession(
          currentUser.id,
          workingFormState.outputType,
          workingFormState.projectDescription,
          workingFormState.customerId,
          workingFormState
        );
        console.log('✅ Created session for generation:', actualSessionId);
        workingFormState = { ...workingFormState, sessionId: actualSessionId };
        setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
      } catch (error: any) {
        console.error('❌ Failed to create session for generation:', error);
        toast.error('Failed to create tracking session. Please retry.');
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    } else {
      console.log('📝 Using existing session:', actualSessionId);
    }

    try {
      const brandVoiceName = await getBrandVoiceName(workingFormState.brandVoiceId);
      const enhancedFormState = { ...workingFormState, aiEngineMode: 'enhanced' as const };

      const isBatchMode =
        enhancedFormState.generateSeoMetadata === true ||
        enhancedFormState.generateScores === true ||
        enhancedFormState.generateGeoScore === true;
      const analysisMode: 'batch' | 'on_demand' = isBatchMode ? 'batch' : 'on_demand';

      console.log(`📊 Analysis Mode: ${analysisMode} (SEO: ${enhancedFormState.generateSeoMetadata}, Score: ${enhancedFormState.generateScores}, GEO: ${enhancedFormState.generateGeoScore})`);

      let generatedVersions: GeneratedContentItem[] = [];
      let result: CopyResult | null = null;

      const shouldCreateVariants = enhancedFormState.createVariants && enhancedFormState.numberOfVariants && enhancedFormState.numberOfVariants > 1;
      const variantCount = shouldCreateVariants ? enhancedFormState.numberOfVariants! : 1;

      let originalCopyItem: GeneratedContentItem | undefined;
      if (enhancedFormState.generateScores && enhancedFormState.tab === 'improve' && enhancedFormState.originalCopy) {
        addProgressMessage('Generating score for original copy...');
        const originalScore = await generateContentScores(
          enhancedFormState.originalCopy,
          'Original Copy',
          enhancedFormState.model,
          currentUser,
          enhancedFormState.businessDescription,
          calculateTargetWordCount(enhancedFormState).target,
          actualSessionId,
          addProgressMessage
        );
        originalCopyItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.Original,
          content: enhancedFormState.originalCopy,
          generatedAt: new Date().toISOString(),
          sourceDisplayName: 'Original Copy',
          score: originalScore,
          brandVoiceName,
          analysisMode
        };
        addProgressMessage('Original copy score generated.');
      }

      const variantItems: GeneratedContentItem[] = [];
      for (let i = 1; i <= variantCount; i++) {
        if (shouldCreateVariants) {
          addProgressMessage(`Generating variant ${i} of ${variantCount}...`);
        }

        result = await generateCopy(enhancedFormState, currentUser, actualSessionId, addProgressMessage);

        if (result && result.validationFailed) {
          console.error('❌ Copy Maker output validation failed:', result.validationErrors);
          setFormState(prev => ({
            ...prev,
            isLoading: false,
            validationFailed: true,
            validationErrors: result.validationErrors,
            rawFailedOutput: result.rawFailedOutput
          }));
          addProgressMessage('❌ Output validation failed. Retry attempt unsuccessful.');
          toast.error('Generated output failed validation. Please check the warning banner for options.', { duration: 6000 });
          return;
        }

        if (!result || !result.improvedCopy) {
          throw new Error(`Failed to generate content for variant ${i}`);
        }

        const improvedCopyItem: GeneratedContentItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.Improved,
          content: result.improvedCopy,
          sourceText: enhancedFormState.tab === 'improve'
            ? enhancedFormState.originalCopy
            : enhancedFormState.businessDescription,
          generatedAt: new Date().toISOString(),
          sourceDisplayName: shouldCreateVariants ? `Generated Copy ${i}` : 'Generated Copy 1',
          brandVoiceName,
          analysisMode
        };

        if (result.geoScore) improvedCopyItem.geoScore = result.geoScore;
        if (result.seoMetadata) improvedCopyItem.seoMetadata = result.seoMetadata;
        if (result.faqSchema) improvedCopyItem.faqSchema = result.faqSchema;

        if (enhancedFormState.generateScores) {
          addProgressMessage(`Generating score for variant ${i}...`);
          const score = await generateContentScores(
            result.improvedCopy,
            improvedCopyItem.sourceDisplayName || 'Generated Copy',
            enhancedFormState.model,
            currentUser,
            enhancedFormState.tab === 'improve' ? enhancedFormState.originalCopy : enhancedFormState.businessDescription,
            calculateTargetWordCount(enhancedFormState).target,
            actualSessionId,
            addProgressMessage
          );
          improvedCopyItem.score = score;
          addProgressMessage(`Score generated for variant ${i}.`);
        }

        try {
          const absScore = await generateAbsoluteScore(result.improvedCopy, currentUser, actualSessionId);
          improvedCopyItem.absoluteScore = absScore;
          if (currentUser?.id) {
            saveAbsoluteScore(currentUser.id, improvedCopyItem.id, absScore, actualSessionId);
          }
        } catch {
          // non-critical
        }

        variantItems.push(improvedCopyItem);
      }

      generatedVersions = originalCopyItem ? [originalCopyItem, ...variantItems] : variantItems;

      let shouldTriggerComparison = false;
      let workflowScoringContext: import('../../../../types').ScoringContext | undefined;

      if (enhancedFormState.workflowId) {
        try {
          addProgressMessage('Loading workflow...');
          const workflow = await WorkflowService.getWorkflowById(enhancedFormState.workflowId);
          if (workflow && workflow.steps && workflow.steps.length > 0) {
            addProgressMessage(`Executing workflow: ${workflow.name}`);
            const baseContent = result?.improvedCopy || '';
            if (baseContent) {
              const engine = new WorkflowExecutionEngine(
                workflow,
                baseContent,
                enhancedFormState,
                currentUser,
                (message, currentStep, totalSteps) => {
                  addProgressMessage(`[Workflow ${currentStep}/${totalSteps}] ${message}`);
                }
              );
              const workflowResult = await engine.execute();
              if (workflowResult.success && workflowResult.generatedOutputs) {
                generatedVersions = [...generatedVersions, ...workflowResult.generatedOutputs];
                addProgressMessage(`Workflow complete! Generated ${workflowResult.generatedOutputs.length} additional outputs.`);
                shouldTriggerComparison = workflowResult.shouldTriggerComparison || false;
                workflowScoringContext = workflowResult.scoringContext;
              } else if (workflowResult.error) {
                addProgressMessage(`Workflow error: ${workflowResult.error}`);
                toast.error(`Workflow partially failed: ${workflowResult.error}`);
              }
            }
          } else {
            addProgressMessage('Workflow not found or has no steps.');
          }
        } catch (workflowError: any) {
          console.error('Error executing workflow:', workflowError);
          addProgressMessage(`Workflow execution error: ${workflowError.message}`);
          toast.error(`Workflow failed: ${workflowError.message}`);
        }
      }

      const improvedCopyForBackCompat = result?.improvedCopy ||
        (generatedVersions.length > 0 ? generatedVersions[0].content : '');

      setFormState(prev => ({
        ...prev,
        projectDescription: workingFormState.projectDescription,
        productServiceName: workingFormState.productServiceName,
        sessionId: workingFormState.sessionId,
        copyResult: {
          improvedCopy: improvedCopyForBackCompat,
          generatedVersions
        }
      }));
      addProgressMessage('Copy generation complete.');
      toast.success('Copy generated successfully!');
      playSuccessSound();
      triggerGuidanceHint('after_generate');

      if (shouldTriggerComparison) {
        addProgressMessage('Triggering automatic comparison and analysis...');
        setTimeout(async () => {
          try {
            await compareOutputsWithGrok(false, workflowScoringContext);
          } catch (compError: any) {
            console.error('Error triggering automatic comparison:', compError);
            toast.error('Workflow completed, but comparison failed. You can trigger it manually.');
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error generating copy:', error);
      const errorMessage = error.message || '';
      const isSubscriptionError = errorMessage.includes('subscription') ||
                                  errorMessage.includes('consumed all your available credits');
      const isApiKeyError = !isSubscriptionError && (
        errorMessage.includes('API key') ||
        errorMessage.includes('401') ||
        (errorMessage.includes('403') && (errorMessage.includes('API key') || errorMessage.includes('not configured'))) ||
        errorMessage.includes('Incorrect API key') ||
        errorMessage.includes('Invalid API key') ||
        errorMessage.includes('not configured')
      );
      if (isApiKeyError) {
        const isSupabaseSecretIssue = errorMessage.includes('not configured') ||
                                       errorMessage.includes('No API keys configured');
        if (isSupabaseSecretIssue) {
          toast.error('API keys not configured in Supabase. Check CONFIGURE_SUPABASE_SECRETS.md for setup instructions.');
        } else {
          toast.error('AI Model unavailable. Please select an alternative model.');
        }
        throw new Error('API_KEY_FAILED');
      } else {
        toast.error(`Failed to generate copy: ${error.message}`);
      }
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOnDemandGeneration = async (
    actionType: 'alternative' | 'score' | 'restyle',
    sourceItem: GeneratedContentItem,
    selectedPersona?: string,
    voiceInstructions?: string
  ) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to generate copy.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) { onAccessDenied(); } else { toast.error(accessResult.message); }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for on-demand generation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage(`Starting ${actionType} generation...`);

    let actualSessionId = formState.sessionId;
    if (!actualSessionId) {
      console.log('📝 No saved session - creating one for on-demand generation tracking');
      try {
        actualSessionId = await ensureActiveSession(
          currentUser.id,
          formState.outputType,
          formState.projectDescription,
          formState.customerId,
          formState
        );
        console.log('✅ Created session for on-demand generation:', actualSessionId);
        setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
      } catch (error: any) {
        console.error('❌ Failed to create session for on-demand generation:', error);
        toast.error('Failed to create tracking session. Please retry.');
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    } else {
      console.log('📝 Using existing session for on-demand generation:', actualSessionId);
    }

    try {
      const formTargetWordCount = calculateTargetWordCount(formState);
      const restyleTargetWordCount = actionType === 'restyle' ? extractWordCount(sourceItem.content) : formTargetWordCount.target;
      let newItem: GeneratedContentItem | null = null;

      if (actionType === 'alternative') {
        addProgressMessage(`Generating alternative version of ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const brandVoiceName = await getBrandVoiceName(formState.brandVoiceId);
        const isSourcePlainText = typeof sourceItem.content === 'string';
        const sourceWordCount = extractWordCount(sourceItem.content);
        const alternativeFormState = isSourcePlainText
          ? { ...formState, outputStructure: [], wordCount: 'Custom' as const, customWordCount: sourceWordCount, adhereToLittleWordCount: false, aiDecideWordCount: false }
          : { ...formState, wordCount: 'Custom' as const, customWordCount: sourceWordCount, adhereToLittleWordCount: false, aiDecideWordCount: false };

        const alternativeContent = await generateAlternativeCopy(alternativeFormState, sourceItem.content, currentUser, actualSessionId, addProgressMessage);
        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.Alternative,
          content: alternativeContent,
          sourceText: sourceItem.content,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `Alternative: ${sourceItem.sourceDisplayName || sourceItem.type}`,
          brandVoiceName,
          analysisMode: 'on_demand'
        };
        addProgressMessage('Alternative version generated.');

        if (formState.generateSeoMetadata) {
          addProgressMessage('Generating SEO metadata for alternative content...');
          try {
            const seoMetadata = await generateSeoMetadata(alternativeContent, formState, currentUser, addProgressMessage);
            newItem.seoMetadata = seoMetadata;
            addProgressMessage('SEO metadata generated for alternative content.');
          } catch (seoError) {
            console.error('Error generating SEO metadata for alternative:', seoError);
          }
        }

        if (formState.generateScores) {
          addProgressMessage('Generating score for alternative content...');
          try {
            const score = await generateContentScores(
              alternativeContent,
              newItem.sourceDisplayName || newItem.type,
              formState.model,
              currentUser,
              sourceItem.content,
              calculateTargetWordCount(formState).target,
              actualSessionId,
              addProgressMessage
            );
            newItem.score = score;
            addProgressMessage('Score generated for alternative content.');
          } catch (scoreError) {
            console.error('Error generating score for alternative:', scoreError);
          }
        }

        try {
          const absScore = await generateAbsoluteScore(alternativeContent, currentUser, actualSessionId);
          newItem.absoluteScore = absScore;
          if (currentUser?.id) saveAbsoluteScore(currentUser.id, newItem.id, absScore, actualSessionId);
        } catch { /* non-critical */ }

        if (formState.generateGeoScore) {
          addProgressMessage('Calculating GEO score for alternative content...');
          try {
            const geoScore = await calculateGeoScore(alternativeContent, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage('GEO score calculated for alternative content.');
          } catch (geoError) {
            console.error('Error calculating GEO score for alternative:', geoError);
          }
        }

      } else if (actionType === 'restyle' && selectedPersona) {
        if (!sourceItem.content) {
          throw new Error('No content available to restyle. Please regenerate the content first.');
        }
        const brandVoiceName = await getBrandVoiceName(formState.brandVoiceId);
        const isSourcePlainText = typeof sourceItem.content === 'string';
        const restyleFormState = isSourcePlainText ? { ...formState, outputStructure: [] } : formState;

        addProgressMessage(`Applying ${selectedPersona}'s voice to ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const { content: restyledContent, personaUsed } = await restyleCopyWithPersona(
          sourceItem.content,
          selectedPersona,
          formState.model,
          currentUser,
          formState.language,
          restyleFormState,
          restyleTargetWordCount,
          actualSessionId,
          addProgressMessage,
          voiceInstructions
        );

        if (isContentEmpty(restyledContent)) {
          toast.error(`Failed to generate ${selectedPersona}'s voice style. The AI returned empty content. Please try again or use a different model.`);
          return;
        }

        const effectivePersona = personaUsed || selectedPersona || 'Unknown Persona';
        newItem = {
          id: uuidv4(),
          type: GeneratedContentItemType.RestyledImproved,
          content: restyledContent,
          sourceText: sourceItem.content,
          persona: effectivePersona,
          generatedAt: new Date().toISOString(),
          sourceId: sourceItem.id,
          sourceType: sourceItem.type,
          sourceDisplayName: `${effectivePersona}'s Voice from ${sourceItem.sourceDisplayName || sourceItem.type}`,
          ...(voiceInstructions && { modificationInstruction: voiceInstructions }),
          brandVoiceName,
          analysisMode: 'on_demand'
        };
        addProgressMessage(`Applied ${effectivePersona}'s voice style.`);

        if (typeof restyledContent === 'object' && 'faqSchema' in restyledContent) {
          newItem.faqSchema = restyledContent.faqSchema;
          if ('content' in restyledContent) newItem.content = restyledContent.content;
        }

        if (formState.generateSeoMetadata) {
          addProgressMessage(`Generating SEO metadata for ${effectivePersona}'s voice content...`);
          try {
            const seoMetadata = await generateSeoMetadata(newItem.content, formState, currentUser, addProgressMessage);
            newItem.seoMetadata = seoMetadata;
            addProgressMessage(`SEO metadata generated for ${effectivePersona}'s voice content.`);
          } catch (seoError) {
            console.error(`Error generating SEO metadata for ${effectivePersona}'s voice:`, seoError);
          }
        }

        if (formState.generateScores) {
          addProgressMessage(`Generating score for ${effectivePersona}'s voice content...`);
          try {
            const score = await generateContentScores(
              newItem.content,
              newItem.sourceDisplayName || newItem.type,
              formState.model,
              currentUser,
              sourceItem.content,
              restyleTargetWordCount,
              actualSessionId,
              addProgressMessage
            );
            newItem.score = score;
            addProgressMessage(`Score generated for ${effectivePersona}'s voice content.`);
          } catch (scoreError) {
            console.error(`Error generating score for ${effectivePersona}'s voice:`, scoreError);
          }
        }

        try {
          const absScore = await generateAbsoluteScore(newItem.content, currentUser, actualSessionId);
          newItem.absoluteScore = absScore;
          if (currentUser?.id) saveAbsoluteScore(currentUser.id, newItem.id, absScore, actualSessionId);
        } catch { /* non-critical */ }

        if (formState.generateGeoScore) {
          addProgressMessage(`Calculating GEO score for ${effectivePersona}'s voice content...`);
          try {
            const geoScore = await calculateGeoScore(newItem.content, formState, currentUser, addProgressMessage);
            newItem.geoScore = geoScore;
            addProgressMessage(`GEO score calculated for ${effectivePersona}'s voice content.`);
          } catch (geoError) {
            console.error(`Error calculating GEO score for ${effectivePersona}'s voice:`, geoError);
          }
        }

      } else if (actionType === 'score') {
        if (!sourceItem.content) {
          throw new Error('No content available to score. Please regenerate the content first.');
        }
        addProgressMessage(`Generating score for ${sourceItem.sourceDisplayName || sourceItem.type}...`);
        const formTargetWordCount2 = calculateTargetWordCount(formState);
        const score = await generateContentScores(
          sourceItem.content,
          sourceItem.sourceDisplayName || sourceItem.type,
          formState.model,
          currentUser,
          undefined,
          formTargetWordCount2.target,
          actualSessionId,
          addProgressMessage
        );
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: prev.copyResult?.generatedVersions?.map(item =>
              item.id === sourceItem.id ? { ...item, score: score } : item
            ) || []
          }
        }));
        addProgressMessage('Score generated.');
        toast.success('Score generated successfully!');
        return;
      }

      if (newItem) {
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            generatedVersions: [
              ...(prev.copyResult?.generatedVersions || []),
              newItem
            ],
            comparisonDeepAnalysisMeta: undefined,
          }
        }));
        addProgressMessage(`${actionType} generation complete.`);
        toast.success(`${actionType} generated successfully!`);
        if (formState.copyResult?.comparisonResult && onNewOutputAdded) {
          onNewOutputAdded(1);
        }
      }
    } catch (error: any) {
      console.error(`Error generating ${actionType}:`, error);
      toast.error(`Failed to generate ${actionType}: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle content modification
  const handleModifyContent = async (sourceItem: GeneratedContentItem, instruction: string) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to modify content.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) { onAccessDenied(); } else { toast.error(accessResult.message); }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for content modification:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage(`Modifying content: "${instruction}"...`);

    let actualSessionId = formState.sessionId;
    if (!actualSessionId) {
      console.log('📝 No saved session - creating one for content modification tracking');
      try {
        actualSessionId = await ensureActiveSession(
          currentUser.id,
          formState.outputType,
          formState.projectDescription,
          formState.customerId,
          formState
        );
        console.log('✅ Created session for content modification:', actualSessionId);
        setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
      } catch (error: any) {
        console.error('❌ Failed to create session for content modification:', error);
        toast.error('Failed to create tracking session. Please retry.');
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    } else {
      console.log('📝 Using existing session for content modification:', actualSessionId);
    }

    try {
      const brandVoiceName = await getBrandVoiceName(formState.brandVoiceId);
      const { modifyContent } = await import('../../../../services/apiService');

      const modifySourceWordCount = extractWordCount(sourceItem.content);
      const modifyFormState = { ...formState, wordCount: 'Custom' as const, customWordCount: modifySourceWordCount, adhereToLittleWordCount: false, aiDecideWordCount: false };

      const modifiedContent = await modifyContent(
        sourceItem.content,
        instruction,
        modifyFormState,
        currentUser,
        addProgressMessage,
        actualSessionId
      );

      const newItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Alternative,
        content: modifiedContent,
        sourceText: sourceItem.content,
        generatedAt: new Date().toISOString(),
        sourceId: sourceItem.id,
        sourceType: sourceItem.type,
        sourceDisplayName: `Modified: ${sourceItem.sourceDisplayName || sourceItem.type}`,
        modificationInstruction: instruction,
        brandVoiceName,
        analysisMode: 'on_demand'
      };

      if (formState.generateSeoMetadata) {
        addProgressMessage('Generating SEO metadata for modified content...');
        try {
          const seoMetadata = await generateSeoMetadata(modifiedContent, formState, currentUser, addProgressMessage);
          newItem.seoMetadata = seoMetadata;
          addProgressMessage('SEO metadata generated for modified content.');
        } catch (seoError) {
          console.error('Error generating SEO metadata for modified content:', seoError);
        }
      }

      if (formState.generateScores) {
        addProgressMessage('Generating score for modified content...');
        try {
          const formTargetWordCount = calculateTargetWordCount(formState);
          const score = await generateContentScores(
            modifiedContent,
            newItem.sourceDisplayName || newItem.type,
            formState.model,
            currentUser,
            sourceItem.content,
            formTargetWordCount.target,
            actualSessionId,
            addProgressMessage
          );
          newItem.score = score;
          addProgressMessage('Score generated for modified content.');
        } catch (scoreError) {
          console.error('Error generating score for modified content:', scoreError);
        }
      }

      if (formState.generateGeoScore) {
        addProgressMessage('Calculating GEO score for modified content...');
        try {
          const geoScore = await calculateGeoScore(modifiedContent, formState, currentUser, addProgressMessage);
          newItem.geoScore = geoScore;
          addProgressMessage('GEO score calculated for modified content.');
        } catch (geoError) {
          console.error('Error calculating GEO score for modified content:', geoError);
        }
      }

      // Generate absolute score for modified content — same pattern as all other paths
      try {
        addProgressMessage('Generating absolute score for modified content...');
        const absScore = await generateAbsoluteScore(modifiedContent, currentUser, actualSessionId);
        newItem.absoluteScore = absScore;
        if (currentUser?.id) saveAbsoluteScore(currentUser.id, newItem.id, absScore, actualSessionId);
        addProgressMessage('Absolute score generated for modified content.');
      } catch (absError) {
        console.error('Error generating absolute score for modified content:', absError);
        // non-critical — proceed without absolute score
      }

      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          generatedVersions: [
            ...(prev.copyResult?.generatedVersions || []),
            newItem
          ],
          comparisonDeepAnalysisMeta: undefined,
        }
      }));
      addProgressMessage('Content modification complete.');
      toast.success('Content modified successfully!');

      if (formState.copyResult?.comparisonResult && onNewOutputAdded) {
        onNewOutputAdded(1);
      }
    } catch (error: any) {
      console.error('Error modifying content:', error);
      toast.error(`Failed to modify content: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePerformanceBoost = async (sourceItem: GeneratedContentItem): Promise<void> => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to boost content.');
      return;
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) { onAccessDenied(); } else { toast.error(accessResult.message); }
        return;
      }
    } catch {
      toast.error('Unable to verify access. Please try again.');
      return;
    }

    const baseName = sourceItem.baseName || sourceItem.sourceDisplayName || sourceItem.type;
    const allVersions = formState.copyResult?.generatedVersions || [];
    const existingBoosts = allVersions.filter(
      v => v.type === GeneratedContentItemType.Boosted &&
        (v.parentOutputId === sourceItem.id || v.baseName === baseName)
    );
    const nextIteration = existingBoosts.length + 1;

    if (nextIteration > MAX_BOOST_ITERATIONS) {
      toast.error(`Further boosting may reduce authenticity. Maximum ${MAX_BOOST_ITERATIONS} boosts reached.`);
      return;
    }

    const cachedScores = formState.copyResult?.versionScores;
    const existingScore = cachedScores?.[sourceItem.id];
    if (existingScore && existingScore.finalScore >= MAX_BOOST_SCORE_THRESHOLD * 10) {
      toast('This output already scores at or above 9.0 — boosting is disabled.', { icon: '🏆' });
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage('🚀 Boosting performance...');

    let actualSessionId = formState.sessionId;
    if (!actualSessionId) {
      try {
        actualSessionId = await ensureActiveSession(
          currentUser.id,
          formState.outputType,
          formState.projectDescription,
          formState.customerId,
          formState
        );
        setFormState(prev => ({ ...prev, sessionId: actualSessionId }));
      } catch {
        toast.error('Failed to create tracking session. Please retry.');
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    }

    try {
      const { performBoost } = await import('../../../../services/api/performanceBoost');
      const brandVoiceName = await getBrandVoiceName(formState.brandVoiceId);
      const scoreResult = cachedScores?.[sourceItem.id] ?? null;

      const boostedContent = await performBoost(
        sourceItem.content,
        scoreResult,
        formState,
        currentUser,
        addProgressMessage,
        actualSessionId
      );

      const iterationSuffix = nextIteration === 1 ? '— Boosted 🚀' : `— Boosted 🚀 (${nextIteration})`;
      const displayName = `${baseName} ${iterationSuffix}`;

      const newItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Boosted,
        content: boostedContent,
        sourceText: sourceItem.content,
        generatedAt: new Date().toISOString(),
        sourceId: sourceItem.id,
        sourceType: sourceItem.type,
        sourceDisplayName: displayName,
        baseName,
        parentOutputId: sourceItem.id,
        boostIteration: nextIteration,
        boostLevel: 'lite',
        brandVoiceName,
        analysisMode: 'on_demand',
      };

      if (formState.generateSeoMetadata) {
        addProgressMessage('Generating SEO metadata for boosted content...');
        try {
          const seoMetadata = await generateSeoMetadata(boostedContent, formState, currentUser, addProgressMessage);
          newItem.seoMetadata = seoMetadata;
        } catch {
          addProgressMessage('SEO metadata generation skipped.');
        }
      }

      if (formState.generateScores) {
        addProgressMessage('Scoring boosted content...');
        try {
          const twc = calculateTargetWordCount(formState);
          const score = await generateContentScores(
            boostedContent,
            displayName,
            formState.model,
            currentUser,
            sourceItem.content,
            twc.target,
            actualSessionId,
            addProgressMessage
          );
          newItem.score = score;
        } catch {
          addProgressMessage('Scoring skipped.');
        }
      }

      if (formState.generateGeoScore) {
        addProgressMessage('Calculating GEO score for boosted content...');
        try {
          const geoScore = await calculateGeoScore(boostedContent, formState, currentUser, addProgressMessage);
          newItem.geoScore = geoScore;
        } catch {
          addProgressMessage('GEO score skipped.');
        }
      }

      // Generate absolute score for boosted content
      try {
        const absScore = await generateAbsoluteScore(boostedContent, currentUser, actualSessionId);
        newItem.absoluteScore = absScore;
        if (currentUser?.id) saveAbsoluteScore(currentUser.id, newItem.id, absScore, actualSessionId);
      } catch { /* non-critical */ }

      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          generatedVersions: [
            ...(prev.copyResult?.generatedVersions || []),
            newItem,
          ],
          comparisonDeepAnalysisMeta: undefined,
        },
      }));

      addProgressMessage('🚀 Performance Boost complete!');
      toast.success('Boosted version created!');

      if (formState.copyResult?.comparisonResult && onNewOutputAdded) {
        onNewOutputAdded(1);
      }
    } catch (error: any) {
      console.error('Error during performance boost:', error);
      toast.error(`Boost failed: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleGenerateFaqSchema = async (content: string) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to generate FAQ schema.');
      return;
    }
    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) { onAccessDenied(); } else { toast.error(accessResult.message); }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for FAQ schema generation:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }
    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    addProgressMessage('Generating FAQ schema...');
    try {
      const faqSchema = await generateSeoMetadata(content, formState, currentUser, addProgressMessage);
      addProgressMessage('FAQ schema generated.');
      toast.success('FAQ schema generated successfully!');
    } catch (error: any) {
      console.error('Error generating FAQ schema:', error);
      toast.error(`Failed to generate FAQ schema: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelOperation = () => {
    if (setFormState) {
      setFormState(prev => ({ ...prev, isLoading: false, isEvaluating: false }));
    }
    toast.info('Operation cancelled');
  };

  const compareOutputsWithGrok = async (
    isIncremental: boolean = false,
    scoringContext?: ScoringContext
  ) => {
    if (!currentUser || !formState || !setFormState || !addProgressMessage) {
      toast.error('Please log in to compare outputs.');
      return;
    }

    let latestFormState: FormState | null = null;
    setFormState(prev => {
      latestFormState = prev;
      return prev;
    });

    if (!latestFormState) {
      toast.error('Unable to access current state.');
      return;
    }

    const allGeneratedVersions = latestFormState.copyResult?.generatedVersions || [];
    const existingAnalysisCard = allGeneratedVersions.find(v => v.comparedContent);
    const existingAnalyzedIds = existingAnalysisCard?.analyzedOutputIds || [];
    const existingComparisonResult = latestFormState.copyResult?.comparisonResult;
    const generatedVersions = allGeneratedVersions.filter(v => !v.comparedContent);
    const originalCopyText = latestFormState.originalCopy?.trim() || undefined;
    const versionsWithOriginal = ensureOriginalVersion(generatedVersions, originalCopyText);

    const originalItem = versionsWithOriginal.find(v => v.id === ORIGINAL_VERSION_ID);
    if (originalItem && !originalItem.absoluteScore && originalCopyText) {
      try {
        const absScore = await generateAbsoluteScore(originalCopyText, currentUser, latestFormState.sessionId);
        originalItem.absoluteScore = absScore;
        if (currentUser?.id && latestFormState.sessionId) {
          saveAbsoluteScore(currentUser.id, ORIGINAL_VERSION_ID, absScore, latestFormState.sessionId);
        }
        setFormState(prev => {
          const versions = prev.copyResult?.generatedVersions ?? [];
          const exists = versions.some(v => v.id === ORIGINAL_VERSION_ID);
          const updated = exists
            ? versions.map(v => v.id === ORIGINAL_VERSION_ID ? { ...v, absoluteScore: absScore } : v)
            : [{ ...originalItem, absoluteScore: absScore }, ...versions];
          return { ...prev, copyResult: { ...prev.copyResult, generatedVersions: updated } };
        });
      } catch { /* non-critical */ }
    }

    let outputsToAnalyze = versionsWithOriginal;
    let isIncrementalUpdate = false;

    if (isIncremental && existingAnalysisCard && existingAnalyzedIds.length > 0) {
      const newOutputsOnly = generatedVersions.filter(v => !existingAnalyzedIds.includes(v.id));
      outputsToAnalyze = newOutputsOnly;
      isIncrementalUpdate = true;
      if (outputsToAnalyze.length === 0) {
        toast.info('No new outputs to analyze.');
        return;
      }
      addProgressMessage?.(`Found ${outputsToAnalyze.length} new output${outputsToAnalyze.length !== 1 ? 's' : ''} to analyze...`);
    } else {
      outputsToAnalyze = versionsWithOriginal;
      isIncrementalUpdate = false;
    }

    if (isIncrementalUpdate) {
      if (outputsToAnalyze.length === 0) {
        toast.error('No new outputs to add to the analysis.');
        return;
      }
    } else {
      if (versionsWithOriginal.length < 2) {
        toast.error('Need at least 2 items to compare (Original Copy counts as one item).');
        return;
      }
    }

    try {
      const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');
      if (!accessResult.hasAccess) {
        if (onAccessDenied) { onAccessDenied(); } else { toast.error(accessResult.message); }
        return;
      }
    } catch (error) {
      console.error('Error checking user access for comparison:', error);
      toast.error("Unable to verify access. Please try again.");
      return;
    }

    setIsComparing(true);
    setFormState(prev => ({ ...prev, isLoading: true, generationProgress: [] }));
    if (isIncrementalUpdate) {
      addProgressMessage(`Updating analysis with ${outputsToAnalyze.length} new output${outputsToAnalyze.length !== 1 ? 's' : ''}...`);
    } else {
      addProgressMessage(`Preparing outputs for comparison analysis...`);
    }

    console.log('🔄 About to ensure active session...');
    console.log('Current user:', currentUser);
    console.log('Session params:', {
      userId: currentUser.id,
      existingSessionId: latestFormState.sessionId,
      projectDescription: latestFormState.projectDescription || 'Comparison',
      customerId: latestFormState.customerId
    });

    let workingSessionId = latestFormState.sessionId;
    if (!workingSessionId) {
      debugCompare.log('No saved session - creating one for comparison tracking');
      try {
        workingSessionId = await ensureActiveSession(
          currentUser.id,
          'comparison',
          latestFormState.projectDescription || 'Comparison Analysis',
          latestFormState.customerId,
          latestFormState
        );
        debugCompare.log('✅ Created session for comparison:', workingSessionId);
        setFormState(prev => ({ ...prev, sessionId: workingSessionId }));
      } catch (error) {
        console.error('Failed to create session for comparison:', error);
        toast.error('Failed to create session. Please try again.');
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    } else {
      console.log('Using existing session:', workingSessionId);
    }

    addProgressMessage('Starting comparison...');

    try {
      const versionsForAnalysis = isIncrementalUpdate ? outputsToAnalyze : versionsWithOriginal;
      const existingCache = latestFormState.copyResult?.versionScores || {};
      const { updateScoreCache, buildContextKey } = await import('../../../../utils/versionScoreCache');
      const parsedKw = parseKeywordsString(latestFormState.keywords);
      const scoringKeywords = latestFormState.keywordsExplicit ? parsedKw : [];

      if (import.meta.env.DEV) {
        console.log(`[scoringPayload] useCaseKey=${scoringContext?.useCaseKey ?? '(none)'} useCaseLabel=${scoringContext?.useCaseLabel ?? '(none)'} keywordsCount=${scoringKeywords.length} keywords=${JSON.stringify(scoringKeywords)}`);
        console.log('[LAZY-SCORING] EXECUTIVE CALL — scoring only, no detailed analysis', {
          versions: versionsForAnalysis.map(v => v.sourceDisplayName || v.type),
          caller: 'compareOutputsWithGrok'
        });
      }

      const unifiedResult = await generateUnifiedComparison(
        originalCopyText,
        versionsForAnalysis,
        currentUser,
        workingSessionId,
        addProgressMessage,
        latestFormState.model,
        existingCache,
        scoringKeywords,
        scoringContext,
        latestFormState.section || 'Marketing Copy'
      );

      console.log('✅ generateUnifiedComparison completed successfully');

      let { comparisonResult, modelUsed } = unifiedResult;
      _repairDecisionLayerFields(comparisonResult);
      const updatedCache = existingCache;

      debugCompare.log('📊 Storing comparison result in state:', {
        comparisonResult,
        analyzedVersions: versionsForAnalysis.map(v => v.sourceDisplayName || v.type),
        cacheUpdated: Object.keys(updatedCache).length
      });

      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          comparisonResult: comparisonResult,
          versionScores: updatedCache,
          comparisonDeepAnalysisMeta: undefined
        }
      }));

      addProgressMessage('Comparison complete! Generating detailed analysis...');

      try {
        const allVersionsInState = (latestFormState.copyResult?.generatedVersions || []).filter(v => !v.comparedContent);
        const versionsForDeepAnalysis = ensureOriginalVersion(allVersionsInState, originalCopyText);
        const coveredIds = new Set(versionsForDeepAnalysis.map(v => v.id));
        const extraRows = comparisonResult.rows.filter((r: any) => !coveredIds.has(r.versionId) && r.versionId !== ORIGINAL_VERSION_ID);
        if (extraRows.length > 0) {
          console.warn('[deepAnalysis] rows in comparisonResult not found in state versions:', extraRows.map((r: any) => r.versionId));
        }
        const deepAnalysisResult = await runDeepAnalysisForAll(
          versionsForDeepAnalysis,
          comparisonResult,
          latestFormState,
          currentUser,
          workingSessionId,
          addProgressMessage
        );
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            versionDeepAnalysis: {
              ...(prev.copyResult?.versionDeepAnalysis || {}),
              ...deepAnalysisResult.versionAnalyses
            },
            comparisonDeepAnalysisMeta: deepAnalysisResult.meta
          }
        }));
        addProgressMessage('Analysis complete!');
      } catch (analysisError: any) {
        console.error('Auto-analysis failed:', analysisError);
        addProgressMessage('Analysis generation failed, but scoring is complete.');
      }

      toast.success('Analysis and scoring complete!');
      triggerGuidanceHint('after_score');
    } catch (error: any) {
      console.error('❌ Error comparing outputs:', error);
      let errorMessage = 'Analysis could not be completed. Please try again.';
      if (error.message) {
        if (error.message.includes('API key')) {
          errorMessage = 'API configuration error. Please contact support.';
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorMessage = 'API rate limit reached. Please try again in a moment.';
        } else if (error.message.includes('parse') || error.message.includes('JSON')) {
          errorMessage = 'Unable to process analysis results. Please try again.';
        } else if (error.message.includes('No response') || error.message.includes('empty response')) {
          errorMessage = 'No response from AI service. Please try again.';
        } else if (error.message.includes('Network') || error.message.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Analysis failed: ${error.message}`;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsComparing(false);
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const generateDetailedAnalysis = async () => {
    if (!currentUser || !formState || !setFormState) return;
    if (isGeneratingDetails) {
      if (import.meta.env.DEV) console.warn('[LAZY-SCORING] generateDetailedAnalysis called while already in progress — ignored');
      return;
    }
    if (import.meta.env.DEV) {
      console.log('[LAZY-SCORING] DETAILED CALL — user explicitly requested breakdown', {
        caller: 'generateDetailedAnalysis',
        stack: new Error('CALLER_TRACE').stack
      });
    }
    const latestFormState = formStateRef.current;
    if (!latestFormState) return;
    const comparisonResult = latestFormState.copyResult?.comparisonResult;
    if (!comparisonResult) return;
    if (latestFormState.copyResult?.versionDeepAnalysis && Object.keys(latestFormState.copyResult.versionDeepAnalysis).length > 0) {
      if (import.meta.env.DEV) console.log('[LAZY-SCORING] Detailed analysis already cached — skipping API call');
      return;
    }
    const generatedVersions = (latestFormState.copyResult?.generatedVersions || []).filter(v => !v.comparedContent);
    const originalCopyText = latestFormState.originalCopy?.trim() || undefined;
    const versionsWithOriginal = ensureOriginalVersion(generatedVersions, originalCopyText);
    let workingSessionId = latestFormState.sessionId;
    if (!workingSessionId) {
      try {
        workingSessionId = await ensureActiveSession(
          currentUser.id,
          'deep_analysis',
          latestFormState.projectDescription || 'Deep Analysis',
          latestFormState.customerId,
          latestFormState
        );
        setFormState(prev => ({ ...prev, sessionId: workingSessionId }));
      } catch (err) {
        toast.error('Failed to create session for detailed analysis.');
        return;
      }
    }
    setIsGeneratingDetails(true);
    addProgressMessage?.('Starting detailed analysis...');
    try {
      const deepAnalysisResult = await runDeepAnalysisForAll(
        versionsWithOriginal,
        comparisonResult,
        latestFormState,
        currentUser,
        workingSessionId || '',
        addProgressMessage
      );
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          versionDeepAnalysis: {
            ...(prev.copyResult?.versionDeepAnalysis || {}),
            ...deepAnalysisResult.versionAnalyses
          },
          comparisonDeepAnalysisMeta: deepAnalysisResult.meta
        }
      }));
      addProgressMessage?.('Detailed analysis complete!');
      toast.success('Detailed analysis ready!');
    } catch (error: any) {
      console.error('❌ Detailed analysis failed:', error);
      toast.error('Detailed analysis failed. Please try again.');
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const ensureVersionDeepAnalysis = async (versionId: string, freshComparisonResult?: any) => {
    if (!currentUser || !setFormState) {
      console.warn('[ensureVersionDeepAnalysis] bail: missing currentUser/setFormState', { versionId, hasUser: !!currentUser });
      return;
    }
    const latestFormState = formStateRef.current;
    if (!latestFormState) {
      console.warn('[ensureVersionDeepAnalysis] bail: latestFormState is null', { versionId });
      return;
    }
    if (latestFormState.copyResult?.versionDeepAnalysis?.[versionId]) {
      console.log('[ensureVersionDeepAnalysis] bail: already cached', { versionId });
      return;
    }
    if (loadingVersionIds.has(versionId)) {
      console.warn('[ensureVersionDeepAnalysis] bail: already in-flight', { versionId, loadingVersionIds: [...loadingVersionIds] });
      return;
    }
    const comparisonResult = freshComparisonResult ?? latestFormState.copyResult?.comparisonResult;
    if (!comparisonResult) {
      console.warn('[ensureVersionDeepAnalysis] bail: no comparisonResult', { versionId });
      return;
    }
    const allGeneratedVersions = latestFormState.copyResult?.generatedVersions || [];
    const generatedVersions = allGeneratedVersions.filter(v => !v.comparedContent);
    let targetContent: any;
    let optionLabel: string;
    if (versionId === ORIGINAL_VERSION_ID) {
      const originalContent = latestFormState.originalCopy?.trim();
      if (!originalContent) {
        console.warn('[ensureVersionDeepAnalysis] bail: no originalCopy', { versionId });
        return;
      }
      targetContent = originalContent;
      optionLabel = 'Original Copy';
    } else {
      const targetVersion = generatedVersions.find(v => v.id === versionId);
      if (!targetVersion) {
        const allIds = allGeneratedVersions.map(v => v.id);
        const filteredIds = generatedVersions.map(v => v.id);
        console.warn('[ensureVersionDeepAnalysis] bail: version not found in generatedVersions', { versionId, allIds, filteredIds });
        return;
      }
      targetContent = targetVersion.content;
      optionLabel = targetVersion.sourceDisplayName || targetVersion.type || 'Version';
    }
    let workingSessionId = latestFormState.sessionId;
    if (!workingSessionId) {
      try {
        workingSessionId = await ensureActiveSession(
          currentUser.id,
          'deep_analysis',
          latestFormState.projectDescription || 'Deep Analysis',
          latestFormState.customerId,
          latestFormState
        );
        setFormState(prev => ({ ...prev, sessionId: workingSessionId }));
      } catch {
        toast.error('Failed to create session for analysis.');
        return;
      }
    }
    setLoadingVersionIds(prev => new Set([...prev, versionId]));
    try {
      const { analyzeVersionDeep } = await import('../../../../services/api/versionDeepAnalysis');
      const rows = comparisonResult.rows as any[];
      const thisRow = rows.find((r: any) => r.versionId === versionId);
      const targetVersion = generatedVersions.find(v => v.id === versionId);
      const currentScore: number | undefined =
        thisRow?.score ?? thisRow?.finalScore ??
        (typeof targetVersion?.score?.overall === 'number' ? targetVersion.score!.overall : undefined);
      const parentVersion = targetVersion?.sourceId
        ? generatedVersions.find(v => v.id === targetVersion.sourceId)
        : undefined;
      const parentRow = parentVersion
        ? rows.find((r: any) => r.versionId === parentVersion.id)
        : undefined;
      const parentScore: number | undefined =
        parentRow?.score ?? parentRow?.finalScore ??
        (typeof parentVersion?.score?.overall === 'number' ? parentVersion.score!.overall : undefined);
      const parentCopyText: string | undefined = parentVersion
        ? (typeof parentVersion.content === 'string'
            ? parentVersion.content
            : JSON.stringify(parentVersion.content))
        : undefined;
      const analysis = await analyzeVersionDeep(
        targetContent,
        optionLabel,
        latestFormState.model,
        currentUser,
        latestFormState,
        workingSessionId || '',
        undefined,
        currentScore,
        parentScore,
        parentCopyText
      );
      analysis.versionId = versionId;
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          versionDeepAnalysis: {
            ...(prev.copyResult?.versionDeepAnalysis || {}),
            [versionId]: analysis
          }
        }
      }));
    } catch (error: any) {
      console.error(`[ensureVersionDeepAnalysis] Failed for ${versionId}:`, error);
      toast.error('Analysis failed for this version. Please try again.');
    } finally {
      setLoadingVersionIds(prev => {
        const next = new Set(prev);
        next.delete(versionId);
        return next;
      });
    }
  };

  const reanalyzeAllDeep = async () => {
    if (!currentUser || !formState || !setFormState) {
      toast.error('Please log in to run analysis.');
      return;
    }
    let latestFormState: FormState | null = null;
    setFormState(prev => {
      latestFormState = prev;
      return prev;
    });
    if (!latestFormState) {
      toast.error('Unable to access current state.');
      return;
    }
    const comparisonResult = latestFormState.copyResult?.comparisonResult;
    const generatedVersions = latestFormState.copyResult?.generatedVersions || [];
    if (!comparisonResult) {
      toast.error('Please run comparison first.');
      return;
    }
    if (generatedVersions.length === 0) {
      toast.error('No versions to analyze.');
      return;
    }
    let workingSessionId = latestFormState.sessionId;
    if (!workingSessionId) {
      try {
        workingSessionId = await ensureActiveSession(
          currentUser.id,
          'reanalysis',
          latestFormState.projectDescription || 'Deep Analysis',
          latestFormState.customerId,
          latestFormState
        );
        setFormState(prev => ({ ...prev, sessionId: workingSessionId }));
      } catch (error) {
        console.error('Failed to create session for re-analysis:', error);
        toast.error('Failed to create session. Please try again.');
        return;
      }
    }
    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage?.('Re-analyzing all versions in detail...');
    try {
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          versionDeepAnalysis: undefined,
          comparisonDeepAnalysisMeta: undefined
        }
      }));
      const originalCopyTextForReanalysis = latestFormState.originalCopy?.trim() || undefined;
      const versionsForReanalysis = ensureOriginalVersion(
        generatedVersions.filter(v => !v.comparedContent),
        originalCopyTextForReanalysis
      );
      let activeComparisonResult = comparisonResult;
      const hasOriginalInComparison = comparisonResult.rows.some(
        r => r.versionId === ORIGINAL_VERSION_ID || r.optionLabel === 'Original Copy'
      );
      if (!hasOriginalInComparison && originalCopyTextForReanalysis) {
        addProgressMessage?.('Updating comparison to include original...');
        const existingCache = latestFormState.copyResult?.versionScores || {};
        const refreshed = await generateUnifiedComparison(
          originalCopyTextForReanalysis,
          versionsForReanalysis,
          currentUser,
          workingSessionId,
          addProgressMessage,
          latestFormState.model,
          existingCache,
          latestFormState.keywordsExplicit ? parseKeywordsString(latestFormState.keywords) : []
        );
        activeComparisonResult = refreshed.comparisonResult;
        _repairDecisionLayerFields(activeComparisonResult);
        setFormState(prev => ({
          ...prev,
          copyResult: {
            ...prev.copyResult,
            comparisonResult: activeComparisonResult,
            versionScores: { ...(prev.copyResult?.versionScores || {}), ...existingCache }
          }
        }));
      }
      const deepAnalysisResult = await runDeepAnalysisForAll(
        versionsForReanalysis,
        activeComparisonResult,
        latestFormState,
        currentUser,
        workingSessionId,
        addProgressMessage
      );
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          versionDeepAnalysis: {
            ...(prev.copyResult?.versionDeepAnalysis || {}),
            ...deepAnalysisResult.versionAnalyses
          },
          comparisonDeepAnalysisMeta: deepAnalysisResult.meta
        }
      }));
      addProgressMessage?.('Detailed analysis complete!');
      toast.success('All versions re-analyzed successfully!');
    } catch (error: any) {
      console.error('❌ Re-analysis failed:', error);
      toast.error(error.message || 'Re-analysis failed. Please try again.');
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    handleGenerate,
    handleOnDemandGeneration,
    handleModifyContent,
    handlePerformanceBoost,
    handleGenerateFaqSchema,
    handleCancelOperation,
    compareOutputsWithGrok,
    reanalyzeAllDeep,
    generateDetailedAnalysis,
    ensureVersionDeepAnalysis,
    isGeneratingDetails,
    loadingVersionIds,
    isComparing
  };
}