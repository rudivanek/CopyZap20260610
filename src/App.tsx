import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';
import { X, Copy, Check } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useSaveLastRoute, getLastRoute, clearLastRoute } from './hooks/useLastRoute';
import AppSpinner from './components/ui/AppSpinner';
import { useFormState } from './hooks/useFormState';
import { useMode } from './context/ModeContext';
import { useSession } from './context/SessionContext';
import { DEFAULT_FORM_STATE } from './constants';
import { v4 as uuidv4 } from 'uuid';

// Immediately loaded components (critical path)
import HomePage from './components/HomePage';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import ResetPassword from './components/ResetPassword';
import AuthCallback from './components/AuthCallback';
import MainMenu from './components/MainMenu';
import NotFound from './components/NotFound';
import Privacy from './components/Privacy';
import CookieConsent from './components/CookieConsent';
import DesktopRequired from './components/DesktopRequired';
import { AdminRoute } from './components/AdminRoute';
import { useIsSmallScreen } from './hooks/useIsSmallScreen';
import { GuidanceHintHost } from './components/shared/GuidanceHintHost';

const MIN_DESKTOP_WIDTH = 1024;

// Lazy loaded - Main app components
const Dashboard = lazy(() => import('./components/Dashboard'));
const CopyMakerTab = lazy(() => import('./components/copy-maker/CopyMakerTab/CopyMakerTab'));
const CopySnap = lazy(() => import('./components/CopySnap'));
const QuickPolishPage = lazy(() => import('./features/quickPolish/QuickPolishPage').then(m => ({ default: m.QuickPolishPage })));

// Lazy loaded - Admin components
const ManageUsers = lazy(() => import('./components/ManageUsers'));
const ManagePrefills = lazy(() => import('./components/ManagePrefills'));
const ManageSpecialInstructions = lazy(() => import('./components/ManageSpecialInstructions'));
const ManageCustomers = lazy(() => import('./components/ManageCustomers'));
const CustomerDetail = lazy(() => import('./components/CustomerDetail'));
const ManageWorkflows = lazy(() => import('./components/workflow/ManageWorkflows').then(m => ({ default: m.ManageWorkflows })));
const AdminDiagnostics = lazy(() => import('./components/AdminDiagnostics').then(m => ({ default: m.AdminDiagnostics })));

// Lazy loaded - Modals
const PromptDisplay = lazy(() => import('./components/PromptDisplay'));
const SaveTemplateModal = lazy(() => import('./components/SaveTemplateModal'));
const TemplateSuggestionModal = lazy(() => import('./components/TemplateSuggestionModal'));
const PromptEvaluation = lazy(() => import('./components/results/PromptEvaluation'));
const StartHubModal = lazy(() => import('./components/StartHubModal'));

// Lazy loaded - Videos page
const VideosPage = lazy(() => import('./components/VideosPage'));

// Lazy loaded - Blog components
const BlogList = lazy(() => import('./components/blog/BlogList'));
const BlogPost = lazy(() => import('./components/blog/BlogPost'));
const AdminBlogDashboard = lazy(() => import('./components/blog/AdminBlogDashboard'));
const AdminBlogEditor = lazy(() => import('./components/blog/AdminBlogEditor'));

// Lazy loaded - Help Center
const HelpCenter = lazy(() => import('./components/help/HelpCenter'));
const GettingStarted = lazy(() => import('./components/help/pages/GettingStarted'));
const CopyMakerIndex = lazy(() => import('./components/help/pages/CopyMakerIndex'));
const OptionalFeatures = lazy(() => import('./components/help/pages/OptionalFeatures'));
const VoiceStylesAndBlending = lazy(() => import('./components/help/pages/VoiceStylesAndBlending'));
const ExportAndFileManagement = lazy(() => import('./components/help/pages/ExportAndFileManagement'));
const TroubleshootingFAQs = lazy(() => import('./components/help/pages/TroubleshootingFAQs'));
const RealCaseWorkflowsIndex = lazy(() => import('./components/help/pages/RealCaseWorkflowsIndex'));
const QuickWizardNewCopy = lazy(() => import('./components/help/pages/workflows/QuickWizardNewCopy'));
const Contact = lazy(() => import('./components/help/pages/Contact'));
const Glossary = lazy(() => import('./components/help/pages/Glossary'));
const RecommendedSettings = lazy(() => import('./components/help/pages/RecommendedSettings'));
const CoreWorkflows = lazy(() => import('./components/help/pages/CoreWorkflows'));
const HowScoringWorks = lazy(() => import('./components/help/pages/HowScoringWorks'));
const SetupAndInputs = lazy(() => import('./components/help/pages/SetupAndInputs'));
const CreditsAndBilling = lazy(() => import('./components/help/pages/CreditsAndBilling'));
const DashboardAndHistory = lazy(() => import('./components/help/pages/DashboardAndHistory'));
const WorkflowBuilderHelp = lazy(() => import('./components/help/pages/WorkflowBuilder'));

// Dynamically import heavy services only when needed
const getApiServices = () => import('./services/apiService');
const getCopyGenerationServices = () => import('./services/api/copyGeneration');
const getApiUtils = () => import('./services/api/utils');
const getSupabaseClient = () => import('./services/supabaseClient');

// Wrapper component to enforce desktop-only access for authenticated users
const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSmallScreen = useIsSmallScreen(MIN_DESKTOP_WIDTH);

  // Wait for screen size check to complete
  if (isSmallScreen === null) {
    return null;
  }

  // If on mobile, show desktop required screen
  if (isSmallScreen) {
    return <DesktopRequired />;
  }

  // Otherwise, render the authenticated content
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { currentUser, isInitialized, initError, isSupabaseEnabled, isDemoMode, handleLogin, handleLogout, fallbackToDemoMode } = useAuth();
  const { formState, setFormState, loadFormStateFromTemplate, loadFormStateFromSession, loadFormStateFromSavedOutput, loadFormStateFromPrefill } = useFormState();
  const { clearCurrentSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useSaveLastRoute();
  
  
  // Prompt modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  // Template management state
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  const [loadedTemplateCategory, setLoadedTemplateCategory] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateSuggestionModalOpen, setIsTemplateSuggestionModalOpen] = useState(false);
  
  // Evaluation modal state
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationCopied, setEvaluationCopied] = useState(false);

  // Start Hub modal state - managed globally
  const [isStartHubOpen, setIsStartHubOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Start Hub trigger - increments to signal CopyMakerTab to open Start Hub (respects preferences)
  const [startHubTrigger, setStartHubTrigger] = useState(0);
  // Force Start Hub trigger - always opens regardless of preferences (for manual button clicks)
  const [forceStartHubTrigger, setForceStartHubTrigger] = useState(0);

  const handleOpenStartHub = React.useCallback(() => {
    setStartHubTrigger(prev => prev + 1);
  }, []);

  const handleForceOpenStartHub = React.useCallback(() => {
    setIsStartHubOpen(true);
  }, []);

  // Listen for forceOpenStartHub event dispatched by NavSidebar
  React.useEffect(() => {
    const handler = () => handleForceOpenStartHub();
    window.addEventListener('forceOpenStartHub', handler);
    return () => window.removeEventListener('forceOpenStartHub', handler);
  }, [handleForceOpenStartHub]);

  // Load templates when Start Hub opens
  React.useEffect(() => {
    const loadTemplates = async () => {
      if (!isStartHubOpen || !currentUser) return;

      setIsLoadingTemplates(true);
      try {
        const { getUserTemplates } = await getSupabaseClient();
        const result = await getUserTemplates(currentUser.id);
        setTemplates(result?.data || []);
      } catch (error) {
        console.error('Error loading templates for Start Hub:', error);
        setTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [isStartHubOpen, currentUser]);

  // Handle Start Hub config selection (for wizard/form modes)
  const handleStartHubSelect = React.useCallback((config: any) => {
    console.log('🎯 Start Hub config selected:', config);
    setIsStartHubOpen(false);

    // Handle navigation for different features
    if (config.openFeature === 'copy_wizard' || config.openFeature === 'copy_form') {
      // Navigate to Copy Maker if not already there
      if (location.pathname !== '/copy-maker') {
        navigate('/copy-maker', { state: { startHubConfig: config } });
      } else {
        // Already on copy-maker, dispatch custom event for immediate application
        window.dispatchEvent(new CustomEvent('startHubConfigSelected', { detail: config }));
      }
    } else if (config.openFeature === 'template_loader') {
      // Template selection - handled separately via onSelectTemplate
    }
  }, [location.pathname, navigate]);

  // Handle template selection from Start Hub
  const handleStartHubTemplateSelect = React.useCallback(async (templateId: string) => {
    setIsStartHubOpen(false);

    // Navigate to Copy Maker if not already there
    if (location.pathname !== '/copy-maker') {
      navigate('/copy-maker');
    }

    // Load the template
    try {
      await loadFormStateFromTemplate(templateId);
    } catch (error) {
      console.error('Error loading template from Start Hub:', error);
    }
  }, [location.pathname, navigate, loadFormStateFromTemplate]);

  // Progress callback
  const addProgressMessage = React.useCallback((message: string) => {
    setFormState(prevState => ({
      ...prevState,
      generationProgress: [...prevState.generationProgress, message]
    }));
  }, [setFormState]);

  // Removed last visited page tracking - always default to Copy Maker on app open

  // Manage help-center-active class for typography system
  React.useEffect(() => {
    if (location.pathname.startsWith('/help')) {
      document.body.classList.add('help-center-active');
    } else {
      document.body.classList.remove('help-center-active');
    }
  }, [location.pathname]);

  // Listen for DeepSeek fallback events for specific user
  React.useEffect(() => {
    const handleDeepSeekFallback = (event: CustomEvent) => {
      const { originalModel, fallbackModel } = event.detail;
      toast.info(
        `🔄 Using ${fallbackModel} as fallback (${originalModel} unavailable)`,
        {
          duration: 6000,
          style: {
            background: '#3b82f6',
            color: '#ffffff',
          },
        }
      );
    };

    window.addEventListener('deepseek-fallback', handleDeepSeekFallback as EventListener);

    return () => {
      window.removeEventListener('deepseek-fallback', handleDeepSeekFallback as EventListener);
    };
  }, []);

  // Clear all form state
  const handleClearAllOverride = () => {
    setFormState(DEFAULT_FORM_STATE);
    setLoadedTemplateId(null);
    setLoadedTemplateName('');
    clearCurrentSession(); // Clear the session context so a new session is created on next generate
    toast.success('Form cleared successfully!');
  };

  // Enhanced logout handler that navigates to homepage
  const handleEnhancedLogout = async () => {
    clearLastRoute();
    await handleLogout();
    navigate('/');
  };
  
  // Handle viewing prompts - generate from current form state
  const handleViewPrompts = async () => {
    try {
      const [{ calculateTargetWordCount }, { buildSystemPrompt, buildUserPrompt }] = await Promise.all([
        getApiUtils(),
        getCopyGenerationServices()
      ]);

      // Calculate target word count from current form state
      const targetWordCountInfo = calculateTargetWordCount(formState);

      // Build prompts from current form state
      const generatedSystemPrompt = buildSystemPrompt(formState, targetWordCountInfo);
      const generatedUserPrompt = buildUserPrompt(formState, targetWordCountInfo.target);

      // Set the prompts for display
      setSystemPrompt(generatedSystemPrompt);
      setUserPrompt(generatedUserPrompt);
      setShowPromptModal(true);
    } catch (error) {
      console.error('Error generating prompts:', error);
      // Fallback to last generated prompts if available
      const { getLastPrompts } = await getApiServices();
      const { systemPrompt, userPrompt } = getLastPrompts();
      setSystemPrompt(systemPrompt || 'No prompts available yet. Fill out the form and try again.');
      setUserPrompt(userPrompt || 'No prompts available yet. Fill out the form and try again.');
      setShowPromptModal(true);
    }
  };

  // Handle evaluate inputs
  const handleEvaluateInputs = async () => {
    if (!currentUser) {
      toast.error('Please log in to evaluate inputs.');
      return;
    }

    // Skip access check in demo mode
    if (!isDemoMode) {
      try {
        const { checkUserAccess } = await getSupabaseClient();
        const accessResult = await checkUserAccess(currentUser.id, currentUser.email || '');

        if (!accessResult.hasAccess) {
          toast.error(accessResult.message);
          return;
        }
      } catch (error) {
        console.error('Error checking user access for input evaluation:', error);
        toast.error("Unable to verify access. Please try again.");
        return;
      }
    }

    setFormState(prev => ({ ...prev, isEvaluating: true, generationProgress: [] }));
    addProgressMessage('Evaluating inputs...');

    try {
      // Ensure we have a session ID before evaluating
      let sessionId = formState.sessionId;

      if (!sessionId) {
        console.log('⚠️ No session ID found, creating one before evaluation...');
        const { createWorkingSession } = await getSupabaseClient();
        const session = await createWorkingSession(formState.customerId);

        if (session && session.id) {
          sessionId = session.id;
          setFormState(prev => ({ ...prev, sessionId: session.id }));
          console.log('✅ Session created for evaluation:', session.id);
        } else {
          console.warn('⚠️ Failed to create session, evaluation will proceed without session tracking');
        }
      }

      const { evaluatePrompt } = await getApiServices();
      const evaluation = await evaluatePrompt(formState, currentUser, addProgressMessage, sessionId);
      setFormState(prev => ({ ...prev, promptEvaluation: evaluation }));
      toast.success('Inputs evaluated successfully!');
      setShowEvaluationModal(true);
    } catch (error: any) {
      console.error('Error evaluating inputs:', error);
      toast.error(`Failed to evaluate inputs: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isEvaluating: false }));
      addProgressMessage('Input evaluation complete.');
    }
  };

  // Handle cancelling operations
  const handleCancelOperation = () => {
    const isGenerating = formState.isLoading;
    const isEvaluating = formState.isEvaluating;
    
    const operationType = isGenerating ? 'copy generation' : 'input evaluation';
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to cancel the ${operationType}?`)) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        isEvaluating: false,
        generationProgress: [...prev.generationProgress, `${operationType} cancelled by user.`]
      }));
      toast.success(`${operationType.charAt(0).toUpperCase() + operationType.slice(1)} cancelled`);
    }
  };

  // Handle save template
  const handleSaveTemplate = async (templateName: string, description: string, formStateToSave: FormState, forceSaveAsNew?: boolean, category?: string, existingTemplateId?: string) => {
    console.log('🎯 HANDLE SAVE TEMPLATE CALLED');
    console.log('Template name:', templateName);
    console.log('Force save as new:', forceSaveAsNew);
    console.log('Existing template ID from dropdown:', existingTemplateId);
    console.log('Loaded template ID from state:', loadedTemplateId);
    console.log('Form state public fields:', {
      is_public: formStateToSave.is_public
    });
    
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save templates.');
      return;
    }

    // Skip template saving in demo mode
    if (isDemoMode) {
      toast.error('Template saving is not available in demo mode. Please configure Supabase to save templates.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving template...');

    try {
      const templateData = {
        user_id: currentUser.id,
        template_name: templateName,
        description: description,
        language: formStateToSave.language,
        tone: formStateToSave.tone,
        word_count: formStateToSave.wordCount,
        custom_word_count: formStateToSave.customWordCount,
        target_audience: formStateToSave.targetAudience,
        key_message: formStateToSave.keyMessage,
        desired_emotion: formStateToSave.desiredEmotion,
        call_to_action: formStateToSave.callToAction,
        brand_values: formStateToSave.brandValues,
        keywords: formStateToSave.keywords,
        context: formStateToSave.context,
        special_instructions: formStateToSave.specialInstructions,
        brief_description: formStateToSave.briefDescription,
        page_type: formStateToSave.pageType,
        section: formStateToSave.section,
        business_description: formStateToSave.businessDescription,
        original_copy: formStateToSave.originalCopy,
        template_type: formStateToSave.tab,
        competitor_urls: formStateToSave.competitorUrls,
        output_structure: formStateToSave.outputStructure,
        product_service_name: formStateToSave.productServiceName,
        industry_niche: formStateToSave.industryNiche,
        tone_level: formStateToSave.toneLevel,
        reader_funnel_stage: formStateToSave.readerFunnelStage,
        competitor_copy_text: formStateToSave.competitorCopyText,
        target_audience_pain_points: formStateToSave.targetAudiencePainPoints,
        preferred_writing_style: formStateToSave.preferredWritingStyle,
        language_style_constraints: formStateToSave.languageStyleConstraints,
        excluded_terms: formStateToSave.excludedTerms,
        generateHeadlines: formStateToSave.generateHeadlines,
        generateScores: formStateToSave.generateScores,
        generateSeoMetadata: formStateToSave.generateSeoMetadata,
        generateGeoScore: formStateToSave.generateGeoScore,
        selectedPersona: formStateToSave.selectedPersona,
        numberOfHeadlines: formStateToSave.numberOfHeadlines,
        forceElaborationsExamples: formStateToSave.forceElaborationsExamples,
        prioritizeWordCount: formStateToSave.prioritizeWordCount,
        adhereToLittleWordCount: formStateToSave.adhereToLittleWordCount,
        littleWordCountTolerancePercentage: formStateToSave.littleWordCountTolerancePercentage,
        wordCountTolerancePercentage: formStateToSave.wordCountTolerancePercentage,
        enhanceForGEO: formStateToSave.enhanceForGEO,
        addTldrSummary: formStateToSave.addTldrSummary,
        location: formStateToSave.location,
        geoRegions: formStateToSave.geoRegions,
        sectionBreakdown: formStateToSave.sectionBreakdown,
        numUrlSlugs: formStateToSave.numUrlSlugs,
        numMetaDescriptions: formStateToSave.numMetaDescriptions,
        numH1Variants: formStateToSave.numH1Variants,
        numH2Variants: formStateToSave.numH2Variants,
        numH3Variants: formStateToSave.numH3Variants,
        numOgTitles: formStateToSave.numOgTitles,
        numOgDescriptions: formStateToSave.numOgDescriptions,
        project_description: formStateToSave.projectDescription,
        includeSectionTitles: formStateToSave.includeSectionTitles,
        // Public template fields from formStateToSave
        is_public: formStateToSave.is_public,
        category: category, // Add the category parameter
        // Customer and Brand Voice associations
        customerId: formStateToSave.customerId,
        brandVoiceId: formStateToSave.brandVoiceId,
      };

      console.log('💾 Template save - Customer & Brand Voice:', {
        customerId: formStateToSave.customerId,
        brandVoiceId: formStateToSave.brandVoiceId,
        hasCustomer: !!formStateToSave.customerId,
        hasBrandVoice: !!formStateToSave.brandVoiceId
      });

      // Priority order for determining which template to update:
      // 1. If forceSaveAsNew is true, create new template (undefined)
      // 2. If existingTemplateId provided from dropdown, use it
      // 3. Otherwise, use loadedTemplateId from state
      const templateIdToUse = forceSaveAsNew
        ? undefined
        : (existingTemplateId || loadedTemplateId || undefined);

      console.log('📝 Template ID to use for save:', templateIdToUse);
      const { saveTemplate } = await getSupabaseClient();
      const { error, updated, id } = await saveTemplate(templateData, templateIdToUse);

      if (error) throw error;

      if (updated) {
        toast.success('Template updated successfully!');
        addProgressMessage('Template updated.');
        // Update the loaded template info to reflect changes
        setLoadedTemplateName(templateName);
        setLoadedTemplateCategory(category || 'Uncategorized');
      } else {
        toast.success('Template saved successfully!');
        addProgressMessage('Template saved.');
        setLoadedTemplateId(id || null);
        setLoadedTemplateName(templateName);
        setLoadedTemplateCategory(category || 'Uncategorized');
      }
      setIsSaveTemplateModalOpen(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle save output
  const handleSaveOutput = async () => {
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to save outputs.');
      return;
    }
    
    // Skip output saving in demo mode
    if (isDemoMode) {
      toast.error('Output saving is not available in demo mode. Please configure Supabase to save outputs.');
      return;
    }
    
    if (!formState.copyResult || !formState.copyResult.generatedVersions || formState.copyResult.generatedVersions.length === 0) {
      toast.error('No content to save.');
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));
    addProgressMessage('Saving output...');

    try {
      const savedOutput = {
        user_id: currentUser.id,
        title: formState.projectDescription || formState.productServiceName || 'Untitled Output',
        description: null,
        input_data: formState,
        output_data: formState.copyResult,
        tags: [],
      };

      const { saveSavedOutput } = await getSupabaseClient();
      const { data, error } = await saveSavedOutput(savedOutput);

      if (error) throw error;

      toast.success('Output saved successfully!');
      addProgressMessage('Output saved to dashboard.');
    } catch (error: any) {
      console.error('Error saving output:', error);
      toast.error(`Failed to save output: ${error.message}`);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle copying evaluation suggestions
  const handleCopyEvaluation = () => {
    if (!formState.promptEvaluation) return;
    
    let copyText = `Input Evaluation Results\n\n`;
    copyText += `Quality Score: ${formState.promptEvaluation.score}/100\n\n`;
    
    if (formState.promptEvaluation.tips && formState.promptEvaluation.tips.length > 0) {
      copyText += `Improvement Suggestions:\n`;
      formState.promptEvaluation.tips.forEach((tip, index) => {
        copyText += `${index + 1}. ${tip}\n`;
      });
    }
    
    navigator.clipboard.writeText(copyText);
    setEvaluationCopied(true);
    setTimeout(() => setEvaluationCopied(false), 2000);
    toast.success('Evaluation copied to clipboard!');
  };

  // Handle applying template JSON to form
  const handleApplyTemplateToForm = (templateData: Partial<FormState>) => {
    // Clear all inputs first
    handleClearAllOverride();

    // Filter out undefined, null, and empty string values to prevent overwriting valid form state
    const filteredTemplateData: Partial<FormState> = {};
    Object.entries(templateData).forEach(([key, value]) => {
      // Only include values that are not undefined, null, or empty strings
      if (value !== undefined && value !== null && value !== '') {
        filteredTemplateData[key as keyof FormState] = value;
      }
    });

    setFormState(prevState => ({
      ...prevState,
      ...filteredTemplateData,
      // Reset runtime states to provide clean state after applying template
      isLoading: false,
      isEvaluating: false,
      generationProgress: [],
      copyResult: null,
      promptEvaluation: null,
      sessionId: undefined // Session will be created during generation, not during template application
    }));
    toast.success('Template applied to form successfully!');
  };

  // Determine if we should show the main menu
  const shouldShowMainMenu = () => {
    const hiddenPaths = ['/', '/login'];
    const isHelpPath = location.pathname.startsWith('/help');
    return !hiddenPaths.includes(location.pathname) && !isHelpPath;
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <svg className="w-12 h-12 mb-4 animate-spin" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spinnerGradientAppInit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="100%" stopColor="#ffa07a" />
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="20" fill="none" stroke="url(#spinnerGradientAppInit)" strokeWidth="4" strokeLinecap="round" strokeDasharray="90, 150" />
          </svg>
          <p className="text-gray-700 dark:text-gray-300">
            {initError || "Initializing application..."}
          </p>
          {initError && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Reload Application
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Global Main Menu - Show on all pages except homepage, login, and beta-thanks */}
      {shouldShowMainMenu() && currentUser && (
        <MainMenu
          onLogout={handleEnhancedLogout}
          onOpenTemplateSuggestion={() => setIsTemplateSuggestionModalOpen(true)}
          onOpenStartHub={handleForceOpenStartHub}
        />
      )}
      
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? <Navigate to={getLastRoute()} replace /> : <HomePage />
          }
        />
        <Route
          path="/login"
          element={
            currentUser ? <Navigate to={getLastRoute()} replace /> : <Login onLogin={handleLogin} onLoginSuccess={() => {
              // Trigger Start Hub after successful login with a delay to ensure navigation completes
              setTimeout(() => handleOpenStartHub(), 500);
            }} />
          }
        />
        <Route
          path="/create-account"
          element={
            currentUser ? <Navigate to={getLastRoute()} replace /> : <CreateAccount onLogin={handleLogin} onLoginSuccess={() => {
              // Trigger Start Hub after successful account creation with a delay to ensure navigation completes
              setTimeout(() => handleOpenStartHub(), 500);
            }} />
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <Dashboard
                    userId={currentUser.id}
                    isDemoMode={isDemoMode}
                    isSupabaseEnabled={isSupabaseEnabled}
                  />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/copy-maker"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <CopyMakerTab
                    currentUser={currentUser}
                    formState={formState}
                    setFormState={setFormState}
                    onClearAll={handleClearAllOverride}
                    loadedTemplateId={loadedTemplateId}
                    setLoadedTemplateId={setLoadedTemplateId}
                    loadedTemplateName={loadedTemplateName}
                    setLoadedTemplateName={setLoadedTemplateName}
                    loadedTemplateCategory={loadedTemplateCategory}
                    setLoadedTemplateCategory={setLoadedTemplateCategory}
                    onEvaluateInputs={handleEvaluateInputs}
                    onSaveTemplate={() => setIsSaveTemplateModalOpen(true)}
                    onSaveOutput={handleSaveOutput}
                    onViewPrompts={handleViewPrompts}
                    onCancel={handleCancelOperation}
                    loadFormStateFromPrefill={loadFormStateFromPrefill}
                    loadFormStateFromTemplate={loadFormStateFromTemplate}
                    addProgressMessage={addProgressMessage}
                    onOpenTemplateSuggestion={() => setIsTemplateSuggestionModalOpen(true)}
                    startHubTrigger={startHubTrigger}
                    forceStartHubTrigger={forceStartHubTrigger}
                  />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/copy-snap"
          element={
            currentUser ? (
              <AdminRoute currentUser={currentUser} fallbackPath="/copy-maker">
                <Suspense fallback={<AppSpinner />}>
                  <CopySnap currentUser={currentUser} />
                </Suspense>
              </AdminRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/quick-polish"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <QuickPolishPage />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/privacy" element={<Privacy />} />

        {/* Videos - Public */}
        <Route path="/videos" element={<Suspense fallback={<AppSpinner />}><VideosPage /></Suspense>} />

        {/* Blog Routes - Public */}
        <Route path="/blog" element={<Suspense fallback={<AppSpinner />}><BlogList /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<AppSpinner />}><BlogPost /></Suspense>} />

        {/* Blog Routes - Admin Only */}
        <Route
          path="/admin/blog"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <AdminBlogDashboard />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/blog/:id"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <AdminBlogEditor />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Diagnostics - Admin Only */}
        <Route
          path="/admin/diagnostics"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <AdminDiagnostics />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Help Center Routes - React components for in-app help */}
        <Route path="/help" element={<Suspense fallback={<AppSpinner />}><HelpCenter /></Suspense>} />
        <Route path="/help/getting-started" element={<Suspense fallback={<AppSpinner />}><GettingStarted /></Suspense>} />
        <Route path="/help/copy-maker" element={<Suspense fallback={<AppSpinner />}><CopyMakerIndex /></Suspense>} />
        <Route path="/help/core-workflows" element={<Suspense fallback={<AppSpinner />}><CoreWorkflows /></Suspense>} />
        <Route path="/help/how-scoring-works" element={<Suspense fallback={<AppSpinner />}><HowScoringWorks /></Suspense>} />
        <Route path="/help/setup-and-inputs" element={<Suspense fallback={<AppSpinner />}><SetupAndInputs /></Suspense>} />
        <Route path="/help/optional-features" element={<Suspense fallback={<AppSpinner />}><OptionalFeatures /></Suspense>} />
        <Route path="/help/voice-styles-and-blending" element={<Suspense fallback={<AppSpinner />}><VoiceStylesAndBlending /></Suspense>} />
        <Route path="/help/export-and-file-management" element={<Suspense fallback={<AppSpinner />}><ExportAndFileManagement /></Suspense>} />
        <Route path="/help/export-management" element={<Suspense fallback={<AppSpinner />}><ExportAndFileManagement /></Suspense>} />
        <Route path="/help/recommended-settings" element={<Suspense fallback={<AppSpinner />}><RecommendedSettings /></Suspense>} />
        <Route path="/help/troubleshooting-faqs" element={<Suspense fallback={<AppSpinner />}><TroubleshootingFAQs /></Suspense>} />
        <Route path="/help/troubleshooting" element={<Suspense fallback={<AppSpinner />}><TroubleshootingFAQs /></Suspense>} />
        <Route path="/help/glossary" element={<Suspense fallback={<AppSpinner />}><Glossary /></Suspense>} />
        <Route path="/help/contact" element={<Suspense fallback={<AppSpinner />}><Contact /></Suspense>} />
        <Route path="/help/real-case-workflows" element={<Suspense fallback={<AppSpinner />}><RealCaseWorkflowsIndex /></Suspense>} />
        <Route path="/help/real-case-workflows/quick-wizard-new-copy" element={<Suspense fallback={<AppSpinner />}><QuickWizardNewCopy /></Suspense>} />
        <Route path="/help/credits-and-billing" element={<Suspense fallback={<AppSpinner />}><CreditsAndBilling /></Suspense>} />
        <Route path="/help/dashboard-and-history" element={<Suspense fallback={<AppSpinner />}><DashboardAndHistory /></Suspense>} />
        <Route path="/help/workflow-builder" element={<Suspense fallback={<AppSpinner />}><WorkflowBuilderHelp /></Suspense>} />

        {/* Help redirects — old routes → merged pages */}
        <Route path="/help/start-hub" element={<Navigate to="/help/getting-started" replace />} />
        <Route path="/help/quick-prompt-wizard" element={<Navigate to="/help/getting-started" replace />} />
        <Route path="/help/smart-vs-expert-mode" element={<Navigate to="/help/getting-started" replace />} />
        <Route path="/help/project-setup" element={<Navigate to="/help/setup-and-inputs" replace />} />
        <Route path="/help/brand-voice" element={<Navigate to="/help/setup-and-inputs" replace />} />
        <Route path="/help/templates-and-reuse" element={<Navigate to="/help/setup-and-inputs" replace />} />
        <Route path="/help/templates" element={<Navigate to="/help/setup-and-inputs" replace />} />
        <Route path="/help/output-features" element={<Navigate to="/help/how-scoring-works" replace />} />
        <Route path="/help/compare-blend" element={<Navigate to="/help/how-scoring-works" replace />} />
        <Route path="/help/feature-interactions" element={<Navigate to="/help/how-scoring-works" replace />} />
        <Route path="/help/workflows" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/workflows-examples" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/best-practices" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/tutorials" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/tutorials/create-first-output" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/tutorials/improve-from-url" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/tutorials/compare-and-select" element={<Navigate to="/help/core-workflows" replace />} />
        <Route path="/help/tutorials/improve-existing-copy-from-website" element={<Navigate to="/help/core-workflows" replace />} />

        <Route
          path="/manage-users"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <ManageUsers />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage-prefills"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <ManagePrefills />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage-special-instructions"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <ManageSpecialInstructions />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage-customers"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <ManageCustomers />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage-customers/:customerId"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <CustomerDetail />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage-workflows"
          element={
            currentUser ? (
              <AuthenticatedRoute>
                <Suspense fallback={<AppSpinner />}>
                  <ManageWorkflows />
                </Suspense>
              </AuthenticatedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Prompt Display Modal - available across all routes */}
      {showPromptModal && (
        <Suspense fallback={<AppSpinner />}>
          <PromptDisplay
            systemPrompt={systemPrompt}
            userPrompt={userPrompt}
            onClose={() => setShowPromptModal(false)}
          />
        </Suspense>
      )}

      {/* Save Template Modal - available across all routes */}
      {isSaveTemplateModalOpen && (
        <Suspense fallback={<AppSpinner />}>
          <SaveTemplateModal
            isOpen={isSaveTemplateModalOpen}
            onClose={() => setIsSaveTemplateModalOpen(false)}
            onSave={handleSaveTemplate}
            onSaveSuccess={() => {
              // Trigger Start Hub after saving template
              handleOpenStartHub();
            }}
            initialTemplateName={loadedTemplateName || formState.briefDescription || ''}
            initialDescription={formState.briefDescription || ''}
            initialCategory={loadedTemplateCategory}
            formStateToSave={formState}
          />
        </Suspense>
      )}

      {/* Template Suggestion Modal - available across all routes */}
      {isTemplateSuggestionModalOpen && (
        <Suspense fallback={<AppSpinner />}>
          <TemplateSuggestionModal
            isOpen={isTemplateSuggestionModalOpen}
            onClose={() => setIsTemplateSuggestionModalOpen(false)}
            currentUser={currentUser}
            onApplyToForm={handleApplyTemplateToForm}
            selectedModel={formState.model}
            sessionId={formState.sessionId}
          />
        </Suspense>
      )}

      {/* Start Hub Modal - available across all routes */}
      {currentUser && (
        <Suspense fallback={null}>
          <StartHubModal
            isOpen={isStartHubOpen}
            onClose={() => setIsStartHubOpen(false)}
            onSelect={handleStartHubSelect}
            onDismissPermanently={() => setIsStartHubOpen(false)}
            templates={templates}
            isLoadingTemplates={isLoadingTemplates}
            onSelectTemplate={handleStartHubTemplateSelect}
            currentUserId={currentUser.id}
            onPreferenceChange={(shouldShow) => {
              // Preference change handled by StartHubModal internally
            }}
          />
        </Suspense>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toastify-color-light)',
            color: 'var(--toastify-text-color-light)',
          },
        }}
      />

      <GuidanceHintHost />

      {/* Evaluation Results Modal */}
      {showEvaluationModal && formState.promptEvaluation && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Input Evaluation Results</h3>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-auto p-0">
              <Suspense fallback={<AppSpinner />}>
                <PromptEvaluation
                  evaluation={formState.promptEvaluation}
                  isLoading={formState.isEvaluating || false}
                />
              </Suspense>
            </div>

            <div className="p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
              <button
                onClick={handleCopyEvaluation}
                className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm mr-2 flex items-center"
              >
                {evaluationCopied ? (
                  <>
                    <Check size={16} className="mr-1.5 text-green-500 dark:text-green-400" />
                    <span className="text-green-500 dark:text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1.5" />
                    Copy Suggestions
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default AppRouter;