import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PrefillToCopyMaker } from '../../../features/quickPolish/types';

// Component imports
import CopyForm from '../../CopyForm';
import AppSpinner from '../../ui/AppSpinner';
import FloatingActionBar from '../../FloatingActionBar';
import FloatingOutputNavigation from '../../FloatingOutputNavigation';
import LeftFloatingActionBar from '../../LeftFloatingActionBar';
import CopyMakerSidebar from '../CopyMakerSidebar';
import UrlParamLoader from '../../UrlParamLoader';
import LoadingOverlay from '../../ui/LoadingOverlay';
import PublicFooter from '../../PublicFooter';

// Section components
import HeaderBar from './sections/HeaderBar';
import TemplateLoader from './sections/TemplateLoader';
import ResultsPanel from './sections/ResultsPanel';
import EmptyState from './sections/EmptyState';
import AiPromptSection from './sections/AiPromptSection';

// Modal components
import PrefillSaveDialog from './modals/PrefillSaveDialog';
import JsonLdViewer from './modals/JsonLdViewer';
import QuickSetupWizard from '../../wizard/QuickSetupWizard';
import BrandVoiceModal from '../../BrandVoiceModal';
import AiModelValidationModal from '../../AiModelValidationModal';
import StartHubModal, { StartHubConfig } from '../../StartHubModal';
import TokenLimitModal from '../../TokenLimitModal';
import ProcessingModal from '../../ProcessingModal';
import { RegenerateAnalysisModal } from '../../RegenerateAnalysisModal';

// Custom hooks
import { usePrefillEditing } from './hooks/usePrefillEditing';
import { useTemplates } from './hooks/useTemplates';
import { useGeneration, ORIGINAL_VERSION_ID } from './hooks/useGeneration';
import { useExports } from './hooks/useExports';
import { useBrandVoices } from '../../../hooks/useBrandVoices';
import { useMode } from '../../../context/ModeContext';
import { useSession } from '../../../context/SessionContext';

// Utils
import { mapPrefillToFormState } from './utils/mapPrefillToFormState';
import { convertLanguageCodeToFormDataLanguage } from '../../../utils/languageDetection';
import { logAutoApply } from '../../../utils/debugAutoApply';
import { isFieldVisible } from '../../../utils/fieldVisibility';
import { getSectionsToExpand } from '../../../utils/templateLoader';

// Types
import { FormState, User, GeneratedContentItem, GeneratedContentItemType, Model, SavedOutput, ScoringContext } from '../../../types';
import { calculateTargetWordCount } from '../../../services/api/utils';
import { hasAnyPopulatedFields } from '../../../utils/formUtils';
import { playSuccessSound } from '../../../utils/soundEffects';
import { generateBlendedCopy } from '../../../services/api/blendedCopy';
import { v4 as uuidv4 } from 'uuid';
import { validateApiKey, getAvailableModels, getModelLabel } from '../../../services/api/modelValidation';
import { generateContentScores, generateSeoMetadata, calculateGeoScore } from '../../../services/apiService';
import { getUserPreferences, dismissStartHub } from '../../../services/supabaseClient';
import { sessionManager } from '../../../services/sessionService';

interface FillFormCardProps {
  hasData: boolean;
  onClear: () => void;
  formSectionRef: React.RefObject<HTMLDivElement>;
}

const FillFormCard: React.FC<FillFormCardProps> = ({ hasData, onClear, formSectionRef }) => {
  const [confirming, setConfirming] = React.useState(false);

  const handleClick = () => {
    if (hasData) {
      setConfirming(true);
    } else {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleConfirm = () => {
    setConfirming(false);
    onClear();
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900/10 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Fill the form
        </label>
      </div>

      {confirming ? (
        <div className="flex-1 flex flex-col justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
            This will clear your current form. Continue?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 font-medium rounded-lg py-2 px-3 text-sm transition-colors text-white"
              style={{ backgroundColor: '#ff6b35' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e55a27')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ff6b35')}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 font-medium rounded-lg py-2 px-3 text-sm transition-colors bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClick}
            className="w-full font-medium rounded-lg py-2 px-4 transition-all inline-flex items-center justify-center shadow-sm hover:shadow text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ gap: '6px' }}
          >
            <span>Go to form</span>
          </button>
          <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-2">
            Full control over every field.
          </p>
        </>
      )}
    </div>
  );
};

interface CopyMakerTabProps {
  currentUser?: User;
  formState: FormState;
  setFormState: (state: FormState) => void;
  onClearAll: () => void;
  loadedTemplateId: string | null;
  setLoadedTemplateId: (id: string | null) => void;
  loadedTemplateName: string;
  setLoadedTemplateName: (name: string) => void;
  loadedTemplateCategory?: string;
  setLoadedTemplateCategory?: (category: string) => void;
  onEvaluateInputs?: () => void;
  onSaveTemplate?: () => void;
  onSaveOutput?: () => void;
  onViewPrompts?: () => void;
  onCancel?: () => void;
  onOpenTemplateSuggestion?: () => void;
  loadFormStateFromPrefill: any;
  loadFormStateFromTemplate: any;
  addProgressMessage: (message: string) => void;
  startHubTrigger?: number;
  forceStartHubTrigger?: number;
}

const CopyMakerTab: React.FC<CopyMakerTabProps> = ({
  currentUser,
  formState,
  setFormState,
  onClearAll,
  loadedTemplateId,
  setLoadedTemplateId,
  loadedTemplateName,
  setLoadedTemplateName,
  loadedTemplateCategory,
  setLoadedTemplateCategory,
  onEvaluateInputs,
  onSaveTemplate,
  onSaveOutput,
  onViewPrompts,
  onCancel,
  onOpenTemplateSuggestion = () => {},
  loadFormStateFromTemplate,
  loadFormStateFromPrefill,
  addProgressMessage,
  startHubTrigger,
  forceStartHubTrigger,
}) => {
  // Get contexts early (before callbacks that use them)
  const { setCurrentSession } = useSession();
  const { mode, preferredMode, setMode, forceAdvanced, restoreSavedOutputMode, lastForcedReason, dismissForcedExplanation } = useMode();
  const navigate = useNavigate();

  // ── Accordion layout state ──────────────────────────────────────────────────
  // Single source of truth for all section expanded/collapsed states.
  // No localStorage involved — resets deterministically on view switch and clear.
  const DEFAULT_EXPANDED: Record<string, boolean> = {
    'what-youre-creating': true,
    'audience-targeting': false,
    'tone-style': false,
    'strategic-messaging': false,
    'optimization-optional': false,
  };

  const instanceIdRef = React.useRef(Math.random().toString(16).slice(2));
  const instanceId = instanceIdRef.current;

  const [expandedSections, _setExpandedSections] = useState<Record<string, boolean>>(DEFAULT_EXPANDED);

  const setExpandedSectionsDbg = React.useCallback(
    (nextOrUpdater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>), reason: string) => {
      if (typeof nextOrUpdater === 'function') {
        _setExpandedSections(prev => {
          const next = nextOrUpdater(prev);
          console.log('[CopyMaker]', instanceId, 'SET_EXPANDED reason=', reason, 'next=', next);
          return next;
        });
      } else {
        console.log('[CopyMaker]', instanceId, 'SET_EXPANDED reason=', reason, 'next=', nextOrUpdater);
        _setExpandedSections(nextOrUpdater);
      }
    },
    [instanceId]
  );

  // modeRef: lets callbacks read current mode without mode being a useCallback dep.
  // This prevents loadFormStateFromSession from being recreated on every mode change,
  // which was causing UrlParamLoader to re-fire and double-load sessions.
  const modeRef = React.useRef(mode);
  React.useEffect(() => { modeRef.current = mode; }, [mode]);

  // forceAdvancedRef: same pattern — stable ref to avoid deps-churn.
  const forceAdvancedRef = React.useRef(forceAdvanced);
  React.useEffect(() => { forceAdvancedRef.current = forceAdvanced; }, [forceAdvanced]);

  // Entity ID guard: prevents expanding sections twice for the same entity (session/output).
  // Primary fix is modeRef (stable callback), this is defense-in-depth for any remaining
  // scenario where handleExpandSectionsForLoad fires twice for the exact same entity.
  const lastExpandedForEntityRef = React.useRef<string>('');

  // STEP 2: single-shot guard — prevents repeated auto-expand on re-renders
  const hasAppliedAutoExpandRef = React.useRef(false);

  // STEP 3: mode-switch wins — if user just switched view, auto-expand is blocked
  const lastActionWasModeSwitch = React.useRef(false);

  React.useEffect(() => {
    console.log('[CopyMaker]', instanceId, 'MOUNT');
    return () => { console.log('[CopyMaker]', instanceId, 'UNMOUNT'); };
  }, [instanceId]);

  // Track when original copy is first entered to preserve timestamp
  React.useEffect(() => {
    const hasOriginalCopy = formState.originalCopy?.trim();
    const hasTimestamp = formState.originalCopyEnteredAt;

    // If we have content but no timestamp, set it now
    if (hasOriginalCopy && !hasTimestamp) {
      setFormState({
        ...formState,
        originalCopyEnteredAt: new Date().toISOString()
      });
    }
  }, [formState.originalCopy, formState.originalCopyEnteredAt]);

  const handleToggleSection = useCallback((key: string) => {
    lastActionWasModeSwitch.current = false;
    setExpandedSectionsDbg(prev => ({ ...prev, [key]: !prev[key] }), 'user_toggle:' + key);
  }, [setExpandedSectionsDbg]);

  // Called by template/session/prefill loads — opens only the relevant sections.
  // Guards: blocked if lastActionWasModeSwitch is true, or if single-shot already fired.
  const handleExpandSectionsByKeys = useCallback((keys: string[]) => {
    if (lastActionWasModeSwitch.current) {
      console.log('[CopyMaker]', instanceId, 'AUTO EXPAND blocked (mode switch wins)', keys);
      return;
    }
    if (hasAppliedAutoExpandRef.current) {
      console.log('[CopyMaker]', instanceId, 'AUTO EXPAND blocked (single-shot already fired)', keys);
      return;
    }
    hasAppliedAutoExpandRef.current = true;
    const next = { ...DEFAULT_EXPANDED };
    keys.forEach(k => { if (k in next) next[k] = true; });
    next['what-youre-creating'] = true;
    setExpandedSectionsDbg(next, 'load_expand');
  }, [instanceId, setExpandedSectionsDbg]);

  // STEP 1: single wrapper — ALL user-initiated mode changes go through here.
  // Resets accordion + blocks auto-expand from re-firing.
  const handleSetMode = useCallback((newMode: typeof mode) => {
    console.log('[CopyMaker]', instanceId, 'MODE SWITCH', newMode);
    lastActionWasModeSwitch.current = true;
    hasAppliedAutoExpandRef.current = false;
    setMode(newMode);
    setExpandedSectionsDbg({ ...DEFAULT_EXPANDED }, 'mode_switch_reset');
  }, [setMode, instanceId, setExpandedSectionsDbg]);

  // Wrapper used by explicit load events (template/session/prefill/saved-output).
  // Resets guards so expansion fires fresh for this load.
  const handleExpandSectionsForLoad = useCallback((keys: string[]) => {
    lastActionWasModeSwitch.current = false;
    hasAppliedAutoExpandRef.current = false;
    handleExpandSectionsByKeys(keys);
  }, [handleExpandSectionsByKeys]);
  // ────────────────────────────────────────────────────────────────────────────

  // Add the missing load functions that UrlParamLoader needs
  const loadFormStateFromSession = React.useCallback((session: any) => {
    // This function should be passed from parent, but we can implement it here as a fallback
    if (!session) {
      console.error('Invalid session data:', session);
      toast.error('Cannot load session: Invalid session data');
      return;
    }

    console.log('📥 Loading session:', {
      sessionId: session.id,
      sessionName: session.session_name,
      hasInputData: !!session.input_data,
      hasImprovedCopy: !!session.improved_copy,
      hasAlternativeCopy: !!session.alternative_copy,
      inputDataKeys: session.input_data ? Object.keys(session.input_data) : []
    });

    setFormState(prevState => {
      const inputData = session.input_data || {};

      // Reconstruct copyResult from saved session data
      let copyResult = { generatedVersions: [] };
      if (session.improved_copy || session.alternative_copy) {
        const generatedVersions: GeneratedContentItem[] = [];

        if (session.improved_copy) {
          generatedVersions.push({
            content: session.improved_copy,
            type: 'Generated Copy 1',
            sourceDisplayName: 'Generated Copy 1',
            score: undefined
          } as GeneratedContentItem);
        }

        if (session.alternative_copy) {
          generatedVersions.push({
            content: session.alternative_copy,
            type: 'Generated Copy 2',
            sourceDisplayName: 'Generated Copy 2',
            score: undefined
          } as GeneratedContentItem);
        }

        copyResult = {
          improvedCopy: session.improved_copy || '',
          alternativeCopy: session.alternative_copy,
          generatedVersions
        };
      }

      // Build the restored state carefully to ensure all fields are present
      const restoredState = {
        ...prevState, // Start with current state as base
        ...inputData, // Override with saved input data
        // Explicitly set session metadata
        sessionId: session.id,
        customerId: session.customer_id || undefined,
        customerName: session.customer?.name || undefined,
        // Restore the generated copy results
        copyResult,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        // Ensure critical fields are never undefined
        projectDescription: inputData.projectDescription || '',
        loadedSessionName: session.session_name || '', // Track original session name to detect rename/fork
        model: inputData.model || prevState.model,
        outputType: inputData.outputType || session.output_type || prevState.outputType,
        keywordsExplicit: !!(inputData.keywords?.trim())
      };

      console.log('✅ Session state restored:', {
        sessionId: restoredState.sessionId,
        projectDescription: restoredState.projectDescription,
        model: restoredState.model,
        outputType: restoredState.outputType,
        hasCustomer: !!restoredState.customerId,
        hasCopyResult: !!restoredState.copyResult && restoredState.copyResult.generatedVersions.length > 0
      });

      return restoredState;
    });

    // Update the SessionContext with the actual session name from the database
    setCurrentSession(session.id, session.session_name || 'Untitled Session');

    // Force Advanced mode when loading saved sessions (to show all populated fields).
    // Use modeRef so this callback doesn't change every time mode changes.
    // Changing mode would recreate this callback, causing UrlParamLoader to re-fire its
    // effect (which includes this callback in its deps) — the root cause of double-loads.
    if (modeRef.current !== 'advanced') {
      forceAdvancedRef.current('session_load', session.session_name || 'Untitled');
    }

    console.log('[CopyMaker]', instanceIdRef.current, 'LOAD EFFECT FIRED', { type: 'session', id: session.id });

    // Entity ID guard: if this exact session was just expanded, skip duplicate expansion.
    // Defense-in-depth — the primary fix is modeRef (stable callback), but this blocks
    // any remaining race condition where the callback fires twice for the same session.
    const sessionData = session.input_data || {};
    if (session.id && session.id === lastExpandedForEntityRef.current) {
      console.log('[CopyMaker]', instanceIdRef.current, 'DUPLICATE SESSION EXPAND BLOCKED', session.id);
    } else {
      lastExpandedForEntityRef.current = session.id || '';
      handleExpandSectionsForLoad(getSectionsToExpand(sessionData));
    }

    toast.success(`Session loaded: ${session.session_name || 'Untitled'}`);
  }, [setFormState, setCurrentSession, handleExpandSectionsForLoad]);

  const loadFormStateFromSavedOutput = React.useCallback((savedOutput: any) => {
    if (!savedOutput || !savedOutput.input_data || !savedOutput.output_data) {
      console.error('Invalid saved output data:', savedOutput);
      toast.error('Cannot load output: Invalid data');
      return;
    }

    console.log('📥 Loading saved output:', {
      outputId: savedOutput.id,
      hasInputData: !!savedOutput.input_data,
      hasOutputData: !!savedOutput.output_data
    });

    setFormState(prevState => {
      const inputData = savedOutput.input_data;
      const outputData = savedOutput.output_data;

      // If there's a comparison result with comparison details, we need to remap the versionIds
      // to match the new IDs that will be assigned to the loaded generatedVersions
      let processedOutputData = outputData;

      if (outputData?.comparisonResult?.comparisonDetails && outputData?.generatedVersions) {
        console.log('🔄 Remapping comparison versionIds to match loaded cards');

        // Create a mapping from old sourceDisplayName to new card
        const titleToNewCard: Record<string, any> = {};
        outputData.generatedVersions.forEach((version: any) => {
          const title = version.sourceDisplayName || version.type;
          titleToNewCard[title] = version;
        });

        // Update the comparisonDetails with new versionIds
        const updatedComparisonDetails = outputData.comparisonResult.comparisonDetails.map((detail: any) => {
          const matchingCard = titleToNewCard[detail.versionTitle];
          if (matchingCard && matchingCard.id) {
            return {
              ...detail,
              versionId: matchingCard.id
            };
          }
          return detail;
        });

        // Also update the best recommendation IDs
        const findNewId = (oldTitle?: string) => {
          if (!oldTitle) return undefined;
          return titleToNewCard[oldTitle]?.id;
        };

        processedOutputData = {
          ...outputData,
          comparisonResult: {
            ...outputData.comparisonResult,
            comparisonDetails: updatedComparisonDetails,
            bestForMarketingId: findNewId(outputData.comparisonResult.bestForMarketing),
            bestForClarityId: findNewId(outputData.comparisonResult.bestForClarity),
            bestForSimplicityId: findNewId(outputData.comparisonResult.bestForSimplicity)
          }
        };

        console.log('✅ Comparison versionIds remapped successfully');
      }

      // Build the restored state carefully
      const restoredState = {
        ...prevState,
        ...inputData,
        // Load the generated output with the saved results (with remapped IDs if applicable)
        copyResult: processedOutputData,
        // IMPORTANT: Clear session ID so a new session is created on next generation
        // This ensures credit tracking appears as a new entry
        sessionId: undefined,
        loadedSessionName: undefined,
        // Clear transient state
        isLoading: false,
        isEvaluating: false,
        generationProgress: [],
        // Ensure critical fields are present
        projectDescription: inputData.projectDescription || '',
        model: inputData.model || prevState.model,
        outputType: inputData.outputType || prevState.outputType,
        keywordsExplicit: !!(inputData.keywords?.trim())
      };

      console.log('✅ Saved output state restored');

      return restoredState;
    });

    // Restore the saved output's frozen mode (Quick/Standard/Advanced)
    // This is a frozen artifact - it reopens in the same mode it was saved with
    const savedMode = (savedOutput.saved_mode || 'advanced') as FormMode;
    restoreSavedOutputMode(savedMode);

    console.log('[CopyMaker]', instanceIdRef.current, 'LOAD EFFECT FIRED', { type: 'saved_output', id: savedOutput.id });

    // Entity ID guard: block duplicate expansion for the same saved output.
    if (savedOutput.id && savedOutput.id === lastExpandedForEntityRef.current) {
      console.log('[CopyMaker]', instanceIdRef.current, 'DUPLICATE SAVED OUTPUT EXPAND BLOCKED', savedOutput.id);
    } else {
      lastExpandedForEntityRef.current = savedOutput.id || '';
      handleExpandSectionsForLoad(getSectionsToExpand(savedOutput.input_data || {}));
    }

    // Show success message with mode note
    const modeLabel = savedMode === 'quick' ? 'Quick' : savedMode === 'standard' ? 'Standard' : 'Advanced';
    toast.success(`Saved output loaded in ${modeLabel} mode (as saved)`);
  }, [setFormState, restoreSavedOutputMode, handleExpandSectionsForLoad]);

  // Modal state
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [jsonLdContent, setJsonLdContent] = useState('');
  const [showSavePrefillModal, setShowSavePrefillModal] = useState(false);
  const [showQuickSetupWizard, setShowQuickSetupWizard] = useState(false);
  const [showBrandVoiceModal, setShowBrandVoiceModal] = useState(false);
  const [brandVoiceInitialContent, setBrandVoiceInitialContent] = useState('');
  const [showModelValidationModal, setShowModelValidationModal] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [availableModelsData, setAvailableModelsData] = useState<any[]>([]);
  const [attemptedModel, setAttemptedModel] = useState<Model>(formState.model);
  const [showTokenLimitModal, setShowTokenLimitModal] = useState(false);

  // Save session modal state
  const [showSaveSessionModal, setShowSaveSessionModal] = useState(false);
  const [saveSessionName, setSaveSessionName] = useState('');
  const [saveSessionDescription, setSaveSessionDescription] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Start Hub state
  const [showStartHub, setShowStartHub] = useState(false);
  const [startHubChecked, setStartHubChecked] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [shouldShowStartHub, setShouldShowStartHub] = useState<boolean | null>(null);
  const [wizardInitialConfig, setWizardInitialConfig] = useState<Pick<StartHubConfig, 'wizardMode' | 'wizardStep'> | null>(null);
  const previousPathRef = useRef<string>('');
  const location = useLocation();

  // Ref for template dropdown to focus when "Start from Template" is selected
  const templateDropdownRef = useRef<HTMLSelectElement>(null);

  // Ref for the form section — used by "Fill the form" card to scroll into view
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Comparison state
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isBlending, setIsBlending] = useState(false);
  const [isScoringNewOutputs, setIsScoringNewOutputs] = useState(false);
  const [isGeneratingBestElements, setIsGeneratingBestElements] = useState(false);
  const [comparisonOutdated, setComparisonOutdated] = useState(false);
  const [showRegenerateAnalysisModal, setShowRegenerateAnalysisModal] = useState(false);
  const [pendingMissingVersionsCount, setPendingMissingVersionsCount] = useState(0);
  const [showInitialAnalysisModal, setShowInitialAnalysisModal] = useState(false);

  useEffect(() => {
    if (comparisonResult) {
      setComparisonOutdated(false);
    }
  }, [comparisonResult]);
  const [blendComparisonData, setBlendComparisonData] = useState<any>(null);

  // Blend special instructions state
  const [showBlendInstructionsModal, setShowBlendInstructionsModal] = useState(false);
  const [blendSpecialInstructions, setBlendSpecialInstructions] = useState('');

  // Scoring context modal state (shared between ResultsPanel and Sidebar)
  const [showScoringContextModal, setShowScoringContextModal] = useState(false);
  const [modalInitialContext, setModalInitialContext] = useState<ScoringContext | undefined>(undefined);

  // State for hidden fields banner (shown when loading sessions/outputs with hidden populated fields)
  const [showHiddenFieldsBanner, setShowHiddenFieldsBanner] = useState(false);
  const [hiddenFieldsCount, setHiddenFieldsCount] = useState(0);

  // Ref to track wizard-triggered generation
  const shouldGenerateAfterWizardRef = useRef(false);

  // Refs for focusing on required fields
  const projectDescriptionRef = useRef<HTMLInputElement>(null);
  const businessDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const originalCopyRef = useRef<HTMLTextAreaElement>(null);

  // Create a ref to store the clear function that will be defined later
  const clearAllRef = useRef<(() => void) | null>(null);

  // Custom hooks
  const {
    isPrefillEditingMode,
    prefillEditingData,
    handleSavePrefill,
    handleCancelPrefillEditing
  } = usePrefillEditing(currentUser, formState, loadFormStateFromPrefill);

  const {
    fetchedTemplates,
    filteredAndGroupedTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    templateSearchQuery,
    setTemplateSearchQuery,
    isLoadingTemplates,
    templateLoadError,
    handleTemplateSelection
  } = useTemplates(currentUser, loadFormStateFromTemplate, setLoadedTemplateId, setLoadedTemplateName, setLoadedTemplateCategory, onClearAll, mode, setMode, forceAdvanced, formState, handleExpandSectionsForLoad);

  const {
    handleGenerate: baseHandleGenerate,
    handleOnDemandGeneration: baseHandleOnDemandGeneration,
    handleModifyContent: baseHandleModifyContent,
    handlePerformanceBoost: baseHandlePerformanceBoost,
    handleGenerateFaqSchema: baseHandleGenerateFaqSchema,
    handleCancelOperation,
    compareOutputsWithGrok,
    generateDetailedAnalysis,
    ensureVersionDeepAnalysis,
    isGeneratingDetails,
    loadingVersionIds,
    isComparing
  } = useGeneration(
    currentUser,
    formState,
    setFormState,
    addProgressMessage,
    () => setShowTokenLimitModal(true),
    (newOutputCount) => {
      // Show modal to ask if user wants to regenerate analysis
      if (comparisonResult) {
        setPendingMissingVersionsCount(newOutputCount);
        setShowRegenerateAnalysisModal(true);
      }
    }
  );

  const handleGenerate = async () => {
    // Clear comparison when starting fresh generation (since all outputs will be replaced)
    setComparisonResult(null);
    setBlendComparisonData(null);
    setFormState(prev => ({
      ...prev,
      copyResult: prev.copyResult ? {
        ...prev.copyResult,
        comparisonResult: undefined
      } : prev.copyResult
    }));

    try {
      await baseHandleGenerate();

      // After successful generation, check if we should prompt for analysis
      // Show modal if we have outputs but NO comparison result yet
      setFormState(prev => {
        const hasOutputs = prev.copyResult?.generatedVersions && prev.copyResult.generatedVersions.length > 0;
        const hasComparison = prev.copyResult?.comparisonResult;

        if (hasOutputs && !hasComparison) {
          // Delay showing modal slightly to ensure UI has updated
          setTimeout(() => {
            setShowInitialAnalysisModal(true);
          }, 500);
        }

        return prev;
      });
    } catch (error: any) {
      // Check if this is an API key failure
      if (error.message === 'API_KEY_FAILED') {
        console.log('API key failed, opening model validation modal');
        setAttemptedModel(formState.model);
        setValidationError(`${getModelLabel(formState.model)} is unavailable. Please select an alternative model.`);

        // Get available models
        const availableModels = await getAvailableModels();
        setAvailableModelsData(availableModels.availableModels);
        setShowModelValidationModal(true);
      }
      // If it's not an API key error, the error has already been handled by useGeneration
    }
  };

  const handleOnDemandGeneration = async (actionType: string, sourceItem: GeneratedContentItem, persona?: string, instructions?: string) => {
    await baseHandleOnDemandGeneration(actionType, sourceItem, persona, instructions);
    // Keep comparison result - it will be updated when user clicks "Update Analysis"
    // No longer clearing comparison data to preserve analysis cards
  };

  const handleModifyContent = async (sourceItem: GeneratedContentItem, instruction: string) => {
    await baseHandleModifyContent(sourceItem, instruction);
    // Keep comparison result - it will be updated when user clicks "Update Analysis"
    // No longer clearing comparison data to preserve analysis cards
  };

  const handleBoost = async (sourceItem: GeneratedContentItem) => {
    await baseHandlePerformanceBoost(sourceItem);
  };

  const handleGenerateBestElements = async () => {
    if (!currentUser || !formState || !comparisonResult) return;
    const versions = (formState.copyResult?.generatedVersions || []).filter(v => !v.comparedContent);
    if (versions.length < 2) {
      toast.error('Need at least 2 versions to generate Best Elements Summary.');
      return;
    }
    setIsGeneratingBestElements(true);
    addProgressMessage('Analyzing best elements across all versions...');
    try {
      const { generateBestElements } = await import('../../../services/api/bestElements');
      const result = await generateBestElements(versions, comparisonResult, currentUser, formState.sessionId);
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          bestElementsResult: result,
        }
      }));
      addProgressMessage('Best Elements Summary ready!');
      toast.success('Best Elements Summary generated!');
      playSuccessSound();
      setTimeout(() => {
        const el = document.getElementById('best-elements-summary');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error: any) {
      console.error('Error generating best elements:', error);
      toast.error('Failed to generate Best Elements Summary. Please try again.');
    } finally {
      setIsGeneratingBestElements(false);
    }
  };

  const handleCompileBestElements = async () => {
    if (!currentUser || !formState) return;
    const bestElementsResult = formState.copyResult?.bestElementsResult;
    if (!bestElementsResult?.elements?.length) {
      toast.error('Generate Best Elements Summary first.');
      return;
    }
    const versions = (formState.copyResult?.generatedVersions || []).filter(v => !v.comparedContent);
    setIsGeneratingBestElements(true);
    addProgressMessage('Compiling best elements into a new version...');
    try {
      const { compileBestElements } = await import('../../../services/api/bestElements');
      const { generateAbsoluteScore } = await import('../../../services/api/absoluteScoring');
      const { saveAbsoluteScore } = await import('../../../services/supabaseClient');
      const { v4: uuidv4 } = await import('uuid');

      const compiledContent = await compileBestElements(
        bestElementsResult.elements,
        versions,
        formState,
        currentUser,
        formState.sessionId
      );

      const newItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Alternative,
        content: compiledContent,
        generatedAt: new Date().toISOString(),
        sourceDisplayName: 'Compiled: Best Elements',
        analysisMode: 'on_demand',
      };

      // Generate absolute score non-critically
      try {
        const absScore = await generateAbsoluteScore(compiledContent, currentUser, formState.sessionId);
        newItem.absoluteScore = absScore;
        if (currentUser?.id) saveAbsoluteScore(currentUser.id, newItem.id, absScore, formState.sessionId);
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
        }
      }));

      addProgressMessage('Compiled version created!');
      toast.success('Compiled: Best Elements added as a new output!');

      setTimeout(() => {
        const el = document.getElementById(`output-${newItem.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);

      if (comparisonResult) {
        setPendingMissingVersionsCount(1);
        setShowRegenerateAnalysisModal(true);
      }
    } catch (error: any) {
      console.error('Error compiling best elements:', error);
      toast.error(`Failed to compile: ${error.message}`);
    } finally {
      setIsGeneratingBestElements(false);
    }
  };

  const handleAddCards = (items: GeneratedContentItem[], afterCardId?: string) => {
    setFormState(prev => {
      const versions = prev.copyResult?.generatedVersions || [];
      if (afterCardId) {
        const insertIndex = versions.findIndex(v => v.id === afterCardId);
        if (insertIndex !== -1) {
          const updated = [
            ...versions.slice(0, insertIndex + 1),
            ...items,
            ...versions.slice(insertIndex + 1),
          ];
          return {
            ...prev,
            copyResult: { ...prev.copyResult, generatedVersions: updated },
          };
        }
      }
      return {
        ...prev,
        copyResult: {
          ...prev.copyResult,
          generatedVersions: [...versions, ...items],
        },
      };
    });
  };

  const handleDeleteOutput = async (itemToDelete: GeneratedContentItem) => {
    // Import cache utilities
    const { cleanScoreCache } = await import('../../../utils/versionScoreCache');

    setFormState(prev => {
      const remainingVersions = prev.copyResult!.generatedVersions.filter(item => item.id !== itemToDelete.id);
      const validVersionIds = remainingVersions.map(v => v.id);

      // Clean cache of deleted version
      const existingCache = prev.copyResult?.versionScores || {};
      const updatedCache = cleanScoreCache(existingCache, validVersionIds);

      return {
        ...prev,
        copyResult: {
          ...prev.copyResult!,
          generatedVersions: remainingVersions,
          versionScores: updatedCache
          // Keep comparisonResult - user requested it should always remain visible
        }
      };
    });
    // Keep comparison result visible
    setBlendComparisonData(null);
    toast.success('Output deleted');
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<GeneratedContentItem>) => {
    const { invalidateVersionCache } = await import('../../../utils/versionScoreCache');

    const contentUpdated = 'content' in updates;

    if (contentUpdated && comparisonResult) {
      setComparisonOutdated(true);
    }

    setFormState(prev => {
      let updatedCache = prev.copyResult?.versionScores || {};
      if (contentUpdated) {
        updatedCache = invalidateVersionCache(updatedCache, cardId);
      }

      return {
        ...prev,
        copyResult: prev.copyResult ? {
          ...prev.copyResult,
          generatedVersions: prev.copyResult.generatedVersions.map(item =>
            item.id === cardId ? { ...item, ...updates } : item
          ),
          versionScores: updatedCache
        } : prev.copyResult
      };
    });
  };

  const handleRescoreAll = () => {
    // Clear all cached scores and trigger fresh analysis
    setFormState(prev => ({
      ...prev,
      copyResult: prev.copyResult ? {
        ...prev.copyResult,
        versionScores: {} // Clear cache
      } : prev.copyResult
    }));

    // Trigger fresh comparison after clearing cache, preserving the active scoring context
    setTimeout(() => {
      compareOutputsWithGrok(false, comparisonResult?.scoringContext ?? undefined);
    }, 100);

    toast.info('Re-scoring all versions with fresh analysis...');
  };

  // SCORING SYSTEM UNIFIED: Comparative scoring is now the only scoring path.
  // This function was the last remaining path using legacy single-version scoring.
  // Now uses generateUnifiedComparison() for consistency with all other scoring flows.
  const handleAddToComparison = async (card: GeneratedContentItem) => {
    if (!currentUser || !comparisonResult) {
      return;
    }

    // Check if already in comparison
    const existingCache = formState.copyResult?.versionScores || {};
    if (existingCache[card.id]) {
      toast.info('This version is already in the comparison.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));

    try {
      // Import unified comparison (uses comparative scoring)
      const { generateUnifiedComparison } = await import('../../../services/api/unifiedComparison');

      // Determine scoring context
      const versionLabel = card.sourceDisplayName || card.type || 'New Version';
      const parsedKwList = formState.keywords
        ? [...new Set(formState.keywords.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean))]
        : [];
      const kwList = formState.keywordsExplicit ? parsedKwList : [];

      // Get all versions for comparative scoring (must evaluate all together)
      const allVersions = formState.copyResult?.generatedVersions || [];
      const versionsToCompare = allVersions.filter(v => !!v);

      // Run full comparative scoring with all versions
      const unifiedResult = await generateUnifiedComparison(
        formState.originalCopy?.trim() || undefined,
        versionsToCompare,
        currentUser,
        formState.sessionId,
        undefined,
        formState.model,
        undefined, // Phase 2 cleanup: cache not used for comparative scoring
        kwList,
        comparisonResult?.scoringContext
      );

      // Extract comparison result
      const { comparisonResult: newComparisonResult } = unifiedResult;

      // Update state with new comparison result
      setComparisonResult(newComparisonResult);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        copyResult: prev.copyResult ? {
          ...prev.copyResult,
          versionScores: {}, // Phase 2 cleanup: cache deprecated for comparative scoring
          comparisonResult: newComparisonResult,
          comparisonDeepAnalysisMeta: undefined
        } : prev.copyResult
      }));

      toast.success(`Added "${versionLabel}" to comparison!`);
    } catch (error) {
      console.error('Error adding to comparison:', error);
      toast.error('Failed to add to comparison. Please try again.');
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleScoreNewOutputs = async () => {
    if (!currentUser || !comparisonResult) return;

    const comparedIds = new Set(comparisonResult.rows.map((r: any) => r.versionId));
    const missingVersions = (formState.copyResult?.generatedVersions || []).filter(
      (v: GeneratedContentItem) => !v.comparedContent && !comparedIds.has(v.id)
    );

    if (missingVersions.length === 0) {
      toast.info('All outputs are already in the comparison.');
      return;
    }

    // Show modal to ask user if they want to regenerate analysis
    setPendingMissingVersionsCount(missingVersions.length);
    setShowRegenerateAnalysisModal(true);
  };

  // Open scoring context modal (used by sidebar and results panel)
  const handleOpenScoringModal = (initial?: ScoringContext) => {
    setModalInitialContext(initial);
    setShowScoringContextModal(true);
  };

  // Handle scoring context confirmation from modal (used by sidebar and results panel)
  const handleScoringContextConfirm = async (ctx: ScoringContext) => {
    setShowScoringContextModal(false);
    await compareOutputsWithGrok(false, ctx);
  };

  const performScoreAndNavigate = async (scoringContext?: import('../../types').ScoringContext) => {
    // comparative scoring state fix: reset stale comparison before rescoring
    if (!currentUser || !comparisonResult) return;

    const comparedIds = new Set(comparisonResult.rows.map((r: any) => r.versionId));
    const missingVersions = (formState.copyResult?.generatedVersions || []).filter(
      (v: GeneratedContentItem) => !v.comparedContent && !comparedIds.has(v.id)
    );

    if (missingVersions.length === 0) {
      return;
    }

    setIsScoringNewOutputs(true);

    try {
      console.log('[comparative-scoring] rescoring after adding new outputs');
      console.log('[comparative-scoring] missing versions:', missingVersions.length);

      // comparative scoring state fix: get ALL current versions for fresh comparison
      const allGeneratedVersions = formState.copyResult?.generatedVersions || [];
      const versionsToCompare = allGeneratedVersions.filter(v => !v.comparedContent);

      // Add original copy as baseline if present
      const originalCopyText = formState.originalCopy?.trim() || undefined;
      const { ORIGINAL_VERSION_ID } = await import('./hooks/useGeneration');

      let versionsWithOriginal = versionsToCompare;
      if (originalCopyText) {
        const hasOriginal = versionsToCompare.some(v => v.type === 'original');
        if (!hasOriginal) {
          const syntheticOriginal: GeneratedContentItem = {
            id: ORIGINAL_VERSION_ID,
            type: 'original' as any,
            content: originalCopyText,
            generatedAt: formState.originalCopyEnteredAt || new Date().toISOString(),
            sourceDisplayName: 'Original Copy',
            analysisMode: 'batch'
          };
          versionsWithOriginal = [syntheticOriginal, ...versionsToCompare];
        }
      }

      console.log('[comparative-scoring] version set key:', versionsWithOriginal.map(v => v.id).sort().join(','));

      // comparative scoring state fix: use unified comparison to respect feature flag
      const { generateUnifiedComparison } = await import('../../../services/api/unifiedComparison');

      const parsedKw = formState.keywords
        ? [...new Set(formState.keywords.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean))]
        : [];
      const scoringKeywords = formState.keywordsExplicit ? parsedKw : [];

      const existingCache = formState.copyResult?.versionScores || {};

      const contextToUse = scoringContext || comparisonResult?.scoringContext;

      const unifiedResult = await generateUnifiedComparison(
        originalCopyText,
        versionsWithOriginal,
        currentUser,
        formState.sessionId,
        undefined,
        formState.model,
        existingCache,
        scoringKeywords,
        contextToUse,
        formState.section || undefined
      );

      const { comparisonResult: newComparisonResult } = unifiedResult;

      console.log('[comparative-scoring] rebuilt comparison from scratch');
      console.log('[comparative-scoring] winner set to:', newComparisonResult.winnerVersionId);

      // comparative scoring state fix: enforce single winner and fresh row mapping
      const winnerId = newComparisonResult.winnerVersionId;
      const cleanedRows = newComparisonResult.rows.map((r: any) => ({
        ...r,
        isWinner: r.versionId === winnerId
      }));

      const finalComparisonResult = {
        ...newComparisonResult,
        rows: cleanedRows,
        scoringContext: contextToUse
      };

      // phase 2 scoring cleanup: comparative scoring doesn't use cache
      const updatedCache = existingCache;

      // comparative scoring state fix: clear stale winner flags before setting new state
      setComparisonResult(null);

      setTimeout(() => {
        setComparisonResult(finalComparisonResult);
        setFormState(prev => ({
          ...prev,
          copyResult: prev.copyResult ? {
            ...prev.copyResult,
            versionScores: updatedCache,
            comparisonResult: finalComparisonResult,
            comparisonDeepAnalysisMeta: undefined
          } : prev.copyResult
        }));

        toast.success(`Added ${missingVersions.length} new output(s) to comparison!`);

        // Run deep analysis for any versions that are missing it (skip-if-cached).
        // Pass finalComparisonResult directly so score lookups don't read stale state.
        for (const v of missingVersions) {
          ensureVersionDeepAnalysis(v.id, finalComparisonResult);
        }

        // Scroll to comparison section after successful scoring
        setTimeout(() => {
          const comparisonElement = document.getElementById('comprehensive-analysis');
          if (comparisonElement) {
            comparisonElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }, 50);
    } catch (error) {
      console.error('Error scoring new outputs:', error);
      toast.error('Failed to score new outputs. Please try again.');
    } finally {
      setIsScoringNewOutputs(false);
    }
  };

  const {
    isExporting,
    handleExportForm,
    isImporting,
    handleImportForm
  } = useExports(formState, setFormState, () => clearAllRef.current?.());

  // Check if required fields are filled (same logic as Generate button)
  const isFormComplete = () => {
    const hasProjectDescription = formState.projectDescription?.trim();
    const hasProductServiceName = formState.productServiceName?.trim();
    const hasBusinessDescription = formState.businessDescription?.trim();
    const hasOriginalCopy = formState.originalCopy?.trim();

    // Check if either create mode requirements OR improve mode requirements are met
    const createModeComplete = !!(hasProjectDescription && hasProductServiceName && hasBusinessDescription);
    const improveModeComplete = !!(hasProjectDescription && hasProductServiceName && hasOriginalCopy);

    return createModeComplete || improveModeComplete;
  };

  // Sync comparisonResult local state with formState.copyResult.comparisonResult
  // Also backfills improvementPct on rows loaded from saved state (where the field may be undefined)
  useEffect(() => {
    if (formState.copyResult?.comparisonResult) {
      const cr = formState.copyResult.comparisonResult;
      const needsBackfill = cr.rows?.some((r: any) => r.improvementPct === undefined);
      if (needsBackfill && cr.rows?.length) {
        const baselineRow = cr.rows.find(
          (r: any) => r.versionId === ORIGINAL_VERSION_ID || r.optionLabel === 'Original Copy'
        );
        const baselineScore: number | null = baselineRow?.finalScore ?? null;
        const backfilledRows = cr.rows.map((r: any) => {
          if (r.improvementPct !== undefined) return r;
          let improvementPct: number | null = null;
          if (baselineScore !== null && baselineScore > 0) {
            if (r.versionId === ORIGINAL_VERSION_ID || r.optionLabel === 'Original Copy') {
              improvementPct = 0;
            } else {
              improvementPct = Math.round(((r.finalScore - baselineScore) / baselineScore) * 100);
            }
          }
          return { ...r, improvementPct };
        });
        setComparisonResult({ ...cr, rows: backfilledRows });
      } else {
        setComparisonResult(cr);
      }
    } else {
      // Clear local state when formState doesn't have comparison result
      setComparisonResult(null);
    }
  }, [formState.copyResult?.comparisonResult]);

  // Check for hidden populated fields when formState changes (for session/output loading)
  useEffect(() => {
    // Only check if not in Advanced mode
    if (mode === 'advanced') {
      setShowHiddenFieldsBanner(false);
      return;
    }

    // Count hidden populated fields
    let hiddenCount = 0;
    const alwaysAllowedFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields', 'tab', 'model', 'sessionId', 'loadedSessionName', 'customerName'];

    Object.keys(formState).forEach((key) => {
      const fieldName = key as keyof FormState;
      const value = formState[fieldName];

      // Skip undefined, null, empty strings, empty arrays
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      // Skip always-allowed fields
      if (alwaysAllowedFields.includes(key)) {
        return;
      }

      // Check if field is hidden in current mode but has data
      if (!isFieldVisible(key, mode)) {
        hiddenCount++;
      }
    });

    // Only show banner if we have hidden fields and banner isn't already showing with same count
    if (hiddenCount > 0 && hiddenCount !== hiddenFieldsCount) {
      setHiddenFieldsCount(hiddenCount);
      setShowHiddenFieldsBanner(true);
    } else if (hiddenCount === 0) {
      setShowHiddenFieldsBanner(false);
    }
  }, [formState, mode, hiddenFieldsCount]);

  // Watch for wizard-triggered generation
  useEffect(() => {
    if (shouldGenerateAfterWizardRef.current) {
      shouldGenerateAfterWizardRef.current = false;
      handleGenerate();
    }
  }, [formState, handleGenerate]);

  // Session creation removed - sessions are now only created when:
  // 1. User generates copy (handleGenerate in useGeneration)
  // 2. User loads a saved session
  // This prevents empty sessions from cluttering the dashboard

  // Load Start Hub preferences on mount (load preference value first, don't show yet)
  useEffect(() => {
    let isMounted = true;

    const loadStartHubPreference = async () => {
      if (!currentUser?.id) return;

      try {
        const prefs = await getUserPreferences(currentUser.id);
        if (isMounted) {
          const shouldShow = !prefs || prefs.show_start_hub === true;
          console.log('🔍 [Load Prefs] User preferences:', prefs);
          console.log('🔍 [Load Prefs] Should show Start Hub:', shouldShow);
          setShouldShowStartHub(shouldShow);
          setPreferencesLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Start Hub preferences:', error);
        if (isMounted) {
          setShouldShowStartHub(true); // Default to showing on error
          setPreferencesLoaded(true);
        }
      }
    };

    loadStartHubPreference();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Show Start Hub only after preferences are loaded and conditions are met
  useEffect(() => {
    if (!preferencesLoaded || startHubChecked) return;

    console.log('🔍 [Show Check] preferencesLoaded:', preferencesLoaded);
    console.log('🔍 [Show Check] shouldShowStartHub:', shouldShowStartHub);
    console.log('🔍 [Show Check] hasPopulatedFields:', hasAnyPopulatedFields(formState));

    if (
      shouldShowStartHub === true &&
      !hasAnyPopulatedFields(formState)
    ) {
      console.log('✅ [Show Check] Showing Start Hub');
      setStartHubChecked(true);
      setShowStartHub(true);
    } else {
      console.log('❌ [Show Check] Not showing Start Hub');
      setStartHubChecked(true);
    }
  }, [preferencesLoaded, shouldShowStartHub, startHubChecked]);

  // Handle Start Hub selection
  const handleStartHubSelect = useCallback((config: StartHubConfig) => {
    setShowStartHub(false);

    switch (config.openFeature) {
      case 'copy_wizard':
        logAutoApply({
          ruleId: 'CM-AUTO-006',
          target: 'tab',
          before: formState.tab,
          after: config.wizardMode === 'polish' || config.wizardMode === 'improve' ? 'improve' : 'create',
          source: 'start_hub_selection',
          context: { openFeature: 'copy_wizard', wizardMode: config.wizardMode, wizardStep: config.wizardStep }
        });
        if (config.wizardMode === 'polish') {
          setFormState(prev => ({ ...prev, tab: 'improve' }));
        } else if (config.wizardMode === 'create') {
          setFormState(prev => ({ ...prev, tab: 'create' }));
        } else if (config.wizardMode === 'improve') {
          setFormState(prev => ({ ...prev, tab: 'improve' }));
        }
        // Store the wizard config to pass to the wizard
        setWizardInitialConfig({
          wizardMode: config.wizardMode,
          wizardStep: config.wizardStep
        });
        setShowQuickSetupWizard(true);
        break;

      case 'copy_form':
        // Note: Start Hub no longer forces mode change
        // Mode is user-controlled unless templates/wizard/sessions force Advanced
        // Focus on the specified field if provided
        if (config.focusField) {
          setTimeout(() => {
            const element = document.querySelector(`[name="${config.focusField}"]`) as HTMLElement;
            if (element) {
              element.focus();
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
        break;
    }
  }, [setFormState, setMode, formState.tab, mode]);

  // Handle Start Hub dismiss permanently
  const handleDismissStartHub = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      await dismissStartHub(currentUser.id);
      console.log('🔍 [Dismiss] Start Hub dismissed permanently');
      setShouldShowStartHub(false); // Update local state
      setShowStartHub(false);
    } catch (error) {
      console.error('Error dismissing Start Hub:', error);
      setShowStartHub(false);
    }
  }, [currentUser?.id]);

  // Open Start Hub (for "Start New Project" button)
  const openStartHub = useCallback(() => {
    setShowStartHub(true);
  }, []);

  // Handle Start Hub preference change (when toggle is changed in modal)
  const handleStartHubPreferenceChange = useCallback((shouldShow: boolean) => {
    console.log('🔍 [Pref Change] Start Hub preference changed to:', shouldShow);
    setShouldShowStartHub(shouldShow);

    // If toggled OFF, close the Start Hub modal immediately
    if (!shouldShow) {
      console.log('🔍 [Pref Change] Closing Start Hub modal because preference is now OFF');
      setShowStartHub(false);
    }
  }, []);

  // Respond to external Start Hub trigger (respects user preference)
  useEffect(() => {
    if (startHubTrigger && startHubTrigger > 0 && shouldShowStartHub === true) {
      console.log('🔍 [Trigger] External trigger fired, showing Start Hub');
      setStartHubChecked(false);
      setShowStartHub(true);
    }
  }, [startHubTrigger, shouldShowStartHub]);

  // Respond to force Start Hub trigger (ignores user preference - for manual button clicks)
  useEffect(() => {
    if (forceStartHubTrigger && forceStartHubTrigger > 0) {
      setStartHubChecked(false);
      setShowStartHub(true);
    }
  }, [forceStartHubTrigger]);

  // Listen for Start Hub config selection from App.tsx
  useEffect(() => {
    const handleStartHubConfig = (event: CustomEvent) => {
      const config = event.detail as StartHubConfig;
      console.log('🎯 Received Start Hub config via event:', config);
      handleStartHubSelect(config);
    };

    window.addEventListener('startHubConfigSelected', handleStartHubConfig as EventListener);

    return () => {
      window.removeEventListener('startHubConfigSelected', handleStartHubConfig as EventListener);
    };
  }, [handleStartHubSelect]);

  // Handle Start Hub config from location state (when navigating from another page)
  useEffect(() => {
    const state = location.state as any;
    if (state?.startHubConfig) {
      console.log('🎯 Received Start Hub config from navigation:', state.startHubConfig);
      handleStartHubSelect(state.startHubConfig);
      // Clear the state to prevent re-application
      window.history.replaceState({}, document.title);
    }
  }, [location, handleStartHubSelect]);

  // Handle Intent Polish prefill from location state OR sessionStorage
  // One-shot prefill; do not auto-generate or auto-score.
  const hasAppliedPrefillRef = useRef(false);

  useEffect(() => {
    // Guard: only apply once, even in React StrictMode
    if (hasAppliedPrefillRef.current) {
      return;
    }

    const PREFILL_KEY = 'CZ_PREFILL_TO_COPY_MAKER_V1';
    let prefill: PrefillToCopyMaker | undefined;
    let source: 'router-state' | 'sessionStorage' | null = null;

    // Try to read from location.state first
    const state = location.state as any;
    if (state?.prefill) {
      prefill = state.prefill as PrefillToCopyMaker;
      source = 'router-state';
      console.log('📦 Found prefill in router state');
    }

    // Fallback: read from sessionStorage
    if (!prefill) {
      const storedJson = sessionStorage.getItem(PREFILL_KEY);
      if (storedJson) {
        try {
          prefill = JSON.parse(storedJson) as PrefillToCopyMaker;
          source = 'sessionStorage';
          console.log('📦 Found prefill in sessionStorage');
        } catch (error) {
          console.error('Failed to parse prefill from sessionStorage:', error);
        }
      }
    }

    // No prefill found
    if (!prefill || !source) {
      return;
    }

    // Validate prefill data
    if (prefill.source !== 'intent_polish') {
      console.warn('Prefill source is not intent_polish, ignoring');
      return;
    }

    if (!prefill.original_input || typeof prefill.original_input !== 'string' || prefill.original_input.length === 0) {
      console.error('Invalid prefill: missing or empty original_input');
      toast.error('Invalid prefill data: missing original input');
      // Clean up
      sessionStorage.removeItem(PREFILL_KEY);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (!prefill.selected_output || typeof prefill.selected_output !== 'string' || prefill.selected_output.length === 0) {
      console.error('Invalid prefill: missing or empty selected_output');
      toast.error('Invalid prefill data: missing selected output');
      // Clean up
      sessionStorage.removeItem(PREFILL_KEY);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Mark as applied BEFORE applying to prevent double-application in StrictMode
    hasAppliedPrefillRef.current = true;

    // Convert language code to full language name for form state
    const convertedLanguage = prefill.language ? convertLanguageCodeToFormDataLanguage(prefill.language) : undefined;

    console.log('✅ Prefill applied in Copy Maker', {
      source,
      originalLength: prefill.original_input.length,
      outputLength: prefill.selected_output.length,
      contentType: prefill.content_type,
      hasIntent: !!prefill.intent,
      languageCode: prefill.language || 'not provided',
      languageConverted: convertedLanguage || 'not converted',
      selectedOutputWordCount: prefill.selected_output_word_count || 'not provided',
      willSetWordCountToCustom: !!prefill.selected_output_word_count
    });

    // Apply prefill to form state
    // Set mode to "Improve existing copy" and populate all relevant fields
    // This does NOT trigger auto-generation, auto-scoring, or auto-voice analysis
    logAutoApply({
      ruleId: 'CM-AUTO-005',
      target: 'field',
      before: { tab: 'unknown', originalCopy: '', section: '', targetAudience: '', tone: '', callToAction: '', language: '', wordCount: '', customWordCount: 0 },
      after: {
        tab: 'improve',
        originalCopy: prefill.selected_output?.substring(0, 50) + '...',
        section: prefill.intent?.label,
        targetAudience: prefill.intent?.audience,
        tone: prefill.intent?.tone,
        callToAction: prefill.intent?.cta,
        language: convertedLanguage,
        wordCount: 'custom',
        customWordCount: prefill.selected_output_word_count || 0
      },
      source,
      context: {
        contentType: prefill.content_type,
        hasIntent: !!prefill.intent,
        languageCode: prefill.language,
        originalInputLength: prefill.original_input.length,
        selectedOutputLength: prefill.selected_output.length,
        selectedOutputWordCount: prefill.selected_output_word_count || 0
      }
    });
    setFormState(prev => {
      const updatedState = {
        ...prev,
        tab: 'improve', // Set to "Improve existing copy" mode
        originalCopy: prefill.selected_output, // Selected polished output → Original copy field
        specialInstructions: prefill.special_instructions || prev.specialInstructions, // Special Instructions
        section: prefill.intent?.label || prev.section, // Intent → Section
        targetAudience: prefill.intent?.audience || prev.targetAudience, // Who is this for? → Target Audience
        tone: (prefill.intent?.tone as any) || prev.tone, // Tone
        callToAction: prefill.intent?.cta || prev.callToAction, // Call to Action
        // Apply optional metadata if available
        // Convert language code ('es') to full language name ('Spanish')
        language: convertedLanguage || prev.language,
        // Set word count to custom with the word count from the selected variant
        wordCount: prefill.selected_output_word_count ? 'Custom' : prev.wordCount,
        customWordCount: prefill.selected_output_word_count || prev.customWordCount,
      };

      console.log('📝 Form state updated with word count:', {
        wordCount: updatedState.wordCount,
        customWordCount: updatedState.customWordCount,
        prefillWordCount: prefill.selected_output_word_count
      });

      return updatedState;
    });

    // Show success message
    toast.success('Content loaded from Purpose Rewrite');

    // Show the banner prompting user to fill in required fields
    setShowIntentPolishBanner(true);

    // Auto-hide the banner after 2 seconds
    setTimeout(() => {
      setShowIntentPolishBanner(false);
    }, 2000);

    // Focus on Project Description field
    setTimeout(() => {
      if (projectDescriptionRef.current) {
        projectDescriptionRef.current.focus();
        projectDescriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Clean up IMMEDIATELY after apply to prevent re-application
    sessionStorage.removeItem(PREFILL_KEY);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate, setFormState]);

  // Show Start Hub when navigating back to Copy Maker from other sections
  useEffect(() => {
    const checkNavigationTrigger = () => {
      const currentPath = location.pathname;
      const previousPath = previousPathRef.current;

      // Only trigger if preferences are loaded
      if (!preferencesLoaded || shouldShowStartHub === null) {
        previousPathRef.current = currentPath;
        return;
      }

      // Show Start Hub if:
      // 1. We're on /copy-maker
      // 2. We navigated FROM a different route (not initial load - that's handled by mount effect)
      // 3. Form is empty (no work in progress)
      // 4. User has not permanently dismissed it
      const isNavigationFromOtherRoute = previousPath && previousPath !== '/copy-maker';

      console.log('🔍 [Nav Check] currentPath:', currentPath, 'previousPath:', previousPath);
      console.log('🔍 [Nav Check] isNavigationFromOtherRoute:', isNavigationFromOtherRoute);
      console.log('🔍 [Nav Check] shouldShowStartHub:', shouldShowStartHub);
      console.log('🔍 [Nav Check] hasPopulatedFields:', hasAnyPopulatedFields(formState));

      if (
        currentPath === '/copy-maker' &&
        isNavigationFromOtherRoute &&
        currentUser?.id &&
        !hasAnyPopulatedFields(formState) &&
        shouldShowStartHub === true
      ) {
        console.log('✅ [Nav Check] Showing Start Hub');
        setStartHubChecked(false);
        setShowStartHub(true);
      } else {
        console.log('❌ [Nav Check] Not showing Start Hub');
      }

      // Update previous path for next navigation
      previousPathRef.current = currentPath;
    };

    checkNavigationTrigger();
  }, [location.pathname, currentUser?.id, preferencesLoaded, shouldShowStartHub]);

  // Enhanced FAQ schema handler to show modal
  const handleGenerateFaqSchema = async (content: string) => {
    await baseHandleGenerateFaqSchema(content);
    // Additional logic to show the modal could be added here
    // For now, just use the base function
  };

  // Override onClearAll to also clear template selection, accordion state, and show Start Hub
  const handleClearAllOverride = useCallback(() => {
    onClearAll();
    setSelectedTemplateId('');
    setTemplateSearchQuery('');
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
    setComparisonResult(null);
    setBlendComparisonData(null);

    // Reset accordion layout to view defaults; allow auto-expand next time
    lastActionWasModeSwitch.current = false;
    hasAppliedAutoExpandRef.current = false;
    lastExpandedForEntityRef.current = '';
    setExpandedSectionsDbg({ ...DEFAULT_EXPANDED }, 'clear_all_reset');

    // Reset the checked flag so the mount effect can run again
    setStartHubChecked(false);

    // Show Start Hub after clearing all fields (unless user has disabled it)
    if (shouldShowStartHub === true) {
      console.log('🔍 [Clear] Showing Start Hub after clear');
      setShowStartHub(true);
    } else {
      console.log('🔍 [Clear] Not showing Start Hub (preference is false)');
    }
  }, [onClearAll, setSelectedTemplateId, setTemplateSearchQuery, setLoadedTemplateId, setLoadedTemplateName, setComparisonResult, shouldShowStartHub, setExpandedSectionsDbg]);

  // Assign the clear function to the ref so hooks can use it
  clearAllRef.current = handleClearAllOverride;

  // Handle applying quick start prefill
  const handleApplyPrefill = (prefill: { id: string; label: string; data: Partial<FormState> }) => {
    handleClearAllOverride();
    mapPrefillToFormState(prefill.data, formState, setFormState);

    if (mode !== 'advanced') {
      forceAdvanced('prefill_load', prefill.label);
    }

    console.log('[CopyMaker]', instanceIdRef.current, 'LOAD EFFECT FIRED', { type: 'prefill', id: prefill.id });
    handleExpandSectionsForLoad(getSectionsToExpand(prefill.data));
  };

  // Handle blend versions - can be triggered from Analysis card
  const handleBlendVersions = (analysisContent?: string) => {
    if (!formState.copyResult?.generatedVersions || formState.copyResult.generatedVersions.length === 0) {
      toast.error('No outputs to blend');
      return;
    }

    // If called from Analysis card, create a comparison result from the analysis
    if (analysisContent) {
      // Find the Analysis card (it has comparedContent)
      const analysisCard = formState.copyResult.generatedVersions.find(
        item => item.comparedContent !== undefined
      );

      if (analysisCard && analysisCard.comparedContent) {
        // Create a comparison result from the analysis for blending
        // Note: analysisCard.content is markdown text, not structured JSON,
        // so we create a simple structure with the compared items
        const mockComparisonResult = {
          comparisonDetails: analysisCard.comparedContent.items.map((item: any, idx: number) => ({
            versionTitle: item.label,
            score: 80, // Default score
            pros: ['Analyzed by AI', 'Selected for blending'],
            cons: [],
            bestUsedFor: 'General purpose marketing',
            metrics: {
              tone: 'Professional',
              readability: 'High',
              persuasion: 'High',
              emotionalAppeal: 'Medium',
              differentiation: 'High',
              conversionPotential: 'High'
            }
          })),
          strategicRecommendation: `Blend based on AI analysis insights. The analysis provided:\n${analysisContent.substring(0, 400)}...`,
          bestForMarketing: analysisCard.comparedContent.items[0]?.label || 'Version 1',
          bestForClarity: analysisCard.comparedContent.items[0]?.label || 'Version 1',
          bestForSimplicity: analysisCard.comparedContent.items[0]?.label || 'Version 1',
          bestVersionTitle: analysisCard.comparedContent.items[0]?.label || 'Version 1',
          overallScore: 80,
          reasoning: 'Based on AI analysis',
          strengths: ['Analyzed by AI'],
          improvements: [],
          bestVersionIndex: 0
        };

        // Store for blend API only - don't set comparisonResult to avoid showing ComparisonCard
        setBlendComparisonData(mockComparisonResult);
      } else {
        toast.error('Could not find Analysis data');
        return;
      }
    } else if (!comparisonResult && !blendComparisonData) {
      toast.error('Please run Analysis first to compare versions before blending');
      return;
    }

    // Open modal for special instructions
    setBlendSpecialInstructions('');
    setShowBlendInstructionsModal(true);
  };

  const executeBlendWithInstructions = async () => {
    setShowBlendInstructionsModal(false);
    setIsBlending(true);

    try {
      // Use blendComparisonData if available (from Analysis), otherwise use comparisonResult
      const comparisonDataToUse = blendComparisonData || comparisonResult;

      if (!comparisonDataToUse) {
        toast.error('Please run Analysis first to compare versions before blending');
        setIsBlending(false);
        return;
      }

      const result = await generateBlendedCopy(
        formState.copyResult.generatedVersions,
        comparisonDataToUse,
        currentUser?.id,
        formState,
        blendSpecialInstructions.trim() || undefined,
        currentUser?.email,
        formState.sessionId,
        formState.model
      );

      // Check if batch analysis was enabled in the original generation
      const isBatchMode =
        formState.generateSeoMetadata === true ||
        formState.generateScores === true ||
        formState.generateGeoScore === true;

      const analysisMode: 'batch' | 'on_demand' = isBatchMode ? 'batch' : 'on_demand';

      const blendedItem: GeneratedContentItem = {
        id: uuidv4(),
        type: GeneratedContentItemType.Alternative,
        content: result.content,
        generatedAt: new Date().toISOString(),
        sourceDisplayName: `Blended: ${result.sourceVersions.slice(0, 2).join(' + ')}${result.sourceVersions.length > 2 ? ` + ${result.sourceVersions.length - 2} more` : ''}`,
        blendInstructions: blendSpecialInstructions.trim() || undefined,
        analysisMode, // Set the analysis mode
        // For on-demand mode, show all on-demand buttons. For batch mode, don't set this field
        ...(analysisMode === 'on_demand' && {
          seoGenerationOptions: {
            urlSlugsEnabled: false,
            metaDescriptionsEnabled: false,
            h1VariantsEnabled: false,
            h2HeadingsEnabled: false,
            h3HeadingsEnabled: false,
            ogTitlesEnabled: false,
            ogDescriptionsEnabled: false
          }
        })
      };

      // Helper function to add progress messages
      const addProgressMessage = (msg: string) => {
        setFormState(prev => ({
          ...prev,
          generationProgress: [...(prev.generationProgress || []), msg]
        }));
      };

      // If batch mode is enabled, automatically generate the analyses BEFORE adding to state
      if (isBatchMode) {
        try {
          // Generate SEO metadata if enabled
          if (formState.generateSeoMetadata) {
            addProgressMessage('Generating SEO metadata for blended copy...');
            try {
              const seoMetadata = await generateSeoMetadata(
                blendedItem.content,
                formState,
                currentUser,
                addProgressMessage
              );
              blendedItem.seoMetadata = seoMetadata;
              addProgressMessage('SEO metadata generated for blended copy.');
            } catch (seoError) {
              console.error('Error generating SEO metadata for blend:', seoError);
              addProgressMessage('Error generating SEO metadata for blend, continuing...');
            }
          }

          // Generate content score if enabled
          if (formState.generateScores) {
            addProgressMessage('Generating score for blended copy...');
            try {
              const targetWordCount = calculateTargetWordCount(formState).target;
              const score = await generateContentScores(
                blendedItem.content,
                blendedItem.sourceDisplayName || 'Blended Copy',
                formState.model,
                currentUser,
                formState.tab === 'improve' ? formState.originalCopy : formState.businessDescription,
                targetWordCount,
                formState.sessionId,
                addProgressMessage
              );
              blendedItem.score = score;
              addProgressMessage('Score generated for blended copy.');
            } catch (scoreError) {
              console.error('Error generating score for blend:', scoreError);
              addProgressMessage('Error generating score for blend, continuing...');
            }
          }

          // Generate GEO score if enabled
          if (formState.generateGeoScore) {
            addProgressMessage('Calculating GEO score for blended copy...');
            try {
              const geoScore = await calculateGeoScore(
                blendedItem.content,
                formState,
                currentUser,
                addProgressMessage
              );
              blendedItem.geoScore = geoScore;
              addProgressMessage('GEO score calculated for blended copy.');
            } catch (geoError) {
              console.error('Error calculating GEO score for blend:', geoError);
              addProgressMessage('Error calculating GEO score for blend, continuing...');
            }
          }
        } catch (analysisError) {
          console.error('Error during batch analysis for blend:', analysisError);
          // Don't show error to user, blend was successful even if analyses failed
        }
      }
      // Generate absolute score for blended content
try {
  const { generateAbsoluteScore } = await import('../../../services/api/absoluteScoring');
  const { saveAbsoluteScore } = await import('../../../services/supabaseClient');
  const absScore = await generateAbsoluteScore(blendedItem.content, currentUser, formState.sessionId);
  blendedItem.absoluteScore = absScore;
  if (currentUser?.id) saveAbsoluteScore(currentUser.id, blendedItem.id, absScore, formState.sessionId);
} catch {
  // non-critical — proceed without absolute score
}

      // Now add the complete blended item (with all analyses) to state in one go
      setFormState(prev => ({
        ...prev,
        copyResult: {
          ...prev.copyResult,
          // Keep all existing outputs including analysis cards
          generatedVersions: [
            ...(prev.copyResult?.generatedVersions || []),
            blendedItem
          ]
        }
      }));

      // Clear only the temporary blend comparison data (not the main comparisonResult)
      setBlendComparisonData(null);

      toast.success('Blended version created successfully!');

      // Trigger modal if there's an existing comparison
      if (comparisonResult) {
        setPendingMissingVersionsCount(1);
        setShowRegenerateAnalysisModal(true);
      }

      setTimeout(() => {
        const newCard = document.querySelector(`[data-card-id="${blendedItem.id}"]`);
        if (newCard) {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (error) {
      console.error('Blend error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to blend versions');
    } finally {
      setIsBlending(false);
    }
  };

  const handleCancelBlending = () => {
    setIsBlending(false);
    toast.error('Blending cancelled');
  };

  // Brand Voice functionality
  const { createVoice } = useBrandVoices(formState.customerId);

  const handleSaveAsBrandVoice = (content: string) => {
    if (!formState.customerId) {
      toast.error('Please select a customer first');
      return;
    }
    setBrandVoiceInitialContent(content);
    setShowBrandVoiceModal(true);
  };

  const handleBrandVoiceSave = async (voiceData: any) => {
    await createVoice(voiceData);
    setShowBrandVoiceModal(false);
    setBrandVoiceInitialContent('');
  };

  // Save Session functionality
  const handleSaveSessionClick = () => {
    console.log('🔍 Save Session clicked. State:', {
      hasUser: !!currentUser,
      sessionId: formState.sessionId,
      hasResults: !!formState.copyResult?.generatedVersions?.length,
      resultsCount: formState.copyResult?.generatedVersions?.length || 0
    });

    if (!currentUser) {
      toast.error('Please log in to save sessions');
      return;
    }

    if (!formState.sessionId) {
      toast.error('No active session. Session will be created when you save.');
    }

    // Pre-fill the session name with "Copy Maker" prefix
    const projectDesc = formState.projectDescription || 'Copy Session';
    const suggestedName = `Copy Maker: ${projectDesc}`;
    setSaveSessionName(suggestedName);

    // Pre-fill description with some context
    const descParts: string[] = [];
    if (formState.section) descParts.push(`Section: ${formState.section}`);
    if (formState.pageType) descParts.push(`Page Type: ${formState.pageType}`);
    if (formState.tone) descParts.push(`Tone: ${formState.tone}`);
    setSaveSessionDescription(descParts.join(' • '));

    setShowSaveSessionModal(true);
  };

  const handleSaveSession = async () => {
    if (!currentUser) {
      toast.error('Please log in to save sessions');
      return;
    }

    if (!saveSessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    setIsSavingSession(true);
    try {
      let actualSessionId = formState.sessionId;

      // If no session exists yet, create one
      if (!actualSessionId) {
        const newSession = await sessionManager.ensureActiveSession(
          currentUser.id,
          formState.outputType,
          formState.projectDescription,
          formState.customerId !== 'none' ? formState.customerId : undefined,
          formState
        );
        actualSessionId = newSession;

        // Update form state with the new session ID
        setFormState(prev => ({
          ...prev,
          sessionId: actualSessionId
        }));

        console.log('Created new session for saving:', actualSessionId);
      }

      // Update the session with the custom name and description
      // Clean input data by removing transient UI state
      const cleanInputData = {
        ...formState,
        sessionId: actualSessionId,
        // Remove transient UI state
        isLoading: undefined,
        isEvaluating: undefined,
        generationProgress: undefined
      };

      await sessionManager.updateSession(
        actualSessionId,
        saveSessionName.trim(),
        cleanInputData
      );

      toast.success('Session saved successfully!');
      setShowSaveSessionModal(false);
      setSaveSessionName('');
      setSaveSessionDescription('');
    } catch (error: any) {
      console.error('Error saving session:', error);
      toast.error(error.message || 'Failed to save session');
    } finally {
      setIsSavingSession(false);
    }
  };

  // State for raw output modal
  const [showRawOutputModal, setShowRawOutputModal] = React.useState(false);

  // State for IntentPolish prefill banner
  const [showIntentPolishBanner, setShowIntentPolishBanner] = useState(false);

  return (
    <div className="relative min-h-screen pb-20">
      {/* URL Parameter Loader - processes templateId, sessionId, savedOutputId from URL */}
      <UrlParamLoader
        currentUser={currentUser}
        isInitialized={true}
        formState={formState}
        setFormState={setFormState}
        loadFormStateFromTemplate={loadFormStateFromTemplate}
        loadFormStateFromSession={loadFormStateFromSession}
        loadFormStateFromSavedOutput={loadFormStateFromSavedOutput}
        addProgressMessage={addProgressMessage}
        setLoadedTemplateId={setLoadedTemplateId}
        setLoadedTemplateName={setLoadedTemplateName}
        onClearAll={handleClearAllOverride}
      />

      {/* IntentPolish Prefill Banner - Auto-hide after 2s */}
      {showIntentPolishBanner && (
        <div className="mx-4 mt-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-700 rounded-lg p-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Please fill in your Project Description and Product/Service Name.
            </p>
          </div>
        </div>
      )}

      {/* Force Advanced Explanation Banner - Shows when system forced Advanced mode */}
      {lastForcedReason && (
        <div className="mx-4 mt-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-700 rounded-lg p-4 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Switched to Advanced mode
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {lastForcedReason.reason === 'template_load' && `Advanced mode is enabled because you loaded a template${lastForcedReason.details ? ` (${lastForcedReason.details})` : ''} — this ensures all fields are visible.`}
                  {(lastForcedReason.reason === 'wizard_apply' || lastForcedReason.reason === 'wizard_generate') && 'Advanced mode is enabled because the Quick Prompt Wizard generated multiple fields — this ensures all fields are visible.'}
                  {lastForcedReason.reason === 'session_load' && `Advanced mode is enabled because you loaded saved session data${lastForcedReason.details ? ` (${lastForcedReason.details})` : ''} — this ensures all populated fields are visible.`}
                  {lastForcedReason.reason === 'output_load' && 'Advanced mode is enabled because you loaded a saved output — this ensures all populated fields are visible.'}
                  {lastForcedReason.reason === 'prefill_load' && `Advanced mode is enabled because you loaded a prefill${lastForcedReason.details ? ` (${lastForcedReason.details})` : ''} — this ensures all fields are visible.`}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      const prevModeName = lastForcedReason.previousMode === 'quick' ? 'Quick' : lastForcedReason.previousMode === 'standard' ? 'Standard' : 'Advanced';
                      handleSetMode(lastForcedReason.previousMode);
                      toast.success(`Switched back to ${prevModeName} mode`);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded transition-colors"
                  >
                    Switch back to {lastForcedReason.previousMode === 'quick' ? 'Quick' : lastForcedReason.previousMode === 'standard' ? 'Standard' : 'Advanced'}
                  </button>
                  <button
                    onClick={() => dismissForcedExplanation()}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Fields Banner - REMOVED: No longer needed since we force Advanced for loaded content */}

      {/* Validation Failure Warning Banner (LIGHT validation layer) */}
      {formState.validationFailed && (
        <div className="mx-4 my-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-700 rounded-lg p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                  Output Validation Failed
                </h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                We couldn't format the AI response correctly. The automatic repair attempt was unsuccessful.
              </p>
              {formState.validationErrors && formState.validationErrors.length > 0 && (
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 mb-4 list-disc list-inside">
                  {formState.validationErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                  {formState.validationErrors.length > 3 && (
                    <li className="italic">...and {formState.validationErrors.length - 3} more issues</li>
                  )}
                </ul>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowRawOutputModal(true)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  Show Raw Output
                </button>
                <button
                  onClick={() => {
                    // Clear validation state and trigger regeneration
                    setFormState(prev => ({
                      ...prev,
                      validationFailed: false,
                      validationErrors: undefined,
                      rawFailedOutput: undefined
                    }));
                    handleGenerate();
                  }}
                  className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                >
                  Regenerate
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setFormState(prev => ({
                  ...prev,
                  validationFailed: false,
                  validationErrors: undefined,
                  rawFailedOutput: undefined
                }));
              }}
              className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Raw Output Modal */}
      {showRawOutputModal && formState.rawFailedOutput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Raw AI Output
              </h2>
              <button
                onClick={() => setShowRawOutputModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                {formState.rawFailedOutput}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formState.rawFailedOutput || '');
                  toast.success('Raw output copied to clipboard');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowRawOutputModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex min-h-0 items-start">
        {/* Sidebar column — rendered first so it sits on the left */}
        {(() => {
          const versions = formState.copyResult?.generatedVersions || [];
          const regularOutputs = versions.filter(c => !c.comparedContent);
          const analysisCards = versions.filter(c => c.comparedContent);
          const sorted = [...regularOutputs, ...analysisCards];
          return (
            <CopyMakerSidebar
              formState={formState}
              hasPopulatedFields={hasAnyPopulatedFields(formState)}
              onSaveSession={handleSaveSessionClick}
              onSaveTemplate={onSaveTemplate}
              onEvaluateInputs={onEvaluateInputs}
              isEvaluating={formState.isEvaluating}
              currentUser={currentUser}
              generatedOutputCards={versions}
              originalInputScore={undefined}
              onSaveOutput={onSaveOutput || (() => toast.info('Save output not available'))}
              onViewPrompts={onViewPrompts || (() => toast.info('View prompts not available'))}
              onGenerateFaqSchema={handleGenerateFaqSchema}
              comparisonResult={comparisonResult}
              versionDeepAnalysis={formState.copyResult?.versionDeepAnalysis}
              comparisonDeepAnalysisMeta={formState.copyResult?.comparisonDeepAnalysisMeta}
              loadingVersionIds={loadingVersionIds}
              sortedGeneratedVersions={sorted}
              onAlternative={(item) => handleOnDemandGeneration('alternative', item)}
              onRestyle={(item, persona, instructions) => handleOnDemandGeneration('restyle', item, persona, instructions)}
              onScore={(item) => handleOnDemandGeneration('score', item)}
              onModify={handleModifyContent}
              onDelete={handleDeleteOutput}
              onSaveAsBrandVoice={handleSaveAsBrandVoice}
              onBoost={handleBoost}
              onAddToComparison={handleAddToComparison}
              onUpdateCard={handleUpdateCard}
              onAddCards={handleAddCards}
              onCompareWithGrok={compareOutputsWithGrok}
              onBlendVersions={handleBlendVersions}
              isBlending={isBlending}
              onGenerateBestElements={handleGenerateBestElements}
              isGeneratingBestElements={isGeneratingBestElements}
              targetWordCount={calculateTargetWordCount(formState).target}
            />
          );
        })()}

        {/* Content column */}
        <div className="flex-1 min-w-0 space-y-8 px-4 md:px-6 pb-16">
        <div className="mx-auto space-y-8">
        {/* Prefill and Template Loaders */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 sm:p-6">
          <HeaderBar
            isExporting={isExporting}
            onExport={handleExportForm}
            isImporting={isImporting}
            onImport={handleImportForm}
          />
              
          <div className="flex flex-col sm:flex-row gap-3">
            <AiPromptSection
              onOpenTemplateSuggestion={() => setShowQuickSetupWizard(true)}
              currentUser={currentUser}
              tab={formState.tab}
              onTabChange={(newTab) => setFormState({ ...formState, tab: newTab })}
            />

            <TemplateLoader
              ref={templateDropdownRef}
              templateLoadError={templateLoadError}
              isLoadingTemplates={isLoadingTemplates}
              templateSearchQuery={templateSearchQuery}
              setTemplateSearchQuery={setTemplateSearchQuery}
              filteredAndGroupedTemplates={filteredAndGroupedTemplates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleTemplateSelection}
              onOpenTemplateSuggestion={() => setShowQuickSetupWizard(true)}
              currentUser={currentUser}
              formState={formState}
              onApplyPrefill={handleApplyPrefill}
            />

            {/* Fill the Form card */}
            <FillFormCard
              hasData={hasAnyPopulatedFields(formState)}
              onClear={handleClearAllOverride}
              formSectionRef={formSectionRef}
            />
          </div>
        </div>

        {/* Form Section */}
        <div ref={formSectionRef}>
          <CopyForm
            currentUser={currentUser}
            formState={formState}
            setFormState={setFormState}
            onGenerate={isPrefillEditingMode ? undefined : handleGenerate}
            onClearAll={handleClearAllOverride}
            loadedTemplateId={loadedTemplateId}
            setLoadedTemplateId={setLoadedTemplateId}
            loadedTemplateName={loadedTemplateName}
            setLoadedTemplateName={setLoadedTemplateName}
            onAccessDenied={() => setShowTokenLimitModal(true)}
            onEvaluateInputs={onEvaluateInputs}
            onSaveTemplate={onSaveTemplate}
            loadFormStateFromPrefill={loadFormStateFromPrefill}
            projectDescriptionRef={projectDescriptionRef}
            businessDescriptionRef={businessDescriptionRef}
            originalCopyRef={originalCopyRef}
            isPrefillEditingMode={isPrefillEditingMode}
            expandedSections={expandedSections}
            onToggleSection={handleToggleSection}
            onModeChange={handleSetMode}
          />
          
          {/* Prefill Action Buttons */}
          {isPrefillEditingMode && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowSavePrefillModal(true)}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium text-base px-5 py-3.5 transition-colors flex items-center justify-center"
              >
                Save Prefill
              </button>
              <button
                onClick={handleCancelPrefillEditing}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-base px-5 py-3 transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div id="results-section">
          {formState.copyResult?.generatedVersions && formState.copyResult.generatedVersions.length > 0 ? (
            <ResultsPanel
              generatedVersions={formState.copyResult.generatedVersions}
              formState={formState}
              currentUser={currentUser}
              onAlternative={(item) => handleOnDemandGeneration('alternative', item)}
              onRestyle={(item, persona, instructions) => handleOnDemandGeneration('restyle', item, persona, instructions)}
              onScore={(item) => handleOnDemandGeneration('score', item)}
              onGenerateFaqSchema={handleGenerateFaqSchema}
              onModify={handleModifyContent}
              onBoost={handleBoost}
              onDelete={handleDeleteOutput}
              targetWordCount={calculateTargetWordCount(formState).target}
              comparisonResult={comparisonResult}
              onBlendVersions={handleBlendVersions}
              isBlending={isBlending}
              onSaveAsBrandVoice={handleSaveAsBrandVoice}
              onCompareWithGrok={compareOutputsWithGrok}
              onRescoreAll={handleRescoreAll}
              onScoreNewOutputs={handleScoreNewOutputs}
              isScoringNewOutputs={isScoringNewOutputs}
              onAddToComparison={handleAddToComparison}
              isLoading={formState.isLoading}
              onUpdateCard={handleUpdateCard}
              comparisonOutdated={comparisonOutdated}
              versionDeepAnalysis={formState.copyResult?.versionDeepAnalysis}
              comparisonDeepAnalysisMeta={formState.copyResult?.comparisonDeepAnalysisMeta}
              onGenerateDetailedAnalysis={generateDetailedAnalysis}
              isGeneratingDetails={isGeneratingDetails}
              onEnsureVersionDeepAnalysis={ensureVersionDeepAnalysis}
              loadingVersionIds={loadingVersionIds}
              showScoringContextModal={showScoringContextModal}
              onSetShowScoringContextModal={setShowScoringContextModal}
              modalInitialContext={modalInitialContext}
              onSetModalInitialContext={setModalInitialContext}
              onScoringContextConfirm={handleScoringContextConfirm}
              bestElementsResult={formState.copyResult?.bestElementsResult}
              onCompileBestElements={handleCompileBestElements}
              isCompiling={isGeneratingBestElements}
            />
          ) : (
            <EmptyState
            tab={formState.tab}
            hasOriginalCopy={!!formState.originalCopy?.trim()}
          />
          )}
        </div>
        </div>
        </div>{/* end content column */}
      </div>{/* end flex row */}

      <FloatingOutputNavigation
        generatedVersions={formState.copyResult?.generatedVersions ?? []}
        hasComparison={!!comparisonResult}
        hasBestElements={!!formState.copyResult?.bestElementsResult}
      />

      {/* Progress Modal */}
      <AppSpinner
        isLoading={(formState.isLoading && !isComparing) || formState.isEvaluating}
        message={
          formState.isLoading
            ? "Generating copy..."
            : "Evaluating inputs..."
        }
        progressMessages={formState.generationProgress}
        onCancel={onCancel || handleCancelOperation}
      />

      {/* Scoring / Analysis Blocking Modal */}
      <ProcessingModal
        isOpen={isComparing || isScoringNewOutputs || isGeneratingDetails}
        message={
          isComparing
            ? "Scoring outputs..."
            : isScoringNewOutputs
            ? "Scoring new outputs..."
            : "Generating detailed breakdown..."
        }
        onCancel={() => {}}
      />

      {/* Initial Analysis Modal - shown after generation if no analysis exists */}
      <RegenerateAnalysisModal
        isOpen={showInitialAnalysisModal}
        onConfirm={async () => {
          setShowInitialAnalysisModal(false);
          await compareOutputsWithGrok(false);
          setTimeout(() => {
            const el = document.getElementById('comprehensive-analysis');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }}
        onCancel={() => {
          setShowInitialAnalysisModal(false);
        }}
        outputCount={formState.copyResult?.generatedVersions?.length || 0}
      />

      {/* Regenerate Analysis Modal */}
      <RegenerateAnalysisModal
        isOpen={showRegenerateAnalysisModal}
        onConfirm={async (context) => {
          setShowRegenerateAnalysisModal(false);
          await performScoreAndNavigate(context);
        }}
        onCancel={() => {
          setShowRegenerateAnalysisModal(false);
          setPendingMissingVersionsCount(0);
        }}
        outputCount={pendingMissingVersionsCount}
      />

      {/* Save Prefill Modal */}
      {showSavePrefillModal && prefillEditingData && (
        <PrefillSaveDialog
          isOpen={showSavePrefillModal}
          onClose={() => setShowSavePrefillModal(false)}
          onSave={handleSavePrefill}
          mode={prefillEditingData.mode}
          initialLabel={prefillEditingData.originalLabel || ''}
          currentUser={currentUser}
        />
      )}

      {/* JSON-LD Modal */}
      {showJsonLdModal && (
        <JsonLdViewer
          isOpen={showJsonLdModal}
          onClose={() => setShowJsonLdModal(false)}
          jsonLd={jsonLdContent}
        />
      )}

      {/* Blend Special Instructions Modal */}
      {showBlendInstructionsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowBlendInstructionsModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Blend Special Instructions (Optional)</h2>
              <button
                onClick={() => setShowBlendInstructionsModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add any special instructions for how the versions should be blended (optional). For example:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1 list-disc ml-5">
                <li>Make it more technical</li>
                <li>Focus on benefits for enterprise customers</li>
                <li>Add humor</li>
                <li>Make it shorter and punchier</li>
              </ul>
              <textarea
                value={blendSpecialInstructions}
                onChange={(e) => setBlendSpecialInstructions(e.target.value)}
                placeholder="Enter special instructions (optional)..."
                className="w-full h-32 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-4 resize-y"
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowBlendInstructionsModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={executeBlendWithInstructions}
                disabled={isBlending}
                className="flex-1 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBlending ? 'Blending...' : 'Blend Versions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Blending */}
      <LoadingOverlay
        isVisible={isBlending}
        message="Blending versions..."
        onCancel={handleCancelBlending}
      />

      {/* Quick Setup Wizard */}
      <QuickSetupWizard
        isOpen={showQuickSetupWizard}
        onClose={() => {
          setShowQuickSetupWizard(false);
          setWizardInitialConfig(null);
        }}
        currentUser={currentUser}
        selectedModel={formState.model}
        sessionId={formState.sessionId}
        initialMode={wizardInitialConfig?.wizardMode || undefined}
        initialStep={wizardInitialConfig?.wizardStep || undefined}
        onApplyToForm={(templateData) => {
          console.log('Received wizard data in CopyMakerTab:', templateData);
          console.log('Special Instructions received:', templateData.specialInstructions);

          // Only preserve outputStructure if it has actual content (from Extract Copy feature)
          // Otherwise clear it to generate plain text markdown
          const hasOutputStructure = templateData.outputStructure &&
                                      Array.isArray(templateData.outputStructure) &&
                                      templateData.outputStructure.length > 0;

          logAutoApply({
            ruleId: 'CM-AUTO-009',
            target: 'field',
            before: 'existing_form_state',
            after: 'wizard_data_merged',
            source: 'wizard_apply_to_form',
            context: {
              hasOutputStructure,
              fieldCount: Object.keys(templateData).length,
              preservedOutputStructure: hasOutputStructure
            }
          });
          setFormState(prevState => ({
            ...prevState,
            ...templateData,
            // Keep outputStructure if it exists (from URL extraction), otherwise clear it
            outputStructure: hasOutputStructure ? templateData.outputStructure : []
          }));
        }}
        onGenerate={(wizardData) => {
          // If wizard provides data, use it directly and trigger generation via useEffect
          if (wizardData) {
            console.log('Wizard data prioritizeWordCount:', wizardData.prioritizeWordCount);
            shouldGenerateAfterWizardRef.current = true;

            // Only preserve outputStructure if it has actual content (from Extract Copy)
            const hasOutputStructure = wizardData.outputStructure &&
                                        Array.isArray(wizardData.outputStructure) &&
                                        wizardData.outputStructure.length > 0;

            logAutoApply({
              ruleId: 'CM-AUTO-010',
              target: 'field',
              before: 'existing_form_state',
              after: 'wizard_data_merged_with_generation',
              source: 'wizard_generate_now',
              context: {
                hasOutputStructure,
                fieldCount: Object.keys(wizardData).length,
                preservedOutputStructure: hasOutputStructure,
                triggersGeneration: true
              }
            });
            setFormState(prevState => {
              const merged = {
                ...prevState,
                ...wizardData,
                // Keep outputStructure if it exists (from URL extraction), otherwise clear it
                outputStructure: hasOutputStructure ? wizardData.outputStructure : []
              };
              console.log('Merged state prioritizeWordCount:', merged.prioritizeWordCount);
              return merged;
            });
          } else {
            handleGenerate();
          }
        }}
      />

      {/* Brand Voice Modal */}
      {showBrandVoiceModal && currentUser && formState.customerId && (
        <BrandVoiceModal
          isOpen={showBrandVoiceModal}
          onClose={() => {
            setShowBrandVoiceModal(false);
            setBrandVoiceInitialContent('');
          }}
          onSave={handleBrandVoiceSave}
          customerId={formState.customerId}
          userId={currentUser.id}
          initialContent={brandVoiceInitialContent}
          initialMethod="ai"
        />
      )}

      {/* Save Session Modal */}
      {showSaveSessionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isSavingSession && setShowSaveSessionModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Session</h3>
              <button
                onClick={() => setShowSaveSessionModal(false)}
                disabled={isSavingSession}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveSessionName}
                  onChange={(e) => setSaveSessionName(e.target.value)}
                  placeholder="e.g., Copy Maker: Homepage Hero Section"
                  maxLength={100}
                  disabled={isSavingSession}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveSessionName.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={saveSessionDescription}
                  onChange={(e) => setSaveSessionDescription(e.target.value)}
                  placeholder="Add notes about this session..."
                  maxLength={500}
                  disabled={isSavingSession}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveSessionDescription.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveSessionModal(false)}
                  disabled={isSavingSession}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={isSavingSession || !saveSessionName.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingSession ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Model Validation Modal */}
      <AiModelValidationModal
        isOpen={showModelValidationModal}
        onClose={() => setShowModelValidationModal(false)}
        selectedModel={attemptedModel}
        selectedModelLabel={getModelLabel(attemptedModel)}
        availableModels={availableModelsData}
        onSelectModel={(model: Model) => {
          setFormState(prev => ({ ...prev, model }));
          toast.success(`Switched to ${getModelLabel(model)}`);
          setShowModelValidationModal(false);
        }}
        errorMessage={validationError}
      />

      {/* Start Hub Modal */}
      <StartHubModal
        isOpen={showStartHub}
        onClose={() => setShowStartHub(false)}
        onSelect={handleStartHubSelect}
        onDismissPermanently={handleDismissStartHub}
        templates={fetchedTemplates}
        isLoadingTemplates={isLoadingTemplates}
        onSelectTemplate={handleTemplateSelection}
        currentUserId={currentUser?.id}
        onPreferenceChange={handleStartHubPreferenceChange}
      />

      {/* Token Limit Modal */}
      <TokenLimitModal
        isOpen={showTokenLimitModal}
        onClose={() => setShowTokenLimitModal(false)}
      />

      <PublicFooter />
    </div>
  );
};

export { CopyMakerTab };
export default CopyMakerTab;